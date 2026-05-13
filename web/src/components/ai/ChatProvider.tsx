"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type AIMode = "memory" | "study";

interface ChatContextType {
  mode: AIMode;
  setMode: (mode: AIMode) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  error?: boolean;
  metadata?: {
    chunks?: any[];
    latency?: number;
  };
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AIMode>("memory");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <ChatContext.Provider value={{ mode, setMode, messages, setMessages, isLoading, setIsLoading }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
