import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllProducts, getFilteredProducts, searchProducts } from '../services/productService';
import { Product } from '../types';
import { motion } from 'framer-motion';
import { Search, Filter, Recycle, ShieldCheck, Zap, Leaf, ArrowRight, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { addToWishlist, removeFromWishlist, isInWishlist } from '../services/wishlistService';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { user } = useAuth();
  const { searchQuery, selectedCategory, selectedLocation, setSelectedLocation } = useSearch();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistMap, setWishlistMap] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

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
      <section className="relative bg-[#E9F5F1] overflow-hidden pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/50 backdrop-blur-sm border border-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8">
              <Recycle className="w-3 h-3" />
              Sustainable Marketplace
            </div>
            <h1 className="text-6xl lg:text-[5.5rem] font-black text-[#064E3B] leading-[0.95] mb-8 tracking-tight">
              Give Your Items a <br />
              <span className="text-emerald-600">Second Life</span>
            </h1>
            <p className="text-xl text-emerald-900/60 mb-12 max-w-lg leading-relaxed font-medium">
              Join thousands of people swapping, selling, and buying pre-loved goods. Reduce waste and save money with EcoSwap.
            </p>
            
            <div className="flex flex-wrap gap-4 mb-16">
              <Link 
                to="/sell" 
                className="px-10 py-5 bg-[#059669] text-white rounded-[2rem] font-black hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200/50 flex items-center gap-3 group text-lg"
              >
                Start Selling
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button 
                onClick={() => document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-10 py-5 bg-white text-emerald-900 border border-emerald-100 rounded-[2rem] font-black hover:bg-emerald-50 transition-all shadow-sm text-lg"
              >
                Browse Items
              </button>
            </div>

            <div className="flex gap-12">
              <div className="flex items-center gap-3 text-[#064E3B] font-black text-sm uppercase tracking-wider">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                Secure Swaps
              </div>
              <div className="flex items-center gap-3 text-[#064E3B] font-black text-sm uppercase tracking-wider">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-emerald-600" />
                </div>
                Fast Listing
              </div>
              <div className="flex items-center gap-3 text-[#064E3B] font-black text-sm uppercase tracking-wider">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-emerald-600" />
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
            className="relative"
          >
            <div className="relative rounded-[4rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(5,150,105,0.2)] border-[12px] border-white group">
              <img 
                src="https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=1200" 
                alt="Eco-Friendly Electronics Marketplace" 
                className="w-full h-[600px] object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/10 to-transparent pointer-events-none" />
            </div>

            {/* Floating Stats Card */}
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
              className="absolute -bottom-10 -left-10 bg-white p-8 rounded-[2.5rem] shadow-2xl border border-emerald-50 flex items-center gap-6 z-20"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-[1.25rem] flex items-center justify-center">
                <Recycle className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <p className="text-3xl font-black text-[#064E3B]">12,400+</p>
                <p className="text-sm font-bold text-emerald-500 uppercase tracking-tight">Items saved from landfill today</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Content: Products */}
      <div id="marketplace" className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-black text-emerald-950 mb-2">
              {searchQuery 
                ? `Search Results for "${searchQuery}"${selectedLocation !== "All Locations" ? ` in ${selectedLocation}` : ""}` 
                : selectedCategory !== "All" 
                  ? `${selectedCategory} Items${selectedLocation !== "All Locations" ? ` in ${selectedLocation}` : ""}` 
                  : selectedLocation !== "All Locations"
                    ? `Items in ${selectedLocation}`
                    : "Featured Items"}
            </h2>
            <p className="text-emerald-800/60 font-medium">
              {products.length} {products.length === 1 ? 'result' : 'results'} found.
            </p>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 border rounded-2xl transition-all shadow-sm ${showFilters ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-emerald-100 text-emerald-600 hover:bg-emerald-50'}`}
          >
            <Filter className="w-6 h-6" />
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
    </div>
  );
};

export default Home;
