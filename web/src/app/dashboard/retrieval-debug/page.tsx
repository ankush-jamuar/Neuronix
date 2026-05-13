"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL } from "@/lib/api-config";
import {
  Search, Loader2, ChevronDown, ChevronRight,
  Zap, Database, Hash, BarChart2, Clock, AlertTriangle, CheckCircle2
} from "lucide-react";

interface TraceData {
  originalQuery: string;
  normalizedQuery: string;
  detectedIntent: string;
  confidenceScore: number;
  extractedMetadata: {
    technologies: string[];
    folders: string[];
    topics: string[];
    dateRange?: any;
    noteReferences?: string[];
  };
  prismaFilters: any;
  candidateCounts: {
    prismaCandidates: number;
    semanticMatches: number;
    keywordMatches: number;
    finalChunks: number;
  };
  rankingBreakdown: {
    chunkId: string;
    semanticScore: number;
    keywordScore: number;
    recencyBoost: number;
    importanceScore: number;
    reinforcementScore: number;
    finalScore: number;
    contributingSignals: string[];
    retrievalCount?: number;
    lastAccessedAt?: string | null;
    isPinned?: boolean;
  }[];
  selectedChunks: {
    chunkId: string;
    noteId: string;
    score: number;
    preview: string;
  }[];
  droppedChunks: { chunkId: string; reason: string }[];
  tokenMetrics: {
    estimatedTokens: number;
    droppedTokenCount: number;
    contextCharacterCount: number;
  };
  latencyMetrics: {
    queryAnalysisMs: number;
    prismaFilteringMs: number;
    vectorSearchMs: number;
    rankingMs: number;
    contextAssemblyMs: number;
    totalMs: number;
  };
  anomalies: string[];
}

interface DebugResult {
  success: boolean;
  trace: TraceData;
  chunksRetrieved: number;
  contextLength: number;
  contextPreview: string;
}

function Pill({ children, color = "slate" }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    slate: "bg-slate-800 text-slate-300 border-slate-700",
    indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-500/25",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    sky: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${colors[color] ?? colors.slate}`}>
      {children}
    </span>
  );
}

function Section({ title, icon, children, defaultOpen = true }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/5 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left"
      >
        <div className="flex items-center gap-2.5 text-sm font-medium text-slate-300">
          <span className="text-slate-500">{icon}</span>
          {title}
        </div>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-slate-600" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
      </button>
      {open && <div className="px-4 pb-4 pt-3">{children}</div>}
    </div>
  );
}

function LatencyBar({ label, ms, maxMs }: { label: string; ms: number; maxMs: number }) {
  const pct = Math.min((ms / maxMs) * 100, 100);
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-36 text-slate-500 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500/50 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-14 text-right text-slate-400 font-mono">{ms}ms</span>
    </div>
  );
}

