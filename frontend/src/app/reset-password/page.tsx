"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { confirmPasswordReset } from "@/lib/api-client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!uid || !token) {
      setError("Invalid or missing reset link. Please request a new password reset.");
    }
  }, [uid, token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uid || !token) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await confirmPasswordReset(uid, token, password);
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Something went wrong. The link might be expired.");
    } finally {
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
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-2 text-black">Reset Password</h1>
          <p className="text-black/50 text-sm">Create a new password for your account</p>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6"
          >
            <div className="w-16 h-16 mx-auto bg-black rounded-full flex items-center justify-center mb-6 shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-medium mb-2">Password Reset Successfully</h3>
            <p className="text-black/60 text-sm mb-6">
              You will be redirected to the login page shortly.
            </p>
            <Link
              href="/login"
              className="text-sm font-medium hover:underline underline-offset-4"
            >
              Click here if not redirected
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-5">
              
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40 group-focus-within:text-black transition-colors" />
                <input
                  id="password"
                  type="password"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={!uid || !token}
                  className="w-full bg-black/[0.02] border border-black/10 text-black text-sm rounded-xl px-12 py-4 outline-none transition-all placeholder:text-black/40 focus:border-black focus:bg-white focus:ring-1 focus:ring-black disabled:opacity-50"
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40 group-focus-within:text-black transition-colors" />
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={!uid || !token}
                  className="w-full bg-black/[0.02] border border-black/10 text-black text-sm rounded-xl px-12 py-4 outline-none transition-all placeholder:text-black/40 focus:border-black focus:bg-white focus:ring-1 focus:ring-black disabled:opacity-50"
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
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading || !uid || !token}
              className="group relative w-full flex items-center justify-center gap-2 bg-black hover:bg-black/90 text-white rounded-xl py-4 font-medium transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 overflow-hidden"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Reset Password</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white text-black">
      <div className="relative z-10 w-full max-w-md px-6">
        <Suspense fallback={<div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-black/50" /></div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
