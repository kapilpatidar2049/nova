import { useState, useEffect, useRef } from "react";
import { Navigation, Clock, Phone } from "lucide-react";
import type { Beautician } from "@/types";
import { customerApi } from "@/lib/api";
import { createTrackingSocket, type LocationUpdate } from "@/lib/socket";

interface LiveTrackingProps {
  beautician?: Beautician;
  appointmentId?: string;
}

const LiveTracking = ({ beautician, appointmentId }: LiveTrackingProps) => {
  const [eta, setEta] = useState(12);
  const [distance, setDistance] = useState(2.4);
  const socketRef = useRef<ReturnType<typeof createTrackingSocket> | null>(null);

  useEffect(() => {
    if (!appointmentId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await customerApi.track(appointmentId);
        if (!cancelled && res.success && res.data?.eta) {
          if (typeof res.data.eta.etaInMinutes === "number") setEta(res.data.eta.etaInMinutes);
          if (typeof res.data.eta.distanceInKm === "number") setDistance(res.data.eta.distanceInKm);
        }
      } catch {
        // keep defaults
      }
    })();
    return () => { cancelled = true; };
  }, [appointmentId]);

  useEffect(() => {
    if (!appointmentId) return;
    const socket = createTrackingSocket();
    socketRef.current = socket;

    socket.on("location", (data: LocationUpdate) => {
      if (data.eta?.etaInMinutes != null) setEta(data.eta.etaInMinutes);
      if (data.eta?.distanceInKm != null) setDistance(data.eta.distanceInKm);
    });

    socket.on("connect", () => {
      socket.emit("subscribe", { appointmentId });
    });

    if (socket.connected) {
      socket.emit("subscribe", { appointmentId });
    }

    return () => {
      socket.emit("unsubscribe", { appointmentId });
      socket.removeAllListeners("location");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [appointmentId]);

  return (
    <div className="bg-card rounded-xl shadow-card overflow-hidden">
      <div className="relative h-48 bg-muted overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/30 to-muted">
          <div className="absolute inset-0 opacity-20">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={`h-${i}`} className="absolute w-full border-t border-muted-foreground/30" style={{ top: `${(i + 1) * 12}%` }} />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`v-${i}`} className="absolute h-full border-l border-muted-foreground/30" style={{ left: `${(i + 1) * 16}%` }} />
            ))}
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-primary border-2 border-primary-foreground shadow-salon" />
            <span className="text-[10px] font-semibold text-primary mt-1 bg-card px-1.5 py-0.5 rounded">You</span>
          </div>

          <div
            className="absolute flex flex-col items-center transition-all duration-500 ease-linear"
            style={{ top: `${Math.max(15, 60 - eta * 3)}%`, left: `${45 + Math.sin(eta) * 5}%` }}
          >
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-salon animate-pulse">
              <Navigation className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-[10px] font-semibold text-foreground mt-1 bg-card px-1.5 py-0.5 rounded shadow">
              {beautician?.name?.split(" ")[0] || "Expert"}
            </span>
          </div>
        </div>

        <div className="absolute top-3 left-3 bg-card rounded-lg px-3 py-2 shadow-card flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <div>
            <p className="text-xs font-bold text-foreground">{eta} min</p>
            <p className="text-[10px] text-muted-foreground">{distance} km away</p>
          </div>
        </div>

        <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-destructive-foreground animate-pulse" />
          LIVE
        </div>
      </div>

      {beautician && (
        <div className="p-4 flex items-center gap-3">
          <img src={beautician.image} alt={beautician.name} className="w-12 h-12 rounded-full object-cover" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">{beautician.name}</h3>
            <p className="text-xs text-muted-foreground">is on the way to you</p>
          </div>
          <button className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-salon">
            <Phone className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveTracking;
