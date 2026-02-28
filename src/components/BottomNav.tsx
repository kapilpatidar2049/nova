import { Home, Search, ShoppingBag, ClipboardList, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount } = useApp();

  const tabs = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: Search, label: "Search", path: "/search" },
    { icon: ShoppingBag, label: "Cart", path: "/cart", badge: cartCount },
    { icon: ClipboardList, label: "Orders", path: "/orders" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  const isActive = (path: string) => {
    if (path === "/home") return location.pathname === "/home";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-salon">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 relative transition-colors ${
              isActive(tab.path) ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.badge ? (
              <span className="absolute -top-0.5 right-1 w-4 h-4 rounded-full gradient-primary text-primary-foreground text-[10px] flex items-center justify-center font-semibold">
                {tab.badge}
              </span>
            ) : null}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
