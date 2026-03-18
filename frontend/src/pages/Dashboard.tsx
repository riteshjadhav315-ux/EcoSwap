import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Heart, 
  MessageSquare, 
  Bell, 
  Star, 
  Settings, 
  LogOut,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  Trash2,
  Edit,
  ExternalLink,
  Loader2,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getDashboardSummary, 
  getMyPurchases, 
  getMyWishlist, 
  getMyReviews, 
  getMyNotifications 
} from "../services/dashboardService";
import { getUserProducts, deleteProduct, updateProductStatus } from "../services/productService";
import { Product } from "../types";

type Tab = "overview" | "products" | "purchases" | "wishlist" | "reviews" | "notifications";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth?redirect=/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchTabData();
  }, [activeTab]);

  const fetchSummary = async () => {
    try {
      const res = await getDashboardSummary();
      setSummary(res);
    } catch (err) {
      console.error("Error fetching summary:", err);
    }
  };

  const fetchTabData = async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      switch (activeTab) {
        case "overview":
          res = await getDashboardSummary();
          setSummary(res);
          break;
        case "products":
          res = await getUserProducts();
          break;
        case "purchases":
          res = await getMyPurchases();
          break;
        case "wishlist":
          res = await getMyWishlist();
          break;
        case "reviews":
          res = await getMyReviews();
          break;
        case "notifications":
          res = await getMyNotifications();
          break;
      }
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    try {
      await deleteProduct(id);
      setData((prev: Product[] | null) => prev ? prev.filter(p => p.id !== id) : []);
      fetchSummary();
    } catch (err) {
      alert("Failed to delete product");
    }
  };

  const handleMarkAsSold = async (id: string) => {
    try {
      await updateProductStatus(id, "sold");
      setData((prev: Product[]) => prev.map(p => p.id === id ? { ...p, status: "sold" } : p));
      fetchSummary();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (!user) return null;

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "products", label: "My Products", icon: Package },
    { id: "purchases", label: "My Purchases", icon: ShoppingBag },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "reviews", label: "My Reviews", icon: Star },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "help", label: "Help Center", icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-emerald-50/30 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-emerald-100 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-emerald-50">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Package className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-black text-emerald-950">EcoSwap</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "help") {
                  navigate("/help");
                } else {
                  setActiveTab(item.id as Tab);
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                activeTab === item.id 
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" 
                  : "text-emerald-600/70 hover:bg-emerald-50 hover:text-emerald-600"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-emerald-50 space-y-2">
          <button 
            onClick={() => navigate("/profile")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-emerald-600/70 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-emerald-950 capitalize">{activeTab}</h1>
            <p className="text-emerald-600/70 font-medium">Welcome back, {user.name}!</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/sell" className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">
              List New Item
            </Link>
          </div>
        </header>

        <div className="space-y-8">
          {/* Overview Section */}
          {activeTab === "overview" && summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard 
                label="Total Products" 
                value={summary.totalProducts} 
                icon={Package} 
                color="emerald" 
              />
              <StatCard 
                label="Products Sold" 
                value={summary.totalSold} 
                icon={CheckCircle2} 
                color="teal" 
              />
              <StatCard 
                label="My Purchases" 
                value={summary.totalPurchases} 
                icon={ShoppingBag} 
                color="blue" 
              />
              <StatCard 
                label="Wishlist Items" 
                value={summary.totalWishlist} 
                icon={Heart} 
                color="rose" 
              />
              <StatCard 
                label="Active Chats" 
                value={summary.totalChats} 
                icon={MessageSquare} 
                color="orange" 
              />
              <StatCard 
                label="Notifications" 
                value={summary.totalNotifications} 
                icon={Bell} 
                color="amber" 
              />
            </div>
          )}

          {/* Tab Content */}
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-emerald-100/50 border border-emerald-50 overflow-hidden">
            {loading ? (
              <div className="p-20 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
                <p className="text-emerald-600 font-bold">Loading your data...</p>
              </div>
            ) : error ? (
              <div className="p-20 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-500 font-bold">{error}</p>
                <button onClick={fetchTabData} className="mt-4 text-emerald-600 font-bold hover:underline">Try Again</button>
              </div>
            ) : (
              <div className="p-8">
                {activeTab === "products" && <ProductsTable products={data} onDelete={handleDeleteProduct} onMarkSold={handleMarkAsSold} />}
                {activeTab === "purchases" && <PurchasesTable purchases={data} />}
                {activeTab === "wishlist" && <WishlistTable items={data} />}
                {activeTab === "reviews" && <ReviewsTable reviews={data} />}
                {activeTab === "notifications" && <NotificationsList notifications={data} />}
                {activeTab === "overview" && <RecentActivity summary={summary} />}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600",
    teal: "bg-teal-50 text-teal-600",
    blue: "bg-blue-50 text-blue-600",
    rose: "bg-rose-50 text-rose-600",
    orange: "bg-orange-50 text-orange-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-emerald-100/20 border border-emerald-50 flex items-center gap-6">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-8 h-8" />
      </div>
      <div>
        <p className="text-emerald-600/60 font-bold text-sm uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-black text-emerald-950">{value}</p>
      </div>
    </div>
  );
}

function ProductsTable({ products, onDelete, onMarkSold }: any) {
  if (!products?.length) return <EmptyState label="No products listed yet." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left border-b border-emerald-50">
            <th className="pb-4 font-black text-emerald-950">Product</th>
            <th className="pb-4 font-black text-emerald-950">Price</th>
            <th className="pb-4 font-black text-emerald-950">Status</th>
            <th className="pb-4 font-black text-emerald-950">Date</th>
            <th className="pb-4 font-black text-emerald-950 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-emerald-50">
          {products.map((p: any) => (
            <tr key={p.id} className="group">
              <td className="py-4">
                <div className="flex items-center gap-4">
                  <img src={p.imageUrl || (p.images && p.images[0])} alt={p.title} className="w-12 h-12 rounded-xl object-cover" />
                  <span className="font-bold text-emerald-950">{p.title}</span>
                </div>
              </td>
              <td className="py-4 font-bold text-emerald-600">₹{p.price}</td>
              <td className="py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  p.status === 'available' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {p.status}
                </span>
              </td>
              <td className="py-4 text-emerald-600/60 font-medium">
                {new Date(p.createdAt).toLocaleDateString()}
              </td>
              <td className="py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  {p.status === 'available' && (
                    <button 
                      onClick={() => onMarkSold(p.id)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      title="Mark as Sold"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  )}
                  <Link 
                    to={`/edit/${p.id}`}
                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                    title="Edit"
                  >
                    <Edit className="w-5 h-5" />
                  </Link>
                  <Link 
                    to={`/product/${p.id}`}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="View"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </Link>
                  <button 
                    onClick={() => onDelete(p.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PurchasesTable({ purchases }: any) {
  if (!purchases?.length) return <EmptyState label="No purchases yet." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left border-b border-emerald-50">
            <th className="pb-4 font-black text-emerald-950">Product</th>
            <th className="pb-4 font-black text-emerald-950">Amount Paid</th>
            <th className="pb-4 font-black text-emerald-950">Order ID</th>
            <th className="pb-4 font-black text-emerald-950">Date</th>
            <th className="pb-4 font-black text-emerald-950 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-emerald-50">
          {purchases.map((p: any) => (
            <tr key={p._id}>
              <td className="py-4">
                <div className="flex items-center gap-4">
                  <img src={p.productId?.imageUrl || (p.productId?.images && p.productId?.images[0])} alt={p.productId?.title} className="w-12 h-12 rounded-xl object-cover" />
                  <span className="font-bold text-emerald-950">{p.productId?.title || "Product Deleted"}</span>
                </div>
              </td>
              <td className="py-4 font-bold text-emerald-600">₹{p.amount}</td>
              <td className="py-4 text-emerald-600/60 font-mono text-xs">{p.orderId}</td>
              <td className="py-4 text-emerald-600/60 font-medium">
                {new Date(p.createdAt).toLocaleDateString()}
              </td>
              <td className="py-4 text-right">
                <Link 
                  to={`/product/${p.productId?._id}`}
                  className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:underline"
                >
                  View <ArrowRight className="w-4 h-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WishlistTable({ items }: any) {
  if (!items?.length) return <EmptyState label="Wishlist is empty." />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((item: any) => (
        <div key={item._id} className="flex items-center gap-4 p-4 bg-emerald-50/30 rounded-2xl border border-emerald-50 group hover:bg-white hover:shadow-lg transition-all">
          <img src={item.productImageUrl || (item.productImages && item.productImages[0])} alt={item.productTitle} className="w-20 h-20 rounded-xl object-cover" />
          <div className="flex-1">
            <h4 className="font-bold text-emerald-950">{item.productTitle}</h4>
            <p className="text-emerald-600 font-black">₹{item.productPrice}</p>
          </div>
          <Link to={`/product/${item.productId}`} className="p-3 bg-white text-emerald-600 rounded-xl shadow-sm hover:bg-emerald-600 hover:text-white transition-all">
            <ExternalLink className="w-5 h-5" />
          </Link>
        </div>
      ))}
    </div>
  );
}

function ReviewsTable({ reviews }: any) {
  if (!reviews?.length) return <EmptyState label="No reviews written yet." />;

  return (
    <div className="space-y-4">
      {reviews.map((r: any) => (
        <div key={r._id} className="p-6 bg-emerald-50/30 rounded-2xl border border-emerald-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <img src={r.productId?.imageUrl || (r.productId?.images && r.productId?.images[0])} alt={r.productId?.title} className="w-12 h-12 rounded-xl object-cover" />
              <div>
                <h4 className="font-bold text-emerald-950">{r.productId?.title || "Product Deleted"}</h4>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                  ))}
                </div>
              </div>
            </div>
            <span className="text-xs text-emerald-600/60 font-medium">{new Date(r.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="text-emerald-800/80 font-medium italic">"{r.comment}"</p>
        </div>
      ))}
    </div>
  );
}

function NotificationsList({ notifications }: any) {
  if (!notifications?.length) return <EmptyState label="No notifications." />;

  return (
    <div className="space-y-4">
      {notifications.map((n: any) => (
        <div key={n._id} className={`p-4 rounded-2xl border flex items-start gap-4 ${n.read ? 'bg-white border-emerald-50' : 'bg-emerald-50 border-emerald-100'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'message' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {n.type === 'message' ? <MessageSquare className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-emerald-950">{n.title}</h4>
            <p className="text-emerald-700/70 text-sm font-medium">{n.message}</p>
            <span className="text-[10px] text-emerald-400 font-bold uppercase mt-2 block">{new Date(n.createdAt).toLocaleString()}</span>
          </div>
          {n.link && (
            <Link to={n.link} className="p-2 text-emerald-600 hover:bg-white rounded-lg transition-all">
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

function RecentActivity({ summary }: any) {
  return (
    <div className="text-center py-10">
      <TrendingUp className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
      <h3 className="text-xl font-black text-emerald-950 mb-2">Your Eco-Impact</h3>
      <p className="text-emerald-600/70 font-medium max-w-md mx-auto mb-8">
        By participating in EcoSwap, you've helped save resources and reduce waste. 
        You've listed {summary.totalProducts} items and successfully swapped {summary.totalSold} of them!
      </p>
      <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-bold">
        <CheckCircle2 className="w-5 h-5" />
        Level {Math.floor(summary.totalSold / 5) + 1} Eco-Warrior
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-20 text-center">
      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <Clock className="w-10 h-10 text-emerald-200" />
      </div>
      <p className="text-emerald-950 font-black text-xl mb-2">{label}</p>
      <p className="text-emerald-600/60 font-medium">Start exploring the marketplace to see more activity here.</p>
    </div>
  );
}
