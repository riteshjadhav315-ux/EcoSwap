import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productTitle: { type: String, required: true },
  productImageUrl: { type: String, required: true },
  buyerId: { type: String, required: true },
  buyerName: { type: String, required: true },
  sellerId: { type: String, required: true },
  sellerName: { type: String, required: true },
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now },
  participants: [{ type: String }],
});

export const Chat = mongoose.model('Chat', chatSchema);

const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Message = mongoose.model('Message', messageSchema);
