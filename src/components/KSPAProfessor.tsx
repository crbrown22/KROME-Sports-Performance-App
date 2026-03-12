import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Loader2, Send, Sparkles, Video, X, User, BookOpen, GraduationCap, Download, Mic } from 'lucide-react';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { jsPDF } from 'jspdf';
import { generateVideo, generateImage } from '../services/aiService';
import VideoPlayer from './VideoPlayer';
import TTSButton from './TTSButton';
import LiveVoiceChat from './LiveVoiceChat';

interface Message {
  role: 'user' | 'coach';
  text: string;
  fileUrl?: string;
  fileName?: string;
  videoUrl?: string;
  imageUrl?: string;
}

export default function KSPAProfessor() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const url = URL.createObjectURL(file);
      setMediaPreview(url);
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
      setMediaPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generatePDF = (content: string, fileName: string) => {
    const doc = new jsPDF();
    doc.text(content, 10, 10);
    doc.save(`${fileName}.pdf`);
  };

  const generateResponse = async (userMsg?: string) => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      let systemPrompt = `
        You are Professor KROME, the lead instructor at KSPA (KROME Sports Performance Academy). 
        You hold a Ph.D. in Kinesiology and Sports Science/Medicine. 
        Your goal is to educate student athletes and coaches, helping them become elite strength and conditioning coaches. 
        You operate in an online academic environment. 
        You know everything about the Sports Performance side of KROME Sports Performance, as well as the latest industry trends in sports science, biomechanics, and fitness. 
        Provide detailed, scientifically-backed, yet accessible explanations. Act as a mentor and professor.
        
        CRITICAL INSTRUCTIONS FOR TONE AND LENGTH:
        - Keep your responses concise, to the point, and highly actionable.
        - Maintain a professional but conversational and encouraging tone.
        - Avoid overly long paragraphs or unnecessary fluff.
        - Use short bullet points for readability where appropriate.
        - Deliver quality information quickly.
        
        If a user asks to generate a PDF for a lesson, workout, or study guide, call the 'generatePDF' tool.
        If a user asks to generate a video demonstrating a concept, call the 'generateVideo' tool.
        If a user asks to generate an image illustrating a concept, call the 'generateImage' tool.
      `;

      if (!userMsg && messages.length === 0) {
         systemPrompt += `
         Start by welcoming the student to the KSPA Lab. Introduce yourself briefly and ask what sports science, biomechanics, or strength and conditioning topic they would like to explore today. Keep this introduction to 2-3 short sentences.
         `;
      }

      const generatePDFFunction: FunctionDeclaration = {
        name: 'generatePDF',
        description: 'Generate a downloadable PDF for a lesson, study guide, or workout plan',
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

      let contents: any[] = [];
      
      // Add history
      messages.forEach(msg => {
        contents.push({
          role: msg.role === 'coach' ? 'model' : 'user',
          parts: [{ text: msg.text }]
        });
      });

      // Add new message
      let newParts: any[] = [];
      
      if (userMsg) {
        newParts.push({ text: userMsg });
      } else if (messages.length === 0) {
        newParts.push({ text: "Hello Professor, I'm ready to learn." });
      }

      if (mediaFile) {
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            resolve(base64String.split(',')[1]);
          };
          reader.readAsDataURL(mediaFile);
        });

        newParts.push({
          inlineData: {
            data: base64Data,
            mimeType: mediaFile.type,
          }
        });
        
        if (userMsg) {
           newParts.push({ text: "Please also analyze this media from a kinesiology and biomechanics perspective." });
        } else {
           newParts.push({ text: "Analyze this media from a kinesiology and biomechanics perspective. Identify any flaws and provide specific, actionable academic cues to improve technique." });
        }
      }

      contents.push({
        role: 'user',
        parts: newParts
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          tools: [
            { functionDeclarations: [generatePDFFunction, generateVideoFunction, generateImageFunction] }
          ]
        }
      });

      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          if (call.name === 'generatePDF') {
            const { content, fileName } = call.args as any;
            generatePDF(content, fileName);
            setMessages(prev => [...prev, { role: 'coach', text: `I have generated the PDF: ${fileName}.pdf` }]);
          } else if (call.name === 'generateVideo') {
            const { prompt, aspectRatio } = call.args as any;
            setMessages(prev => [...prev, { role: 'coach', text: `Generating video for: ${prompt}...` }]);
            try {
              const videoUrl = await generateVideo(prompt, aspectRatio);
              setMessages(prev => [...prev, { role: 'coach', text: `Here is the video demonstration:`, videoUrl }]);
            } catch (e) {
              setMessages(prev => [...prev, { role: 'coach', text: `Error generating video: ${e}` }]);
            }
          } else if (call.name === 'generateImage') {
            const { prompt, aspectRatio } = call.args as any;
            setMessages(prev => [...prev, { role: 'coach', text: `Generating image for: ${prompt}...` }]);
            try {
              const imageUrl = await generateImage(prompt, aspectRatio);
              setMessages(prev => [...prev, { role: 'coach', text: `Here is the illustration:`, imageUrl }]);
            } catch (e) {
              setMessages(prev => [...prev, { role: 'coach', text: `Error generating image: ${e}` }]);
            }
          }
        }
      } else {
        const responseText = response.text || "Class dismissed for now. Keep studying!";
        setMessages(prev => [...prev, { role: 'coach', text: responseText }]);
      }
      
      if (userMsg || mediaFile) {
         clearMedia();
      }

    } catch (error) {
      console.error("Error getting professor feedback:", error);
      setMessages(prev => [...prev, { role: 'coach', text: "I'm having trouble accessing the lab's database right now. Please try again shortly." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !mediaFile) return;
    
    const msg = inputMessage.trim();
    if (msg) {
      setMessages(prev => [...prev, { role: 'user', text: msg }]);
    } else if (mediaFile) {
      setMessages(prev => [...prev, { role: 'user', text: "Please analyze this." }]);
    }
    
    setInputMessage('');
    await generateResponse(msg);
  };

  useEffect(() => {
    if (messages.length === 0) {
      generateResponse();
    }
    
    return () => {
      if (mediaPreview) {
        URL.revokeObjectURL(mediaPreview);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="bg-zinc-900/80 border border-gold/20 rounded-3xl p-6 md:p-8 space-y-6 relative shadow-2xl w-full flex flex-col h-[700px]">
        
        <div className="flex items-center gap-4 shrink-0 border-b border-white/10 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center text-gold shadow-[0_0_15px_rgba(255,215,0,0.2)]">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase italic text-white flex items-center gap-2">
              Professor <span className="text-gold">KROME</span>
            </h3>
            <p className="text-xs text-white/60 uppercase tracking-widest mt-1">Ph.D. Kinesiology & Sports Science</p>
            <p className="text-[10px] text-gold uppercase tracking-widest mt-1">KROME Sports Performance Academy (KSPA)</p>
          </div>
          <div className="ml-auto">
            <button 
              onClick={() => setShowVoiceChat(true)}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-colors flex items-center gap-2"
              title="Start Voice Chat"
            >
              <Mic className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Voice Chat</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-zinc-800 text-white' : 'bg-gold/20 text-gold'}`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-md relative group ${msg.role === 'user' ? 'bg-zinc-800 text-white rounded-tr-sm' : 'bg-zinc-900/80 border border-gold/10 text-white/90 rounded-tl-sm'}`}>
                {msg.text}
                {msg.role === 'coach' && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-gold/20 text-gold flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-gold/10 text-white/80 rounded-tl-sm shadow-md flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-gold" />
                <span className="text-sm text-white/50 italic">Professor KROME is formulating a response...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="pt-4 border-t border-white/10 space-y-4 shrink-0">
          {mediaPreview ? (
            <div className="relative rounded-xl overflow-hidden bg-black/50 border border-white/10 inline-block">
              {mediaFile?.type.startsWith('video/') ? (
                <video src={mediaPreview} className="h-32 object-contain" controls />
              ) : (
                <img src={mediaPreview} className="h-32 object-contain" alt="Upload preview" />
              )}
              <button 
                onClick={clearMedia}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden">
              <input 
                type="file" 
                accept="video/*,image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleMediaChange}
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-4 bg-white/5 hover:bg-white/10 transition-colors rounded-xl text-white/60 hover:text-white border border-dashed border-white/20"
              title="Upload Media for Analysis"
            >
              <Video className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask Professor KROME a question..."
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-sm text-white outline-none focus:border-gold placeholder:text-white/30"
            />
            <button 
              onClick={handleSendMessage}
              disabled={loading || (!inputMessage.trim() && !mediaFile)}
              className="p-4 bg-gold hover:bg-yellow-400 text-black transition-colors rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold uppercase text-xs tracking-widest"
            >
              <span>Submit</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {showVoiceChat && (
          <LiveVoiceChat 
            onClose={() => setShowVoiceChat(false)} 
            agentName="Professor KROME"
            systemInstruction="You are Professor KROME, the lead instructor at KSPA (KROME Sports Performance Academy). You hold a Ph.D. in Kinesiology and Sports Science/Medicine. Your goal is to educate student athletes and coaches, helping them become elite strength and conditioning coaches. You operate in an online academic environment. You know everything about the Sports Performance side of KROME Sports Performance, as well as the latest industry trends in sports science, biomechanics, and fitness. Provide detailed, scientifically-backed, yet accessible explanations. Act as a mentor and professor. Keep your responses concise, to the point, and highly actionable. Maintain a professional but conversational and encouraging tone."
          />
        )}
      </AnimatePresence>
    </div>
  );
}
