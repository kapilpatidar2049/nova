import { useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBasket } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import BottomNav from "@/components/BottomNav";

const ShopCart = () => {
  const navigate = useNavigate();
  const { shopCart, updateShopQuantity, removeFromShopCart, shopCartTotal, isLoggedIn, gstPercent } = useApp();
  const gstAmount = Math.round((shopCartTotal * (gstPercent || 0)) / 100 * 100) / 100;
  const finalTotal = shopCartTotal + gstAmount;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pb-20 px-4">
        <p className="text-muted-foreground mb-4">Sign in to use the shop cart</p>
        <button onClick={() => navigate("/login")} className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold">
          Sign in
        </button>
        <BottomNav />
      </div>
    );
  }

  if (shopCart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pb-20">
        <ShoppingBasket className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-display font-bold text-foreground">Shop cart is empty</h2>
        <p className="text-sm text-muted-foreground mt-1">Browse the salon shop</p>
        <button onClick={() => navigate("/shop")} className="mt-6 gradient-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold shadow-salon">
          Browse products
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
        <h1 className="text-xl font-display font-bold text-foreground">Shop cart</h1>
      </div>

      <div className="px-4 space-y-3">
        {shopCart.map(({ product, quantity }) => (
          <div key={product.id} className="bg-card rounded-xl p-4 shadow-card flex gap-3">
            <img src={product.image} alt="" className="w-20 h-20 rounded-lg object-cover bg-muted" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground line-clamp-2">{product.name}</h3>
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm font-bold text-foreground">₹{product.price * quantity}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => removeFromShopCart(product.id)} className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                  <div className="flex items-center gap-1 bg-secondary rounded-full">
                    <button onClick={() => updateShopQuantity(product.id, quantity - 1)} className="w-7 h-7 flex items-center justify-center">
                      <Minus className="w-3 h-3 text-foreground" />
                    </button>
                    <span className="text-sm font-semibold text-foreground w-6 text-center">{quantity}</span>
                    <button
                      onClick={() => updateShopQuantity(product.id, quantity + 1)}
                      disabled={quantity >= product.inStock}
                      className="w-7 h-7 flex items-center justify-center disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3 text-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-card border-t border-border z-40">
        <div className="px-4 md:px-8 lg:px-12 xl:px-16 py-4">
          <div className="space-y-1 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-sm font-semibold text-foreground">₹{shopCartTotal}</span>
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
          <button
            onClick={() => navigate("/shop/checkout")}
            className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-salon md:text-lg md:py-4"
          >
            Delivery &amp; payment
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default ShopCart;
