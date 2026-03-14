import { safeStorage } from '../utils/storage';
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Loader2, Minimize2, Maximize2, Paperclip, Download, Mic } from "lucide-react";
import { GoogleGenAI, Type } from "@google/genai";
import { jsPDF } from "jspdf";
import { generateVideo, generateImage } from "../services/aiService";
import VideoPlayer from "./VideoPlayer";
import TTSButton from "./TTSButton";
import LiveVoiceChat from "./LiveVoiceChat";

interface Message {
  role: 'user' | 'model';
  text: string;
  groundingChunks?: any[];
  fileUrl?: string;
  fileName?: string;
  videoUrl?: string;
  imageUrl?: string;
}

interface ChatbotProps {
  user?: any;
}

export default function Chatbot({ user }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hello! I am your KROME AI assistant. How can I help you with your training or nutrition today?' }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usageCount, setUsageCount] = useState(() => {
    const saved = safeStorage.getItem('chatbot_usage');
    return saved ? parseInt(saved) : 0;
  });
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkAccess = () => {
    if (!user && usageCount >= 1) {
      setMessages(prev => [...prev, { role: 'model', text: 'You have reached your limit for free AI features. Please log in to continue using uploads, downloads, video, or image generation.' }]);
      return false;
    }
    return true;
  };

  const incrementUsage = () => {
    if (!user) {
      const newCount = usageCount + 1;
      setUsageCount(newCount);
      safeStorage.setItem('chatbot_usage', newCount.toString());
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!checkAccess()) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.filename) {
        setMessages(prev => [...prev, { role: 'user', text: `Uploaded file: ${file.name}`, fileUrl: `/api/files/${data.filename}`, fileName: file.name }]);
        incrementUsage();
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const generatePDF = (content: string, fileName: string) => {
    const doc = new jsPDF();
    doc.text(content, 10, 10);
    doc.save(`${fileName}.pdf`);
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText("");
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

      try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      const chat = ai.chats.create({
        model: model,
        config: {
          systemInstruction: `You are a helpful, knowledgeable, and motivating AI assistant for KROME Sports Performance. You specialize in elite sports performance training, strength and conditioning, mobility, and nutrition. Your tone is professional, encouraging, and focused on helping athletes reach their potential. Keep responses concise and actionable where possible.

CRITICAL INSTRUCTIONS FOR TONE AND LENGTH:
- Keep your responses concise, to the point, and highly actionable.
- Maintain a professional but conversational tone.
- Avoid overly long paragraphs or unnecessary fluff.
- Use short bullet points for readability where appropriate.
- Deliver quality information quickly.

If a user asks to generate a PDF for a workout or nutrition plan, call the 'generatePDF' tool.

If a user asks about scheduling a consultation, provide the following information:
1. Website: Go to kromesport.com and click on the "Get Started" or "Contact Us" button to fill out an athlete profile.
2. KROME App: Schedule through the KROME Sports Performance App.
3. Direct Contact: Email info@kromesport.com to request a 1-on-1 performance consultation.

Explain what to expect:
- Performance Audit: Review current training load and nutritional habits.
- Goal Setting: Map out a 10–12 week timeline.
- Custom Blueprint: Identify the KROME program that fits your needs.`,
          tools: [
            {
              functionDeclarations: [{
                name: 'generatePDF',
                description: 'Generate a downloadable PDF for a workout or nutrition plan',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    content: { type: Type.STRING, description: 'The content of the PDF' },
                    fileName: { type: Type.STRING, description: 'The name of the PDF file' }
                  },
                  required: ['content', 'fileName']
                }
              }]
            }
          ]
        },
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }))
      });

      const result = await chat.sendMessage({ message: userMessage });
      
      // Handle tool calls
      if (result.functionCalls) {
        for (const call of result.functionCalls) {
          if (call.name === 'generatePDF') {
            if (!checkAccess()) continue;
            const { content, fileName } = call.args as any;
            generatePDF(content, fileName);
            setMessages(prev => [...prev, { role: 'model', text: `I have generated the PDF: ${fileName}.pdf` }]);
            incrementUsage();
          }
        }
      } else {
        const responseText = result.text;
        const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;

        setMessages(prev => [...prev, { 
          role: 'model', 
          text: responseText || "I'm sorry, I couldn't generate a response.",
          groundingChunks 
        }]);
        
        // Notify user
        if (Notification.permission === "granted") {
          new Notification("KROME Assistant", { body: "I have a new response for you!" });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I apologize, but I encountered an error. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gold rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] hover:scale-110 transition-all group"
          >
            <MessageSquare className="w-6 h-6 text-black group-hover:text-white transition-colors" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : '600px',
              width: isMinimized ? '300px' : '380px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden transition-all duration-300`}
          >
            {/* Header */}
            <div className="p-4 bg-zinc-950 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 gold-gradient rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-xs">AI</span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">KROME Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-white/50 uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setShowVoiceChat(true)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-white/50 hover:text-white transition-colors"
                  title="Voice Chat"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-white/50 hover:text-white transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/20">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed relative group ${
                          msg.role === 'user' 
                            ? 'bg-gold text-black rounded-tr-none font-medium' 
                            : 'bg-zinc-800 text-white/90 rounded-tl-none border border-white/5'
                        }`}
                      >
                        {msg.text}
                        {msg.role === 'model' && (
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <TTSButton text={msg.text} />
                          </div>
                        )}
                        {msg.videoUrl && (
                          <div className="mt-2">
                            <VideoPlayer uri={msg.videoUrl} />
                          </div>
                        )}
                        {msg.imageUrl && (
                          <div className="mt-2">
                            <img src={msg.imageUrl} alt="Generated" className="rounded-lg" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        {msg.fileUrl && (
                          <a href={msg.fileUrl} download={msg.fileName} className="flex items-center gap-2 mt-2 text-xs text-gold hover:underline">
                            <Download className="w-4 h-4" />
                            {msg.fileName}
                          </a>
                        )}
                        {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                          <div className="mt-2 text-[10px] text-white/50 border-t border-white/10 pt-2">
                            <p className="font-bold mb-1 uppercase tracking-wider">Sources:</p>
                            {msg.groundingChunks.map((chunk, i) => (
                              <a key={i} href={chunk.web?.uri} target="_blank" rel="noopener noreferrer" className="block hover:text-gold truncate">
                                • {chunk.web?.title || chunk.web?.uri}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-zinc-800 rounded-2xl rounded-tl-none p-3 border border-white/5 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-gold animate-spin" />
                        <span className="text-xs text-white/50">Thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-zinc-950 border-t border-white/5">
                  <div className="relative">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-colors"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask about training, nutrition..."
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-sm text-white focus:outline-none focus:border-gold/50 transition-colors placeholder:text-white/20"
                      disabled={isLoading}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputText.trim() || isLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gold/10 hover:bg-gold text-gold hover:text-black rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-[10px] text-center text-white/20 mt-2">
                    AI can make mistakes. Check important info.
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showVoiceChat && (
          <LiveVoiceChat 
            onClose={() => setShowVoiceChat(false)} 
            agentName="KROME Assistant"
            systemInstruction="You are a helpful, knowledgeable, and motivating AI assistant for KROME Sports Performance. You specialize in elite sports performance training, strength and conditioning, mobility, and nutrition. Your tone is professional, encouraging, and focused on helping athletes reach their potential. Keep responses concise and actionable where possible."
          />
        )}
      </AnimatePresence>
    </>
  );
}
