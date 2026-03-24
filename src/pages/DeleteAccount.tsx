import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import BottomNav from "@/components/BottomNav";

const DeleteAccount = () => {
  const navigate = useNavigate();
  const { deleteAccount } = useApp();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setError("");
    if (password.length < 6) {
      setError("Enter your account password to confirm");
      return;
    }
    if (!window.confirm("Delete your account permanently? You will be signed out.")) return;
    setLoading(true);
    const res = await deleteAccount(password);
    setLoading(false);
    if (res.ok) {
      navigate("/login", { replace: true });
    } else {
      setError(res.error || "Could not delete account");
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
        <h1 className="text-xl font-display font-bold text-foreground">Delete account</h1>
      </div>

      <div className="px-4 space-y-4">
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="w-6 h-6 text-destructive shrink-0" />
          <p className="text-sm text-foreground">
            Your profile will be deactivated. You will need to contact support if you want to use the same email again.
          </p>
        </div>

        <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
          <label className="text-xs text-muted-foreground">Confirm with your password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            autoComplete="current-password"
            placeholder="Current password"
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold bg-destructive text-destructive-foreground disabled:opacity-50"
          >
            {loading ? "Deleting…" : "Delete my account"}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default DeleteAccount;
