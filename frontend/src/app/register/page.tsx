"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader2, UserPlus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    first_name: "",
    last_name: "",
    password: "",
    password2: "",
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!formData.email || !formData.username || !formData.password || !formData.password2) {
      setLocalError("Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.password2) {
      setLocalError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setLocalError("Password must be at least 8 characters long");
      return;
    }

    const success = await register(
      formData.email,
      formData.username,
      formData.password,
      formData.password2,
      formData.first_name,
      formData.last_name
    );

    if (success) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden py-12">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/30 rounded-full blur-[120px] mix-blend-screen" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg z-10 px-4"
      >
        <div className="bg-card/40 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-3xl shadow-2xl overflow-hidden p-8">
          <div className="flex justify-center mb-6">
            <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-inner">
              <UserPlus className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-center mb-2 tracking-tight text-foreground">Create Account</h1>
          <p className="text-center text-muted-foreground mb-8 text-sm">
            Join Landry today to start collaborating
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email & Username */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-foreground ml-1">Email *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="block w-full pl-9 pr-3 py-2.5 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-foreground text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="username" className="block text-sm font-medium text-foreground ml-1">Username *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="username"
                    className="block w-full pl-9 pr-3 py-2.5 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-foreground text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label htmlFor="first_name" className="block text-sm font-medium text-foreground ml-1">First Name</label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="John"
                  className="block w-full px-4 py-2.5 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-foreground text-sm"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="last_name" className="block text-sm font-medium text-foreground ml-1">Last Name</label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="block w-full px-4 py-2.5 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-foreground text-sm"
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium text-foreground ml-1">Password *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-foreground text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-1">At least 8 characters</p>
            </div>

            <div className="space-y-1">
              <label htmlFor="password2" className="block text-sm font-medium text-foreground ml-1">Confirm Password *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  id="password2"
                  name="password2"
                  type="password"
                  value={formData.password2}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-foreground text-sm"
                />
              </div>
            </div>

            <AnimatePresence>
              {(error || localError) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p>{error || localError}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-6 rounded-xl group relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground transition-all mt-2"
            >
              <span className="relative z-10 flex items-center justify-center gap-2 font-medium text-base">
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
