const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken(): string | null {
  return localStorage.getItem("customer_token");
}

function getRefreshToken(): string | null {
  return localStorage.getItem("customer_refresh_token");
}

export function setAuthTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("customer_token", accessToken);
  localStorage.setItem("customer_refresh_token", refreshToken);
}

export function clearAuth() {
  localStorage.removeItem("customer_token");
  localStorage.removeItem("customer_refresh_token");
  localStorage.removeItem("customer_user");
}

export function setUser(user: { id: string; name: string; email: string; phone?: string; profileImageUrl?: string | null }) {
  localStorage.setItem("customer_user", JSON.stringify(user));
}

export function getUser(): { id: string; name: string; email: string; phone?: string; profileImageUrl?: string | null } | null {
  const s = localStorage.getItem("customer_user");
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  const { params, ...init } = options;
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== "" && v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  const token = getToken();
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };
  if (!(init.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url.toString(), { ...init, headers });
  const json = await res.json().catch(() => ({}));

  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await refreshToken();
    if (refreshed) return request<T>(path, options);
  }

  if (!res.ok) {
    throw new Error(json.message || "Request failed");
  }
  return json;
}

async function refreshToken(): Promise<boolean> {
  const ref = getRefreshToken();
  if (!ref) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: ref }),
    });
    const json = await res.json();
    if (json.success && json.data?.tokens) {
      setAuthTokens(json.data.tokens.accessToken, json.data.tokens.refreshToken);
      if (json.data.user) setUser(json.data.user);
      return true;
    }
  } catch {
    // ignore
  }
  clearAuth();
  return false;
}

// Auth
export const authApi = {
  registerFcmToken: (token: string) =>
    request("/auth/fcm-token", { method: "POST", body: JSON.stringify({ token }) }),
  login: (email: string, password: string) =>
    request<{ user: { id: string; name: string; email: string; role: string; phone?: string }; tokens: { accessToken: string; refreshToken: string } }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    ),
  sendOtp: (phone: string, fcmToken?: string | null) =>
    request<{ sent: boolean }>("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone, role: "customer", ...(fcmToken ? { fcmToken } : {}) }),
    }),
  verifyOtp: (phone: string, otp: string) =>
    request<{
      user: { id: string; name: string; email: string; role: string; phone?: string };
      tokens: { accessToken: string; refreshToken: string };
      needsSignup?: boolean;
      phone?: string;
    }>("/auth/verify-otp", { method: "POST", body: JSON.stringify({ phone, otp, role: "customer" }) }),
  register: (body: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    cityId?: string;
    referralCode?: string;
  }) =>
    request<{ user: { id: string; name: string; email: string; role: string }; tokens: { accessToken: string; refreshToken: string } }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify(body) }
    ),
  profile: () =>
    request<{
      name: string;
      email: string;
      phone?: string;
      id?: string;
      _id?: string;
      walletBalance?: number;
      profileImage?: string;
      profileImageUrl?: string | null;
      rating?: number;
      ratingCount?: number;
    }>("/auth/profile"),
  uploadProfileImage: (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return request<{
      name: string;
      email: string;
      phone?: string;
      profileImage?: string;
      profileImageUrl?: string | null;
    }>("/auth/profile-image", { method: "POST", body: formData });
  },
  updateProfile: (body: { name?: string; phone?: string }) =>
    request<{ name: string; email: string; phone?: string; id?: string; _id?: string }>("/auth/update-profile", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request("/auth/change-password", { method: "POST", body: JSON.stringify(body) }),
  deleteAccount: (body: { password: string }) =>
    request("/auth/delete-account", { method: "POST", body: JSON.stringify(body) }),
};

// Banners & Categories (for home screen)
export interface ApiBanner {
  _id: string;
  title: string;
  imageUrl: string;
  link?: string;
  order?: number;
}

export interface ApiCategory {
  _id: string;
  name: string;
  imageUrl?: string;
  order?: number;
}

