export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  description: string;
  category: string;
  status?: 'available' | 'reserved' | 'sold';
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  queuingNumber: number;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  totalPrice: number;
  createdAt: string; // ISO String
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  createdAt: string; // ISO String
}

export interface DatabaseStatus {
  isCloud: boolean;
  isConnected: boolean;
  projectId: string | null;
}
