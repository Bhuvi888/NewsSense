import React, { useState, useRef, useEffect } from 'react';
import { askAI } from '../services/api';

export default function AskAIDrawer({ isOpen, onClose, prefillQuery = '', onSelectArticle }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Good day. This is the NewsSense Neural Press Desk. Our telegraph wire is connected to the live vector repository. Submit your inquiry concerning current dispatches, geopolitical changes, or scientific announcements.',
      sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (prefillQuery) {
      setInput(prefillQuery);
    }
  }, [prefillQuery]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (questionText = null) => {
    const query = (questionText || input).trim();
    if (!query || loading) return;

    const userMessage = { role: 'user', content: query };
    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Build conversation history for API (excluding greeting)
      const apiHistory = nextHistory
        .filter((_, idx) => idx > 0)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await askAI(query, apiHistory.slice(0, -1));

      const assistantMessage = {
        role: 'assistant',
        content: response.answer,
        sources: response.sources || []
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err.message || 'Transmission wire interrupted.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const promptSuggestions = [
    "What are the major geopolitical and economic headlines today?",
    "Summarize the latest developments in artificial intelligence.",
    "Which stories have been reported by multiple wire services?",
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#1d1c16]/50 backdrop-blur-xs transition-opacity">
      <div 
        className="w-full max-w-2xl h-full bg-[#fef9f0] border-l-4 border-[#1d1c16] shadow-2xl flex flex-col justify-between"
        style={{ backgroundImage: 'radial-gradient(#1d1c16 0.5px, transparent 0.5px)', backgroundSize: '16px 16px', backgroundColor: '#fdf9f2' }}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-6 border-b-2 border-[#1d1c16] bg-[#f8f3ea]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 bg-[#850005] animate-pulse"></div>
              <div>
                <h3 className="font-['Playfair_Display'] text-xl font-bold uppercase tracking-wider text-[#1d1c16]">
                  Press Telegraph Desk
                </h3>
                <p className="text-[10px] font-['Source_Serif_4'] text-[#5a413d] uppercase tracking-widest">
                  Neural RAG Intelligence Engine • Direct Vector Wire
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 border border-[#1d1c16] hover:bg-[#850005] hover:text-white transition-colors text-[#1d1c16]"
              title="Close Dispatch Drawer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Quick Telegram Prompts */}
          <div className="mt-4 pt-3 border-t border-[#1d1c16]/20 flex flex-wrap gap-1.5">
            <span className="text-[9px] font-['Playfair_Display'] font-bold uppercase tracking-widest text-[#850005] self-center mr-1">
              Sample Inquiries:
            </span>
            {promptSuggestions.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="text-[10px] font-['Source_Serif_4'] bg-[#f2ede4] hover:bg-[#e7e2d9] border border-[#1d1c16]/30 px-2 py-0.5 text-[#1d1c16] transition-colors"
              >
                "{prompt.slice(0, 38)}..."
              </button>
            ))}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg, index) => (
            <div key={index} className="flex flex-col space-y-2">
              <div className="flex items-center justify-between text-[10px] font-['Playfair_Display'] font-bold tracking-widest uppercase border-b border-[#1d1c16]/15 pb-1">
                <span className={msg.role === 'user' ? 'text-[#850005]' : 'text-[#1d1c16]'}>
                  {msg.role === 'user' ? '§ INQUIRY TELEGRAM DISPATCH' : '§ RESEARCH DESK WIRE RESPONSE'}
                </span>
                <span className="text-[#8e706c]">WIRE RECORD #{index + 1}</span>
              </div>

              {msg.role === 'user' ? (
                <div className="p-3 bg-[#f2ede4] border-l-3 border-[#850005] text-[#1d1c16] font-['Playfair_Display'] text-base italic">
                  "{msg.content}"
                </div>
              ) : (
                <div className="p-4 bg-white border border-[#1d1c16]/25 shadow-xs font-['Source_Serif_4'] text-[#1d1c16] leading-relaxed text-[15px]">
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Wire Citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#1d1c16]/20">
                      <div className="text-[10px] font-['Playfair_Display'] font-bold uppercase tracking-widest text-[#850005] mb-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">verified</span>
                        <span>Corroborated Wire Sources ({msg.sources.length}):</span>
                      </div>
                      <div className="space-y-1.5">
                        {msg.sources.map((src, sIdx) => (
                          <div 
                            key={sIdx}
                            className="p-2 bg-[#f8f3ea] border border-[#1d1c16]/20 text-xs flex items-center justify-between gap-2"
                          >
                            <div className="truncate">
                              <span className="font-bold text-[#850005] uppercase mr-1">[{src.source}]</span>
                              <span className="text-[#1d1c16]">{src.title}</span>
                            </div>
                            {src.url && (
                              <a
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#850005] hover:underline shrink-0 text-[11px] font-bold"
                              >
                                View Wire ↗
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="p-4 bg-[#f8f3ea] border border-[#1d1c16]/30 flex items-center space-x-3">
              <span className="material-symbols-outlined text-[#850005] animate-spin">cyclone</span>
              <span className="font-['Playfair_Display'] text-sm font-bold uppercase tracking-wider text-[#1d1c16]">
                Telegraph Wire Inscribing Response From Vector Corpus...
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-[#ffdad6] border border-[#ba1a1a] text-[#410001] text-xs">
              <strong>Wire Fault:</strong> {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-4 border-t-2 border-[#1d1c16] bg-[#f8f3ea]">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Inscribe telegram inquiry for the AI research wire..."
              disabled={loading}
              className="flex-1 bg-white border border-[#1d1c16] px-3 py-2 text-sm font-['Source_Serif_4'] text-[#1d1c16] focus:outline-none focus:border-[#850005]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-[#850005] hover:bg-[#a8201a] disabled:opacity-50 text-white font-['Playfair_Display'] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <span>Transmit</span>
              <span className="material-symbols-outlined text-[16px]">send</span>
            </button>
          </form>
          <div className="text-[10px] font-['Source_Serif_4'] text-[#5a413d] text-center mt-2">
            Answers synthesized strictly from indexed RSS news dispatches using retrieval-augmented generation.
          </div>
        </div>
      </div>
    </div>
  );
}
