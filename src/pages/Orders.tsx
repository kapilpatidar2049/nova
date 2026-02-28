import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import BottomNav from "@/components/BottomNav";

const statusColors: Record<string, string> = {
  booked: "bg-accent text-accent-foreground",
  assigned: "bg-accent text-accent-foreground",
  on_the_way: "bg-salon-gold/20 text-salon-gold-foreground",
  started: "bg-primary/10 text-primary",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, string> = {
  booked: "Booked",
  assigned: "Assigned",
  on_the_way: "On the Way",
  started: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const tabs = ["upcoming", "completed", "cancelled"] as const;

const Orders = () => {
  const navigate = useNavigate();
  const { orders } = useApp();
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("upcoming");

  const filtered = orders.filter((o) => {
    if (activeTab === "upcoming") return !["completed", "cancelled"].includes(o.status);
    return o.status === activeTab;
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate("/home")} className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-display font-bold text-foreground">My Orders</h1>
      </div>

      <div className="px-4 flex gap-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-full text-xs font-semibold capitalize transition-all ${
              activeTab === t ? "gradient-primary text-primary-foreground shadow-salon" : "bg-card text-muted-foreground shadow-card"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No {activeTab} orders</p>
          </div>
        )}
        {filtered.map((order) => (
          <button
            key={order.id}
            onClick={() => navigate(`/order/${order.id}`)}
            className="w-full bg-card rounded-xl p-4 shadow-card flex items-center gap-3 text-left animate-fade-in"
          >
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">{order.id}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[order.status]}`}>
                  {statusLabels[order.status]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{order.date} • {order.timeSlot}</p>
              <p className="text-sm font-semibold text-foreground mt-1">₹{order.total}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        ))}
      </div>
      <BottomNav />
    </div>
  );
};

export default Orders;
