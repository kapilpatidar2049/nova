import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, CreditCard, Banknote, Wallet, Check } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

const ShopCheckout = () => {
  const navigate = useNavigate();
  const { shopCart, shopCartTotal, walletBalance, placeShopOrder, isLoggedIn } = useApp();
  const [address, setAddress] = useState("");
  const [paymentMode, setPaymentMode] = useState("online");
  const [paying, setPaying] = useState(false);

  if (!isLoggedIn) {
    navigate("/login");
    return null;
  }

  if (shopCart.length === 0) {
    navigate("/shop");
    return null;
  }

  const handlePay = async () => {
    if (address.trim().length < 5) return;
    setPaying(true);
    const orderId = await placeShopOrder(address.trim(), paymentMode, { processOnlinePayment: true });
    setPaying(false);
    if (orderId) {
      const label =
        paymentMode === "online"
          ? "Online Payment"
          : paymentMode === "cod"
            ? "Cash on Delivery"
            : "Wallet";
      navigate("/order-confirmation", { state: { orderId, paymentModeLabel: label, kind: "product" } });
    }
  };

  const modes = [
    { id: "online", label: "Online Payment", desc: "Pay securely via Razorpay", icon: CreditCard },
    { id: "cod", label: "Cash on Delivery", desc: "Pay when products arrive", icon: Banknote },
    { id: "wallet", label: "Wallet", desc: `Balance: ₹${walletBalance}`, icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-display font-bold text-foreground">Checkout</h1>
      </div>

      <div className="px-4 space-y-4">
        <div className="bg-card rounded-xl p-4 shadow-card">
          <h2 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" /> Delivery address
          </h2>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Full address for delivery"
            rows={3}
            className="w-full bg-background rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="bg-card rounded-xl p-4 shadow-card">
          <h2 className="font-display font-bold text-foreground mb-3">Order summary</h2>
          {shopCart.map(({ product, quantity }) => (
            <div key={product.id} className="flex justify-between py-2 border-b border-border last:border-0 text-sm">
              <span className="text-foreground">
                {product.name} ×{quantity}
              </span>
              <span className="font-semibold">₹{product.price * quantity}</span>
            </div>
          ))}
          <div className="flex justify-between pt-3 mt-1 font-bold text-foreground">
            <span>Total</span>
            <span>₹{shopCartTotal}</span>
          </div>
        </div>

        <h2 className="font-display font-bold text-foreground">Payment</h2>
        <div className="space-y-3">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setPaymentMode(m.id)}
              disabled={m.id === "wallet" && walletBalance < shopCartTotal}
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

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-50 max-w-lg mx-auto">
        <button
          onClick={handlePay}
          disabled={paying || address.trim().length < 5}
          className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-salon disabled:opacity-50"
        >
          {paying ? "Placing order…" : paymentMode === "cod" ? `Place order ₹${shopCartTotal}` : `Pay ₹${shopCartTotal}`}
        </button>
      </div>
    </div>
  );
};

export default ShopCheckout;
