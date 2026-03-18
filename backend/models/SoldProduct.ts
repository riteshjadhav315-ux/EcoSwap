import mongoose from 'mongoose';

const soldProductSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
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
  buyerId: { type: String }, // Optional, if available
  buyerName: { type: String },
  condition: { type: String, required: true },
  soldAt: { type: Date, default: Date.now },
});

export const SoldProduct = mongoose.model('SoldProduct', soldProductSchema);