export default function RetrievalDebugPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DebugResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const handleDebug = async () => {
    const q = query.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = await getToken({ template: "default" });
      const res = await fetch(`${API_BASE_URL}/debug-retrieval`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: q }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Debug request failed");
      setResult(data);
    } catch (err: any) {
      setError(err?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const trace = result?.trace;
  const totalMs = trace?.latencyMetrics.totalMs ?? 1;

  return (
    <div className="h-full overflow-y-auto bg-[#0d0d0f] px-6 py-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <h2 className="text-base font-semibold text-slate-200">Retrieval Debug Panel</h2>
            <Pill color="amber">Dev Only</Pill>
          </div>
          <p className="text-xs text-slate-600 ml-9">
            Inspect the full RAG pipeline: query analysis → pgvector search → hybrid ranking → context assembly
          </p>
        </div>

        {/* Query Input */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleDebug()}
              placeholder="Enter a query to trace through the retrieval pipeline…"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/15 transition-all"
            />
          </div>
          <button
            onClick={handleDebug}
            disabled={!query.trim() || loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {loading ? "Tracing…" : "Run Trace"}
          </button>
        </div>

        {/* Quick suggestions */}
        {!result && !loading && (
          <div className="flex flex-wrap gap-2">
            {["What notes do I have about AI?", "Summarize my retrieval architecture", "Find notes about Docker", "pgvector setup"].map(s => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="text-xs text-slate-500 bg-white/[0.03] border border-white/5 rounded-lg px-3 py-1.5 hover:bg-white/[0.06] hover:text-slate-300 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/5 border border-red-500/15 rounded-xl text-sm text-red-400">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Results */}
        {result && trace && (
          <div className="space-y-4">

            {/* Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Candidates", value: trace.candidateCounts.prismaCandidates, icon: <Database className="w-3.5 h-3.5" />, color: "text-sky-400" },
                { label: "Vector Matches", value: trace.candidateCounts.semanticMatches, icon: <BarChart2 className="w-3.5 h-3.5" />, color: "text-indigo-400" },
                { label: "Final Chunks", value: trace.candidateCounts.finalChunks, icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-emerald-400" },
                { label: "Total Latency", value: `${totalMs}ms`, icon: <Clock className="w-3.5 h-3.5" />, color: "text-amber-400" },
              ].map(stat => (
                <div key={stat.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                  <div className={`flex items-center gap-1.5 text-xs mb-1.5 ${stat.color}`}>
                    {stat.icon}
                    <span className="text-slate-500">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-semibold text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Anomalies */}
            {trace.anomalies?.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                <span className="text-xs text-amber-400 font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Anomalies detected:
                </span>
                {trace.anomalies.map(a => <Pill key={a} color="amber">{a}</Pill>)}
              </div>
            )}

            {/* Query Analysis */}
            <Section title="Query Analysis" icon={<Search className="w-3.5 h-3.5" />}>
              <div className="space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-slate-600 mb-1">Original Query</p>
                    <p className="text-slate-300 font-mono bg-white/5 px-2 py-1.5 rounded">{trace.originalQuery}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Normalized Query</p>
                    <p className="text-slate-300 font-mono bg-white/5 px-2 py-1.5 rounded">{trace.normalizedQuery}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-slate-600">Intent:</span>
                  <Pill color="indigo">{trace.detectedIntent}</Pill>
                  <span className="text-slate-600">Confidence:</span>
                  <Pill color={trace.confidenceScore > 0.7 ? "emerald" : "amber"}>
                    {(trace.confidenceScore * 100).toFixed(0)}%
                  </Pill>
                </div>
                {(trace.extractedMetadata.technologies?.length > 0 || trace.extractedMetadata.topics?.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {trace.extractedMetadata.technologies?.map(t => <Pill key={t} color="sky">tech: {t}</Pill>)}
                    {trace.extractedMetadata.topics?.map(t => <Pill key={t} color="slate">topic: {t}</Pill>)}
                    {trace.extractedMetadata.folders?.map(f => <Pill key={f} color="indigo">folder: {f}</Pill>)}
                  </div>
                )}
              </div>
            </Section>

            {/* Latency Breakdown */}
            <Section title="Latency Breakdown" icon={<Clock className="w-3.5 h-3.5" />}>
              <div className="space-y-2.5">
                <LatencyBar label="Query Analysis" ms={trace.latencyMetrics.queryAnalysisMs} maxMs={totalMs} />
                <LatencyBar label="Prisma Filtering" ms={trace.latencyMetrics.prismaFilteringMs} maxMs={totalMs} />
                <LatencyBar label="Vector Search" ms={trace.latencyMetrics.vectorSearchMs} maxMs={totalMs} />
                <LatencyBar label="Ranking" ms={trace.latencyMetrics.rankingMs} maxMs={totalMs} />
                <LatencyBar label="Context Assembly" ms={trace.latencyMetrics.contextAssemblyMs} maxMs={totalMs} />
                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs text-slate-400 font-medium">
                  <span>Total</span>
                  <span className="font-mono">{totalMs}ms</span>
                </div>
              </div>
            </Section>

            {/* Ranking Breakdown */}
            {trace.rankingBreakdown?.length > 0 && (
              <Section title={`Ranking Breakdown (${trace.rankingBreakdown.length} chunks)`} icon={<BarChart2 className="w-3.5 h-3.5" />}>
                <div className="space-y-2">
                  {trace.rankingBreakdown.map((c, i) => (
                    <div key={c.chunkId} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500 font-mono">#{i + 1} · {c.chunkId.slice(0, 12)}…</span>
                        <div className="flex items-center gap-2">
                          {c.contributingSignals.map(s => <Pill key={s} color="indigo">{s}</Pill>)}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                        <div>
                          <p className="text-slate-600 mb-0.5">Semantic</p>
                          <p className="text-indigo-400 font-mono font-medium">{(c.semanticScore * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-slate-600 mb-0.5">Keyword</p>
                          <p className="text-sky-400 font-mono font-medium">{c.keywordScore.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 mb-0.5">Recency</p>
                          <p className="text-amber-400 font-mono font-medium">{(c.recencyBoost * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-slate-600 mb-0.5">Reinforce</p>
                          <p className="text-violet-400 font-mono font-medium">{(c.reinforcementScore * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-slate-600 mb-0.5">Importance</p>
                          <p className="text-rose-400 font-mono font-medium">{(c.importanceScore * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-slate-600 mb-0.5">Final Score</p>
                          <p className="text-emerald-400 font-mono font-medium">{(c.finalScore * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Selected Chunks */}
            {trace.selectedChunks?.length > 0 && (
              <Section title={`Selected Chunks (${trace.selectedChunks.length} in context)`} icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                <div className="space-y-2">
                  {trace.selectedChunks.map((c, i) => (
                    <div key={c.chunkId} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-500 font-mono">#{i + 1} · chunk {c.chunkId.slice(0, 8)}…</span>
                        <Pill color="emerald">score: {(c.score * 100).toFixed(1)}%</Pill>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed font-mono bg-black/20 p-2 rounded">{c.preview}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Dropped Chunks */}
            {trace.droppedChunks?.length > 0 && (
              <Section title={`Dropped Chunks (${trace.droppedChunks.length})`} icon={<Hash className="w-3.5 h-3.5" />} defaultOpen={false}>
                <div className="space-y-1.5">
                  {trace.droppedChunks.map(c => (
                    <div key={c.chunkId} className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-600">{c.chunkId.slice(0, 12)}…</span>
                      <Pill color="red">{c.reason}</Pill>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Token Metrics */}
            <Section title="Token Metrics" icon={<Hash className="w-3.5 h-3.5" />} defaultOpen={false}>
              <div className="grid grid-cols-3 gap-3 text-xs">
                {[
                  { label: "Est. Tokens", value: trace.tokenMetrics.estimatedTokens },
                  { label: "Dropped Tokens", value: trace.tokenMetrics.droppedTokenCount },
                  { label: "Context Chars", value: trace.tokenMetrics.contextCharacterCount },
                ].map(m => (
                  <div key={m.label} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                    <p className="text-slate-600 mb-1">{m.label}</p>
                    <p className="text-slate-200 font-mono font-medium">{m.value.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Context Preview */}
            {result.contextPreview && (
              <Section title="Assembled Context Preview" icon={<Database className="w-3.5 h-3.5" />} defaultOpen={false}>
                <pre className="text-xs text-slate-400 font-mono leading-relaxed whitespace-pre-wrap bg-black/20 rounded-lg p-3 max-h-64 overflow-y-auto">
                  {result.contextPreview}
                  {result.contextLength > 500 && <span className="text-slate-700">{"\n\n… "}{result.contextLength - 500} more chars</span>}
                </pre>
              </Section>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
