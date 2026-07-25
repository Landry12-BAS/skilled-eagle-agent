"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MessageSquare, Code2, FileSearch, ImagePlus, Mic, Search, BarChart3, Workflow, LineChart, Check, Plug, Settings, Rocket } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";

const services = [
  { title: "AI Chatbots & Assistants", desc: "Build custom conversational AI for 24/7 customer support, lead qualification, and internal knowledge bases.", image: "/marketing/ai-chatbot.jpg", icon: <MessageSquare className="w-5 h-5" /> },
  { title: "Code Generation & Review", desc: "AI-powered code writing, debugging, and refactoring across 50+ programming languages.", image: "/marketing/ai-code-gen.jpg", icon: <Code2 className="w-5 h-5" /> },
  { title: "Document Intelligence", desc: "Extract, summarize, and analyze documents at scale with intelligent OCR and NLP.", image: "/marketing/ai-doc-analysis.jpg", icon: <FileSearch className="w-5 h-5" /> },
  { title: "Image & Video Generation", desc: "Create stunning visuals, marketing assets, and video content from text prompts.", image: "/marketing/ai-image-gen.jpg", icon: <ImagePlus className="w-5 h-5" /> },
  { title: "Voice AI & Speech", desc: "Text-to-speech, real-time transcription, voice cloning, and multilingual audio processing.", image: "/marketing/ai-voice.jpg", icon: <Mic className="w-5 h-5" /> },
  { title: "RAG & Knowledge Search", desc: "Semantic search over your proprietary data with retrieval-augmented generation.", image: "/marketing/ai-rag-search.jpg", icon: <Search className="w-5 h-5" /> },
  { title: "AI Model Comparison", desc: "Benchmark and compare LLMs side-by-side to find the optimal model for your use case.", image: "/marketing/ai-comparison.jpg", icon: <BarChart3 className="w-5 h-5" /> },
  { title: "Workflow Automation", desc: "AI-powered business process automation with intelligent triggers and actions.", image: "/marketing/ai-workflow.jpg", icon: <Workflow className="w-5 h-5" /> },
  { title: "Data Analytics & Insights", desc: "Predictive analytics, anomaly detection, and AI-driven data visualization.", image: "/marketing/ai-analytics.jpg", icon: <LineChart className="w-5 h-5" /> },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#06070A] text-white overflow-hidden selection:bg-indigo-500/30">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 px-6 md:px-12 max-w-7xl mx-auto text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6 relative z-10"
          >
            AI Services That Scale With You
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto relative z-10"
          >
            From intelligent chatbots to predictive analytics, our suite of AI services empowers businesses to automate, innovate, and grow.
          </motion.p>
        </section>

        {/* Services Grid */}
        <section className="py-16 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, idx) => (
              <motion.div 
                key={idx}
                whileInView={{ opacity: 1, y: 0 }} 
                initial={{ opacity: 0, y: 30 }} 
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image src={service.image} alt={service.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06070A] to-transparent" />
                </div>
                <div className="p-6">
                  <div className="inline-flex p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 mb-4">{service.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-4">{service.desc}</p>
                  <span className="text-indigo-400 text-sm font-medium group-hover:text-indigo-300 cursor-pointer">Learn more →</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 px-6 md:px-12 bg-white/[0.01] border-y border-white/5">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-16">How It Works</h2>
            <div className="flex flex-col md:flex-row items-start justify-between relative gap-12 md:gap-4">
              <div className="hidden md:block absolute top-8 left-[10%] right-[10%] border-t border-dashed border-white/20 -z-10" />
              
              <div className="flex-1 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-[#06070A] border border-white/10 flex items-center justify-center mb-6 text-indigo-400">
                  <Plug className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3">1. Connect</h3>
                <p className="text-white/50 text-sm max-w-xs">Integrate with your existing tools and data sources in minutes via our simple API.</p>
              </div>
              
              <div className="flex-1 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-[#06070A] border border-white/10 flex items-center justify-center mb-6 text-violet-400">
                  <Settings className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3">2. Configure</h3>
                <p className="text-white/50 text-sm max-w-xs">Choose your AI models, customize behaviors, and set safety guardrails.</p>
              </div>
              
              <div className="flex-1 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-[#06070A] border border-white/10 flex items-center justify-center mb-6 text-emerald-400">
                  <Rocket className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3">3. Deploy</h3>
                <p className="text-white/50 text-sm max-w-xs">Go live with enterprise-grade reliability, SOC2 compliance, and 99.9% uptime.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-white/60">Start for free, scale when you need to.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8">
              <h3 className="text-xl font-medium text-white/80 mb-2">Starter</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">$29</span><span className="text-white/50">/mo</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['10K API calls/month', '3 base AI models', 'Community support', 'Standard latency'].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/70"><Check className="w-4 h-4 text-emerald-400" />{f}</li>
                ))}
              </ul>
              <button className="w-full py-3 rounded-xl border border-white/20 hover:bg-white/5 transition-colors font-medium">Get Started</button>
            </div>
            
            {/* Pro */}
            <div className="bg-gradient-to-b from-indigo-900/20 to-transparent border border-indigo-500/50 rounded-3xl p-8 relative transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Most Popular</div>
              <h3 className="text-xl font-medium text-white mb-2">Pro</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">$99</span><span className="text-white/50">/mo</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['100K API calls/month', 'All premium AI models', 'Priority email support', 'Custom workflows', 'Low latency access'].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/90"><Check className="w-4 h-4 text-indigo-400" />{f}</li>
                ))}
              </ul>
              <button className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition-colors font-medium text-white shadow-lg shadow-indigo-500/25">Upgrade to Pro</button>
            </div>
            
            {/* Enterprise */}
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8">
              <h3 className="text-xl font-medium text-white/80 mb-2">Enterprise</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">Custom</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['Unlimited API calls', 'Custom model fine-tuning', 'Dedicated Slack channel', 'SLA & 99.9% uptime', 'SSO & Advanced Auth'].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/70"><Check className="w-4 h-4 text-emerald-400" />{f}</li>
                ))}
              </ul>
              <button className="w-full py-3 rounded-xl border border-white/20 hover:bg-white/5 transition-colors font-medium">Contact Sales</button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
