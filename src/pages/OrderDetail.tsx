import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, CreditCard, Phone, Star, Check, Circle, Package, KeyRound, Loader2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { customerApi } from "@/lib/api";
import { formatDurationMs } from "@/lib/bookingTime";
import LiveTracking from "@/components/LiveTracking";

const serviceTimeline = ["booked", "assigned", "on_the_way", "reached", "started", "completed"];
const serviceTimelineLabels: Record<string, string> = {
  booked: "Booked",
  assigned: "Beautician Assigned",
  on_the_way: "On the Way",
  reached: "Expert Arrived",
  started: "Service Started",
  completed: "Completed",
};

const productTimeline = ["booked", "assigned", "started", "on_the_way", "completed"];
const productTimelineLabels: Record<string, string> = {
  booked: "Payment / Placed",
  assigned: "Confirmed",
  started: "Processing",
  on_the_way: "Shipped",
  completed: "Delivered",
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orders, cancelOrder, ordersLoading, refreshOrders } = useApp();
  const order = orders.find((o) => o.id === id);
  const isProduct = order?.kind === "product";
  const [serviceOtp, setServiceOtp] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const timeline = isProduct ? productTimeline : serviceTimeline;
  const timelineLabels = isProduct ? productTimelineLabels : serviceTimelineLabels;

  useEffect(() => {
    if (id) void refreshOrders();
  }, [id, refreshOrders]);

  useEffect(() => {
    if (isProduct || !id || !order || order.kind === "product") return;
    let cancelled = false;
    const load = () => {
      customerApi
        .getAppointmentById(id)
        .then((res) => {
          if (cancelled || !res.success || !res.data) return;
          setServiceOtp(res.data.serviceStartOtp ?? null);
          setOtpExpiresAt(res.data.serviceStartOtpExpiresAt ?? null);
        })
        .catch(() => {});
    };
    load();
    const t = window.setInterval(load, 12_000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [isProduct, id, order?.id, order?.kind]);

  useEffect(() => {
    if (isProduct) return;
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isProduct]);

  if (ordersLoading && !order) return <div className="min-h-screen flex items-center justify-center text-foreground">Loading...</div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center text-foreground">Order not found</div>;

  const currentIdx = timeline.indexOf(order.status);

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-display font-bold text-foreground">
          {isProduct ? "Product order" : "Order Details"}
        </h1>
      </div>

      <div className="px-4 space-y-4">
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <span className="text-xs text-muted-foreground">{isProduct ? "Order ID" : "Order ID"}</span>
          <p className="text-lg font-bold text-primary">{order.id}</p>
          {isProduct && order.vendorName ? (
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <Package className="w-3 h-3" /> {order.vendorName}
            </p>
          ) : null}
        </div>

        {!isProduct && order.status === "booked" && (
          <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 flex gap-3 items-start">
            <Loader2 className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 animate-spin" />
            <div className="text-sm text-foreground">
              <p className="font-semibold">
                {order.beautician ? "Waiting for expert confirmation" : "Searching for a beautician"}
              </p>
              <p className="text-muted-foreground mt-1">
                {order.beautician
                  ? "A professional has been matched. They need to accept—this usually takes under a minute."
                  : "We’re connecting you with an available expert nearby. This page updates automatically."}
              </p>
            </div>
          </div>
        )}

        {order.status !== "cancelled" && (
          <div className="bg-card rounded-xl p-5 shadow-card">
            <h2 className="font-display font-bold text-foreground mb-4">Status</h2>
            <div className="space-y-0">
              {timeline.map((step, i) => (
                <div key={step} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {i <= currentIdx ? (
                      <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                    ) : (
                      <Circle className="w-6 h-6 text-muted" />
                    )}
                    {i < timeline.length - 1 && (
                      <div className={`w-0.5 h-8 ${i < currentIdx ? "bg-primary" : "bg-muted"}`} />
                    )}
                  </div>
                  <div className="pb-6">
                    <span className={`text-sm font-medium ${i <= currentIdx ? "text-foreground" : "text-muted-foreground"}`}>
                      {timelineLabels[step]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isProduct && order.status === "on_the_way" && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
            Your expert is on the way. Live location appears below when available.
          </div>
        )}

        {!isProduct && (order.status === "on_the_way" || order.status === "assigned" || order.status === "reached" || order.status === "started") && (
          <LiveTracking beautician={order.beautician} appointmentId={order.id} />
        )}

        {!isProduct && order.status === "reached" && (
          <div className="bg-card rounded-xl p-5 shadow-card border-2 border-primary/40">
            <h2 className="font-display font-bold text-foreground flex items-center gap-2 mb-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Service code
            </h2>
            {serviceOtp ? (
              <>
                <p className="text-4xl font-mono tracking-[0.35em] text-center text-primary font-bold py-2">{serviceOtp}</p>
                {otpExpiresAt ? (
                  <p className="text-center text-sm font-semibold text-amber-700 dark:text-amber-400 tabular-nums">
                    Code expires in:{" "}
                    {(() => {
                      const ms = new Date(otpExpiresAt).getTime() - nowTick;
                      return ms <= 0 ? "expired — ask expert to mark arrival again" : formatDurationMs(ms, true);
                    })()}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Tell this code to your beautician only. They will enter it in their app to start the service.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your code will appear here as soon as your expert marks arrival. This page refreshes automatically.
              </p>
            )}
          </div>
        )}

        {order.status === "cancelled" && (
          <div className="bg-destructive/10 rounded-xl p-4 text-center">
            <span className="text-destructive font-semibold">This order has been cancelled</span>
          </div>
        )}

        <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm text-foreground">{order.address}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm text-foreground">
              {order.date} • {order.timeSlot}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm text-foreground">
              {order.paymentMode} • ₹{order.total}
            </span>
          </div>
        </div>

        {isProduct && order.productLines && order.productLines.length > 0 && (
          <div className="bg-card rounded-xl p-4 shadow-card">
            <h2 className="font-display font-bold text-foreground mb-3">Items</h2>
            <ul className="space-y-2">
              {order.productLines.map((line, idx) => (
                <li key={`${line.name}-${idx}`} className="flex justify-between text-sm">
                  <span className="text-foreground">
                    {line.name} ×{line.quantity}
                  </span>
                  <span className="font-medium">₹{line.lineTotal}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!isProduct && order.beautician && (
          <div className="bg-card rounded-xl p-4 shadow-card">
            <h2 className="font-display font-bold text-foreground mb-3">Your Expert</h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(`/beautician/${order.beautician!.id}?appointmentId=${encodeURIComponent(order.id)}`)}
                className="flex flex-1 items-center gap-3 text-left min-w-0"
              >
                <img src={order.beautician.image} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{order.beautician.name}</h3>
                  <p className="text-[10px] text-primary font-medium mt-0.5">Tap for profile & rating</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Star className="w-3 h-3 fill-salon-gold text-salon-gold shrink-0" />
                    <span className="text-xs">{order.beautician.rating}</span>
                    <span className="text-xs text-muted-foreground">• {order.beautician.experience}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{order.beautician.servicesCompleted} services completed</p>
                </div>
              </button>
              {order.beautician.phone ? (
                <a
                  href={`tel:${order.beautician.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-salon shrink-0"
                  aria-label="Call beautician"
                >
                  <Phone className="w-4 h-4 text-primary-foreground" />
                </a>
              ) : (
                <span className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 opacity-50">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                </span>
              )}
            </div>
          </div>
        )}

        {!["completed", "cancelled", "started"].includes(order.status) && (
          <button
            onClick={async () => {
              await cancelOrder(order.id, isProduct ? "product" : "service");
              navigate("/orders");
            }}
            className="w-full border-2 border-destructive text-destructive py-3 rounded-xl font-semibold"
          >
            Cancel Order
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;
