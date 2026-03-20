import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllProducts, getFilteredProducts, searchProducts } from '../services/productService';
import { Product } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Recycle, ShieldCheck, Zap, Leaf, ArrowRight, Heart, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { useCart } from '../context/CartContext';
import { addToWishlist, removeFromWishlist, isInWishlist } from '../services/wishlistService';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { searchQuery, selectedCategory, selectedLocation, setSelectedLocation } = useSearch();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistMap, setWishlistMap] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let data: Product[];
        const filters = {
          category: selectedCategory,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          location: selectedLocation !== "All Locations" ? selectedLocation : undefined
        };

        if (searchQuery) {
          data = await searchProducts(searchQuery, filters);
        } else if (selectedCategory !== "All" || minPrice || maxPrice || (selectedLocation !== "All Locations")) {
          // Use search endpoint even without query if filters are present
          data = await searchProducts("", filters);
        } else {
          data = await getAllProducts();
        }
        
        setProducts(data);
        
        if (user) {
          const wishlistPromises = data.map(async (p: Product) => {
            const wishId = await isInWishlist(user.uid, p.id);
            return { productId: p.id, wishId };
          });
          const results = await Promise.all(wishlistPromises);
          const map: Record<string, string> = {};
          results.forEach(res => {
            if (res.wishId) map[res.productId] = res.wishId;
          });
          setWishlistMap(map);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [user, searchQuery, selectedCategory, minPrice, maxPrice, selectedLocation]);

  const toggleWishlist = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      navigate('/auth');
      return;
    }

    const wishId = wishlistMap[product.id];
    try {
      if (wishId) {
        await removeFromWishlist(wishId);
        setWishlistMap(prev => {
          const next = { ...prev };
          delete next[product.id];
          return next;
        });
      } else {
        const newWishId = await addToWishlist({
          userId: user.uid,
          productId: product.id,
          productTitle: product.title,
          productPrice: product.price,
          productImageUrl: product.imageUrl || (product.images && product.images[0]) || ""
        });
        setWishlistMap(prev => ({ ...prev, [product.id]: newWishId }));
      }
    } catch (err) {
      console.error("Wishlist toggle error:", err);
    }
  };

  return (
    <div className="bg-stone-50">
      {/* Hero Section */}
      <section className="relative bg-[#E9F5F1] overflow-hidden pt-2 lg:pt-4 pb-12 lg:pb-16">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-12 items-center">
          {/* Left Content */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm text-emerald-800 text-[10px] lg:text-xs font-black mb-4 border border-white/50 uppercase tracking-[0.2em] shadow-sm">
              <Recycle className="w-3 h-3" />
              Sustainable Marketplace
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[4.5rem] xl:text-[5.5rem] font-black text-[#064E3B] leading-[1.1] lg:leading-[0.95] mb-4 lg:mb-6 tracking-tight">
              Give Your Items a <br className="hidden sm:block" />
              <span className="text-emerald-600">Second Life</span>
            </h1>
            <p className="text-base lg:text-lg xl:text-xl text-emerald-900/60 mb-6 lg:mb-8 max-w-lg leading-relaxed font-medium">
              Join thousands of people swapping, selling, and buying pre-loved goods. Reduce waste and save money with EcoSwap.
            </p>
            
            <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-3 sm:gap-4 mb-6 lg:mb-8">
              <Link 
                to="/sell" 
                className="flex-1 sm:flex-none px-4 sm:px-8 py-3.5 sm:py-4 bg-[#059669] text-white rounded-xl sm:rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200/50 flex items-center justify-center gap-2 group text-xs sm:text-base"
              >
                Start Selling
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button 
                onClick={() => document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex-1 sm:flex-none px-4 sm:px-8 py-3.5 sm:py-4 bg-white text-emerald-900 border border-emerald-100 rounded-xl sm:rounded-2xl font-black hover:bg-emerald-50 transition-all shadow-sm text-xs sm:text-base"
              >
                Browse Items
              </button>
            </div>

            <div className="flex flex-wrap gap-4 lg:gap-12">
              <div className="flex items-center gap-2 lg:gap-3 text-[#064E3B] font-black text-[10px] lg:text-sm uppercase tracking-wider">
                <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <ShieldCheck className="w-3 h-3 lg:w-4 lg:h-4 text-emerald-600" />
                </div>
                Secure Swaps
              </div>
              <div className="flex items-center gap-2 lg:gap-3 text-[#064E3B] font-black text-[10px] lg:text-sm uppercase tracking-wider">
                <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Zap className="w-3 h-3 lg:w-4 lg:h-4 text-emerald-600" />
                </div>
                Fast Listing
              </div>
              <div className="flex items-center gap-2 lg:gap-3 text-[#064E3B] font-black text-[10px] lg:text-sm uppercase tracking-wider">
                <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Leaf className="w-3 h-3 lg:w-4 lg:h-4 text-emerald-600" />
                </div>
                Eco-Friendly
              </div>
            </div>
          </motion.div>

          {/* Right Content: Image and Stats */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative mt-8 lg:mt-0"
          >
            <div className="relative rounded-[2.5rem] lg:rounded-[4rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(5,150,105,0.2)] border-4 lg:border-[12px] border-white group">
              <img 
                src="https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=1200" 
                alt="Eco-Friendly Electronics Marketplace" 
                className="w-full h-[300px] sm:h-[400px] lg:h-[480px] xl:h-[520px] object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/10 to-transparent pointer-events-none" />
            </div>

            {/* Floating Stats Card */}
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
              className="absolute -bottom-4 -right-2 lg:-bottom-10 lg:-left-10 bg-white p-4 lg:p-8 rounded-[1.5rem] lg:rounded-[2.5rem] shadow-2xl border border-emerald-50 flex items-center gap-3 lg:gap-6 z-20 max-w-[240px] lg:max-w-none"
            >
              <div className="w-10 h-10 lg:w-16 lg:h-16 bg-emerald-100 rounded-xl lg:rounded-[1.25rem] flex items-center justify-center shrink-0">
                <Recycle className="w-5 h-5 lg:w-8 lg:h-8 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg lg:text-3xl font-black text-[#064E3B]">12,400+</p>
                <p className="text-[8px] lg:text-sm font-bold text-emerald-500 uppercase tracking-tight">Items saved from landfill today</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Content: Products */}
      <div id="marketplace" className="max-w-7xl mx-auto px-4 py-12 lg:py-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black text-emerald-950 mb-2">
              {searchQuery 
                ? `Search Results for "${searchQuery}"${selectedLocation !== "All Locations" ? ` in ${selectedLocation}` : ""}` 
                : selectedCategory !== "All" 
                  ? `${selectedCategory} Items${selectedLocation !== "All Locations" ? ` in ${selectedLocation}` : ""}` 
                  : selectedLocation !== "All Locations"
                    ? `Items in ${selectedLocation}`
                    : "Featured Items"}
            </h2>
            <p className="text-emerald-800/60 font-medium text-sm lg:text-base">
              {products.length} {products.length === 1 ? 'result' : 'results'} found.
            </p>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-6 py-3 border rounded-2xl transition-all shadow-sm font-bold text-sm ${showFilters ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-emerald-100 text-emerald-600 hover:bg-emerald-50'}`}
          >
            <Filter className="w-5 h-5" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-[2rem] border border-emerald-100 shadow-sm mb-12 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div>
              <label className="block text-xs font-black text-emerald-900 uppercase tracking-widest mb-2">Price Range</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-emerald-300">-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-emerald-900 uppercase tracking-widest mb-2">Location</label>
              <input 
                type="text" 
                placeholder="Search by city..." 
                value={selectedLocation === "All Locations" ? "" : selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value || "All Locations")}
                className="w-full px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-end">
              <button 
                onClick={() => {
                  setMinPrice("");
                  setMaxPrice("");
                  setSelectedLocation("All Locations");
                }}
                className="w-full py-2 text-emerald-600 font-bold text-sm hover:bg-emerald-50 rounded-xl transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-stone-200 aspect-square rounded-[2rem] mb-4"></div>
                <div className="h-4 bg-stone-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-stone-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group"
              >
                <Link to={`/product/${product.id}`}>
                  <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-white mb-4 border border-emerald-50 shadow-sm group-hover:shadow-xl group-hover:shadow-emerald-100/50 transition-all duration-500">
                    <img
                      src={product.imageUrl || (product.images && product.images[0]) || 'https://picsum.photos/seed/product/400/400'}
                      alt={product.title}
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <div className="bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-2xl text-sm font-black text-emerald-700 shadow-sm border border-white">
                        ₹{product.price}
                      </div>
                      <button
                        onClick={(e) => toggleWishlist(e, product)}
                        className={`p-2.5 rounded-xl backdrop-blur-md transition-all shadow-lg border border-white/50 ${
                          wishlistMap[product.id] 
                            ? 'bg-red-500 text-white' 
                            : 'bg-white/80 text-emerald-600 hover:bg-white hover:scale-110'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${wishlistMap[product.id] ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!user) {
                            navigate('/auth');
                            return;
                          }
                          try {
                            await addToCart(product);
                            setToastMessage(`${product.title} added to cart!`);
                            setShowToast(true);
                            setTimeout(() => setShowToast(false), 3000);
                          } catch (error) {
                            console.error("Failed to add to cart:", error);
                          }
                        }}
                        className="p-2.5 rounded-xl bg-white/80 backdrop-blur-md text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-lg border border-white/50 hover:scale-110"
                        title="Add to Cart"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-emerald-950 group-hover:text-emerald-600 transition-colors truncate text-lg">
                    {product.title}
                  </h3>
                  <p className="text-sm text-emerald-800/50 font-medium capitalize">{product.category} • {product.condition}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-emerald-50 shadow-sm">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Recycle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-emerald-950 mb-2">No products found</h3>
            <p className="text-emerald-800/50 mb-8 max-w-xs mx-auto">Be the first to list an item and help the environment!</p>
            <Link to="/sell" className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all">
              Start Selling
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-[100] bg-emerald-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-800/50 backdrop-blur-md"
          >
            <div className="bg-emerald-500 p-1 rounded-full">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