// Customer
export const customerApi = {
  getBanners: () =>
    request<{ items: ApiBanner[] }>("/customer/banners"),
  getCategories: () =>
    request<{ items: ApiCategory[] }>("/customer/categories"),
  getServices: (page = 1, limit = 50, search = "") =>
    request<{
      items: Array<{
        _id: string;
        name: string;
        category?: { _id: string; name: string; imageUrl?: string } | string | null;
        description?: string;
        includes?: string[];
        imageUrl?: string;
        basePrice: number;
        durationMinutes: number;
      }>;
      meta: unknown;
    }>(
      "/customer/services",
      { params: { page: String(page), limit: String(limit), ...(search.trim() ? { search: search.trim() } : {}) } }
    ),
  getServiceById: (id: string) =>
    request<{
      _id: string;
      name: string;
      category?: { _id: string; name: string; imageUrl?: string } | string | null;
      description?: string;
      includes?: string[];
      imageUrl?: string;
      basePrice: number;
      durationMinutes: number;
    }>(`/customer/services/${id}`),
  getAppointments: (page = 1, limit = 50, status = "") =>
    request<{
      items: Array<{
        _id: string;
        service: { _id: string; name: string; basePrice: number; durationMinutes: number };
        beautician?: { _id: string; name: string; servicesCompleted?: number; rating?: number; experienceYears?: number };
        scheduledAt: string;
        address: string;
        status: string;
        price: number;
        paymentMode?: string;
        createdAt: string;
      }>;
      meta: unknown;
    }>("/customer/appointments", { params: { page: String(page), limit: String(limit), ...(status.trim() ? { status: status.trim() } : {}) } }),
  getAppointmentById: (id: string) =>
    request<{
      _id: string;
      service: { _id: string; name: string; basePrice: number; durationMinutes: number };
      beautician?: { _id: string; name: string; servicesCompleted?: number; rating?: number; experienceYears?: number };
      scheduledAt: string;
      address: string;
      status: string;
      price: number;
      paymentMode?: string;
      createdAt: string;
    }>(`/customer/appointments/${id}`),
  createAppointment: (body: {
    serviceId: string;
    scheduledAt: string;
    address: string;
    lat: number;
    lng: number;
    price: number;
    paymentMode?: "online" | "cod" | "wallet";
    /** Beautician User id — assign + notify this expert when chosen */
    beauticianUserId?: string;
  }) => request<{ _id: string }>("/customer/appointments", { method: "POST", body: JSON.stringify(body) }),
  cancelAppointment: (id: string) =>
    request(`/customer/appointments/${id}/cancel`, { method: "PUT" }),
  track: (appointmentId: string) =>
    request<{ beauticianLocation: { coordinates: [number, number] }; eta?: { etaInMinutes?: number; distanceInKm?: number } }>(
      `/customer/track/${appointmentId}`
    ),
  initiatePayment: (args: { appointmentId: string } | { productOrderId: string }) =>
    request<{
      paymentId: string;
      orderId: string;
      amount: number;
      amountPaise?: number;
      currency: string;
      keyId: string;
      mode: "test" | "live";
    }>("/customer/payment/initiate", { method: "POST", body: JSON.stringify(args) }),
  initiateWalletRecharge: (amount: number) =>
    request<{
      paymentId: string;
      orderId: string;
      amount: number;
      amountPaise?: number;
      currency: string;
      keyId: string;
      mode: "test" | "live";
    }>("/customer/wallet/recharge/initiate", { method: "POST", body: JSON.stringify({ amount }) }),
  verifyPayment: (body: { paymentId: string; providerPaymentId: string; providerSignature: string }) =>
    request("/customer/payment/verify", { method: "POST", body: JSON.stringify(body) }),
  getInvoices: (page = 1, limit = 20) =>
    request<{ items: unknown[]; meta: unknown }>("/customer/invoices", { params: { page: String(page), limit: String(limit) } }),
  getBeauticianSummary: (beauticianUserId: string) =>
    request<{
      id: string;
      name: string;
      phone: string;
      profileImageUrl: string | null;
      rating: number;
      experienceYears: number;
      expertise: string[];
      servicesCompleted: number;
    }>(`/customer/beauticians/${beauticianUserId}/summary`),
  getPendingRatings: () =>
    request<{
      items: Array<{
        _id: string;
        service?: { name?: string };
        beautician?: { name?: string };
        completedAt?: string;
      }>;
    }>("/customer/appointments/pending-ratings"),
  rateAppointment: (appointmentId: string, body: { stars: number; comment?: string }) =>
    request("/customer/appointments/" + appointmentId + "/rate", { method: "POST", body: JSON.stringify(body) }),

  getShopProducts: (page = 1, limit = 50, search = "") =>
    request<{
      items: Array<{
        _id: string;
        name: string;
        sku?: string;
        quantity: number;
        unit?: string;
        sellingPrice?: number;
        imageUrl?: string;
        description?: string;
        vendor?: { _id: string; name?: string };
      }>;
      meta: unknown;
    }>("/customer/shop/products", {
      params: { page: String(page), limit: String(limit), ...(search.trim() ? { search: search.trim() } : {}) },
    }),
  createProductOrder: (body: {
    items: { inventoryItemId: string; quantity: number }[];
    address: string;
    lat?: number;
    lng?: number;
    paymentMode?: "online" | "cod" | "wallet";
  }) =>
    request<{
      _id: string;
      totalAmount: number;
      status: string;
      paymentMode: string;
    }>("/customer/shop/orders", { method: "POST", body: JSON.stringify(body) }),
  getProductOrders: (page = 1, limit = 50) =>
    request<{
      items: Array<{
        _id: string;
        items: Array<{ name: string; quantity: number; lineTotal: number; unitPrice: number }>;
        address: string;
        totalAmount: number;
        status: string;
        paymentMode: string;
        createdAt: string;
        vendor?: { name?: string };
      }>;
      meta: unknown;
    }>("/customer/shop/orders", { params: { page: String(page), limit: String(limit) } }),
  getProductOrderById: (id: string) =>
    request<{
      _id: string;
      items: Array<{ name: string; quantity: number; lineTotal: number; unitPrice: number }>;
      address: string;
      totalAmount: number;
      status: string;
      paymentMode: string;
      createdAt: string;
      vendor?: { name?: string };
    }>(`/customer/shop/orders/${id}`),
  cancelProductOrder: (id: string) =>
    request(`/customer/shop/orders/${id}/cancel`, { method: "PUT" }),
  getReferral: () =>
    request<{
      referralCode: string | null;
      isEnabled: boolean;
      customerRewardAmount: number;
      beauticianRewardAmount: number;
      shareMessage: string;
    }>("/customer/referral"),
};

export function mapApiServiceToUi(
  item: {
    _id: string;
    name: string;
    category?: { _id: string; name: string; imageUrl?: string } | string | null;
    description?: string;
    includes?: string[];
    imageUrl?: string;
    basePrice: number;
    durationMinutes: number;
  },
  defaultImage: string,
): import("@/types").Service {
  const cat = item.category;
  const category =
    typeof cat === "object" && cat && "name" in cat
      ? cat.name.toLowerCase()
      : (cat || "other").toString().toLowerCase();
  const categoryId = typeof cat === "object" && cat && "_id" in cat ? cat._id : undefined;
  const rawId = item._id != null ? String(item._id) : "";
  const priceNum = typeof item.basePrice === "number" ? item.basePrice : Number(item.basePrice);
  return {
    id: rawId,
    name: item.name,
    category,
    categoryId,
    price: Number.isFinite(priceNum) ? priceNum : 0,
    rating: 4.5,
    reviews: 0,
    duration: `${item.durationMinutes} min`,
    image: item.imageUrl || defaultImage,
    description: item.description || "",
    includes: item.includes && Array.isArray(item.includes) ? item.includes : [],
  };
}
