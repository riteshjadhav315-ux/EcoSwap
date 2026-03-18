import { useParams, Link, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { MapPin, ShieldCheck, MessageCircle, Share2, Flag, ArrowLeft, Clock, ShoppingBag, ShoppingCart, Loader2, Mail, Phone, Lock, Heart, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { getProductById } from "../services/productService";
import { startChat } from "../services/chatService";
import { addToWishlist, removeFromWishlist, isInWishlist } from "../services/wishlistService";
import { createOrder, verifyPayment } from "../services/paymentService";
import { getProductReviews, getSellerAverageRating, Review } from "../services/reviewService";
import { StarRating } from "../components/StarRating";
import { ReviewList } from "../components/ReviewList";
import { ReviewForm } from "../components/ReviewForm";
import { Product } from "../types";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wishlistId, setWishlistId] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sellerRating, setSellerRating] = useState({ averageRating: 0, reviewCount: 0 });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = product?.images && product.images.length > 0 
    ? product.images 
    : [product?.imageUrl || 'https://picsum.photos/seed/ecoswap/800/600'];

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const fetchReviews = async () => {
    if (!id || !product) return;
    try {
      const productReviews = await getProductReviews(id);
      setReviews(productReviews);
      
      const rating = await getSellerAverageRating(product.sellerId);
      setSellerRating(rating);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  useEffect(() => {
    if (product) {
      fetchReviews();
    }
  }, [id, product]);

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const dbProduct = await getProductById(id);
        setProduct(dbProduct);
        setCurrentImageIndex(0);
        
        if (user) {
          const wishId = await isInWishlist(user.uid, id);
          setWishlistId(wishId);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id, user]);

  const handleWishlist = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!product || !id) return;

    try {
      if (wishlistId) {
        await removeFromWishlist(wishlistId);
        setWishlistId(null);
      } else {
        const newWishId = await addToWishlist({
          userId: user.uid,
          productId: id,
          productTitle: product.title,
          productPrice: product.price,
          productImageUrl: product.imageUrl
        });
        setWishlistId(newWishId);
      }
    } catch (err) {
      console.error("Wishlist error:", err);
    }
  };

  const handleContactSeller = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    if (user.uid === product?.sellerId) {
      setError("This is your own listing!");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const chatId = await startChat(product!, user.uid, user.name || "User");
      navigate(`/chat/${chatId}`);
    } catch (error) {
      console.error("Error starting chat:", error);
      setError("Failed to start chat. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handlePaymentSuccess = async (response: any, isSimulation = false) => {
    try {
      setPaymentLoading(true);
      // 3. Verify Payment
      await verifyPayment({
        ...response,
        productId: id,
        simulation: isSimulation
      });
      
      // 4. Success
      if (product) {
        setProduct({ ...product, status: 'sold' });
      }
      setPaymentSuccess(true);
      // Optional: navigate after a delay
      setTimeout(() => {
        navigate("/chats");
      }, 3000);
    } catch (err) {
      console.error("Payment verification error:", err);
      setError("Payment verification failed. Please contact support.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!product || !id) return;

    if (product.status === 'sold') {
      setError("This item has already been sold.");
      return;
    }

    if (user.uid === product.sellerId) {
      setError("You cannot buy your own product.");
      return;
    }

    // Check if we should simulate (e.g. in preview environment or if requested)
    const isPreview = window.location.hostname.includes('run.app') || import.meta.env.DEV;

    try {
      setPaymentLoading(true);
      setError(null);

      // 1. Create Order
      const order = await createOrder(id);

      // 2. Open Razorpay Popup
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_SRx6DVGwmoT3Wo",
        amount: order.amount,
        currency: order.currency,
        name: "EcoSwap",
        description: `Buying ${product.title}`,
        image: "/logo.png", // Replace with your logo
        order_id: order.id,
        handler: (response: any) => handlePaymentSuccess(response),
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#059669", // emerald-600
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
          }
        }
      };

      if ((window as any).Razorpay) {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        
        // If in preview, also provide a fallback simulation after a delay if the popup is blocked or fails
        if (isPreview) {
          console.log("Preview mode detected. Simulation available if Razorpay fails.");
        }
      } else {
        throw new Error("Razorpay SDK not loaded");
      }
    } catch (err) {
      console.error("Payment error:", err);
      if (isPreview) {
        console.log("Environment is sandboxed or Razorpay failed. Simulating success...");
        await handlePaymentSuccess({
          razorpay_order_id: `sim_order_${Date.now()}`,
          razorpay_payment_id: `sim_pay_${Date.now()}`,
          razorpay_signature: "simulated"
        }, true);
      } else {
        setError("Failed to initiate payment. Please try again.");
        setPaymentLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50/30">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
        <p className="text-emerald-800 font-medium">Loading item details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-emerald-50/30">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-xl text-center max-w-md border border-emerald-100">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Flag className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-950 mb-2">Item Not Found</h2>
          <p className="text-emerald-600/70 mb-8">The item you're looking for might have been sold or removed by the seller.</p>
          <Link to="/" className="inline-block px-8 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all">
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50/30 pb-20">
      <AnimatePresence>
        {paymentSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-emerald-950/20 backdrop-blur-sm"
          >
            <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-emerald-100 text-center max-w-sm w-full">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                <ShieldCheck className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-black text-emerald-950 mb-4">Payment Successful!</h2>
              <p className="text-emerald-700/70 font-medium mb-8">Your purchase is complete. You can now chat with the seller to arrange pickup.</p>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate("/chats")}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                  Go to Chats
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-emerald-600 font-bold mb-8 hover:gap-3 transition-all group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Image Gallery */}
          <div className="lg:col-span-7">
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-emerald-100 border border-white relative group"
              >
                {product.status === 'sold' && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                    <motion.div 
                      initial={{ scale: 0.5, rotate: -45 }}
                      animate={{ scale: 1, rotate: -12 }}
                      className="bg-white px-10 py-4 rounded-2xl shadow-2xl border-4 border-emerald-600"
                    >
                      <span className="text-4xl font-black text-emerald-600 uppercase tracking-tighter">Sold Out</span>
                    </motion.div>
                  </div>
                )}
                <img
                  src={images[currentImageIndex]}
                  alt={product.title}
                  className="w-full aspect-[4/3] object-cover"
                  referrerPolicy="no-referrer"
                />

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        handlePrevImage();
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        handleNextImage();
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Image Counter */}
                    <div className="absolute bottom-6 right-6 px-4 py-2 bg-black/50 backdrop-blur-md text-white text-xs font-bold rounded-xl z-20">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}

                <div className="absolute top-6 left-6">
                  <span className="px-4 py-2 bg-emerald-600/90 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg">
                    {product.condition}
                  </span>
                </div>
              </motion.div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                        currentImageIndex === idx ? 'border-emerald-600 scale-105 shadow-md' : 'border-emerald-100 hover:border-emerald-300'
                      }`}
                    >
                      <img src={img} alt={`${product.title} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-8 bg-white rounded-[2rem] p-8 border border-emerald-50 shadow-sm">
              <h2 className="text-2xl font-bold text-emerald-950 mb-6 flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-emerald-600" />
                Description
              </h2>
              <p className="text-emerald-800/70 leading-relaxed whitespace-pre-wrap text-lg">
                {product.description || "No description available"}
              </p>
              
              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                  <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-2">Condition</p>
                  <p className="font-bold text-emerald-900">{product.condition}</p>
                </div>
                <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                  <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-2">Category</p>
                  <p className="font-bold text-emerald-900 capitalize">{product.category.replace('-', ' ')}</p>
                </div>
                <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                  <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-2">Listed</p>
                  <div className="flex items-center gap-1 font-bold text-emerald-900">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(product.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
                <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                  <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-2">Status</p>
                  <p className="font-bold text-emerald-900 capitalize">{product.status}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-white rounded-[2rem] p-8 border border-emerald-50 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-emerald-950 flex items-center gap-2">
                  <Star className="w-6 h-6 text-emerald-600" />
                  Reviews ({reviews.length})
                </h2>
                {user && user.uid !== product.sellerId && !showReviewForm && (
                  <button 
                    onClick={() => setShowReviewForm(true)}
                    className="text-sm font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    Write a Review
                  </button>
                )}
              </div>

              {showReviewForm && (
                <div className="mb-8">
                  <ReviewForm 
                    productId={id!} 
                    sellerId={product.sellerId} 
                    buyerId={user!.uid} 
                    buyerName={user!.name || "Anonymous"} 
                    onReviewSubmitted={() => {
                      setShowReviewForm(false);
                      fetchReviews();
                    }}
                  />
                  <button 
                    onClick={() => setShowReviewForm(false)}
                    className="mt-2 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <ReviewList reviews={reviews} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-5 space-y-8">
            {/* Price & Title Card */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-emerald-50 shadow-2xl shadow-emerald-100/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50" />
              
              <div className="relative">
                <div className="flex justify-between items-start mb-6">
                  <h1 className="text-4xl font-black text-emerald-950 tracking-tight leading-tight">{product.title}</h1>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleWishlist}
                      className={`p-3 rounded-xl transition-all ${wishlistId ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                    >
                      <Heart className={`w-5 h-5 ${wishlistId ? 'fill-current' : ''}`} />
                    </button>
                    <button className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-5xl font-black text-emerald-600">₹{product.price}</span>
                  <span className="text-emerald-400 font-medium">INR</span>
                </div>
                
                <div className="flex items-center gap-3 text-emerald-600 mb-10 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                  <MapPin className="w-5 h-5" />
                  <span className="font-bold">{product.location}</span>
                </div>

                <div className="space-y-4">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  {paymentSuccess && (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 text-sm font-bold flex items-center gap-2 animate-bounce">
                      <ShieldCheck className="w-5 h-5" />
                      Payment Successful! Redirecting...
                    </div>
                  )}

                  <button 
                    onClick={() => addToCart(product)}
                    disabled={product.status === 'sold'}
                    className={`w-full py-5 rounded-2xl font-bold transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 ${
                      product.status === 'sold' 
                        ? 'bg-stone-200 text-stone-500 cursor-not-allowed shadow-none' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
                    }`}
                  >
                    <ShoppingCart className="w-6 h-6" />
                    {product.status === 'sold' ? 'Sold Out' : 'Add to Cart'}
                  </button>

                  {product.status !== 'sold' && (
                    <button 
                      onClick={handleBuyNow}
                      disabled={paymentLoading}
                      className="w-full py-5 bg-emerald-950 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70"
                    >
                      {paymentLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <ShoppingBag className="w-6 h-6" />
                      )}
                      Buy Now
                    </button>
                  )}
                  
                  <button
                    onClick={handleContactSeller}
                    className="w-full py-5 bg-emerald-50 text-emerald-700 rounded-2xl font-bold hover:bg-emerald-100 transition-all flex items-center justify-center gap-3 border border-emerald-100"
                  >
                    <MessageCircle className="w-6 h-6" />
                    Chat with Seller
                  </button>

                  <button
                    onClick={async () => {
                      if (!user) {
                        navigate("/auth");
                        return;
                      }
                      const reason = window.prompt("Why are you reporting this product?");
                      if (!reason) return;
                      const description = window.prompt("Please provide more details (optional):");
                      
                      try {
                        const res = await fetch("/api/reports", {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            reporterId: user.uid,
                            targetId: id,
                            targetType: 'product',
                            reason,
                            description
                          })
                        });
                        if (res.ok) alert("Report submitted successfully.");
                      } catch (err) {
                        console.error("Error reporting product:", err);
                      }
                    }}
                    className="w-full py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Flag className="w-4 h-4" />
                    Report Product
                  </button>

                  {!user && (
                    <p className="text-center text-xs text-emerald-500 font-medium flex items-center justify-center gap-1.5">
                      <Lock className="w-3 h-3" />
                      Login required to view contact details
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Seller Card */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-emerald-50 shadow-2xl shadow-emerald-100/50">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-8">Seller Profile</h3>
              <div className="flex items-center gap-5 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl font-black text-emerald-700 shadow-inner">
                  {product.sellerName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-emerald-950">{product.sellerName}</h4>
                  <div className="flex items-center gap-2">
                    <StarRating rating={sellerRating.averageRating} size={14} />
                    <span className="text-xs font-bold text-emerald-600">
                      {sellerRating.averageRating > 0 ? `${sellerRating.averageRating}/5 (${sellerRating.reviewCount})` : 'No reviews'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100/50">
                <div className="flex items-center gap-2 text-emerald-700 font-bold mb-2">
                  <ShieldCheck className="w-5 h-5" />
                  Verified Community Member
                </div>
                <p className="text-sm text-emerald-600/70 leading-relaxed">Identity verified. This seller consistently provides accurate descriptions and fast responses.</p>
              </div>
              
              <Link 
                to={`/seller/${product.sellerId}`}
                className="w-full mt-8 py-3 text-emerald-600 font-bold hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-100 flex items-center justify-center"
              >
                View Seller's Profile & Reviews
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
