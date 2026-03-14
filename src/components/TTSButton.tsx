import { safeStorage } from '../utils/storage';
import React, { useState, useRef } from 'react';
import { Volume2, Loader2, Square } from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';

interface TTSButtonProps {
  text: string;
  className?: string;
}

export default function TTSButton({ text, className = '' }: TTSButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const playAudio = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (!text.trim()) return;

    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (base64Audio) {
        // Decode base64 to ArrayBuffer
        const binaryString = window.atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Initialize AudioContext
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        const audioCtx = audioContextRef.current;
        
        // The API returns raw PCM 16-bit 24kHz mono. 
        // We need to convert it to Float32 for Web Audio API.
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768.0;
        }

        const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
        audioBuffer.getChannelData(0).set(float32Array);

        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        
        source.onended = () => {
          setIsPlaying(false);
        };

        sourceNodeRef.current = source;
        source.start();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("TTS Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={playAudio}
      disabled={isLoading}
      className={`p-1.5 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center ${className}`}
      title={isPlaying ? "Stop audio" : "Read aloud"}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-gold" />
      ) : isPlaying ? (
        <Square className="w-4 h-4 text-gold fill-gold" />
      ) : (
        <Volume2 className="w-4 h-4 text-white/60 hover:text-gold" />
      )}
    </button>
  );
}
