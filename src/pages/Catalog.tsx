import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Search, Package, Plus } from 'lucide-react';
import AddProductForm from '../components/AddProductForm';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@supabase/auth-helpers-react';
import { toast } from '@/components/ui/sonner';

const Catalog = () => {

const session = useSession();
const { addToCart } = useStore();
const [userRole, setUserRole] = useState<string | null>(null);



  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
  const fetchUserRole = async () => {
    if (!session?.user?.id) return;

    const { data, error } = await supabase
      .from('profiles') // 🔁 adjust table name if needed
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
    } else {
      setUserRole(data.role);
    }
  };

  fetchUserRole();
}, [session]);


  // ✅ Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (error) {
        console.error('Failed to fetch products:', error);
      } else {
        setProducts(data);
      }
    };
    fetchProducts();
  }, [showAddForm]); // refetch when modal closes (after add)

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: 'text-red-600 bg-red-50', label: 'Out of Stock' };
    if (stock < 10) return { color: 'text-yellow-600 bg-yellow-50', label: 'Low Stock' };
    return { color: 'text-green-600 bg-green-50', label: 'In Stock' };
  };

  const handleAddToCart = (product: any) => {
    addToCart({
      productId: product.id,
      productName: product.name,
      price: 0,
      quantity: 1,
    }); 
    toast.success(`${product.name} added to cart!`, {
      duration: 3000,
      position: 'top-right',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
          <p className="text-gray-600">Browse and manage your inventory</p>
        </div>
        {userRole === 'admin' && (
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 sm:mt-0 flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <div className="mb-6">
          <AddProductForm onClose={() => setShowAddForm(false)} />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => {
          const stockStatus = getStockStatus(product.stock);
          return (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 capitalize">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                  <Package className="text-gray-400" size={20} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Stock:</span>
                    <span className="text-lg font-bold text-gray-900">{product.stock}</span>
                  </div>

                  {userRole === 'cashier' && product.min_selling_price && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Min Price:</span>
                      <span className="text-sm font-semibold text-green-600">#{product.min_selling_price.toFixed(2)}</span>
                    </div>
                  )}

                  {userRole === 'admin' && (
                    <div className="space-y-2">
                      {product.purchase_price && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Purchase Price:</span>
                          <span className="text-sm text-gray-600">#{product.purchase_price.toFixed(2)}</span>
                        </div>
                      )}
                      {product.min_selling_price && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Min Selling Price:</span>
                          <span className="text-sm font-semibold text-green-600">#{product.min_selling_price.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                    {stockStatus.label}
                  </div>
                </div>

                {userRole === 'cashier' && product.stock > 0 && (
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Add to Cart
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
};

export default Catalog;
