import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    totalAmount: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  paymentId: { type: String, required: true, unique: true, index: true },
  signature: { type: String, required: true },
  buyerId: { type: String, required: true, index: true },
  buyerName: { type: String, required: true },
  buyerPhone: { type: String, default: "" },
  items: { type: [orderItemSchema], required: true, default: [] },
  quantity: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  status: { type: String, enum: ["paid", "failed"], default: "paid" },
  smsStatus: {
    type: String,
    enum: ["pending", "sent", "failed", "skipped"],
    default: "pending",
  },
  smsError: { type: String, default: "" },
  smsSentAt: { type: Date },
  createdAt: { type: Date, default: Date.now, index: true },
});

export const Order = mongoose.model("Order", orderSchema);
