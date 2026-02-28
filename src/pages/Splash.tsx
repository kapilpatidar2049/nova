import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

const Splash = () => {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 2000);
    const t2 = setTimeout(() => navigate("/home", { replace: true }), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [navigate]);

  return (
    <div
      className={`min-h-screen gradient-primary flex flex-col items-center justify-center gap-4 transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="w-20 h-20 rounded-full bg-primary-foreground/20 flex items-center justify-center animate-pulse">
        <Sparkles className="w-10 h-10 text-primary-foreground" />
      </div>
      <h1 className="text-3xl font-display font-bold text-primary-foreground tracking-tight">
        GlamBook
      </h1>
      <p className="text-primary-foreground/70 text-sm">Beauty at your doorstep</p>
      <div className="mt-8 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary-foreground/60 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default Splash;
