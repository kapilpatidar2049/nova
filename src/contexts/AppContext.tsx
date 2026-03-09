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
  createOrder: (order: Omit<BookingOrder, "id" | "createdAt">) => Promise<string | null>;
  cancelOrder: (orderId: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

function mapApiAppointmentToOrder(item: {
  _id: string;
  service: { _id: string; name: string; basePrice: number; durationMinutes: number };
  beautician?: { _id: string; name: string };
  scheduledAt: string;
  address: string;
  status: string;
  price: number;
  createdAt: string;
}): BookingOrder {
  const statusMap: Record<string, BookingOrder["status"]> = {
    pending: "booked",
    accepted: "assigned",
    in_progress: "started",
    completed: "completed",
    cancelled: "cancelled",
  };
  const status = statusMap[item.status] || "booked";
  const d = new Date(item.scheduledAt);
  const timeSlot = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
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
    date: d.toISOString().split("T")[0],
    timeSlot,
    address: item.address,
    paymentMode: "Online",
    status,
    beautician: item.beautician
      ? {
          id: item.beautician._id,
          name: item.beautician.name,
          image: "/placeholder-beautician.png",
          rating: 4.5,
          experience: "",
          servicesCompleted: 0,
          specialties: [],
        }
      : undefined,
    total: item.price,
    createdAt: item.createdAt,
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const savedUser = getUser();
  const [state, setState] = useState<AppState>({
    isLoggedIn: !!savedUser,
    user: savedUser ? { name: savedUser.name, email: savedUser.email, phone: savedUser.phone || "" } : null,
    cart: [],
    wishlist: [],
    orders: [],
    walletBalance: 500,
    servicesLoading: false,
    ordersLoading: false,
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

  const refreshProfile = useCallback(async () => {
    try {
      const res = await authApi.profile();
      if (res.success && res.data) {
        setUser({ id: "", name: res.data.name, email: res.data.email, phone: res.data.phone });
        setState((s) => ({
          ...s,
          user: { name: res.data!.name, email: res.data!.email, phone: res.data!.phone || "" },
        }));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (state.isLoggedIn) {
      refreshOrders();
    }
  }, [state.isLoggedIn, refreshOrders]);

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
        if (user.role !== "customer") {
          return { ok: false, error: "Use the customer app to sign in with OTP." };
        }
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
    setState((s) => ({
      ...s,
      isLoggedIn: false,
      user: null,
      orders: [],
    }));
  };

  const addToCart = (service: Service) =>
    setState((s) => {
      const existing = s.cart.find((i) => i.service.id === service.id);
      if (existing) {
        return { ...s, cart: s.cart.map((i) => (i.service.id === service.id ? { ...i, quantity: i.quantity + 1 } : i)) };
      }
      return { ...s, cart: [...s.cart, { service, quantity: 1 }] };
    });

  const removeFromCart = (serviceId: string) =>
    setState((s) => ({ ...s, cart: s.cart.filter((i) => i.service.id !== serviceId) }));

  const updateQuantity = (serviceId: string, qty: number) =>
    setState((s) => ({
      ...s,
      cart: qty <= 0 ? s.cart.filter((i) => i.service.id !== serviceId) : s.cart.map((i) => (i.service.id === serviceId ? { ...i, quantity: qty } : i)),
    }));

  const clearCart = () => setState((s) => ({ ...s, cart: [] }));

  const toggleWishlist = (serviceId: string) =>
    setState((s) => ({
      ...s,
      wishlist: s.wishlist.includes(serviceId) ? s.wishlist.filter((id) => id !== serviceId) : [...s.wishlist, serviceId],
    }));

  const cartTotal = state.cart.reduce((t, i) => t + i.service.price * i.quantity, 0);
  const cartCount = state.cart.reduce((t, i) => t + i.quantity, 0);

  const createOrder = async (order: Omit<BookingOrder, "id" | "createdAt">): Promise<string | null> => {
    const scheduledAt = new Date(`${order.date}T${order.timeSlot.replace(/\s/g, "")}`).toISOString();
    const total = order.total;
    const firstService = order.services[0]?.service;
    if (!firstService) return null;
    try {
      const res = await customerApi.createAppointment({
        serviceId: firstService.id,
        scheduledAt,
        address: order.address,
        lat: 19.06,
        lng: 72.83,
        price: total,
      });
      if (res.success && res.data) {
        setState((s) => ({ ...s, cart: [] }));
        await refreshOrders();
        return (res.data as { _id: string })._id;
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
