export interface Service {
  id: string;
  name: string;
  category: string;
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
  image: string;
  rating: number;
  experience: string;
  servicesCompleted: number;
  specialties: string[];
}

export interface BookingOrder {
  id: string;
  services: { service: Service; quantity: number }[];
  date: string;
  timeSlot: string;
  address: string;
  paymentMode: string;
  status: "booked" | "assigned" | "on_the_way" | "started" | "completed" | "cancelled";
  beautician?: Beautician;
  total: number;
  createdAt: string;
}
