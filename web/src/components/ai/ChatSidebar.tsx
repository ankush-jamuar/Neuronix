"use client";

import React, { useEffect, useState } from "react";
import { 
  MessageSquare, Plus, Search, 
  Trash2, MessageCircle, Clock,
  LayoutGrid, History, Sparkles, Brain
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL } from "@/lib/api-config";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Session {
  id: string;
  title: string;
  updatedAt: string;
}

interface ChatSidebarProps {
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
}

export function ChatSidebar({ currentSessionId, onSelectSession, onNewChat }: ChatSidebarProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { getToken } = useAuth();

  const fetchSessions = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [getToken, currentSessionId]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation?")) return;

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/chat/sessions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSessions(sessions.filter(s => s.id !== id));
        toast.success("Conversation deleted");
        if (currentSessionId === id) {
          onNewChat();
        }
      }
    } catch (error) {
      toast.error("Failed to delete conversation");
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col relative z-20">
      {/* Premium Sidebar Header */}
      <div className="p-8 space-y-6 flex-shrink-0">
        <button 
          onClick={onNewChat}
          className="group w-full flex items-center justify-between px-6 py-4 bg-white text-black font-bold rounded-[22px] hover:bg-indigo-50 transition-all duration-300 shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95"
        >
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center transition-transform group-hover:rotate-90 duration-500">
                <Plus className="w-4 h-4 text-white" />
             </div>
             <span className="text-[13px] tracking-tight">Initialize Neural Chat</span>
          </div>
          <Sparkles className="w-4 h-4 text-black/20 group-hover:text-black/60 transition-colors" />
        </button>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cognitive history..."
            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-[12px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.05] transition-all"
          />
        </div>
      </div>

      {/* Sessions Navigator */}
      <div className="flex-1 overflow-y-auto custom-scrollbar-premium px-4 pb-8">
        <div className="px-4 mb-4 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-slate-500" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Memory History</p>
           </div>
           <div className="h-px flex-1 bg-white/5 ml-4" />
        </div>

        {isLoading ? (
          <div className="space-y-4 px-4 pt-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 rounded-[20px] bg-white/[0.02] border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredSessions.length > 0 ? (
          <div className="space-y-2">
            {filteredSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`w-full flex items-center justify-between p-4 rounded-[22px] transition-all duration-300 group relative overflow-hidden ${
                  currentSessionId === session.id 
                    ? "bg-indigo-500/10 border border-indigo-500/20 text-white shadow-lg" 
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 border border-transparent"
                }`}
              >
                {currentSessionId === session.id && (
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
                )}
                
                <div className="flex items-center gap-4 overflow-hidden relative z-10">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                    currentSessionId === session.id 
                      ? "bg-indigo-500 text-white" 
                      : "bg-white/5 text-slate-600 group-hover:bg-white/10 group-hover:text-slate-400"
                  }`}>
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className={`text-[13px] font-bold truncate tracking-tight transition-colors ${currentSessionId === session.id ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`}>
                      {session.title || "New Session"}
                    </p>
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">
                      {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 relative z-10">
                   <button 
                    onClick={(e) => handleDelete(session.id, e)}
                    className="p-2.5 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-slate-700 transition-all"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-center px-8 animate-in fade-in duration-1000">
            <div className="w-16 h-16 rounded-[24px] bg-white/[0.02] border border-white/5 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-indigo-500/5 blur-xl rounded-full" />
              <Brain className="w-8 h-8 text-slate-800" />
            </div>
            <div className="space-y-1">
               <p className="text-[13px] font-bold text-slate-500">Neural Graph Empty</p>
               <p className="text-[11px] text-slate-700 leading-relaxed">Initiate a chat session to begin indexing cognitive data.</p>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Navigation Context */}
      <div className="p-6 mt-auto">
         <div className="group p-5 rounded-[24px] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 hover:border-white/10 transition-all duration-500 cursor-pointer overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
               <LayoutGrid className="w-10 h-10 text-indigo-500" />
            </div>
            <div className="relative z-10">
               <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">Operational</span>
               </div>
               <p className="text-xs font-bold text-slate-300 tracking-tight">Active Intelligence Engine</p>
               <p className="text-[10px] text-slate-500 mt-1 font-medium">Memory Synapse 1.0.42</p>
            </div>
         </div>
      </div>
    </div>
  );
}
