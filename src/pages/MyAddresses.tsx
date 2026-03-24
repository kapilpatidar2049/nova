import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Plus, Trash2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const STORAGE_KEY = "customer_saved_addresses";

export type SavedAddress = { id: string; label: string; line1: string };

function loadAddresses(): SavedAddress[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is SavedAddress =>
        x != null &&
        typeof x === "object" &&
        typeof (x as SavedAddress).id === "string" &&
        typeof (x as SavedAddress).line1 === "string"
    );
  } catch {
    return [];
  }
}

const MyAddresses = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<SavedAddress[]>([]);
  const [label, setLabel] = useState("");
  const [line1, setLine1] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setList(loadAddresses());
  }, []);

  const persist = (next: SavedAddress[]) => {
    setList(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const addAddress = () => {
    const t = line1.trim();
    if (t.length < 5) return;
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `addr_${Date.now()}`;
    const next: SavedAddress = {
      id,
      label: label.trim() || "Home",
      line1: t,
    };
    persist([next, ...list]);
    setLabel("");
    setLine1("");
    setAdding(false);
  };

  const remove = (id: string) => {
    persist(list.filter((a) => a.id !== id));
  };

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
        <h1 className="text-xl font-display font-bold text-foreground">My addresses</h1>
      </div>

      <div className="px-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          Save places you use often. Booking checkout uses its own address step; these are stored on this device for your reference.
        </p>

        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-primary font-medium"
          >
            <Plus className="w-5 h-5" />
            Add address
          </button>
        ) : (
          <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Label (e.g. Home)</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                placeholder="Home"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Full address</label>
              <textarea
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none"
                placeholder="House no., street, area, city, pincode"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setLabel("");
                  setLine1("");
                }}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addAddress}
                disabled={line1.trim().length < 5}
                className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {list.length === 0 && !adding ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
              No saved addresses yet
            </div>
          ) : (
            list.map((a) => (
              <div key={a.id} className="bg-card rounded-xl p-4 shadow-card flex gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary">{a.label}</p>
                  <p className="text-sm text-foreground mt-1">{a.line1}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                  aria-label="Remove address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default MyAddresses;
