import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  productId: { type: String, required: true },
  productTitle: { type: String, required: true },
  productPrice: { type: Number, required: true },
  productImageUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Wishlist = mongoose.model('Wishlist', wishlistSchema);
