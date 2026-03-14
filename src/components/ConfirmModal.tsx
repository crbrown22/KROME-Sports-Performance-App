import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'info' | 'warning';
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  type = 'info'
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl ${
                  type === 'danger' ? 'bg-red-500/20 text-red-500' :
                  type === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
                  'bg-gold/20 text-gold'
                }`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <button 
                  onClick={onCancel}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white/40" />
                </button>
              </div>
              
              <h3 className="text-xl font-black uppercase italic italic-accent mb-2">{title}</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-8">{message}</p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onCancel}
                  className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold uppercase text-xs tracking-widest transition-all"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className={`py-3 px-4 rounded-xl font-bold uppercase text-xs tracking-widest transition-all shadow-lg ${
                    type === 'danger' ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' :
                    type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600 text-black shadow-yellow-500/20' :
                    'bg-gold hover:bg-yellow-500 text-black shadow-gold/20'
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
