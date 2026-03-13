import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2, Bot, User } from 'lucide-react';

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: string;
}

export default function AdminChat({ userId, adminId }: { userId: string, adminId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!userId || !adminId) return;
    try {
      const response = await fetch(`/api/messages/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [userId, adminId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId || !adminId) return;
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: adminId,
          receiver_id: userId,
          message: newMessage
        })
      });
      setNewMessage('');
      fetchMessages();
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const deleteMessage = async (messageId: number) => {
    try {
      await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
      fetchMessages();
    } catch (err) {
      console.error("Failed to delete message", err);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-zinc-900/50 border border-white/10 rounded-3xl p-6">
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 mb-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.sender_id.toString() === adminId ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender_id.toString() === adminId ? 'bg-gold text-black' : 'bg-zinc-800 text-white'}`}>
              {msg.sender_id.toString() === adminId ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className={`p-3 rounded-2xl text-sm shadow-md relative group ${msg.sender_id.toString() === adminId ? 'bg-gold text-black rounded-tr-sm' : 'bg-zinc-800 text-white rounded-tl-sm'}`}>
              {msg.message}
              <button 
                onClick={() => deleteMessage(msg.id)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="flex gap-2">
        <input 
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-gold outline-none"
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button 
          onClick={sendMessage}
          className="bg-gold text-black p-3 rounded-xl hover:bg-gold/90 transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
