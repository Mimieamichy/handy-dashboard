import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Printer, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Receipt = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sale, setSale] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchSale = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("sales")
        .select(
          `
          id,
          total_amount,
          created_at,
          user_id,
          sale_items (
            quantity,
            unit_price,
            product_id,
            products ( name )
          ),
          profiles (
            full_name
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error("Failed to fetch sale:", error);
      } else {
        setSale(data);
      }

      setLoading(false);
    };

    fetchSale();
  }, [id]);

  if (loading) {
    return <div className="text-center py-10">Loading receipt...</div>;
  }

  if (!sale) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          No receipt found
        </h2>
        <button
          onClick={() => navigate("/checkout")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Checkout
        </button>
      </div>
    );
  }

  const handlePrint = () => window.print();

  const subtotal = sale.total_amount;

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate("/checkout")}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back to Checkout</span>
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Printer size={18} />
          <span>Print Receipt</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 print:shadow-none print:border-none">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">DEL POS System</h1>
          <p className="text-gray-600">Sales Receipt</p>
          <div className="border-b border-dashed border-gray-300 my-4"></div>
        </div>

        <div className="space-y-1 mb-6">
          <div className="flex justify-between text-sm">
            <span>Receipt #:</span>
            <span className="font-mono">{sale.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Date:</span>
            <span>{format(new Date(sale.created_at), "MM/dd/yyyy")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Time:</span>
            <span>{format(new Date(sale.created_at), "hh:mm:ss a")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Cashier:</span>
            <span>{sale.profiles?.full_name || "Unknown"}</span>
          </div>
        </div>

        <div className="border-b border-dashed border-gray-300 my-4"></div>

        {/* Items */}
        <div className="space-y-2 mb-6">
          {sale.sale_items.map((item: any, idx: number) => (
            <div key={idx}>
              <div className="flex justify-between">
                <span className="font-medium">
                  {item.products?.name || "Unknown Product"}
                </span>
                <span>#{(item.unit_price * item.quantity).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  {item.quantity} × #{item.unit_price.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-b border-dashed border-gray-300 my-4"></div>

        {/* Totals */}
        <div className="space-y-1 mb-6">
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span>#{subtotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="border-b border-dashed border-gray-300 my-4"></div>

        <div className="text-center text-sm text-gray-600">
          <p>Thank you for your patronage!</p>
          
        </div>
      </div>
    </div>
  );
};

export default Receipt;
