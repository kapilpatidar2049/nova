import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Star, Clock, Heart, ShoppingBag, Check } from "lucide-react";
import { toast } from "sonner";
import type { Service } from "@/types";
import { useApp } from "@/contexts/AppContext";
import { customerApi, mapApiServiceToUi } from "@/lib/api";
import serviceHair from "@/assets/service-hair.png";

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart, toggleWishlist, wishlist } = useApp();
  const fromNavOnMount = location.state?.service as Service | undefined;
  const initialService =
    fromNavOnMount && id && String(fromNavOnMount.id) === String(id) ? fromNavOnMount : null;
  const [service, setService] = useState<Service | null>(initialService);
  const [loading, setLoading] = useState(!initialService);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const fromNav = location.state?.service as Service | undefined;
    if (fromNav && String(fromNav.id) === String(id)) {
      setService(fromNav);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await customerApi.getServiceById(id);
        if (!cancelled && res.success && res.data) {
          setService(mapApiServiceToUi(res.data, serviceHair));
        } else if (!cancelled) {
          setService(null);
        }
      } catch {
        if (!cancelled) setService(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, location.key]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-foreground">Loading...</div>;
  if (!service) return <div className="min-h-screen flex items-center justify-center text-foreground">Service not found</div>;

  const isWishlisted = wishlist.some((wid) => String(wid) === String(service.id));

  const handleWishlist = () => {
    const sid = String(service.id ?? "").trim();
    const wasListed = wishlist.some((wid) => String(wid) === sid);
    toggleWishlist(sid);
    if (/^[a-f0-9]{24}$/i.test(sid)) {
      toast.success(wasListed ? "Removed from favourites" : "Service added to favourites");
    }
  };

  const handleAddToCart = () => {
    if (!service.id) {
      toast.error("Service is missing an ID. Please try again.");
      return;
    }
    addToCart(service);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Image */}
      <div className="relative">
        <img src={service.image} alt={service.name} className="w-full h-64 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-12 left-4 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <button type="button" onClick={handleWishlist} className="absolute top-12 right-4 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center">
          <Heart className={`w-5 h-5 ${isWishlisted ? "fill-primary text-primary" : "text-foreground"}`} />
        </button>
      </div>

      <div className="px-4 -mt-6 relative z-10">
        <div className="bg-card rounded-2xl p-5 shadow-card">
          <h1 className="text-xl font-display font-bold text-foreground">{service.name}</h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-salon-gold text-salon-gold" />
              <span className="text-sm font-semibold">{service.rating}</span>
              <span className="text-xs text-muted-foreground">({service.reviews} reviews)</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">{service.duration}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-2xl font-bold text-foreground">₹{service.price}</span>
            {service.originalPrice && (
              <>
                <span className="text-sm text-muted-foreground line-through">₹{service.originalPrice}</span>
                <span className="text-xs font-semibold text-accent-foreground bg-accent px-2 py-0.5 rounded-full">
                  {Math.round((1 - service.price / service.originalPrice) * 100)}% OFF
                </span>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mt-4 bg-card rounded-2xl p-5 shadow-card">
          <h2 className="font-display font-bold text-foreground mb-2">About</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
        </div>

        {/* Includes */}
        <div className="mt-4 bg-card rounded-2xl p-5 shadow-card">
          <h2 className="font-display font-bold text-foreground mb-3">What's Included</h2>
          <div className="space-y-2">
            {(service.includes || []).map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                  <Check className="w-3 h-3 text-accent-foreground" />
                </div>
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expert assignment */}
        <div className="mt-4 bg-card rounded-2xl p-5 shadow-card">
          <h2 className="font-display font-bold text-foreground mb-3">Our Experts</h2>
          <p className="text-sm text-muted-foreground">
            A skilled beautician will be assigned for your booking based on availability.
          </p>
        </div>
      </div>

      {/* Bottom Actions — full width on desktop, matches app shell padding */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-card border-t border-border pb-[max(1rem,env(safe-area-inset-bottom,0px))] shadow-[0_-4px_24px_rgba(0,0,0,0.15)] pointer-events-auto">
        <div className="max-w-lg mx-auto md:max-w-none px-4 md:px-8 lg:px-12 xl:px-16 pt-4 flex gap-3">
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 border-2 border-primary text-primary py-3 rounded-xl font-semibold flex items-center justify-center gap-2 active:opacity-90"
          >
            <ShoppingBag className="w-4 h-4" /> Add to Cart
          </button>
          <button
            type="button"
            onClick={() => {
              handleAddToCart();
              navigate("/cart");
            }}
            className="flex-1 gradient-primary text-primary-foreground py-3 rounded-xl font-semibold shadow-salon active:opacity-90"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
