import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Star, Clock, Heart, ShoppingBag, Check } from "lucide-react";
import type { Service } from "@/types";
import { useApp } from "@/contexts/AppContext";
import { customerApi, mapApiServiceToUi } from "@/lib/api";
import serviceHair from "@/assets/service-hair.png";

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart, toggleWishlist, wishlist } = useApp();
  const [service, setService] = useState<Service | null>(location.state?.service ?? null);
  const [loading, setLoading] = useState(!location.state?.service);

  useEffect(() => {
    if (service || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await customerApi.getServices(1, 100, "");
        if (!cancelled && res.success && res.data?.items) {
          const list = res.data.items.map((s) => mapApiServiceToUi(s, serviceHair));
          setService(list.find((s) => s.id === id) ?? null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, service]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-foreground">Loading...</div>;
  if (!service) return <div className="min-h-screen flex items-center justify-center text-foreground">Service not found</div>;

  const isWishlisted = wishlist.includes(service.id);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Image */}
      <div className="relative">
        <img src={service.image} alt={service.name} className="w-full h-64 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-12 left-4 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <button onClick={() => toggleWishlist(service.id)} className="absolute top-12 right-4 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center">
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
            {service.includes.map((item) => (
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

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 flex gap-3 z-50">
        <button onClick={() => addToCart(service)} className="flex-1 border-2 border-primary text-primary py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
          <ShoppingBag className="w-4 h-4" /> Add to Cart
        </button>
        <button onClick={() => { addToCart(service); navigate("/cart"); }} className="flex-1 gradient-primary text-primary-foreground py-3 rounded-xl font-semibold shadow-salon">
          Book Now
        </button>
      </div>
    </div>
  );
};

export default ServiceDetail;
