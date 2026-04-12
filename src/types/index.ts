/** Salon retail product (vendor inventory) */
export interface ShopProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  unit?: string;
  inStock: number;
  vendorName?: string;
  description?: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  categoryId?: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  duration: string;
  image: string;
  description: string;
  includes: string[];
  wishlisted?: boolean;
}

export interface Beautician {
  id: string;
  name: string;
  phone?: string;
  image: string;
  /** From API when available */
  profileImageUrl?: string | null;
  rating: number;
  experience: string;
  servicesCompleted: number;
  specialties: string[];
}

export interface BookingOrder {
  id: string;
  /** Service booking vs product (shop) order */
  kind?: "service" | "product";
  services: { service: Service; quantity: number }[];
  date: string;
  timeSlot: string;
  address: string;
  addressDetails?: any;
  lat?: number;
  lng?: number;
  paymentMode: string;
  status: "booked" | "assigned" | "on_the_way" | "reached" | "started" | "completed" | "cancelled";
  /** Shown when beautician has arrived and backend status is `reached` */
  serviceStartOtp?: string | null;
  beautician?: Beautician;
  total: number;
  subTotal?: number;
  gstAmount?: number;
  createdAt: string;
  /** Product order line items when kind === "product" */
  productLines?: { name: string; quantity: number; lineTotal: number }[];
  vendorName?: string;
}

export interface Notification {
  id: string;
  type: 'new_job' | 'delay_alert' | 'payment' | 'general' | 'appointment_status';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}
