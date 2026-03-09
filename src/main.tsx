import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

function showFatalError(msg: string) {
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `<div style="padding:1.5rem;font-family:sans-serif;max-width:600px;background:#fef2f2;color:#b91c1c;min-height:100vh;box-sizing:border-box"><h2 style="margin:0 0 0.5rem">Something went wrong</h2><pre style="background:#fff;padding:0.75rem;overflow:auto;font-size:12px;border-radius:6px;margin:0">${msg}</pre></div>`;
  }
}

window.addEventListener("error", (e) => {
  if (!e.message?.includes("ResizeObserver")) {
    showFatalError(e.message || "Unknown error");
  }
});
window.addEventListener("unhandledrejection", (e) => {
  const msg = e.reason?.message ?? String(e.reason ?? "Unknown error");
  showFatalError(msg);
  e.preventDefault();
});

const rootEl = document.getElementById("root");
if (!rootEl) {
  document.body.innerHTML = "<pre style='padding:1rem;color:red'>Root element #root not found.</pre>";
} else {
  try {
    createRoot(rootEl).render(<App />);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    showFatalError(msg);
    console.error(err);
  }
}
