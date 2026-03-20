import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import { getUserProfile, updateUserProfile, createUserProfile, UserProfile, uploadProfilePicture } from "../services/userService";
import { getUserProducts, deleteProduct } from "../services/productService";
import { getMyChats } from "../services/chatService";
import { getWishlist, removeFromWishlist } from "../services/wishlistService";
import { Product } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Phone, MapPin, Calendar, Edit2, Save, X, Loader2, Camera, Package, Heart, Settings, Trash2, ExternalLink, ArrowRight, Recycle, MessageCircle, ShoppingCart, Minus, Plus, CreditCard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createCartOrder, verifyPayment } from "../services/paymentService";

export default function Profile() {
  const { user } = useAuth();
  const { cartItems, removeFromCart, updateQuantity, clearCart, total, loading: cartLoading, fetchCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<"profile" | "listings" | "wishlist" | "cart">("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCartCheckout = async () => {
    if (!user || cartItems.length === 0) return;
    
    setCheckoutLoading(true);
    try {
      // 1. Create cart order
      const order = await createCartOrder();
      
      // 2. Handle payment (Razorpay)
      const options = {
        key: order.key || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || "rzp_test_SRx6DVGwmoT3Wo",
        amount: order.amount,
        currency: order.currency,
        name: "EcoSwap Marketplace",
        description: `Cart Purchase (${cartItems.length} items)`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const productIds = cartItems.map(item => item.productId);
            await verifyPayment({
              ...response,
              productIds
            });
            alert("Payment successful! Your eco-friendly items are on their way.");
            await clearCart();
            setActiveTab("profile");
            navigate("/profile?tab=profile");
          } catch (error) {
            console.error("Payment verification failed:", error);
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: profile?.name || user.name || "",
          email: user.email || "",
          contact: profile?.phone || ""
        },
        theme: {
          color: "#059669"
        }
      };

      // Check if we are in a preview environment or if Razorpay is not available
      const isPreview = window.location.hostname.includes('run.app') || window.location.hostname.includes('localhost');
      
      if (isPreview) {
        // Simulate payment in preview
        if (window.confirm("Simulate successful payment for this cart?")) {
          const productIds = cartItems.map(item => item.productId);
          await verifyPayment({
            razorpay_order_id: order.id,
            razorpay_payment_id: `sim_pay_${Date.now()}`,
            razorpay_signature: "simulated",
            productIds,
            simulation: true
          });
          alert("Simulated payment successful!");
          await clearCart();
          setActiveTab("profile");
          navigate("/profile?tab=profile");
          return;
        }
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Failed to initiate checkout. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab === "ads" || tab === "listings") setActiveTab("listings");
    else if (tab === "wishlist") setActiveTab("wishlist");
    else if (tab === "cart") setActiveTab("cart");
    else setActiveTab("profile");
  }, [location.search]);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (user && activeTab === "wishlist") {
        setWishlistLoading(true);
        try {
          const items = await getWishlist(user.uid);
          setWishlistItems(items);
        } catch (error) {
          console.error("Failed to fetch wishlist:", error);
        } finally {
          setWishlistLoading(false);
        }
      }
    };
    fetchWishlist();
  }, [user, activeTab]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    location: "",
  });

  useEffect(() => {
    async function fetchData() {
      if (user) {
        try {
          // Fetch Profile
          let data = await getUserProfile(user.uid);
          
          if (!data) {
            const newProfile = {
              name: user.name || user.email?.split('@')?.[0] || "EcoSwapper",
              email: user.email || "",
              phone: "",
              location: "",
            };
            await createUserProfile(user.uid, newProfile);
            data = await getUserProfile(user.uid);
          }

          if (data) {
            setProfile(data);
            setFormData({
              name: data.name || "",
              phone: data.phone || "",
              location: data.location || "",
            });
          }

          // Fetch User Products
          const products = await getUserProducts();
          setUserProducts(products);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    try {
      await deleteProduct(productId);
      setUserProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingPhoto(true);
    try {
      const downloadURL = await uploadProfilePicture(file, user.uid);
      setProfile(prev => prev ? { ...prev, photoURL: downloadURL } : null);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("Failed to upload profile picture. Please check your storage rules.");
    } finally {
      setUploadingPhoto(false);
    }
  };
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      await updateUserProfile(user.uid, formData);
      setProfile(prev => prev ? { ...prev, ...formData } : null);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50/30">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-emerald-800 font-bold animate-pulse">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50/30">
        <div className="text-center p-8 bg-white rounded-[2.5rem] shadow-2xl border border-emerald-50 max-w-md mx-4">
          <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-emerald-950 mb-4">Sign in to view profile</h2>
          <p className="text-emerald-600/70 font-medium mb-8">
            You need to be logged in to access your personal dashboard and manage your swaps.
          </p>
          <a href="/auth" className="block w-full px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
            Sign In / Register
          </a>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50/30">
        <div className="text-center p-8 bg-white rounded-[2.5rem] shadow-2xl border border-emerald-50 max-w-md mx-4">
          <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-black text-emerald-950 mb-4">Profile Error</h2>
          <p className="text-emerald-600/70 font-medium mb-8">
            We couldn't load your profile information. This might be a temporary connection issue.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="block w-full px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
          >
            Try Refreshing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="relative mb-8">
          <div className="h-48 w-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-[2.5rem] shadow-lg overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          </div>
          
          <div className="absolute -bottom-12 left-8 flex items-end gap-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-3xl bg-white p-1 shadow-xl">
                <div className="w-full h-full rounded-[1.4rem] bg-emerald-100 flex items-center justify-center overflow-hidden">
                  {uploadingPhoto ? (
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  ) : profile.photoURL || user.photoURL ? (
                    <img src={profile.photoURL || user.photoURL || ""} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-16 h-16 text-emerald-600" />
                  )}
                </div>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-2 right-2 p-2 bg-white rounded-xl shadow-lg border border-emerald-50 text-emerald-600 hover:scale-110 transition-all disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handlePhotoUpload} 
              />
            </div>
            
            <div className="pb-4">
              <h1 className="text-3xl font-black text-emerald-950 mb-1">{profile.name}</h1>
              <p className="text-emerald-700 font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {profile.email}
              </p>
            </div>
          </div>

          <div className="absolute bottom-4 right-8 flex gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2.5 bg-white text-emerald-600 rounded-2xl font-bold shadow-lg hover:bg-emerald-50 transition-all flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2.5 bg-white text-emerald-600 rounded-2xl font-bold shadow-lg hover:bg-emerald-50 transition-all flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Stats & Quick Links */}
          <div className="space-y-8">
            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-emerald-100/50 border border-emerald-50">
              <h3 className="text-lg font-black text-emerald-950 mb-6">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl cursor-pointer hover:bg-emerald-100 transition-colors" onClick={() => setActiveTab("listings")}>
                  <Package className="w-6 h-6 text-emerald-600 mb-2" />
                  <div className="text-2xl font-black text-emerald-950">{userProducts.length}</div>
                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">My Ads</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-2xl cursor-pointer hover:bg-orange-100 transition-colors" onClick={() => setActiveTab("wishlist")}>
                  <Heart className="w-6 h-6 text-orange-500 mb-2" />
                  <div className="text-2xl font-black text-emerald-950">{wishlistItems.length}</div>
                  <div className="text-xs font-bold text-orange-600 uppercase tracking-wider">Wishlist</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => setActiveTab("cart")}>
                  <ShoppingCart className="w-6 h-6 text-blue-500 mb-2" />
                  <div className="text-2xl font-black text-emerald-950">{cartItems.length}</div>
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">My Cart</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-emerald-100/50 border border-emerald-50">
              <h3 className="text-lg font-black text-emerald-950 mb-6">Navigation</h3>
              <div className="space-y-4">
                <button 
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${activeTab === 'profile' ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 text-emerald-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <User className={`w-5 h-5 ${activeTab === 'profile' ? 'text-white' : 'text-emerald-400 group-hover:text-emerald-600'}`} />
                    <span className="font-bold">My Profile</span>
                  </div>
                  <ArrowRight className={`w-4 h-4 ${activeTab === 'profile' ? 'text-white/50' : 'text-emerald-300'}`} />
                </button>
                <button 
                  onClick={() => setActiveTab("listings")}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${activeTab === 'listings' ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 text-emerald-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <Package className={`w-5 h-5 ${activeTab === 'listings' ? 'text-white' : 'text-emerald-400 group-hover:text-emerald-600'}`} />
                    <span className="font-bold">My Listings</span>
                  </div>
                  <ArrowRight className={`w-4 h-4 ${activeTab === 'listings' ? 'text-white/50' : 'text-emerald-300'}`} />
                </button>
                <button 
                  onClick={() => setActiveTab("wishlist")}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${activeTab === 'wishlist' ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 text-emerald-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <Heart className={`w-5 h-5 ${activeTab === 'wishlist' ? 'text-white' : 'text-emerald-400 group-hover:text-emerald-600'}`} />
                    <span className="font-bold">Wishlist</span>
                  </div>
                  <ArrowRight className={`w-4 h-4 ${activeTab === 'wishlist' ? 'text-white/50' : 'text-emerald-300'}`} />
                </button>
                <button 
                  onClick={() => setActiveTab("cart")}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${activeTab === 'cart' ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 text-emerald-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <ShoppingCart className={`w-5 h-5 ${activeTab === 'cart' ? 'text-white' : 'text-emerald-400 group-hover:text-emerald-600'}`} />
                    <span className="font-bold">My Cart</span>
                  </div>
                  <ArrowRight className={`w-4 h-4 ${activeTab === 'cart' ? 'text-white/50' : 'text-emerald-300'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Content Area */}
          <div className="lg:col-span-2 space-y-8">
            <AnimatePresence mode="wait">
              {activeTab === "profile" && (
                <motion.div
                  key="profile-tab"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-xl shadow-emerald-100/50 border border-emerald-50"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-emerald-950">Personal Information</h3>
                    {isEditing && (
                      <button
                        onClick={handleUpdate}
                        disabled={saving}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest pl-4">Full Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-emerald-300" />
                        </div>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="block w-full pl-12 pr-4 py-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-70 font-medium text-emerald-950"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest pl-4">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-emerald-300" />
                        </div>
                        <input
                          type="email"
                          disabled
                          value={profile.email}
                          className="block w-full pl-12 pr-4 py-4 bg-emerald-50/20 border border-emerald-50 rounded-2xl font-medium text-emerald-950/50 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest pl-4">Phone Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-emerald-300" />
                        </div>
                        <input
                          type="tel"
                          disabled={!isEditing}
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="block w-full pl-12 pr-4 py-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-70 font-medium text-emerald-950"
                          placeholder="Not set"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest pl-4">Location / Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <MapPin className="h-5 w-5 text-emerald-300" />
                        </div>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="block w-full pl-12 pr-4 py-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-70 font-medium text-emerald-950"
                          placeholder="Not set"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest pl-4">Member Since</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-emerald-300" />
                        </div>
                        <input
                          type="text"
                          disabled
                          value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Recent'}
                          className="block w-full pl-12 pr-4 py-4 bg-emerald-50/20 border border-emerald-50 rounded-2xl font-medium text-emerald-950/50 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === "listings" && (
                <motion.div
                  key="listings-tab"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-emerald-100/50 border border-emerald-50">
                    <h3 className="text-xl font-black text-emerald-950 mb-6">My Listings</h3>
                    {userProducts.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
                        <p className="text-emerald-600 font-medium">You haven't listed any items yet.</p>
                        <Link to="/sell" className="mt-4 inline-block text-emerald-600 font-bold hover:underline">Start Selling</Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {userProducts.map(product => (
                          <div key={product.id} className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 group">
                            <img src={product.imageUrl} alt={product.title} className="w-20 h-20 object-cover rounded-xl" referrerPolicy="no-referrer" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-emerald-950 truncate">{product.title}</h4>
                              <p className="text-emerald-600 font-black">₹{product.price}</p>
                              <p className="text-xs text-emerald-400">{new Date(product.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-2">
                              <Link to={`/product/${product.id}`} className="p-2 bg-white text-emerald-600 rounded-lg shadow-sm hover:bg-emerald-600 hover:text-white transition-all">
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                              <button 
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-2 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-500 hover:text-white transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "wishlist" && (
                <motion.div
                  key="wishlist-tab"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-emerald-100/50 border border-emerald-50">
                    <h3 className="text-xl font-black text-emerald-950 mb-6">My Wishlist</h3>
                    {wishlistLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                      </div>
                    ) : wishlistItems.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
                        <p className="text-emerald-600 font-medium">Your wishlist is empty.</p>
                        <Link to="/" className="mt-4 inline-block text-emerald-600 font-bold hover:underline">Explore Marketplace</Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {wishlistItems.map(item => (
                          <div key={item.id} className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 group">
                            <img src={item.productImageUrl} alt={item.productTitle} className="w-20 h-20 object-cover rounded-xl" referrerPolicy="no-referrer" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-emerald-950 truncate">{item.productTitle}</h4>
                              <p className="text-emerald-600 font-black">₹{item.productPrice}</p>
                            </div>
                            <div className="flex gap-2">
                              <Link to={`/product/${item.productId}`} className="p-2 bg-white text-emerald-600 rounded-lg shadow-sm hover:bg-emerald-600 hover:text-white transition-all">
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                              <button 
                                onClick={async () => {
                                  try {
                                    await removeFromWishlist(item.id);
                                    setWishlistItems(prev => prev.filter(i => i.id !== item.id));
                                  } catch (error) {
                                    console.error("Failed to remove from wishlist:", error);
                                  }
                                }}
                                className="p-2 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-500 hover:text-white transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "cart" && (
                <motion.div
                  key="cart-tab"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-emerald-100/50 border border-emerald-50">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-black text-emerald-950">My Shopping Cart</h3>
                      {cartItems.length > 0 && (
                        <button 
                          onClick={() => {
                            if (window.confirm("Are you sure you want to clear your cart?")) {
                              clearCart();
                            }
                          }}
                          className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Clear Cart
                        </button>
                      )}
                    </div>

                    {cartLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                      </div>
                    ) : cartItems.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingCart className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
                        <p className="text-emerald-600 font-medium">Your cart is empty.</p>
                        <Link to="/" className="mt-4 inline-block text-emerald-600 font-bold hover:underline">Start Shopping</Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          {cartItems.map(item => (
                            <div key={item._id} className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 group">
                              <img src={item.productImageUrl} alt={item.productTitle} className="w-20 h-20 object-cover rounded-xl" referrerPolicy="no-referrer" />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-emerald-950 truncate">{item.productTitle}</h4>
                                <p className="text-emerald-600 font-black">₹{item.productPrice}</p>
                              </div>
                              
                              <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-emerald-100 shadow-sm">
                                <button 
                                  onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-30"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-sm font-black text-emerald-950 min-w-[20px] text-center">{item.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                  disabled={item.quantity >= 1}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="flex gap-2">
                                <Link to={`/product/${item.productId}`} className="p-2 bg-white text-emerald-600 rounded-lg shadow-sm hover:bg-emerald-600 hover:text-white transition-all">
                                  <ExternalLink className="w-4 h-4" />
                                </Link>
                                <button 
                                  onClick={() => removeFromCart(item._id)}
                                  className="p-2 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-500 hover:text-white transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-emerald-100">
                          <div className="flex items-center justify-between mb-6">
                            <span className="text-emerald-600 font-bold">Total Amount</span>
                            <span className="text-2xl font-black text-emerald-950">₹{total}</span>
                          </div>
                          <button 
                            onClick={handleCartCheckout}
                            disabled={checkoutLoading}
                            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 group disabled:opacity-50"
                          >
                            {checkoutLoading ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                Proceed to Checkout
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-emerald-900 rounded-[2rem] p-8 sm:p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Recycle className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-4">Eco Impact</h3>
                <p className="text-emerald-100/80 font-medium mb-6 max-w-md">
                  By swapping {userProducts.length} items, you've saved approximately {userProducts.length * 3.75}kg of CO2 emissions and {userProducts.length * 1000} liters of water. Keep up the great work!
                </p>
                <div className="flex gap-4">
                  <div className="px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 text-sm font-bold">
                    Level {Math.floor(userProducts.length / 3) + 1} Swapper
                  </div>
                  <div className="px-4 py-2 bg-emerald-500 rounded-xl text-sm font-bold">
                    View Impact Report
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
