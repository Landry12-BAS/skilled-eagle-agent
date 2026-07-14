"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, User, Building, Phone, Mail, X, Plus } from "lucide-react";
import { createClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewClientModal({ isOpen, onClose, onSuccess }: NewClientModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Not authenticated");

      await createClient({
        first_name: firstName,
        last_name: lastName,
        email,
        company,
        phone,
      }, token);

      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setCompany("");
      setPhone("");
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create client");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-black/10"
          >
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">New Client</h2>
                <p className="text-sm text-black/50">Add a new client to your portal</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-black/60" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 group-focus-within:text-black transition-colors" />
                    <input
                      required
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-black/[0.02] border border-black/10 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <input
                      required
                      type="text"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-black/[0.02] border border-black/10 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    />
                  </div>
                </div>

                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 group-focus-within:text-black transition-colors" />
                  <input
                    required
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/[0.02] border border-black/10 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  />
                </div>

                <div className="relative group">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 group-focus-within:text-black transition-colors" />
                  <input
                    type="text"
                    placeholder="Company (optional)"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-black/[0.02] border border-black/10 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  />
                </div>

                <div className="relative group">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 group-focus-within:text-black transition-colors" />
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-black/[0.02] border border-black/10 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  />
                </div>

                {error && (
                  <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                    {error}
                  </div>
                )}

                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="gap-2">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Create Client
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
