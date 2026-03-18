import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import SellProduct from './pages/SellProduct';
import ProductDetails from './pages/ProductDetails';
import SellerProfile from './pages/SellerProfile';
import MyChats from './pages/MyChats';
import Chat from './pages/Chat';
import Home from './pages/Home';
import Help from './pages/Help';
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from './context/AuthContext';
import { SearchProvider } from './context/SearchContext';
import { CartProvider } from './context/CartContext';
import { AnimatePresence, motion } from 'framer-motion';

const AnimatedRoutes = () => {
  const location = useLocation();
  // Hide footer on both individual chat and chats list
  const isChatPage = location.pathname.startsWith('/chat');

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <main className="flex-1 flex flex-col relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col"
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/sell" element={<SellProduct />} />
              <Route path="/edit/:id" element={<SellProduct />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/seller/:sellerId" element={<SellerProfile />} />
              <Route path="/chats" element={<MyChats />} />
              <Route path="/chat/:id" element={<Chat />} />
              <Route path="/help" element={<Help />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      {!isChatPage && <Footer />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SearchProvider>
        <CartProvider>
          <Router>
            <ScrollToTop />
            <AnimatedRoutes />
          </Router>
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  );
}

export default App;
