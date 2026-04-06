import { safeStorage } from '../utils/storage';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Send } from 'lucide-react';

interface ContactFormProps {
  onBack: () => void;
  initialName?: string;
  initialEmail?: string;
}

export default function ContactForm({ onBack, initialName, initialEmail }: ContactFormProps) {
  const [name, setName] = useState(initialName || '');
  const [email, setEmail] = useState(initialEmail || '');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      if (!response.ok) throw new Error('Failed to send');
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-24">
        <h2 className="text-3xl font-black uppercase italic mb-4 text-[#b2d8d8]">Message Sent</h2>
        <p className="text-[#b2d8d8]/60">Thank you! Someone will be in touch with you soon.</p>
        <button onClick={onBack} className="mt-8 btn-gold">Back</button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-black text-white py-24 px-6"
    >
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gold font-bold uppercase text-[10px] md:text-xs tracking-widest mb-6 md:mb-8 hover:gap-4 transition-all !outline-none border border-[#b2d8d8] px-4 py-2 rounded-xl bg-black/20 backdrop-blur-md w-fit"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-5xl font-black uppercase italic tracking-tighter mb-8">
          Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent">Form</span>
        </h1>

        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-[#b2d8d8] p-8 rounded-3xl space-y-6">
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest mb-2 text-[#b2d8d8]">Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-black/50 border border-[#b2d8d8]/50 rounded-xl p-4 text-[#b2d8d8] focus:border-gold outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest mb-2 text-[#b2d8d8]">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-black/50 border border-[#b2d8d8]/50 rounded-xl p-4 text-[#b2d8d8] focus:border-gold outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest mb-2 text-[#b2d8d8]">Message</label>
            <textarea 
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              className="w-full bg-black/50 border border-[#b2d8d8]/50 rounded-xl p-4 text-[#b2d8d8] focus:border-gold outline-none"
            />
          </div>
          <button type="submit" disabled={status === 'sending'} className="btn-gold w-full flex items-center justify-center gap-2">
            {status === 'sending' ? 'Sending...' : <><Send className="w-4 h-4" /> Send Message</>}
          </button>
          {status === 'error' && <p className="text-red-500 text-center">Failed to send message. Please try again.</p>}
        </form>
      </div>
    </motion.div>
  );
}
