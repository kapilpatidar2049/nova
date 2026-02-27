import React, { createContext, useContext, useState, ReactNode } from "react";
import { Service, BookingOrder, Beautician, beauticians } from "@/data/mockData";

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
}

interface AppContextType extends AppState {
  login: (phone: string, name?: string) => void;
  logout: () => void;
  addToCart: (service: Service) => void;
  removeFromCart: (serviceId: string) => void;
  updateQuantity: (serviceId: string, qty: number) => void;
  clearCart: () => void;
  toggleWishlist: (serviceId: string) => void;
  cartTotal: number;
  cartCount: number;
  createOrder: (order: Omit<BookingOrder, "id" | "createdAt">) => string;
  cancelOrder: (orderId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>({
    isLoggedIn: false,
    user: null,
    cart: [],
    wishlist: [],
    orders: [
      {
        id: "ORD-1001",
        services: [],
        date: "2026-02-25",
        timeSlot: "10:00 AM",
        address: "123 Park Street, Mumbai",
        paymentMode: "Online",
        status: "completed",
        beautician: beauticians[0],
        total: 1299,
        createdAt: "2026-02-24",
      },
    ],
    walletBalance: 500,
  });

  const login = (phone: string, name?: string) =>
    setState((s) => ({ ...s, isLoggedIn: true, user: { phone, name: name || "User", email: "" } }));

  const logout = () =>
    setState((s) => ({ ...s, isLoggedIn: false, user: null }));

  const addToCart = (service: Service) =>
    setState((s) => {
      const existing = s.cart.find((i) => i.service.id === service.id);
      if (existing) {
        return { ...s, cart: s.cart.map((i) => i.service.id === service.id ? { ...i, quantity: i.quantity + 1 } : i) };
      }
      return { ...s, cart: [...s.cart, { service, quantity: 1 }] };
    });

  const removeFromCart = (serviceId: string) =>
    setState((s) => ({ ...s, cart: s.cart.filter((i) => i.service.id !== serviceId) }));

  const updateQuantity = (serviceId: string, qty: number) =>
    setState((s) => ({
      ...s,
      cart: qty <= 0 ? s.cart.filter((i) => i.service.id !== serviceId) : s.cart.map((i) => i.service.id === serviceId ? { ...i, quantity: qty } : i),
    }));

  const clearCart = () => setState((s) => ({ ...s, cart: [] }));

  const toggleWishlist = (serviceId: string) =>
    setState((s) => ({
      ...s,
      wishlist: s.wishlist.includes(serviceId)
        ? s.wishlist.filter((id) => id !== serviceId)
        : [...s.wishlist, serviceId],
    }));

  const cartTotal = state.cart.reduce((t, i) => t + i.service.price * i.quantity, 0);
  const cartCount = state.cart.reduce((t, i) => t + i.quantity, 0);

  const createOrder = (order: Omit<BookingOrder, "id" | "createdAt">) => {
    const id = `ORD-${1000 + state.orders.length + 1}`;
    setState((s) => ({
      ...s,
      orders: [{ ...order, id, createdAt: new Date().toISOString() }, ...s.orders],
      cart: [],
    }));
    return id;
  };

  const cancelOrder = (orderId: string) =>
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) => o.id === orderId ? { ...o, status: "cancelled" as const } : o),
    }));

  return (
    <AppContext.Provider value={{ ...state, login, logout, addToCart, removeFromCart, updateQuantity, clearCart, toggleWishlist, cartTotal, cartCount, createOrder, cancelOrder }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
