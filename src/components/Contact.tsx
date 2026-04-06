import { safeStorage } from '../utils/storage';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Smartphone, Globe, Clipboard, ChevronLeft } from 'lucide-react';
import ContactForm from './ContactForm';

interface ContactProps {
  onBack: () => void;
  onNavigateToRegister: () => void;
  user?: any;
}

export default function Contact({ onBack, onNavigateToRegister, user }: ContactProps) {
  const [showForm, setShowForm] = useState(!!user);

  if (showForm) {
    return <ContactForm 
      onBack={() => setShowForm(false)} 
      initialName={user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''}
      initialEmail={user?.email || ''}
    />;
  }

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
          className="flex items-center gap-2 text-gold font-bold uppercase text-[10px] md:text-xs tracking-widest mb-6 md:mb-8 hover:gap-4 transition-all !outline-none border border-[#b2d8d8] px-4 py-2 rounded-xl bg-black/20 backdrop-blur-md w-fit"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-8">
          Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent">Us</span>
        </h1>
        <p className="text-xl text-[#b2d8d8]/60 mb-16 max-w-2xl">
          Ready to take your performance to the next level? Choose the method that works best for you to get started.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <button 
            onClick={onNavigateToRegister}
            className="text-left bg-zinc-900 border border-[#b2d8d8] p-8 rounded-3xl hover:border-gold/50 transition-all group"
          >
            <Globe className="w-10 h-10 text-gold mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold uppercase italic mb-3 text-[#b2d8d8]">Website</h3>
            <p className="text-sm text-[#b2d8d8]/60">Click Here to fill out your athlete profile.</p>
          </button>

          <div className="bg-zinc-900 border border-[#b2d8d8] p-8 rounded-3xl">
            <Smartphone className="w-10 h-10 text-gold mb-6" />
            <h3 className="text-xl font-bold uppercase italic mb-3 text-[#b2d8d8]">KROME App</h3>
            <p className="text-sm text-[#b2d8d8]/60">Already a member? Schedule your consultation directly through the KROME Sports Performance App.</p>
          </div>

          <button 
            onClick={() => setShowForm(true)}
            className="text-left bg-zinc-900 border border-[#b2d8d8] p-8 rounded-3xl hover:border-gold/50 transition-all group"
          >
            <Mail className="w-10 h-10 text-gold mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold uppercase italic mb-3 text-[#b2d8d8]">Direct Contact</h3>
            <p className="text-sm text-[#b2d8d8]/60">Fill out our contact form to request a 1-on-1 performance consultation with one of our coaches.</p>
          </button>
        </div>

        <div className="bg-zinc-900/50 border border-[#b2d8d8] rounded-3xl p-10">
          <h2 className="text-3xl font-black uppercase italic mb-8 flex items-center gap-4 text-[#b2d8d8]">
            <Clipboard className="text-gold" /> What to Expect
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-gold font-bold uppercase tracking-widest text-sm mb-3">Performance Audit</h4>
              <p className="text-[#b2d8d8]/60 text-sm">We’ll review your current training load and nutritional habits.</p>
            </div>
            <div>
              <h4 className="text-gold font-bold uppercase tracking-widest text-sm mb-3">Goal Setting</h4>
              <p className="text-[#b2d8d8]/60 text-sm">We will map out that 10–12 week timeline to ensure you're losing fat while gaining power.</p>
            </div>
            <div>
              <h4 className="text-gold font-bold uppercase tracking-widest text-sm mb-3">Custom Blueprint</h4>
              <p className="text-[#b2d8d8]/60 text-sm">You’ll leave with a clear idea of which KROME program fits your current needs.</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
