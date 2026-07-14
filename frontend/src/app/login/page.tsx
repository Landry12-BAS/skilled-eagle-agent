"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!email || !password) {
      setLocalError("Please fill in all fields");
      return;
    }

    const success = await login(email, password);
    if (success) {
      router.push("/dashboard");
    } else {
      setLocalError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/30 rounded-full blur-[120px] mix-blend-screen" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md z-10 px-4"
      >
        <div className="bg-card/40 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-3xl shadow-2xl overflow-hidden p-8">
          <div className="flex justify-center mb-6">
            <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-inner">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-center mb-2 tracking-tight text-foreground">Welcome Back</h1>
          <p className="text-center text-muted-foreground mb-8 text-sm">
            Sign in to continue to your AI workspace
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-foreground ml-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-foreground"
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
              className="w-full py-6 rounded-xl group relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
            >
              <span className="relative z-10 flex items-center justify-center gap-2 font-medium text-base">
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Create an account
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
