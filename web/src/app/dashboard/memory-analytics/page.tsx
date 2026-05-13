"use client";

import { useAuth } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import { 
  Brain, Zap, Clock, Star, Pin, 
  TrendingUp, Activity, AlertCircle, ChevronRight,
  Database, RefreshCcw, Sparkles, Orbit
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api-config";

interface MemorySummary {
  totalMemories: number;
  activeMemories: number;
  pinnedCount: number;
}

interface NoteAnalytics {
  id: string;
  title: string;
  retrievalCount: number;
  reinforcementScore: number;
  isPinned: boolean;
  decayedScore: number;
  status: 'hot' | 'active' | 'stale';
  lastAccessedAt: string | null;
}

interface AnalyticsData {
  topRetrieved: NoteAnalytics[];
  pinned: NoteAnalytics[];
  stale: NoteAnalytics[];
  summary: MemorySummary;
}

export default function MemoryIntelligencePage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, isSignedIn, getToken } = useAuth();

  useEffect(() => {
    async function fetchIntelligence() {
      try {
        const token = await getToken();

        const res = await fetch(
          `${API_BASE_URL}/analytics/memory-health`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          if (res.status === 401) {
            setError("UNAUTHORIZED");
            return;
          }
          throw new Error("FAILED_TO_FETCH");
        }

        const json = await res.json();
        setData(json);
        setError(null);

      } catch (err: any) {
        console.error("[MemoryIntelligence] Sync Error:", err);
        setError(err.message);
        toast.error("Cognitive sync failed. Re-authenticating intelligence layer...");
      } finally {
        setIsLoading(false);
      }
    }

    if (isLoaded && isSignedIn) {
      fetchIntelligence();
    } else if (isLoaded && !isSignedIn) {
      setIsLoading(false);
      setError("UNAUTHORIZED");
    }
  }, [isLoaded, isSignedIn, getToken]);

  if (isLoading) {
    return (
      <div className="flex-1 p-8 space-y-12 bg-[#0a0a0a]">
        <div className="h-12 w-64 bg-white/[0.03] rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/[0.02] rounded-[32px] border border-white/5 animate-pulse" />)}
        </div>
        <div className="h-96 bg-white/[0.01] rounded-[40px] border border-white/5 animate-pulse" />
      </div>
    );
  }

  if (error === "UNAUTHORIZED") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0a0a0a] text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
          <Shield className="w-10 h-10 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Identity Sync Failed</h2>
          <p className="text-slate-500 max-w-sm">Your session has expired or the intelligence layer could not verify your identity.</p>
        </div>
        <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-slate-200 transition-all">
          Retry Sync
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar space-y-16 bg-[#0a0a0a] relative">
      {/* Ambient background elements */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-indigo-500/[0.03] blur-[120px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <header className="relative flex flex-col md:flex-row md:items-end justify-between gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">
            <Orbit className="w-3 h-3 animate-spin-slow" />
            Neural Network Status: Active
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-4">
            Memory <span className="bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent italic">Intelligence</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl leading-relaxed">
            Monitoring the synaptic health of your second brain. These insights reflect how your knowledge is retrieved, reinforced, and organized over time.
          </p>
        </div>
      </header>

      {/* Intelligence Pulse Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        <MetricCard 
          label="Knowledge Chunks" 
          value={data.summary.totalMemories} 
          icon={<Database className="w-5 h-5" />}
          color="indigo"
          desc="Individual atomic memories"
        />
        <MetricCard 
          label="Active Recall" 
          value={data.summary.activeMemories} 
          icon={<Zap className="w-5 h-5" />}
          color="amber"
          desc="Memories actively serving AI"
        />
        <MetricCard 
          label="Priority Nodes" 
          value={data.summary.pinnedCount} 
          icon={<Pin className="w-5 h-5" />}
          color="rose"
          desc="Pinned cognitive anchors"
        />
      </div>

      {/* Main Insights Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Hot Memories - High Resonance */}
        <CognitiveSection title="High Resonance Knowledge" icon={<Sparkles className="w-5 h-5 text-indigo-400" />}>
          <div className="space-y-4">
            {data.topRetrieved.map(note => (
              <IntelligenceRow key={note.id} note={note} />
            ))}
            {data.topRetrieved.length === 0 && <EmptyIntelligence text="No high-resonance memories detected yet." />}
          </div>
        </CognitiveSection>

        {/* Pinned - Foundation Nodes */}
        <CognitiveSection title="Foundation Nodes" icon={<Star className="w-5 h-5 text-amber-400" />}>
          <div className="space-y-4">
            {data.pinned.map(note => (
              <IntelligenceRow key={note.id} note={note} showPinned />
            ))}
            {data.pinned.length === 0 && <EmptyIntelligence text="No foundation nodes established." />}
          </div>
        </CognitiveSection>

      </div>

      {/* Decay Monitoring */}
      <div className="relative group overflow-hidden rounded-[40px] border border-white/5 bg-[#0f0f11]/50 backdrop-blur-xl p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-500/[0.02] to-transparent" />
        <div className="relative space-y-8">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-slate-500" />
            <h2 className="text-xl font-semibold text-white">Synaptic Decay Monitor</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.stale.map(note => (
              <div key={note.id} className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group/row">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-300 group-hover/row:text-white transition-colors">{note.title || "Untitled Memory"}</span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    <Activity className="w-3 h-3" />
                    Last Recall: {note.lastAccessedAt ? new Date(note.lastAccessedAt).toLocaleDateString() : 'Initial Sync'}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500/40" 
                      style={{ width: `${Math.max(10, note.decayedScore * 100)}%` }} 
                    />
                  </div>
                  <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">Strength: {(note.decayedScore * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
            {data.stale.length === 0 && <div className="col-span-2 py-12 text-center text-slate-700 text-sm italic">All memories are currently maintaining high synaptic strength.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color, desc }: { label: string; value: number; icon: React.ReactNode; color: string; desc: string }) {
  const colors: Record<string, string> = {
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20 shadow-indigo-500/10",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-500/10",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-rose-500/10",
  };

  return (
    <div className="group relative overflow-hidden rounded-[32px] border border-white/5 bg-[#0f0f11] p-8 transition-all hover:border-white/10">
      <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/[0.01] rounded-full blur-3xl group-hover:bg-white/[0.03] transition-all" />
      <div className="relative space-y-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg transition-transform group-hover:scale-110 ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold text-white tracking-tighter">{value}</p>
          </div>
          <p className="text-[10px] text-slate-700 mt-2 font-medium">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function CognitiveSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-2">
        {icon}
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">{title}</h2>
      </div>
      <div className="rounded-[32px] border border-white/5 bg-[#0f0f11]/30 p-2">
        {children}
      </div>
    </div>
  );
}

function IntelligenceRow({ note, showPinned }: { note: NoteAnalytics; showPinned?: boolean }) {
  const intensity = Math.min(100, (note.retrievalCount / 20) * 100);
  
  return (
    <div className="flex items-center justify-between p-5 rounded-[24px] bg-transparent hover:bg-white/[0.02] transition-all group border border-transparent hover:border-white/5">
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/5 flex items-center justify-center border border-indigo-500/10 text-indigo-400/80 font-mono text-sm group-hover:scale-110 transition-transform">
          {note.retrievalCount}
        </div>
        <div className="space-y-1">
          <h3 className="text-[15px] font-medium text-slate-300 group-hover:text-white transition-colors">{note.title || "Untitled Memory"}</h3>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-600 flex items-center gap-1.5 uppercase tracking-tighter">
              <RefreshCcw className="w-2.5 h-2.5" />
              Resonance: {(note.reinforcementScore * 100).toFixed(0)}%
            </span>
            {showPinned && note.isPinned && (
              <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 font-bold uppercase tracking-widest">Foundation</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="hidden md:block">
          <div className="h-0.5 w-16 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-sky-500" 
              style={{ width: `${intensity}%` }} 
            />
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-800 group-hover:text-slate-400 transition-colors" />
      </div>
    </div>
  );
}

function EmptyIntelligence({ text }: { text: string }) {
  return (
    <div className="py-20 flex flex-col items-center justify-center text-center gap-4">
      <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-slate-800" />
      </div>
      <p className="text-sm text-slate-600 italic max-w-[200px] leading-relaxed">{text}</p>
    </div>
  );
}

function Shield(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  )
}
