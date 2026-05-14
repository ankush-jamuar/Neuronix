"use client";

import React, { useRef, useEffect } from "react";
import { useChat, Message } from "./ChatProvider";
import { Send, Loader2, Bot, User, AlertCircle, Zap, Clock, Sparkles } from "lucide-react";

interface ChatInterfaceProps {
  onSendMessage: (content: string) => void;
}

export function ChatInterface({ onSendMessage }: ChatInterfaceProps) {
  const { messages, isLoading, mode } = useChat();
  const [input, setInput] = React.useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const q = input.trim();
    if (!q || isLoading) return;
    onSendMessage(q);
    setInput("");
    if (inputRef.current) {
        inputRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Messages Viewport */}
      <div className="flex-1 overflow-y-auto custom-scrollbar-premium px-6 py-12">
        <div className="max-w-3xl mx-auto w-full space-y-16">
          {messages.length === 0 && (
            <WelcomePlaceholder onSelectSuggestion={(s) => setInput(s)} mode={mode} />
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} msg={msg} />
          ))}

          {isLoading && (
            <ThinkingBubble />
          )}

          <div ref={bottomRef} className="h-4" />
        </div>
      </div>

      {/* Premium Composer Area */}
      <div className="flex-shrink-0 px-6 pb-10 pt-4 relative">
        {/* Composer Backdrop Glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent pointer-events-none" />
        
        <div className="max-w-3xl mx-auto w-full relative z-10">
          <div className="group relative flex flex-col bg-[#111]/40 backdrop-blur-3xl border border-white/10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all duration-500">
            
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === "memory" ? "Ask your second brain..." : "Explore a new topic..."}
              rows={1}
              className="w-full bg-transparent border-none rounded-[32px] px-8 pt-6 pb-16 text-[16px] text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-0 transition-all resize-none min-h-[80px] max-h-[300px] leading-relaxed"
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 300)}px`;
              }}
            />
            
            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  Neural Assist
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  <Zap className="w-3 h-3 text-amber-500" />
                  Turbo
                </div>
              </div>

              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 bg-indigo-500 hover:bg-indigo-600 disabled:bg-white/5 disabled:text-slate-700 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-xl shadow-indigo-500/10 active:scale-90 group/btn"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                )}
              </button>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-8 opacity-40">
             <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em] flex items-center gap-2">
               <span className="w-1 h-1 rounded-full bg-indigo-500" />
               Standard Encryption
             </p>
             <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em] flex items-center gap-2">
               <span className="w-1 h-1 rounded-full bg-emerald-500" />
               Real-time Sync
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ msg }: { msg: Message }) {
  const isAssistant = msg.role === "assistant";
  
  return (
    <div className={`flex gap-8 group/msg ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out`}>
      {/* Cinematic Avatar */}
      <div className="flex-shrink-0 relative">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center relative z-10 transition-all duration-500 border ${
          isAssistant 
            ? "bg-[#0f0f0f] border-white/10 group-hover/msg:border-indigo-500/30" 
            : "bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/20"
        }`}>
          {isAssistant ? (
            <Bot className={`w-5 h-5 ${msg.error ? "text-red-400" : "text-slate-400 group-hover/msg:text-indigo-400"} transition-colors duration-500`} />
          ) : (
            <User className="w-5 h-5 text-white" />
          )}
        </div>
        {isAssistant && (
           <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover/msg:opacity-40 transition-opacity duration-700" />
        )}
      </div>
      
      {/* Message Content Bubble */}
      <div className={`flex-1 max-w-2xl space-y-4`}>
        <div className={`text-[15px] leading-[1.7] tracking-tight transition-all duration-500 ${
          isAssistant 
            ? "text-slate-200" 
            : "text-white font-medium"
        }`}>
          <div className="whitespace-pre-wrap selection:bg-indigo-500/30">{msg.content}</div>
        </div>
        
        {/* Enhanced Metadata & Grounding */}
        {isAssistant && (
           <div className="flex flex-wrap items-center gap-4 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-500">
              {msg.metadata?.latency && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
                   <Clock className="w-3 h-3 text-slate-500" />
                   <span className="text-[10px] text-slate-500 font-mono tracking-wider">{msg.metadata.latency}ms</span>
                </div>
              )}
              
              {(msg.metadata?.chunks || msg.metadata?.sources) && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/5 border border-indigo-500/10 group/ground">
                   <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                   <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Cognitive Grounding</span>
                </div>
              )}
              
              {msg.metadata?.sources && Array.isArray(msg.metadata.sources) && (
                <div className="w-full flex gap-3 mt-2 overflow-x-auto pb-2 custom-scrollbar-hide">
                  {msg.metadata.sources.map((source: any, i: number) => (
                    <div key={i} className="flex-shrink-0 max-w-[240px] p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-3 h-3 text-slate-600" />
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Recall Segment {i + 1}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed italic">"{source.content}"</p>
                    </div>
                  ))}
                </div>
              )}
           </div>
        )}
      </div>
    </div>
  );
}

function WelcomePlaceholder({ onSelectSuggestion, mode }: { onSelectSuggestion: (s: string) => void; mode: string }) {
  const suggestions = mode === "memory" 
    ? ["Summarize my research on AI", "What are my core project priorities?", "Find insights on market trends", "Review my weekly planning"]
    : ["Explain quantum entanglement", "Best practices for Next.js", "History of industrial design", "How to build a SaaS"];

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-10 animate-in fade-in zoom-in-95 duration-1000 ease-out">
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full animate-pulse-slow" />
        <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 flex items-center justify-center relative z-10 shadow-2xl">
          <Bot className="w-10 h-10 text-indigo-400" />
        </div>
      </div>
      
      <div className="space-y-4 max-w-xl">
        <h3 className="text-3xl font-bold text-white tracking-tighter sm:text-4xl">
          {mode === "memory" ? "Accessing Second Brain" : "Neural Gateway Active"}
        </h3>
        <p className="text-slate-500 text-base leading-relaxed tracking-tight">
          {mode === "memory" 
            ? "Your personal intelligence layer is synchronized. Ask anything about your notes, documents, and research."
            : "The global knowledge engine is ready. Explore advanced topics with Llama 3.1 intelligence."
          }
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl pt-6">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSelectSuggestion(s)}
            className="group text-left p-5 rounded-[24px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all duration-300 relative overflow-hidden shadow-sm"
          >
            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
               <Sparkles className="w-4 h-4 text-indigo-500/40" />
            </div>
            <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors leading-snug font-medium">{s}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex gap-8 animate-in fade-in duration-700">
      <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-[#0f0f0f] border border-white/10 flex items-center justify-center relative">
        <div className="absolute inset-0 bg-indigo-500/10 blur-md rounded-full animate-pulse" />
        <Bot className="w-5 h-5 text-slate-500" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
          </div>
          <span className="text-[10px] text-indigo-500/60 font-black uppercase tracking-[0.3em]">Processing Neural Graph...</span>
        </div>
        <div className="h-4 w-48 bg-white/5 rounded-full animate-pulse" />
      </div>
    </div>
  );
}
