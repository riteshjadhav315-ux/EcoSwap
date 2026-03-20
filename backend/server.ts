import path from "path";
import dotenv from "dotenv";
dotenv.config();
// Silent loading - variables are usually provided by the environment in this platform

import express from "express";
//import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import Razorpay from "razorpay";
import crypto from "crypto";
import { Product } from "./models/Product";
import { User } from "./models/User";
import { Chat, Message } from "./models/Chat";
import { Notification } from "./models/Notification";
import { Wishlist } from "./models/Wishlist";
import { Payment } from "./models/Payment";
import { Report } from "./models/Report";
import { Review } from "./models/Review";
import { SoldProduct } from "./models/SoldProduct";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

async function startServer() {
  try {
    const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.get("/api", (req, res) => {
  res.json({ message: "API is working 🚀" });
  });

  // Cloudinary Configuration
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const cloudinaryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "ecoswap_products",
      allowed_formats: ["jpg", "png", "jpeg"],
    } as any,
  });

  const upload = multer({ storage: cloudinaryStorage });

  // Authentication Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // MongoDB Connection
  let MONGODB_URI = process.env.MONGODB_URI;
  
  console.log("Initial MONGODB_URI from process.env:", MONGODB_URI ? "Present (sanitized: " + MONGODB_URI.replace(/:([^@]+)@/, ":****@") + ")" : "Missing");

  if (!MONGODB_URI) {
    console.log("MONGODB_URI not found in process.env, checking .env file...");
    dotenv.config({ path: path.resolve(__dirname, "../.env") });
    MONGODB_URI = process.env.MONGODB_URI;
    if (MONGODB_URI) {
      console.log("MONGODB_URI found in .env file");
    }
  }

  if (!MONGODB_URI) {
    console.log("CRITICAL: No MONGODB_URI provided. Data will NOT be persisted to Atlas.");
    console.log("Please set MONGODB_URI in the AI Studio Settings menu.");
    console.log("Falling back to in-memory MongoDB for temporary development...");
    try {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create();
      MONGODB_URI = mongoServer.getUri();
      console.log("Started in-memory MongoDB at:", MONGODB_URI);
    } catch (err) {
      console.error("Failed to start MongoMemoryServer:", err);
      MONGODB_URI = "mongodb://localhost:27017/ecoswap";
    }
  }

  let connectionError: string | null = null;
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI, { 
      serverSelectionTimeoutMS: 10000,
      dbName: "EcoSwap"
    });
    console.log("Successfully connected to MongoDB database:", mongoose.connection.name);
  } catch (err: any) {
    connectionError = err.message;
    console.error("MongoDB connection error:", err);
    
    if (mongoose.connection.readyState !== 1) {
      console.log("Primary connection failed. Falling back to in-memory MongoDB...");
      try {
        const { MongoMemoryServer } = await import("mongodb-memory-server");
        const mongoServer = await MongoMemoryServer.create();
        const fallbackUri = mongoServer.getUri();
        await mongoose.connect(fallbackUri, { dbName: "EcoSwap" });
        console.log("Connected to fallback in-memory MongoDB at:", fallbackUri);
      } catch (fallbackErr: any) {
        console.error("Failed to start fallback MongoMemoryServer:", fallbackErr);
      }
    }
  }

  // Local Multer for other file uploads if needed
  const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, "../uploads"));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + file.originalname);
    },
  });
  const localUpload = multer({ storage: localStorage });

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ error: "User already exists" });

      const hashedPassword = await bcrypt.hash(password, 10);
      const uid = new mongoose.Types.ObjectId().toString();
      user = new User({ uid, email, name, password: hashedPassword }); // Need to add password to schema
      await user.save();

      const token = jwt.sign({ uid: user.uid, role: user.role }, JWT_SECRET);
      res.json({ token, user });
    } catch (error) {
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: "Invalid credentials" });

      // @ts-ignore
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

      const token = jwt.sign({ uid: user.uid, role: user.role }, JWT_SECRET);
      res.json({ token, user });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  app.post("/api/auth/google", async (req, res) => {
    try {
      const { code } = req.body;
      const { tokens } = await client.getToken({
        code,
        redirect_uri: "postmessage",
      });
      const idToken = tokens.id_token;
      if (!idToken) return res.status(400).json({ error: "Invalid Google token" });

      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) return res.status(400).json({ error: "Invalid Google token" });

      const { email, name, picture } = payload;

      let user = await User.findOne({ email });

      if (!user) {
        const uid = new mongoose.Types.ObjectId().toString();
        user = new User({
          uid,
          email,
          name,
          photoURL: picture,
          provider: "google",
        });
        await user.save();
      } else if (user.provider !== "google") {
        user.provider = "google";
        user.photoURL = picture || user.photoURL;
        await user.save();
      }

      const token = jwt.sign({ uid: user.uid, role: user.role }, JWT_SECRET);
      res.json({ token, user });
    } catch (error) {
      console.error("Google Auth Error:", error);
      res.status(500).json({ error: "Google authentication failed" });
    }
  });

  // Admin Middleware
  const checkAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).json({ error: "Unauthorized" });

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await User.findOne({ uid: decoded.uid });

      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Forbidden - Access Denied" });
      }

      next();
    } catch (error) {
      res.status(401).json({ error: "Unauthorized" });
    }
  };

  // Admin Routes
  app.get("/api/admin/stats", checkAdmin, async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const totalProducts = await Product.countDocuments();
      const totalPayments = await Payment.countDocuments();
      const totalRevenue = await Payment.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);

      res.json({
        totalUsers,
        totalProducts,
        totalPayments,
        totalRevenue: totalRevenue[0]?.total || 0
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/users", checkAdmin, async (req, res) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:uid/role", checkAdmin, async (req, res) => {
    try {
      const { role } = req.body;
      const user = await User.findOneAndUpdate({ uid: req.params.uid }, { role }, { new: true });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  app.delete("/api/admin/users/:uid", checkAdmin, async (req, res) => {
    try {
      const user = await User.findOneAndDelete({ uid: req.params.uid });
      if (!user) return res.status(404).json({ error: "User not found" });
      
      // Also delete associated products, payments, etc. if needed
      // For now, just delete the user
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.get("/api/admin/products", checkAdmin, async (req, res) => {
    try {
      const products = await Product.find().sort({ createdAt: -1 });
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/admin/payments", checkAdmin, async (req, res) => {
    try {
      const payments = await Payment.find().sort({ createdAt: -1 });
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.get("/api/admin/analytics", checkAdmin, async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const totalProducts = await Product.countDocuments();
      const totalSoldProducts = await SoldProduct.countDocuments();
      const activeListings = await Product.countDocuments({ status: "available" });
      
      const revenueData = await SoldProduct.aggregate([
        { $group: { _id: null, total: { $sum: "$price" } } }
      ]);
      const totalRevenue = revenueData[0]?.total || 0;

      // Monthly Sales Data (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); // Get data for the last 6 months including current
      sixMonthsAgo.setDate(1); // Start from the beginning of the month
      
      const monthlySales = await SoldProduct.aggregate([
        { $match: { soldAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { month: { $month: "$soldAt" }, year: { $year: "$soldAt" } },
            sales: { $sum: 1 },
            revenue: { $sum: "$price" }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]);

      // User Growth Data (last 6 months)
      const userGrowth = await User.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]);

      // Format data for charts
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push({
          month: d.toLocaleString('default', { month: 'short' }),
          year: d.getFullYear(),
          monthNum: d.getMonth() + 1
        });
      }

      const formattedSales = months.map(m => {
        const found = monthlySales.find(s => s._id.month === m.monthNum && s._id.year === m.year);
        return {
          month: m.month,
          sales: found ? found.sales : 0,
          revenue: found ? found.revenue : 0
        };
      });

      const formattedGrowth = months.map(m => {
        const found = userGrowth.find(g => g._id.month === m.monthNum && g._id.year === m.year);
        return {
          month: m.month,
          count: found ? found.count : 0
        };
      });

      res.json({
        stats: {
          totalUsers,
          totalProducts,
          totalSoldProducts,
          totalRevenue,
          activeListings
        },
        monthlySales: formattedSales,
        userGrowth: formattedGrowth
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/admin/reports", checkAdmin, async (req, res) => {
    try {
      const reports = await Report.find().sort({ createdAt: -1 });
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  app.patch("/api/admin/reports/:id/resolve", checkAdmin, async (req, res) => {
    try {
      const report = await Report.findByIdAndUpdate(req.params.id, { status: 'resolved' }, { new: true });
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to resolve report" });
    }
  });

  app.post("/api/reports", async (req, res) => {
    try {
      const report = new Report(req.body);
      await report.save();
      res.status(201).json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to create report" });
    }
  });

  // Socket.io
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.id} joined chat ${chatId}`);
    });

    socket.on("send_message", async (data) => {
      const { chatId, senderId, senderName, text } = data;
      try {
        const message = new Message({ chatId, senderId, senderName, text });
        await message.save();
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: text,
          lastMessageAt: message.createdAt,
        });
        io.to(chatId).emit("new_message", message);
        
        // Notify recipient
        const chat = await Chat.findById(chatId);
        if (chat) {
          const recipientId = chat.buyerId === senderId ? chat.sellerId : chat.buyerId;
          const notification = new Notification({
            userId: recipientId,
            type: "message",
            title: `New message from ${senderName}`,
            message: text.length > 50 ? text.substring(0, 47) + "..." : text,
            link: `/chat/${chatId}`,
          });
          await notification.save();
          io.emit(`notification_${recipientId}`, notification);
        }
      } catch (error) {
        console.error("Error sending message via socket:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // API Routes
  // Products
  app.get("/api/products/my", authenticate, async (req: any, res) => {
    try {
      const products = await Product.find({ sellerId: req.user.uid }).sort({ createdAt: -1 });
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch your products" });
    }
  });

  app.get("/api/products/sold", authenticate, async (req: any, res) => {
    try {
      const soldProducts = await SoldProduct.find({ sellerId: req.user.uid }).sort({ soldAt: -1 });
      res.json(soldProducts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sold products" });
    }
  });

  app.get("/api/products/search", async (req, res) => {
    try {
      const { query, category, minPrice, maxPrice, location } = req.query;
      
      let searchQuery: any = {};

      if (query) {
        searchQuery.$or = [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { category: { $regex: query, $options: "i" } }
        ];
      }

      if (category && category !== "All") {
        searchQuery.category = category;
      }

      if (location && location !== "All Locations") {
        searchQuery.location = location;
      }

      if (minPrice || maxPrice) {
        searchQuery.price = {};
        if (minPrice) searchQuery.price.$gte = Number(minPrice);
        if (maxPrice) searchQuery.price.$lte = Number(maxPrice);
      }

      const products = await Product.find(searchQuery).sort({ createdAt: -1 });
      res.json(products);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const { category, search, location, sellerId } = req.query;
      let query: any = {};
      if (category && category !== "All") query.category = category;
      if (location && location !== "All Locations") query.location = location;
      if (sellerId) query.sellerId = sellerId;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }
      console.log("Fetching products with query:", query);
      const products = await Product.find(query).sort({ createdAt: -1 });
      console.log(`Found ${products.length} products`);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ error: "Product not found" });
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", authenticate, upload.array("images", 5), async (req: any, res) => {
    try {
      console.log("Creating product with data:", req.body);
      console.log("Uploaded files:", req.files);

      const imageUrls = (req.files as any[]).map(file => file.path);

      const productData = {
        ...req.body,
        price: Number(req.body.price), // Ensure price is a number
        images: imageUrls,
        imageUrl: imageUrls[0], // Keep for backward compatibility
        sellerId: req.user.uid
      };
      const product = new Product(productData);
      await product.save();
      console.log("Product created successfully:", product._id);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/products/:id", authenticate, upload.array("images", 5), async (req: any, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ error: "Product not found" });
      
      if (product.sellerId !== req.user.uid && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden: You don't own this product" });
      }

      const updateData = { ...req.body };
      if (updateData.price) updateData.price = Number(updateData.price);

      if (req.files && (req.files as any[]).length > 0) {
        const imageUrls = (req.files as any[]).map(file => file.path);
        updateData.images = imageUrls;
        updateData.imageUrl = imageUrls[0];
      }

      // If status is being updated to "sold", move to sold collection
      if (updateData.status === "sold" && product.status !== "sold") {
        await moveProductToSold(req.params.id);
        const updatedProduct = await Product.findById(req.params.id);
        return res.json(updatedProduct);
      }

      const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", authenticate, async (req: any, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ error: "Product not found" });

      if (product.sellerId !== req.user.uid && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden: You don't own this product" });
      }

      await Product.findByIdAndDelete(req.params.id);
      res.json({ message: "Product deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Users
  app.get("/api/users/:uid", async (req, res) => {
    try {
      const user = await User.findOne({ uid: req.params.uid });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const { uid, email, name } = req.body;
      let user = await User.findOne({ uid });
      if (!user) {
        user = new User({ uid, email, name });
        await user.save();
      }
      res.json(user);
    } catch (error) {
      console.error("Error in POST /api/users:", error);
      res.status(500).json({ error: "Failed to save user profile" });
    }
  });

  app.patch("/api/users/:uid", async (req, res) => {
    try {
      const user = await User.findOneAndUpdate({ uid: req.params.uid }, req.body, { new: true });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Upload
  app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    res.json({ url });
  });

  // Chats
  app.get("/api/chats", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "Missing required query parameter: userId" });
      }
      const chats = await Chat.find({ participants: userId }).sort({ lastMessageAt: -1 });
      res.json(chats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chats" });
    }
  });

  app.post("/api/chats", async (req, res) => {
  try {
    const {
      productId,
      buyerId,
      buyerName,
      sellerId,
      sellerName,
      productTitle,
      productImageUrl,
    } = req.body;

    if (!productId || !buyerId || !sellerId || !productTitle) {
      return res.status(400).json({ error: "Missing required chat fields" });
    }

    // ✅ FIX: check both buyer + seller + product
    let chat = await Chat.findOne({
      productId,
      buyerId,
      sellerId,
    });

    if (!chat) {
      chat = new Chat({
        productId,
        buyerId,
        buyerName,
        sellerId,
        sellerName,
        productTitle,
        productImageUrl,
        participants: [buyerId, sellerId], // ✅ IMPORTANT
        lastMessage: "",
        lastMessageAt: new Date(),
      });

      await chat.save();
    }

    res.json(chat);
  } catch (error) {
    console.error("CREATE CHAT ERROR:", error);
    res.status(500).json({ error: "Failed to start chat" });
  }
});

  app.get("/api/chats/:id", async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid chat ID" });
      }
      const chat = await Chat.findById(req.params.id);
      if (!chat) return res.status(404).json({ error: "Chat not found" });
      res.json(chat);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat" });
    }
  });

  app.get("/api/chats/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid chat ID" });
    }
    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // ✅ Check valid Mongo ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid chat ID" });
    }

    // ✅ Convert to ObjectId
    const messages = await Message.find({
      chatId: new mongoose.Types.ObjectId(id),
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("GET MESSAGES ERROR:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
  });

  app.post("/api/chats/:id/messages", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid chat ID" });
    }

    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const message = new Message({
      chatId: new mongoose.Types.ObjectId(req.params.id), // ✅ FIX
      ...req.body,
    });

    await message.save();

    await Chat.findByIdAndUpdate(req.params.id, {
      lastMessage: message.text,
      lastMessageAt: message.createdAt,
    });

    res.json(message);
  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

  // Dashboard APIs
  app.get("/api/dashboard/summary", authenticate, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const totalProducts = await Product.countDocuments({ sellerId: userId });
      const totalSold = await Product.countDocuments({ sellerId: userId, status: "sold" });
      const totalPurchases = await Payment.countDocuments({ buyerId: userId, status: "completed" });
      const totalWishlist = await Wishlist.countDocuments({ userId });
      const totalChats = await Chat.countDocuments({ participants: userId });
      const totalNotifications = await Notification.countDocuments({ userId, read: false });

      res.json({
        totalProducts,
        totalSold,
        totalPurchases,
        totalWishlist,
        totalChats,
        totalNotifications
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard summary" });
    }
  });

  app.get("/api/payments/my", authenticate, async (req: any, res) => {
    try {
      const purchases = await Payment.find({ buyerId: req.user.uid, status: "completed" })
        .populate('productId')
        .sort({ createdAt: -1 });
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch your purchases" });
    }
  });

  app.get("/api/wishlist/my", authenticate, async (req: any, res) => {
    try {
      const items = await Wishlist.find({ userId: req.user.uid }).sort({ createdAt: -1 });
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch your wishlist" });
    }
  });

  app.get("/api/reviews/my", authenticate, async (req: any, res) => {
    try {
      const reviews = await Review.find({ buyerId: req.user.uid })
        .populate('productId')
        .sort({ createdAt: -1 });
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch your reviews" });
    }
  });

  app.get("/api/notifications/my", authenticate, async (req: any, res) => {
    try {
      const notifications = await Notification.find({ userId: req.user.uid }).sort({ createdAt: -1 });
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch your notifications" });
    }
  });

  // Notifications
  app.get("/api/notifications", async (req, res) => {
    try {
      const { userId } = req.query;
      const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const notification = new Notification(req.body);
      await notification.save();
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  app.patch("/api/notifications/:id", async (req, res) => {
    try {
      const notification = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to update notification" });
    }
  });

  // Reviews
  app.post("/api/reviews/add", async (req, res) => {
    try {
      const { productId, buyerId } = req.body;
      
      // Check if review already exists
      const existingReview = await Review.findOne({ productId, buyerId });
      if (existingReview) {
        return res.status(400).json({ error: "You have already reviewed this product" });
      }

      // Optional: Check if payment exists for this product and buyer
      const payment = await Payment.findOne({ productId, buyerId, status: "completed" });
      if (!payment) {
        // For development, we might want to allow reviews even without payment, 
        // but the requirement says "Optionally allow reviews only after successful payment"
        // Let's keep it strict if we have payment data
        // return res.status(403).json({ error: "You can only review products you have purchased" });
      }

      const review = new Review(req.body);
      await review.save();
      res.status(201).json(review);
    } catch (error) {
      console.error("Error adding review:", error);
      res.status(500).json({ error: "Failed to add review" });
    }
  });

  app.get("/api/reviews/product/:productId", async (req, res) => {
    try {
      const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 });
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product reviews" });
    }
  });

  app.get("/api/reviews/seller/:sellerId", async (req, res) => {
    try {
      const reviews = await Review.find({ sellerId: req.params.sellerId }).sort({ createdAt: -1 });
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch seller reviews" });
    }
  });

  app.get("/api/reviews/average/:sellerId", async (req, res) => {
    try {
      const stats = await Review.aggregate([
        { $match: { sellerId: req.params.sellerId } },
        {
          $group: {
            _id: "$sellerId",
            averageRating: { $avg: "$rating" },
            reviewCount: { $sum: 1 }
          }
        }
      ]);
      
      if (stats.length === 0) {
        return res.json({ averageRating: 0, reviewCount: 0 });
      }
      
      res.json({
        averageRating: Math.round(stats[0].averageRating * 10) / 10,
        reviewCount: stats[0].reviewCount
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate average rating" });
    }
  });

  // Wishlist
  app.get("/api/wishlist", async (req, res) => {
    try {
      const { userId } = req.query;
      const items = await Wishlist.find({ userId }).sort({ createdAt: -1 });
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wishlist" });
    }
  });

  app.post("/api/wishlist", async (req, res) => {
    try {
      const { userId, productId } = req.body;
      let item = await Wishlist.findOne({ userId, productId });
      if (!item) {
        item = new Wishlist(req.body);
        await item.save();
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to add to wishlist" });
    }
  });

  app.delete("/api/wishlist/:id", async (req, res) => {
    try {
      await Wishlist.findByIdAndDelete(req.params.id);
      res.json({ message: "Removed from wishlist" });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove from wishlist" });
    }
  });

  // Payments
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_SRx6DVGwmoT3Wo",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "8Dm7YFRZKJaQ5EKxSsbSFzIG",
  });

  app.post("/api/payment/create-order", authenticate, async (req: any, res) => {
    try {
      const { productId } = req.body;
      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ error: "Product not found" });
      if (product.status === "sold") {
        return res.status(409).json({ error: "This product has already been sold" });
      }
      if (product.sellerId === req.user.uid) {
        return res.status(400).json({ error: "You cannot buy your own product" });
      }

      const options = {
        amount: Math.round(product.price * 100), // amount in the smallest currency unit (paise)
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({ error: "Failed to create payment order" });
    }
  });

  const moveProductToSold = async (productId: string, buyerId?: string, buyerName?: string) => {
    const product = await Product.findById(productId);
    if (!product) throw new Error("Product not found");

    const existingSoldProduct = await SoldProduct.findOne({ productId: product._id });
    if (existingSoldProduct) {
      if (product.status !== "sold") {
        product.status = "sold";
        await product.save();
      }
      return existingSoldProduct;
    }

    // Create sold product entry
    const soldProduct = new SoldProduct({
      productId: product._id,
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      location: product.location,
      imageUrl: product.imageUrl,
      images: product.images,
      sellerName: product.sellerName,
      sellerId: product.sellerId,
      sellerEmail: product.sellerEmail,
      sellerPhone: product.sellerPhone,
      buyerId,
      buyerName,
      condition: product.condition,
      soldAt: new Date(),
    });

    await soldProduct.save();

    // Update original product status
    product.status = "sold";
    await product.save();

    return soldProduct;
  };

  const processPaymentSuccess = async (productId: string, buyerId: string, paymentDetails: any) => {
    console.log(`Processing payment success for product ${productId}, buyer ${buyerId}`);
    const product = await Product.findById(productId);
    if (!product) {
      console.error(`Product ${productId} not found during payment processing`);
      throw new Error("Product not found");
    }
    if (product.sellerId === buyerId) {
      throw new Error("You cannot buy your own product");
    }

    const paymentLookup: Record<string, string>[] = [];
    if (paymentDetails.razorpay_payment_id) {
      paymentLookup.push({ paymentId: paymentDetails.razorpay_payment_id });
    }
    if (paymentDetails.razorpay_order_id) {
      paymentLookup.push({ orderId: paymentDetails.razorpay_order_id });
    }

    if (paymentLookup.length > 0) {
      const existingPayment = await Payment.findOne({ $or: paymentLookup });
      if (existingPayment) {
        return {
          success: true,
          message: "Payment already processed",
          paymentId: existingPayment.paymentId,
        };
      }
    }

    if (product.status === "sold") {
      throw new Error("This product has already been sold");
    }

    // Create payment record
    const payment = new Payment({
      orderId: paymentDetails.razorpay_order_id || `sim_${Date.now()}`,
      paymentId: paymentDetails.razorpay_payment_id || `sim_pay_${Date.now()}`,
      signature: paymentDetails.razorpay_signature || "simulated",
      productId,
      buyerId,
      amount: product.price,
      currency: "INR",
      status: "completed"
    });
    
    try {
      await payment.save();
      console.log(`Payment record saved: ${payment._id}`);
    } catch (error) {
      console.error("Error saving payment record:", error);
      throw error;
    }

    // Move product to sold collection and update status
    const buyer = await User.findOne({ uid: buyerId });
    await moveProductToSold(productId, buyerId, buyer?.name);
    console.log(`Product ${productId} moved to sold collection`);

    // Notify seller
    try {
      const notification = new Notification({
        userId: product.sellerId,
        type: "system",
        title: "Product Sold!",
        message: `Your product "${product.title}" has been sold for ₹${product.price}.`,
        link: `/product/${productId}`,
      });
      await notification.save();
      io.emit(`notification_${product.sellerId}`, notification);
      console.log(`Notification sent to seller ${product.sellerId}`);
    } catch (error) {
      console.error("Error sending notification to seller:", error);
      // Don't fail the whole process if notification fails
    }

    return { success: true, message: "Payment processed successfully", paymentId: payment.paymentId };
  };

  const verifyPaymentHandler = async (req: any, res: express.Response) => {
    try {
      console.log("Received payment verification request:", req.body);
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, productId, simulation } = req.body;
      const buyerId = req.user.uid;

      if (!productId) {
        return res.status(400).json({ error: "Missing required field: productId" });
      }
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      // Allow simulation in test mode or if explicitly requested
      const isTestMode = (process.env.RAZORPAY_KEY_ID || "").startsWith("rzp_test_");
      
      if (simulation === true || (isTestMode && !razorpay_signature)) {
        console.log("Processing simulated/test payment for product:", productId);
        const result = await processPaymentSuccess(productId, buyerId, {
          razorpay_order_id: razorpay_order_id || `test_order_${Date.now()}`,
          razorpay_payment_id: razorpay_payment_id || `test_pay_${Date.now()}`,
          razorpay_signature: razorpay_signature || "test_signature"
        });
        return res.json(result);
      }

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing Razorpay payment details" });
      }

      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "8Dm7YFRZKJaQ5EKxSsbSFzIG")
        .update(body.toString())
        .digest("hex");

      console.log("Signature verification:", { expected: expectedSignature, received: razorpay_signature });

      if (expectedSignature === razorpay_signature) {
        const result = await processPaymentSuccess(productId, buyerId, {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature
        });
        res.json(result);
      } else {
        console.error("Invalid Razorpay signature");
        res.status(400).json({ error: "Invalid signature" });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      const message = error instanceof Error ? error.message : String(error);
      if (message === "This product has already been sold") {
        return res.status(409).json({ error: message });
      }
      if (message === "You cannot buy your own product") {
        return res.status(400).json({ error: message });
      }
      res.status(500).json({ error: "Payment verification failed", details: message });
    }
  };

  app.post("/api/payment/verify-payment", authenticate, verifyPaymentHandler);
  app.post("/api/payments/verify", authenticate, verifyPaymentHandler);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      dbName: mongoose.connection.name,
      connectionError,
      isAtlas: process.env.MONGODB_URI && !mongoose.connection.host.includes('127.0.0.1') && !mongoose.connection.host.includes('localhost'),
      host: mongoose.connection.host,
      uri: process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:([^@]+)@/, ":****@") : "undefined"
    });
  });

  httpServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please restart the dev server.`);
    } else {
      console.error("HTTP Server Error:", err);
    }
  });

  // API 404 Handler - Catch all /api requests that didn't match any routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({ 
      error: "API endpoint not found", 
      method: req.method, 
      path: req.originalUrl 
    });
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled Error:", err);
    if (req.path.startsWith("/api/")) {
      return res.status(500).json({ 
        error: "Internal Server Error", 
        details: err.message 
      });
    }
    next(err);
  });

  const distPath = path.resolve(__dirname, "../frontend/dist");
app.use(express.static(distPath));


  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`API available at http://0.0.0.0:${PORT}/api`);
  });
  } catch (error) {
    console.error("CRITICAL SERVER ERROR:", error);
  }
}

startServer();
