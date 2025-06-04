
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { Printer, ArrowLeft } from 'lucide-react';

const Receipt = () => {
  const navigate = useNavigate();
  const { currentSale } = useStore();

  if (!currentSale) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">No receipt to display</h2>
        <button
          onClick={() => navigate('/checkout')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Checkout
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Print Controls */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate('/checkout')}
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

      {/* Receipt */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 print:shadow-none print:border-none">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">POS System</h1>
          <p className="text-gray-600">Sales Receipt</p>
          <div className="border-b border-dashed border-gray-300 my-4"></div>
        </div>

        <div className="space-y-1 mb-6">
          <div className="flex justify-between text-sm">
            <span>Receipt #:</span>
            <span className="font-mono">{currentSale.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Date:</span>
            <span>{format(currentSale.timestamp, 'MM/dd/yyyy')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Time:</span>
            <span>{format(currentSale.timestamp, 'hh:mm:ss a')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Cashier:</span>
            <span>{currentSale.cashier}</span>
          </div>
        </div>

        <div className="border-b border-dashed border-gray-300 my-4"></div>

        {/* Items */}
        <div className="space-y-2 mb-6">
          {currentSale.items.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between">
                <span className="font-medium">{item.productName}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{item.quantity} × ${item.price.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-b border-dashed border-gray-300 my-4"></div>

        {/* Totals */}
        <div className="space-y-1 mb-6">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${currentSale.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>${currentSale.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span>${currentSale.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="border-b border-dashed border-gray-300 my-4"></div>

        <div className="text-center text-sm text-gray-600">
          <p>Thank you for your business!</p>
          <p className="mt-2">Returns accepted within 30 days</p>
          <p>with receipt</p>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
