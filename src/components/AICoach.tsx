import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Loader2, Send, Sparkles, Video, X, User, Mic, Paperclip, ImageIcon, Download } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useNotifications } from '../context/NotificationContext';
import { generateImage, generateVideo } from '../services/aiService';

interface AICoachProps {
  userId: string;
  onClose?: () => void;
  initialTab?: 'ai' | 'admin';
}

import TTSButton from './TTSButton';
import LiveVoiceChat from './LiveVoiceChat';

interface Message {
  role: 'user' | 'coach';
  text: string;
  videoUrl?: string;
  id?: number;
  message?: string;
}

export default function AICoach({ userId, onClose, initialTab = 'ai' }: AICoachProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [adminMessages, setAdminMessages] = useState<Message[]>([]);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const { addNotification } = useNotifications();
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'ai' | 'admin'>(initialTab);

  useEffect(() => {
    if (activeTab === 'admin') {
      setHasNewMessage(false);
    }
  }, [activeTab]);

  const [adminId, setAdminId] = useState<number>(1);

  useEffect(() => {
    fetch('/api/admin/primary')
      .then(res => res.json())
      .then(data => {
        if (data && data.id) setAdminId(data.id);
      })
      .catch(err => console.error("Failed to fetch admin ID", err));
  }, []);

  const fetchAdminMessages = async () => {
    try {
      const response = await fetch(`${window.location.origin}/api/messages/${userId}`);
      if (response.ok) {
        const data = await response.json();
        const newAdminMessages = data.filter((m: any) => m.sender_id === adminId);
        if (newAdminMessages.length > adminMessages.length) {
          setHasNewMessage(true);
        }
        setAdminMessages(newAdminMessages);

        // Mark unread messages as read if the tab is active
        if (activeTab === 'admin') {
          const unreadIds = data
            .filter((m: any) => m.receiver_id === userId && m.is_read === 0)
            .map((m: any) => m.id);
            
          if (unreadIds.length > 0) {
            await Promise.all(unreadIds.map((id: number) => 
              fetch(`${window.location.origin}/api/messages/${id}/read`, { method: 'PATCH' })
            ));
          }
        }
      }
    } catch (err) {
      console.error("Failed to load admin messages", err);
    }
  };

  useEffect(() => {
    fetchAdminMessages();
    const interval = setInterval(fetchAdminMessages, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  const renderMessageContent = (text: string) => {
    if (text.startsWith('File: ')) {
      const [name, url] = text.split(' | URL: ');
      return <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gold hover:underline"><Download className="w-4 h-4"/> {name.replace('File: ', '')}</a>;
    }
    if (text.startsWith('Image: ')) {
      const [prompt, url] = text.split(' | URL: ');
      return <div className="space-y-1"><p>{prompt.replace('Image: ', '')}</p><img src={url} className="rounded-lg max-w-xs" /></div>;
    }
    if (text.startsWith('Video: ')) {
      const [prompt, url] = text.split(' | URL: ');
      return <div className="space-y-1"><p>{prompt.replace('Video: ', '')}</p><video src={url} className="rounded-lg max-w-xs" controls /></div>;
    }
    return text;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    try {
      await fetch(`${window.location.origin}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: userId, receiver_id: 1, message: text })
      });
      setInputMessage('');
      fetchAdminMessages();
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/files/upload', { method: 'POST', body: formData });
    const data = await res.json();
    sendMessage(`File: ${file.name} | URL: /api/files/${data.filename}`);
  };

  const handleGenerateImage = async () => {
    const text = window.prompt("Enter image prompt:");
    if (!text) return;
    try {
      setLoading(true);
      const imageUrl = await generateImage(text, '1:1');
      if (imageUrl) {
        sendMessage(`Image: ${text} | URL: ${imageUrl}`);
      }
    } catch (err) {
      console.error("Failed to generate image", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    const text = window.prompt("Enter video prompt:");
    if (!text) return;
    try {
      setLoading(true);
      const videoUrl = await generateVideo(text, '16:9');
      if (videoUrl) {
        sendMessage(`Video: ${text} | URL: ${videoUrl}`);
      }
    } catch (err) {
      console.error("Failed to generate video", err);
    } finally {
      setLoading(false);
    }
  };
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
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

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const clearVideo = () => {
    setVideoFile(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fetchContext = async () => {
    const [logsRes, progressRes, nutritionRes, metricsRes] = await Promise.all([
      fetch(`${window.location.origin}/api/workout-logs/${userId}`),
      fetch(`${window.location.origin}/api/program-progress/${userId}`),
      fetch(`${window.location.origin}/api/nutrition/${userId}`),
      fetch(`${window.location.origin}/api/metrics/${userId}`)
    ]);
    
    const logs = logsRes.ok ? await logsRes.json() : [];
    const progress = progressRes.ok ? await progressRes.json() : [];
    const nutrition = nutritionRes.ok ? await nutritionRes.json() : [];
    const metrics = metricsRes.ok ? await metricsRes.json() : {};
    
    return { logs, progress, nutrition, metrics };
  };

  const generateResponse = async (userMsg?: string) => {
    setLoading(true);
    try {
      const context = await fetchContext();
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      let systemPrompt = `
        You are an expert AI fitness coach for KROME Sports Performance.
        Analyze the following user data to provide highly personalized suggestions:
        
        Workout Logs: ${JSON.stringify(context.logs)}
        Program Progress: ${JSON.stringify(context.progress)}
        Nutrition Logs: ${JSON.stringify(context.nutrition)}
        User Metrics & Goals: ${JSON.stringify(context.metrics)}
        
        CRITICAL INSTRUCTIONS FOR TONE AND LENGTH:
        - Keep your responses concise, to the point, and highly actionable.
        - Maintain a professional but conversational and encouraging tone.
        - Avoid overly long paragraphs or unnecessary fluff.
        - Use short bullet points for readability where appropriate.
        - Deliver quality information quickly.
      `;

      if (!userMsg && messages.length === 0) {
         systemPrompt += `
         Provide:
         1. Constructive feedback on their recent workouts and program progress.
         2. Specific nutritional advice based on their logged meals and goals.
         3. A motivational message tailored to their specific goals.
         Keep this initial message to 3-4 short sentences or bullet points.
         `;
      }

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
        newParts.push({ text: "Please provide my initial coaching feedback." });
      }

      if (videoFile) {
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            resolve(base64String.split(',')[1]);
          };
          reader.readAsDataURL(videoFile);
        });

        newParts.push({
          inlineData: {
            data: base64Data,
            mimeType: videoFile.type,
          }
        });
        
        if (userMsg) {
           newParts.push({ text: "Please also analyze the provided video of my exercise form." });
        } else {
           newParts.push({ text: "Analyze the provided video of my exercise form. Identify any flaws and provide specific, actionable cues to improve my technique." });
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
          systemInstruction: systemPrompt
        }
      });

      const responseText = response.text || "Keep up the great work!";
      setMessages(prev => [...prev, { role: 'coach', text: responseText }]);
      
      if (userMsg || videoFile) {
         clearVideo();
      }
      
      // Notify user
      if (Notification.permission === "granted") {
        new Notification("KROME Assistant", { body: "I have a new response for you!" });
      }

    } catch (error) {
      console.error("Error getting coach feedback:", error);
      setMessages(prev => [...prev, { role: 'coach', text: "I'm having trouble analyzing your progress right now. Keep pushing!" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !videoFile) return;
    
    addNotification({
      title: 'Message Sent',
      message: 'Your message has been sent to the coach.',
      type: 'info'
    });
    
    const msg = inputMessage.trim();
    if (msg) {
      setMessages(prev => [...prev, { role: 'user', text: msg }]);
    } else if (videoFile) {
      setMessages(prev => [...prev, { role: 'user', text: "Please analyze this video." }]);
    }
    
    setInputMessage('');
    await generateResponse(msg);
  };

  useEffect(() => {
    if (messages.length === 0) {
      generateResponse();
    }
    
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <div className="bg-zinc-900 border border-gold/20 rounded-3xl p-6 md:p-8 space-y-6 relative shadow-2xl max-w-md mx-auto w-full flex flex-col max-h-[90vh]">
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      
      <div className="flex flex-col items-center text-center gap-3 shrink-0">
        <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center text-gold shadow-[0_0_15px_rgba(255,215,0,0.2)]">
          <Bot className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-2xl font-black uppercase italic text-white">AI <span className="text-gold">Coach</span></h3>
          <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Personalized Insights</p>
        </div>
        <button 
          onClick={() => setShowVoiceChat(true)}
          className="absolute top-4 left-4 w-8 h-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors z-10"
          title="Start Voice Chat"
        >
          <Mic className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest ${activeTab === 'ai' ? 'bg-gold text-black' : 'bg-zinc-800 text-white'}`}
        >
          AI Coach
        </button>
        <button 
          onClick={() => setActiveTab('admin')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest relative ${activeTab === 'admin' ? 'bg-gold text-black' : 'bg-zinc-800 text-white'}`}
        >
          Admin Chat
          {hasNewMessage && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 min-h-[200px]">
        {activeTab === 'ai' ? messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-zinc-800 text-white' : 'bg-gold/20 text-gold'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div 
              className={`p-3 rounded-2xl text-sm whitespace-pre-wrap shadow-md relative group ${msg.role === 'user' ? 'bg-zinc-800 text-white rounded-tr-sm' : 'bg-zinc-900/80 border border-gold/10 text-white/90 rounded-tl-sm'}`}
            >
              {msg.text}
              {msg.videoUrl && (
                <div className="mt-3 rounded-xl overflow-hidden border border-gold/20">
                  <video src={msg.videoUrl} className="w-full" controls />
                </div>
              )}
              {msg.role === 'coach' && !msg.videoUrl && (
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <TTSButton text={msg.text} />
                </div>
              )}
            </div>
          </div>
        )) : adminMessages.map((msg: any) => (
          <div key={msg.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gold/20 text-gold">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl text-sm shadow-md bg-zinc-900/80 border border-gold/10 text-white/90 rounded-tl-sm">
              {renderMessageContent(msg.message || '')}
              <p className="text-[10px] mt-1 opacity-70">{msg.sender_id === 1 ? 'Received' : 'Sent'} at {new Date(msg.created_at).toLocaleString()}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl bg-zinc-900/80 border border-gold/10 text-white/80 rounded-tl-sm shadow-md flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-gold" />
              <span className="text-xs text-white/50">Analyzing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="pt-2 space-y-3 shrink-0">
        {videoPreview ? (
          <div className="relative rounded-xl overflow-hidden bg-black/50 border border-white/10">
            <video src={videoPreview} className="w-full max-h-32 object-contain" controls />
            <button 
              onClick={clearVideo}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="hidden">
            <input 
              type="file" 
              accept="video/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleVideoChange}
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          {activeTab === 'ai' && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-white/5 hover:bg-white/10 transition-colors rounded-xl text-white/60 hover:text-white border border-dashed border-white/20"
              title="Upload Video for Form Analysis"
            >
              <Video className="w-5 h-5" />
            </button>
          )}
          {activeTab === 'admin' && (
            <>
              <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="p-3 text-white/60 hover:text-white disabled:opacity-50"><Paperclip className="w-5 h-5" /></button>
              <button onClick={handleGenerateImage} disabled={loading} className="p-3 text-white/60 hover:text-white disabled:opacity-50"><ImageIcon className="w-5 h-5" /></button>
              <button onClick={handleGenerateVideo} disabled={loading} className="p-3 text-white/60 hover:text-white disabled:opacity-50"><Video className="w-5 h-5" /></button>
            </>
          )}
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                activeTab === 'ai' ? handleSendMessage() : sendMessage(inputMessage);
              }
            }}
            disabled={loading}
            placeholder={activeTab === 'ai' ? "Ask your coach..." : "Type a message..."}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold placeholder:text-white/30 disabled:opacity-50"
          />
          <button 
            onClick={() => activeTab === 'ai' ? handleSendMessage() : sendMessage(inputMessage)}
            disabled={loading || (!inputMessage.trim() && !videoFile)}
            className="p-3 bg-gold hover:bg-yellow-400 text-black transition-colors rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {showVoiceChat && (
          <LiveVoiceChat 
            onClose={() => setShowVoiceChat(false)} 
            agentName="AI Coach"
            systemInstruction="You are an elite AI fitness coach for KROME Sports Performance. Your goal is to help athletes reach their peak performance. You specialize in strength and conditioning, mobility, and sports nutrition. Keep your responses concise, to the point, and highly actionable. Maintain a professional but conversational and encouraging tone."
          />
        )}
      </AnimatePresence>
    </div>
  );
}
