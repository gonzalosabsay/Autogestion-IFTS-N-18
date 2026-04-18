import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Loader2, Sparkles, Trash2, Minus } from 'lucide-react';
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
    } catch (error: any) {
      console.error('Chat error:', error);
      let errorMsg = 'Lo siento, ocurrió un error al procesar tu consulta. Verifica tu conexión.';
      
      if (error?.message === 'MISSING_API_KEY') {
        errorMsg = 'No se ha configurado la clave de IA (VITE_GEMINI_API_KEY). Por favor, contacta al administrador del sitio o verifica las variables de entorno en Vercel.';
      }

      setMessages(prev => [...prev, { role: 'model', content: errorMsg }]);
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
          "fixed bottom-6 right-6 w-14 h-14 bg-accent-blue text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-[60] border-2 border-white/10",
          isOpen && "hidden"
        )}
      >
        <MessageSquare className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 bg-primary-brand text-bg-base dark:text-text-main text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md animate-pulse">AI</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-0 bottom-0 sm:inset-auto sm:bottom-6 sm:right-6 w-full sm:max-w-[400px] h-[85dvh] sm:h-[600px] bg-sidebar-bg rounded-t-[32px] sm:rounded-2xl shadow-2xl border-t sm:border border-border-subtle flex flex-col z-[200] overflow-hidden transition-all duration-300 shadow-accent-blue/5"
          >
            {/* Header */}
            <div className="bg-sidebar-bg border-b border-border-subtle p-4 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-blue/10 rounded-xl flex items-center justify-center shrink-0">
                  <Bot className="w-6 h-6 text-accent-blue" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-text-main leading-tight">Asistente TSAS</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <p className="text-[10px] text-text-muted font-medium">Gemini AI • En línea</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={clearChat} 
                  className="p-2 text-text-muted hover:text-accent-blue hover:bg-bg-base rounded-full transition-all" 
                  title="Reiniciar chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="p-2 text-text-muted hover:text-red-500 hover:bg-bg-base rounded-full transition-all" 
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-bg-base/50 dark:bg-bg-base/20 custom-scrollbar">
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
                      : "bg-sidebar-bg border border-border-subtle text-text-main rounded-tl-none shadow-sm"
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
                  <div className="bg-sidebar-bg border border-border-subtle p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary-brand" />
                    <span className="text-xs text-text-muted">Pensando...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-sidebar-bg border-t border-border-subtle transition-colors">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ej: ¿Qué necesito para cursar Redes?"
                  className="flex-1 px-4 py-2 bg-bg-base border border-border-subtle rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent-blue/50 transition-all text-text-main"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-2 bg-primary-brand text-bg-base rounded-xl disabled:opacity-50 hover:bg-opacity-90 transition-all flex items-center justify-center w-10 h-10"
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
