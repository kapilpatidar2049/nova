import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Plus, CalendarDays, Clock, User, Check, Navigation, Loader2 } from "lucide-react";
import { Autocomplete, useLoadScript } from "@react-google-maps/api";
import { useApp } from "@/contexts/AppContext";
import { timeSlots } from "@/data/constants";

const Booking = () => {
  const navigate = useNavigate();
  const { cart, cartTotal } = useApp();
  const [step, setStep] = useState(1);

  // Address fields
  const [addressLine, setAddressLine] = useState("");
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [autocomplete, setAutocomplete] = useState<any>(null);

  const { isLoaded: mapsLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"]
  });

  const fullAddress = [building, floor ? `Floor ${floor}` : "", addressLine, landmark, city]
    .filter((part) => part && part.trim() !== "")
    .join(", ");

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState("");

  const dates = Array.from({ length: 7 }, (_, i) => {
    try {
      const d = new Date();
      d.setDate(d.getDate() + i + 1);
      if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
      return {
        date: d.toISOString().split("T")[0],
        day: d.toLocaleDateString("en", { weekday: "short" }),
        num: d.getDate(),
      };
    } catch {
      const t = Date.now() + (i + 1) * 86400000;
      const y = new Date(t).getUTCFullYear();
      const m = new Date(t).getUTCMonth() + 1;
      const dayNum = new Date(t).getUTCDate();
      return {
        date: `${y}-${String(m).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`,
        day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(t).getUTCDay()] ?? "—",
        num: dayNum,
      };
    }
  });

  const canProceed = () => {
    if (step === 1) return addressLine.trim().length > 0 && city.trim().length > 0;
    if (step === 2) return selectedDate && selectedTime;
    return true;
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else navigate("/payment", { state: { address: fullAddress, lat, lng, date: selectedDate, time: selectedTime } });
  };

  const handlePlaceChanged = () => {
    if (!autocomplete) return;
    const place = autocomplete.getPlace();
    const formatted = place.formatted_address || "";
    setAddressLine(formatted);

    const cityComp = (place.address_components || []).find((c: any) =>
      c.types.includes("locality") || c.types.includes("administrative_area_level_2") || c.types.includes("administrative_area_level_1")
    );
    if (cityComp) setCity(cityComp.long_name);

    if (place.geometry?.location) {
      setLat(place.geometry.location.lat());
      setLng(place.geometry.location.lng());
    }
  };

  const fetchCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        setLat(latitude);
        setLng(longitude);
        try {
          const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
          if (key) {
            const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${key}`);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              const resObj = data.results[0];
              setAddressLine(resObj.formatted_address || "");
              const cityComp = resObj.address_components.find((c: any) => c.types.includes("locality"));
              if (cityComp) setCity(cityComp.long_name);
            }
          }
        } catch (e) {
          console.error("Reverse geocode failed", e);
        } finally {
          setFetchingLocation(false);
        }
      },
      (err) => {
        alert("Could not fetch location. Please ensure location permissions are enabled.");
        setFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="px-4 md:px-0 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-display font-bold text-foreground">Book Service</h1>
      </div>

      {/* Steps indicator */}
      <div className="px-4 md:px-0 mb-6">
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

      <div className="px-4 md:px-0">
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-foreground">Service Address</h2>
              <button 
                onClick={fetchCurrentLocation} 
                disabled={fetchingLocation}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary/90 bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
                type="button"
              >
                {fetchingLocation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                {fetchingLocation ? "Getting Location..." : "Use Current Location"}
              </button>
            </div>
            
            <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
              <div className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Full Address / Street
                  </label>
                  {mapsLoaded ? (
                    <Autocomplete
                      onLoad={(ac) => setAutocomplete(ac)}
                      onPlaceChanged={handlePlaceChanged}
                    >
                      <input
                        type="text"
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                        placeholder="Enter your street or full address"
                        autoComplete="street-address"
                        className="w-full bg-transparent border-b border-border pb-2 outline-none text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary transition-colors"
                      />
                    </Autocomplete>
                  ) : (
                    <input
                      type="text"
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      placeholder="Enter your street or full address"
                      autoComplete="street-address"
                      className="w-full bg-transparent border-b border-border pb-2 outline-none text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary transition-colors"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Building / Flat No.</label>
                    <input
                      type="text"
                      value={building}
                      onChange={(e) => setBuilding(e.target.value)}
                      placeholder="e.g. A-42, Sunshine Apts"
                      className="w-full bg-transparent border-b border-border pb-2 outline-none text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Floor (Optional)</label>
                    <input
                      type="text"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      placeholder="e.g. 4th Floor"
                      className="w-full bg-transparent border-b border-border pb-2 outline-none text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Landmark (Optional)</label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near Metro Station"
                    className="w-full bg-transparent border-b border-border pb-2 outline-none text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">City *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter your city"
                    className="w-full bg-transparent border-b border-border pb-2 outline-none text-sm font-semibold text-foreground placeholder:text-muted-foreground/60 focus:border-primary transition-colors"
                  />
                </div>
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
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 mt-3">
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

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="px-4 md:px-8 lg:px-12 xl:px-16 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-lg font-bold text-foreground">₹{cartTotal}</span>
          </div>
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-salon disabled:opacity-50 md:text-lg md:py-4"
          >
            {step < 3 ? "Continue" : "Proceed to Payment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Booking;
