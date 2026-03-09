import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CreditCard, Banknote, Wallet, Check } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, cartTotal, walletBalance, createOrder } = useApp();
  const [paymentMode, setPaymentMode] = useState("online");
  const bookingInfo = (location.state as { address?: string; date?: string; time?: string }) || {};

  const [paying, setPaying] = useState(false);
  const handlePay = async () => {
    setPaying(true);
    const orderId = await createOrder({
      services: cart,
      date: bookingInfo.date || new Date().toISOString().split("T")[0],
      timeSlot: bookingInfo.time || "10:00 AM",
      address: bookingInfo.address || "",
      paymentMode,
      status: "booked",
      total: cartTotal,
    });
    setPaying(false);
    if (orderId) navigate("/order-confirmation", { state: { orderId } });
  };

  const modes = [
    { id: "online", label: "Online Payment", desc: "Pay securely via Razorpay", icon: CreditCard },
    { id: "cod", label: "Cash on Delivery", desc: "Pay when service is done", icon: Banknote },
    { id: "wallet", label: "Wallet Payment", desc: `Balance: ₹${walletBalance}`, icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-display font-bold text-foreground">Payment</h1>
      </div>

      <div className="px-4 space-y-4">
        {/* Order Summary */}
        <div className="bg-card rounded-xl p-4 shadow-card">
          <h2 className="font-display font-bold text-foreground mb-3">Order Summary</h2>
          {cart.map(({ service, quantity }) => (
            <div key={service.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <span className="text-sm text-foreground">{service.name}</span>
                <span className="text-xs text-muted-foreground ml-2">x{quantity}</span>
              </div>
              <span className="text-sm font-semibold text-foreground">₹{service.price * quantity}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 mt-1">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-lg font-bold text-foreground">₹{cartTotal}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <h2 className="font-display font-bold text-foreground">Payment Method</h2>
        <div className="space-y-3">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setPaymentMode(m.id)}
              disabled={m.id === "wallet" && walletBalance < cartTotal}
              className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 text-left transition-all disabled:opacity-40 ${
                paymentMode === m.id ? "border-primary bg-accent" : "border-border bg-card"
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMode === m.id ? "gradient-primary" : "bg-muted"}`}>
                <m.icon className={`w-5 h-5 ${paymentMode === m.id ? "text-primary-foreground" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold text-foreground">{m.label}</span>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
              {paymentMode === m.id && <Check className="w-5 h-5 text-primary" />}
            </button>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-50">
        <button onClick={handlePay} disabled={paying} className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-salon disabled:opacity-50">
          {paying ? "Booking..." : `Pay ₹${cartTotal}`}
        </button>
      </div>
    </div>
  );
};

export default Payment;
