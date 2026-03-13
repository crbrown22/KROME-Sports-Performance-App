import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2, Bot, User, Search, Paperclip, Image as ImageIcon, Video, Download } from 'lucide-react';
import { generateImage, generateVideo } from '../services/aiService';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
  read: boolean;
}

interface UserRecord {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive' | 'pending';
  avatarUrl?: string;
}

export default function AdminMessageDashboard({ adminId }: { adminId: string }) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadUserIds, setUnreadUserIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users?role=user');
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const response = await fetch('/api/messages/unread');
        if (response.ok) {
          const data = await response.json();
          const ids = new Set<string>(data.map((m: any) => m.sender_id.toString()));
          setUnreadUserIds(ids);
        }
      } catch (err) {
        console.error("Failed to fetch unread messages", err);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [adminId]);

  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages/${selectedUser.id}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.map((m: any) => ({
            id: m.id.toString(),
            senderId: m.sender_id.toString(),
            receiverId: m.receiver_id.toString(),
            text: m.message,
            createdAt: m.created_at,
            read: !!m.is_read
          })));

          // Mark as read
          const unread = data.filter((m: any) => m.sender_id.toString() === selectedUser.id && !m.is_read);
          for (const msg of unread) {
            await fetch(`/api/messages/${msg.id}/read`, { method: 'PATCH' });
          }
        }
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedUser, adminId]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !selectedUser) return;
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: adminId,
          receiver_id: selectedUser.id,
          message: text
        })
      });
      setNewMessage('');
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/files/upload', { method: 'POST', body: formData });
    const data = await res.json();
    sendMessage(`File: ${file.name} | URL: /api/files/${data.filename}`);
  };

  const handleGenerateImage = async () => {
    const text = window.prompt("Enter image prompt:");
    if (!text) return;
    try {
      setLoading(true);
      const imageUrl = await generateImage(text, '1:1');
      if (imageUrl) {
        sendMessage(`Image: ${text} | URL: ${imageUrl}`);
      }
    } catch (err) {
      console.error("Failed to generate image", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    const text = window.prompt("Enter video prompt:");
    if (!text) return;
    try {
      setLoading(true);
      const videoUrl = await generateVideo(text, '16:9');
      if (videoUrl) {
        sendMessage(`Video: ${text} | URL: ${videoUrl}`);
      }
    } catch (err) {
      console.error("Failed to generate video", err);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageContent = (text: string) => {
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
  };

  return (
    <div className="flex h-[calc(100vh-300px)] min-h-[500px] bg-zinc-900/30 border border-white/5 rounded-[40px] overflow-hidden backdrop-blur-xl shadow-2xl">
      {/* User List */}
      <div className="w-1/3 border-r border-white/5 flex flex-col bg-black/20">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-white font-black uppercase italic tracking-tight text-lg mb-6">Athletes</h3>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              type="text" 
              placeholder="Search athletes..." 
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:border-gold outline-none transition-all placeholder:text-white/20" 
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {users.map(user => (
            <button 
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`w-full p-6 flex items-center gap-4 hover:bg-white/5 transition-all relative group ${selectedUser?.id === user.id ? 'bg-white/10' : ''}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-black font-black italic relative shadow-lg overflow-hidden ${selectedUser?.id === user.id ? 'gold-gradient' : 'bg-zinc-800 text-white group-hover:bg-zinc-700'}`}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  user.username[0].toUpperCase()
                )}
                {unreadUserIds.has(user.id) && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-zinc-900 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                  </span>
                )}
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className={`font-bold text-sm truncate uppercase italic ${selectedUser?.id === user.id ? 'text-gold' : 'text-white'}`}>{user.username}</p>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      user.status === 'active' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 
                      user.status === 'pending' ? 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]' : 
                      'bg-zinc-500'
                    }`} />
                  </div>
                  {unreadUserIds.has(user.id) && (
                    <span className="text-[10px] bg-emerald-500 text-black px-2.5 py-1 rounded-full font-black uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-pulse">New</span>
                  )}
                </div>
                <p className="text-white/40 text-[10px] truncate uppercase tracking-widest font-bold">{user.email}</p>
              </div>
              {selectedUser?.id === user.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gold rounded-r-full shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-black/40 relative">
        {selectedUser ? (
          <>
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center text-black font-black italic shadow-lg overflow-hidden">
                  {selectedUser.avatarUrl ? (
                    <img src={selectedUser.avatarUrl} alt={selectedUser.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    selectedUser.username[0].toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-white font-black uppercase italic tracking-tight text-lg">{selectedUser.username}</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Active Session</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.senderId === adminId ? 'flex-row-reverse' : ''}`}>
                  <div className={`max-w-[70%] p-4 rounded-3xl text-sm shadow-xl relative group ${msg.senderId === adminId ? 'bg-gold text-black rounded-tr-none font-medium' : 'bg-zinc-800/80 border border-white/5 text-white/90 rounded-tl-none'}`}>
                    <div className="leading-relaxed">
                      {renderMessageContent(msg.text)}
                    </div>
                    <p className={`text-[9px] mt-2 font-bold uppercase tracking-widest opacity-40 ${msg.senderId === adminId ? 'text-black' : 'text-white'}`}>
                      {msg.senderId === adminId ? 'Sent' : 'Received'} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-6 border-t border-white/5 bg-zinc-900/50 backdrop-blur-md">
              <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-2xl p-2 focus-within:border-gold/50 transition-all">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                <div className="flex gap-1">
                  <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="p-3 text-white/40 hover:text-gold hover:bg-white/5 rounded-xl transition-all disabled:opacity-50" title="Upload File"><Paperclip className="w-5 h-5" /></button>
                  <button onClick={handleGenerateImage} disabled={loading} className="p-3 text-white/40 hover:text-gold hover:bg-white/5 rounded-xl transition-all disabled:opacity-50" title="Generate Image"><ImageIcon className="w-5 h-5" /></button>
                  <button onClick={handleGenerateVideo} disabled={loading} className="p-3 text-white/40 hover:text-gold hover:bg-white/5 rounded-xl transition-all disabled:opacity-50" title="Generate Video"><Video className="w-5 h-5" /></button>
                </div>
                <input 
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message to athlete..."
                  className="flex-1 bg-transparent border-none py-3 px-2 text-sm text-white outline-none placeholder:text-white/20"
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage(newMessage)}
                  disabled={loading}
                />
                <button 
                  onClick={() => sendMessage(newMessage)} 
                  disabled={!newMessage.trim() || loading}
                  className="bg-gold text-black p-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-gold/20 disabled:opacity-50 disabled:scale-100"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-24 h-24 rounded-[32px] bg-zinc-900 border border-white/5 flex items-center justify-center text-white/20 mb-6 shadow-2xl">
              <Bot className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-black uppercase italic text-white/80 mb-2">Message Dashboard</h3>
            <p className="text-white/40 text-sm max-w-xs uppercase tracking-widest font-bold">Select an athlete from the left to begin elite performance consultation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
