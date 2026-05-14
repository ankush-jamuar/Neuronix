"use client";

import React from "react";
import { useChat, AIMode } from "./ChatProvider";
import { Brain, BookOpen, Sparkles, Zap } from "lucide-react";

export function ModeSwitch() {
  const { mode, setMode } = useChat();

  const modes: { id: AIMode; label: string; icon: React.ReactNode; sublabel: string; color: string }[] = [
    { 
      id: "memory", 
      label: "Memory", 
      sublabel: "Personal RAG",
      icon: <Brain className="w-3.5 h-3.5" />,
      color: "from-indigo-600 to-indigo-400"
    },
    { 
      id: "study", 
      label: "Study", 
      sublabel: "Global IQ",
      icon: <BookOpen className="w-3.5 h-3.5" />,
      color: "from-amber-600 to-amber-400"
    }
  ];

  return (
    <div className="flex items-center p-1.5 bg-[#111] border border-white/5 rounded-[22px] relative overflow-hidden shadow-inner group">
      {/* Dynamic Background Slider */}
      <div 
        className={`absolute top-1.5 bottom-1.5 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) rounded-[18px] z-0 ${
          mode === "memory" ? "left-1.5 w-[46%]" : "left-[51.5%] w-[46%]"
        } bg-gradient-to-tr ${mode === "memory" ? modes[0].color : modes[1].color} shadow-lg shadow-indigo-500/10`}
      />

      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          className={`
            relative z-10 flex-1 flex flex-col items-center justify-center gap-0.5 px-6 py-2.5 rounded-[18px] transition-all duration-500
            ${mode === m.id ? "text-white" : "text-slate-500 hover:text-slate-300"}
          `}
        >
          <div className="flex items-center gap-2">
            {m.icon}
            <span className="text-[11px] font-black uppercase tracking-[0.15em]">{m.label}</span>
          </div>
          <span className={`text-[8px] font-bold uppercase tracking-widest opacity-60 transition-opacity ${mode === m.id ? "opacity-40" : "opacity-0"}`}>
            {m.sublabel}
          </span>
        </button>
      ))}
    </div>
  );
}
