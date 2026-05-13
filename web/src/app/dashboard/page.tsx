"use client";

import React, { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { 
  Plus, Search, MessageSquare, BookOpen, 
  Sparkles, Zap, Brain, ArrowRight, 
  Clock, Star, ChevronRight, Activity,
  Command, LayoutGrid, Cpu
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  updatedAt: string;
  textContent: string;
}

interface AnalyticsSummary {
  totalMemories: number;
  activeMemories: number;
}

export default function DashboardPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth();
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const token = await getToken();
        
        // Fetch notes and analytics in parallel
        const [notesRes, statsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/notes`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/analytics/memory-health`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (notesRes.ok) {
          const notes = await notesRes.json();
          setRecentNotes(notes.slice(0, 4));
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.summary);
        }

      } catch (err) {
        console.error("Dashboard data fetch failed:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (userLoaded && user) {
      fetchDashboardData();
    }
  }, [userLoaded, user, getToken]);

  if (!userLoaded || !user) return null;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a] relative custom-scrollbar">
      {/* Background Ambient Depth */}
      <div className="absolute top-0 left-1/4 w-[60%] h-[40%] bg-indigo-600/[0.03] blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[40%] h-[40%] bg-sky-600/[0.02] blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-12 relative z-10">
        
        {/* Workspace Greeting Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              <Cpu className="w-3 h-3 text-indigo-400" />
              OS Interface v3.1.0
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              Good {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-indigo-500">{user.firstName || 'Researcher'}</span>.
            </h1>
            <p className="text-slate-500 text-lg max-w-xl leading-relaxed">
              Your cognitive workspace is synced. {stats ? `${stats.totalMemories} knowledge chunks are currently active in your semantic memory.` : 'Initializing neural links...'}
            </p>
          </div>

          <div className="flex items-center gap-3">
             <Link 
              href="/dashboard/notes"
              className="flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-2xl hover:bg-slate-200 transition-all shadow-xl active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New Thought
            </Link>
            <button 
              className="p-3 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-white/10 transition-all"
              title="Search Knowledge"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Quick AI Command Center */}
          <div className="md:col-span-2 group relative overflow-hidden rounded-[32px] border border-white/5 bg-[#0f0f11]/60 backdrop-blur-xl p-8 transition-all hover:border-indigo-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Command className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">AI Control Plane</h2>
                </div>
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                  Keyboard: ⌘K
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ActionCard 
                  icon={<Sparkles className="w-4 h-4" />}
                  title="Synthesize Research"
                  desc="Merge multiple notes into a coherent summary."
                  href="/dashboard/chat"
                  color="indigo"
                />
                <ActionCard 
                  icon={<Search className="w-4 h-4" />}
                  title="Semantic Search"
                  desc="Find ideas based on meaning, not just keywords."
                  href="/dashboard/chat"
                  color="sky"
                />
              </div>
            </div>
          </div>

          {/* Memory Health Widget */}
          <div className="group relative overflow-hidden rounded-[32px] border border-white/5 bg-[#0f0f11]/60 backdrop-blur-xl p-8 transition-all hover:border-emerald-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Brain className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Cognitive State</h2>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-white tracking-tighter">
                    {stats ? Math.round((stats.activeMemories / (stats.totalMemories || 1)) * 100) : '--'}%
                  </div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Resonance Frequency</p>
                </div>
              </div>

              <div className="pt-6">
                <Link href="/dashboard/memory-analytics" className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 hover:gap-2 transition-all">
                  View Intelligence
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Content Explorer Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Recent Synapses (Notes) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Recent Synapses</h3>
              </div>
              <Link href="/dashboard/notes" className="text-xs text-slate-600 hover:text-white transition-colors">View All</Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isLoading ? (
                [1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-[24px] bg-white/[0.02] border border-white/5 animate-pulse" />)
              ) : recentNotes.length > 0 ? (
                recentNotes.map(note => (
                  <Link key={note.id} href={`/dashboard/notes?id=${note.id}`} className="group p-5 rounded-[24px] border border-white/5 bg-[#0f0f11]/30 hover:bg-white/[0.03] hover:border-white/10 transition-all">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-700">{new Date(note.updatedAt).toLocaleDateString()}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-800 group-hover:text-slate-400 transition-all" />
                      </div>
                      <h4 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors truncate">{note.title || 'Untitled Thought'}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{note.textContent || 'No additional context...'}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-2 py-12 text-center rounded-[32px] border border-dashed border-white/5 bg-white/[0.01]">
                   <p className="text-sm text-slate-600 italic">Your vault is empty. Start recording your thoughts.</p>
                </div>
              )}
            </div>
          </div>

          {/* System Status / Quick Stats */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <Activity className="w-5 h-5 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Operational Pulse</h3>
            </div>

            <div className="rounded-[32px] border border-white/5 bg-[#0f0f11]/30 p-6 space-y-6">
              <StatusRow label="Neural Engine" status="Online" color="emerald" />
              <StatusRow label="Vector Index" status="Synced" color="emerald" />
              <StatusRow label="Semantic Memory" status="Optimized" color="sky" />
              
              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Focus</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <p className="text-xs text-slate-400 italic leading-relaxed">
                    "AI systems should be extensions of human thought, not replacements for them."
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function ActionCard({ icon, title, desc, href, color }: { icon: React.ReactNode; title: string; desc: string; href: string; color: string }) {
  const colors: Record<string, string> = {
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20 shadow-indigo-500/10 hover:border-indigo-500/40",
    sky: "text-sky-400 bg-sky-500/10 border-sky-500/20 shadow-sky-500/10 hover:border-sky-500/40",
  };

  return (
    <Link href={href} className={`flex items-start gap-4 p-5 rounded-2xl border transition-all ${colors[color]}`}>
      <div className="mt-1">{icon}</div>
      <div>
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{desc}</p>
      </div>
    </Link>
  );
}

function StatusRow({ label, status, color }: { label: string; status: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    sky: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${colors[color]}`}>
        {status}
      </span>
    </div>
  );
}
