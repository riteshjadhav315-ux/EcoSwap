import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  paymentId: { type: String, required: true },
  signature: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  buyerId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, default: 'completed' },
  createdAt: { type: Date, default: Date.now },
});

export const Payment = mongoose.model('Payment', paymentSchema);
