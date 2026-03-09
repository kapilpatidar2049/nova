import { Star, Heart, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Service } from "@/types";
import { useApp } from "@/contexts/AppContext";

const ServiceCard = ({ service, variant = "grid" }: { service: Service; variant?: "grid" | "list" }) => {
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, wishlist } = useApp();
  const isWishlisted = wishlist.includes(service.id);

  if (variant === "list") {
    return (
      <div
        onClick={() => navigate(`/service/${service.id}`)}
        className="flex gap-3 p-3 bg-card rounded-xl shadow-card cursor-pointer animate-fade-in"
      >
        <img src={service.image} alt={service.name} className="w-24 h-24 rounded-lg object-cover" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-sm text-foreground truncate pr-2">{service.name}</h3>
            <button onClick={(e) => { e.stopPropagation(); toggleWishlist(service.id); }} className="shrink-0">
              <Heart className={`w-4 h-4 ${isWishlisted ? "fill-primary text-primary" : "text-muted-foreground"}`} />
            </button>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 fill-salon-gold text-salon-gold" />
            <span className="text-xs font-medium">{service.rating}</span>
            <span className="text-xs text-muted-foreground">({service.reviews})</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-bold text-foreground">₹{service.price}</span>
            {service.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">₹{service.originalPrice}</span>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">{service.duration}</span>
            <button
              onClick={(e) => { e.stopPropagation(); addToCart(service); }}
              className="gradient-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate(`/service/${service.id}`)}
      className="bg-card rounded-xl shadow-card overflow-hidden cursor-pointer animate-fade-in"
    >
      <div className="relative">
        <img src={service.image} alt={service.name} className="w-full h-32 object-cover" />
        <button
          onClick={(e) => { e.stopPropagation(); toggleWishlist(service.id); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center"
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-primary text-primary" : "text-foreground"}`} />
        </button>
        {service.originalPrice && (
          <span className="absolute top-2 left-2 gradient-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
            {Math.round((1 - service.price / service.originalPrice) * 100)}% OFF
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm text-foreground line-clamp-1">{service.name}</h3>
        <div className="flex items-center gap-1 mt-1">
          <Star className="w-3 h-3 fill-salon-gold text-salon-gold" />
          <span className="text-xs font-medium">{service.rating}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-sm font-bold text-foreground">₹{service.price}</span>
            {service.originalPrice && (
              <span className="text-xs text-muted-foreground line-through ml-1">₹{service.originalPrice}</span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); addToCart(service); }}
            className="gradient-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
