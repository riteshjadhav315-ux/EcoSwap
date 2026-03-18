import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getUserProfile, UserProfile } from "../../services/userService";
import { getUserProducts } from "../../services/productService";
import { getSellerReviews, getSellerAverageRating, Review } from "../../services/reviewService";
import { Product } from "../types";
import { StarRating } from "../components/StarRating";
import { ReviewList } from "../components/ReviewList";
import { motion } from "framer-motion";
import { User, MapPin, Package, Star, ArrowLeft, Loader2, ShieldCheck } from "lucide-react";

export default function SellerProfile() {
  const { sellerId } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState({ averageRating: 0, reviewCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!sellerId) return;
      setLoading(true);
      try {
        const [userProfile, userProducts, userReviews, userRating] = await Promise.all([
          getUserProfile(sellerId),
          getUserProducts(sellerId),
          getSellerReviews(sellerId),
          getSellerAverageRating(sellerId)
        ]);

        setProfile(userProfile);
        setProducts(userProducts);
        setReviews(userReviews);
        setRating(userRating);
      } catch (error) {
        console.error("Error fetching seller data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [sellerId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50/30">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Seller not found</h2>
        <Link to="/" className="text-emerald-600 font-bold">Back to Marketplace</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-emerald-600 font-bold mb-8 hover:gap-3 transition-all">
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </Link>

        <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-xl border border-emerald-50 mb-8">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="w-32 h-32 rounded-3xl bg-emerald-100 flex items-center justify-center overflow-hidden shadow-inner">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-16 h-16 text-emerald-600" />
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <h1 className="text-3xl font-black text-emerald-950">{profile.name}</h1>
                <div className="flex items-center justify-center md:justify-start gap-2 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Verified Seller</span>
                </div>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-6 mb-6">
                <div className="flex items-center gap-2 text-emerald-700">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">{profile.location || "Location not set"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating rating={rating.averageRating} size={18} />
                  <span className="font-bold text-emerald-900">
                    {rating.averageRating.toFixed(1)} ({rating.reviewCount} reviews)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-md mx-auto md:mx-0">
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 text-center">
                  <div className="text-xl font-black text-emerald-950">{products.length}</div>
                  <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active Listings</div>
                </div>
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 text-center">
                  <div className="text-xl font-black text-emerald-950">{rating.reviewCount}</div>
                  <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Total Reviews</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-emerald-50">
              <h3 className="text-xl font-black text-emerald-950 mb-8 flex items-center gap-2">
                <Star className="w-6 h-6 text-emerald-600" />
                Seller Reviews
              </h3>
              <ReviewList reviews={reviews} emptyMessage="This seller hasn't received any reviews yet." />
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-emerald-50">
              <h3 className="text-xl font-black text-emerald-950 mb-6 flex items-center gap-2">
                <Package className="w-6 h-6 text-emerald-600" />
                Other Listings
              </h3>
              <div className="space-y-4">
                {products.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">No other active listings.</p>
                ) : (
                  products.map(product => (
                    <Link 
                      key={product.id} 
                      to={`/product/${product.id}`}
                      className="flex items-center gap-4 p-3 rounded-2xl hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-100 group"
                    >
                      <img src={product.imageUrl} alt={product.title} className="w-16 h-16 object-cover rounded-xl" referrerPolicy="no-referrer" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-emerald-950 truncate group-hover:text-emerald-600 transition-colors">{product.title}</h4>
                        <p className="text-emerald-600 font-black">₹{product.price}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
