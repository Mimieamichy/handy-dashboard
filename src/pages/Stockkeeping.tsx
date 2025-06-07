
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Package, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { format } from 'date-fns';

interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  purchase_price?: number;
  min_selling_price?: number;
  last_purchase_date?: string;
  last_purchase_quantity?: number;
}

interface PurchaseHistory {
  id: string;
  product_id: string;
  purchase_date: string;
  quantity_purchased: number;
  purchase_price_per_unit: number;
  total_purchase_cost: number;
  min_selling_price: number;
  products: { name: string };
}

const Stockkeeping = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [formData, setFormData] = useState({
    quantity: '',
    purchasePrice: '',
    minSellingPrice: '',
    purchaseDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchPurchaseHistory();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } else {
      setProducts(data || []);
    }
  };

  const fetchPurchaseHistory = async () => {
    const { data, error } = await supabase
      .from('purchase_history')
      .select('*, products(name)')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Error fetching purchase history:', error);
    } else {
      setPurchaseHistory(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !formData.quantity || !formData.purchasePrice || !formData.minSellingPrice) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const quantity = parseInt(formData.quantity);
      const purchasePrice = parseFloat(formData.purchasePrice);
      const minSellingPrice = parseFloat(formData.minSellingPrice);
      const totalCost = quantity * purchasePrice;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      // Insert purchase history record
      const { error: historyError } = await supabase
        .from('purchase_history')
        .insert({
          product_id: selectedProductId,
          purchase_date: formData.purchaseDate,
          quantity_purchased: quantity,
          purchase_price_per_unit: purchasePrice,
          total_purchase_cost: totalCost,
          min_selling_price: minSellingPrice,
          created_by: user.id,
        });

      if (historyError) throw historyError;

      // Get current product to update stock
      const { data: currentProduct, error: productError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', selectedProductId)
        .single();

      if (productError) throw productError;

      // Update product with new stock and purchase info
      const { error: updateError } = await supabase
        .from('products')
        .update({
          stock: currentProduct.stock + quantity,
          purchase_price: purchasePrice,
          min_selling_price: minSellingPrice,
          last_purchase_date: formData.purchaseDate,
          last_purchase_quantity: quantity,
        })
        .eq('id', selectedProductId);

      if (updateError) throw updateError;

      toast.success('Purchase recorded successfully!');
      
      // Reset form
      setFormData({
        quantity: '',
        purchasePrice: '',
        minSellingPrice: '',
        purchaseDate: format(new Date(), 'yyyy-MM-dd'),
      });
      setSelectedProductId('');

      // Refresh data
      fetchProducts();
      fetchPurchaseHistory();

    } catch (error) {
      console.error('Error recording purchase:', error);
      toast.error('Failed to record purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stockkeeping</h1>
        <p className="text-gray-600">Record new product purchases and manage inventory</p>
      </div>

      {/* Add Purchase Form */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Plus className="text-blue-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">Record New Purchase</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product">Product</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">Quantity Purchased</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Enter quantity"
                min="1"
                required
              />
            </div>

            <div>
              <Label htmlFor="purchasePrice">Purchase Price (per unit)</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                placeholder="0.00"
                min="0"
                required
              />
            </div>

            <div>
              <Label htmlFor="minSellingPrice">Minimum Selling Price</Label>
              <Input
                id="minSellingPrice"
                type="number"
                step="0.01"
                value={formData.minSellingPrice}
                onChange={(e) => setFormData({ ...formData, minSellingPrice: e.target.value })}
                placeholder="0.00"
                min="0"
                required
              />
            </div>

            <div>
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? 'Recording...' : 'Record Purchase'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Recent Purchase History */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <History className="text-green-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">Recent Purchase History</h3>
        </div>

        {purchaseHistory.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No purchase history found.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Min Selling Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseHistory.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">{purchase.products.name}</TableCell>
                    <TableCell>{format(new Date(purchase.purchase_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{purchase.quantity_purchased}</TableCell>
                    <TableCell>#{purchase.purchase_price_per_unit.toFixed(2)}</TableCell>
                    <TableCell>#{purchase.total_purchase_cost.toFixed(2)}</TableCell>
                    <TableCell>#{purchase.min_selling_price.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Stockkeeping;
