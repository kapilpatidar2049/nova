import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, SlidersHorizontal, X } from "lucide-react";
import { services, categories } from "@/data/mockData";
import ServiceCard from "@/components/ServiceCard";
import BottomNav from "@/components/BottomNav";

const priceRanges = [
  { label: "Under ₹500", min: 0, max: 500 },
  { label: "₹500 – ₹1500", min: 500, max: 1500 },
  { label: "₹1500 – ₹3000", min: 1500, max: 3000 },
  { label: "Above ₹3000", min: 3000, max: Infinity },
];

const sortOptions = [
  { label: "Rating", value: "rating" },
  { label: "Price: Low", value: "price_asc" },
  { label: "Price: High", value: "price_desc" },
  { label: "Most Reviewed", value: "reviews" },
];

const SearchPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("rating");

  const toggleCat = (id: string) =>
    setSelectedCats((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);

  const results = useMemo(() => {
    let filtered = services.filter((s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.category.toLowerCase().includes(query.toLowerCase())
    );
    if (selectedCats.length) filtered = filtered.filter((s) => selectedCats.includes(s.category));
    if (selectedPrice !== null) {
      const range = priceRanges[selectedPrice];
      filtered = filtered.filter((s) => s.price >= range.min && s.price < range.max);
    }
    return filtered.sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      return b.reviews - a.reviews;
    });
  }, [query, selectedCats, selectedPrice, sortBy]);

  const activeFilterCount = selectedCats.length + (selectedPrice !== null ? 1 : 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1 flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services..."
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery("")}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`w-9 h-9 rounded-full flex items-center justify-center relative ${showFilters ? "gradient-primary" : "bg-card shadow-card"}`}
        >
          <SlidersHorizontal className={`w-4 h-4 ${showFilters ? "text-primary-foreground" : "text-foreground"}`} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Category</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCat(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedCats.includes(cat.id) ? "gradient-primary text-primary-foreground" : "bg-card shadow-card text-foreground"
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Price Range</h3>
            <div className="flex flex-wrap gap-2">
              {priceRanges.map((range, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedPrice(selectedPrice === i ? null : i)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedPrice === i ? "gradient-primary text-primary-foreground" : "bg-card shadow-card text-foreground"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Sort By</h3>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    sortBy === opt.value ? "gradient-primary text-primary-foreground" : "bg-card shadow-card text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="px-4">
        <p className="text-xs text-muted-foreground mb-3">{results.length} services found</p>
        <div className="space-y-3">
          {results.map((s) => (
            <ServiceCard key={s.id} service={s} variant="list" />
          ))}
          {results.length === 0 && (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No services found</p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default SearchPage;
