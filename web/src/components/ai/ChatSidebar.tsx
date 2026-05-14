"use client";

import React, { useEffect, useState } from "react";
import { 
  MessageSquare, Plus, Search, 
  MoreVertical, Trash2, Edit2, 
  Clock, Calendar, MessageCircle
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
    <div className="w-80 h-full bg-[#0a0a0a] border-r border-white/5 flex flex-col relative z-20">
      {/* Sidebar Header */}
      <div className="p-6 space-y-4">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-semibold rounded-2xl hover:bg-slate-200 transition-all shadow-xl shadow-white/5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sessions..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 transition-all"
          />
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-6 space-y-6">
        {isLoading ? (
          <div className="space-y-3 px-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredSessions.length > 0 ? (
          <div className="space-y-1">
            <div className="px-3 py-2">
               <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Recent Conversations</p>
            </div>
            {filteredSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group relative ${
                  currentSessionId === session.id 
                    ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400" 
                    : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageCircle className={`w-4 h-4 flex-shrink-0 ${currentSessionId === session.id ? "text-indigo-400" : "text-slate-600 group-hover:text-slate-400"}`} />
                  <div className="text-left overflow-hidden">
                    <p className="text-sm font-medium truncate">{session.title || "New Chat"}</p>
                    <p className="text-[10px] text-slate-600 font-mono truncate">
                      {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={(e) => handleDelete(session.id, e)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-slate-700 transition-all"
                   >
                     <Trash2 className="w-3.5 h-3.5" />
                   </button>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center px-6">
            <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-slate-800" />
            </div>
            <p className="text-xs text-slate-600 italic">No conversations found. Start a new one above.</p>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md">
         <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
               <Calendar className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Focus</p>
               <p className="text-xs font-semibold text-white">Knowledge Synthesis</p>
            </div>
         </div>
      </div>
    </div>
  );
}
