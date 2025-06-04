
import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useStore } from '../store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';

const schema = yup.object({
  name: yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
});

type FormData = {
  name: string;
  password: string;
};

const AddCashierForm = () => {
  const { addCashier } = useStore();
  
  const form = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      password: '',
    },
  });

  const onSubmit = (data: FormData) => {
    addCashier(data);
    form.reset();
    alert('Cashier added successfully!');
  };

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <UserPlus className="text-blue-600" size={24} />
        <h3 className="text-lg font-semibold text-gray-900">Add New Cashier</h3>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cashier Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter cashier name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full">
            Add Cashier
          </Button>
        </form>
      </Form>
    </Card>
  );
};

export default AddCashierForm;
