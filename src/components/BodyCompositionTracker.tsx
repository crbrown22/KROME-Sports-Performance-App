import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GoogleGenAI, Type } from '@google/genai';
import { Camera, Upload, Loader2, ChevronLeft, Trash2, X, Sparkles } from 'lucide-react';

interface BodyCompositionTrackerProps {
  userId: string;
  onBack: () => void;
  isAdminView?: boolean;
}

export default function BodyCompositionTracker({ userId, onBack, isAdminView = false }: BodyCompositionTrackerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [nutrition, setNutrition] = useState<any[]>([]);

  useEffect(() => {
    fetchLogs();
    fetchUserData();
  }, [userId]);

  const fetchLogs = async () => {
    const response = await fetch(`/api/body-composition/${userId}`);
    if (response.ok) {
      const data = await response.json();
      setLogs(data);
    }
  };

  const deleteLog = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const response = await fetch(`/api/body-composition/${id}`, { method: 'DELETE' });
    if (response.ok) {
      fetchLogs();
      if (selectedLog?.id === id) setSelectedLog(null);
    }
  };

  const fetchUserData = async () => {
    try {
      const [metricsRes, nutritionRes] = await Promise.all([
        fetch(`/api/metrics/${userId}`),
        fetch(`/api/nutrition/${userId}`)
      ]);
      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (nutritionRes.ok) setNutrition(await nutritionRes.json());
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('File selected:', file);
    if (file) {
      setMimeType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('File read complete, setting image state');
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      console.log('No file selected');
    }
  };

  const analyzeImage = async () => {
    console.log('Analyze button clicked');
    if (!image) {
      console.log('No image found, cannot analyze');
      return;
    }
    setLoading(true);
    try {
      console.log('Initializing AI...');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const base64Data = image.split(',')[1];
      
      const prompt = `Analyze this body composition image. 
      
      Here is the user's current body metrics data: ${JSON.stringify(metrics)}
      Here is the user's recent nutrition logs: ${JSON.stringify(nutrition.slice(-10))}
      
      Provide a highly personalized scientific assessment based on this data. Estimate body fat percentage if possible, and suggest specific, actionable adjustments for the user's training program and nutrition plan.
      
      CRITICAL INSTRUCTIONS FOR TONE AND LENGTH:
      - Keep your responses concise, to the point, and highly actionable.
      - Maintain a professional but conversational and encouraging tone.
      - Avoid overly long paragraphs or unnecessary fluff.
      - Use short bullet points for readability where appropriate.
      - Deliver quality information quickly.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      console.log('Response received:', response);
      const analysisText = response.text || 'No analysis available.';
      setAnalysis(analysisText);

      // Save to database
      await fetch(`/api/body-composition/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: image,
          analysis: analysisText,
          feedback: 'Pending trainer review',
        }),
      });
      fetchLogs();
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysis('Error analyzing image: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-black text-white py-24 px-6"
    >
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-white/50 hover:text-gold transition-colors mb-12"
        >
          <ChevronLeft className="w-5 h-5" /> Back
        </button>

        <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-8">
          Body <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent">Composition</span>
        </h1>

        {!isAdminView && (
          <div className="flex flex-col gap-8 mb-16">
            <div className="bg-zinc-900 p-8 rounded-3xl border border-white/10 w-full">
              <h2 className="text-xl font-bold uppercase italic mb-6">Upload Image</h2>
              
              {/* Hidden file input */}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="hidden" 
                id="file-upload"
              />
              
              {/* Custom label/button for file input */}
              <label 
                htmlFor="file-upload"
                className="cursor-pointer w-full bg-zinc-800 text-white font-bold py-3 rounded-xl hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 mb-4"
              >
                <Upload className="w-5 h-5" /> Select Image
              </label>

              {image && <img src={image} alt="Preview" className="w-full max-h-96 object-contain rounded-xl mb-4" />}
              
              <button 
                onClick={analyzeImage}
                disabled={!image || loading}
                className="w-full bg-gold text-black font-bold py-3 rounded-xl hover:bg-gold/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Camera />} Analyze
              </button>
            </div>

            <div className="bg-zinc-900 p-8 rounded-3xl border border-white/10 w-full">
              <h2 className="text-xl font-bold uppercase italic mb-6">Analysis</h2>
              <p className="text-white/60 whitespace-pre-wrap">{analysis || 'Upload an image to get started.'}</p>
            </div>
          </div>
        )}

        <h2 className="text-3xl font-black uppercase italic mb-8">Progress History</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {logs.map((log) => (
            <div 
              key={log.id} 
              className="bg-zinc-900 p-4 rounded-xl border border-white/10 cursor-pointer hover:border-gold transition-colors relative group"
              onClick={() => setSelectedLog(log)}
            >
              <button 
                onClick={(e) => deleteLog(e, log.id)}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <img src={log.image_url} alt="Progress" className="w-full rounded-lg mb-2" />
              <p className="text-xs text-white/40">{new Date(log.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>

        {selectedLog && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-gold/20 rounded-3xl p-6 md:p-8 max-w-md w-full relative shadow-2xl mx-auto"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedLog(null)} 
                className="absolute top-4 right-4 w-8 h-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center text-gold shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase italic text-white">AI <span className="text-gold">Analysis</span></h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">From {new Date(selectedLog.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-4">
                <img src={selectedLog.image_url} alt="Progress" className="w-full rounded-xl object-contain max-h-48 bg-black/50 border border-white/10" />
                <div className="prose prose-invert prose-sm max-h-[250px] overflow-y-auto custom-scrollbar pr-2 bg-black/20 p-4 rounded-2xl border border-white/5">
                  <p className="text-white/80 leading-relaxed whitespace-pre-wrap text-sm">
                    {selectedLog.analysis}
                  </p>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="w-full py-3 bg-white/10 hover:bg-white/20 text-white transition-colors rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
