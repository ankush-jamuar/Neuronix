"use client";

import React from "react";
import { ChatProvider, useChat, Message } from "@/components/ai/ChatProvider";
import { ChatInterface } from "@/components/ai/ChatInterface";
import { ModeSwitch } from "@/components/ai/ModeSwitch";
import { API_BASE_URL } from "@/lib/api-config";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Bot, Zap } from "lucide-react";

function ChatPageContent() {
  const { mode, messages, setMessages, setIsLoading } = useChat();
  const { getToken } = useAuth();

  const handleSendMessage = async (content: string) => {
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const startTime = Date.now();

    try {
      const token = await getToken();
      
      // Select endpoint based on mode (future-proof)
      const endpoint = mode === "memory" ? `${API_BASE_URL}/ai/ask` : `${API_BASE_URL}/ai/study`; // Study AI endpoint is a placeholder for now

      if (mode === "study") {
         // Placeholder response for Study AI since backend isn't implemented yet
         await new Promise(resolve => setTimeout(resolve, 1500));
         const assistantMsg: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "The Study AI module is currently in training. For now, I can assist you through Memory AI mode which uses your personal knowledge base. How can I help you with your notes?",
            metadata: {
                latency: Date.now() - startTime
            }
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setIsLoading(false);
          return;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: content }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "AI synthesis failed");
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer ?? "Synthesis failed to produce a coherent response.",
        metadata: {
            latency: Date.now() - startTime,
            chunks: data.sources // Assuming backend might return sources in the future
        }
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      toast.error(err.message || "Connection to neural engine lost");
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I encountered a synchronization error while retrieving your memories. Please check your connection and try again.",
        error: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] relative overflow-hidden">
      {/* Background depth elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/[0.03] blur-[120px] rounded-full pointer-events-none" />
      
      {/* Dynamic Header */}
      <div className="flex-shrink-0 border-b border-white/5 bg-[#0a0a0a]/60 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-white tracking-tight">AI Workspace</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">
                {mode === "memory" ? "Personal Knowledge Engine" : "Global Intelligence Layer"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <ModeSwitch />
            <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <Zap className="w-3 h-3 text-amber-500" />
              Llama 3 @ Groq
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 relative">
         <ChatInterface onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ChatProvider>
      <ChatPageContent />
    </ChatProvider>
  );
}
