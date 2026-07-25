"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, MapPin, ChevronDown, CheckCircle2, Send } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";

const faqs = [
  { q: "What AI models do you support?", a: "We support GPT-4o, Claude 4, Gemini 2.5 Pro, Mistral, LLaMA 3, and 40+ other models across text, image, audio, and video." },
  { q: "Do you offer a free trial?", a: "Yes! Our Starter plan includes a 14-day free trial with full access to all features." },
  { q: "Can I use my own data?", a: "Absolutely. Our RAG pipeline lets you connect your proprietary data sources securely." },
  { q: "What's your uptime guarantee?", a: "We maintain 99.9% uptime with enterprise-grade infrastructure and 24/7 monitoring." },
  { q: "How do I get started?", a: "Create an account, choose your plan, and start making API calls within minutes." }
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // In a real app, send data to backend here
  };

  return (
    <div className="min-h-screen bg-[#06070A] text-white">
      <Navbar />

      <main className="pt-32 pb-24">
        {/* Hero */}
        <div className="text-center px-6 mb-16 relative">
          <div className="absolute inset-0 bg-[url('/marketing/ai-contact.jpg')] bg-cover bg-center opacity-10 pointer-events-none -z-10 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Get in Touch</h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Have a question about our AI services? We'd love to hear from you. Our team typically responds within 24 hours.
          </p>
        </div>

        {/* Split Layout */}
        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto px-6 mb-24">
          
          {/* Left: Form */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-8 md:p-10">
            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                <p className="text-white/60 mb-8">Thanks for reaching out. We'll get back to you shortly.</p>
                <button onClick={() => setSubmitted(false)} className="text-indigo-400 text-sm hover:text-indigo-300">Send another message</button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Full Name</label>
                    <input required type="text" placeholder="John Doe" className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-indigo-500/50 focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Email Address</label>
                    <input required type="email" placeholder="john@example.com" className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-indigo-500/50 focus:outline-none transition-colors" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2 flex items-center justify-between">
                    <span>Company</span>
                    <span className="text-white/30 text-xs">Optional</span>
                  </label>
                  <input type="text" placeholder="Acme Corp" className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-indigo-500/50 focus:outline-none transition-colors" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Subject</label>
                  <select required className="w-full bg-[#0A0C10] border border-white/[0.08] rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 focus:outline-none transition-colors appearance-none">
                    <option value="">Select a topic...</option>
                    <option value="sales">Sales Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="partnership">Partnership</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Message</label>
                  <textarea required rows={5} placeholder="How can we help you?" className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-indigo-500/50 focus:outline-none transition-colors resize-none" />
                </div>

                <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  Send Message
                </button>
              </form>
            )}
          </div>

          {/* Right: Info + FAQ */}
          <div>
            <div className="space-y-4 mb-12">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex items-center gap-5 hover:bg-white/[0.05] transition-colors">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Email us anytime</p>
                  <p className="text-white/50 text-sm">hello@skilledeagle.ai</p>
                </div>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex items-center gap-5 hover:bg-white/[0.05] transition-colors">
                <div className="w-12 h-12 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Call us</p>
                  <p className="text-white/50 text-sm">+1 (555) 123-4567 • Mon-Fri 9am-6pm PT</p>
                </div>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex items-center gap-5 hover:bg-white/[0.05] transition-colors">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">HQ Office</p>
                  <p className="text-white/50 text-sm">San Francisco, CA</p>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-bold mb-6">Frequently Asked Questions</h3>
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                  <button 
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="font-medium pr-4">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-white/50 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq === idx && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: "auto", opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 pt-1 text-white/60 text-sm leading-relaxed border-t border-white/5">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map Visual */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative h-64 md:h-80 rounded-[2rem] bg-gradient-to-br from-[#0a0f1a] to-[#130b20] border border-white/[0.06] overflow-hidden flex items-center justify-center group">
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06070A] via-transparent to-transparent" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative">
                <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                  <MapPin className="text-white w-6 h-6" />
                </div>
                <div className="absolute top-0 left-0 w-full h-full bg-indigo-500 rounded-full animate-ping opacity-40" />
              </div>
              <div className="mt-4 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-sm font-medium">
                San Francisco, CA
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
