import { io } from "socket.io-client";
import { Product } from "../types";

// 🔥 Backend URL (same as your working one)
const BASE_URL = "https://ecoswap-backend-ows2.onrender.com";

// 🔥 API URL
const API_URL = `${BASE_URL}/api`;

// ✅ Socket connection (with auth support)
export const socket = io(BASE_URL, {
  transports: ["websocket"],
});

// ================= TYPES =================

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

// ================= API FUNCTIONS =================

// ✅ Start chat
export const startChat = async (
  product: Product,
  buyerId: string,
  buyerName: string
) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/chats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
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

// ✅ Send message (via socket)
export const sendMessage = (
  chatId: string,
  senderId: string,
  senderName: string,
  text: string
) => {
  socket.emit("send_message", {
    chatId,
    senderId,
    senderName,
    text,
  });
};

// ✅ Get all chats of user
export const getMyChats = async (userId: string) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/chats?userId=${userId}`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) throw new Error("Failed to fetch chats");

  const data = await response.json();

  return data.map((c: any) => ({
    ...c,
    id: c._id,
  }));
};

// ✅ Get messages of chat
export const getMessages = async (chatId: string) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/chats/${chatId}/messages`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) throw new Error("Failed to fetch messages");

  const data = await response.json();

  return data.map((m: any) => ({
    ...m,
    id: m._id,
  }));
};

// ================= SOCKET LISTENER =================

// ✅ Listen to new messages (REAL-TIME)
export const listenToMessages = (
  chatId: string,
  callback: (message: Message) => void
) => {
  // Join chat room
  socket.emit("join_chat", chatId);

  // Prevent duplicate listeners
  socket.off("new_message");

  socket.on("new_message", (message: any) => {
    if (message.chatId === chatId) {
      callback({
        ...message,
        id: message._id,
      });
    }
  });

  // Cleanup
  return () => {
    socket.off("new_message");
  };
};