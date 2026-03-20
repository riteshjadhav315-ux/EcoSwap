import React, { useState, useEffect, useRef, FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Send, ArrowLeft, Loader2, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { getMessages, sendMessage, Chat as ChatType, Message, socket } from "../services/chatService";
import { apiFetch } from "../services/api";

export default function Chat() {
  const { id: chatId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chat, setChat] = useState<ChatType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!chatId || !user) return;

    const fetchChatAndMessages = async () => {
      try {
        const chatData = await apiFetch<any>(`/api/chats/${chatId}`);
        
        if (!chatData.participants?.includes(user.uid)) {
          navigate("/");
          return;
        }
        setChat({ ...chatData, id: chatData._id });

        const msgs = await getMessages(chatId);
        setMessages(msgs);
        setTimeout(scrollToBottom, 100);
      } catch (err) {
        console.error("Error fetching chat:", err);
        setError("Failed to load chat conversation.");
      } finally {
        setLoading(false);
      }
    };

    fetchChatAndMessages();

    socket.emit("join_chat", chatId);

    const handleNewMessage = (msg: any) => {
      if (String(msg.chatId) === chatId) {
        setMessages(prev => [...prev, { ...msg, id: msg._id }]);
        setTimeout(scrollToBottom, 100);
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [chatId, user, navigate]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !user) return;

    const text = newMessage;
    setNewMessage("");
    try {
      await sendMessage(chatId, user.uid, user.name || "User", text);
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50/30">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (error || !chat) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-emerald-50/30">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md border border-emerald-100">
          <p className="text-red-600 font-medium mb-4">{error || "Chat not found"}</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const otherParticipantName = user?.uid === chat.buyerId ? chat.sellerName : chat.buyerName;

  return (
    <div className="h-[calc(100vh-64px)] bg-emerald-50/30 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-emerald-100 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-emerald-50 rounded-full transition-colors text-emerald-600"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                {otherParticipantName.charAt(0)}
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-emerald-950 truncate">{otherParticipantName}</h2>
                <p className="text-[10px] text-emerald-500 font-medium truncate">Re: {chat.productTitle}</p>
              </div>
            </div>
          </div>
          <Link 
            to={`/product/${chat.productId}`}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all border border-emerald-100"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">View Item</span>
          </Link>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.senderId === user?.uid ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                  msg.senderId === user?.uid
                    ? "bg-emerald-600 text-white rounded-tr-none"
                    : "bg-white text-emerald-950 rounded-tl-none border border-emerald-100"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1 opacity-70 ${msg.senderId === user?.uid ? "text-emerald-100" : "text-emerald-500"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="bg-white border-t border-emerald-100 p-4 sticky bottom-0">
        <form 
          onSubmit={handleSendMessage}
          className="max-w-4xl mx-auto flex gap-3"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-emerald-50/50 border border-emerald-100 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-emerald-950"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-emerald-600 text-white p-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:shadow-none active:scale-95"
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
      </footer>
    </div>
  );
}
