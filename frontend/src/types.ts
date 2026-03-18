export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  images?: string[];
  imageUrl?: string;
  location?: string;
  sellerId: string;
  sellerName: string;
  sellerEmail?: string;
  sellerPhone?: string;
  sellerPhoto?: string;
  status: 'available' | 'sold';
  createdAt: string;
}

export interface User {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  bio?: string;
  location?: string;
}

export interface Chat {
  id: string;
  productId: string;
  productTitle: string;
  productImageUrl: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  lastMessage: string;
  lastMessageAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'offer' | 'system';
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}
