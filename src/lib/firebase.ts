import { initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: ReturnType<typeof initializeApp> | null = null;

export function getFirebaseApp() {
  if (!app && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

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

export function onFCMMessage(
  callback: (payload: { data?: Record<string, string>; notification?: { title?: string; body?: string } }) => void
): () => void {
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
