"use client";

import { useState } from "react";
import { env } from "@/lib/env";
import type { SimulationParams } from "@/lib/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface EmergencyAssistantProps {
  params: SimulationParams;
}

const SUGGESTIONS = [
  "Which hospitals will still have electricity?",
  "How many rescue boats are needed?",
  "Which evacuation center has available capacity?",
];

export function EmergencyAssistant({ params }: EmergencyAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Ask me naturally about the disaster scenario. Try: \"Which hospitals will still have electricity?\" or \"How many rescue boats are needed?\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text.trim(), params }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process that request. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-700/50 bg-slate-900/60">
      <div className="border-b border-slate-700/50 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          AI Emergency Assistant
        </h3>
        <p className="text-xs text-slate-500">
          {env.aiAssistantEnabled
            ? "LLM-powered · grounded in live simulation data"
            : "Rule-based · set AI_ASSISTANT_ENABLED=true for LLM"}
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: 280 }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-cyan-600/30 text-cyan-100"
                  : "bg-slate-800/60 text-slate-300"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-slate-800/60 px-3 py-2 text-sm text-slate-400">
              Analyzing scenario...
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-700/50 p-3">
        <div className="mb-2 flex flex-wrap gap-1">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="rounded-full border border-slate-700/50 bg-slate-800/40 px-2 py-0.5 text-[10px] text-slate-400 transition hover:border-cyan-600/50 hover:text-cyan-400"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the disaster scenario..."
            className="flex-1 rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500 disabled:opacity-50"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
