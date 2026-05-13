"use client";

import React from "react";
import { useChat, AIMode } from "./ChatProvider";
import { Brain, BookOpen, Sparkles } from "lucide-react";

export function ModeSwitch() {
  const { mode, setMode, messages } = useChat();

  const handleModeChange = (newMode: AIMode) => {
    if (messages.length > 0) {
      if (confirm("Switching modes will clear your current session. Continue?")) {
        setMode(newMode);
        // messages will be cleared in the main chat page effect if needed
      }
    } else {
      setMode(newMode);
    }
  };

  return (
    <div className="flex items-center p-1 bg-white/[0.03] border border-white/5 rounded-2xl">
      <ModeButton 
        active={mode === "memory"} 
        onClick={() => handleModeChange("memory")}
        icon={<Brain className="w-3.5 h-3.5" />}
        label="Memory AI"
        tooltip="RAG over your notes"
      />
      <ModeButton 
        active={mode === "study"} 
        onClick={() => handleModeChange("study")}
        icon={<BookOpen className="w-3.5 h-3.5" />}
        label="Study AI"
        tooltip="General educational AI"
      />
    </div>
  );
}

function ModeButton({ active, onClick, icon, label, tooltip }: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  tooltip: string;
}) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={`
        relative flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all
        ${active 
          ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
          : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
        }
      `}
    >
      {icon}
      {label}
      {active && (
        <Sparkles className="absolute -top-1 -right-1 w-2.5 h-2.5 text-indigo-300 animate-pulse" />
      )}
    </button>
  );
}
