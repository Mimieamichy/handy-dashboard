
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
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';


const schema = yup.object({
  full_name: yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  email: yup.string().required('Email is required').email('Email is invalid'), // <-- add this
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
});


type FormData = {
  full_name: string;
  email: string; // Optional field for email
  password: string;
};

const AddCashierForm = () => {
  
  
 const form = useForm<FormData>({
  resolver: yupResolver(schema),
  defaultValues: {
    full_name: '',
    email: '', // <-- Add this
    password: '',
  },
});


  const onSubmit = async (data: FormData) => {
  try {
    // 1. Sign up cashier using Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (signUpError) {
      toast.error(signUpError.message);
      return;
    }

    const user = signUpData.user;

    if (!user) {
      toast.error('Failed to create user.');
      return;
    }

    // 2. Optional: Insert into 'profiles' table
    const { error: insertError } = await supabase.from('profiles').insert([
      {
        id: user.id,        // user UUID from Supabase Auth
        name: data.full_name,
        email: data.email,
        created_at: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      toast.error('User created but failed to save cashier info.');
      return;
    }

    toast.success('Cashier added successfully!');
    form.reset();

  } catch (err: any) {
    console.error(err);
    toast.error('Something went wrong.');
  }
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
            name="full_name"
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cashier Email</FormLabel>
                <FormControl>
                  <Input placeholder="Enter cashier email" {...field} />
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
