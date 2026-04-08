import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { Service, BookingOrder, Beautician, ShopProduct } from "@/types";
import {
  setAuthTokens,
  clearAuth,
  setUser,
  getUser,
  customerApi,
  authApi,
} from "@/lib/api";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { getFCMToken, isFirebaseConfigured, onFCMMessage } from "@/lib/firebase";
import { toast } from "sonner";
import { timeSlotToISOTime } from "@/lib/bookingTime";

const DEFAULT_IMG = "";

interface CartItem {
  service: Service;
  quantity: number;
}

interface ShopCartItem {
  product: ShopProduct;
  quantity: number;
}

interface AppState {
  isLoggedIn: boolean;
  user: { name: string; phone: string; email: string; profileImageUrl?: string | null } | null;
  cart: CartItem[];
  shopCart: ShopCartItem[];
  wishlist: string[];
  orders: BookingOrder[];
  walletBalance: number;
  servicesLoading: boolean;
  ordersLoading: boolean;
  /** First completed appointment that still needs customer→beautician rating (mandatory before new bookings). */
  pendingRatingAppointmentId: string | null;
}

interface AppContextType extends AppState {
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (body: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    referralCode?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  sendOtp: (phone: string, fcmToken?: string | null) => Promise<{ ok: boolean; error?: string }>;
  loginWithOtp: (phone: string, otp: string) => Promise<{ ok: boolean; error?: string }>;
  loginWithPhone?: (phone: string, name?: string) => void;
  logout: () => void;
  addToCart: (service: Service) => void;
  removeFromCart: (serviceId: string) => void;
  updateQuantity: (serviceId: string, qty: number) => void;
  clearCart: () => void;
  addToShopCart: (product: ShopProduct) => void;
  removeFromShopCart: (productId: string) => void;
  updateShopQuantity: (productId: string, qty: number) => void;
  clearShopCart: () => void;
  shopCartTotal: number;
  shopCartCount: number;
  placeShopOrder: (
    address: string,
    paymentMode: string,
    options?: { processOnlinePayment?: boolean }
  ) => Promise<string | null>;
  toggleWishlist: (serviceId: string) => void;
  cartTotal: number;
  cartCount: number;
  createOrder: (
    order: Omit<BookingOrder, "id" | "createdAt">,
    options?: { processOnlinePayment?: boolean }
  ) => Promise<string | null>;
  cancelOrder: (orderId: string, kind?: "service" | "product") => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (payload: { name?: string; phone?: string }) => Promise<{ ok: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  deleteAccount: (password: string) => Promise<{ ok: boolean; error?: string }>;
  rechargeWallet: (amount: number) => Promise<{ ok: boolean; error?: string }>;
  refreshPendingRatings: () => Promise<void>;
}

function mapPaymentModeToDisplay(mode: string | undefined): string {
  const m = String(mode ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (m === "cod" || m === "cash_on_delivery") return "Cash on Delivery";
  if (m === "wallet") return "Wallet";
  if (m === "online") return "Online Payment";
  return m ? m.replace(/_/g, " ") : "Not specified";
}

/** Accept API values or UI labels so createOrder always sends online | cod | wallet. */
function normalizePaymentModeForApi(mode: string | undefined): "online" | "cod" | "wallet" {
  const m = String(mode ?? "online")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (m === "cod" || m === "cash_on_delivery") return "cod";
  if (m === "wallet") return "wallet";
  if (m === "online" || m === "online_payment") return "online";
  return "online";
}

function mapApiAppointmentToOrder(item: {
  _id: string;
  service?: { _id: string; name: string; basePrice: number; durationMinutes: number } | null;
  beautician?: {
    _id: string;
    name: string;
    phone?: string;
    servicesCompleted?: number;
    rating?: number;
    experienceYears?: number;
    profileImageUrl?: string | null;
  };
  scheduledAt?: string | null;
  address: string;
  status: string;
  price: number;
  paymentMode?: string;
  createdAt?: string;
  serviceStartOtp?: string | null;
}): BookingOrder {
  const statusMap: Record<string, BookingOrder["status"]> = {
    pending: "booked",
    accepted: "assigned",
    in_transit: "on_the_way",
    reached: "reached",
    in_progress: "started",
    completed: "completed",
    cancelled: "cancelled",
    rejected: "cancelled",
  };
  const status = statusMap[item.status] || "booked";

  const svc = item.service;
  const hasService = svc != null && typeof svc === "object" && "_id" in svc;
  const serviceId = hasService ? String((svc as { _id: string })._id) : String(item._id);
  const serviceName = hasService && "name" in svc ? String((svc as { name: string }).name) : "Service";
  const basePrice =
    hasService && "basePrice" in svc && typeof (svc as { basePrice?: number }).basePrice === "number"
      ? (svc as { basePrice: number }).basePrice
      : item.price;
  const durationMinutes =
    hasService && "durationMinutes" in svc && typeof (svc as { durationMinutes?: number }).durationMinutes === "number"
      ? (svc as { durationMinutes: number }).durationMinutes
      : 60;
  let timeSlot = "10:00 AM";
  let dateStr = new Date().toISOString().split("T")[0];
  try {
    const d = item.scheduledAt ? new Date(item.scheduledAt) : new Date();
    if (!Number.isNaN(d.getTime())) {
      timeSlot = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      // Local calendar date must match local timeSlot — UTC ISO date breaks countdown parsing.
      const y = d.getFullYear();
      const mo = d.getMonth() + 1;
      const day = d.getDate();
      dateStr = `${y}-${String(mo).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  } catch {
    // keep defaults on any date error
  }
  return {
    id: String(item._id),
    kind: "service",
    services: [
      {
        service: {
          id: serviceId,
          name: serviceName,
          category: "service",
          price: basePrice,
          rating: 0,
          reviews: 0,
          duration: `${durationMinutes} min`,
          image: DEFAULT_IMG,
          description: "",
          includes: [],
        },
        quantity: 1,
      },
    ],
    date: dateStr,
    timeSlot,
    address: item.address,
    paymentMode: mapPaymentModeToDisplay(item.paymentMode),
    status,
    beautician: item.beautician
      ? {
          id: item.beautician._id,
          name: item.beautician.name,
          phone: item.beautician.phone,
          image: item.beautician.profileImageUrl || "/placeholder-beautician.png",
          profileImageUrl: item.beautician.profileImageUrl,
          rating: item.beautician.rating || 4.5,
          experience: item.beautician.experienceYears ? `${item.beautician.experienceYears}+ years` : "",
          servicesCompleted: item.beautician.servicesCompleted || 0,
          specialties: [],
        }
      : undefined,
    total: item.price,
    createdAt: item.createdAt || new Date().toISOString(),
    serviceStartOtp:
      status === "reached" && "serviceStartOtp" in item && item.serviceStartOtp
        ? String(item.serviceStartOtp)
        : undefined,
  };
}

function mapProductOrderStatus(s: string): BookingOrder["status"] {
  const m: Record<string, BookingOrder["status"]> = {
    pending_payment: "booked",
    confirmed: "assigned",
    processing: "started",
    shipped: "on_the_way",
    delivered: "completed",
    cancelled: "cancelled",
  };
  return m[s] || "booked";
}

function mapApiProductOrderToOrder(item: {
  _id: string;
  items: Array<{ name: string; quantity: number; lineTotal: number; unitPrice: number }>;
  address: string;
  totalAmount: number;
  status: string;
  paymentMode?: string;
  createdAt?: string;
  vendor?: { name?: string };
}): BookingOrder {
  const created = item.createdAt ? new Date(item.createdAt) : new Date();
  const dateStr = Number.isNaN(created.getTime())
    ? new Date().toISOString().split("T")[0]
    : created.toISOString().split("T")[0];
  const placeholderService: Service = {
    id: "shop",
    name: item.items?.length ? `${item.items.length} product(s)` : "Products",
    category: "shop",
    price: item.totalAmount,
    rating: 0,
    reviews: 0,
    duration: "—",
    image: "",
    description: "",
    includes: [],
  };
  return {
    id: item._id,
    kind: "product",
    services: [{ service: placeholderService, quantity: 1 }],
    date: dateStr,
    timeSlot: "Delivery",
    address: item.address,
    paymentMode: mapPaymentModeToDisplay(item.paymentMode),
    status: mapProductOrderStatus(item.status),
    total: item.totalAmount,
    createdAt: item.createdAt || new Date().toISOString(),
    productLines: item.items?.map((l) => ({
      name: l.name,
      quantity: l.quantity,
      lineTotal: l.lineTotal,
    })),
    vendorName: item.vendor?.name,
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const APPOINTMENT_STATUS_FCM_TYPES = new Set([
  "appointment_reassigned",
  "appointment_unassigned",
  "appointment_accepted",
  "appointment_en_route",
  "appointment_reached",
  "appointment_started",
  "appointment_completed",
]);

const WISHLIST_STORAGE_KEY = "customer_wishlist";
const CART_STORAGE_KEY = "customer_cart";
const SHOP_CART_STORAGE_KEY = "customer_shop_cart";

function loadWishlistFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is string => typeof x === "string" && x.length > 0)
      .map((x) => x.trim())
      .filter((id) => /^[a-f0-9]{24}$/i.test(id));
  } catch {
    return [];
  }
}

function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (row): row is CartItem =>
          row != null &&
          typeof row === "object" &&
          "service" in row &&
          "quantity" in row &&
          (row as CartItem).service &&
          typeof (row as CartItem).quantity === "number"
      )
      .map((row) => ({
        quantity: Math.max(1, (row as CartItem).quantity),
        service: {
          ...(row as CartItem).service,
          id: String((row as CartItem).service.id),
          price:
            typeof (row as CartItem).service.price === "number"
              ? (row as CartItem).service.price
              : Number((row as CartItem).service.price) || 0,
        },
      }));
  } catch {
    return [];
  }
}

function loadShopCartFromStorage(): ShopCartItem[] {
  try {
    const raw = localStorage.getItem(SHOP_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (row): row is ShopCartItem =>
          row != null &&
          typeof row === "object" &&
          "product" in row &&
          "quantity" in row &&
          (row as ShopCartItem).product &&
          typeof (row as ShopCartItem).quantity === "number"
      )
      .map((row) => ({
        quantity: Math.max(1, (row as ShopCartItem).quantity),
        product: {
          ...(row as ShopCartItem).product,
          id: String((row as ShopCartItem).product.id),
          price:
            typeof (row as ShopCartItem).product.price === "number"
              ? (row as ShopCartItem).product.price
              : Number((row as ShopCartItem).product.price) || 0,
          inStock:
            typeof (row as ShopCartItem).product.inStock === "number"
              ? (row as ShopCartItem).product.inStock
              : 0,
        },
      }));
  } catch {
    return [];
  }
}

function normalizeServiceForCart(service: Service): Service {
  const priceNum = typeof service.price === "number" ? service.price : Number(service.price);
  return {
    ...service,
    id: String(service.id ?? ""),
    price: Number.isFinite(priceNum) ? priceNum : 0,
  };
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const savedUser = getUser();
  const [state, setState] = useState<AppState>({
    isLoggedIn: !!savedUser,
    user: savedUser
      ? {
          name: savedUser.name,
          email: savedUser.email,
          phone: savedUser.phone || "",
          profileImageUrl: savedUser.profileImageUrl,
        }
      : null,
    cart: loadCartFromStorage(),
    shopCart: loadShopCartFromStorage(),
    wishlist: loadWishlistFromStorage(),
    orders: [],
    walletBalance: 0,
    servicesLoading: false,
    ordersLoading: false,
    pendingRatingAppointmentId: null,
  });

  const refreshOrders = useCallback(async () => {
    if (!getUser()) return;
    setState((s) => ({ ...s, ordersLoading: true }));
    let serviceRows: BookingOrder[] = [];
    let productRows: BookingOrder[] = [];
    try {
      const apptRes = await customerApi.getAppointments(1, 100);
      if (apptRes.success && apptRes.data?.items?.length) {
        serviceRows = apptRes.data.items
          .map((row) => {
            try {
              return mapApiAppointmentToOrder(row);
            } catch {
              return null;
            }
          })
          .filter((x): x is BookingOrder => x != null);
      }
    } catch {
      // Appointments still empty; do not block product orders
    }
    try {
      const poRes = await customerApi.getProductOrders(1, 100);
      if (poRes.success && poRes.data?.items?.length) {
        productRows = poRes.data.items.map(mapApiProductOrderToOrder);
      }
    } catch {
      // Shop history optional — service appointments already loaded above
    }
    const merged = [...serviceRows, ...productRows].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setState((s) => ({
      ...s,
      orders: merged,
      ordersLoading: false,
    }));
  }, []);

  const refreshPendingRatings = useCallback(async () => {
    if (!getUser()) {
      setState((s) => ({ ...s, pendingRatingAppointmentId: null }));
      return;
    }
    try {
      const res = await customerApi.getPendingRatings();
      if (res.success && res.data?.items?.length) {
        const first = res.data.items[0];
        const id = first && typeof first === "object" && "_id" in first ? String((first as { _id: string })._id) : "";
        setState((s) => ({ ...s, pendingRatingAppointmentId: id || null }));
      } else {
        setState((s) => ({ ...s, pendingRatingAppointmentId: null }));
      }
    } catch {
      setState((s) => ({ ...s, pendingRatingAppointmentId: null }));
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await authApi.profile();
      if (res.success && res.data) {
        const d = res.data;
        const existing = getUser();
        const id =
          existing?.id ||
          (d as { id?: string }).id ||
          String((d as { _id?: string })._id || "");
        const walletBalance = typeof d.walletBalance === "number" ? d.walletBalance : 0;
        const profileImageUrl =
          typeof d.profileImageUrl === "string" && d.profileImageUrl ? d.profileImageUrl : null;
        setUser({ id, name: d.name, email: d.email, phone: d.phone, profileImageUrl });
        setState((s) => ({
          ...s,
          user: { name: d.name, email: d.email, phone: d.phone || "", profileImageUrl },
          walletBalance,
        }));
      }
    } catch {
      // ignore
    }
  }, []);

  const updateProfile = useCallback(async (payload: { name?: string; phone?: string }) => {
    try {
      const res = await authApi.updateProfile(payload);
      if (res.success && res.data) {
        const d = res.data;
        const existing = getUser();
        const id =
          existing?.id ||
          (d as { id?: string }).id ||
          String((d as { _id?: string })._id || "");
        const profileImageUrl =
          typeof d.profileImageUrl === "string" && d.profileImageUrl ? d.profileImageUrl : null;
        setUser({ id, name: d.name, email: d.email, phone: d.phone, profileImageUrl });
        setState((s) => ({
          ...s,
          user: { name: d.name, email: d.email, phone: d.phone || "", profileImageUrl },
        }));
        return { ok: true as const };
      }
      return { ok: false as const, error: (res as { message?: string }).message || "Update failed" };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Update failed" };
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      const res = await authApi.changePassword({ currentPassword, newPassword });
      if (res.success) return { ok: true as const };
      return { ok: false as const, error: (res as { message?: string }).message || "Could not update password" };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Could not update password" };
    }
  }, []);

  useEffect(() => {
    if (state.isLoggedIn) {
      refreshOrders();
      refreshProfile();
      refreshPendingRatings();
    }
  }, [state.isLoggedIn, refreshOrders, refreshProfile, refreshPendingRatings]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(state.wishlist));
    } catch {
      // quota / private mode
    }
  }, [state.wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
    } catch {
      // quota / private mode
    }
  }, [state.cart]);

  useEffect(() => {
    try {
      localStorage.setItem(SHOP_CART_STORAGE_KEY, JSON.stringify(state.shopCart));
    } catch {
      // ignore
    }
  }, [state.shopCart]);

  useEffect(() => {
    if (!state.isLoggedIn || !isFirebaseConfigured()) return;
    getFCMToken().then((token) => {
      if (token) authApi.registerFcmToken(token).catch(() => {});
    });
  }, [state.isLoggedIn]);

  useEffect(() => {
    if (!state.isLoggedIn || !isFirebaseConfigured()) return;
    const off = onFCMMessage((payload) => {
      const t = String(payload.data?.type || "").toLowerCase();
      if (APPOINTMENT_STATUS_FCM_TYPES.has(t)) {
        void refreshOrders();
        if (t === "appointment_completed") void refreshPendingRatings();
      }
    });
    return off;
  }, [state.isLoggedIn, refreshOrders, refreshPendingRatings]);

  useEffect(() => {
    if (!state.isLoggedIn || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const handler = (event: MessageEvent) => {
      const msg = event.data as { source?: string; fcm?: { data?: Record<string, string> } } | null;
      if (!msg || msg.source !== "fcm-sw" || !msg.fcm?.data) return;
      const t = String(msg.fcm.data.type || "").toLowerCase();
      if (APPOINTMENT_STATUS_FCM_TYPES.has(t)) {
        void refreshOrders();
        if (t === "appointment_completed") void refreshPendingRatings();
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, [state.isLoggedIn, refreshOrders, refreshPendingRatings]);

  const login = async (email: string, password: string) => {
    try {
      const res = await authApi.login(email, password);
      if (res.success && res.data?.user && res.data?.tokens) {
        const { user, tokens } = res.data;
        setAuthTokens(tokens.accessToken, tokens.refreshToken);
        setUser({ id: user.id, name: user.name, email: user.email, phone: user.phone });
        setState((s) => ({
          ...s,
          isLoggedIn: true,
          user: { name: user.name, email: user.email, phone: user.phone || "" },
        }));
        return { ok: true };
      }
      return { ok: false, error: (res as { message?: string }).message || "Login failed" };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Login failed" };
    }
  };

  const register = async (body: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    referralCode?: string;
  }) => {
    try {
      const res = await authApi.register(body);
      if (res.success && res.data?.user && res.data?.tokens) {
        const { user, tokens } = res.data;
        setAuthTokens(tokens.accessToken, tokens.refreshToken);
        setUser({ id: user.id, name: user.name, email: user.email, phone: user.phone });
        setState((s) => ({
          ...s,
          isLoggedIn: true,
          user: { name: user.name, email: user.email, phone: user.phone || "" },
        }));
        return { ok: true };
      }
      return { ok: false, error: (res as { message?: string }).message || "Sign up failed" };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Sign up failed" };
    }
  };

  const sendOtp = async (phone: string, fcmToken?: string | null) => {
    try {
      const res = await authApi.sendOtp(phone, fcmToken);
      if (res.success) return { ok: true };
      return { ok: false, error: (res as { message?: string }).message || "Failed to send OTP" };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Failed to send OTP" };
    }
  };

  const loginWithOtp = async (phone: string, otp: string) => {
    try {
      const res = await authApi.verifyOtp(phone, otp);
      if (res.success && res.data?.needsSignup && res.data?.phone) {
        return { ok: true, needsSignup: true, phone: res.data.phone };
      }
      if (res.success && res.data?.user && res.data?.tokens) {
        const { user, tokens } = res.data;
        setAuthTokens(tokens.accessToken, tokens.refreshToken);
        setUser({ id: user.id, name: user.name, email: user.email, phone: user.phone });
        setState((s) => ({
          ...s,
          isLoggedIn: true,
          user: { name: user.name, email: user.email, phone: user.phone || "" },
        }));
        return { ok: true };
      }
      return { ok: false, error: (res as { message?: string }).message || "Verification failed" };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Verification failed" };
    }
  };

  const logout = () => {
    clearAuth();
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // ignore
    }
    setState((s) => ({
      ...s,
      isLoggedIn: false,
      user: null,
      orders: [],
      cart: [],
      shopCart: [],
      pendingRatingAppointmentId: null,
    }));
  };

  const deleteAccount = useCallback(async (password: string) => {
    try {
      const res = await authApi.deleteAccount({ password });
      if (res.success) {
        logout();
        return { ok: true as const };
      }
      return { ok: false as const, error: (res as { message?: string }).message || "Could not delete account" };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Could not delete account" };
    }
  }, [logout]);

  const rechargeWallet = useCallback(
    async (amount: number) => {
      if (!getUser()) return { ok: false as const, error: "Sign in required" };
      try {
        const init = await customerApi.initiateWalletRecharge(amount);
        if (!init.success || !init.data?.paymentId || !init.data?.orderId || !init.data?.keyId) {
          return { ok: false as const, error: init.message || "Could not start payment" };
        }
        const rzp = await openRazorpayCheckout({
          keyId: init.data.keyId,
          orderId: init.data.orderId,
          name: state.user?.name || "Customer",
          email: state.user?.email,
          phone: state.user?.phone,
          description: "Wallet recharge",
        });
        const verified = await customerApi.verifyPayment({
          paymentId: init.data.paymentId,
          providerPaymentId: rzp.razorpay_payment_id,
          providerSignature: rzp.razorpay_signature,
        });
        if (!verified.success) return { ok: false as const, error: "Could not verify payment" };
        await refreshProfile();
        return { ok: true as const };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Payment failed";
        if (msg === "Payment cancelled") return { ok: false as const, error: "Cancelled" };
        return { ok: false as const, error: msg };
      }
    },
    [state.user, refreshProfile]
  );

  const addToCart = (service: Service) => {
    const normalized = normalizeServiceForCart(service);
    const sid = normalized.id;
    if (!sid) {
      toast.error("Could not add this service");
      return;
    }
    const label = (normalized.name || "Service").trim() || "Service";
    const wasInCart = state.cart.some((i) => String(i.service.id) === sid);
    setState((s) => {
      const existing = s.cart.find((i) => String(i.service.id) === sid);
      if (existing) {
        return {
          ...s,
          cart: s.cart.map((i) => (String(i.service.id) === sid ? { ...i, quantity: i.quantity + 1 } : i)),
        };
      }
      return { ...s, cart: [...s.cart, { service: normalized, quantity: 1 }] };
    });
    toast.success(wasInCart ? `Quantity updated · ${label}` : `Added to cart · ${label}`);
  };

  const removeFromCart = (serviceId: string) =>
    setState((s) => {
      const sid = String(serviceId);
      return { ...s, cart: s.cart.filter((i) => String(i.service.id) !== sid) };
    });

  const updateQuantity = (serviceId: string, qty: number) =>
    setState((s) => {
      const sid = String(serviceId);
      return {
        ...s,
        cart:
          qty <= 0
            ? s.cart.filter((i) => String(i.service.id) !== sid)
            : s.cart.map((i) => (String(i.service.id) === sid ? { ...i, quantity: qty } : i)),
      };
    });

  const clearCart = () => setState((s) => ({ ...s, cart: [] }));

  const toggleWishlist = (serviceId: string) =>
    setState((s) => {
      const sid = String(serviceId ?? "").trim();
      // Avoid invalid IDs that trigger GET /customer/services/:id validation errors
      if (!/^[a-f0-9]{24}$/i.test(sid)) return s;
      const normalized = s.wishlist.map(String).filter((id) => /^[a-f0-9]{24}$/i.test(id));
      const has = normalized.includes(sid);
      return {
        ...s,
        wishlist: has ? normalized.filter((id) => id !== sid) : [...normalized, sid],
      };
    });

  const cartTotal = state.cart.reduce((t, i) => t + i.service.price * i.quantity, 0);
  const cartCount = state.cart.reduce((t, i) => t + i.quantity, 0);
  const shopCartTotal = state.shopCart.reduce((t, i) => t + i.product.price * i.quantity, 0);
  const shopCartCount = state.shopCart.reduce((t, i) => t + i.quantity, 0);

  const addToShopCart = (product: ShopProduct) => {
    const normalized: ShopProduct = {
      ...product,
      id: String(product.id),
      price: typeof product.price === "number" ? product.price : Number(product.price) || 0,
      inStock: typeof product.inStock === "number" ? product.inStock : 0,
    };
    const pid = normalized.id;
    if (!pid) {
      toast.error("Could not add this product");
      return;
    }
    const name = (normalized.name || "Product").trim() || "Product";
    const existingRow = state.shopCart.find((i) => String(i.product.id) === pid);
    if (existingRow && existingRow.quantity + 1 > normalized.inStock) {
      toast.error("No more stock available");
      return;
    }
    const wasInCart = !!existingRow;
    setState((s) => {
      const existing = s.shopCart.find((i) => String(i.product.id) === pid);
      if (existing) {
        const nextQty = existing.quantity + 1;
        if (nextQty > normalized.inStock) return s;
        return {
          ...s,
          shopCart: s.shopCart.map((i) =>
            String(i.product.id) === pid ? { ...i, quantity: nextQty } : i
          ),
        };
      }
      return { ...s, shopCart: [...s.shopCart, { product: normalized, quantity: 1 }] };
    });
    toast.success(wasInCart ? `Quantity updated · ${name}` : `Added to cart · ${name}`);
  };

  const removeFromShopCart = (productId: string) =>
    setState((s) => ({
      ...s,
      shopCart: s.shopCart.filter((i) => String(i.product.id) !== String(productId)),
    }));

  const updateShopQuantity = (productId: string, qty: number) =>
    setState((s) => {
      const pid = String(productId);
      const row = s.shopCart.find((i) => String(i.product.id) === pid);
      if (!row) return s;
      const max = row.product.inStock;
      const next = Math.min(max, Math.max(0, qty));
      if (next <= 0) {
        return { ...s, shopCart: s.shopCart.filter((i) => String(i.product.id) !== pid) };
      }
      return {
        ...s,
        shopCart: s.shopCart.map((i) =>
          String(i.product.id) === pid ? { ...i, quantity: next } : i
        ),
      };
    });

  const clearShopCart = () => setState((s) => ({ ...s, shopCart: [] }));

  const placeShopOrder = async (
    address: string,
    paymentMode: string,
    options?: { processOnlinePayment?: boolean }
  ): Promise<string | null> => {
    if (!state.shopCart.length) return null;
    const mode = normalizePaymentModeForApi(paymentMode);
    const items = state.shopCart.map((i) => ({
      inventoryItemId: i.product.id,
      quantity: i.quantity,
    }));
    try {
      const res = await customerApi.createProductOrder({
        items,
        address: address.trim(),
        lat: 19.06, // Note: AppContext placeShopOrder doesn't receive lat/lng yet, keeping fallback
        lng: 72.83,
        paymentMode: mode,
      });
      if (!res.success || !res.data?._id) return null;
      const orderId = res.data._id;
      if (options?.processOnlinePayment && mode === "online") {
        const initiated = await customerApi.initiatePayment({ productOrderId: orderId });
        if (!initiated.success || !initiated.data?.paymentId || !initiated.data?.orderId || !initiated.data?.keyId) {
          await customerApi.cancelProductOrder(orderId).catch(() => {});
          return null;
        }
        try {
          const rzp = await openRazorpayCheckout({
            keyId: initiated.data.keyId,
            orderId: initiated.data.orderId,
            name: state.user?.name || "Customer",
            email: state.user?.email,
            phone: state.user?.phone,
            description: "Product order",
          });
          const verified = await customerApi.verifyPayment({
            paymentId: initiated.data.paymentId,
            providerPaymentId: rzp.razorpay_payment_id,
            providerSignature: rzp.razorpay_signature,
          });
          if (!verified.success) throw new Error("Verification failed");
        } catch {
          await customerApi.cancelProductOrder(orderId).catch(() => {});
          return null;
        }
      }
      if (mode === "wallet") {
        await refreshProfile();
      }
      setState((s) => ({ ...s, shopCart: [] }));
      await refreshOrders();
      return orderId;
    } catch {
      return null;
    }
  };

  const createOrder = async (
    order: Omit<BookingOrder, "id" | "createdAt">,
    options?: { processOnlinePayment?: boolean }
  ): Promise<string | null> => {
    let scheduledAt: string;
    try {
      const dateStr = order.date || new Date().toISOString().split("T")[0];
      const timeStr = timeSlotToISOTime(order.timeSlot || "10:00 AM");
      const d = new Date(`${dateStr}T${timeStr}`);
      scheduledAt = Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    } catch {
      scheduledAt = new Date().toISOString();
    }
    const total = order.total;
    const firstService = order.services[0]?.service;
    if (!firstService) return null;
    try {
      const paymentMode = normalizePaymentModeForApi(order.paymentMode);
      const res = await customerApi.createAppointment({
        serviceId: firstService.id,
        scheduledAt,
        address: order.address,
        lat: order.lat || 19.06,
        lng: order.lng || 72.83,
        price: total,
        paymentMode: paymentMode as "online" | "cod" | "wallet",
        ...(order.beautician?.id ? { beauticianUserId: order.beautician.id } : {}),
      });
      if (res.success && res.data) {
        const appointmentId = (res.data as { _id: string })._id;
        if (options?.processOnlinePayment && paymentMode === "online") {
          const initiated = await customerApi.initiatePayment({ appointmentId });
          if (!initiated.success || !initiated.data?.paymentId || !initiated.data?.orderId || !initiated.data?.keyId) {
            await customerApi.cancelAppointment(appointmentId).catch(() => {});
            return null;
          }
          try {
            const rzp = await openRazorpayCheckout({
              keyId: initiated.data.keyId,
              orderId: initiated.data.orderId,
              name: state.user?.name || "Customer",
              email: state.user?.email,
              phone: state.user?.phone,
              description: "Service booking",
            });
            const verified = await customerApi.verifyPayment({
              paymentId: initiated.data.paymentId,
              providerPaymentId: rzp.razorpay_payment_id,
              providerSignature: rzp.razorpay_signature,
            });
            if (!verified.success) throw new Error("Verification failed");
          } catch {
            await customerApi.cancelAppointment(appointmentId).catch(() => {});
            return null;
          }
        }
        if (paymentMode === "wallet") {
          await refreshProfile();
        }
        setState((s) => ({ ...s, cart: [] }));
        await refreshOrders();
        return appointmentId;
      }
    } catch {
      // ignore
    }
    return null;
  };

  const cancelOrder = async (orderId: string, kind?: "service" | "product") => {
    try {
      if (kind === "product") {
        await customerApi.cancelProductOrder(orderId);
      } else {
        await customerApi.cancelAppointment(orderId);
      }
      await refreshOrders();
    } catch {
      // ignore
    }
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        login,
        register,
        sendOtp,
        loginWithOtp,
        logout,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        addToShopCart,
        removeFromShopCart,
        updateShopQuantity,
        clearShopCart,
        shopCartTotal,
        shopCartCount,
        placeShopOrder,
        toggleWishlist,
        cartTotal,
        cartCount,
        createOrder,
        cancelOrder,
        refreshOrders,
        refreshProfile,
        updateProfile,
        changePassword,
        deleteAccount,
        rechargeWallet,
        refreshPendingRatings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
