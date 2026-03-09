import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

function firebaseSwPlugin() {
  return {
    name: "firebase-messaging-sw",
    configResolved(config: { mode: string }) {
      const env = loadEnv(config.mode, process.cwd(), "");
      const apiKey = env.VITE_FIREBASE_API_KEY || "";
      const projectId = env.VITE_FIREBASE_PROJECT_ID || "";
      if (!apiKey || !projectId) return;
      const swContent = `// Auto-generated from .env - do not edit
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey: "${apiKey}",
  authDomain: "${env.VITE_FIREBASE_AUTH_DOMAIN || ""}",
  projectId: "${projectId}",
  storageBucket: "${env.VITE_FIREBASE_STORAGE_BUCKET || ""}",
  messagingSenderId: "${env.VITE_FIREBASE_MESSAGING_SENDER_ID || ""}",
  appId: "${env.VITE_FIREBASE_APP_ID || ""}"
});
firebase.messaging().onBackgroundMessage(function(payload) {
  var title = (payload.notification && payload.notification.title) || 'Nova ';
  var body = (payload.notification && payload.notification.body) || '';
  return self.registration.showNotification(title, { body: body, icon: '/placeholder.svg', data: payload.data || {} });
});
`;
      const outPath = path.resolve(process.cwd(), "public", "firebase-messaging-sw.js");
      fs.writeFileSync(outPath, swContent);
    },
  };
}

// https://vitejs.dev/config/
// Use "./" so built app works when opening index.html via file:// (double-click).
// For deploy on a subpath, set VITE_BASE_URL e.g. /2026/beautician/customer/
export default defineConfig(({ mode }) => ({
  base: process.env.VITE_BASE_URL || "./",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [firebaseSwPlugin(), react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
