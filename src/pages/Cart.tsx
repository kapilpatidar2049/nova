import { useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import BottomNav from "@/components/BottomNav";

const Cart = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, cartTotal, gstPercent } = useApp();
  const gstAmount = Math.round((cartTotal * (gstPercent || 0)) / 100 * 100) / 100;
  const finalTotal = cartTotal + gstAmount;

  if (cart.length === 0) {
    return (
// ... (keep the empty cart block the same)
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pb-20">
        <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-display font-bold text-foreground">Your cart is empty</h2>
        <p className="text-sm text-muted-foreground mt-1">Add services to get started</p>
        <button onClick={() => navigate("/home")} className="mt-6 gradient-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold shadow-salon">
          Browse Services
        </button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-36">
      <div className="px-4 md:px-0 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-display font-bold text-foreground">My Cart</h1>
      </div>

      <div className="px-4 md:px-0 space-y-3 md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-4 md:space-y-0">
        {cart.map(({ service, quantity }) => (
          <div key={service.id} className="bg-card rounded-xl p-4 shadow-card flex gap-3 animate-fade-in md:flex-col md:min-h-0">
            <img src={service.image} alt={service.name} className="w-20 h-20 rounded-lg object-cover" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">{service.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{service.duration}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm font-bold text-foreground">₹{service.price * quantity}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => removeFromCart(service.id)} className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                  <div className="flex items-center gap-1 bg-secondary rounded-full">
                    <button onClick={() => updateQuantity(service.id, quantity - 1)} className="w-7 h-7 flex items-center justify-center">
                      <Minus className="w-3 h-3 text-foreground" />
                    </button>
                    <span className="text-sm font-semibold text-foreground w-6 text-center">{quantity}</span>
                    <button onClick={() => updateQuantity(service.id, quantity + 1)} className="w-7 h-7 flex items-center justify-center">
                      <Plus className="w-3 h-3 text-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="fixed bottom-16 left-0 right-0 bg-card border-t border-border z-40">
        <div className="px-4 md:px-8 lg:px-12 xl:px-16 py-4">
        <div className="space-y-1 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="text-sm font-semibold text-foreground">₹{cartTotal}</span>
          </div>
          {gstAmount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">GST ({gstPercent}%)</span>
              <span className="text-sm font-semibold text-foreground">₹{gstAmount}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1 border-t border-border mt-1">
            <span className="font-bold text-foreground">Total</span>
            <span className="text-lg font-bold text-primary">₹{finalTotal}</span>
          </div>
        </div>
        <button onClick={() => navigate("/booking")} className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-salon md:text-lg md:py-4">
          Continue Booking
        </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Cart;
