import { useNavigate } from "react-router-dom";
import { User, Heart, MapPin, Wallet, HelpCircle, LogOut, ChevronRight, Sparkles } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import BottomNav from "@/components/BottomNav";

const Profile = () => {
  const navigate = useNavigate();
  const { user, walletBalance, logout, wishlist } = useApp();

  const menuItems = [
    { icon: Heart, label: "Wishlist", value: `${wishlist.length} items`, action: () => {} },
    { icon: MapPin, label: "My Addresses", action: () => {} },
    { icon: Wallet, label: "Wallet", value: `₹${walletBalance}`, action: () => {} },
    { icon: HelpCircle, label: "Help & Support", action: () => {} },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="gradient-primary px-4 pt-12 pb-8 rounded-b-[1.5rem]">
        <h1 className="text-xl font-display font-bold text-primary-foreground mb-6">Profile</h1>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary-foreground">{user?.name || "User"}</h2>
            <p className="text-sm text-primary-foreground/80">+91 {user?.phone}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              onClick={item.action}
              className={`w-full flex items-center gap-3 px-4 py-4 text-left ${i < menuItems.length - 1 ? "border-b border-border" : ""}`}
            >
              <item.icon className="w-5 h-5 text-primary" />
              <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
              {item.value && <span className="text-xs text-muted-foreground">{item.value}</span>}
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="w-full mt-4 bg-card rounded-xl shadow-card flex items-center gap-3 px-4 py-4 text-left"
        >
          <LogOut className="w-5 h-5 text-destructive" />
          <span className="text-sm font-medium text-destructive">Logout</span>
        </button>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs">GlamBook v1.0</span>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;
