import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ['message', 'system'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const Notification = mongoose.model('Notification', notificationSchema);
