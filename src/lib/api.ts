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

export function setUser(user: { id: string; name: string; email: string; phone?: string }) {
  localStorage.setItem("customer_user", JSON.stringify(user));
}

export function getUser(): { id: string; name: string; email: string; phone?: string } | null {
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
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
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
  register: (body: { name: string; email: string; password: string; phone?: string; cityId?: string }) =>
    request<{ user: { id: string; name: string; email: string; role: string }; tokens: { accessToken: string; refreshToken: string } }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify(body) }
    ),
  profile: () =>
    request<{ name: string; email: string; phone?: string }>("/auth/profile"),
};

// Customer
export const customerApi = {
  getServices: (page = 1, limit = 50, search = "") =>
    request<{
      items: Array<{
        _id: string;
        name: string;
        category?: string;
        description?: string;
        imageUrl?: string;
        basePrice: number;
        durationMinutes: number;
      }>;
      meta: unknown;
    }>(
      "/customer/services",
      { params: { page: String(page), limit: String(limit), ...(search.trim() ? { search: search.trim() } : {}) } }
    ),
  getAppointments: (page = 1, limit = 50, status = "") =>
    request<{
      items: Array<{
        _id: string;
        service: { _id: string; name: string; basePrice: number; durationMinutes: number };
        beautician?: { _id: string; name: string };
        scheduledAt: string;
        address: string;
        status: string;
        price: number;
        createdAt: string;
      }>;
      meta: unknown;
    }>("/customer/appointments", { params: { page: String(page), limit: String(limit), ...(status.trim() ? { status: status.trim() } : {}) } }),
  getAppointmentById: (id: string) =>
    request<{
      _id: string;
      service: { _id: string; name: string; basePrice: number; durationMinutes: number };
      beautician?: { _id: string; name: string };
      scheduledAt: string;
      address: string;
      status: string;
      price: number;
      createdAt: string;
    }>(`/customer/appointments/${id}`),
  createAppointment: (body: { serviceId: string; scheduledAt: string; address: string; lat: number; lng: number; price: number }) =>
    request<{ _id: string }>("/customer/appointments", { method: "POST", body: JSON.stringify(body) }),
  cancelAppointment: (id: string) =>
    request(`/customer/appointments/${id}/cancel`, { method: "PUT" }),
  track: (appointmentId: string) =>
    request<{ beauticianLocation: { coordinates: [number, number] }; eta?: { etaInMinutes?: number; distanceInKm?: number } }>(
      `/customer/track/${appointmentId}`
    ),
  initiatePayment: (appointmentId: string) =>
    request<{ paymentId: string; orderId: string; amount: number; currency: string }>(
      "/customer/payment/initiate",
      { method: "POST", body: JSON.stringify({ appointmentId }) }
    ),
  verifyPayment: (body: { paymentId: string; providerPaymentId: string; providerSignature: string }) =>
    request("/customer/payment/verify", { method: "POST", body: JSON.stringify(body) }),
  getInvoices: (page = 1, limit = 20) =>
    request<{ items: unknown[]; meta: unknown }>("/customer/invoices", { params: { page: String(page), limit: String(limit) } }),
};

export function mapApiServiceToUi(
  item: {
    _id: string;
    name: string;
    category?: string;
    description?: string;
    imageUrl?: string;
    basePrice: number;
    durationMinutes: number;
  },
  defaultImage: string,
): import("@/types").Service {
  const category = (item.category || "Other").toLowerCase();
  return {
    id: item._id,
    name: item.name,
    category,
    price: item.basePrice,
    rating: 4.5,
    reviews: 0,
    duration: `${item.durationMinutes} min`,
    image: item.imageUrl || defaultImage,
    description: item.description || "",
    includes: [],
  };
}
