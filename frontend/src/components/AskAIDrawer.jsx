import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { askAI } from '../services/api';

export default function AskAIDrawer({ isOpen, onClose, prefillQuery = '', onSelectArticle }) {
  const initialGreeting = {
    role: 'assistant',
    content: 'Hello. I am WATCHER, your news assistant. Ask me anything about today\'s stories.',
    sources: []
  };

  const [messages, setMessages] = useState([initialGreeting]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [highlightedSource, setHighlightedSource] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (prefillQuery) {
      setInput(prefillQuery);
    }
  }, [prefillQuery]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleResetConversation = () => {
    setMessages([initialGreeting]);
    setInput('');
    setError(null);
    setLoading(false);
  };

  const handleCopyText = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleJumpToSource = (sourceNumber) => {
    const el = document.getElementById(`source-item-${sourceNumber}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedSource(sourceNumber);
      setTimeout(() => setHighlightedSource(null), 2500);
    }
  };

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
      // Build conversation history for API (excluding initial greeting)
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
      setError(err.message || 'Could not reach the assistant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const promptSuggestions = [
    "What are the biggest headlines today?",
    "Summarize the latest in technology.",
    "What happened in business and markets?",
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-[#141310]/50 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="watcher-dialog-title"
    >
      <div 
        className="w-full sm:max-w-xl h-[100dvh] bg-[#fef9f0] border-l-2 sm:border-l-4 border-[#141310] shadow-2xl flex flex-col justify-between"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b-2 border-[#141310] bg-[#f8f3ea]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-2xl text-[#850005]" aria-hidden="true">psychology</span>
              <div>
                <h3 id="watcher-dialog-title" className="font-['Playfair_Display'] text-xl font-bold uppercase tracking-wide text-[#141310]">
                  Ask WATCHER
                </h3>
                <p className="text-xs font-['Source_Serif_4'] text-[#3e3832]">
                  Ask about the news.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* New Inquiry / Clear Chat Button — 44px min touch target */}
              {messages.length > 1 && (
                <button
                  onClick={handleResetConversation}
                  className="min-h-[44px] px-3 py-1.5 text-xs font-['Playfair_Display'] font-bold text-[#850005] border border-[#850005]/40 hover:bg-[#850005] hover:text-white active:scale-95 transition-all flex items-center gap-1.5 rounded-xs cursor-pointer"
                  title="Start a new conversation"
                  aria-label="Start a new conversation"
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">refresh</span>
                  <span className="hidden sm:inline">New Inquiry</span>
                </button>
              )}

              {/* Close Button — 44×44px touch target */}
              <button
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center border border-[#141310] hover:bg-[#850005] hover:text-white active:scale-95 transition-colors text-[#141310] rounded-xs cursor-pointer"
                title="Close (Esc)"
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
              </button>
            </div>
          </div>

          {/* AI Transparency & Grounding Disclosure Notice */}
          <div className="mt-3 p-2 bg-[#f2ede4] border border-[#141310]/20 flex items-center justify-between text-[11px] font-['Source_Serif_4'] text-[#3e3832]">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[#850005]" aria-hidden="true">verified_user</span>
              <span>Grounded exclusively in verified clippings · Citations [1..n]</span>
            </div>
            <span className="font-['Playfair_Display'] text-[10px] uppercase font-bold text-[#850005] bg-[#ffdad5] px-1.5 py-0.5 border border-[#850005]/20 shrink-0">
              RAG Engine
            </span>
          </div>

          {/* Suggested Questions with Generous Touch Targets */}
          <div className="mt-2.5 pt-2 border-t border-[#141310]/15 flex flex-wrap gap-1.5" aria-label="Suggested inquiries">
            {promptSuggestions.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="min-h-[44px] sm:min-h-[32px] text-[11px] font-['Source_Serif_4'] bg-white hover:bg-[#ffdad5] hover:text-[#850005] border border-[#141310]/25 px-3 py-1.5 text-[#141310] transition-colors rounded-xs focus:ring-1 focus:ring-[#850005] cursor-pointer flex items-center"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {messages.map((msg, index) => (
            <div key={index} className="flex flex-col space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-['Playfair_Display'] font-bold tracking-wider uppercase border-b border-[#141310]/15 pb-1">
                <span className={msg.role === 'user' ? 'text-[#850005]' : 'text-[#141310]'}>
                  {msg.role === 'user' ? 'Your Question' : 'WATCHER'}
                </span>

                {/* Copy to Clipboard for AI Answers */}
                {msg.role === 'assistant' && index > 0 && (
                  <button
                    onClick={() => handleCopyText(msg.content, index)}
                    className="flex items-center gap-1 text-[10px] text-[#3e3832] hover:text-[#850005] transition-colors"
                    title="Copy response to clipboard"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copiedIndex === index ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedIndex === index ? 'Copied!' : 'Copy'}</span>
                  </button>
                )}
              </div>

              {msg.role === 'user' ? (
                <div className="p-3 bg-[#f2ede4] border-l-3 border-[#850005] text-[#141310] font-['Playfair_Display'] text-base italic">
                  "{msg.content}"
                </div>
              ) : (
                <div className="p-4 bg-white border border-[#141310]/25 shadow-xs font-['Source_Serif_4'] text-[#141310] leading-relaxed text-[15px] sm:text-base">
                  <div className="prose prose-sm max-w-none text-[#141310]">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Format citation links like [1], [2] as clickable jump links with comfortable touch area
                        a: ({ href, children, ...props }) => {
                          const text = String(children);
                          const match = text.match(/^\[?(\d+)\]?$/);
                          if (match) {
                            const num = match[1];
                            return (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleJumpToSource(num);
                                }}
                                className="min-h-[28px] min-w-[28px] inline-flex items-center justify-center font-bold text-[#850005] bg-[#ffdad5] hover:bg-[#850005] hover:text-white px-2 py-0.5 rounded-xs text-xs font-['Playfair_Display'] mx-1 align-super cursor-pointer transition-colors shadow-2xs active:scale-95"
                                title={`Jump to Source [${num}]`}
                                aria-label={`Jump to citation source [${num}]`}
                              >
                                [{num}]
                              </button>
                            );
                          }
                          return <a href={href} {...props}>{children}</a>;
                        }
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {/* Sources List with Anchor IDs */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#141310]/20">
                      <div className="text-xs font-['Playfair_Display'] font-bold uppercase tracking-wider text-[#850005] mb-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]" aria-hidden="true">verified</span>
                        <span>Sources ({msg.sources.length})</span>
                      </div>
                      <div className="space-y-1.5" role="list">
                        {msg.sources.map((src, sIdx) => {
                          const sourceNum = String(sIdx + 1);
                          const isHighlighted = highlightedSource === sourceNum;
                          return (
                            <div 
                              key={sIdx}
                              id={`source-item-${sourceNum}`}
                              role="listitem"
                              className={`p-2.5 bg-[#f8f3ea] border text-xs flex items-center justify-between gap-2 transition-all ${
                                isHighlighted 
                                  ? 'border-[#850005] ring-2 ring-[#850005] bg-[#ffdad5]/40 shadow-sm' 
                                  : 'border-[#141310]/20'
                              }`}
                            >
                              <div className="truncate">
                                <span className="font-bold text-[#850005] font-['Playfair_Display'] mr-1.5">
                                  [{sourceNum}]
                                </span>
                                <span className="font-bold text-[#141310] uppercase mr-1">
                                  [{src.source}]
                                </span>
                                <span className="text-[#141310]">{src.title}</span>
                              </div>
                              {src.url && (
                                <a
                                  href={src.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="min-h-[44px] px-2.5 flex items-center text-[#850005] hover:underline shrink-0 text-xs font-bold"
                                  title={`Open original source: ${src.title}`}
                                >
                                  View ↗
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Synthesis Feedback State */}
          {loading && (
            <div className="p-4 bg-[#f8f3ea] border border-[#141310]/30 space-y-3" aria-busy="true" aria-live="polite">
              <div className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-[#850005] animate-spin text-lg" aria-hidden="true">progress_activity</span>
                <span className="font-['Playfair_Display'] text-xs font-bold uppercase tracking-wide text-[#141310]">
                  WATCHER is synthesizing newsroom reports...
                </span>
              </div>
              <div className="h-3 w-4/5 skeleton"></div>
              <div className="h-3 w-3/5 skeleton"></div>
            </div>
          )}

          {/* Error State with Retry Button */}
          {error && (
            <div className="p-3.5 bg-[#ffdad6] border border-[#ba1a1a] text-[#410001] text-xs flex items-center justify-between gap-2" role="alert">
              <div>
                <strong>Inquiry Failed:</strong> {error}
              </div>
              <button
                onClick={() => handleSend()}
                className="px-2.5 py-1 bg-[#ba1a1a] text-white font-bold text-[11px] uppercase cursor-pointer hover:bg-[#850005] shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-3 sm:p-4 border-t-2 border-[#141310] bg-[#f8f3ea]">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={loading}
              aria-label="Ask WATCHER a question"
              className="flex-1 min-h-[44px] bg-white border border-[#141310] px-3.5 py-2 text-sm font-['Source_Serif_4'] text-[#141310] focus:outline-none focus:border-[#850005] focus:ring-1 focus:ring-[#850005]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="min-h-[44px] px-5 py-2 bg-[#850005] hover:bg-[#a8201a] active:scale-95 disabled:opacity-50 text-white font-['Playfair_Display'] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs"
              aria-label="Submit question to WATCHER"
            >
              <span>Ask</span>
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">send</span>
            </button>
          </form>
          <div className="text-[11px] font-['Source_Serif_4'] text-[#3e3832] text-center mt-1.5">
            Answers are verified directly from today's news stories. Press <kbd className="font-mono bg-[#f2ede4] px-1 py-0.5 border border-[#141310]/20 text-[10px]">Esc</kbd> to close.
          </div>
        </div>
      </div>
    </div>
  );
}
