import { safeStorage } from '../utils/storage';
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Loader2, Minimize2, Maximize2, ShieldCheck, Paperclip, Download, Mic } from "lucide-react";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
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

interface AdminAssistantProps {
  kpiData?: any;
  users?: any[];
  leads?: any[];
  purchases?: any[];
}

export default function AdminAssistant({ kpiData, users, leads, purchases }: AdminAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Dashboard access verified. I am your KROME Executive Assistant. I can help you analyze client data, build programs, plan marketing campaigns, and manage operations. How can I assist you today?' }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [messages, isOpen, isMinimized]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText("");
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3.1-pro-preview"; // Using pro model for complex admin tasks
      
      const kpiContext = kpiData ? `\n\nCURRENT KPI DATA:\n${JSON.stringify(kpiData, null, 2)}` : '';
      const usersContext = users ? `\n\nUSERS DATA:\n${JSON.stringify(users.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}`, email: u.email, role: u.role })), null, 2)}` : '';
      const leadsContext = leads ? `\n\nLEADS DATA:\n${JSON.stringify(leads, null, 2)}` : '';
      const purchasesContext = purchases ? `\n\nPURCHASES DATA:\n${JSON.stringify(purchases, null, 2)}` : '';

      const sendMessageToAthleteFunction: FunctionDeclaration = {
        name: "sendMessageToAthlete",
        parameters: {
          type: Type.OBJECT,
          description: "Send a direct message or email to a specific athlete.",
          properties: {
            athleteId: {
              type: Type.STRING,
              description: "The ID of the athlete to send the message to.",
            },
            message: {
              type: Type.STRING,
              description: "The content of the message to send.",
            },
          },
          required: ["athleteId", "message"],
        },
      };

      const createMarketingCampaignFunction: FunctionDeclaration = {
        name: "createMarketingCampaign",
        parameters: {
          type: Type.OBJECT,
          description: "Create a new marketing campaign and draft its content.",
          properties: {
            campaignName: {
              type: Type.STRING,
              description: "The name of the marketing campaign.",
            },
            targetAudience: {
              type: Type.STRING,
              description: "The target audience for the campaign (e.g., 'New Leads', 'Inactive Users').",
            },
            content: {
              type: Type.STRING,
              description: "The drafted content or email copy for the campaign.",
            },
          },
          required: ["campaignName", "targetAudience", "content"],
        },
      };

      const generatePDFFunction: FunctionDeclaration = {
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
      };

      const generateVideoFunction: FunctionDeclaration = {
        name: 'generateVideo',
        description: 'Generate a video based on a prompt',
        parameters: {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING, description: 'The prompt for the video' },
            aspectRatio: { type: Type.STRING, description: 'The aspect ratio of the video, either 16:9 or 9:16' }
          },
          required: ['prompt', 'aspectRatio']
        }
      };

      const generateImageFunction: FunctionDeclaration = {
        name: 'generateImage',
        description: 'Generate an image based on a prompt',
        parameters: {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING, description: 'The prompt for the image' },
            aspectRatio: { type: Type.STRING, description: 'The aspect ratio of the image, e.g., 1:1, 16:9' }
          },
          required: ['prompt', 'aspectRatio']
        }
      };

      const chat = ai.chats.create({
        model: model,
        config: {
          systemInstruction: `You are a highly capable AI assistant for the admin and coaching staff of KROME Sports Performance. Your role is to help gather and track data, keep up with client information, help plan sales and marketing campaigns, build workout and nutrition programs, and communicate with athletes. You know the ins and outs of the company and how to ETL data quickly and efficiently to the admin. Your tone is professional, analytical, and highly efficient. You have access to all company data and can assist with any administrative, marketing, or coaching task. Provide actionable insights, structured data formats when requested, and strategic advice.
          
