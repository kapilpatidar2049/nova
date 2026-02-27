import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, CreditCard, Phone, Star, Check, Circle } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

const timeline = ["booked", "assigned", "on_the_way", "started", "completed"];
const timelineLabels: Record<string, string> = {
  booked: "Booked",
  assigned: "Beautician Assigned",
  on_the_way: "On the Way",
  started: "Service Started",
  completed: "Completed",
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orders, cancelOrder } = useApp();
  const order = orders.find((o) => o.id === id);

  if (!order) return <div className="min-h-screen flex items-center justify-center text-foreground">Order not found</div>;

  const currentIdx = timeline.indexOf(order.status);

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-display font-bold text-foreground">Order Details</h1>
      </div>

      <div className="px-4 space-y-4">
        {/* Order ID */}
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <span className="text-xs text-muted-foreground">Order ID</span>
          <p className="text-lg font-bold text-primary">{order.id}</p>
        </div>

        {/* Timeline */}
        {order.status !== "cancelled" && (
          <div className="bg-card rounded-xl p-5 shadow-card">
            <h2 className="font-display font-bold text-foreground mb-4">Order Status</h2>
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

        {order.status === "cancelled" && (
          <div className="bg-destructive/10 rounded-xl p-4 text-center">
            <span className="text-destructive font-semibold">This order has been cancelled</span>
          </div>
        )}

        {/* Details */}
        <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm text-foreground">{order.address}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm text-foreground">{order.date} • {order.timeSlot}</span>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm text-foreground">{order.paymentMode} • ₹{order.total}</span>
          </div>
        </div>

        {/* Beautician */}
        {order.beautician && (
          <div className="bg-card rounded-xl p-4 shadow-card">
            <h2 className="font-display font-bold text-foreground mb-3">Your Expert</h2>
            <div className="flex items-center gap-3">
              <img src={order.beautician.image} alt="" className="w-14 h-14 rounded-full object-cover" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">{order.beautician.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Star className="w-3 h-3 fill-salon-gold text-salon-gold" />
                  <span className="text-xs">{order.beautician.rating}</span>
                  <span className="text-xs text-muted-foreground">• {order.beautician.experience}</span>
                </div>
                <p className="text-xs text-muted-foreground">{order.beautician.servicesCompleted} services completed</p>
              </div>
              <button className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-salon">
                <Phone className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
          </div>
        )}

        {/* Cancel */}
        {!["completed", "cancelled"].includes(order.status) && (
          <button
            onClick={() => { cancelOrder(order.id); navigate("/orders"); }}
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
