import serviceHair from "@/assets/service-hair.png";
import serviceMakeup from "@/assets/service-makeup.png";
import serviceFacial from "@/assets/service-facial.png";
import serviceSpa from "@/assets/service-spa.png";
import serviceNails from "@/assets/service-nails.png";
import beauticianImg from "@/assets/beautician.png";

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

export const categories = [
  { id: "hair", name: "Hair", icon: "✂️", image: serviceHair },
  { id: "makeup", name: "Makeup", icon: "💄", image: serviceMakeup },
  { id: "facial", name: "Facial", icon: "✨", image: serviceFacial },
  { id: "spa", name: "Spa", icon: "🧖", image: serviceSpa },
  { id: "nails", name: "Nails", icon: "💅", image: serviceNails },
];

export const services: Service[] = [
  {
    id: "1", name: "Classic Haircut & Styling", category: "hair", price: 499, originalPrice: 799,
    rating: 4.8, reviews: 2340, duration: "45 min", image: serviceHair,
    description: "Professional haircut with wash, conditioning, and blow-dry styling by expert stylists.",
    includes: ["Hair wash", "Conditioning", "Haircut", "Blow dry", "Styling"],
  },
  {
    id: "2", name: "Bridal Makeup Package", category: "makeup", price: 4999, originalPrice: 7999,
    rating: 4.9, reviews: 1280, duration: "2 hrs", image: serviceMakeup,
    description: "Complete bridal makeup with HD products, airbrush finish, and hairstyling.",
    includes: ["Base makeup", "Eye makeup", "Lip makeup", "Contouring", "Hairstyling", "Draping assistance"],
  },
  {
    id: "3", name: "Gold Facial Treatment", category: "facial", price: 1299, originalPrice: 1999,
    rating: 4.7, reviews: 3120, duration: "1 hr", image: serviceFacial,
    description: "Luxurious gold facial for glowing, youthful skin with deep cleansing and massage.",
    includes: ["Deep cleansing", "Exfoliation", "Gold mask", "Face massage", "Moisturizing"],
  },
  {
    id: "4", name: "Full Body Spa & Massage", category: "spa", price: 2499, originalPrice: 3999,
    rating: 4.9, reviews: 1890, duration: "1.5 hrs", image: serviceSpa,
    description: "Relaxing full body spa with aromatic oils, hot stone therapy, and deep tissue massage.",
    includes: ["Aromatherapy", "Hot stone", "Deep tissue massage", "Steam", "Moisturizing"],
  },
  {
    id: "5", name: "Gel Nail Art & Manicure", category: "nails", price: 899, originalPrice: 1299,
    rating: 4.6, reviews: 2560, duration: "1 hr", image: serviceNails,
    description: "Beautiful gel nail art with manicure, cuticle care, and hand massage.",
    includes: ["Nail shaping", "Cuticle care", "Gel polish", "Nail art", "Hand massage"],
  },
  {
    id: "6", name: "Hair Smoothening", category: "hair", price: 3499, originalPrice: 5999,
    rating: 4.7, reviews: 980, duration: "3 hrs", image: serviceHair,
    description: "Professional keratin smoothening treatment for silky, frizz-free hair.",
    includes: ["Hair wash", "Keratin treatment", "Straightening", "Serum application"],
  },
  {
    id: "7", name: "Party Makeup", category: "makeup", price: 1999, originalPrice: 2999,
    rating: 4.8, reviews: 1560, duration: "1 hr", image: serviceMakeup,
    description: "Glamorous party makeup with long-lasting products and trendy looks.",
    includes: ["Base makeup", "Eye makeup", "Lip makeup", "Setting spray"],
  },
  {
    id: "8", name: "De-Tan Facial", category: "facial", price: 799, originalPrice: 1199,
    rating: 4.5, reviews: 4200, duration: "45 min", image: serviceFacial,
    description: "Effective de-tan treatment to remove sun damage and restore natural skin tone.",
    includes: ["Cleansing", "De-tan pack", "Massage", "Sunscreen"],
  },
];

export const beauticians: Beautician[] = [
  {
    id: "b1", name: "Priya Sharma", image: beauticianImg,
    rating: 4.9, experience: "8 years", servicesCompleted: 3420,
    specialties: ["Bridal Makeup", "Hair Styling", "Facial"],
  },
  {
    id: "b2", name: "Anita Reddy", image: beauticianImg,
    rating: 4.8, experience: "5 years", servicesCompleted: 2180,
    specialties: ["Nail Art", "Spa", "Facial"],
  },
  {
    id: "b3", name: "Meera Kapoor", image: beauticianImg,
    rating: 4.7, experience: "6 years", servicesCompleted: 2890,
    specialties: ["Hair Color", "Smoothening", "Makeup"],
  },
];

export const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "02:00 PM", "02:30 PM", "03:00 PM",
  "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM",
];