CRITICAL INSTRUCTIONS FOR TONE AND LENGTH:
- Keep your responses concise, to the point, and highly actionable.
- Maintain a professional but conversational tone.
- Avoid overly long paragraphs or unnecessary fluff.
- Use short bullet points for readability where appropriate.
- Deliver quality information quickly.${kpiContext}${usersContext}${leadsContext}${purchasesContext}`,
          tools: [
            { functionDeclarations: [sendMessageToAthleteFunction, createMarketingCampaignFunction, generatePDFFunction, generateVideoFunction, generateImageFunction] }
          ]
        },
        history: messages
          .filter((m, index) => !(index === 0 && m.role === 'model'))
          .map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          }))
      });

      const result = await chat.sendMessage({ message: userMessage });
      
      const functionCalls = result.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          if (call.name === 'sendMessageToAthlete') {
            const { athleteId, message } = call.args as any;
            try {
              await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sender_id: 'admin',
                  receiver_id: athleteId,
                  message: message
                })
              });
              const athlete = users?.find(u => u.id === athleteId || u.id.toString() === athleteId);
              const athleteName = athlete ? `${athlete.firstName} ${athlete.lastName}` : athleteId;
              setMessages(prev => [...prev, { 
                role: 'model', 
                text: `**Action Executed:** Sent message to ${athleteName}.\n\n*Message Content:*\n> ${message}` 
              }]);
            } catch (err) {
              console.error("Failed to send message", err);
              setMessages(prev => [...prev, { role: 'model', text: `Failed to send message to athlete: ${err}` }]);
            }
          } else if (call.name === 'createMarketingCampaign') {
            const { campaignName, targetAudience, content } = call.args as any;
            setMessages(prev => [...prev, { 
              role: 'model', 
              text: `**Action Executed:** Created Marketing Campaign: "${campaignName}"\n\n*Target Audience:* ${targetAudience}\n\n*Campaign Content:*\n> ${content}` 
            }]);
          } else if (call.name === 'generatePDF') {
            const { content, fileName } = call.args as any;
            generatePDF(content, fileName);
            setMessages(prev => [...prev, { role: 'model', text: `I have generated the PDF: ${fileName}.pdf` }]);
          } else if (call.name === 'generateVideo') {
            const { prompt, aspectRatio } = call.args as any;
            setMessages(prev => [...prev, { role: 'model', text: `Generating video for: ${prompt}...` }]);
            try {
              const videoUrl = await generateVideo(prompt, aspectRatio);
              setMessages(prev => [...prev, { role: 'model', text: `Video generated:`, videoUrl }]);
            } catch (e) {
              setMessages(prev => [...prev, { role: 'model', text: `Error generating video: ${e}` }]);
            }
          } else if (call.name === 'generateImage') {
            const { prompt, aspectRatio } = call.args as any;
            setMessages(prev => [...prev, { role: 'model', text: `Generating image for: ${prompt}...` }]);
            try {
              const imageUrl = await generateImage(prompt, aspectRatio);
              setMessages(prev => [...prev, { role: 'model', text: `Image generated:`, imageUrl }]);
            } catch (e) {
              setMessages(prev => [...prev, { role: 'model', text: `Error generating image: ${e}` }]);
            }
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
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { role: 'model', text: `I apologize, but I encountered an error: ${error.message || error}. Please try again later.` }]);
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
            className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/20 hover:scale-110 transition-transform group"
            title="Admin Assistant"
          >
            <ShieldCheck className="w-6 h-6 text-white" />
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
              height: isMinimized ? 'auto' : '650px',
              width: isMinimized ? '300px' : '450px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 left-6 z-50 bg-zinc-900 border border-blue-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300`}
          >
            {/* Header */}
            <div className="p-4 bg-zinc-950 border-b border-blue-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    Admin Assistant <ShieldCheck className="w-3 h-3 text-blue-400" />
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                    <span className="text-[10px] text-white/50 uppercase tracking-wider">System Ready</span>
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
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/40">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed relative group ${
                          msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-tr-none font-medium' 
                            : 'bg-zinc-800 text-white/90 rounded-tl-none border border-blue-500/20'
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
                          <a href={msg.fileUrl} download={msg.fileName} className="flex items-center gap-2 mt-2 text-xs text-blue-400 hover:underline">
                            <Download className="w-4 h-4" />
                            {msg.fileName}
                          </a>
                        )}
                        {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                          <div className="mt-2 text-[10px] text-white/50 border-t border-white/10 pt-2">
                            <p className="font-bold mb-1 uppercase tracking-wider">Sources:</p>
                            {msg.groundingChunks.map((chunk, i) => (
                              <a key={i} href={chunk.web?.uri} target="_blank" rel="noopener noreferrer" className="block hover:text-blue-400 truncate">
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
                      <div className="bg-zinc-800 rounded-2xl rounded-tl-none p-3 border border-blue-500/20 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                        <span className="text-xs text-white/50">Processing data...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-zinc-950 border-t border-blue-500/20">
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
                      placeholder="Command or query..."
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-white/20"
                      disabled={isLoading}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputText.trim() || isLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-[10px] text-center text-white/30 mt-2">
                    Admin Assistant has full system access. Use with discretion.
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
            agentName="Admin Assistant"
            systemInstruction="You are a highly capable AI assistant for the admin and coaching staff of KROME Sports Performance. Your role is to help gather and track data, keep up with client information, help plan sales and marketing campaigns, build workout and nutrition programs, and communicate with athletes. You know the ins and outs of the company and how to ETL data quickly and efficiently to the admin. Your tone is professional, analytical, and highly efficient. Keep your responses concise, to the point, and highly actionable."
          />
        )}
      </AnimatePresence>
    </>
  );
}
