import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronRight,
  Heart,
  LayoutDashboard,
  Loader2,
  MessageCircle,
  Package,
  ShoppingBag,
  Star,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../context/AuthContext";
import {
  getDashboardSummary,
  getMyNotifications,
  getMyPurchases,
  getMyReviews,
  getMyWishlist,
} from "../services/dashboardService";

type DashboardTab =
  | "overview"
  | "purchases"
  | "wishlist"
  | "notifications"
  | "reviews";

type DashboardSummary = {
  totalProducts: number;
  totalSold: number;
  totalPurchases: number;
  totalWishlist: number;
  totalChats: number;
  totalNotifications: number;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      const redirect = encodeURIComponent(`/dashboard${location.search}`);
      navigate(`/auth?redirect=${redirect}`);
      return;
    }

    if (user.role === "admin") {
      navigate("/admin");
    }
  }, [location.search, navigate, user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");

    if (
      tab === "overview" ||
      tab === "purchases" ||
      tab === "wishlist" ||
      tab === "notifications" ||
      tab === "reviews"
    ) {
      setActiveTab(tab);
      return;
    }

    setActiveTab("overview");
  }, [location.search]);

  useEffect(() => {
    if (!user || user.role === "admin") {
      return;
    }

    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const [summaryData, purchasesData, wishlistData, notificationsData, reviewsData] =
          await Promise.all([
            getDashboardSummary(),
            getMyPurchases(),
            getMyWishlist(),
            getMyNotifications(),
            getMyReviews(),
          ]);

        setSummary(summaryData);
        setPurchases(Array.isArray(purchasesData) ? purchasesData : []);
        setWishlist(Array.isArray(wishlistData) ? wishlistData : []);
        setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  const switchTab = (tab: DashboardTab) => {
    navigate(`/dashboard?tab=${tab}`);
  };

  const stats = [
    { label: "My Listings", value: summary?.totalProducts ?? 0, icon: Package },
    { label: "Purchases", value: summary?.totalPurchases ?? 0, icon: ShoppingBag },
    { label: "Wishlist", value: summary?.totalWishlist ?? 0, icon: Heart },
    { label: "Unread Alerts", value: summary?.totalNotifications ?? 0, icon: Bell },
  ];

  if (!user || user.role === "admin") {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-emerald-700">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="font-bold">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white rounded-[2.5rem] border border-emerald-100 shadow-xl shadow-emerald-100 p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400 mb-3">
                Personal Dashboard
              </p>
              <h1 className="text-3xl sm:text-4xl font-black text-emerald-950">
                Welcome back, {user.name || "EcoSwapper"}
              </h1>
              <p className="text-emerald-700/70 mt-2 max-w-2xl">
                Track your listings, purchases, saved items, reviews, and unread updates in one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/profile"
                className="px-5 py-3 rounded-2xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
              >
                My Profile
              </Link>
              <Link
                to="/profile?tab=listings"
                className="px-5 py-3 rounded-2xl border border-emerald-100 text-emerald-700 font-bold hover:bg-emerald-50 transition-all"
              >
                Manage Listings
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-3xl border border-red-100 bg-red-50 px-6 py-4 text-red-600 font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-[2rem] border border-emerald-100 shadow-sm p-6"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">
                {stat.label}
              </p>
              <p className="text-3xl font-black text-emerald-950 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[2.5rem] border border-emerald-100 shadow-sm p-4 sm:p-6">
          <div className="flex flex-wrap gap-3 mb-6">
            {(["overview", "purchases", "wishlist", "notifications", "reviews"] as DashboardTab[]).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => switchTab(tab)}
                  className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all ${
                    activeTab === tab
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              )
            )}
          </div>

          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                { label: "Sold Listings", value: summary?.totalSold ?? 0, href: "/profile?tab=listings" },
                { label: "Open Chats", value: summary?.totalChats ?? 0, href: "/chats" },
                { label: "Saved Items", value: wishlist.length, href: "/profile?tab=wishlist" },
                { label: "Cart Items", value: "Open Cart", href: "/profile?tab=cart" },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="rounded-[2rem] border border-emerald-100 bg-emerald-50/50 p-6 hover:bg-emerald-50 transition-all"
                >
                  <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">{item.label}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-2xl font-black text-emerald-950">{item.value}</p>
                    <ChevronRight className="w-5 h-5 text-emerald-500" />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {activeTab === "purchases" && (
            <div className="space-y-4">
              {purchases.length === 0 ? (
                <p className="text-emerald-700/70 font-medium">No purchases yet.</p>
              ) : (
                purchases.map((purchase) => (
                  <div key={purchase._id} className="rounded-[2rem] border border-emerald-100 p-5">
                    <p className="text-lg font-bold text-emerald-950">
                      {purchase.productId?.title || "Purchased item"}
                    </p>
                    <p className="text-emerald-600 font-medium mt-1">
                      Rs. {Number(purchase.amount || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-emerald-700/60 mt-2">
                      {formatDistanceToNow(new Date(purchase.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "wishlist" && (
            <div className="space-y-4">
              {wishlist.length === 0 ? (
                <p className="text-emerald-700/70 font-medium">Your wishlist is empty.</p>
              ) : (
                wishlist.map((item) => (
                  <Link
                    key={item._id}
                    to={`/product/${item.productId}`}
                    className="flex items-center gap-4 rounded-[2rem] border border-emerald-100 p-4 hover:bg-emerald-50 transition-all"
                  >
                    <img
                      src={item.productImageUrl}
                      alt={item.productTitle}
                      className="w-20 h-20 rounded-2xl object-cover border border-emerald-100"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-emerald-950 truncate">{item.productTitle}</p>
                      <p className="text-emerald-600 font-medium mt-1">
                        Rs. {Number(item.productPrice || 0).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <p className="text-emerald-700/70 font-medium">No notifications yet.</p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`rounded-[2rem] border p-5 ${
                      notification.read
                        ? "border-emerald-100 bg-white"
                        : "border-emerald-200 bg-emerald-50/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-emerald-950">{notification.title}</p>
                        <p className="text-emerald-700/70 mt-1">{notification.message}</p>
                      </div>
                      {!notification.read && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-emerald-700/60 mt-3">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-emerald-700/70 font-medium">You have not posted any reviews yet.</p>
              ) : (
                reviews.map((review) => (
                  <div key={review._id} className="rounded-[2rem] border border-emerald-100 p-5">
                    <div className="flex items-center gap-2 text-amber-500 mb-2">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={`w-4 h-4 ${
                            index < Number(review.rating) ? "fill-current" : ""
                          }`}
                        />
                      ))}
                    </div>
                    <p className="font-bold text-emerald-950">
                      {review.productId?.title || "Reviewed item"}
                    </p>
                    <p className="text-emerald-700/80 mt-2">{review.comment}</p>
                    <p className="text-sm text-emerald-700/60 mt-3">
                      {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Go to Chats", icon: MessageCircle, href: "/chats" },
            { label: "Manage Cart", icon: ShoppingBag, href: "/profile?tab=cart" },
            { label: "My Wishlist", icon: Heart, href: "/profile?tab=wishlist" },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="bg-white rounded-[2rem] border border-emerald-100 p-5 flex items-center justify-between hover:bg-emerald-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-emerald-950">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-emerald-500" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
