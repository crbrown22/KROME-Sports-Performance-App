import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Loader2, Volume2, Square } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface LiveVoiceChatProps {
  onClose: () => void;
  systemInstruction?: string;
  agentName?: string;
}

export default function LiveVoiceChat({ onClose, systemInstruction = "You are a helpful assistant.", agentName = "AI Assistant" }: LiveVoiceChatProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const playbackQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setIsSpeaking(false);
    playbackQueueRef.current = [];
    isPlayingRef.current = false;
  };

  const playNextAudio = () => {
    if (!audioContextRef.current || playbackQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);
    const audioData = playbackQueueRef.current.shift()!;
    const audioCtx = audioContextRef.current;
    
    const audioBuffer = audioCtx.createBuffer(1, audioData.length, 24000);
    audioBuffer.getChannelData(0).set(audioData);

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    
    const currentTime = audioCtx.currentTime;
    const startTime = Math.max(currentTime, nextPlayTimeRef.current);
    
    source.start(startTime);
    nextPlayTimeRef.current = startTime + audioBuffer.duration;

    source.onended = () => {
      if (playbackQueueRef.current.length === 0) {
        isPlayingRef.current = false;
        setIsSpeaking(false);
      } else {
        playNextAudio();
      }
    };
  };

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      // Setup Audio Context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const audioCtx = audioContextRef.current;

      // Get Microphone
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioCtx.createMediaStreamSource(mediaStreamRef.current);

      // Create a ScriptProcessorNode for raw PCM capture (fallback to ScriptProcessor for simplicity in standard React without public folder worklets)
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(audioCtx.destination);

      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: systemInstruction,
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            
            processor.onaudioprocess = (e) => {
              if (isMuted) return;
              
              const inputData = e.inputBuffer.getChannelData(0);
              // Convert Float32 to Int16
              const pcm16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
              }
              
              // Base64 encode
              const binary = String.fromCharCode(...new Uint8Array(pcm16.buffer));
              const base64Data = window.btoa(binary);
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const binaryString = window.atob(base64Audio);
              const len = binaryString.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              const int16Array = new Int16Array(bytes.buffer);
              const float32Array = new Float32Array(int16Array.length);
              for (let i = 0; i < int16Array.length; i++) {
                float32Array[i] = int16Array[i] / 32768.0;
              }
              
              playbackQueueRef.current.push(float32Array);
              if (!isPlayingRef.current) {
                nextPlayTimeRef.current = audioContextRef.current?.currentTime || 0;
                playNextAudio();
              }
            }
            
            if (message.serverContent?.interrupted) {
              playbackQueueRef.current = [];
              isPlayingRef.current = false;
              setIsSpeaking(false);
              nextPlayTimeRef.current = 0;
            }
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setError("Connection error occurred.");
            stopSession();
          },
          onclose: () => {
            stopSession();
          }
        }
      });

      sessionRef.current = await sessionPromise;

    } catch (err: any) {
      console.error("Failed to start voice session:", err);
      if (err.name === 'NotFoundError' || err.message.includes('Requested device not found')) {
        setError("No microphone found. Please connect a microphone and try again.");
      } else if (err.name === 'NotAllowedError' || err.message.includes('Permission denied')) {
        setError("Microphone access denied. Please allow microphone permissions in your browser.");
      } else {
        setError(err.message || "Failed to access microphone or start session.");
      }
      stopSession();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-zinc-900 border border-gold/20 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative flex flex-col items-center text-center"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-24 h-24 rounded-full bg-gold/10 flex items-center justify-center mb-6 relative">
          {isSpeaking && (
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 rounded-full border-2 border-gold/50"
            />
          )}
          <Volume2 className={`w-10 h-10 ${isSpeaking ? 'text-gold' : 'text-white/40'}`} />
        </div>

        <h3 className="text-2xl font-black uppercase italic text-white mb-2">{agentName}</h3>
        <p className="text-sm text-white/60 mb-8 h-6">
          {isConnecting ? "Connecting..." : isConnected ? (isSpeaking ? "Speaking..." : "Listening...") : "Ready to connect"}
        </p>

        {error && (
          <div className="text-red-400 text-sm mb-6 bg-red-400/10 p-3 rounded-xl w-full">
            {error}
          </div>
        )}

        <div className="flex items-center gap-4 w-full">
          {!isConnected ? (
            <button 
              onClick={startSession}
              disabled={isConnecting}
              className="flex-1 btn-gold py-4 flex items-center justify-center gap-2"
            >
              {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
              {isConnecting ? "Connecting" : "Start Voice Chat"}
            </button>
          ) : (
            <>
              <button 
                onClick={toggleMute}
                className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-sm transition-colors ${isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                {isMuted ? "Unmute" : "Mute"}
              </button>
              <button 
                onClick={stopSession}
                className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-sm transition-colors"
              >
                <Square className="w-5 h-5 fill-current" />
                End
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
