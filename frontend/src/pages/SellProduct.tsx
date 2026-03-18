import React, { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, CheckCircle2, Info, Loader2 } from "lucide-react";
import { CATEGORIES } from "../constants";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createProduct, uploadProductImage, getProductById, updateProduct, createProductWithImages, updateProductWithImages } from "../services/productService";

export default function SellProduct() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: CATEGORIES[0].slug,
    price: "",
    condition: "new" as "new" | "like new" | "used",
    location: "",
    description: "",
    sellerEmail: "",
    sellerPhone: ""
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=" + (id ? `/edit/${id}` : "/sell"));
    }
  }, [user, authLoading, navigate, id]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (id) {
        setIsLoading(true);
        try {
          const product = await getProductById(id);
          if (product) {
            // Security check: only owner can edit
            if (user && product.sellerId !== user.uid && user.role !== 'admin') {
              navigate("/");
              return;
            }
            setFormData({
              title: product.title,
              category: product.category,
              price: product.price.toString(),
              condition: product.condition,
              location: product.location,
              description: product.description,
              sellerEmail: product.sellerEmail || "",
              sellerPhone: product.sellerPhone || ""
            });
            if (product.images && product.images.length > 0) {
              setPreviewUrls(product.images);
            } else if (product.imageUrl) {
              setPreviewUrls([product.imageUrl]);
            }
          }
        } catch (err) {
          console.error("Error fetching product for edit:", err);
          setError("Failed to load product details.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (user) {
      fetchProduct();
    }
  }, [id, user, navigate]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50/30">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    setError(null);

    if (files.length === 0) return;
    
    if (selectedFiles.length + files.length > 5) {
      setError("You can only upload up to 5 images.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    const validFiles: File[] = [];
    const newPreviewUrls: string[] = [];

    files.forEach((file: File) => {
      if (!allowedTypes.includes(file.type)) {
        setError("Only JPG, JPEG, and PNG files are allowed.");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setError("Each file size must be less than 2MB.");
        return;
      }
      validFiles.push(file);
      newPreviewUrls.push(URL.createObjectURL(file));
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const removeImage = (index: number) => {
    // If it's a new file, remove it from selectedFiles
    // If it's an existing URL, we might need a way to track deletions
    // For now, let's just handle new files
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("Please sign in to post a listing.");
      navigate("/auth");
      return;
    }

    if (selectedFiles.length === 0 && !id) {
      setError("Please upload at least one image for your product.");
      return;
    }

    setIsSubmitting(true);
    try {
      const productFormData = new FormData();
      productFormData.append("title", formData.title);
      productFormData.append("description", formData.description);
      productFormData.append("price", formData.price);
      productFormData.append("category", formData.category);
      productFormData.append("condition", formData.condition);
      productFormData.append("location", formData.location);
      productFormData.append("sellerName", user.name || user.email?.split('@')?.[0] || "EcoSwapper");
      if (formData.sellerEmail || user.email) productFormData.append("sellerEmail", formData.sellerEmail || user.email!);
      if (formData.sellerPhone) productFormData.append("sellerPhone", formData.sellerPhone);
      
      selectedFiles.forEach(file => {
        productFormData.append("images", file);
      });

      if (id) {
        await updateProductWithImages(id, productFormData);
      } else {
        await createProductWithImages(productFormData);
      }

      setIsSuccess(true);
      setTimeout(() => navigate(id ? "/dashboard" : "/"), 2000);
    } catch (err: any) {
      console.error("Error saving listing:", err);
      setError(err.message || "Failed to save listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50/30 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-emerald-100 border border-white overflow-hidden">
          <div className="bg-emerald-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">{id ? "Edit Your Item" : "Sell Your Item"}</h1>
            <p className="text-emerald-100 opacity-80">
              {id ? "Update your product details to attract more buyers." : "Give your pre-loved items a second life in just a few steps."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium flex items-center gap-2">
                <X className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-bold text-emerald-900 uppercase tracking-widest mb-4">Product Images (Max 5)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                <AnimatePresence>
                  {previewUrls.map((url, index) => (
                    <motion.div
                      key={url}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative aspect-square rounded-2xl overflow-hidden border-2 border-emerald-100 shadow-md group"
                    >
                      <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                  
                  {previewUrls.length < 5 && (
                    <motion.label
                      key="upload"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="aspect-square rounded-2xl border-2 border-dashed border-emerald-200 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-400 transition-all group"
                    >
                      <Camera className="w-8 h-8 text-emerald-300 group-hover:text-emerald-500 mb-2" />
                      <span className="text-[10px] font-bold text-emerald-400 group-hover:text-emerald-600 uppercase tracking-tighter">Add Photo</span>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        multiple
                        accept="image/jpeg,image/jpg,image/png" 
                        onChange={handleFileChange} 
                      />
                    </motion.label>
                  )}
                </AnimatePresence>
              </div>
              <p className="mt-2 text-[10px] text-emerald-400 italic">
                * Upload up to 5 high-quality images of your product.
              </p>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-emerald-900 uppercase tracking-widest mb-2">Title</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What are you selling?"
                  className="w-full px-4 py-4 rounded-2xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50/30 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-emerald-900 uppercase tracking-widest mb-2">Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-4 rounded-2xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50/30 font-medium"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-emerald-900 uppercase tracking-widest mb-2">Price (₹)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-4 rounded-2xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50/30 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-emerald-900 uppercase tracking-widest mb-2">Condition</label>
                <select 
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                  className="w-full px-4 py-4 rounded-2xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50/30 font-medium"
                >
                  <option value="new">New</option>
                  <option value="like new">Like New</option>
                  <option value="used">Used</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-emerald-900 uppercase tracking-widest mb-2">Location</label>
                <input
                  required
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="City, State"
                  className="w-full px-4 py-4 rounded-2xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50/30 font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-emerald-900 uppercase tracking-widest mb-2">Description</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your item's features, condition, and why you're selling it..."
                  className="w-full px-4 py-4 rounded-2xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50/30 resize-none font-medium"
                />
              </div>

              <div className="md:col-span-2 pt-4 border-t border-emerald-50">
                <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-emerald-500" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-emerald-900 uppercase tracking-widest mb-2">Contact Email</label>
                    <input
                      type="email"
                      value={formData.sellerEmail}
                      onChange={(e) => setFormData({ ...formData, sellerEmail: e.target.value })}
                      placeholder={user?.email || "your@email.com"}
                      className="w-full px-4 py-4 rounded-2xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50/30 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-emerald-900 uppercase tracking-widest mb-2">Contact Phone (Optional)</label>
                    <input
                      type="tel"
                      value={formData.sellerPhone}
                      onChange={(e) => setFormData({ ...formData, sellerPhone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-4 rounded-2xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50/30 font-medium"
                    />
                  </div>
                </div>
                <p className="mt-4 text-xs text-emerald-500 italic">
                  * This information will only be visible to logged-in users who click "Contact Seller".
                </p>
              </div>
            </div>

            <button
              disabled={isSubmitting || isSuccess}
              type="submit"
              className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  {id ? "Updating Listing..." : "Uploading Listing..."}
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="w-6 h-6" />
                  {id ? "Listing Updated Successfully!" : "Listing Created Successfully!"}
                </>
              ) : (
                <>
                  {id ? <CheckCircle2 className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                  {id ? "Update Listing" : "Upload Listing"}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
