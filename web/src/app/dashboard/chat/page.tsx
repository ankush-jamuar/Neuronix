"use client";

import React, { useEffect, useCallback, useMemo } from "react";
import { ChatProvider, useChat, Message } from "@/components/ai/ChatProvider";
import { ChatInterface } from "@/components/ai/ChatInterface";
import { ModeSwitch } from "@/components/ai/ModeSwitch";
import { ChatSidebar } from "@/components/ai/ChatSidebar";
import { API_BASE_URL } from "@/lib/api-config";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Bot, Zap, Menu } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

function ChatPageContent() {
  const { 
    mode, messages, setMessages, 
    isLoading, setIsLoading
  } = useChat();
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  // Derived state from URL
  const currentSessionId = useMemo(() => searchParams.get("id"), [searchParams]);

  // Load messages when session changes
  const loadMessages = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const formattedMessages: Message[] = data.map((m: any) => ({
          id: m.id,
          role: m.role.toLowerCase(),
          content: m.content,
          metadata: {
            sources: m.sources
          }
        }));
        setMessages(formattedMessages);
      } else if (res.status === 404 || res.status === 401) {
        // If session not found or unauthorized, clear the ID
        router.replace("/dashboard/chat");
      }
    } catch (error) {
      console.error("Hydration Error:", error);
      toast.error("Failed to load conversation history");
    } finally {
      setIsLoading(false);
    }
  }, [getToken, setIsLoading, setMessages, router]);

  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId, loadMessages, setMessages]);

  const handleSendMessage = async (content: string) => {
    let sessionId = currentSessionId;
    const token = await getToken();

    // 1. Create session if none exists
    if (!sessionId) {
      try {
        console.log("[Persistence] Creating new session...");
        const res = await fetch(`${API_BASE_URL}/chat/sessions`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ title: content.slice(0, 40) + (content.length > 40 ? "..." : "") })
        });
        
        if (!res.ok) throw new Error("Failed to initialize conversation");
        
        const session = await res.json();
        sessionId = session.id;
        
        // Update URL to reflect the new session ID immediately
        router.replace(`/dashboard/chat?id=${sessionId}`);
        console.log("[Persistence] Session created:", sessionId);
      } catch (err: any) {
        toast.error(err.message);
        return;
      }
    }

    // 2. Optimistic UI update (Add user message)
    const optimisticUserMsg: Message = { 
      id: crypto.randomUUID(), 
      role: "user", 
      content 
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);
    setIsLoading(true);

    const startTime = Date.now();

    // 3. Get AI response (Backend handles persistence for both User & Assistant)
    try {
      console.log("[AI] Requesting response from", mode, "mode...");
      
      const res = await fetch(`${API_BASE_URL}/ai/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          question: content,
          sessionId,
          mode
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI synthesis failed");

      // 4. Update UI with the final assistant response and real message IDs
      const assistantMsg: Message = {
        id: data.assistantMessageId || crypto.randomUUID(),
        role: "assistant",
        content: data.answer ?? "Synthesis failed.",
        metadata: {
            latency: data.latency?.totalMs || (Date.now() - startTime),
            sources: data.sources
        }
      };

      // Replace optimistic user message with real one (to get the correct DB ID)
      setMessages((prev) => {
        const filtered = prev.filter(m => m.id !== optimisticUserMsg.id);
        const userMsg: Message = { ...optimisticUserMsg, id: data.userMessageId || optimisticUserMsg.id };
        return [...filtered, userMsg, assistantMsg];
      });

    } catch (err: any) {
      console.error("[Chat] Error:", err);
      toast.error(err.message || "Connection lost");
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I encountered a synchronization error. Please try again.",
        error: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectSession = (id: string) => {
    router.push(`/dashboard/chat?id=${id}`);
  };

  const onNewChat = () => {
    router.push("/dashboard/chat");
  };

  return (
    <div className="flex h-full bg-[#0a0a0a] relative overflow-hidden">
      {/* Background depth elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/[0.03] blur-[120px] rounded-full pointer-events-none" />
      
      {/* Chat Sidebar */}
      {isSidebarOpen && (
        <ChatSidebar 
          currentSessionId={currentSessionId}
          onSelectSession={onSelectSession}
          onNewChat={onNewChat}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Dynamic Header */}
        <div className="flex-shrink-0 border-b border-white/5 bg-[#0a0a0a]/60 backdrop-blur-xl sticky top-0 z-20">
          <div className="max-w-6xl mx-auto w-full px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-white/5 rounded-xl transition-all text-slate-500 hover:text-white"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                <Bot className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="hidden sm:block">
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

        {/* Chat Interface */}
        <div className="flex-1 relative">
           <ChatInterface onSendMessage={handleSendMessage} />
        </div>
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
