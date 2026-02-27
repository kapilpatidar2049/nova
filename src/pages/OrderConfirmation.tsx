import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, CalendarDays, Clock, MapPin } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders } = useApp();
  const orderId = (location.state as any)?.orderId;
  const order = orders.find((o) => o.id === orderId);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="animate-fade-in text-center">
        <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-salon">
          <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground">Booking Confirmed!</h1>
        <p className="text-muted-foreground mt-2">Your beauty service has been booked</p>

        {order && (
          <div className="bg-card rounded-2xl p-5 shadow-card mt-8 text-left w-full max-w-sm">
            <div className="text-center mb-4">
              <span className="text-xs text-muted-foreground">Booking ID</span>
              <p className="text-lg font-bold text-primary">{order.id}</p>
            </div>
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">{order.date}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">{order.timeSlot}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">{order.address}</span>
              </div>
            </div>
            <div className="border-t border-border pt-3 mt-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payment: {order.paymentMode}</span>
              <span className="font-bold text-foreground">₹{order.total}</span>
            </div>
            {order.beautician && (
              <div className="border-t border-border pt-3 mt-3 flex items-center gap-3">
                <img src={order.beautician.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <span className="text-sm font-semibold text-foreground">{order.beautician.name}</span>
                  <p className="text-xs text-muted-foreground">Assigned Expert</p>
                </div>
              </div>
            )}
          </div>
        )}

        <button onClick={() => navigate("/orders")} className="mt-8 gradient-primary text-primary-foreground px-10 py-3.5 rounded-xl font-semibold shadow-salon">
          View My Orders
        </button>
        <button onClick={() => navigate("/")} className="mt-3 text-primary font-medium text-sm block mx-auto">
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default OrderConfirmation;
