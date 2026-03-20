import { io } from "socket.io-client";
import { Product } from "../types";
import { apiFetch, SOCKET_URL } from "./api";

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
});

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

export const startChat = async (
  product: Product,
  buyerId: string,
  buyerName: string
) => {
  const data = await apiFetch<{ _id: string }>("/api/chats", {
    method: "POST",
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

  return data._id;
};

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

export const getMyChats = async (userId: string) => {
  const data = await apiFetch<any[]>(`/api/chats?userId=${encodeURIComponent(userId)}`);

  return data.map((chat) => ({
    ...chat,
    id: chat._id,
  }));
};

export const getMessages = async (chatId: string) => {
  const data = await apiFetch<any[]>(`/api/chats/${chatId}/messages`);

  return data.map((message) => ({
    ...message,
    id: message._id,
  }));
};

export const listenToMessages = (
  chatId: string,
  callback: (message: Message) => void
) => {
  socket.emit("join_chat", chatId);
  socket.off("new_message");

  socket.on("new_message", (message: any) => {
    if (String(message.chatId) === chatId) {
      callback({
        ...message,
        id: message._id,
      });
    }
  });

  return () => {
    socket.off("new_message");
  };
};
