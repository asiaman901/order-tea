import { Timestamp, FieldValue } from "firebase/firestore";

export interface DBProduct {
  id: string; // Document ID
  category: string;
  name: string;
  englishName?: string;
  priceL: number;
  priceBottle?: number;
  isHotOption?: boolean;
  isRecommended?: boolean;
  isNew?: boolean;
  hasFixSugar?: boolean;
  isActive: boolean;
  createdAt: string | Timestamp | FieldValue;
  updatedAt: string | Timestamp | FieldValue;
}

export interface DBOrder {
  id: string;
  userId: string;
  customerName?: string;
  customerPhone?: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  totalPrice: number;
  items: Array<{
    productId: string;
    name: string;
    size: string;
    sugar: string;
    ice: string;
    price: number;
    quantity: number;
    toppings: string[];
  }>;
  createdAt: string | Timestamp | FieldValue;
  updatedAt: string | Timestamp | FieldValue;
}
