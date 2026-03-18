import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  photoURL: { type: String },
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model('User', userSchema);
