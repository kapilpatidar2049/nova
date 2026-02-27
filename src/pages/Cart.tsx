import { useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import BottomNav from "@/components/BottomNav";

const Cart = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, cartTotal } = useApp();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pb-20">
        <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-display font-bold text-foreground">Your cart is empty</h2>
        <p className="text-sm text-muted-foreground mt-1">Add services to get started</p>
        <button onClick={() => navigate("/")} className="mt-6 gradient-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold shadow-salon">
          Browse Services
        </button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-36">
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-display font-bold text-foreground">My Cart</h1>
      </div>

      <div className="px-4 space-y-3">
        {cart.map(({ service, quantity }) => (
          <div key={service.id} className="bg-card rounded-xl p-4 shadow-card flex gap-3 animate-fade-in">
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
      <div className="fixed bottom-16 left-0 right-0 bg-card border-t border-border p-4 z-40">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">Total ({cart.length} services)</span>
          <span className="text-lg font-bold text-foreground">₹{cartTotal}</span>
        </div>
        <button onClick={() => navigate("/booking")} className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-salon">
          Continue Booking
        </button>
      </div>
      <BottomNav />
    </div>
  );
};

export default Cart;
