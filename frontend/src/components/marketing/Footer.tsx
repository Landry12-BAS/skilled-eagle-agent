"use client";

import Link from 'next/link';
import { MessageCircle, Globe, Mail, MessageSquare } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#030408] relative">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold text-white tracking-tight mb-4">Skilled Eagle</h3>
            <p className="text-white/50 text-sm mb-6 max-w-sm">
              The production-ready AI SaaS platform that scales with your business. Ship your AI features in days, not months.
            </p>
            <form className="flex gap-2 max-w-sm" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors w-full"
                required
              />
              <button type="submit" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
                Subscribe
              </button>
            </form>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="flex flex-col gap-3">
              <li><Link href="#" className="text-white/50 hover:text-white text-sm transition-colors">About Us</Link></li>
              <li><Link href="#" className="text-white/50 hover:text-white text-sm transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-white/50 hover:text-white text-sm transition-colors">Press</Link></li>
              <li><Link href="/contact" className="text-white/50 hover:text-white text-sm transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="flex flex-col gap-3">
              <li><Link href="/services" className="text-white/50 hover:text-white text-sm transition-colors">AI Chatbots</Link></li>
              <li><Link href="/services" className="text-white/50 hover:text-white text-sm transition-colors">Code Generation</Link></li>
              <li><Link href="/services" className="text-white/50 hover:text-white text-sm transition-colors">Data Analytics</Link></li>
              <li><Link href="/services" className="text-white/50 hover:text-white text-sm transition-colors">Voice AI</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="flex flex-col gap-3">
              <li><Link href="/blog" className="text-white/50 hover:text-white text-sm transition-colors">Blog</Link></li>
              <li><Link href="#" className="text-white/50 hover:text-white text-sm transition-colors">Documentation</Link></li>
              <li><Link href="#" className="text-white/50 hover:text-white text-sm transition-colors">API Reference</Link></li>
              <li><Link href="#" className="text-white/50 hover:text-white text-sm transition-colors">Community</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/[0.06] gap-4">
          <p className="text-white/40 text-sm">© 2026 Skilled Eagle. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-white/40 hover:text-white transition-colors"><MessageCircle size={20} /></a>
            <a href="#" className="text-white/40 hover:text-white transition-colors"><Globe size={20} /></a>
            <a href="#" className="text-white/40 hover:text-white transition-colors"><Mail size={20} /></a>
            <a href="#" className="text-white/40 hover:text-white transition-colors"><MessageSquare size={20} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
