export type Role = "attendee" | "organizer" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
}

export type EventCategory = "film" | "concert" | "orchestra" | "other";

export interface PriceTier {
  seat_section_id: number;
  section_name: string;
  price: number;
}

export interface Showtime {
  id: number;
  starts_at: string;
  venue?: { id: number; name: string; city: string; address: string | null };
  prices?: PriceTier[];
  availability?: { total: number; available: number; sold_out: boolean };
}

export interface EventSummary {
  id: number;
  title: string;
  slug: string;
  category: EventCategory;
  description: string | null;
  poster_url: string | null;
  next_showtime_at?: string;
  min_price?: number;
  showtimes?: Showtime[];
}

export interface Paginated<T> {
  data: T[];
  meta: { current_page: number; last_page: number; total: number };
}

export interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
}

export interface SeatSection {
  id: number;
  name: string;
  price: number;
}

export interface Seat {
  id: number;
  row_label: string;
  seat_number: number;
  section_id: number;
  price: number;
  status: "available" | "held" | "sold";
  mine: boolean;
  held_until: string | null;
}

export interface SeatMap {
  showtime: {
    id: number;
    starts_at: string;
    event: { id: number; title: string; slug: string };
    venue: { id: number; name: string; city: string };
  };
  sections: SeatSection[];
  seats: Seat[];
}

export type OrderStatus = "pending" | "paid" | "expired" | "cancelled" | "failed";

export interface OrderItem {
  id: number;
  seat_label: string;
  price: number;
  ticket: { code: string; checked_in_at: string | null } | null;
}

export interface Order {
  id: number;
  code: string;
  status: OrderStatus;
  total_amount: number;
  expires_at: string;
  paid_at: string | null;
  snap_token?: string | null;
  client_key?: string | null;
  snap_js_url?: string;
  showtime?: {
    id: number;
    starts_at: string;
    event: { id: number; title: string; slug: string } | null;
    venue: { name: string; city: string } | null;
  };
  items?: OrderItem[];
}

export type EventStatus = "draft" | "pending_review" | "published" | "rejected";

export interface Venue {
  id: number;
  name: string;
  city: string;
  address: string;
  sections_count?: number;
  seats_count?: number;
  sections?: { id: number; name: string; seats_count: number }[];
}

export interface OrganizerShowtime {
  id: number;
  event_id: number;
  venue_id: number;
  starts_at: string;
  status: "scheduled" | "cancelled" | string;
  venue?: { id: number; name: string; city: string };
  prices?: { seat_section_id: number; price: number }[];
  seat_counts?: { total: number; available: number; held: number; sold: number };
}

export interface OrganizerEvent {
  id: number;
  title: string;
  slug: string;
  category: EventCategory;
  description: string;
  poster_url: string | null;
  status: EventStatus;
  rejection_reason: string | null;
  showtimes_count?: number;
  showtimes?: OrganizerShowtime[];
  created_at: string;
}

/** An event as the admin review endpoints return it. */
export interface AdminEvent extends OrganizerEvent {
  organizer?: { id: number; name: string; email: string };
  reviewed_by: number | null;
  reviewed_at: string | null;
}
