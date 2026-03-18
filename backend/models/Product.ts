import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  imageUrl: { type: String },
  images: { type: [String], default: [] },
  sellerName: { type: String, required: true },
  sellerId: { type: String, required: true },
  sellerEmail: { type: String },
  sellerPhone: { type: String },
  condition: { type: String, enum: ['new', 'like new', 'used', 'Good', 'Fair'], required: true },
  status: { type: String, enum: ['available', 'sold'], default: 'available' },
  createdAt: { type: Date, default: Date.now },
});

// Add indexes for search performance
productSchema.index({ title: 'text', description: 'text', category: 'text' });
productSchema.index({ category: 1 });

export const Product = mongoose.model('Product', productSchema);
