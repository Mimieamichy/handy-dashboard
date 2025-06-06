import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Download,
} from "lucide-react";
import AddCashierForm from "../components/AddCashierForm";
import CashierList from "../components/CashierList";
import { supabase } from "@/integrations/supabase/client";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import { toast } from "@/components/ui/sonner";

const Admin = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchTopProducts = async () => {
      const { data: saleItems, error } = await supabase
        .from("sale_items")
        .select("product_id, quantity, unit_price");

      if (error) {
        console.error("Failed to fetch sale items:", error);
        return;
      }

      // Aggregate sales and revenue per product_id
      const stats: Record<string, { sales: number; revenue: number }> = {};

      saleItems.forEach((item) => {
        if (!stats[item.product_id]) {
          stats[item.product_id] = { sales: 0, revenue: 0 };
        }
        stats[item.product_id].sales += item.quantity;
        stats[item.product_id].revenue += item.quantity * item.unit_price;
      });

      // Combine with product names
      const computed = Object.entries(stats).map(([productId, values]) => {
        const product = products.find((p) => p.id === productId);
        return {
          name: product?.name || "Unknown",
          sales: values.sales,
          revenue: parseFloat(values.revenue.toFixed(2)),
        };
      });

      // Sort by sales (or revenue if you prefer)
      computed.sort((a, b) => b.sales - a.sales);

      setTopProducts(computed);
    };

    fetchTopProducts();
  }, [products]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch products
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*");

      if (productError) {
        console.error("Error fetching products:", productError);
      } else {
        setProducts(productData);
      }

      // Fetch sales + sale_items + cashier profile
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .select(
          `
        *,
        sale_items (
          product_id,
          quantity,
          unit_price
        ),
        profiles (
          full_name
        )
      `
        )
        .order("created_at", { ascending: false });

      if (saleError) {
        console.error("Error fetching sales:", saleError);
      } else {
        const formattedSales = saleData.map((sale: any) => ({
          id: sale.id,
          items: sale.sale_items.map((item: any) => ({
            productId: item.product_id,
            price: item.unit_price,
            quantity: item.quantity,
          })),
          subtotal: sale.total_amount / 1.08,
          tax: sale.total_amount * 0.08,
          total: sale.total_amount,
          cashier: sale.profiles?.full_name,
          timestamp: new Date(sale.created_at),
        }));

        setSales(formattedSales);
      }
    };

    fetchData();
  }, []);

  // Calculate metrics
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = sales.length;
  const averageTransaction = totalSales / totalTransactions || 0;

  const lowStockProducts = products.filter((p) => p.stock < 10).length;

  // Sales by day (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const daySales = sales.filter(
      (sale) => sale.timestamp >= dayStart && sale.timestamp <= dayEnd
    );

    return {
      date: format(date, "MMM dd"),
      sales: daySales.reduce((sum, sale) => sum + sale.total, 0),
      transactions: daySales.length,
    };
  }).reverse();

  // Product categories performance
  const categoryData = products.reduce((acc, product) => {
    const existing = acc.find((item) => item.category === product.category);
    if (existing) {
      existing.count += 1;
      existing.stock += product.stock;
    } else {
      acc.push({
        category: product.category,
        count: 1,
        stock: product.stock,
      });
    }
    return acc;
  }, [] as { category: string; count: number; stock: number }[]);

  // Top selling products (mock data based on sales)

  const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

  const handleExport = async () => {
    try {
      const { data: sales, error } = await supabase.from("sales").select(`
    id,
    total_amount,
    created_at,
    user_id,
    sale_items (
      product_id,
      quantity,
      unit_price,
      products ( name )
    )
  `);

      if (error) {
        console.error("Error fetching sales:", error);
        return alert("Failed to fetch sales data.");
      }

      // Fetch all cashier profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name");

      const getCashierName = (user_id: string) =>
        profiles?.find((p) => p.id === user_id)?.full_name || "Unknown";

      const flattened = sales.flatMap((sale) =>
        sale.sale_items.map((item) => ({
          SaleID: sale.id,
          Product: item.products?.name || "Unknown",
          Quantity: item.quantity,
          UnitPrice: item.unit_price,
          Subtotal: (item.unit_price * item.quantity).toFixed(2),
          TotalSaleAmount: sale.total_amount.toFixed(2),
          Cashier: getCashierName(sale.user_id),
          Date: new Date(sale.created_at).toLocaleString(),
        }))
      );

      const csv = Papa.unparse(flattened);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `sales_export_${Date.now()}.csv`);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export data. Please try again.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">
            Sales analytics and inventory overview
          </p>
        </div>
        <button
          onClick={handleExport}
          className="mt-4 sm:mt-0 flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download size={18} />
          <span>Export Data</span>
        </button>
      </div>

      {/* Cashier Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AddCashierForm />
        <CashierList />
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">
                #{totalSales.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalTransactions}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <ShoppingCart className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Transaction</p>
              <p className="text-2xl font-bold text-gray-900">
                #{averageTransaction.toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-900">
                {lowStockProducts}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <Package className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sales Trend (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, "Sales"]} />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#3b82f6"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Product Categories */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Product Categories
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                label={({ category, percent }) =>
                  `${category} ${(percent * 100).toFixed(0)}%`
                }
              >
                {categoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Selling Products
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => [value, "Units Sold"]} />
              <Bar dataKey="sales" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Sales
          </h3>
          <div className="space-y-4">
            {sales
              .slice(10)
              .reverse()
              .map((sale) => (
                <div
                  key={sale.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">#{sale.id}</p>
                    <p className="text-sm text-gray-600">{sale.cashier}</p>
                    <p className="text-xs text-gray-500">
                      {format(sale.timestamp, "MMM dd, hh:mm a")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      #{sale.total.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {sale.items.length} items
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
