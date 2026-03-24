import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Sparkles, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import BottomNav from "@/components/BottomNav";

const QUICK_AMOUNTS = [100, 250, 500, 1000];

const WalletPage = () => {
  const navigate = useNavigate();
  const { walletBalance, rechargeWallet, isLoggedIn } = useApp();
  const [amount, setAmount] = useState("");
  const [paying, setPaying] = useState(false);

  const handleRecharge = async () => {
    if (!isLoggedIn) {
      toast.error("Please sign in to recharge your wallet");
      return;
    }
    const n = Number(String(amount).replace(/[^\d.]/g, ""));
    if (!Number.isFinite(n) || n < 1) {
      toast.error("Enter an amount of at least ₹1");
      return;
    }
    setPaying(true);
    const res = await rechargeWallet(Math.floor(n));
    setPaying(false);
    if (res.ok) {
      toast.success("Wallet recharged successfully");
      setAmount("");
    } else if (res.error && res.error !== "Cancelled") {
      toast.error(res.error);
    }
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
        <h1 className="text-xl font-display font-bold text-foreground">Wallet</h1>
      </div>

      <div className="px-4 space-y-4">
        <div className="gradient-primary rounded-2xl p-6 text-primary-foreground shadow-salon">
          <div className="flex items-center gap-2 text-sm opacity-90">
            <Wallet className="w-5 h-5" />
            Available balance
          </div>
          <p className="text-4xl font-bold mt-2">₹{walletBalance.toLocaleString("en-IN")}</p>
          <p className="text-xs mt-2 opacity-90">
            Recharge with Razorpay (test keys in Dashboard test mode, live keys for production). Pay bookings with wallet at
            checkout when balance covers the total.
          </p>
        </div>

        <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
          <h2 className="font-display font-semibold text-foreground">Recharge wallet</h2>
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setAmount(String(q))}
                className="px-3 py-1.5 rounded-lg bg-muted text-sm font-medium text-foreground hover:bg-muted/80"
              >
                ₹{q}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <IndianRupee className="w-5 h-5 text-muted-foreground shrink-0" />
            <input
              type="text"
              inputMode="decimal"
              placeholder="Amount (₹)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
              disabled={paying}
            />
          </div>
          <button
            type="button"
            disabled={paying || !isLoggedIn}
            onClick={() => void handleRecharge()}
            className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-salon disabled:opacity-50"
          >
            {paying ? "Opening Razorpay…" : "Pay with Razorpay"}
          </button>
          {!isLoggedIn && (
            <p className="text-xs text-muted-foreground text-center">Sign in to recharge your wallet.</p>
          )}
        </div>

        <div className="bg-card rounded-xl p-4 shadow-card">
          <h2 className="font-display font-semibold text-foreground mb-2">How it works</h2>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4">
            <li>Add money here using Razorpay (same checkout as online booking).</li>
            <li>Add services to cart and choose Wallet on the payment step if your balance covers the total.</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => navigate("/home")}
          className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-salon flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Browse services
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default WalletPage;
