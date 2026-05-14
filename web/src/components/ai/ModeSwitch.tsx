"use client";

import React from "react";
import { useChat, AIMode } from "./ChatProvider";
import { Brain, BookOpen, Sparkles, ChevronRight } from "lucide-react";

export function ModeSwitch() {
  const { mode, setMode } = useChat();

  const modes: { id: AIMode; label: string; icon: React.ReactNode; color: string }[] = [
    { 
      id: "memory", 
      label: "Memory", 
      icon: <Brain className="w-3.5 h-3.5" />,
      color: "bg-indigo-500"
    },
    { 
      id: "study", 
      label: "Study", 
      icon: <BookOpen className="w-3.5 h-3.5" />,
      color: "bg-amber-500"
    }
  ];

  return (
    <div className="flex items-center p-1 bg-white/[0.03] border border-white/5 rounded-2xl relative overflow-hidden group">
      {/* Animated Background Slider */}
      <div 
        className={`absolute inset-y-1 transition-all duration-300 ease-out rounded-xl ${mode === "memory" ? "left-1 w-[48%]" : "left-[51%] w-[48%]"}`}
        style={{ backgroundColor: mode === "memory" ? "rgb(99 102 241)" : "rgb(245 158 11)" }}
      />

      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          className={`
            relative z-10 flex items-center justify-center gap-2 px-4 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300
            ${mode === m.id ? "text-white shadow-xl shadow-black/20" : "text-slate-500 hover:text-slate-300"}
          `}
        >
          {m.icon}
          {m.label}
          {mode === m.id && (
             <Sparkles className="w-2.5 h-2.5 text-white/40 animate-pulse" />
          )}
        </button>
      ))}
    </div>
  );
}
