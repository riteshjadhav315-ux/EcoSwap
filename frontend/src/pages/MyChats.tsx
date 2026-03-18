import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, ShoppingBag, Loader2, ArrowRight, User } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { getMyChats, Chat } from "../services/chatService";

export default function MyChats() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      if (!user) return;
      try {
        const newChats = await getMyChats(user.uid);
        setChats(newChats);
      } catch (err) {
        console.error("Error fetching chats:", err);
        setError("Failed to load conversations.");
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
    const interval = setInterval(fetchChats, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50/30">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-emerald-50/30">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md border border-emerald-100">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50/30 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-emerald-950 tracking-tight">Messages</h1>
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
            <MessageCircle className="w-6 h-6" />
          </div>
        </div>

        {chats.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-12 text-center border border-emerald-100 shadow-xl shadow-emerald-100/50">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-emerald-950 mb-2">No conversations yet</h2>
            <p className="text-emerald-600/70 mb-8">Start a chat with a seller to ask about an item you're interested in.</p>
            <Link to="/" className="inline-block px-8 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all">
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {chats.map((chat) => {
              const otherParticipantName = user?.uid === chat.buyerId ? chat.sellerName : chat.buyerName;
              return (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[2rem] border border-emerald-100 hover:border-emerald-300 transition-all shadow-sm hover:shadow-xl hover:shadow-emerald-100/50 group overflow-hidden"
                >
                  <Link to={`/chat/${chat.id}`} className="flex items-center p-6 gap-6">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xl shadow-inner">
                        {otherParticipantName.charAt(0)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-white p-1 shadow-md border border-emerald-50">
                        <img 
                          src={chat.productImageUrl} 
                          alt={chat.productTitle} 
                          className="w-full h-full object-cover rounded-lg"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-emerald-950 text-lg truncate">{otherParticipantName}</h3>
                        <span className="text-xs text-emerald-400 font-medium">
                          {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recent'}
                        </span>
                      </div>
                      <p className="text-sm text-emerald-600 font-medium mb-1 truncate">Re: {chat.productTitle}</p>
                      <p className="text-sm text-emerald-500 truncate italic">
                        {chat.lastMessage || "Start the conversation..."}
                      </p>
                    </div>

                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
