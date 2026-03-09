import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Sparkles, Mail, Lock, ArrowRight, Phone, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { getFCMToken, onFCMMessage } from "@/lib/firebase";

const Login = () => {
  const [mode, setMode] = useState<"phone" | "email" | "signup">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register, sendOtp, loginWithOtp, isLoggedIn } = useApp();
  const navigate = useNavigate();

  // Sign up form state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [otpVerifiedForSignup, setOtpVerifiedForSignup] = useState(false);

  useEffect(() => {
    if (!otpSent) return;
    const unsubscribe = onFCMMessage((payload) => {
      if (payload.data?.type === "otp" && payload.data?.otp) {
        setOtp(payload.data.otp);
      }
    });
    return unsubscribe;
  }, [otpSent]);

  if (isLoggedIn) {
    navigate("/home");
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Taking you home...</p>
      </div>
    );
  }

  const handleSendOtp = async () => {
    const trimmed = phone.replace(/\D/g, "").trim();
    if (trimmed.length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    setError("");
    setLoading(true);
    const fcmToken = await getFCMToken();
    const result = await sendOtp(trimmed.length === 10 ? trimmed : phone, fcmToken);
    setLoading(false);
    if (result.ok) {
      setOtpSent(true);
      setOtp("");
    } else {
      setError(result.error || "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError("Please enter 6-digit OTP");
      return;
    }
    setError("");
    setLoading(true);
    const phoneToUse = phone.replace(/\D/g, "").trim();
    const result = await loginWithOtp(phoneToUse.length === 10 ? phoneToUse : phone, otp);
    setLoading(false);
    if (result.ok) {
      if ((result as { needsSignup?: boolean; phone?: string }).needsSignup && (result as { phone?: string }).phone) {
        setSignupPhone((result as { phone: string }).phone);
        setOtpVerifiedForSignup(true);
        setMode("signup");
        setOtpSent(false);
        setOtp("");
        setError("");
      } else {
        navigate("/home");
      }
    } else {
      setError(result.error || "Invalid OTP");
    }
  };

  const handleEmailSubmit = async () => {
    if (!email.trim() || !password) {
      setError("Please enter email and password");
      return;
    }
    setError("");
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (result.ok) {
      navigate("/home");
    } else {
      setError(result.error || "Login failed");
    }
  };

  const handleSignUp = async () => {
    const trimmedName = signupName.trim();
    const trimmedEmail = signupEmail.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setError("Please enter your name (at least 2 characters)");
      return;
    }
    if (!trimmedEmail) {
      setError("Please enter your email");
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setError("");
    setLoading(true);
    const result = await register({
      name: trimmedName,
      email: trimmedEmail,
      password: signupPassword,
      phone: signupPhone.replace(/\D/g, "").trim() || undefined,
    });
    setLoading(false);
    if (result.ok) {
      navigate("/home");
    } else {
      setError(result.error || "Sign up failed");
    }
  };

  const handleBackToPhone = () => {
    setOtpSent(false);
    setOtp("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="gradient-primary px-6 pt-16 pb-12 rounded-b-[2rem]">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-8 h-8 text-primary-foreground" />
          <h1 className="text-2xl font-display font-bold text-primary-foreground">Nova </h1>
        </div>
        <p className="text-primary-foreground/90 text-lg font-display">Beauty services at your doorstep</p>
      </div>

      <div className="flex-1 px-6 pt-8">
        <h2 className="text-xl font-display font-bold text-foreground mb-1">Welcome</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {mode === "phone" ? "Sign in with your mobile number" : mode === "email" ? "Sign in with email" : "Create your account"}
        </p>

        <Tabs
          value={mode}
          onValueChange={(v) => {
            setMode(v as "phone" | "email" | "signup");
            setError("");
            setOtpSent(false);
            setOtp("");
            if (v !== "signup") setOtpVerifiedForSignup(false);
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="phone" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Phone className="w-3.5 h-3.5" />
              Phone
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Mail className="w-3.5 h-3.5" />
              Login
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <User className="w-3.5 h-3.5" />
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="phone" className="space-y-4 mt-0">
            {!otpSent ? (
              <>
                <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit mobile number"
                    className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                    maxLength={10}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button
                  onClick={handleSendOtp}
                  disabled={loading || phone.replace(/\D/g, "").length < 10}
                  className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-salon"
                >
                  {loading ? "Sending..." : "Send OTP"} <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  OTP sent to {phone || "your number"}. Enter it below.
                </p>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={(v) => setOtp(v)}>
                    <InputOTPGroup className="gap-1">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} className="h-12 w-10 text-base" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {error && <p className="text-sm text-destructive text-center">{error}</p>}
                <button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                  className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-salon"
                >
                  {loading ? "Verifying..." : "Verify & Login"} <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleBackToPhone}
                  disabled={loading}
                  className="w-full text-sm text-muted-foreground py-2"
                >
                  Change number
                </button>
              </>
            )}
          </TabsContent>

          <TabsContent value="email" className="space-y-4 mt-0">
            <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              onClick={handleEmailSubmit}
              disabled={loading}
              className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-salon"
            >
              {loading ? "Signing in..." : "Sign In"} <ArrowRight className="w-4 h-4" />
            </button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 mt-0">
            {otpVerifiedForSignup ? (
              <p className="text-sm text-green-600 dark:text-green-400">OTP verified! Enter your name, email and password to create your account.</p>
            ) : (
              <p className="text-sm text-muted-foreground">Create an account to book beauty services.</p>
            )}
            <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
              <User className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="Full name"
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
              <Mail className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
              <Lock className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="Password (min 6 characters)"
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
              <Phone className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                type="tel"
                value={signupPhone}
                onChange={(e) => setSignupPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Phone (optional)"
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-salon"
            >
              {loading ? "Creating account..." : "Create account"} <ArrowRight className="w-4 h-4" />
            </button>
          </TabsContent>
        </Tabs>
      </div>

      <p className="text-center text-xs text-muted-foreground pb-8 px-6">
        By continuing, you agree to our Terms of Service & Privacy Policy
      </p>
    </div>
  );
};

export default Login;
