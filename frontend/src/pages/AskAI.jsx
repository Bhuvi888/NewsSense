import React, { useState, useRef, useEffect } from "react";
import api from "../services/api";
import { Send, Sparkles } from "lucide-react";

export default function AskAI() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi John, I am your Newsense AI Intelligence Assistant. I can summarize complex topics, find recent research developments, or explain financial trends. What would you like to explore today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  const suggestions = [
    "Summarize today's news",
    "What is Agentic AI?",
    "Explain the exoplanet finding",
    "Status of inflation?",
  ];

  const handleSendMessage = async (text) => {
    if (!text.trim() || isTyping) return;

    const userMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await api.askAI(text, messages);
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an issue accessing my database core. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  // Scroll to bottom when messages or typing status change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  return (
    <div className="max-w-[850px] mx-auto flex flex-col h-[calc(100vh-180px)] animate-fade-in space-y-4">
      {/* Header Panel */}
      <div className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-sm flex items-center gap-4">
        <div className="w-10 h-10 rounded-sm bg-[var(--accent)] text-white flex items-center justify-center shadow-sm">
          <Sparkles size={18} strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="font-serif text-sm font-bold text-[var(--headline)]">
            AI News Intelligence
          </h2>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-neutral-500 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Online & Synced
          </span>
        </div>
      </div>

      {/* Chat Canvas */}
      <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-sm flex flex-col overflow-hidden relative">
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={index}
                className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-sm bg-[#EFEAE2] border border-[var(--border)] flex items-center justify-center text-[10px] font-bold text-[var(--headline)] select-none">
                    AI
                  </div>
                )}
                <div
                  className={`p-3 rounded-sm text-xs leading-relaxed shadow-sm ${
                    isUser
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[#F7F3EB]/60 border border-[var(--border)]/70 text-[var(--headline)]"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <span
                    className={`block text-[9px] mt-1.5 text-right font-medium opacity-65 ${
                      isUser ? "text-white/80" : "text-neutral-500"
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="w-7 h-7 rounded-sm bg-[#EFEAE2] border border-[var(--border)] flex items-center justify-center text-[10px] font-bold text-[var(--headline)] select-none">
                AI
              </div>
              <div className="p-3 bg-[#F7F3EB]/60 border border-[var(--border)]/70 rounded-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
          <div ref={scrollRef}></div>
        </div>

        {/* Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto p-4 border-t border-[var(--border)]/35 select-none bg-[#F7F3EB]/25">
          {suggestions.map((sug) => (
            <button
              key={sug}
              onClick={() => handleSendMessage(sug)}
              className="px-3.5 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-full text-[10px] font-bold text-neutral-600 hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-white transition-all duration-200 cursor-pointer whitespace-nowrap"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Input Bar Form */}
        <form
          onSubmit={handleFormSubmit}
          className="p-4 border-t border-[var(--border)] flex items-center gap-3 bg-[var(--surface)]"
        >
          <input
            type="text"
            placeholder="Ask me to summarize stories or identify trends..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            className="flex-grow border border-[var(--border)] rounded-sm py-2 px-4 text-xs text-[var(--headline)] placeholder-[#8C8476] bg-transparent outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className={`w-9 h-9 flex items-center justify-center rounded-sm transition-all duration-200 cursor-pointer border ${
              input.trim() && !isTyping
                ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                : "bg-transparent border-[var(--border)] text-neutral-400"
            }`}
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
