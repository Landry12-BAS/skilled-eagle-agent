"use client";

import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 inset-x-0 w-full z-50 bg-[#06070A]/80 backdrop-blur-xl border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between h-20">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Skilled Eagle" width={32} height={32} className="object-contain" />
          <span className="font-bold text-xl tracking-tight text-white">Skilled Eagle</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-white ${pathname === link.href ? 'text-white' : 'text-white/50'}`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
            Get Started
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-white/70 hover:text-white p-2 -mr-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5 bg-[#06070A]"
          >
            <div className="flex flex-col px-6 py-6 gap-6">
              {links.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`text-base font-medium ${pathname === link.href ? 'text-white' : 'text-white/50'}`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="h-px bg-white/10 w-full my-2" />
              <div className="flex flex-col gap-4">
                <Link href="/login" onClick={() => setIsOpen(false)} className="text-base font-medium text-white/70">
                  Sign In
                </Link>
                <Link href="/register" onClick={() => setIsOpen(false)} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-3 rounded-xl text-center font-medium">
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
