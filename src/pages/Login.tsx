import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Sparkles, Phone, ArrowRight } from "lucide-react";

const Login = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const { login } = useApp();
  const navigate = useNavigate();

  const handleSendOtp = () => {
    if (phone.length >= 10) setStep("otp");
  };

  const handleVerify = () => {
    if (otp.length >= 4) {
      login(phone, name || undefined);
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="gradient-primary px-6 pt-16 pb-12 rounded-b-[2rem]">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-8 h-8 text-primary-foreground" />
          <h1 className="text-2xl font-display font-bold text-primary-foreground">GlamBook</h1>
        </div>
        <p className="text-primary-foreground/90 text-lg font-display">Beauty services at your doorstep</p>
      </div>

      <div className="flex-1 px-6 pt-8">
        <h2 className="text-xl font-display font-bold text-foreground mb-1">
          {step === "phone" ? "Welcome" : "Verify OTP"}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {step === "phone" ? "Enter your mobile number to continue" : `OTP sent to +91 ${phone}`}
        </p>

        {step === "phone" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Enter mobile number"
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              onClick={handleSendOtp}
              disabled={phone.length < 10}
              className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-salon"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-3 justify-center">
              {[0, 1, 2, 3].map((i) => (
                <input
                  key={i}
                  type="tel"
                  maxLength={1}
                  value={otp[i] || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    const newOtp = otp.split("");
                    newOtp[i] = val;
                    setOtp(newOtp.join(""));
                    if (val && i < 3) {
                      const next = e.target.nextElementSibling as HTMLInputElement;
                      next?.focus();
                    }
                  }}
                  className="w-14 h-14 text-center text-xl font-bold bg-card border-2 border-border rounded-xl outline-none focus:border-primary text-foreground"
                />
              ))}
            </div>
            <button
              onClick={handleVerify}
              disabled={otp.length < 4}
              className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-salon"
            >
              Verify & Login <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => setStep("phone")} className="w-full text-center text-sm text-primary font-medium">
              Change Number
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground pb-8 px-6">
        By continuing, you agree to our Terms of Service & Privacy Policy
      </p>
    </div>
  );
};

export default Login;
