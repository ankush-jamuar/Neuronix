"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Command as CommandIcon, FileText, 
  MessageSquare, Brain, Home, Zap, 
  ChevronRight, Sparkles
} from "lucide-react";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [toggle]);

  const navigate = (path: string) => {
    router.push(path);
    setIsOpen(false);
    setQuery("");
  };

  if (!isOpen) return null;

  const actions = [
    { id: "home", label: "Go to Dashboard", icon: <Home className="w-4 h-4" />, path: "/dashboard" },
    { id: "notes", label: "Open Notes Vault", icon: <FileText className="w-4 h-4" />, path: "/dashboard/notes" },
    { id: "ai", label: "Ask AI Assistant", icon: <MessageSquare className="w-4 h-4" />, path: "/dashboard/chat" },
    { id: "ai-new", label: "New AI Conversation", icon: <Plus className="w-4 h-4" />, path: "/dashboard/chat?new=true" },
    { id: "intelligence", label: "Memory Intelligence", icon: <Brain className="w-4 h-4" />, path: "/dashboard/memory-analytics" },
    { id: "documents", label: "Multimodal Workspace", icon: <Zap className="w-4 h-4" />, path: "/dashboard/documents" },
  ];

  const filteredActions = actions.filter((a) => 
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={() => setIsOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-2xl bg-[#0f0f11] border border-white/10 rounded-[28px] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-500" />
          <input 
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, notes, or AI actions..."
            className="flex-1 bg-transparent border-none text-white placeholder-slate-600 focus:outline-none focus:ring-0 text-[15px]"
          />
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Esc
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
          {filteredActions.length > 0 ? (
            <div className="space-y-1">
              <div className="px-3 py-2">
                 <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Quick Navigation</p>
              </div>
              {filteredActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => navigate(action.path)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/[0.04] group transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all">
                      {action.icon}
                    </div>
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{action.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-800 group-hover:text-slate-500 transition-all" />
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center gap-4">
               <div className="w-12 h-12 rounded-full bg-white/[0.02] flex items-center justify-center border border-white/5">
                 <Search className="w-6 h-6 text-slate-800" />
               </div>
               <p className="text-sm text-slate-600 italic">No matching commands found.</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-700 uppercase tracking-widest">
                <span className="px-1.5 py-0.5 rounded border border-white/5 bg-white/5">↑↓</span>
                Navigate
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-700 uppercase tracking-widest">
                <span className="px-1.5 py-0.5 rounded border border-white/5 bg-white/5">Enter</span>
                Select
              </div>
           </div>
           <div className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-400/50 uppercase tracking-[0.2em]">
              <Sparkles className="w-3 h-3" />
              Powered by Neuronix OS
           </div>
        </div>
      </div>
    </div>
  );
}
