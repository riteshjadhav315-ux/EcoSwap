import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  MessageCircle, 
  Phone, 
  ExternalLink, 
  ShoppingBag, 
  Package, 
  User, 
  ArrowRight,
  ShieldCheck,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";

interface FAQItem {
  question: string;
  answer: string;
  category: "buying" | "selling" | "account" | "safety";
}

const faqs: FAQItem[] = [
  {
    category: "buying",
    question: "How do I buy a product on EcoSwap?",
    answer: "To buy a product, simply browse the marketplace, find an item you like, and click on it to view details. You can then chat with the seller or click the 'Buy Now' button to proceed with the payment."
  },
  {
    category: "selling",
    question: "How do I list an item for sale?",
    answer: "Click on the 'Sell' button in the navigation bar. Fill in the product details, upload high-quality images, set a fair price, and click 'List Product'. Your item will be visible to all EcoSwappers immediately."
  },
  {
    category: "account",
    question: "How can I update my profile information?",
    answer: "Go to your Profile page by clicking on your avatar or 'Settings'. Click the 'Edit Profile' button to update your name, phone number, or location. Don't forget to save your changes!"
  },
  {
    category: "safety",
    question: "Is EcoSwap safe for transactions?",
    answer: "We prioritize safety by using secure payment gateways and providing a chat system for users to communicate. We recommend meeting in public places for local pickups and never sharing sensitive personal information."
  },
  {
    category: "buying",
    question: "What if the item I received is not as described?",
    answer: "If an item doesn't match the description, please contact the seller first through our chat system. If you can't resolve it, reach out to our support team with your order details."
  },
  {
    category: "selling",
    question: "How do I get paid for my sales?",
    answer: "Payments are processed through our secure payment partner. Once a buyer completes the payment, the funds are held securely and released to your linked account after the transaction is verified."
  }
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: "all", label: "All Questions", icon: HelpCircle },
    { id: "buying", label: "Buying", icon: ShoppingBag },
    { id: "selling", label: "Selling", icon: Package },
    { id: "account", label: "Account", icon: User },
    { id: "safety", label: "Safety", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-emerald-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-emerald-600 rounded-[2rem] shadow-xl shadow-emerald-200 mb-6"
          >
            <HelpCircle className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl font-black text-emerald-950 mb-4"
          >
            How can we help you?
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-emerald-600/70 font-medium text-lg max-w-2xl mx-auto"
          >
            Find answers to common questions about buying, selling, and managing your EcoSwap account.
          </motion.p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-12">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-emerald-400" />
          </div>
          <input
            type="text"
            placeholder="Search for questions, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-16 pr-6 py-6 bg-white border-none rounded-[2.5rem] shadow-xl shadow-emerald-100/50 focus:ring-4 focus:ring-emerald-500/10 text-emerald-950 font-medium text-lg placeholder:text-emerald-200"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
                activeCategory === cat.id 
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105" 
                  : "bg-white text-emerald-600 hover:bg-emerald-50"
              }`}
            >
              <cat.icon className="w-5 h-5" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-4 mb-16">
          <AnimatePresence mode="popLayout">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[2rem] shadow-lg shadow-emerald-100/20 border border-emerald-50 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                    className="w-full flex items-center justify-between p-8 text-left hover:bg-emerald-50/30 transition-all"
                  >
                    <span className="text-lg font-black text-emerald-950 pr-8">{faq.question}</span>
                    {expandedIndex === index ? (
                      <ChevronUp className="w-6 h-6 text-emerald-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-emerald-400 shrink-0" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-8 pb-8"
                      >
                        <div className="pt-4 border-t border-emerald-50 text-emerald-700 font-medium leading-relaxed">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-emerald-100"
              >
                <HelpCircle className="w-16 h-16 text-emerald-100 mx-auto mb-4" />
                <p className="text-emerald-950 font-black text-xl mb-2">No results found</p>
                <p className="text-emerald-600/60 font-medium">Try adjusting your search or category filter.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Contact Support */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-emerald-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <MessageCircle className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-4">Still have questions?</h3>
              <p className="text-emerald-100/70 font-medium mb-8">
                Our support team is available 24/7 to help you with any issues or inquiries.
              </p>
              <div className="space-y-4">
                <a href="mailto:support@ecoswap.com" className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all group">
                  <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Email Us</div>
                    <div className="font-bold">support@ecoswap.com</div>
                  </div>
                  <ArrowRight className="w-5 h-5 ml-auto opacity-0 group-hover:opacity-100 transition-all" />
                </a>
                <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl group cursor-default">
                  <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Call Us</div>
                    <div className="font-bold">+91 1800-ECO-SWAP</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-emerald-100/50 border border-emerald-50">
            <h3 className="text-2xl font-black text-emerald-950 mb-6">Quick Links</h3>
            <div className="grid grid-cols-1 gap-4">
              <Link to="/chats" className="flex items-center justify-between p-5 bg-emerald-50 rounded-2xl hover:bg-emerald-100 transition-all group">
                <div className="flex items-center gap-4">
                  <MessageCircle className="w-6 h-6 text-emerald-600" />
                  <span className="font-bold text-emerald-900">Chat with Sellers</span>
                </div>
                <ExternalLink className="w-5 h-5 text-emerald-300 group-hover:text-emerald-600" />
              </Link>
              <Link to="/dashboard?tab=purchases" className="flex items-center justify-between p-5 bg-emerald-50 rounded-2xl hover:bg-emerald-100 transition-all group">
                <div className="flex items-center gap-4">
                  <ShoppingBag className="w-6 h-6 text-emerald-600" />
                  <span className="font-bold text-emerald-900">My Orders</span>
                </div>
                <ExternalLink className="w-5 h-5 text-emerald-300 group-hover:text-emerald-600" />
              </Link>
              <Link to="/profile" className="flex items-center justify-between p-5 bg-emerald-50 rounded-2xl hover:bg-emerald-100 transition-all group">
                <div className="flex items-center gap-4">
                  <User className="w-6 h-6 text-emerald-600" />
                  <span className="font-bold text-emerald-900">Account Settings</span>
                </div>
                <ExternalLink className="w-5 h-5 text-emerald-300 group-hover:text-emerald-600" />
              </Link>
              <Link to="/sell" className="flex items-center justify-between p-5 bg-emerald-50 rounded-2xl hover:bg-emerald-100 transition-all group">
                <div className="flex items-center gap-4">
                  <Zap className="w-6 h-6 text-emerald-600" />
                  <span className="font-bold text-emerald-900">List an Item</span>
                </div>
                <ExternalLink className="w-5 h-5 text-emerald-300 group-hover:text-emerald-600" />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center">
          <p className="text-emerald-600/50 font-medium">
            EcoSwap Help Center &copy; 2024. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
