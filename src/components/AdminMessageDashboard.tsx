import { safeStorage } from '../utils/storage';
import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2, Bot, User, Search, Paperclip, Image as ImageIcon, Video, Download, ChevronLeft, ChevronRight, X } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [showUserList, setShowUserList] = useState(true);
  const [aiPromptType, setAiPromptType] = useState<'image' | 'video' | null>(null);
  const [aiPromptValue, setAiPromptValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quickReplies = [
    "Great work on today's session!",
    "I've updated your training program. Take a look.",
    "How are you feeling after that last workout?",
    "Don't forget to log your nutrition today.",
    "Let's jump on a quick call to discuss your progress."
  ];

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const fetchMessages = async () => {
    if (!selectedUser) return;
    
    // Load cached messages
    const cached = safeStorage.getItem(`krome_admin_messages_${selectedUser.id}`);
    if (cached) {
      setMessages(JSON.parse(cached));
    }

    try {
      const response = await fetch(`/api/messages/${selectedUser.id}`);
      if (response.ok) {
        const data = await response.json();
        const formattedMessages = data.map((m: any) => ({
          id: m.id.toString(),
          senderId: m.sender_id.toString(),
          receiverId: m.receiver_id.toString(),
          text: m.message,
          createdAt: m.created_at,
          read: !!m.is_read
        }));
        setMessages(formattedMessages);
        safeStorage.setItem(`krome_admin_messages_${selectedUser.id}`, JSON.stringify(formattedMessages));

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

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedUser, adminId]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
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
      fetchMessages();
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

  const handleGenerateImage = async (prompt: string) => {
    if (!prompt) return;
    try {
      setLoading(true);
      setAiPromptType(null);
      setAiPromptValue('');
      const imageUrl = await generateImage(prompt, '1:1');
      if (imageUrl) {
        sendMessage(`Image: ${prompt} | URL: ${imageUrl}`);
      }
    } catch (err) {
      console.error("Failed to generate image", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async (prompt: string) => {
    if (!prompt) return;
    try {
      setLoading(true);
      setAiPromptType(null);
      setAiPromptValue('');
      const videoUrl = await generateVideo(prompt, '16:9');
      if (videoUrl) {
        sendMessage(`Video: ${prompt} | URL: ${videoUrl}`);
      }
    } catch (err) {
      console.error("Failed to generate video", err);
    } finally {
      setLoading(false);
    }
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    msgs.forEach(msg => {
      const date = new Date(msg.createdAt).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
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

  const filteredMessages = messages.filter(msg =>
    msg.text.toLowerCase().includes(chatSearchTerm.toLowerCase())
  );

  const groupedMessages = React.useMemo(() => groupMessagesByDate(filteredMessages), [filteredMessages, chatSearchTerm]);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-200px)] md:h-[calc(100vh-300px)] min-h-[500px] bg-zinc-900/30 border border-white/5 rounded-[40px] overflow-hidden backdrop-blur-xl shadow-2xl relative">
      {/* User List */}
      <div className={`${showUserList ? 'flex' : 'hidden'} lg:flex w-full lg:w-80 xl:w-96 border-r border-white/5 flex-col bg-black/20 shrink-0`}>
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-black uppercase italic tracking-tight text-lg">Athletes</h3>
            <div className="px-3 py-1 bg-gold/10 rounded-full border border-gold/20">
              <span className="text-[10px] font-black text-gold uppercase tracking-widest">{users.length} Total</span>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              type="text" 
              placeholder="Search athletes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:border-gold outline-none transition-all placeholder:text-white/20" 
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredUsers.length > 0 ? filteredUsers.map(user => (
            <button 
              key={user.id}
              onClick={() => { setSelectedUser(user); setShowUserList(false); }}
              className={`w-full p-6 flex items-center gap-4 hover:bg-white/5 transition-all relative group ${selectedUser?.id === user.id ? 'bg-white/10' : ''}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-black font-black italic relative shadow-lg overflow-hidden shrink-0 ${selectedUser?.id === user.id ? 'gold-gradient' : 'bg-zinc-800 text-white group-hover:bg-zinc-700'}`}>
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
          )) : (
            <div className="p-12 text-center">
              <p className="text-white/20 text-xs font-black uppercase tracking-widest">No athletes found</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${!showUserList || window.innerWidth >= 1024 ? 'flex' : 'hidden'} flex-1 flex flex-col bg-black/40 relative`}>
        {selectedUser ? (
          <>
            <div className="p-4 lg:p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowUserList(true)}
                  className="lg:hidden p-2 bg-white/5 rounded-xl border border-white/10 text-gold"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl gold-gradient flex items-center justify-center text-black font-black italic shadow-lg overflow-hidden">
                  {selectedUser.avatarUrl ? (
                    <img src={selectedUser.avatarUrl} alt={selectedUser.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    selectedUser.username[0].toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-white font-black uppercase italic tracking-tight text-sm lg:text-lg">{selectedUser.username}</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Active Session</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input 
                    type="text"
                    placeholder="Search chat..."
                    value={chatSearchTerm}
                    onChange={(e) => setChatSearchTerm(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:border-gold outline-none transition-all placeholder:text-white/20 w-40 lg:w-64"
                  />
                </div>
                <button className="p-2 text-white/40 hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8 custom-scrollbar bg-black/40 min-h-0">
              {Object.entries(groupedMessages).map(([date, dateMsgs]) => (
                <div key={date} className="space-y-6">
                  <div className="flex justify-center">
                    <span className="px-4 py-1.5 bg-white/5 rounded-full border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 backdrop-blur-md">
                      {formatDateLabel(date)}
                    </span>
                  </div>
                  {dateMsgs.map((msg, idx) => {
                    const isLastInGroup = idx === dateMsgs.length - 1 || dateMsgs[idx + 1].senderId !== msg.senderId;
                    const isAdmin = msg.senderId === adminId;
                    return (
                      <div key={msg.id} className={`flex gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-lg overflow-hidden shrink-0 mt-auto mb-1 ${isAdmin ? 'hidden' : 'block'}`}>
                          {selectedUser.avatarUrl ? (
                            <img src={selectedUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white/40 uppercase">
                              {selectedUser.username[0]}
                            </div>
                          )}
                        </div>
                        <div className={`max-w-[85%] lg:max-w-[70%] p-4 rounded-2xl text-sm shadow-xl relative group transition-all hover:scale-[1.01] ${
                          isAdmin 
                            ? `bg-gold text-black ${isLastInGroup ? 'rounded-br-none' : ''} font-medium shadow-gold/5` 
                            : `bg-zinc-900 border border-white/10 text-white/90 ${isLastInGroup ? 'rounded-bl-none' : ''} shadow-black/20`
                        }`}>
                          <div className="leading-relaxed break-words">
                            {renderMessageContent(msg.text)}
                          </div>
                          <div className={`flex items-center gap-2 mt-2 opacity-40 ${isAdmin ? 'text-black' : 'text-white'}`}>
                            <p className="text-[9px] font-bold uppercase tracking-widest">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {isAdmin && msg.read && <span className="text-[8px] font-black uppercase tracking-tighter">Read</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* AI Prompt UI */}
            {aiPromptType && (
              <div className="absolute inset-x-0 bottom-[100px] p-6 z-20">
                <div className="bg-zinc-900 border border-gold/30 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-gold font-black uppercase italic tracking-widest text-xs flex items-center gap-2">
                      <Bot className="w-4 h-4" /> AI {aiPromptType === 'image' ? 'Image' : 'Video'} Generator
                    </h4>
                    <button onClick={() => setAiPromptType(null)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="flex gap-3">
                    <input 
                      autoFocus
                      type="text"
                      value={aiPromptValue}
                      onChange={(e) => setAiPromptValue(e.target.value)}
                      placeholder={`Enter ${aiPromptType} prompt...`}
                      className="flex-1 bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-gold transition-all"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          aiPromptType === 'image' ? handleGenerateImage(aiPromptValue) : handleGenerateVideo(aiPromptValue);
                        }
                      }}
                    />
                    <button 
                      onClick={() => aiPromptType === 'image' ? handleGenerateImage(aiPromptValue) : handleGenerateVideo(aiPromptValue)}
                      disabled={!aiPromptValue.trim() || loading}
                      className="bg-gold text-black px-6 rounded-2xl font-black uppercase italic text-xs hover:scale-105 transition-all disabled:opacity-50"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 lg:p-6 border-t border-white/5 bg-zinc-900/80 backdrop-blur-xl flex-shrink-0">
              {showQuickReplies && (
                <div className="flex flex-wrap gap-2 mb-4 animate-in fade-in slide-in-from-bottom-2">
                  {quickReplies.map((reply, i) => (
                    <button 
                      key={i}
                      onClick={() => {
                        sendMessage(reply);
                        setShowQuickReplies(false);
                      }}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-gold hover:border-gold transition-all"
                    >
                      {reply}
                    </button>
                  ))}
                  <button onClick={() => setShowQuickReplies(false)} className="p-2 text-white/20 hover:text-white"><X className="w-3 h-3" /></button>
                </div>
              )}
              <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-2xl p-2 focus-within:border-gold/50 transition-all shadow-inner">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                <div className="flex gap-1">
                  <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="p-2 lg:p-3 text-white/40 hover:text-gold hover:bg-white/5 rounded-xl transition-all disabled:opacity-50" title="Upload File"><Paperclip className="w-5 h-5" /></button>
                  <button onClick={() => setAiPromptType('image')} disabled={loading} className="p-2 lg:p-3 text-white/40 hover:text-gold hover:bg-white/5 rounded-xl transition-all disabled:opacity-50" title="Generate Image"><ImageIcon className="w-5 h-5" /></button>
                  <button onClick={() => setAiPromptType('video')} disabled={loading} className="p-2 lg:p-3 text-white/40 hover:text-gold hover:bg-white/5 rounded-xl transition-all disabled:opacity-50" title="Generate Video"><Video className="w-5 h-5" /></button>
                  <button onClick={() => setShowQuickReplies(!showQuickReplies)} className="p-2 lg:p-3 text-white/40 hover:text-gold hover:bg-white/5 rounded-xl transition-all" title="Quick Replies"><Bot className="w-5 h-5" /></button>
                </div>
                <input 
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
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
