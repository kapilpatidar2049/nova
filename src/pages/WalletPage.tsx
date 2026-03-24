import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Sparkles } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import BottomNav from "@/components/BottomNav";

const WalletPage = () => {
  const navigate = useNavigate();
  const { walletBalance } = useApp();

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
            You can pay with wallet when you checkout a booking (choose Wallet on the payment step).
          </p>
        </div>

        <div className="bg-card rounded-xl p-4 shadow-card">
          <h2 className="font-display font-semibold text-foreground mb-2">How it works</h2>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4">
            <li>Add services to cart and complete booking as usual.</li>
            <li>On the payment screen, select &quot;Wallet&quot; if your balance covers the total.</li>
            <li>This screen is only for viewing balance — not for booking checkout.</li>
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
