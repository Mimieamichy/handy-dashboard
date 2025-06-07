import React, { useState,useEffect } from "react";
import { toast} from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { ShoppingCart, Plus, Trash, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client"; // adjust to your path
import { useSession } from "@supabase/auth-helpers-react"; // to get user ID

const schema = yup.object({
  price: yup
    .number()
    .positive("Price must be positive")
    .required("Price is required"),
  quantity: yup
    .number()
    .positive("Quantity must be positive")
    .integer("Quantity must be a whole number")
    .required("Quantity is required"),
});

const Checkout = () => {
  const [fetchedProducts, setFetchedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const sessions = useSession();
const [cashierName, setCashierName] = useState<string>('');

useEffect(() => {
  const fetchCashierName = async () => {
    if (!sessions?.user?.id) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', sessions.user.id)
      .single();

    if (error) {
      console.error('Failed to fetch cashier name:', error);
    } else {
      setCashierName(data.full_name || 'Unnamed Cashier');
    }
  };

  fetchCashierName();
}, [sessions]);


  const session = useSession();
  const user = session?.user;
  const fetchProducts = async () => {
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .gt("stock", 0); // get only products with stock > 0

    if (error) {
      console.error("Error fetching products:", error.message);
    } else {
      setFetchedProducts(data);
    }

    setLoadingProducts(false);
  };

  const navigate = useNavigate();
  const {
    products,
    cart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    completeSale,
    setCurrentSale,
    
  } = useStore();

  const [selectedProductId, setSelectedProductId] = useState("");
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { price: 0, quantity: 1 },
  });

  const onAddProduct = (data: { price: number; quantity: number }) => {
    if (!selectedProductId) return;

    const product = fetchedProducts.find((p) => p.id === selectedProductId); // <-- Use fetchedProducts

    if (!product) return;

    addToCart({
      productId: product.id,
      productName: product.name,
      price: data.price,
      quantity: data.quantity,
    });

    reset();
    setSelectedProductId("");
    setIsAddingProduct(false);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    updateCartItem(productId, { quantity: newQuantity });
  };

  const updatePrice = (productId: string, newPrice: number) => {
    if (newPrice >= 0) {
      updateCartItem(productId, { price: newPrice });
    }
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = subtotal;

  const validateCartPrices = async () => {
    for (const item of cart) {
      const { data: product, error } = await supabase
        .from("products")
        .select("min_selling_price, name")
        .eq("id", item.productId)
        .single();

      if (error) {
        console.error("Error fetching product:", error);
        toast.error("Error validating product prices. Please try again.");
        return false;
      }

      if (product.min_selling_price && item.price < product.min_selling_price) {
        toast.error(`${product.name} price (#${item.price.toFixed(2)}) is below minimum selling price (#${product.min_selling_price.toFixed(2)}). Please adjust the price.`);
        return false;
      }
    }
    return true;
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0 || !user) return;
    
    if (total === 0) {
      toast.error("Cannot complete sale with total amount of #0.");
      return;
    }

    // Validate all cart item prices against minimum selling prices
    const pricesValid = await validateCartPrices();
    if (!pricesValid) {
      return;
    }

    const saleData = {
      user_id: user.id,
      total_amount: total,
    };

    // 1. Insert into `sales`
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert(saleData)
      .select()
      .single();

    if (saleError || !sale) {
      console.error("Failed to create sale:", saleError);
      return;
    }

    // 2. Prepare sale_items
    const saleItems = cart.map((item) => ({
      sale_id: sale.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.price * item.quantity,
    }));

    // 3. Insert into sale_items
    const { error: itemsError } = await supabase
      .from("sale_items")
      .insert(saleItems);

    if (itemsError) {
      console.error("Failed to insert sale items:", itemsError);
      return;
    }

    // ✅ 4. Update product stock (here's the part you asked for)
    for (const item of cart) {
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.productId)
        .single();

      if (fetchError || !product) {
        console.error(
          `Failed to fetch stock for ${item.productId}:`,
          fetchError
        );
        continue;
      }

      const newStock = product.stock - item.quantity;

      const { error: updateError } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", item.productId);

      if (updateError) {
        console.error(
          `Failed to update stock for ${item.productId}:`,
          updateError
        );
      }
    }

    // 5. Local state update
    const saleRecord = {
      items: [...cart],
      subtotal,
      total,
      cashier: cashierName,
      timestamp: new Date(),
      id: sale.id,
    };

    completeSale(saleRecord);
    setCurrentSale(saleRecord);
    clearCart();
    navigate(`/receipt/${sale.id}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Product Selection */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Add Products
          </h2>

          {!isAddingProduct ? (
            <button
              onClick={() => {
                fetchProducts();
                setIsAddingProduct(true);
              }}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              <span>Add Product to Cart</span>
            </button>
          ) : (
            <form onSubmit={handleSubmit(onAddProduct)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    const product = fetchedProducts.find(p => p.id === e.target.value);
                    if (product && product.min_selling_price) {
                      setValue("price", product.min_selling_price);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a product</option>
                  {fetchedProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Stock: {product.stock}) 
                      {product.min_selling_price && ` - Min: #${product.min_selling_price.toFixed(2)}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (#)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("price")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                  {errors.price && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.price.message}
                    </p>
                  )}
                  {selectedProductId && (() => {
                    const product = fetchedProducts.find(p => p.id === selectedProductId);
                    return product?.min_selling_price && (
                      <p className="text-green-600 text-xs mt-1">
                        Min selling price: #{product.min_selling_price.toFixed(2)}
                      </p>
                    );
                  })()}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    {...register("quantity")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1"
                  />
                  {errors.quantity && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.quantity.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add to Cart
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingProduct(false);
                    reset();
                    setSelectedProductId("");
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Cart Items */}
        {cart.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Cart Items
            </h2>
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {item.productName}
                    </h3>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Price (#)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) =>
                            updatePrice(
                              item.productId,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Quantity
                        </label>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                            className="p-1 text-gray-500 hover:text-gray-700"
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(
                                item.productId,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                            className="p-1 text-gray-500 hover:text-gray-700"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-lg font-semibold">
                      #{(item.price * item.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="mt-2 text-red-500 hover:text-red-700"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-fit">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <ShoppingCart size={20} />
          <span>Order Summary</span>
        </h2>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Items:</span>
            <span className="font-medium">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total:</span>
            <span className="font-bold text-blue-600">#{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={handleCompleteSale}
            disabled={cart.length === 0}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Complete Sale
          </button>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear Cart
            </button>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <p>Cashier: {cashierName}</p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;