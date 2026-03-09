import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = API_BASE.replace(/\/api\/?$/, "") || "http://localhost:5000";

function getToken(): string | null {
  return localStorage.getItem("customer_token");
}

export function createTrackingSocket() {
  return io(SOCKET_URL, {
    auth: { token: getToken() },
    transports: ["websocket", "polling"],
  });
}

export type LocationUpdate = {
  lat: number;
  lng: number;
  eta?: { etaInMinutes?: number; distanceInKm?: number };
};
