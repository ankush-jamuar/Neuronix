"use client";
import { useAuth } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import { 
  BarChart3, Brain, Zap, Clock, Star, Pin, 
  TrendingUp, Activity, AlertCircle, ChevronRight,
  Database, RefreshCcw
} from "lucide-react";
import { toast } from "sonner";

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

export default function MemoryAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
  async function fetchAnalytics() {
    try {
      const token = await getToken();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/memory-health`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const json = await res.json();
      setData(json);

    } catch (error) {
      console.error(error);
      toast.error("Could not load memory analytics");

    } finally {
      setIsLoading(false);
    }
  }

  fetchAnalytics();

}, [getToken]);

  if (isLoading) {
    return (
      <div className="flex-1 p-8 animate-pulse space-y-8">
        <div className="h-8 w-48 bg-white/5 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/10" />)}
        </div>
        <div className="h-64 bg-white/5 rounded-2xl border border-white/10" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-[#0a0a0a]">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Brain className="w-7 h-7 text-indigo-400" />
            Memory Intelligence Analytics
          </h1>
          <p className="text-slate-500 mt-1">Evolving your knowledge base into an adaptive reinforcement-aware engine.</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
          <Activity className="w-3 h-3 animate-pulse" />
          Real-time Intelligence Active
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Total Memories" 
          value={data.summary.totalMemories} 
          icon={<Database className="w-5 h-5 text-indigo-400" />}
          desc="Individual knowledge chunks"
        />
        <StatCard 
          label="Active Recall" 
          value={data.summary.activeMemories} 
          icon={<Zap className="w-5 h-5 text-amber-400" />}
          desc="Contributed to AI responses"
        />
        <StatCard 
          label="Priority Knowledge" 
          value={data.summary.pinnedCount} 
          icon={<Pin className="w-5 h-5 text-rose-400" />}
          desc="Pinned for long-term ranking"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hot Memories (Most Retrieved) */}
        <SectionCard title="Hot Knowledge Domains" icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}>
          <div className="space-y-4">
            {data.topRetrieved.map(note => (
              <NoteRow key={note.id} note={note} />
            ))}
            {data.topRetrieved.length === 0 && <EmptyState text="No active retrievals yet." />}
          </div>
        </SectionCard>

        {/* Pinned / Reinforcement */}
        <SectionCard title="Pinned Foundations" icon={<Star className="w-5 h-5 text-amber-400" />}>
          <div className="space-y-4">
            {data.pinned.map(note => (
              <NoteRow key={note.id} note={note} showPinned />
            ))}
            {data.pinned.length === 0 && <EmptyState text="No pinned notes found." />}
          </div>
        </SectionCard>
      </div>

      {/* Stale / Decaying Memories */}
      <SectionCard title="Stale & Decaying Memories" icon={<Clock className="w-5 h-5 text-slate-500" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.stale.map(note => (
            <div key={note.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{note.title || "Untitled"}</span>
                <span className="text-[10px] text-slate-600">Last accessed: {note.lastAccessedAt ? new Date(note.lastAccessedAt).toLocaleDateString() : 'Never'}</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-600" 
                    style={{ width: `${Math.max(10, note.decayedScore * 100)}%` }} 
                  />
                </div>
                <span className="text-[9px] font-mono text-slate-700 uppercase">Decay: {(note.decayedScore * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
          {data.stale.length === 0 && <div className="col-span-2 py-8 text-center text-slate-700 text-sm italic">All memories are currently fresh.</div>}
        </div>
      </SectionCard>
    </div>
  );
}

function StatCard({ label, value, icon, desc }: { label: string; value: number; icon: React.ReactNode; desc: string }) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
          <p className="text-[10px] text-slate-600 mt-2">{desc}</p>
        </div>
        <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
        {icon}
        <h2 className="text-lg font-semibold text-slate-200 tracking-tight">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function NoteRow({ note, showPinned }: { note: NoteAnalytics; showPinned?: boolean }) {
  const intensity = Math.min(100, (note.retrievalCount / 20) * 100);
  
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 font-bold text-xs">
          {note.retrievalCount}x
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{note.title || "Untitled"}</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] text-slate-600 flex items-center gap-1">
              <RefreshCcw className="w-2.5 h-2.5" />
              Reinforce: {(note.reinforcementScore * 100).toFixed(0)}%
            </span>
            {showPinned && note.isPinned && (
              <span className="text-[9px] bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded border border-rose-500/20 font-bold uppercase tracking-tighter">Pinned</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:block">
          <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500" 
              style={{ width: `${intensity}%` }} 
            />
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-colors" />
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-center gap-3 bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
      <AlertCircle className="w-6 h-6 text-slate-800" />
      <p className="text-sm text-slate-600 italic">{text}</p>
    </div>
  );
}
