
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Catalog from "./pages/Catalog";
import Checkout from "./pages/Checkout";
import Receipt from "./pages/Receipt";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {

return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/catalog" replace />} />
              <Route path="catalog" element={<Catalog />} />
              <Route path="checkout" element={<ProtectedRoute requiredRole="cashier"><Checkout /></ProtectedRoute>} />
              <Route path="receipt" element={<ProtectedRoute requiredRole="cashier"><Receipt /></ProtectedRoute>} />
              <Route path="admin" element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>)
};

export default App;
