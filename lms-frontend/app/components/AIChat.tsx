'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Loader2, Sparkles, Minus } from 'lucide-react';
import api from '../../lib/apiClient';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChat({ courseTitle, lessonTitle }: { courseTitle?: string, lessonTitle?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hi! I'm your LearnHub Study Assistant. How can I help you with "${lessonTitle || 'this lesson'}"?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const { data } = await api.post('/api/ai/chat', {
        message: userMsg,
        context: { courseTitle, lessonTitle }
      });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
       setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all z-[60] group"
      >
        <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[var(--bg)]" />
      </button>
    );
  }

  return (
    <div className={`fixed right-6 transition-all z-[60] flex flex-col ${isMinimized ? 'bottom-6 w-72' : 'bottom-6 w-96 h-[500px] overflow-hidden'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between rounded-t-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white text-sm font-bold leading-none">Study Assistant</h3>
            <span className="text-indigo-100 text-[10px] font-medium">AI-Powered Helper</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-white/10 rounded transition-colors">
              <Minus className="w-4 h-4 text-white" />
           </button>
           <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded transition-colors">
              <X className="w-4 h-4 text-white" />
           </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 bg-[var(--bg2)]/95 backdrop-blur-md p-4 overflow-y-auto border-x border-[var(--border)] scrollbar-hide" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    m.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg' 
                      : 'bg-[var(--surface2)] text-[var(--text)] border border-[var(--border)] rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                   <div className="bg-[var(--surface2)] p-3 rounded-2xl border border-[var(--border)] rounded-tl-none">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 bg-[var(--bg3)] border border-[var(--border)] rounded-b-2xl shadow-2xl">
            <div className="relative">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask me anything about the lesson..."
                className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-xl py-2.5 pl-4 pr-12 text-sm text-[var(--text)] focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
