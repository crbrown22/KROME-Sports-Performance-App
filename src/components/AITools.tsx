import { safeStorage } from '../utils/storage';
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Zap, Image as ImageIcon, Video, Loader2, Upload, Download, ChevronDown, ChevronUp, BookOpen, GraduationCap } from 'lucide-react';
import { generateVideo, generateImage } from '../services/aiService';
import { withRetry } from '../utils/retry';
import VideoItem from './VideoItem';
import KSPAProfessor from './KSPAProfessor';

interface GeneratedItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
}

interface AnalysisLog {
  id: string;
  videoUrl: string;
  analysis: string;
}

export default function AITools() {
  const [apiKeySelected, setApiKeySelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<GeneratedItem[]>([]);
  const [analysisLogs, setAnalysisLogs] = useState<AnalysisLog[]>([]);
  const [prompt, setPrompt] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'generation' | 'academy'>('academy');

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        setApiKeySelected(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setApiKeySelected(true);
    }
  };

  const handleGenerateVideo = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const videoUrl = await generateVideo(prompt, '16:9');
      setGeneratedItems(prev => [...prev, { id: Date.now().toString(), type: 'video', url: videoUrl, prompt }]);
      setPrompt('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const imageUrl = await generateImage(prompt, '1:1');
      if (imageUrl) {
        setGeneratedItems(prev => [...prev, { id: Date.now().toString(), type: 'image', url: imageUrl, prompt }]);
        setPrompt('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const analyzeVideo = async (videoUrl: string) => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: { parts: [{ text: 'Analyze this video and provide key information: ' + videoUrl }] }
      }));
      setAnalysisLogs(prev => [...prev, { id: Date.now().toString(), videoUrl, analysis: response.text || 'No analysis available' }]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!apiKeySelected) {
    return (
      <div className="p-8 text-center bg-zinc-900 rounded-3xl border border-white/10">
        <BookOpen className="w-16 h-16 text-gold mx-auto mb-6" />
        <h2 className="text-3xl font-black uppercase italic mb-4">AI Academy Tools</h2>
        <p className="mb-8 text-white/60">Please select a paid API key to access the KSP Academy AI tools.</p>
        <button onClick={handleSelectKey} className="btn-gold">Select API Key</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex gap-4 border-b border-white/10 pb-4">
        <button 
          onClick={() => setActiveTab('academy')}
          className={`px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest flex items-center gap-2 transition-colors ${activeTab === 'academy' ? 'bg-gold text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
        >
          <GraduationCap className="w-4 h-4" /> KSPA Professor
        </button>
        <button 
          onClick={() => setActiveTab('generation')}
          className={`px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest flex items-center gap-2 transition-colors ${activeTab === 'generation' ? 'bg-gold text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
        >
          <Zap className="w-4 h-4" /> Content Generation
        </button>
      </div>

      {activeTab === 'academy' ? (
        <KSPAProfessor />
      ) : (
        <div className="space-y-12">
          <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
            <h2 className="text-3xl font-black uppercase italic mb-2 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-gold" />
              Content Generation Lab
            </h2>
            <p className="text-white/60 mb-8">Welcome, trainer. Use these tools to generate and analyze sports performance content.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input 
                type="text" 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your fitness or sports performance concept..."
                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-gold outline-none"
              />
              <div className="flex gap-2">
                <button onClick={handleGenerateVideo} className="btn-gold flex-1" disabled={loading}>Generate Video</button>
                <button onClick={handleGenerateImage} className="btn-gold flex-1" disabled={loading}>Generate Image</button>
              </div>
              <div className="flex gap-2 col-span-2">
                <input 
                  type="text" 
                  placeholder="Paste video URL for analysis..."
                  className="flex-1 bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-gold outline-none"
                  id="video-analysis-url"
                />
                <button 
                  onClick={() => {
                    const url = (document.getElementById('video-analysis-url') as HTMLInputElement).value;
                    if (url) analyzeVideo(url);
                  }}
                  className="btn-gold" 
                  disabled={loading}
                >
                  Analyze Video
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {generatedItems.map(item => (
              item.type === 'video' ? (
                <VideoItem key={item.id} url={item.url} prompt={item.prompt} />
              ) : (
                <div key={item.id} className="bg-zinc-900 rounded-2xl p-4 border border-white/10">
                  <img src={item.url} alt={item.prompt} className="w-full h-40 object-cover rounded-xl mb-4" />
                  <p className="text-xs text-white/70 mb-4 line-clamp-2">{item.prompt}</p>
                  <div className="flex gap-2">
                    <a href={item.url} target="_blank" rel="noreferrer" className="flex-1 btn-outline-accent text-xs py-2">Open</a>
                    <a href={item.url} download className="btn-outline-accent text-xs py-2 px-3"><Download className="w-4 h-4" /></a>
                  </div>
                </div>
              )
            ))}
          </div>

          <div className="bg-zinc-900 rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Upload /> Video Analysis Logs</h3>
            {analysisLogs.map(log => (
              <div key={log.id} className="mb-4 border border-white/5 rounded-xl overflow-hidden">
                <button 
                  onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                  className="w-full p-4 flex justify-between items-center bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <span className="text-sm font-bold">Analysis of {log.videoUrl.substring(0, 20)}...</span>
                  {expandedLogId === log.id ? <ChevronUp /> : <ChevronDown />}
                </button>
                {expandedLogId === log.id && (
                  <div className="p-4 text-xs text-white/70 bg-black/20">{log.analysis}</div>
                )}
              </div>
            ))}
          </div>

          {loading && <div className="text-center p-8"><Loader2 className="animate-spin w-8 h-8 text-gold mx-auto" /></div>}
        </div>
      )}
    </div>
  );
}
