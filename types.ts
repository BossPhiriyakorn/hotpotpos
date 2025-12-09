import type { ReactNode } from 'react';

export enum AppScreen {
  Welcome,
  LanguageSelection, // New screen
  Weighing,
  Customize,
  Summary,
  PaymentSuccess, 
  MemberScan,
  LineNotification, // New screen for LINE notification QR scan
  Confirmation,
}

export enum AppRole {
  None,
  Kiosk,
  Kitchen,
  QueueDisplay,
  Admin,
}

export interface Item {
  id: number;
  name: string;
  price: number;
  image: string;
  description?: string;
  isSpecial?: boolean;
}

export interface Soup {
  id: string;
  name: string;
  image: string;
  isSpicy?: boolean;
  isSpecial?: boolean;
}

export interface SpiceLevel {
  id: string;
  name: string;
  price?: number;
}

export enum DiningLocation {
  DineIn = 'DINE_IN',
  Takeaway = 'TAKEAWAY',
}

export enum CookingStyle {
  ReadyToEat = 'READY_TO_EAT',
  SeparateSoup = 'SEPARATE_SOUP',
  Uncooked = 'UNCOOKED',
}

export interface DiningLocationOption {
  id: DiningLocation;
  name: string;
}

export interface CookingStyleOption {
  id: CookingStyle;
  name: string;
}

export interface Order {
  id?: number; // Order ID from backend
  weight: number;
  pricePer100g: number;
  basePrice: number;
  spiceLevel: SpiceLevel | null;
  soup: Soup | null;
  addOns: Item[];
  totalPrice: number;
  vat: number;
  queueNumber: number;
  diningLocation: DiningLocationOption | null;
  tableNumber: number | null;
  cookingStyle: CookingStyleOption | null;
  note: string;
}

// Types for Kitchen Display
export interface KitchenOrderItem {
  name: string;
  quantity: number;
}

export type KitchenOrderStatus = 'queued' | 'in-progress' | 'done';

export interface KitchenOrder {
  id: number; // This will be the queue number
  status: KitchenOrderStatus;
  items: KitchenOrderItem[];
  diningType: 'dine-in' | 'takeaway';
  tableNumber?: number;
  cookingStyle: string; // e.g. "พร้อมทาน", "แยกน้ำซุป"
  note?: string;
}