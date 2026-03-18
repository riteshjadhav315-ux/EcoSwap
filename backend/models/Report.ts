import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporterId: { type: String, required: true },
  targetId: { type: String, required: true }, // ID of the product or user being reported
  targetType: { type: String, enum: ['product', 'user'], required: true },
  reason: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

export const Report = mongoose.model('Report', reportSchema);
