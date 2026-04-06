import { safeStorage } from '../utils/storage';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Video, Loader2, AlertCircle } from 'lucide-react';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import Markdown from 'react-markdown';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function VideoAnalyzer({ userId, isOwnProfile = true }: { userId: string, isOwnProfile?: boolean }) {
  const [video, setVideo] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideo(e.target.files[0]);
      setAnalysis('');
      setError('');
    }
  };

  const analyzeVideo = async () => {
    if (!video) return;
    
    // Check if API key is selected
    if (window.aistudio) {
      if (!(await window.aistudio.hasSelectedApiKey())) {
        await window.aistudio.openSelectKey();
      }
    } else {
      console.warn("aistudio not available");
    }

    setLoading(true);
    setError('');
    setAnalysis('');

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(video);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
      });
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: video.type,
                data: base64Data,
              },
            },
            {
              text: "You are an expert AI fitness coach for KROME Sports Performance. Analyze this workout video for proper form and technique. Provide specific, actionable feedback on how to improve. Use Markdown to structure your response with sections like 'Strengths', 'Areas for Improvement', and 'Actionable Tips'. Keep your tone encouraging, professional, and focused on athletic performance. CRITICAL: Keep your response concise, to the point, and highly actionable. Avoid overly long paragraphs or unnecessary fluff. Use short bullet points for readability. Deliver quality information quickly.",
            },
          ],
        },
        config: { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } },
      });

      setAnalysis(response.text || 'No analysis generated.');
    } catch (err) {
      console.error("Analysis error:", err);
      setError('Failed to analyze video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl p-6">
      <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2 mb-6">
        <Video className="w-5 h-5 text-gold" /> Form & Technique Analysis
      </h2>
      
      {isOwnProfile && (
        <div className="space-y-4">
          <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" id="video-upload" />
          <label htmlFor="video-upload" className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-gold transition-colors">
            <Upload className="w-6 h-6 text-gold" />
            <span className="text-sm font-bold uppercase">{video ? video.name : 'Upload Workout Video'}</span>
          </label>
          
          {video && (
            <button 
              onClick={analyzeVideo} 
              disabled={loading}
              className="w-full btn-gold flex items-center justify-center gap-2 py-3"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Analyze Technique'}
            </button>
          )}
        </div>
      )}
      
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm p-4 bg-red-500/10 rounded-xl">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
        
        {analysis && (
          <div className="p-6 bg-white/5 rounded-xl border border-white/10 mt-6">
            <h3 className="text-sm font-bold uppercase text-gold mb-4">Analysis Feedback:</h3>
            <div className="markdown-body text-sm text-white/80 leading-relaxed space-y-4">
              <Markdown>{analysis}</Markdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
