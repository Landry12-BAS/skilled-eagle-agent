"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { Bot, ArrowRight, Zap, Shield, Database, Users, LineChart, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const navVariants: Variants = {
  hidden: { y: -50, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const fadeUpVariants: Variants = {
  hidden: { y: 40, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

export default function LandingPage() {
  const bentoFeatures = [
    {
      title: "AI Integrations",
      description: "Plug into OpenAI, Anthropic, and Local LLMs seamlessly.",
      icon: <Bot className="w-6 h-6 text-purple-500" />,
      className: "col-span-1 md:col-span-2 row-span-1 bg-gradient-to-br from-black/5 to-purple-500/10",
    },
    {
      title: "Real-time Chat",
      description: "WebSocket streaming for lightning-fast AI responses.",
      icon: <Zap className="w-6 h-6 text-blue-500" />,
      className: "col-span-1 row-span-1 bg-black/[0.02]",
    },
    {
      title: "Client Management",
      description: "Built-in CRM to manage your users and their data securely.",
      icon: <Users className="w-6 h-6 text-green-500" />,
      className: "col-span-1 row-span-2 bg-black/[0.02]",
    },
    {
      title: "Django Backend",
      description: "Rock-solid Postgres database with Django REST Framework.",
      icon: <Database className="w-6 h-6 text-orange-500" />,
      className: "col-span-1 md:col-span-2 row-span-1 bg-black/[0.02]",
    },
  ];
  return (
    <div className="min-h-screen bg-white text-black overflow-hidden selection:bg-purple-500/30">
      
      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 inset-x-0 h-screen overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[40%] -left-[10%] w-[70%] h-[70%] rounded-full bg-purple-400/20 blur-[120px]" />
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-blue-400/20 blur-[120px]" />
      </div>

      {/* Floating Navbar */}
      <motion.nav 
        variants={navVariants}
        initial="hidden"
        animate="visible"
        className="fixed top-0 inset-x-0 w-full z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-white/70 backdrop-blur-md border-b border-black/10 shadow-sm"
      >
        <div className="flex items-center gap-2 font-bold text-lg md:text-xl tracking-tight">
          <Image src="/logo.png" alt="Skilled Eagle Logo" width={32} height={32} className="object-contain" />
          <span className="hidden sm:inline-block">Skilled Eagle</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-black/70 transition-colors hidden sm:block">
            Sign In
          </Link>
          <Link href="/register">
            <Button className="rounded-xl px-4 sm:px-6 text-sm sm:text-base">Get Started</Button>
          </Link>
        </div>
      </motion.nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-40 pb-20 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-4xl space-y-8"
          >
            <motion.div variants={fadeUpVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 border border-black/10 text-sm font-medium text-black/70">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              v2.0 is now live
            </motion.div>
            
            <motion.h1 variants={fadeUpVariants} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              The production-ready <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                AI SaaS boilerplate
              </span>
            </motion.h1>
            
            <motion.p variants={fadeUpVariants} className="text-lg md:text-xl text-black/60 max-w-2xl mx-auto">
              Ship your AI startup in days, not months. Pre-configured with Django, Next.js, WebSockets, and a stunning UI library.
            </motion.p>
            
            <motion.div variants={fadeUpVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/register">
                <Button className="w-full sm:w-auto rounded-xl px-8 py-6 text-base gap-2 group">
                  Start Building Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full sm:w-auto rounded-xl px-8 py-6 text-base border-black/20 hover:bg-black/5">
                  View Demo Dashboard
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Hero Image Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 md:mt-20 w-full max-w-5xl rounded-[1.5rem] md:rounded-[2rem] p-1 md:p-2 bg-black/5 backdrop-blur-sm border border-black/10"
          >
            <div className="relative w-full aspect-square sm:aspect-video rounded-[1rem] md:rounded-[1.5rem] overflow-hidden bg-black shadow-2xl">
              <Image 
                src="/hero_asset.jpg" 
                alt="SaaS Platform Interface"
                fill
                className="object-cover opacity-90 hover:opacity-100 transition-opacity duration-700"
                priority
              />
              {/* Overlay Gradient for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </section>

        {/* Bento Grid Features */}
        <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="mb-16 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Everything you need to scale</h2>
            <p className="text-black/60">We've handled the boring parts of building a SaaS so you can focus on your core product.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[200px]">
            {bentoFeatures.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`relative overflow-hidden rounded-3xl p-8 border border-black/10 hover:border-black/20 transition-colors group ${feature.className}`}
              >
                <div className="mb-4 inline-flex p-3 rounded-2xl bg-white shadow-sm border border-black/5 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-black/60 text-sm leading-relaxed max-w-xs">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 md:px-12">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto bg-black rounded-[2rem] md:rounded-[3rem] p-8 sm:p-12 md:p-20 text-center relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-md bg-purple-500/20 blur-[100px] pointer-events-none" />
            
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-6 relative z-10">
              Ready to launch your platform?
            </h2>
            <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto relative z-10">
              Join hundreds of developers shipping products faster with Skilled Eagle.
            </p>
            <Link href="/register" className="relative z-10">
              <Button className="bg-white text-black hover:bg-white/90 rounded-xl px-8 py-6 text-lg font-medium">
                Create your account
              </Button>
            </Link>
          </motion.div>
        </section>

      </main>

      {/* Minimal Footer */}
      <footer className="py-8 border-t border-black/5 text-center text-black/40 text-sm">
        <p>© 2026 Skilled Eagle. All rights reserved.</p>
      </footer>
    </div>
  );
}
