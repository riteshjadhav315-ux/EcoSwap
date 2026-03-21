import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Recycle, ArrowRight, AlertCircle, Loader2, User, Phone, MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { apiFetch } from "../services/api";

const GoogleLoginButton = ({ setLoading, setError, navigate, redirectPath, login, loading }: any) => {
  const handleGoogleSignIn = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError("Google login failed");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ token: string; user: any }>("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      login(data.token, data.user);
      navigate(redirectPath);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSignIn}
          onError={() => setError("Google login failed")}
          theme="outline"
          size="large"
          text="signin_with"
          shape="pill"
          width="320"
          use_fedcm_for_button={true}
        />
      </div>
      {loading && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-emerald-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          Signing in with Google...
        </div>
      )}
    </div>
  );
};

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const { login } = useAuth();

  const queryParams = new URLSearchParams(routeLocation.search);
  const redirectPath = queryParams.get("redirect") || "/";

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin 
        ? { email, password } 
        : { email, password, name: `${firstName} ${lastName}`, phone, location };

      const data = await apiFetch<{ token: string; user: any }>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      login(data.token, data.user);
      navigate(redirectPath);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50/30 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-12 shadow-2xl shadow-emerald-100 border border-emerald-50"
      >
        <div className="flex flex-col items-center mb-8 sm:mb-10">
          <div className="bg-emerald-600 p-3 rounded-2xl mb-4 shadow-lg shadow-emerald-200">
            <Recycle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-emerald-950 mb-2 text-center">
            {isLogin ? "Welcome Back" : "Join EcoSwap"}
          </h1>
          <p className="text-emerald-600/70 text-center font-medium text-sm sm:text-base">
            {isLogin 
              ? "Sign in to continue your sustainable journey" 
              : "Create an account to start swapping today"}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-hidden"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest pl-4">First Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-emerald-300" />
                    </div>
                    <input
                      type="text"
                      required={!isLogin}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-emerald-50/50 border border-emerald-100 hover:border-emerald-300 focus:border-emerald-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-emerald-950 font-medium"
                      placeholder="John"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest pl-4">Last Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-emerald-300" />
                    </div>
                    <input
                      type="text"
                      required={!isLogin}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-emerald-50/50 border border-emerald-100 hover:border-emerald-300 focus:border-emerald-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-emerald-950 font-medium"
                      placeholder="Doe"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6 overflow-hidden"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest pl-4">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-emerald-300" />
                    </div>
                    <input
                      type="tel"
                      required={!isLogin}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-emerald-50/50 border border-emerald-100 hover:border-emerald-300 focus:border-emerald-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-emerald-950 font-medium"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest pl-4">Location</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-emerald-300" />
                    </div>
                    <input
                      type="text"
                      required={!isLogin}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-emerald-50/50 border border-emerald-100 hover:border-emerald-300 focus:border-emerald-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-emerald-950 font-medium"
                      placeholder="City, Country"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest pl-4">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-emerald-300" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 bg-emerald-50/50 border border-emerald-100 hover:border-emerald-300 focus:border-emerald-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-emerald-950 font-medium"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest pl-4">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-emerald-300" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 bg-emerald-50/50 border border-emerald-100 hover:border-emerald-300 focus:border-emerald-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-emerald-950 font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                {isLogin ? "Sign In" : "Create Account"}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-emerald-100" />
          <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Or continue with</span>
          <div className="flex-1 h-px bg-emerald-100" />
        </div>

        {googleClientId ? (
          <GoogleLoginButton 
            setLoading={setLoading} 
            setError={setError} 
            navigate={navigate} 
            redirectPath={redirectPath} 
            login={login}
            loading={loading}
          />
        ) : (
          <button
            onClick={() => setError("Google Login is not configured. Please set VITE_GOOGLE_CLIENT_ID in settings.")}
            disabled={loading}
            className="mt-6 w-full py-4 bg-white border border-emerald-100 text-emerald-950 rounded-2xl font-bold hover:bg-emerald-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 opacity-50" />
            Google (Not Configured)
          </button>
        )}

        <div className="mt-8 pt-8 border-t border-emerald-50 text-center">
          <p className="text-emerald-800/60 font-medium">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="ml-2 text-emerald-600 font-black hover:underline"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
