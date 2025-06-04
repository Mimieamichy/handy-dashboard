
import React from 'react';
import { useStore } from '../store/useStore';
import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { format } from 'date-fns';

const CashierList = () => {
  const { cashiers } = useStore();

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Users className="text-green-600" size={24} />
        <h3 className="text-lg font-semibold text-gray-900">Cashier List</h3>
      </div>
      
      <div className="space-y-3">
        {cashiers.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No cashiers added yet.</p>
        ) : (
          cashiers.map((cashier) => (
            <div key={cashier.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{cashier.name}</p>
                <p className="text-sm text-gray-600">
                  Added: {format(cashier.createdAt, 'MMM dd, yyyy')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">ID: {cashier.id}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default CashierList;
