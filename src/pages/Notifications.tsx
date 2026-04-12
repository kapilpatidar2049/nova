import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Timer } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import BottomNav from "@/components/BottomNav";
import type { BookingOrder } from "@/types";
import { formatDurationMs, getScheduledAtMs } from "@/lib/bookingTime";

const activeServiceStatuses: BookingOrder["status"][] = [
  "booked",
  "assigned",
  "on_the_way",
  "reached",
  "started",
];

function alertTitle(order: BookingOrder) {
  if (order.kind === "product") {
    return order.productLines?.[0]?.name ? `Shop · ${order.productLines[0].name}` : "Product order";
  }
  const name = order.services[0]?.service?.name;
  return name ? `Service · ${name}` : "Booking update";
}

function scheduleCountdownLine(order: BookingOrder, now: number): { label: string; sub?: string; urgent?: boolean } | null {
  if (order.kind === "product") return null;
  const target = getScheduledAtMs(order.date, order.timeSlot);
  if (target == null) return null;
  const delta = target - now;

  if (!activeServiceStatuses.includes(order.status)) {
    return { label: `Scheduled: ${order.date} · ${order.timeSlot}` };
  }

  if (delta > 0) {
    return {
      label: "Starts in",
      sub: formatDurationMs(delta),
      urgent: delta < 3600000,
    };
  }

  if (order.status === "started" || order.status === "reached" || order.status === "on_the_way") {
    return { label: "Service window", sub: "In progress or active" };
  }
  return { label: "Scheduled time passed", sub: "See order for latest status" };
}

const Notifications = () => {
  const navigate = useNavigate();
  const { orders, notifications, markNotificationRead, refreshNotifications } = useApp();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    refreshNotifications();
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [refreshNotifications]);

  const serviceOrders = orders
    .filter((o) => o.kind !== "product")
    .slice()
    .sort((a, b) => {
      const ta = getScheduledAtMs(a.date, a.timeSlot) ?? 0;
      const tb = getScheduledAtMs(b.date, b.timeSlot) ?? 0;
      return ta - tb;
    });

  const productOrders = orders.filter((o) => o.kind === "product").slice(0, 5);

  const displayAlerts = [
    ...notifications.map((n) => ({
      key: `n-${n.id}`,
      id: n.id,
      type: "notification" as const,
      title: n.title,
      message: n.message,
      timestamp: n.timestamp,
      read: n.read,
      nType: n.type
    })),
    ...serviceOrders.map((order) => ({
      key: `s-${order.id}`,
      id: order.id,
      type: "order" as const,
      order,
      title: alertTitle(order),
      timestamp: order.createdAt,
      read: true
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 md:px-0 pt-12 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-display font-bold text-foreground">Notifications</h1>
      </div>

      <div className="px-4 md:px-0 space-y-3">
        {displayAlerts.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-muted mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No alerts right now</p>
          </div>
        ) : (
          displayAlerts.map((alert) => {
            if (alert.type === "order" && alert.order) {
              const order = alert.order;
              const cd = scheduleCountdownLine(order, now);
              return (
                <button
                  key={alert.key}
                  onClick={() => navigate(`/order/${order.id}`)}
                  className="w-full bg-card rounded-xl p-4 shadow-card text-left border border-border/60 hover:border-primary/30 transition-colors"
                >
                  <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    Status: {order.status.replace(/_/g, " ")}
                  </p>
                  {cd && (
                    <div
                      className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 ${
                        cd.urgent ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-foreground"
                      }`}
                    >
                      <Timer className="w-4 h-4 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wide opacity-90">{cd.label}</p>
                        {cd.sub && <p className="text-sm font-bold tabular-nums">{cd.sub}</p>}
                      </div>
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-2">
                    {order.date} · {order.timeSlot}
                  </p>
                </button>
              );
            }

            if (alert.type === "notification") {
              return (
                <button
                  key={alert.key}
                  onClick={() => {
                    if (!alert.read) markNotificationRead(alert.id);
                  }}
                  className={`w-full bg-card rounded-xl p-4 shadow-card text-left border transition-colors ${
                    alert.read ? "border-border/40 opacity-75" : "border-primary/30 ring-1 ring-primary/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                    {!alert.read && <span className="w-2 h-2 bg-primary rounded-full mt-1.5" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-3">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </button>
              );
            }

            return null;
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Notifications;
