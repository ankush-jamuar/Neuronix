"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";

export default function AIChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  const handleSend = async () => {
    if (!input.trim()) return;

    console.log("Sending question:", input);
    const currentInput = input;
    
    // optimistically add user message
    setMessages((prev) => [...prev, { role: "user", content: currentInput }]);
    setInput("");
    setLoading(true);

    try {
      const token = await getToken();
      console.log("Token received:", token ? "Yes" : "No");

      const res = await fetch("http://localhost:5000/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ question: currentInput }),
      });

      const data = await res.json();
      console.log("FULL AI RESPONSE:", data);

      const aiMessage =
        data.answer ||
        data.response ||
        data.message ||
        "I don't have enough information in your notes.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiMessage },
      ]);
      
      console.log("Messages updated.");
    } catch (err) {
      console.error("AI error:", err);
    }

    setLoading(false);
  };

  return (
    <div style={{
      borderLeft: "1px solid #333",
      padding: "16px",
      width: "350px",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      backgroundColor: "#0a0a0a"
    }}>
      <h3 style={{ fontWeight: "bold", marginBottom: "10px", color: "white" }}>
        🧠 Ask Neuronix
      </h3>

      <div style={{
        flex: 1,
        overflowY: "auto",
        marginBottom: "10px"
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            marginBottom: "8px",
            textAlign: msg.role === "user" ? "right" : "left"
          }}>
            {msg.role === "user" ? (
              <div className="user-msg" style={{
                display: "inline-block",
                padding: "8px",
                borderRadius: "8px",
                background: "#4f46e5",
                color: "#fff",
                fontSize: "14px"
              }}>
                {msg.content}
              </div>
            ) : (
              <div className="ai-msg" style={{
                display: "inline-block",
                padding: "8px",
                borderRadius: "8px",
                background: "#1f2937",
                color: "#fff",
                fontSize: "14px"
              }}>
                {msg.content}
              </div>
            )}
          </div>
        ))}

        {loading && <div style={{color: "#9ca3af", fontSize: "12px"}}>Thinking...</div>}
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          style={{ 
            flex: 1, 
            padding: "8px", 
            borderRadius: "6px",
            border: "1px solid #333",
            backgroundColor: "#111",
            color: "white",
            outline: "none"
          }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Ask something..."
        />

        <button 
          onClick={handleSend}
          style={{
            backgroundColor: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "8px 12px",
            cursor: "pointer"
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
