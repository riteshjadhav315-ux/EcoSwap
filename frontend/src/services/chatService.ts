import { io } from "socket.io-client";
import { Product } from "../types";

const API_URL = "const API_URL = "https://ecoswap-backend-ows2.onrender.com/api";";
export const socket = io();

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
  participants: string[];
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export const startChat = async (product: Product, buyerId: string, buyerName: string) => {
  const response = await fetch(`${API_URL}/chats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: product.id,
      productTitle: product.title,
      productImageUrl: product.imageUrl || product.images?.[0] || "",
      buyerId,
      buyerName,
      sellerId: product.sellerId,
      sellerName: product.sellerName,
    }),
  });
  
  if (!response.ok) throw new Error("Failed to start chat");
  const data = await response.json();
  return data._id;
};

export const sendMessage = async (chatId: string, senderId: string, senderName: string, text: string) => {
  socket.emit("send_message", { chatId, senderId, senderName, text });
};

export const getMyChats = async (userId: string) => {
  const response = await fetch(`${API_URL}/chats?userId=${userId}`);
  if (!response.ok) throw new Error("Failed to fetch chats");
  const data = await response.json();
  return data.map((c: any) => ({ ...c, id: c._id }));
};

export const getMessages = async (chatId: string) => {
  const response = await fetch(`${API_URL}/chats/${chatId}/messages`);
  if (!response.ok) throw new Error("Failed to fetch messages");
  const data = await response.json();
  return data.map((m: any) => ({ ...m, id: m._id }));
};

export const listenToMessages = (chatId: string, callback: (message: Message) => void) => {
  socket.emit("join_chat", chatId);
  socket.on("new_message", (message: any) => {
    callback({ ...message, id: message._id });
  });
  
  return () => {
    socket.off("new_message");
  };
};
