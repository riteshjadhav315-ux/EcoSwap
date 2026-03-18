import React from 'react';
import { Link } from 'react-router-dom';
import { Recycle, Twitter, Instagram, Github } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-emerald-950 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold">
              <div className="bg-emerald-500 p-1.5 rounded-lg">
                <Recycle className="w-6 h-6 text-white" />
              </div>
              <span>EcoSwap</span>
            </Link>
            <p className="text-emerald-100/70 leading-relaxed max-w-xs">
              Making sustainable living accessible by giving pre-loved items a second life. Join our community of conscious consumers.
            </p>
          </div>

          {/* Marketplace Column */}
          <div>
            <h3 className="text-lg font-bold mb-6">Marketplace</h3>
            <ul className="space-y-4 text-emerald-100/70">
              <li><Link to="/" className="hover:text-white transition-colors">All Categories</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Featured Items</Link></li>
              <li><Link to="/sell" className="hover:text-white transition-colors">Sell an Item</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Trust & Safety</Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-lg font-bold mb-6">Company</h3>
            <ul className="space-y-4 text-emerald-100/70">
              <li><Link to="/" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Sustainability</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Press</Link></li>
            </ul>
          </div>

          {/* Connect Column */}
          <div>
            <h3 className="text-lg font-bold mb-6">Connect</h3>
            <div className="flex gap-4 mb-6">
              <a href="#" className="p-2 bg-emerald-900/50 rounded-xl hover:bg-emerald-800 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-emerald-900/50 rounded-xl hover:bg-emerald-800 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-emerald-900/50 rounded-xl hover:bg-emerald-800 transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
            <p className="text-sm text-emerald-100/50">
              Subscribe to our newsletter for eco-tips and new listings.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-emerald-900 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-emerald-100/40">
          <p>© 2024 EcoSwap. All rights reserved.</p>
          <div className="flex gap-8">
            <Link to="/" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
