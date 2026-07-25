"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";

const categories = ["All", "AI Trends", "Tutorials", "Case Studies", "Product Updates"];

const posts = [
  { cat: "Tutorials", title: "Building a RAG Pipeline with Vector Databases", excerpt: "A step-by-step guide to implementing retrieval-augmented generation for your enterprise data...", author: "Alex Rivera", date: "Jul 12, 2026", time: "8 min read", image: "/marketing/blog-rag.jpg" },
  { cat: "Case Studies", title: "How FinTech Corp Reduced Support Costs by 60%", excerpt: "Discover how intelligent chatbots transformed customer service operations...", author: "Maria Santos", date: "Jul 10, 2026", time: "6 min read", image: "/marketing/ai-chatbot.jpg" },
  { cat: "AI Trends", title: "Multimodal AI: Beyond Text and Images", excerpt: "The convergence of text, image, audio, and video understanding in modern AI systems...", author: "Dr. James Park", date: "Jul 8, 2026", time: "10 min read", image: "/marketing/ai-image-gen.jpg" },
  { cat: "Product Updates", title: "Introducing Skilled Eagle v3.0", excerpt: "New features including workflow automation, enhanced RAG, and 15 new AI models...", author: "Skilled Eagle Team", date: "Jul 5, 2026", time: "4 min read", image: "/marketing/ai-dashboard-hero.jpg" },
  { cat: "Tutorials", title: "Fine-Tuning LLMs for Domain-Specific Tasks", excerpt: "Learn how to adapt foundation models to your industry's unique requirements...", author: "Priya Sharma", date: "Jul 3, 2026", time: "9 min read", image: "/marketing/ai-analytics.jpg" },
  { cat: "Case Studies", title: "AI-Powered Code Review at Scale", excerpt: "How engineering teams use AI to catch bugs, enforce standards, and ship faster...", author: "David Kim", date: "Jul 1, 2026", time: "7 min read", image: "/marketing/ai-code-gen.jpg" },
];

export default function BlogPage() {
  const [activeCat, setActiveCat] = useState("All");

  return (
    <div className="min-h-screen bg-[#06070A] text-white">
      <Navbar />

      <main className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">AI Insights & Updates</h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10">
            Stay ahead with the latest in artificial intelligence, machine learning, and practical AI implementation guides.
          </p>
          
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map(c => (
              <button 
                key={c}
                onClick={() => setActiveCat(c)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${activeCat === c ? 'bg-indigo-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Post */}
        <div className="grid md:grid-cols-2 gap-0 bg-white/[0.03] border border-white/[0.06] rounded-[2rem] overflow-hidden mb-16 group cursor-pointer hover:border-indigo-500/30 transition-colors">
          <div className="relative h-64 md:h-auto overflow-hidden">
            <Image src="/marketing/ai-blog-featured.jpg" alt="Featured" fill className="object-cover group-hover:scale-105 transition-transform duration-700" priority />
          </div>
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <span className="text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3 block">AI Trends</span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 group-hover:text-indigo-300 transition-colors">The State of AI in 2026: What Every Business Leader Needs to Know</h2>
            <p className="text-white/60 mb-8 text-lg">From multimodal models to autonomous agents, explore the transformative AI trends reshaping industries and what they mean for your organization's future.</p>
            <div className="flex items-center gap-3 text-white/40 text-sm font-medium">
              <span>Dr. Sarah Chen</span><span>•</span><span>Jul 15, 2026</span><span>•</span><span>12 min read</span>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {posts.map((post, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-indigo-500/20 transition-all cursor-pointer flex flex-col"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <Image src={post.image} alt={post.title} fill className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <span className="text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2 block">{post.cat}</span>
                <h3 className="text-xl font-bold mb-3 group-hover:text-indigo-300 transition-colors line-clamp-2">{post.title}</h3>
                <p className="text-white/50 text-sm mb-6 line-clamp-2 flex-1">{post.excerpt}</p>
                <div className="flex items-center justify-between text-white/40 text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span>{post.author}</span><span>•</span><span>{post.date}</span>
                  </div>
                  <span>{post.time}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="bg-gradient-to-br from-indigo-950/50 to-violet-950/50 border border-indigo-500/20 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-md bg-indigo-500/20 blur-[100px] pointer-events-none" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4 relative z-10">Never Miss an Update</h2>
          <p className="text-white/60 mb-8 max-w-md mx-auto relative z-10">Get the latest AI insights, product updates, and tutorials delivered to your inbox every week.</p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto relative z-10" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Enter your email address" 
              className="flex-1 bg-[#06070A]/50 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
            <button type="submit" className="bg-white text-black px-8 py-3.5 rounded-xl font-medium hover:bg-white/90 transition-colors">
              Subscribe
            </button>
          </form>
        </div>

      </main>

      <Footer />
    </div>
  );
}
