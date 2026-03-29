import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";

const dbUrl = import.meta.env.VITE_FIREBASE_DATABASE_URL as string | undefined;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  ...(dbUrl ? { databaseURL: dbUrl } : {}),
};

let app: ReturnType<typeof initializeApp> | null = null;

export function getFirebaseApp() {
  if (!app && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.warn("[FCM] Service worker registration failed:", err);
    return null;
  }
}

export async function getFCMToken(): Promise<string | null> {
  // Skip FCM on iOS browsers where web push is not supported
  if (isIOS()) return null;

  const supported = await isSupported();
  if (!supported) return null;
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  if (!VAPID_KEY) return null;
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    const registration = await getServiceWorkerRegistration();
    if (!registration) return null;
    const messaging = getMessaging(firebaseApp);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token;
  } catch {
    return null;
  }
}

export function isFirebaseConfigured(): boolean {
  return !!(firebaseConfig.projectId && firebaseConfig.apiKey);
}

/** Realtime Database URL set — LiveTracking can subscribe to `location/{appointmentId}` (backend writes via Admin SDK). */
export function isRtdbLocationConfigured(): boolean {
  return !!(dbUrl && firebaseConfig.projectId && firebaseConfig.apiKey);
}

export type AppointmentLocationRtdb = {
  lat?: number;
  lng?: number;
  beauticianId?: string;
  appointmentId?: string;
  etaMinutes?: number | null;
  distanceKm?: number | null;
  updatedAt?: number;
};

/**
 * Live updates when beautician sends location (backend writes to RTDB).
 * Deploy RTDB rules so clients may read `location/*` (see firebase-database.rules.json).
 */
export function subscribeAppointmentLocation(
  appointmentId: string,
  callback: (data: AppointmentLocationRtdb | null) => void
): () => void {
  if (!isRtdbLocationConfigured() || !appointmentId) return () => {};
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return () => {};
  try {
    const db = getDatabase(firebaseApp);
    const locationRef = ref(db, `location/${appointmentId}`);
    return onValue(locationRef, (snapshot) => {
      callback((snapshot.exists() ? snapshot.val() : null) as AppointmentLocationRtdb | null);
    });
  } catch (e) {
    console.warn("[RTDB] subscribeAppointmentLocation failed:", e);
    return () => {};
  }
}

export function onFCMMessage(
  callback: (payload: { data?: Record<string, string>; notification?: { title?: string; body?: string } }) => void
): () => void {
  // Fast feature check to avoid calling Firebase messaging on unsupported browsers
  if (
    typeof window === "undefined" ||
    typeof navigator === "undefined" ||
    !("serviceWorker" in navigator) ||
    !(window as any).PushManager
  ) {
    return () => {};
  }

  const app = getFirebaseApp();
  if (!app) return () => {};
  try {
    const messaging = getMessaging(app);
    const unsubscribe = onMessage(messaging, callback);
    return unsubscribe;
  } catch {
    return () => {};
  }
}
