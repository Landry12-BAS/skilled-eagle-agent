"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { ArrowRight, MessageSquare, Code2, FileSearch, ImagePlus } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";

const fadeUpVariants: Variants = {
  hidden: { y: 40, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

export default function LandingPage() {

  return (
    <div className="min-h-screen bg-[#06070A] text-white overflow-hidden selection:bg-indigo-500/30">
      <Navbar />

      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 inset-x-0 h-screen overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[40%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <main>
        {/* Hero Section */}
        <section className="relative pt-40 pb-20 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-4xl space-y-8">
            <motion.div variants={fadeUpVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-white/80">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Skilled Eagle v3.0 is live
            </motion.div>
            
            <motion.h1 variants={fadeUpVariants} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              Supercharge your business <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                with intelligent AI
              </span>
            </motion.h1>
            
            <motion.p variants={fadeUpVariants} className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto">
              From predictive analytics to intelligent chatbots, deploy enterprise-grade AI solutions in minutes. Scale seamlessly with our premium infrastructure.
            </motion.p>
            
            <motion.div variants={fadeUpVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/register">
                <button className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl px-8 py-4 text-base font-medium flex items-center justify-center gap-2 group hover:opacity-90 transition-opacity">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/services">
                <button className="w-full sm:w-auto rounded-xl px-8 py-4 text-base font-medium border border-white/10 hover:bg-white/5 transition-colors">
                  Explore Services
                </button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Hero Image Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 md:mt-24 w-full max-w-5xl rounded-[1.5rem] md:rounded-[2rem] p-1 md:p-2 bg-white/5 backdrop-blur-sm border border-white/10"
          >
            <div className="relative w-full aspect-square sm:aspect-video rounded-[1rem] md:rounded-[1.5rem] overflow-hidden bg-[#0A0D14] shadow-2xl">
              <Image src="/marketing/ai-dashboard-hero.jpg" alt="AI Dashboard Interface" fill className="object-cover" priority />
            </div>
          </motion.div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-y border-white/5 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div><div className="text-3xl md:text-4xl font-bold text-white mb-2">10M+</div><div className="text-white/50 text-sm">API Calls Daily</div></div>
            <div><div className="text-3xl md:text-4xl font-bold text-white mb-2">99.9%</div><div className="text-white/50 text-sm">Uptime SLA</div></div>
            <div><div className="text-3xl md:text-4xl font-bold text-white mb-2">500+</div><div className="text-white/50 text-sm">Enterprise Clients</div></div>
            <div><div className="text-3xl md:text-4xl font-bold text-white mb-2">50+</div><div className="text-white/50 text-sm">AI Models Supported</div></div>
          </div>
        </section>

        {/* AI Comparison Table preview */}
        <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Compare Top AI Models</h2>
            <p className="text-white/60">Benchmark performance, speed, and capabilities to find the right model for your specific use case.</p>
          </div>
          <div className="relative rounded-2xl border border-white/10 bg-[#0A0D14] overflow-hidden group">
            <Image src="/marketing/ai-comparison.jpg" alt="AI Model Comparison" width={1200} height={600} className="w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06070A] to-transparent pointer-events-none" />
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
              <Link href="/services">
                <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-white/20 transition-colors">
                  View Full Benchmarks
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Showcase */}
        <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto font-sans">
          <div className="mb-16 text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 font-sans">
              Everything you need to scale
            </h2>
            <p className="text-white/60 text-lg md:text-xl">
              A complete, production-ready ecosystem of AI tools designed for modern product teams. Seamlessly integrate state-of-the-art models into your workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
            {/* Multi-Model Chat (Large Span) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-[2rem] p-8 border border-indigo-500/30 hover:border-indigo-500/60 transition-colors group col-span-1 md:col-span-2 bg-gradient-to-br from-indigo-950/40 to-[#0A0D14]"
            >
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="inline-flex p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold font-sans">Multi-Model Chat</h3>
                </div>
                <p className="text-white/60 text-base max-w-md mb-auto leading-relaxed">
                  Route your prompts dynamically across GPT-4o, Claude 3.5, and Gemini 1.5. Our intelligent proxy selects the fastest and most cost-effective model for every query.
                </p>
                <div className="mt-8 flex items-center gap-2 text-sm text-indigo-300 font-medium group-hover:text-indigo-200 transition-colors cursor-pointer">
                  Explore chat documentation <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              {/* Visual Mockup inside card */}
              <div className="absolute right-0 bottom-0 w-[45%] h-[75%] rounded-tl-2xl bg-[#030408]/80 border-t border-l border-white/10 p-4 shadow-2xl flex flex-col gap-3 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-500">
                <div className="flex gap-2 items-center pb-2 border-b border-white/5">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
                <div className="bg-indigo-500/10 text-indigo-200 p-3 rounded-lg text-xs w-4/5 ml-auto">
                  Analyze our latest Q3 revenue data and project the Q4 growth.
                </div>
                <div className="bg-white/5 text-white/70 p-3 rounded-lg text-xs w-[90%]">
                  Based on the historical trend and Q3's 14% WoW growth, I project a...
                </div>
              </div>
            </motion.div>

            {/* Code Generation (Standard Span) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden rounded-[2rem] p-8 border border-white/10 hover:border-violet-500/40 transition-colors group col-span-1 bg-white/[0.02]"
            >
              <div className="relative z-10 flex flex-col h-full">
                <div className="inline-flex p-3 rounded-xl bg-violet-500/10 text-violet-400 mb-6 w-fit">
                  <Code2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-sans mb-3">Code Generation</h3>
                <p className="text-white/60 text-sm leading-relaxed mb-auto">
                  Autocomplete, refactor, and review code directly in your IDE with our trained coding models.
                </p>
                {/* Visual */}
                <div className="mt-6 font-mono text-[10px] text-white/40 bg-[#0A0D14] p-4 rounded-xl border border-white/5 group-hover:border-violet-500/20 transition-colors">
                  <span className="text-violet-400">async function</span> <span className="text-blue-300">fetchData</span>() {'{\n'}
                  {'  '}const res = await api.get(<span className="text-green-300">"/v1/users"</span>);{'\n'}
                  {'  '}<span className="text-white/80">return res.data;</span>{'\n'}
                  {'}'}
                </div>
              </div>
            </motion.div>

            {/* Document Analysis (Standard Span) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative overflow-hidden rounded-[2rem] p-8 border border-white/10 hover:border-cyan-500/40 transition-colors group col-span-1 bg-white/[0.02]"
            >
              <div className="relative z-10 flex flex-col h-full">
                <div className="inline-flex p-3 rounded-xl bg-cyan-500/10 text-cyan-400 mb-6 w-fit">
                  <FileSearch className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-sans mb-3">Document Intelligence</h3>
                <p className="text-white/60 text-sm leading-relaxed mb-auto">
                  Extract highly structured data from messy PDFs, receipts, and forms with zero configuration.
                </p>
                {/* Visual */}
                <div className="mt-6 flex flex-col gap-2">
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 w-[85%] rounded-full group-hover:w-full transition-all duration-1000" />
                  </div>
                  <div className="flex justify-between text-xs text-white/40">
                    <span>Processing invoice_009.pdf</span>
                    <span className="text-cyan-400">Extracting...</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Image Generation (Large Span) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="relative overflow-hidden rounded-[2rem] p-8 border border-white/10 hover:border-fuchsia-500/40 transition-colors group col-span-1 md:col-span-2 bg-gradient-to-tr from-[#0A0D14] to-[#140D1E]"
            >
              <div className="relative z-10 flex flex-col h-full max-w-[50%]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="inline-flex p-3 rounded-xl bg-fuchsia-500/10 text-fuchsia-400">
                    <ImagePlus className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold font-sans">Creative Image Gen</h3>
                </div>
                <p className="text-white/60 text-base leading-relaxed mb-auto">
                  Produce production-ready marketing assets, product mockups, and illustrations via our unified image generation API. Consistent styles guaranteed.
                </p>
                <div className="mt-8 flex items-center gap-2 text-sm text-fuchsia-300 font-medium group-hover:text-fuchsia-200 transition-colors cursor-pointer">
                  View prompt gallery <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              {/* Visual Mockup inside card */}
              <div className="absolute right-6 top-6 bottom-6 w-[40%] rounded-2xl overflow-hidden border border-white/10 group-hover:scale-105 transition-transform duration-500">
                <Image src="/marketing/ai-image-gen.jpg" alt="Generated Image Preview" fill className="object-cover" />
                <div className="absolute bottom-0 inset-x-0 p-4 bg-black/60 backdrop-blur-md">
                  <p className="text-[10px] text-white/80 line-clamp-2">
                    "A photorealistic rendering of a futuristic AI interface floating above a sleek desk, neon lighting..."
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 md:px-12">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto bg-gradient-to-br from-indigo-900/40 to-violet-900/40 border border-white/10 rounded-[2rem] md:rounded-[3rem] p-8 sm:p-12 md:p-20 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-md bg-indigo-500/20 blur-[100px] pointer-events-none" />
            
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-6 relative z-10">
              Ready to start your AI journey?
            </h2>
            <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto relative z-10">
              Join hundreds of forward-thinking companies building the future with Skilled Eagle.
            </p>
            <Link href="/register" className="relative z-10">
              <button className="bg-white text-black hover:bg-white/90 rounded-xl px-8 py-4 text-lg font-medium transition-colors">
                Create your account
              </button>
            </Link>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
