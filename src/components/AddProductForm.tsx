
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useStore } from '../store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card } from '@/components/ui/card';
import { Package, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
 import { toast } from '@/components/ui/sonner';

const schema = yup.object({
  name: yup.string().required('Product name is required').min(2, 'Name must be at least 2 characters'),
  stock: yup.number().required('Stock is required').min(0, 'Stock must be 0 or greater').integer('Stock must be a whole number'),
  category: yup.string().required('Category is required'),
});

type FormData = {
  name: string;
  stock: number;
  category: string;
};

interface AddProductFormProps {
  onClose: () => void;
}

const AddProductForm = ({ onClose }: AddProductFormProps) => {
  const { addProduct } = useStore();
  
  const form = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      stock: 0,
      category: '',
    },
  });

  const onSubmit = async (data: FormData) => {
  try {
    const { error } = await supabase.from('products').insert([
      {
        name: data.name,
        category: data.category,
        stock: data.stock,
      }
    ]);

   if (error) {
  console.error('Supabase error:', error.message, error.details);
  throw error;
}

    form.reset();
   
    toast.success('Product added successfully!');
    onClose();
  } catch (err) {
    console.error('Error adding product:', err);
   
    toast.error('Failed to add product.');
  }
};


  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Package className="text-blue-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">Add New Product</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X size={18} />
        </Button>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter product name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="Enter category" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Stock</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter stock quantity" 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex space-x-3">
            <Button type="submit" className="flex-1">
              Add Product
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
};

export default AddProductForm;
