import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
import EditProfile from "./pages/EditProfile";
import WalletPage from "./pages/WalletPage";
import MyAddresses from "./pages/MyAddresses";
import ChangePassword from "./pages/ChangePassword";
import DeleteAccount from "./pages/DeleteAccount";
import Wishlist from "./pages/Wishlist";
import Notifications from "./pages/Notifications";
import StaticPage from "./pages/StaticPage";
import NotFound from "./pages/NotFound";
import RateVisit from "./pages/RateVisit";
import BeauticianProfile from "./pages/BeauticianProfile";

const queryClient = new QueryClient();

function MandatoryRatingRedirect() {
  const location = useLocation();
  const { isLoggedIn, pendingRatingAppointmentId } = useApp();
  if (!isLoggedIn || !pendingRatingAppointmentId) return null;
  const path = location.pathname;
  /** Allow rating and beautician profile (order → expert tap) while pending */
  if (path.startsWith("/rate")) {
    const m = path.match(/^\/rate\/([^/]+)/);
    if (m && m[1] !== pendingRatingAppointmentId) {
      return <Navigate to={`/rate/${pendingRatingAppointmentId}`} replace />;
    }
    return null;
  }
  if (path.startsWith("/beautician/")) return null;
  if (path.startsWith("/orders") || path.startsWith("/order/")) return null;

  return <Navigate to={`/rate/${pendingRatingAppointmentId}`} replace />;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <div className="max-w-lg mx-auto min-h-screen bg-background relative">
              <MandatoryRatingRedirect />
              <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>}>
              <Routes>
              <Route path="/" element={<Splash />} />
              <Route path="/rate/:id" element={<RateVisit />} />
              <Route path="/beautician/:id" element={<BeauticianProfile />} />
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
              <Route path="/profile/edit" element={<EditProfile />} />
              <Route path="/profile/change-password" element={<ChangePassword />} />
              <Route path="/profile/delete-account" element={<DeleteAccount />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/addresses" element={<MyAddresses />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/privacy-policy" element={<StaticPage title="Privacy Policy" />} />
              <Route path="/terms-and-conditions" element={<StaticPage title="Terms and Conditions" />} />
              <Route path="/about" element={<StaticPage title="About Us" />} />
              <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </div>
          </HashRouter>
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
