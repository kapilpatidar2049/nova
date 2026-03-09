import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Plus, CalendarDays, Clock, User, Check } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { timeSlots } from "@/data/constants";

const Booking = () => {
  const navigate = useNavigate();
  const { cart, cartTotal } = useApp();
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState("");

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return { date: d.toISOString().split("T")[0], day: d.toLocaleDateString("en", { weekday: "short" }), num: d.getDate() };
  });

  const canProceed = () => {
    if (step === 1) return address.length > 0;
    if (step === 2) return selectedDate && selectedTime;
    return true;
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else navigate("/payment", { state: { address, date: selectedDate, time: selectedTime } });
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-display font-bold text-foreground">Book Service</h1>
      </div>

      {/* Steps indicator */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                s <= step ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 ${s < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">Address</span>
          <span className="text-[10px] text-muted-foreground">Schedule</span>
          <span className="text-[10px] text-muted-foreground">Expert</span>
        </div>
      </div>

      <div className="px-4">
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="font-display font-bold text-foreground">Service Address</h2>
            <div className="bg-card rounded-xl p-4 shadow-card border-2 border-border">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter full address for service"
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="font-display font-bold text-foreground flex items-center gap-2"><CalendarDays className="w-5 h-5 text-primary" /> Select Date</h2>
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {dates.map((d) => (
                  <button
                    key={d.date}
                    onClick={() => setSelectedDate(d.date)}
                    className={`min-w-[3.5rem] py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      selectedDate === d.date ? "gradient-primary text-primary-foreground shadow-salon" : "bg-card shadow-card text-foreground"
                    }`}
                  >
                    <span className="text-xs font-medium">{d.day}</span>
                    <span className="text-lg font-bold">{d.num}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h2 className="font-display font-bold text-foreground flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Select Time</h2>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {timeSlots.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={`py-2.5 rounded-lg text-xs font-medium transition-all ${
                      selectedTime === t ? "gradient-primary text-primary-foreground shadow-salon" : "bg-card shadow-card text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="font-display font-bold text-foreground flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Expert</h2>
            <div className="p-4 rounded-xl border-2 border-primary bg-accent">
              <span className="text-sm font-semibold text-foreground">Auto Assign</span>
              <p className="text-xs text-muted-foreground mt-0.5">We'll assign the best available expert for your booking.</p>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-lg font-bold text-foreground">₹{cartTotal}</span>
        </div>
        <button
          onClick={handleNext}
          disabled={!canProceed()}
          className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-salon disabled:opacity-50"
        >
          {step < 3 ? "Continue" : "Proceed to Payment"}
        </button>
      </div>
    </div>
  );
};

export default Booking;
