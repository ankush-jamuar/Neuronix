"use client";

import React from "react";
import { 
  FileText, Image as ImageIcon, Search, 
  Layers, Zap, Cpu, Sparkles, ArrowRight,
  Shield, Database, Fingerprint
} from "lucide-react";

export default function DocumentsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a] relative custom-scrollbar">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto p-8 md:p-12 space-y-16 relative z-10">
        
        {/* Header Section */}
        <header className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
            <Fingerprint className="w-3 h-3" />
            Secure Multimodal Vault
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            Multimodal <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">Memory Workspace</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            Your second brain is evolving. Soon, you'll be able to ingest PDFs, research papers, and handwritten notes directly into your semantic memory.
          </p>
        </header>

        {/* Workspace Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Active Ingestion Preview Card */}
          <div className="group relative overflow-hidden rounded-[32px] border border-white/5 bg-[#0f0f11]/50 backdrop-blur-xl p-8 transition-all hover:border-indigo-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Semantic OCR Ingestion</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Extract deep meaning from static documents. Our AI doesn't just read text; it understands context, hierarchy, and references.
                </p>
              </div>

              {/* Simulated Progress / Activity */}
              <div className="space-y-3 pt-4">
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[65%] animate-pulse" />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-600 uppercase tracking-tighter">
                  <span>Analyzing Structure</span>
                  <span>65% Complete</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Memory Card */}
          <div className="group relative overflow-hidden rounded-[32px] border border-white/5 bg-[#0f0f11]/50 backdrop-blur-xl p-8 transition-all hover:border-sky-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-500/10">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Visual Knowledge</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Snap a photo of your whiteboard, napkins, or book pages. We convert visual data into searchable, structured knowledge chunks.
                </p>
              </div>
              
              <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-full h-12 rounded-xl bg-white/5 border border-white/5 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Future Capabilities Section */}
        <section className="pt-8">
          <h2 className="text-sm font-bold text-slate-600 uppercase tracking-[0.2em] mb-10">Architectural Foundations</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <CapabilityItem 
              icon={<Shield className="w-4 h-4" />}
              title="End-to-End Encryption"
              description="Your documents are encrypted at rest and in transit. Only you hold the keys."
            />
            <CapabilityItem 
              icon={<Database className="w-4 h-4" />}
              title="Vectorized Storage"
              description="Every page is automatically chunked and embedded for instant AI retrieval."
            />
            <CapabilityItem 
              icon={<Cpu className="w-4 h-4" />}
              title="Edge Processing"
              description="Local OCR ensures your sensitive data never leaves your device's reach unnecessarily."
            />
          </div>
        </section>

        {/* Call to Action Overlay */}
        <div className="relative rounded-[40px] overflow-hidden border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-12 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent)] pointer-events-none" />
          <div className="relative max-w-lg mx-auto space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white">Ready to start building?</h2>
            <p className="text-slate-400 text-sm">
              While we finalize the multimodal engine, your text vault is fully operational. Start capturing your thoughts now.
            </p>
            <button 
              onClick={() => window.location.href = '/dashboard/notes'}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-full transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
            >
              Go to Notes
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function CapabilityItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] space-y-3">
      <div className="text-indigo-400">{icon}</div>
      <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}
