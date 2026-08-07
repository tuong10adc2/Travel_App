export type UserRole = "user" | "admin" | "content_editor" | "support";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  role: UserRole;
  preferences?: string[];
  language?: "vi" | "en";
  isDisabled: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface OpeningHours {
  [day: string]: string;
}

export interface Place {
  id: string;
  name: string;
  description: string;
  address: string;
  location?: { latitude: number; longitude: number } | null;
  tags: string[];
  images: string[];
  coverImage: string;
  openingHours?: OpeningHours;
  ticketPrice: number;
  ratingAvg: number;
  ratingCount: number;
  visitDurationMinutes: number;
  isFeatured: boolean;
  isActive: boolean;
  has360: boolean;
  createdBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Media360 {
  id: string;
  placeId: string;
  type: "image" | "video";
  url: string;
  title: string;
  order: number;
  hotspots?: { targetMediaId: string; yaw: number; pitch: number; label: string }[];
  createdAt?: unknown;
}

export interface Tour {
  id: string;
  name: string;
  description: string;
  placeIds: string[];
  coverImage: string;
  price: number;
  durationDays: number;
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type ReviewStatus = "pending" | "approved" | "hidden";
export type ReviewTargetType = "place" | "tour";

export interface Review {
  id: string;
  targetType: ReviewTargetType;
  targetId: string;
  userId: string;
  rating: number;
  comment: string;
  images?: string[];
  status: ReviewStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Itinerary {
  id: string;
  userId: string;
  name: string;
  startDate?: unknown;
  endDate?: unknown;
  isShared: boolean;
  shareCode?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ItineraryItem {
  id: string;
  placeId: string;
  dayIndex: number;
  order: number;
  note?: string;
  createdAt?: unknown;
}

export interface SavedPlace {
  id: string;
  userId: string;
  placeId: string;
  createdAt?: unknown;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  placeCards?: { placeId: string; name: string; image: string; rating: number }[];
  createdAt?: unknown;
}

export const PLACE_TAGS = [
  "Lịch sử",
  "Thiên nhiên",
  "Ẩm thực",
  "Văn hoá",
  "Biển đảo",
  "Núi rừng",
  "Tâm linh",
  "Đô thị",
] as const;

export const WEEKDAYS: { key: string; label: string }[] = [
  { key: "mon", label: "Thứ 2" },
  { key: "tue", label: "Thứ 3" },
  { key: "wed", label: "Thứ 4" },
  { key: "thu", label: "Thứ 5" },
  { key: "fri", label: "Thứ 6" },
  { key: "sat", label: "Thứ 7" },
  { key: "sun", label: "Chủ nhật" },
];
