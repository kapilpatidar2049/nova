/** Razorpay Checkout (https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration) */

export type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if ((window as unknown as { Razorpay?: unknown }).Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

type OpenCheckoutParams = {
  keyId: string;
  orderId: string;
  currency?: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
};

/** Opens Razorpay and resolves with payment ids + signature for server verification. Rejects if checkout fails to load or user closes the modal without paying. */
export async function openRazorpayCheckout(params: OpenCheckoutParams): Promise<RazorpayHandlerResponse> {
  const loaded = await loadRazorpayScript();
  if (!loaded) throw new Error("Could not load Razorpay checkout");

  const Razorpay = (window as unknown as { Razorpay: new (opts: Record<string, unknown>) => { open: () => void } })
    .Razorpay;
  if (!Razorpay) throw new Error("Razorpay is not available");

  return new Promise((resolve, reject) => {
    // With `order_id`, amount is taken from the server-created order (do not pass amount).
    const rzp = new Razorpay({
      key: params.keyId,
      order_id: params.orderId,
      currency: params.currency ?? "INR",
      name: params.name,
      description: params.description,
      prefill: {
        name: params.name,
        email: params.email || "",
        contact: params.phone || "",
      },
      theme: { color: "#8b5cf6" },
      handler: (response: RazorpayHandlerResponse) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled")),
      },
    });

    rzp.open();
  });
}
