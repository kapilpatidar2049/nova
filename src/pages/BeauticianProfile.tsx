import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Star, Phone, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { customerApi } from "@/lib/api";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";

const BeauticianProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("appointmentId")?.trim() || "";
  const navigate = useNavigate();
  const { refreshPendingRatings, refreshOrders } = useApp();

  const [summary, setSummary] = useState<{
    name: string;
    phone: string;
    profileImageUrl: string | null;
    rating: number;
    experienceYears: number;
    expertise: string[];
    servicesCompleted: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [appt, setAppt] = useState<{
    status: string;
    beautician?: { _id?: string } | string;
    ratingFromCustomer?: { stars?: number } | null;
  } | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await customerApi.getBeauticianSummary(id);
        if (!cancelled && res.success && res.data) setSummary(res.data);
      } catch {
        if (!cancelled) toast.error("Could not load beautician profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!appointmentId) {
      setAppt(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await customerApi.getAppointmentById(appointmentId);
        if (!cancelled && res.success && res.data) {
          const d = res.data as {
            status: string;
            beautician?: { _id?: string };
            ratingFromCustomer?: { stars?: number } | null;
          };
          setAppt(d);
        }
      } catch {
        if (!cancelled) setAppt(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appointmentId]);

  const beauticianIdFromAppt =
    appt?.beautician && typeof appt.beautician === "object" && "_id" in appt.beautician
      ? String((appt.beautician as { _id: string })._id)
      : "";

  const canRate =
    Boolean(id && appointmentId && appt) &&
    appt!.status === "completed" &&
    !(appt!.ratingFromCustomer && appt!.ratingFromCustomer.stars != null) &&
    beauticianIdFromAppt === id;

  const submitRating = async () => {
    if (!appointmentId || stars < 1) {
      toast.error("Please select a star rating");
      return;
    }
    setSubmitting(true);
    try {
      const res = await customerApi.rateAppointment(appointmentId, {
        stars,
        comment: comment.trim() || undefined,
      });
      if (res.success) {
        toast.success("Thanks for your feedback!");
        await refreshPendingRatings();
        await refreshOrders();
        navigate(-1);
      } else {
        toast.error((res as { message?: string }).message || "Could not submit");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!summary || !id) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 pt-12 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-display font-bold text-foreground">Expert profile</h1>
        </div>
        <p className="px-4 mt-4 text-muted-foreground">Profile not available.</p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-display font-bold text-foreground">Expert profile</h1>
      </div>

      <div className="px-4 space-y-4">
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border flex flex-col items-center text-center">
          <img
            src={summary.profileImageUrl || "/placeholder-beautician.png"}
            alt=""
            className="w-24 h-24 rounded-full object-cover border-2 border-border"
          />
          <h2 className="text-lg font-bold text-foreground mt-4">{summary.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Star className="w-4 h-4 fill-salon-gold text-salon-gold" />
            <span className="text-sm font-medium">{summary.rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">
              • {summary.experienceYears ? `${summary.experienceYears}+ yrs` : "Professional"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{summary.servicesCompleted} services completed</p>
          {summary.expertise?.length ? (
            <div className="flex flex-wrap justify-center gap-1 mt-3">
              {summary.expertise.slice(0, 5).map((e) => (
                <span key={e} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {e}
                </span>
              ))}
            </div>
          ) : null}
          {summary.phone ? (
            <a
              href={`tel:${summary.phone}`}
              className="mt-4 inline-flex items-center gap-2 gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold"
            >
              <Phone className="w-4 h-4" />
              Call
            </a>
          ) : null}
        </div>

        {appointmentId && canRate && (
          <div className="bg-card rounded-xl p-4 shadow-card border border-border space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              Rate this visit
            </div>
            <p className="text-xs text-muted-foreground">Your rating is required after service completion.</p>
            <div className="flex gap-2 flex-wrap justify-center">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStars(n)}
                  className={cn(
                    "p-2 rounded-lg border transition-colors",
                    stars >= n ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground",
                  )}
                >
                  <Star className={cn("w-7 h-7", stars >= n && "fill-current")} />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Optional comment"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={submitting || stars < 1}
              onClick={() => void submitRating()}
              className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit rating"}
            </button>
          </div>
        )}

        {appointmentId && appt?.status === "completed" && appt?.ratingFromCustomer?.stars != null && (
          <p className="text-sm text-center text-muted-foreground">You already rated this visit.</p>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default BeauticianProfile;
