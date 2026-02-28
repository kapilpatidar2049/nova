import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import Splash from "./pages/Splash";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SearchPage from "./pages/SearchPage";
import ServiceDetail from "./pages/ServiceDetail";
import Cart from "./pages/Cart";
import Booking from "./pages/Booking";
import Payment from "./pages/Payment";
import OrderConfirmation from "./pages/OrderConfirmation";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="max-w-lg mx-auto min-h-screen bg-background relative">
            <Routes>
              <Route path="/" element={<Splash />} />
              <Route path="/home" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/service/:id" element={<ServiceDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/order/:id" element={<OrderDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
