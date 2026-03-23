'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Loader2, Sparkles, Minus, Zap } from 'lucide-react';
import api from '../../lib/apiClient';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChat({ courseTitle, lessonTitle }: { courseTitle?: string, lessonTitle?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hello! I am your AI Study Bot. How can I help you today?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isMinimized]);

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
    } catch (error: any) {
       const errMsg = error.response?.data?.message || "Connection error. Please try again.";
       setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-10 right-10 w-20 h-20 bg-indigo-600/20 backdrop-blur-2xl text-white rounded-[2.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.3)] hover:scale-110 hover:rotate-6 transition-all z-[100] group border border-indigo-500/30 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 animate-pulse" />
        <Bot className="w-10 h-10 text-indigo-400 group-hover:text-white transition-colors" />
        <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full border-4 border-black animate-ping" />
      </button>
    );
  }

  return (
    <div className={`fixed right-10 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) z-[100] flex flex-col ${isMinimized ? 'bottom-10 w-80' : 'bottom-10 w-[420px] h-[600px] overflow-hidden'}`}>
      
      {/* Premium Header */}
      <div className="bg-[#0f172a]/80 backdrop-blur-2xl p-6 flex items-center justify-between rounded-t-[2.5rem] border-x border-t border-white/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all" />
        <div className="flex items-center gap-4 relative">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40 border border-white/20">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-white text-lg font-bold font-heading tracking-tight leading-none mb-1">Study Bot</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
              <span className="text-white/40 text-[10px] uppercase font-extrabold tracking-widest">Always Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setIsMinimized(!isMinimized)} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl transition-all"><Minus className="w-5 h-5 text-white/50" /></button>
           <button onClick={() => setIsOpen(false)} className="w-10 h-10 flex items-center justify-center hover:bg-red-500/20 rounded-xl transition-all"><X className="w-5 h-5 text-white/50 hover:text-red-400" /></button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Futuristic Message Container */}
          <div className="flex-1 bg-[#0f172a]/90 backdrop-blur-3xl p-6 overflow-y-auto border-x border-white/10 relative scrollbar-hide" ref={scrollRef}>
            
            {/* LARGE BACKGROUND BOT IMAGE/ICON */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
               <Bot size={300} strokeWidth={1} className={loading ? 'animate-pulse' : ''} />
            </div>

            <div className="space-y-6 relative">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-purple-600/30 text-purple-400 border border-purple-500/30' : 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/30'}`}>
                    {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`relative px-5 py-4 rounded-[1.5rem] text-[13px] leading-relaxed shadow-xl border ${
                    m.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none border-indigo-500/50' 
                      : 'bg-white/5 text-white/90 border-white/5 rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start gap-4">
                  <div className="w-8 h-8 bg-indigo-600/30 rounded-lg flex items-center justify-center border border-indigo-500/30">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  </div>
                  <div className="px-5 py-4 bg-white/5 border border-white/5 rounded-[1.5rem] rounded-tl-none">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                      <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Premium Glass Input */}
          <form onSubmit={handleSend} className="p-6 bg-[#0f172a]/80 backdrop-blur-2xl border-x border-b border-white/10 rounded-b-[2.5rem] shadow-3xl">
            <div className="relative flex items-center">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-white/20"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2.5 w-11 h-11 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale shadow-lg shadow-indigo-600/30"
              >
                <Zap className="w-5 h-5 fill-current" />
              </button>
            </div>
            <p className="text-center text-[10px] text-white/20 mt-4 uppercase font-bold tracking-[0.2em]">Powered by LearnHub AI Core</p>
          </form>
        </>
      )}
    </div>
  );
}
