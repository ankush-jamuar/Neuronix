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
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pt-8 pb-12">
        <div className="max-w-4xl mx-auto w-full px-6 space-y-10">
          {messages.length === 0 && (
            <WelcomePlaceholder onSelectSuggestion={(s) => setInput(s)} mode={mode} />
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} msg={msg} />
          ))}

          {isLoading && (
            <LoadingBubble />
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-10 pb-8 px-6">
        <div className="max-w-4xl mx-auto w-full">
          <div className="relative flex items-end gap-3 bg-[#111] border border-white/10 rounded-[28px] p-2 shadow-2xl focus-within:border-indigo-500/40 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === "memory" ? "Ask your second brain..." : "Explore a new topic..."}
              rows={1}
              className="flex-1 bg-transparent border-none rounded-2xl px-4 py-3.5 text-[15px] text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-0 transition-all resize-none min-h-[52px] max-h-[200px]"
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 200)}px`;
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 h-[44px] w-[44px] bg-indigo-500 hover:bg-indigo-600 disabled:opacity-20 disabled:cursor-not-allowed text-white rounded-[20px] flex items-center justify-center transition-all shadow-lg shadow-indigo-500/20 active:scale-95 mb-1 mr-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="flex items-center justify-between mt-3 px-4">
             <p className="text-[10px] text-slate-700 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
               <Zap className="w-3 h-3" />
               {mode === "memory" ? "Hybrid RAG Engine" : "Global Knowledge Engine"}
             </p>
             <p className="text-[10px] text-slate-700 font-bold uppercase tracking-[0.2em]">
               Neural Streaming Enabled
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
    <div className={`flex gap-6 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
      <div className={`flex-shrink-0 w-9 h-9 rounded-[14px] flex items-center justify-center mt-1 shadow-sm border transition-all ${
        isAssistant 
          ? "bg-[#111] border-white/10" 
          : "bg-indigo-500/10 border-indigo-500/20"
      }`}>
        {isAssistant ? (
          <Bot className={`w-5 h-5 ${msg.error ? "text-red-400" : "text-slate-400"}`} />
        ) : (
          <User className="w-5 h-5 text-indigo-400" />
        )}
      </div>
      
      <div className={`max-w-[85%] rounded-[24px] px-6 py-4 text-[15px] leading-relaxed shadow-sm border transition-all ${
        isAssistant 
          ? msg.error ? "bg-red-500/5 border-red-500/10 text-red-300" : "bg-white/[0.03] border-white/5 text-slate-300"
          : "bg-indigo-500/5 border-indigo-500/10 text-slate-100"
      }`}>
        <p className="whitespace-pre-wrap">{msg.content}</p>
        
        {isAssistant && msg.metadata?.latency && (
           <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-3">
              <span className="text-[9px] text-slate-700 font-mono uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {msg.metadata.latency}ms
              </span>
              {msg.metadata.chunks && (
                 <span className="text-[9px] text-slate-700 font-mono uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Grounded
                </span>
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
    <div className="flex flex-col items-center justify-center py-24 text-center gap-8">
      <div className="w-24 h-24 rounded-[32px] bg-white/[0.02] border border-white/5 flex items-center justify-center relative group">
        <div className="absolute inset-0 bg-indigo-500/10 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        <Bot className="w-12 h-12 text-indigo-400 relative z-10" />
      </div>
      <div className="space-y-3">
        <h3 className="text-2xl font-bold text-white tracking-tight">
          {mode === "memory" ? "Consult your second brain" : "Explore the collective mind"}
        </h3>
        <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
          {mode === "memory" 
            ? "Neuronix filters through your notes to provide grounded answers based on your unique knowledge."
            : "Access global insights and educational support beyond your personal knowledge base."
          }
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 w-full max-w-2xl px-4">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSelectSuggestion(s)}
            className="text-left text-xs text-slate-500 bg-[#0f0f11] border border-white/5 rounded-[20px] px-5 py-4 hover:bg-white/[0.04] hover:text-slate-200 hover:border-indigo-500/30 transition-all shadow-sm"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function LoadingBubble() {
  return (
    <div className="flex gap-6 animate-in fade-in duration-500">
      <div className="flex-shrink-0 w-9 h-9 rounded-[14px] bg-[#111] border border-white/10 flex items-center justify-center mt-1">
        <Bot className="w-5 h-5 text-slate-400" />
      </div>
      <div className="bg-white/[0.03] border border-white/5 rounded-[24px] px-8 py-5 flex items-center justify-center">
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 bg-indigo-500/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 bg-indigo-500/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 bg-indigo-500/40 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}
