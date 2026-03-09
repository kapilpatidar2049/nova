import { useState, useEffect } from "react";
import { Search, Bell, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import ServiceCard from "@/components/ServiceCard";
import { categories } from "@/data/constants";
import type { Service } from "@/types";
import { useApp } from "@/contexts/AppContext";
import heroBanner from "@/assets/hero-banner.png";
import { customerApi, mapApiServiceToUi } from "@/lib/api";
import serviceHair from "@/assets/service-hair.png";

const Index = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login", { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await customerApi.getServices(1, 50, "");
        if (!cancelled && res.success && res.data?.items) {
          setServices(res.data.items.map((s) => mapApiServiceToUi(s, serviceHair)));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Redirecting to login...</p>
      </div>
    );
  }

  const filtered = services.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || s.category === activeCategory;
    return matchSearch && matchCat;
  });

  const topRated = [...services].sort((a, b) => b.rating - a.rating).slice(0, 4);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="gradient-primary px-4 pt-12 pb-6 rounded-b-[1.5rem]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
            <span className="text-lg font-display font-bold text-primary-foreground">Nova </span>
          </div>
          <button className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Bell className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
        <button
          onClick={() => navigate("/search")}
          className="flex items-center gap-3 bg-primary-foreground/20 backdrop-blur-sm rounded-xl px-4 py-2.5 w-full text-left"
        >
          <Search className="w-4 h-4 text-primary-foreground/70" />
          <span className="text-primary-foreground/60 text-sm">Search for services...</span>
        </button>
      </div>

      <div className="px-4 space-y-6 mt-5">
        {/* Promo Banner */}
        <div className="relative rounded-2xl overflow-hidden shadow-salon">
          <img src={heroBanner} alt="Special offers" className="w-full h-36 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 to-transparent flex flex-col justify-center p-5">
            <span className="text-primary-foreground text-xs font-semibold tracking-wider uppercase">Special Offer</span>
            <h2 className="text-primary-foreground text-xl font-display font-bold mt-1">40% Off</h2>
            <p className="text-primary-foreground/80 text-xs mt-1">On first booking</p>
          </div>
        </div>

        {/* Categories */}
        <div>
          <h2 className="text-lg font-display font-bold text-foreground mb-3">Categories</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={`flex flex-col items-center gap-1.5 min-w-[4.5rem] p-3 rounded-xl transition-all ${
                  activeCategory === cat.id
                    ? "gradient-primary shadow-salon"
                    : "bg-card shadow-card"
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className={`text-xs font-medium ${activeCategory === cat.id ? "text-primary-foreground" : "text-foreground"}`}>
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Top Rated */}
        {!search && !activeCategory && !loading && topRated.length > 0 && (
          <div>
            <h2 className="text-lg font-display font-bold text-foreground mb-3">Top Rated</h2>
            <div className="grid grid-cols-2 gap-3">
              {topRated.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          </div>
        )}

        {/* All / Filtered */}
        <div>
          <h2 className="text-lg font-display font-bold text-foreground mb-3">
            {activeCategory ? categories.find((c) => c.id === activeCategory)?.name : "All Services"}
          </h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading services...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No services found</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((s) => (
                <ServiceCard key={s.id} service={s} variant="list" />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
