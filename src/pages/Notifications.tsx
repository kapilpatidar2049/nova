import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import BottomNav from "@/components/BottomNav";

const Notifications = () => {
  const navigate = useNavigate();
  const { orders } = useApp();

  const alerts = orders.slice(0, 20).map((order) => ({
    id: order.id,
    title: `Booking ${order.status.replaceAll("_", " ")}`,
    message: `Order ${order.id} is currently ${order.status.replaceAll("_", " ")}.`,
    date: order.date,
  }));

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-display font-bold text-foreground">Notifications</h1>
      </div>

      <div className="px-4 space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-muted mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No alerts right now</p>
          </div>
        ) : (
          alerts.map((a) => (
            <button
              key={a.id}
              onClick={() => navigate(`/order/${a.id}`)}
              className="w-full bg-card rounded-xl p-4 shadow-card text-left"
            >
              <p className="text-sm font-semibold text-foreground">{a.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{a.message}</p>
              <p className="text-[11px] text-muted-foreground mt-2">{a.date}</p>
            </button>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Notifications;
