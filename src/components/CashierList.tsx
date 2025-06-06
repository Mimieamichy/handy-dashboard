import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface Cashier {
  id: string;
  full_name: string;
  created_at: string;
}

const CashierList = () => {
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCashiers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, created_at')
        .ilike('role', 'cashier') // ✅ case-insensitive

        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cashiers:', error);
      } else {
        setCashiers(data || []);
      }
      setLoading(false);
    };

    fetchCashiers();
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Users className="text-green-600" size={24} />
        <h3 className="text-lg font-semibold text-gray-900">Cashier List</h3>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-4">Loading...</p>
      ) : cashiers.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No cashiers found.</p>
      ) : (
        <div className="space-y-3">
          {cashiers.map((cashier) => (
            <div
              key={cashier.id}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">{cashier.full_name || 'Unnamed'}</p>
                <p className="text-sm text-gray-600">
                  Added: {format(new Date(cashier.created_at), 'MMM dd, yyyy')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">ID: {cashier.id}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default CashierList;
