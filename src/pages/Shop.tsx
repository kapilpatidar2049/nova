import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBasket, Plus } from "lucide-react";
import { customerApi } from "@/lib/api";
import type { ShopProduct } from "@/types";
import { useApp } from "@/contexts/AppContext";
import BottomNav from "@/components/BottomNav";

function mapItemToProduct(row: {
  _id: string;
  name: string;
  sellingPrice?: number;
  quantity: number;
  unit?: string;
  imageUrl?: string;
  description?: string;
  vendor?: { name?: string };
}): ShopProduct {
  const price = typeof row.sellingPrice === "number" ? row.sellingPrice : 0;
  return {
    id: row._id,
    name: row.name,
    price,
    image: row.imageUrl || "/placeholder.svg",
    unit: row.unit,
    inStock: row.quantity,
    vendorName: row.vendor?.name,
    description: row.description,
  };
}

const Shop = () => {
  const navigate = useNavigate();
  const { isLoggedIn, addToShopCart, shopCartCount } = useApp();
  const [items, setItems] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isLoggedIn) {
        setLoading(false);
        setItems([]);
        return;
      }
      setLoading(true);
      const res = await customerApi.getShopProducts(1, 80, search);
      if (!cancelled && res.success && res.data?.items) {
        setItems(res.data.items.map(mapItemToProduct));
      } else if (!cancelled) setItems([]);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, search]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-12 pb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-display font-bold text-foreground">Salon Shop</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate("/shop/cart")}
          className="relative w-10 h-10 rounded-full bg-card shadow-card flex items-center justify-center"
        >
          <ShoppingBasket className="w-5 h-5 text-foreground" />
          {shopCartCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-0.5 rounded-full gradient-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
              {shopCartCount > 99 ? "99+" : shopCartCount}
            </span>
          ) : null}
        </button>
      </div>

      <div className="px-4 mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="w-full bg-card rounded-xl px-4 py-3 text-sm border border-border shadow-card outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {!isLoggedIn && (
        <div className="px-4 text-center py-12">
          <p className="text-muted-foreground text-sm mb-4">Sign in to browse products in your city</p>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold"
          >
            Sign in
          </button>
        </div>
      )}

      {isLoggedIn && loading && (
        <p className="text-center text-muted-foreground py-12">Loading products…</p>
      )}

      {isLoggedIn && !loading && items.length === 0 && (
        <p className="text-center text-muted-foreground px-6 py-12">
          No products in your city yet. Ask admin to add inventory for your salon vendor.
        </p>
      )}

      <div className="px-4 grid grid-cols-2 gap-3">
        {items.map((p) => (
          <div key={p.id} className="bg-card rounded-xl overflow-hidden shadow-card flex flex-col">
            <div className="aspect-square bg-muted relative">
              <img src={p.image} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="p-3 flex-1 flex flex-col">
              <p className="text-xs font-semibold text-foreground line-clamp-2 min-h-[2.5rem]">{p.name}</p>
              {p.vendorName ? (
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{p.vendorName}</p>
              ) : null}
              <div className="mt-auto pt-2 flex items-center justify-between gap-1">
                <span className="text-sm font-bold text-foreground">₹{p.price}</span>
                <button
                  type="button"
                  disabled={p.inStock < 1}
                  onClick={() => addToShopCart(p)}
                  className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center disabled:opacity-40"
                >
                  <Plus className="w-4 h-4 text-primary-foreground" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  );
};

export default Shop;
