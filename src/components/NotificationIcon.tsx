import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationIconProps {
  userId?: string;
  onOpenChat: () => void;
  onOpenAdminChat: () => void;
  isAdmin: boolean;
  unreadCount: number;
}

export default function NotificationIcon({ userId, onOpenChat, onOpenAdminChat, isAdmin, unreadCount }: NotificationIconProps) {
  return (
    <div className="flex items-center gap-4">
      <button 
        onClick={isAdmin ? onOpenAdminChat : onOpenChat}
        className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/60 hover:text-gold transition-colors relative"
        aria-label="Open Chat"
      >
        <MessageSquare className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-zinc-900 flex items-center justify-center text-[8px] font-black text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>
    </div>
  );
}
