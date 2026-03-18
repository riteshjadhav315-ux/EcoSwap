import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Package, CreditCard, AlertTriangle, TrendingUp, 
  Search, Filter, Trash2, ShieldAlert, CheckCircle, XCircle,
  ChevronRight, MoreVertical, LayoutDashboard, Settings,
  BarChart3, ShieldCheck, UserMinus, UserPlus, Eye
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface Stats {
  totalUsers: number;
  totalProducts: number;
  totalPayments: number;
  totalRevenue: number;
}

interface User {
  uid: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Product {
  _id: string;
  title: string;
  price: number;
  category: string;
  sellerId: string;
  status: string;
  createdAt: string;
}

interface Payment {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  productId: string;
  buyerId: string;
  createdAt: string;
}

interface Report {
  _id: string;
  reporterId: string;
  targetId: string;
  targetType: 'product' | 'user';
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'products' | 'payments' | 'reports'>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = { 'Authorization': `Bearer ${token}` };

        const [statsRes, usersRes, productsRes, paymentsRes, reportsRes] = await Promise.all([
          fetch("/api/admin/stats", { headers }),
          fetch("/api/admin/users", { headers }),
          fetch("/api/admin/products", { headers }),
          fetch("/api/admin/payments", { headers }),
          fetch("/api/admin/reports", { headers })
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());
        if (productsRes.ok) setProducts(await productsRes.json());
        if (paymentsRes.ok) setPayments(await paymentsRes.json());
        if (reportsRes.ok) setReports(await reportsRes.json());
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const handleUpdateRole = async (uid: string, newRole: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/users/${uid}/role`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (res.ok) {
        setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
      }
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setProducts(products.filter(p => p._id !== id));
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-emerald-600 font-bold animate-pulse">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50/30 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-emerald-100 flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-emerald-50">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-emerald-900 leading-none">Admin</h1>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Control Center</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'overview' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'users' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            <Users className="w-5 h-5" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'products' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            <Package className="w-5 h-5" />
            Products
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'payments' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            Payments
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'reports' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
            Reports
            {reports.filter(r => r.status === 'pending').length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                {reports.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
        </nav>

        <div className="p-4 border-t border-emerald-50">
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-emerald-800 hover:bg-emerald-50 transition-all"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
            Back to Site
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-emerald-900 capitalize">{activeTab}</h2>
            <p className="text-emerald-600/60 text-sm">Manage your marketplace ecosystem</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-emerald-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all w-64"
              />
            </div>
            <div className="bg-white p-2 rounded-xl border border-emerald-100">
              <Settings className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "bg-blue-500" },
                  { label: "Total Products", value: stats?.totalProducts || 0, icon: Package, color: "bg-emerald-500" },
                  { label: "Total Payments", value: stats?.totalPayments || 0, icon: CreditCard, color: "bg-purple-500" },
                  { label: "Total Revenue", value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: "bg-amber-500" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-emerald-50 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`${stat.color} p-3 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <BarChart3 className="w-4 h-4 text-emerald-100" />
                    </div>
                    <p className="text-emerald-600/60 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                    <h3 className="text-2xl font-bold text-emerald-900 mt-1">{stat.value}</h3>
                  </div>
                ))}
              </div>

              {/* Recent Activity Placeholder */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-3xl border border-emerald-50 shadow-sm">
                  <h3 className="font-bold text-emerald-900 mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Marketplace Growth
                  </h3>
                  <div className="h-64 flex items-center justify-center bg-emerald-50/50 rounded-2xl border border-dashed border-emerald-200">
                    <p className="text-emerald-600/40 text-sm font-medium italic">Chart visualization coming soon...</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-emerald-50 shadow-sm">
                  <h3 className="font-bold text-emerald-900 mb-6 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                    Recent Reports
                  </h3>
                  <div className="space-y-4">
                    {reports.slice(0, 4).map((report) => (
                      <div key={report._id} className="flex items-center gap-4 p-3 hover:bg-emerald-50 rounded-2xl transition-colors">
                        <div className={`p-2 rounded-xl ${report.targetType === 'product' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                          {report.targetType === 'product' ? <Package className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-emerald-900">{report.reason}</p>
                          <p className="text-xs text-emerald-600/60">{report.targetType} ID: {report.targetId}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                          report.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                    ))}
                    {reports.length === 0 && (
                      <div className="text-center py-12">
                        <CheckCircle className="w-12 h-12 text-emerald-100 mx-auto mb-3" />
                        <p className="text-emerald-600/40 text-sm">No active reports</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl border border-emerald-50 shadow-sm overflow-hidden"
            >
              <table className="w-full text-left">
                <thead className="bg-emerald-50/50 border-b border-emerald-50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">User</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Role</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Joined</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-emerald-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {filteredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">
                            {u.name?.[0] || u.email[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-emerald-900">{u.name || "Unnamed User"}</p>
                            <p className="text-xs text-emerald-600/60">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-emerald-600/60">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {u.role === 'user' ? (
                            <button 
                              onClick={() => handleUpdateRole(u.uid, 'admin')}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
                              title="Make Admin"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleUpdateRole(u.uid, 'user')}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                              title="Make User"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          )}
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Block User">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredProducts.map((p) => (
                <div key={p._id} className="bg-white p-4 rounded-3xl border border-emerald-50 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
                      <Package className="w-6 h-6" />
                    </div>
                    <div className="flex gap-1">
                      <button className="p-2 text-emerald-400 hover:text-emerald-600 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(p._id)}
                        className="p-2 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold text-emerald-900 truncate">{p.title}</h4>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-emerald-600 font-bold">₹{p.price.toLocaleString()}</p>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{p.category}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-emerald-50 flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      p.status === 'sold' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {p.status}
                    </span>
                    <p className="text-[10px] text-emerald-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'payments' && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl border border-emerald-50 shadow-sm overflow-hidden"
            >
              <table className="w-full text-left">
                <thead className="bg-emerald-50/50 border-b border-emerald-50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Transaction ID</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {payments.map((pay) => (
                    <tr key={pay._id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-emerald-600">
                        {pay._id}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-emerald-900">₹{pay.amount.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                          pay.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {pay.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-emerald-600/60">
                        {new Date(pay.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {reports.map((report) => (
                <div key={report._id} className="bg-white p-6 rounded-3xl border border-emerald-50 shadow-sm flex gap-6">
                  <div className={`p-4 rounded-2xl h-fit ${report.targetType === 'product' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {report.targetType === 'product' ? <Package className="w-8 h-8" /> : <Users className="w-8 h-8" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-emerald-900 text-lg">{report.reason}</h4>
                        <p className="text-xs text-emerald-600/60 uppercase tracking-widest font-bold">
                          Reported {report.targetType} ID: {report.targetId}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                        report.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                    <p className="text-emerald-800/80 text-sm mb-4">{report.description}</p>
                    <div className="flex items-center gap-4 pt-4 border-t border-emerald-50">
                      <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1">
                        <Eye className="w-4 h-4" /> View Target
                      </button>
                      <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Resolve
                      </button>
                      <button className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1">
                        <Trash2 className="w-4 h-4" /> Delete Target
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {reports.length === 0 && (
                <div className="text-center py-24 bg-white rounded-3xl border border-emerald-50">
                  <ShieldCheck className="w-16 h-16 text-emerald-100 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-emerald-900">All Clear!</h3>
                  <p className="text-emerald-600/60">No community reports to review at this time.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
