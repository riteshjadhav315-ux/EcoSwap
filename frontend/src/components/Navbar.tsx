import { Link, useNavigate } from "react-router-dom";
import { Search, User, Menu, Recycle, MessageCircle, HelpCircle, Languages, ChevronDown, MapPin, LogIn, Sparkles, PlusCircle, Bell, X, Trash2, LogOut, LayoutDashboard, Filter, Check, ShieldCheck } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useSearch } from "../context/SearchContext";
import { CATEGORIES } from "../constants";
import { getMyNotifications, markAsRead, Notification } from "../services/notificationService";
import { apiFetch } from "../services/api";
import { formatDistanceToNow } from "date-fns";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, selectedLocation, setSelectedLocation } = useSearch();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const fetchNotifications = async () => {
      if (user?.uid) {
        const data = await getMyNotifications(user.uid);
        setNotifications(data);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [user?.uid]);

  const handleLogout = async () => {
    await logout();
    setIsProfileOpen(false);
    navigate("/auth");
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const locations = ["All Locations", "Mumbai", "Delhi", "Pune", "Bangalore", "Hyderabad", "Chennai", "Kolkata"];
  
  const profileMenuItems = [
    { label: "My Profile", icon: User, href: "/profile", color: "text-emerald-600" },
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", color: "text-emerald-600" },
    ...(user?.role === 'admin' ? [{ label: "Admin Panel", icon: ShieldCheck, href: "/admin", color: "text-purple-600" }] : []),
    { label: "Chats", icon: MessageCircle, href: "/chats", color: "text-emerald-600" },
    { label: "Help", icon: HelpCircle, href: "/help", color: "text-amber-600" },
    { label: "Select language", icon: Languages, onClick: () => setIsLanguageOpen(true), color: "text-indigo-600" },
  ];

  const languages = [
    { name: "English", code: "en" },
    { name: "Hindi", code: "hi" },
    { name: "Marathi", code: "mr" },
    { name: "Spanish", code: "es" },
    { name: "French", code: "fr" },
    { name: "German", code: "de" },
  ];

  const [dbStatus, setDbStatus] = useState<'connected' | 'fallback' | 'loading'>('loading');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const data = await apiFetch<any>("/api/health");
        if (data.database === "connected" && data.isAtlas) {
          setDbStatus('connected');
        } else {
          setDbStatus('fallback');
          if (data.connectionError) {
            console.error("MongoDB Connection Error:", data.connectionError);
          }
        }
      } catch (error) {
        setDbStatus('fallback');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-emerald-100">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <div className="bg-emerald-600 p-1.5 rounded-lg group-hover:bg-emerald-500 transition-colors">
                <Recycle className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
                EcoSwap
              </span>
            </Link>
            
            {/* DB Status Badge */}
            <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
              dbStatus === 'connected' 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                dbStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
              {dbStatus === 'connected' ? 'Atlas Live' : 'Local Mode'}
            </div>
          </div>

          {/* Middle Section: Location, Search */}
          <div className="hidden md:flex flex-1 items-center gap-4 lg:gap-6 mr-auto ml-2 lg:ml-4 max-w-4xl">
            {/* Location Selector */}
            <div className="relative" ref={locationRef}>
              <button 
                onClick={() => setIsLocationOpen(!isLocationOpen)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-emerald-50 rounded-xl transition-colors border border-emerald-100 group shrink-0"
              >
                <MapPin className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                <div className="text-left hidden lg:block">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest leading-none mb-0.5">Location</p>
                  <p className="text-xs font-bold text-emerald-900 truncate max-w-[100px]">{selectedLocation}</p>
                </div>
                <ChevronDown className={`w-3 h-3 text-emerald-400 transition-transform ${isLocationOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isLocationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-emerald-50 overflow-hidden z-[100] py-2"
                  >
                    {locations.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => {
                          setSelectedLocation(loc);
                          setIsLocationOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors flex items-center justify-between ${
                          selectedLocation === loc 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'text-emerald-800 hover:bg-emerald-50'
                        }`}
                      >
                        {loc}
                        {selectedLocation === loc && <Check className="w-3 h-3" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search Bar */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (window.location.pathname !== '/') {
                  navigate('/');
                  setTimeout(() => {
                    document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                } else {
                  document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="relative flex-1 max-w-2xl"
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-emerald-500" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-24 py-2.5 border border-emerald-100 rounded-full bg-emerald-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm"
                placeholder="Search for pre-loved items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-1 right-1 flex items-center gap-1">
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-1.5 text-emerald-400 hover:text-emerald-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button 
                  type="submit"
                  className="bg-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm active:scale-95"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Search Filter Button */}
            <div className="relative mr-4 lg:mr-8" ref={filterRef}>
              <button 
                onClick={() => {
                  if (window.location.pathname === '/') {
                    setIsFilterOpen(!isFilterOpen);
                  } else {
                    navigate('/#marketplace');
                  }
                }}
                className={`p-2 rounded-full transition-all group shrink-0 flex items-center gap-2 ${
                  selectedCategory !== 'All' 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                    : 'text-emerald-600 hover:bg-emerald-50'
                }`}
                title="Filter Products"
              >
                <Filter className={`w-6 h-6 group-hover:scale-110 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                {selectedCategory !== 'All' && (
                  <span className="text-xs font-bold pr-1 hidden lg:block">
                    {CATEGORIES.find(c => c.slug === selectedCategory)?.name}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-emerald-50 overflow-hidden z-[100] py-2"
                  >
                    <div className="px-4 py-2 border-b border-emerald-50 mb-2">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Categories</p>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto px-2">
                      <button
                        onClick={() => {
                          setSelectedCategory("All");
                          setIsFilterOpen(false);
                          document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                          selectedCategory === 'All' 
                            ? 'bg-emerald-600 text-white' 
                            : 'text-emerald-800 hover:bg-emerald-50'
                        }`}
                      >
                        All Categories
                      </button>
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.slug}
                          onClick={() => {
                            setSelectedCategory(cat.slug);
                            setIsFilterOpen(false);
                            document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors mt-1 ${
                            selectedCategory === cat.slug 
                              ? 'bg-emerald-600 text-white' 
                              : 'text-emerald-800 hover:bg-emerald-50'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Sell Items Button (Desktop) */}
            <Link 
              to="/sell"
              className="hidden lg:flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-full transition-all font-bold text-sm shadow-lg shadow-emerald-200 shrink-0 group"
            >
              <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              <span>Sell Items</span>
            </Link>

            {/* Notification Bell */}
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors group"
              >
                <Bell className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-emerald-50 overflow-hidden z-[100] py-2"
                  >
                    <div className="px-4 py-3 border-b border-emerald-50 flex justify-between items-center">
                      <p className="text-xs font-bold text-emerald-900 uppercase tracking-widest">Notifications</p>
                      {unreadCount > 0 && (
                        <span className="bg-emerald-100 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={async () => {
                              if (!notif.read && notif.id) await markAsRead(notif.id);
                              if (notif.link) navigate(notif.link);
                              setIsNotificationsOpen(false);
                            }}
                            className={`w-full text-left p-4 hover:bg-emerald-50 transition-colors border-b border-emerald-50/50 last:border-0 flex gap-3 ${!notif.read ? 'bg-emerald-50/30' : ''}`}
                          >
                            <div className={`p-2 rounded-xl shrink-0 ${notif.type === 'message' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                              {notif.type === 'message' ? <MessageCircle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-emerald-900 truncate">{notif.title}</p>
                              <p className="text-xs text-emerald-800/60 line-clamp-2 mt-0.5">{notif.message}</p>
                              <p className="text-[10px] text-emerald-400 mt-1">
                                {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : 'Just now'}
                              </p>
                            </div>
                            {!notif.read && <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 shrink-0" />}
                          </button>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <div className="bg-emerald-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Bell className="w-6 h-6 text-emerald-200" />
                          </div>
                          <p className="text-sm text-emerald-800/40 font-medium">No notifications yet</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Chat Icon */}
            <Link 
              to="/chats"
              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors group relative"
              title="Messages"
            >
              <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </Link>

            {/* Profile Dropdown */}
            <div className="relative hidden sm:block" ref={dropdownRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-1 p-1 pr-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors border border-transparent hover:border-emerald-100"
              >
                <div className="p-1 bg-emerald-100 rounded-full">
                  <User className="w-5 h-5" />
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-emerald-50 overflow-hidden py-2"
                  >
                    {/* Welcome Header */}
                    <div className="px-6 py-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-b border-emerald-100 mb-2">
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-1">
                        <Sparkles className="w-4 h-4" />
                        {user ? `Hi, ${user.name || user.email?.split('@')?.[0]}` : "Welcome to EcoSwap"}
                      </div>
                      <p className="text-xs text-emerald-800/60 mb-4">
                        {user ? "Great to see you again!" : "Join our community of conscious consumers today."}
                      </p>
                      {user ? (
                        <button 
                          onClick={handleLogout}
                          className="w-full py-2.5 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-all border border-red-100 flex items-center justify-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      ) : (
                        <Link 
                          to="/auth"
                          onClick={() => setIsProfileOpen(false)}
                          className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                        >
                          <LogIn className="w-4 h-4" />
                          Login / Sign Up
                        </Link>
                      )}
                    </div>
                    
                    {/* Menu Items */}
                    <div className="px-2">
                      {profileMenuItems.map((item, index) => (
                        item.href ? (
                          <Link
                            key={index}
                            to={item.href}
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-emerald-800 hover:bg-emerald-50 rounded-xl transition-colors group"
                          >
                            <div className={`p-1.5 rounded-lg bg-white border border-emerald-50 shadow-sm group-hover:scale-110 transition-transform`}>
                              <item.icon className={`w-4 h-4 ${item.color}`} />
                            </div>
                            <span>{item.label}</span>
                          </Link>
                        ) : (
                          <button
                            key={index}
                            onClick={() => {
                              setIsProfileOpen(false);
                              item.onClick?.();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-emerald-800 hover:bg-emerald-50 rounded-xl transition-colors group"
                          >
                            <div className={`p-1.5 rounded-lg bg-white border border-emerald-50 shadow-sm group-hover:scale-110 transition-transform`}>
                              <item.icon className={`w-4 h-4 ${item.color}`} />
                            </div>
                            <span>{item.label}</span>
                          </button>
                        )
                      ))}
                    </div>
                    
                    {/* Footer Info */}
                    <div className="mt-2 px-6 py-4 bg-emerald-900 text-white">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Eco Impact</span>
                        <span className="text-[10px] font-bold">Level 1</span>
                      </div>
                      <div className="w-full h-1 bg-emerald-800 rounded-full overflow-hidden">
                        <div className="w-1/3 h-full bg-emerald-400" />
                      </div>
                      <p className="text-[9px] text-emerald-300 mt-2">Join our community of conscious consumers!</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Language Selection Dropdown */}
              <AnimatePresence>
                {isLanguageOpen && (
                  <motion.div
                    ref={languageRef}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-emerald-50 overflow-hidden z-[110] py-2"
                  >
                    <div className="px-6 py-4 border-b border-emerald-50 bg-emerald-50/30">
                      <h3 className="text-sm font-black text-emerald-900 uppercase tracking-wider">Select Language</h3>
                    </div>
                    <div className="p-2 space-y-1">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setSelectedLanguage(lang.name);
                            setTimeout(() => setIsLanguageOpen(false), 300);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            selectedLanguage === lang.name
                              ? "bg-emerald-600 text-white shadow-md shadow-emerald-100"
                              : "text-emerald-800 hover:bg-emerald-50"
                          }`}
                        >
                          <span>{lang.name}</span>
                          {selectedLanguage === lang.name && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                    <div className="px-4 py-2 bg-emerald-900 text-[9px] text-emerald-300 text-center font-medium">
                      UI Demonstration Only
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed top-0 right-0 bottom-0 w-[80%] max-w-sm bg-white z-[70] shadow-2xl md:hidden flex flex-col"
            >
              <div className="p-6 border-b border-emerald-50 flex justify-between items-center">
                <span className="text-xl font-bold text-emerald-900">Menu</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 text-emerald-400 hover:text-emerald-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Mobile Search */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    setIsMenuOpen(false);
                    if (window.location.pathname !== '/') {
                      navigate('/');
                      setTimeout(() => {
                        document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    } else {
                      document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="relative"
                >
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-emerald-500" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-24 py-3 border border-emerald-100 rounded-2xl bg-emerald-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder="Search items..."
                  />
                  <div className="absolute inset-y-1.5 right-1.5 flex items-center gap-1">
                    {searchQuery && (
                      <button 
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="p-1.5 text-emerald-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    <button 
                      type="submit"
                      className="bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold"
                    >
                      Go
                    </button>
                  </div>
                </form>

                {/* Mobile Location */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-4">Select Location</p>
                  <div className="flex flex-wrap gap-2">
                    {locations.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => setSelectedLocation(loc)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          selectedLocation === loc 
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Categories */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-4">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory("All")}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        selectedCategory === 'All' 
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}
                    >
                      All
                    </button>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.slug}
                        onClick={() => setSelectedCategory(cat.slug)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          selectedCategory === cat.slug 
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Menu Items */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-4">Marketplace</p>
                  {profileMenuItems.map((item, index) => (
                    item.href ? (
                      <Link
                        key={index}
                        to={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-emerald-50 transition-colors"
                      >
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                        <span className="font-medium text-emerald-900">{item.label}</span>
                      </Link>
                    ) : (
                      <button
                        key={index}
                        onClick={() => {
                          setIsMenuOpen(false);
                          item.onClick?.();
                        }}
                        className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-emerald-50 transition-colors"
                      >
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                        <span className="font-medium text-emerald-900 text-left">{item.label}</span>
                      </button>
                    )
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-emerald-50 space-y-4">
                {user ? (
                  <button 
                    onClick={handleLogout}
                    className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold border border-red-100"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link 
                    to="/auth"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 flex items-center justify-center"
                  >
                    Login / Sign Up
                  </Link>
                )}
                <Link 
                  to="/sell" 
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full py-4 bg-emerald-50 text-emerald-700 rounded-2xl font-bold border border-emerald-100 flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-5 h-5" />
                  Sell Items
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Language Selection Modal (Keep as modal for mobile UX) */}
      <AnimatePresence>
        {isLanguageOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLanguageOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xs bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-emerald-50"
            >
              <div className="p-6 border-b border-emerald-50 flex justify-between items-center bg-emerald-50/30">
                <h3 className="text-lg font-black text-emerald-900">Language</h3>
                <button onClick={() => setIsLanguageOpen(false)} className="p-1 text-emerald-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLanguage(lang.name);
                      setTimeout(() => setIsLanguageOpen(false), 300);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all font-bold ${
                      selectedLanguage === lang.name
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-white border-emerald-50 text-emerald-900"
                    }`}
                  >
                    <span>{lang.name}</span>
                    {selectedLanguage === lang.name && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
}
