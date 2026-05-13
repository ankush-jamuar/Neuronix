"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL } from "@/lib/api-config";
import { Send, Loader2, Bot, User, AlertCircle, Zap, Clock } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const token = await getToken({ template: "default" });
      const res = await fetch(`${API_BASE_URL}/ai/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: q }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "AI request failed");
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer ?? "I couldn't generate a response.",
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: err?.message ?? "An error occurred. Please try again.",
        error: true,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d0f] relative">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/5 bg-[#0d0d0f]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Neuronix AI Assistant</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Semantic Memory Retrieval Enabled</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-500 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
            <Zap className="w-3 h-3 text-amber-500" />
            Llama 3 @ Groq
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pt-8 pb-12">
        <div className="max-w-5xl mx-auto w-full px-6 space-y-8">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center relative group">
                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <Bot className="w-10 h-10 text-indigo-400 relative z-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white tracking-tight">Ask your second brain anything</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                  Neuronix scans your entire knowledge vault using vector similarity to provide grounded, factual answers based only on your notes.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 w-full max-w-lg">
                {[
                  "Summarize my recent research notes",
                  "What are my core project priorities?",
                  "Find insights on machine learning",
                  "Review my weekly planning notes",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="text-left text-xs text-slate-400 bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-3.5 hover:bg-white/[0.05] hover:text-slate-200 hover:border-indigo-500/20 transition-all shadow-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-1 shadow-md ${
                  msg.role === "user"
                    ? "bg-indigo-500/20 border border-indigo-500/30"
                    : msg.error
                    ? "bg-red-500/10 border border-red-500/20"
                    : "bg-white/5 border border-white/10"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4 text-indigo-400" />
                ) : msg.error ? (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                ) : (
                  <Bot className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div
                className={`max-w-[85%] rounded-3xl px-5 py-4 text-[15px] leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-indigo-500/10 border border-indigo-500/20 text-slate-100"
                    : msg.error
                    ? "bg-red-500/5 border border-red-500/10 text-red-300"
                    : "bg-white/[0.03] border border-white/5 text-slate-300"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-5">
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mt-1">
                <Bot className="w-4 h-4 text-slate-400" />
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-3xl px-6 py-4">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-gradient-to-t from-[#0d0d0f] via-[#0d0d0f] to-transparent pt-10 pb-6">
        <div className="max-w-5xl mx-auto w-full px-6">
          <div className="relative flex items-end gap-3 bg-[#161618] border border-white/10 rounded-3xl p-2 shadow-2xl focus-within:border-indigo-500/40 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your notes…"
              rows={1}
              className="flex-1 bg-transparent border-none rounded-2xl px-4 py-3 text-[15px] text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-0 transition-all resize-none min-h-[46px] max-h-[200px]"
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 200)}px`;
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 h-[46px] w-[46px] bg-indigo-500 hover:bg-indigo-600 disabled:opacity-20 disabled:cursor-not-allowed text-white rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-indigo-500/20 active:scale-95 mb-0.5 mr-0.5"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="flex items-center justify-between mt-3 px-2">
            <p className="text-[10px] text-slate-700 font-medium uppercase tracking-widest">
              Grounded in {messages.length > 0 ? "active" : "total"} context
            </p>
            <p className="text-[10px] text-slate-700 font-medium uppercase tracking-widest flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              Real-time hybrid search
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
