import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const StaticPage = ({ title }: { title: string }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-display font-bold text-foreground">{title}</h1>
      </div>
      <div className="px-4">
        <div className="bg-card rounded-xl p-4 shadow-card text-sm text-muted-foreground leading-6">
          This section is now linked and ready. Replace this text with your official {title.toLowerCase()} content.
        </div>
      </div>
    </div>
  );
};

export default StaticPage;
