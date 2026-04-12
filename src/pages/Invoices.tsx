import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, FileText } from "lucide-react";
import { customerApi } from "@/lib/api";
import BottomNav from "@/components/BottomNav";

const Invoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await customerApi.getInvoices();
        if (res.success && res.data) {
          setInvoices(res.data.items || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate("/profile")} className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-display font-bold text-foreground">My Invoices</h1>
      </div>

      <div className="px-4 space-y-3">
        {loading && (
          <p className="text-center text-sm text-muted-foreground py-12">Loading your invoices…</p>
        )}
        {!loading && invoices.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">No invoices available</p>
            <p className="text-xs text-muted-foreground mt-1">Check back after your service is completed</p>
          </div>
        )}
        {invoices.map((inv) => (
          <button
            key={inv._id}
            onClick={() => navigate(`/profile/invoices/${inv._id}`)}
            className="w-full bg-card rounded-xl p-4 shadow-sm flex items-center gap-3 text-left border border-border/40 transition-active transform active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
               <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-foreground truncate">{inv.invoiceNumber}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 capitalize">
                  {inv.status}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{inv.title} • {inv.vendorName}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">{new Date(inv.date).toLocaleDateString()}</p>
                <p className="text-sm font-bold text-primary">₹{inv.amount}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
      <BottomNav />
    </div>
  );
};

export default Invoices;
