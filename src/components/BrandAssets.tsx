import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Image as ImageIcon, Sparkles, Loader2, ChevronLeft } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface BrandAssetsProps {
  onBack: () => void;
}

export default function BrandAssets({ onBack }: BrandAssetsProps) {
  const [generating, setGenerating] = useState<string | null>(null);
  const [assets, setAssets] = useState<{
    icon?: string;
    splash?: string;
  }>({});

  const generateAsset = async (type: 'icon' | 'splash') => {
    setGenerating(type);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const prompt = type === 'icon' 
        ? "A high-resolution, professional app icon for an elite fitness brand called KROME. The icon features a bold, stylized letter 'K' in a premium gold gradient on a deep matte black background. The design is minimalist, modern, and powerful. 1024x1024 resolution, centered composition."
        : "A high-resolution, professional splash screen for a fitness app called KROME. Deep matte black background with subtle carbon fiber textures. In the center, a large, glowing gold 'K' logo. Below the logo, the text 'KROME SPORTS PERFORMANCE' in a clean, modern, gold sans-serif font. Premium, cinematic, and elite look. 1080x1920 resolution.";

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          imageConfig: {
            aspectRatio: type === 'icon' ? "1:1" : "9:16",
            imageSize: "1K"
          }
        }
      });

      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        setAssets(prev => ({ ...prev, [type]: imageUrl }));
      }
    } catch (error) {
      console.error('Error generating asset:', error);
    } finally {
      setGenerating(null);
    }
  };

  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">Brand Assets</h2>
          <p className="text-xs font-bold uppercase tracking-widest text-gold">App Store Assets Generator</p>
        </div>
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Tools
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* App Icon */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold uppercase italic">App Icon</h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">1024 x 1024 PNG</p>
              </div>
            </div>
            {assets.icon && (
              <button 
                onClick={() => downloadImage(assets.icon!, 'krome-icon.png')}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="aspect-square rounded-2xl bg-black border border-white/5 flex items-center justify-center overflow-hidden relative group">
            {assets.icon ? (
              <img src={assets.icon} alt="App Icon" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center space-y-2">
                <ImageIcon className="w-12 h-12 text-white/10 mx-auto" />
                <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">No Icon Generated</p>
              </div>
            )}
            {generating === 'icon' && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
              </div>
            )}
          </div>

          <button
            onClick={() => generateAsset('icon')}
            disabled={!!generating}
            className="w-full py-4 rounded-2xl gold-gradient text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {generating === 'icon' ? 'Generating...' : 'Generate Icon'}
          </button>
        </div>

        {/* Splash Screen */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold uppercase italic">Splash Screen</h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">1080 x 1920 PNG</p>
              </div>
            </div>
            {assets.splash && (
              <button 
                onClick={() => downloadImage(assets.splash!, 'krome-splash.png')}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="aspect-[9/16] max-h-[400px] mx-auto rounded-2xl bg-black border border-white/5 flex items-center justify-center overflow-hidden relative group">
            {assets.splash ? (
              <img src={assets.splash} alt="Splash Screen" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center space-y-2">
                <Sparkles className="w-12 h-12 text-white/10 mx-auto" />
                <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">No Splash Generated</p>
              </div>
            )}
            {generating === 'splash' && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
              </div>
            )}
          </div>

          <button
            onClick={() => generateAsset('splash')}
            disabled={!!generating}
            className="w-full py-4 rounded-2xl gold-gradient text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {generating === 'splash' ? 'Generating...' : 'Generate Splash'}
          </button>
        </div>
      </div>

      <div className="bg-gold/5 border border-gold/20 rounded-3xl p-8">
        <h3 className="text-gold font-black uppercase italic mb-4">Capacitor Integration Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
          <div className="space-y-4">
            <p className="text-white/60 leading-relaxed">
              Once you have these assets, you can use the <span className="text-gold">@capacitor/assets</span> tool to automatically generate all required sizes for iOS and Android.
            </p>
            <div className="bg-black/40 p-4 rounded-xl font-mono text-white/40">
              npx @capacitor/assets generate
            </div>
          </div>
          <ul className="space-y-2 text-white/60">
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-gold" />
              Place icon in <code className="text-gold">assets/icon.png</code>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-gold" />
              Place splash in <code className="text-gold">assets/splash.png</code>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-gold" />
              Run the generate command
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
