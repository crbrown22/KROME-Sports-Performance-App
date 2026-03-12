import React, { useState, useEffect, useRef } from 'react';
import { Send, X, User, Bot, Paperclip, ImageIcon, Video, Download, Trash2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: string;
}

interface UserAdminChatProps {
  userId: string;
  onClose?: () => void;
}

export default function UserAdminChat({ userId, onClose }: UserAdminChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [adminId, setAdminId] = useState<number>(1);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/admin/primary')
      .then(res => res.json())
      .then(data => {
        if (data && data.id) setAdminId(data.id);
      })
      .catch(err => console.error("Failed to fetch admin ID", err));
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${window.location.origin}/api/messages/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);

        // Mark unread messages as read
        const unreadIds = data
          .filter((m: any) => m.receiver_id === parseInt(userId) && m.is_read === 0)
          .map((m: any) => m.id);
          
        if (unreadIds.length > 0) {
          await Promise.all(unreadIds.map((id: number) => 
            fetch(`${window.location.origin}/api/messages/${id}/read`, { method: 'PATCH' })
          ));
        }
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    try {
      await fetch(`${window.location.origin}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: userId, receiver_id: adminId, message: text })
      });
      setInputMessage('');
      fetchMessages();
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const editMessage = async (id: number, newText: string) => {
    try {
      await fetch(`${window.location.origin}/api/messages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newText })
      });
      fetchMessages();
    } catch (err) {
      console.error("Failed to edit message", err);
    }
  };

  const deleteMessage = async (id: number) => {
    try {
      await fetch(`${window.location.origin}/api/messages/${id}`, {
        method: 'DELETE'
      });
      fetchMessages();
    } catch (err) {
      console.error("Failed to delete message", err);
    }
  };

  const renderMessageContent = (msg: Message) => {
    const { message: text, id, sender_id } = msg;
    const isUser = sender_id === parseInt(userId);

    const content = (() => {
      if (text.startsWith('File: ')) {
        const [name, url] = text.split(' | URL: ');
        return <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gold hover:underline"><Download className="w-4 h-4"/> {name.replace('File: ', '')}</a>;
      }
      if (text.startsWith('Image: ')) {
        const [prompt, url] = text.split(' | URL: ');
        return <div className="space-y-1"><p>{prompt.replace('Image: ', '')}</p><img src={url} className="rounded-lg max-w-xs" /></div>;
      }
      if (text.startsWith('Video: ')) {
        const [prompt, url] = text.split(' | URL: ');
        return <div className="space-y-1"><p>{prompt.replace('Video: ', '')}</p><video src={url} className="rounded-lg max-w-xs" controls /></div>;
      }
      return text;
    })();

    return (
      <div className="flex flex-col gap-1">
        <div className="leading-relaxed">{content}</div>
        <div className="flex items-center justify-between gap-4 text-[9px] mt-1 font-bold uppercase tracking-widest opacity-40">
          <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {isUser && (
            <div className="flex gap-2">
              <button onClick={() => {
                const newText = prompt('Edit message:', text);
                if (newText) editMessage(id, newText);
              }} className="hover:text-gold">Edit</button>
              <button onClick={() => deleteMessage(id)} className="hover:text-red-500">Delete</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-zinc-900/90 border border-white/10 rounded-[32px] p-6 space-y-6 relative shadow-2xl w-full flex flex-col h-[500px] backdrop-blur-2xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent pointer-events-none" />
      
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-white/60 hover:text-white transition-all z-10 border border-white/5"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      
      <div className="flex items-center gap-3 shrink-0 relative z-10">
        <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center text-black shadow-lg">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-black uppercase italic text-white tracking-tight">KROME <span className="text-gold">Support</span></h3>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Specialist Online</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 min-h-0 relative z-10">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.sender_id === parseInt(userId) ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${msg.sender_id === parseInt(userId) ? 'bg-zinc-800 text-white' : 'gold-gradient text-black'}`}>
              {msg.sender_id === parseInt(userId) ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={`p-4 rounded-3xl text-sm shadow-xl relative group ${msg.sender_id === parseInt(userId) ? 'bg-zinc-800 text-white rounded-tr-none' : 'bg-zinc-900/80 border border-gold/10 text-white/90 rounded-tl-none'}`}>
              {renderMessageContent(msg)}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      
      <div className="pt-2 flex items-center gap-2 relative z-10">
        <div className="flex-1 flex items-center gap-2 bg-black/40 border border-white/10 rounded-2xl p-1.5 focus-within:border-gold/50 transition-all">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(inputMessage);
              }
            }}
            placeholder="Message specialist..."
            className="flex-1 bg-transparent border-none px-3 py-2 text-xs text-white outline-none placeholder:text-white/20"
          />
          <button 
            onClick={() => sendMessage(inputMessage)}
            disabled={!inputMessage.trim()}
            className="p-3 bg-gold hover:bg-yellow-400 text-black transition-all rounded-xl shadow-lg shadow-gold/20 disabled:opacity-50 disabled:scale-100 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
