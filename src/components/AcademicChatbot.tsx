import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { chatWithAcademicAdvisor } from '../services/academicChatService';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function AcademicChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: '¡Hola! Soy tu asistente de TSAS. ¿Qué duda tienes sobre el plan de estudios?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithAcademicAdvisor([...messages, userMessage]);
      setMessages(prev => [...prev, { role: 'model', content: response || 'No pude obtener una respuesta.' }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', content: 'Lo siento, ocurrió un error al procesar tu consulta. Verifica tu conexión.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'model', content: 'Chat reiniciado. ¿En qué más puedo ayudarte?' }]);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 w-14 h-14 bg-primary-brand text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-[60]",
          isOpen && "hidden"
        )}
      >
        <MessageSquare className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 bg-accent-blue text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">AI</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-6 right-6 w-full max-w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl border border-border-subtle flex flex-col z-[70] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary-brand p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-none">Asistente TSAS</h3>
                  <p className="text-[10px] text-white/60 mt-1 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    Powered by Gemini
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={clearChat} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Limpiar chat">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-base/30">
              {messages.map((m, i) => (
                <motion.div
                  initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i}
                  className={cn(
                    "flex gap-3",
                    m.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    m.role === 'user' ? "bg-accent-blue/10" : "bg-primary-brand/10"
                  )}>
                    {m.role === 'user' ? <User className="w-4 h-4 text-accent-blue" /> : <Bot className="w-4 h-4 text-primary-brand" />}
                  </div>
                  <div className={cn(
                    "max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed",
                    m.role === 'user' 
                      ? "bg-accent-blue text-white rounded-tr-none shadow-sm" 
                      : "bg-white border border-border-subtle text-text-main rounded-tl-none shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                  )}>
                    {m.role === 'model' ? (
                      <div className="markdown-content">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary-brand/10 rounded-lg flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary-brand" />
                  </div>
                  <div className="bg-white border border-border-subtle p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary-brand" />
                    <span className="text-xs text-text-muted">Pensando...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-border-subtle">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ej: ¿Qué necesito para cursar Redes?"
                  className="flex-1 px-4 py-2 bg-bg-base border border-border-subtle rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent-blue/50 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-2 bg-primary-brand text-white rounded-xl disabled:opacity-50 hover:bg-opacity-90 transition-all flex items-center justify-center w-10 h-10"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[9px] text-text-muted mt-2 text-center">
                El asistente puede cometer errores. Verifica con la normativa vigente.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
