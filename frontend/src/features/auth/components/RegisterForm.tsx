"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mail, Lock, User as UserIcon, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { register, login } from "@/lib/api-client";
import { persistAuthSession } from "@/lib/auth-client";

export function RegisterForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 1. Register the user
      await register({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      });

      setSuccess(true);
      
      // 2. Automatically log them in
      const session = await login(email, password);
      persistAuthSession(session);
      
      // 3. Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
      
    } catch (err: any) {
      setError(err.message || "Registration failed. This email might already be in use.");
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full relative"
    >
      <div className="relative bg-white border border-black/10 rounded-2xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-16 h-16 mx-auto bg-black rounded-xl flex items-center justify-center mb-6 shadow-sm"
          >
            <UserIcon className="w-7 h-7 text-white" />
          </motion.div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2 text-black">Create an account</h1>
          <p className="text-black/50 text-sm">Join the platform to get started</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-5">
            
            <div className="grid grid-cols-2 gap-4">
              {/* First Name */}
              <div className="relative group">
                <input
                  id="firstName"
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full bg-black/[0.02] border border-black/10 text-black text-sm rounded-xl px-4 py-4 outline-none transition-all placeholder:text-black/40 focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Last Name */}
              <div className="relative group">
                <input
                  id="lastName"
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full bg-black/[0.02] border border-black/10 text-black text-sm rounded-xl px-4 py-4 outline-none transition-all placeholder:text-black/40 focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40 group-focus-within:text-black transition-colors" />
              <input
                id="email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-black/[0.02] border border-black/10 text-black text-sm rounded-xl px-12 py-4 outline-none transition-all placeholder:text-black/40 focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40 group-focus-within:text-black transition-colors" />
              <input
                id="password"
                type="password"
                placeholder="Password (min 8 characters)"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-black/[0.02] border border-black/10 text-black text-sm rounded-xl px-12 py-4 outline-none transition-all placeholder:text-black/40 focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
              />
            </div>

          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="flex items-center gap-2 text-black bg-black/5 p-3 rounded-lg border border-black/10 text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <p>{error}</p>
              </motion.div>
            )}
            
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg border border-green-200 text-sm"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <p>Account created! Redirecting to dashboard...</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isLoading || success}
            className="group relative w-full flex items-center justify-center gap-2 bg-black hover:bg-black/90 text-white rounded-xl py-4 font-medium transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 overflow-hidden"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : success ? (
              <span>Success!</span>
            ) : (
              <>
                <span>Sign up</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
            
            {/* Button Shine Effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </button>
          
          <div className="text-center pt-2">
            <p className="text-sm text-black/60">
              Already have an account?{" "}
              <Link href="/login" className="text-black font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
