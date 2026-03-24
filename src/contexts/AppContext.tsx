import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { Service, BookingOrder, Beautician } from "@/types";
import {
  setAuthTokens,
  clearAuth,
  setUser,
  getUser,
  customerApi,
  authApi,
} from "@/lib/api";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { getFCMToken, isFirebaseConfigured } from "@/lib/firebase";

const DEFAULT_IMG = "";

interface CartItem {
  service: Service;
  quantity: number;
}

interface AppState {
  isLoggedIn: boolean;
  user: { name: string; phone: string; email: string } | null;
  cart: CartItem[];
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
  register: (body: { name: string; email: string; password: string; phone?: string }) => Promise<{ ok: boolean; error?: string }>;
  sendOtp: (phone: string, fcmToken?: string | null) => Promise<{ ok: boolean; error?: string }>;
  loginWithOtp: (phone: string, otp: string) => Promise<{ ok: boolean; error?: string }>;
  loginWithPhone?: (phone: string, name?: string) => void;
  logout: () => void;
  addToCart: (service: Service) => void;
  removeFromCart: (serviceId: string) => void;
  updateQuantity: (serviceId: string, qty: number) => void;
  clearCart: () => void;
  toggleWishlist: (serviceId: string) => void;
  cartTotal: number;
  cartCount: number;
  createOrder: (
    order: Omit<BookingOrder, "id" | "createdAt">,
    options?: { processOnlinePayment?: boolean }
  ) => Promise<string | null>;
  cancelOrder: (orderId: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (payload: { name?: string; phone?: string }) => Promise<{ ok: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  deleteAccount: (password: string) => Promise<{ ok: boolean; error?: string }>;
  rechargeWallet: (amount: number) => Promise<{ ok: boolean; error?: string }>;
  refreshPendingRatings: () => Promise<void>;
}

/** Convert "10:00 AM" / "02:30 PM" to 24h "HH:MM:00" for ISO datetime. */
function timeSlotToISOTime(timeSlot: string): string {
  const match = timeSlot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return "10:00:00";
  let [, h, m, period] = match;
  let hour = parseInt(h!, 10);
  const min = m!;
  if (period?.toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (period?.toUpperCase() === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${min}:00`;
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
  service: { _id: string; name: string; basePrice: number; durationMinutes: number };
  beautician?: { _id: string; name: string; servicesCompleted?: number; rating?: number; experienceYears?: number };
  scheduledAt?: string | null;
  address: string;
  status: string;
  price: number;
  paymentMode?: string;
  createdAt?: string;
}): BookingOrder {
  const statusMap: Record<string, BookingOrder["status"]> = {
    pending: "booked",
    accepted: "assigned",
    in_progress: "started",
    completed: "completed",
    cancelled: "cancelled",
  };
  const status = statusMap[item.status] || "booked";
  let timeSlot = "10:00 AM";
  let dateStr = new Date().toISOString().split("T")[0];
  try {
    const d = item.scheduledAt ? new Date(item.scheduledAt) : new Date();
    if (!Number.isNaN(d.getTime())) {
      timeSlot = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      dateStr = d.toISOString().split("T")[0];
    }
  } catch {
    // keep defaults on any date error
  }
  return {
    id: item._id,
    services: [
      {
        service: {
          id: item.service._id,
          name: item.service.name,
          category: "service",
          price: item.service.basePrice,
          rating: 0,
          reviews: 0,
          duration: `${item.service.durationMinutes} min`,
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
          image: "/placeholder-beautician.png",
          rating: item.beautician.rating || 4.5,
          experience: item.beautician.experienceYears ? `${item.beautician.experienceYears}+ years` : "",
          servicesCompleted: item.beautician.servicesCompleted || 0,
          specialties: [],
        }
      : undefined,
    total: item.price,
    createdAt: item.createdAt || new Date().toISOString(),
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = "customer_wishlist";
const CART_STORAGE_KEY = "customer_cart";

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
    user: savedUser ? { name: savedUser.name, email: savedUser.email, phone: savedUser.phone || "" } : null,
    cart: loadCartFromStorage(),
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
    try {
      const res = await customerApi.getAppointments(1, 100);
      if (res.success && res.data?.items) {
        setState((s) => ({
          ...s,
          orders: res.data!.items.map(mapApiAppointmentToOrder),
          ordersLoading: false,
        }));
      } else {
        setState((s) => ({ ...s, ordersLoading: false }));
      }
    } catch {
      setState((s) => ({ ...s, ordersLoading: false }));
    }
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
        setUser({ id, name: d.name, email: d.email, phone: d.phone });
        setState((s) => ({
          ...s,
          user: { name: d.name, email: d.email, phone: d.phone || "" },
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
        setUser({ id, name: d.name, email: d.email, phone: d.phone });
        setState((s) => ({
          ...s,
          user: { name: d.name, email: d.email, phone: d.phone || "" },
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
    if (!state.isLoggedIn || !isFirebaseConfigured()) return;
    getFCMToken().then((token) => {
      if (token) authApi.registerFcmToken(token).catch(() => {});
    });
  }, [state.isLoggedIn]);

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

  const register = async (body: { name: string; email: string; password: string; phone?: string }) => {
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

  const addToCart = (service: Service) =>
    setState((s) => {
      const normalized = normalizeServiceForCart(service);
      const sid = normalized.id;
      if (!sid) return s;
      const existing = s.cart.find((i) => String(i.service.id) === sid);
      if (existing) {
        return {
          ...s,
          cart: s.cart.map((i) => (String(i.service.id) === sid ? { ...i, quantity: i.quantity + 1 } : i)),
        };
      }
      return { ...s, cart: [...s.cart, { service: normalized, quantity: 1 }] };
    });

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
        lat: 19.06,
        lng: 72.83,
        price: total,
        paymentMode: paymentMode as "online" | "cod" | "wallet",
      });
      if (res.success && res.data) {
        const appointmentId = (res.data as { _id: string })._id;
        if (options?.processOnlinePayment && paymentMode === "online") {
          const initiated = await customerApi.initiatePayment(appointmentId);
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

  const cancelOrder = async (orderId: string) => {
    try {
      await customerApi.cancelAppointment(orderId);
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
