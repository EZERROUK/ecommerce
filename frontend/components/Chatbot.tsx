
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { COMPANY_INFO, PRODUCTS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { useChat } from '../contexts/ChatContext';

interface Message {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export const Chatbot: React.FC = () => {
  const { t, language } = useLanguage();
  const { isOpen, setIsOpen, diagnosticContext } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parseur Markdown ultra-léger pour le gras et les listes
  const formatMessage = (text: string) => {
    if (!text) return "";
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-corporate-blue">$1</strong>')
      .replace(/^\s*-\s+(.*)$/gm, '<div class="flex items-start ml-2 mb-1"><span class="mr-2 text-corporate-red">•</span><span>$1</span></div>')
      .replace(/^### (.*$)/gm, '<div class="font-bold text-corporate-blue mt-2 mb-1">$1</div>')
      .replace(/\n/g, '<br />');
    return formatted;
  };

  // Création de session isolée
  const initSession = async () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("Chatbot: API_KEY is not defined in process.env");
      return null;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const productsContext = PRODUCTS.slice(0, 8).map(p => `- ${p.name} (${p.category})`).join('\n');
      
      let systemInstruction = `Tu es l'Assistant Expert X-Zone Technologie (Casablanca). 
        RÈGLES: Répondre en FRANÇAIS uniquement. Ton pro et commercial.
        FORMATAGE: Utilise du GRAS (**) pour les produits et points clés.
        PRODUITS:
        ${productsContext}`;

      if (diagnosticContext) {
        systemInstruction += `\n\nCONTEXTE AUDIT CLIENT:\n${diagnosticContext}\nAnalyse et propose des solutions concrètes.`;
      }

      return ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction, temperature: 0.7 }
      });
    } catch (err) {
      console.error("Chatbot: Failed to initialize GoogleGenAI", err);
      return null;
    }
  };

  // Reset chat on context change
  useEffect(() => {
    const welcome = diagnosticContext 
        ? "J'ai analysé votre **rapport d'audit**. Souhaitez-vous discuter des **priorités IT** identifiées ?"
        : t('chatbot.welcome');
    
    setMessages([{ role: 'model', text: welcome }]);
    setChatSession(null); // Force re-init on next message
  }, [diagnosticContext, language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [messages, isOpen]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    if (!textOverride) setInput('');
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setIsLoading(true);

    try {
      // Auto-réparation de la session
      let session = chatSession;
      if (!session) {
        session = await initSession();
        if (session) setChatSession(session);
      }

      if (!session) {
        throw new Error("Clé API manquante ou invalide dans l'environnement local.");
      }

      const result = await session.sendMessageStream({ message: textToSend });
      let fullText = "";
      
      // Placeholder pour le stream
      setMessages(prev => [...prev, { role: 'model', text: "" }]);

      for await (const chunk of result) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          setMessages(prev => {
            const newArr = [...prev];
            const last = newArr[newArr.length - 1];
            if (last && last.role === 'model') last.text = fullText;
            return [...newArr];
          });
        }
      }
    } catch (error: any) {
      console.error("Chatbot Error:", error);
      const errorMsg = error.message?.includes("API_KEY") 
        ? "Erreur : La clé API n'est pas configurée correctement dans votre environnement local."
        : "Désolé, une erreur technique empêche la réponse. Veuillez vérifier votre connexion.";
      
      setMessages(prev => [...prev, { role: 'model', text: errorMsg, isError: true }]);
      setChatSession(null); // Reset pour tenter une nouvelle session au prochain message
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {isOpen && (
        <div className="mb-4 w-[340px] sm:w-[380px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col animate-fade-in-up transition-all duration-300" 
             style={{ height: '520px', maxHeight: 'calc(100vh - 120px)' }}>
          
          {/* Header */}
          <div className="bg-corporate-blue px-4 py-3 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center relative">
                <Bot className="w-5 h-5" />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 border border-corporate-blue rounded-full"></span>
              </div>
              <div>
                <h3 className="font-bold text-xs uppercase tracking-tight">Expert IA X-Zone</h3>
                <p className="text-[9px] text-blue-200">En ligne • Support 24/7</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="px-3 py-2 bg-blue-50/50 border-b border-blue-100 flex gap-2 overflow-x-auto shrink-0 no-scrollbar">
             {['Choisir un PC', 'Expert Serveur', 'Support Technique'].map(btn => (
               <button 
                key={btn}
                onClick={() => handleSend(btn)}
                disabled={isLoading}
                className="text-[10px] whitespace-nowrap bg-white text-corporate-blue px-3 py-1.5 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors font-bold shadow-sm disabled:opacity-50"
               >
                 {btn}
               </button>
             ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-4 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all ${
                    msg.role === 'user' 
                      ? 'bg-corporate-blue text-white rounded-br-none' 
                      : msg.isError 
                        ? 'bg-red-50 text-red-700 border border-red-100 rounded-bl-none'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                  }`}>
                  {msg.role === 'model' && msg.text === "" ? (
                    <div className="flex space-x-1.5 py-1.5">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  ) : (
                    <div 
                      className="leading-relaxed break-words"
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
                    />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} className="h-2" />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100 shrink-0">
            <div className="flex items-center bg-gray-50 rounded-xl px-3 py-1.5 border border-gray-200 focus-within:ring-2 focus-within:ring-corporate-blue/10 focus-within:border-corporate-blue transition-all">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Écrivez votre message..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none py-1.5"
                disabled={isLoading}
              />
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="p-2 bg-corporate-red text-white rounded-lg disabled:bg-gray-200 disabled:text-gray-400 transition-all hover:bg-red-700 active:scale-95"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center justify-center bg-corporate-red text-white shadow-xl transition-all duration-300 rounded-full ${isOpen ? 'w-12 h-12' : 'w-14 h-14 hover:scale-105 active:scale-95'}`}
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-7 h-7" />}
        {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white"></span>
            </span>
        )}
      </button>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
