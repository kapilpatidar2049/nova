import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import ServiceCard from "@/components/ServiceCard";
import type { Service } from "@/types";
import { customerApi, mapApiServiceToUi } from "@/lib/api";
import serviceHair from "@/assets/service-hair.png";
import BottomNav from "@/components/BottomNav";

const Wishlist = () => {
  const navigate = useNavigate();
  const { wishlist } = useApp();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await customerApi.getServices(1, 200, "");
        if (!cancelled && res.success && res.data?.items) {
          setServices(res.data.items.map((s) => mapApiServiceToUi(s, serviceHair)));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const items = services.filter((s) => wishlist.includes(s.id));

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-display font-bold text-foreground">Wishlist</h1>
      </div>

      <div className="px-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-12 h-12 text-muted mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No saved services yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((s) => (
              <ServiceCard key={s.id} service={s} variant="list" />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Wishlist;
