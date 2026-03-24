import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import { customerApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const RateVisit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refreshPendingRatings, refreshOrders } = useApp();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [beauticianName, setBeauticianName] = useState("");
  const [alreadyRated, setAlreadyRated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const res = await customerApi.getAppointmentById(id);
        if (!cancelled && res.success && res.data) {
          const d = res.data as {
            service?: { name?: string };
            beautician?: { name?: string };
            ratingFromCustomer?: { stars?: number } | null;
          };
          setTitle(d.service?.name || "Service");
          setBeauticianName(d.beautician?.name || "Beautician");
          if (d.ratingFromCustomer?.stars != null) {
            setAlreadyRated(true);
          }
        }
      } catch {
        if (!cancelled) toast.error("Could not load appointment");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const submit = async () => {
    if (!id || stars < 1) {
      toast.error("Please select a star rating");
      return;
    }
    setSubmitting(true);
    try {
      const res = await customerApi.rateAppointment(id, { stars, comment: comment.trim() || undefined });
      if (res.success) {
        toast.success("Thanks for your feedback!");
        await refreshPendingRatings();
        await refreshOrders();
        navigate("/home", { replace: true });
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
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-display font-bold text-foreground">Rate your visit</h1>
      </div>

      <div className="px-4 space-y-6">
        <p className="text-sm text-muted-foreground">
          After each completed service, rating your beautician is required before you can book again.
        </p>

        <div className="bg-card rounded-xl p-4 shadow-card border border-border">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground mt-1">{beauticianName}</p>
        </div>

        {alreadyRated && (
          <p className="text-sm text-green-600 dark:text-green-400">You have already rated this visit.</p>
        )}

        <div>
          <p className="text-sm font-medium text-foreground mb-2">Your rating</p>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStars(n)}
                disabled={alreadyRated}
                className={cn(
                  "p-2 rounded-lg border transition-colors",
                  stars >= n ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground",
                  alreadyRated && "opacity-50",
                )}
              >
                <Star className={cn("w-8 h-8", stars >= n && "fill-current")} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground mb-2">Comment (optional)</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={alreadyRated}
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            placeholder="How was your experience?"
          />
        </div>

        {!alreadyRated && (
          <button
            type="button"
            disabled={submitting || stars < 1}
            onClick={() => void submit()}
            className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-salon disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit rating"}
          </button>
        )}
      </div>
    </div>
  );
};

export default RateVisit;
