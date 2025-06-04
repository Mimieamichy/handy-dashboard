
import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ShoppingCart, BarChart3, Package, Users, Settings } from 'lucide-react';

const Layout = () => {
  const location = useLocation();
  const { currentRole, setRole, cashierName, setCashierName } = useStore();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value as 'admin' | 'cashier');
  };

  const handleCashierNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCashierName(e.target.value);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">POS System</h1>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Role:</label>
                <select 
                  value={currentRole} 
                  onChange={handleRoleChange}
                  className="bg-slate-700 text-white px-3 py-1 rounded-md text-sm border border-slate-600"
                >
                  <option value="cashier">Cashier</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {currentRole === 'cashier' && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Cashier:</label>
                  <input
                    type="text"
                    value={cashierName}
                    onChange={handleCashierNameChange}
                    className="bg-slate-700 text-white px-3 py-1 rounded-md text-sm border border-slate-600"
                    placeholder="Enter name"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              to="/catalog"
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                isActive('/catalog')
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package size={18} />
              <span>Catalog</span>
            </Link>
            
            {currentRole === 'cashier' && (
              <Link
                to="/checkout"
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive('/checkout')
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ShoppingCart size={18} />
                <span>Checkout</span>
              </Link>
            )}
            
            {currentRole === 'admin' && (
              <Link
                to="/admin"
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive('/admin')
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 size={18} />
                <span>Dashboard</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
