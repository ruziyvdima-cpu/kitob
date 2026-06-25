export type UserRole = 'user' | 'admin';
export type PremiumPlan = 'free' | 'monthly' | 'yearly';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isVerified: boolean;
  premiumStatus: PremiumPlan;
  premiumExpiresAt?: string;
  verificationCode?: string;
  resetCode?: string;
  telegramId?: string;
  telegramLinkCode?: string;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  language: 'uz' | 'ru' | 'en';
  isPremium: boolean;
  coverUrl: string;
  content: string; // Dynamic text content of the book
  rating: number;
  reviewCount: number;
  price: number; // 0 for free, >0 for purchasable
  salesCount: number;
  youtubeUrl?: string;
}

export interface Review {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  bookId: string;
  title: string;
  coverUrl: string;
  price: number;
  status: 'pending' | 'completed';
  createdAt: string;
}

export interface ReadingHistoryItem {
  id: string;
  userId: string;
  bookId: string;
  title: string;
  author: string;
  coverUrl: string;
  progressPercent: number;
  lastReadAt: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  bookId: string;
  pageNumber: number;
  note: string;
  createdAt: string;
}

export interface Category {
  id: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  slug: string;
}

export interface TranslationSet {
  welcome: string;
  tagline: string;
  searchPlaceholder: string;
  allCategories: string;
  read: string;
  buy: string;
  free: string;
  premium: string;
  login: string;
  register: string;
  logout: string;
  profile: string;
  adminPanel: string;
  cart: string;
  history: string;
  favorites: string;
  language: string;
  uzbek: string;
  russian: string;
  english: string;
  books: string;
  authors: string;
  categories: string;
  rating: string;
  reviews: string;
  addToCart: string;
  buyNow: string;
  paymentSuccess: string;
  noBooksFound: string;
  readerSettings: string;
  fontSize: string;
  theme: string;
  bookmarks: string;
  addBookmark: string;
  bookmarkNote: string;
  telegramIntegration: string;
  telegramCodeLabel: string;
  telegramInstructions: string;
  premiumPlans: string;
  monthlyPlan: string;
  yearlyPlan: string;
  subscribeNow: string;
  activePlan: string;
  expiresOn: string;
  historyTitle: string;
  favoritesTitle: string;
}
