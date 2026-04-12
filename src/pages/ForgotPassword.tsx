import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Sparkles, ArrowLeft, Phone, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { getFCMToken } from "@/lib/firebase";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [step, setStep] = useState<"phone" | "otp" | "reset">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { sendOtp, resetPassword } = useApp();
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    const trimmed = phone.replace(/\D/g, "").trim();
    if (trimmed.length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    setError("");
    setLoading(true);
    const fcmToken = await getFCMToken();
    const result = await sendOtp(trimmed, fcmToken);
    setLoading(false);
    if (result.ok) {
      setStep("otp");
      toast.success("OTP sent successfully");
    } else {
      setError(result.error || "Failed to send OTP");
    }
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 6) {
      setError("Please enter 6-digit OTP");
      return;
    }
    setError("");
    setStep("reset");
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const result = await resetPassword({
      phone: phone.replace(/\D/g, "").trim(),
      otp,
      newPassword,
    });
    setLoading(false);
    if (result.ok) {
      toast.success("Password reset successfully. Please login.");
      navigate("/login");
    } else {
      setError(result.error || "Failed to reset password");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="gradient-primary px-6 pt-16 pb-12 rounded-b-[2rem]">
        <button 
          onClick={() => step === "phone" ? navigate(-1) : setStep(step === "reset" ? "otp" : "phone")}
          className="mb-6 p-2 bg-white/20 rounded-full text-primary-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-8 h-8 text-primary-foreground" />
          <h1 className="text-2xl font-display font-bold text-primary-foreground">Reset Password</h1>
        </div>
        <p className="text-primary-foreground/90 text-lg">
          {step === "phone" ? "Enter your registered mobile number" : 
           step === "otp" ? "Enter the OTP sent to your phone" : 
           "Set your new password"}
        </p>
      </div>

      <div className="flex-1 px-6 pt-8 space-y-6">
        {step === "phone" && (
          <>
            <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit mobile number"
                className="flex-1 bg-transparent outline-none text-foreground"
                maxLength={10}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              onClick={handleSendOtp}
              disabled={loading || phone.length < 10}
              className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send OTP"} <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}

        {step === "otp" && (
          <>
            <div className="flex justify-center py-4">
              <InputOTP maxLength={6} value={otp} onChange={(v) => setOtp(v)}>
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} className="h-14 w-12 text-lg border-2" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <button
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6}
              className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              Verify OTP <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full text-sm text-primary font-medium"
            >
              Resend OTP
            </button>
          </>
        )}

        {step === "reset" && (
          <>
            <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password (min 6 characters)"
                className="flex-1 bg-transparent outline-none text-foreground"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              onClick={handleResetPassword}
              disabled={loading || newPassword.length < 6}
              className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"} <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
