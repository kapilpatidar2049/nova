import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, UserRound, Camera } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import { authApi } from "@/lib/api";
import BottomNav from "@/components/BottomNav";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, updateProfile, refreshProfile } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.profileImageUrl || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setUploading(true);
    try {
      const res = await authApi.uploadProfileImage(file);
      if (res.success && res.data?.profileImageUrl) {
        setAvatarUrl(res.data.profileImageUrl);
        await refreshProfile();
        toast.success("Profile photo updated");
      } else {
        toast.error((res as { message?: string }).message || "Upload failed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError("");
    setSuccess("");
    setSaving(true);
    const result = await updateProfile({ name: name.trim(), phone: phone.trim() || undefined });
    setSaving(false);
    if (result.ok) {
      setSuccess("Profile updated");
    } else {
      setError(result.error || "Could not update profile");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-display font-bold text-foreground">Edit profile</h1>
      </div>

      <div className="px-4 space-y-4">
        <div className="bg-card rounded-xl p-4 shadow-card space-y-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserRound className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary"
            >
              <Camera className="w-4 h-4" />
              {uploading ? "Uploading…" : "Change photo"}
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <UserRound className="w-4 h-4 text-primary" />
            Account details
          </div>
          <div>
            <label htmlFor="edit-name" className="text-xs text-muted-foreground">
              Name
            </label>
            <input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
              placeholder="Your name"
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="edit-phone" className="text-xs text-muted-foreground">
              Phone
            </label>
            <input
              id="edit-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
              placeholder="Mobile number"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
          <div>
            <label htmlFor="edit-email" className="text-xs text-muted-foreground">
              Email
            </label>
            <input
              id="edit-email"
              value={user?.email || ""}
              readOnly
              className="mt-1 w-full rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here.</p>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {success ? <p className="text-sm text-primary font-medium">{success}</p> : null}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-salon flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default EditProfile;
