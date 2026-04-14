import { safeStorage } from '../utils/storage';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Camera, Edit3, Trash2, ShieldAlert, CheckCircle2, AlertCircle, ChevronLeft, LogOut, Bell, BellOff } from 'lucide-react';
import { registerServiceWorker, subscribeToPush } from '../utils/notifications';

interface AccountSettingsProps {
  user: any;
  onUpdate: (updatedUser: any) => void;
  onDelete: () => void;
  onBack: () => void;
  onLogout: () => void;
}

export default function AccountSettings({ user, onUpdate, onDelete, onBack, onLogout }: AccountSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({ 
    ...user,
    firstName: user.firstName || user.first_name || "",
    lastName: user.lastName || user.last_name || "",
    username: user.username || "",
    avatar_url: user.avatar_url || user.avatarUrl || ""
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(user.emailNotifications === true || user.email_notifications === 1);
  const [globalPushEnabled, setGlobalPushEnabled] = useState(user.pushNotifications === true || user.push_notifications === 1);

  useEffect(() => {
    const checkPush = async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          setPushEnabled(!!subscription);
        }
      }
    };
    checkPush();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be smaller than 2MB");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        
        // Update local state
        const updatedFormData = { ...formData, avatar_url: base64Image };
        setFormData(updatedFormData);

        // Update server (both SQLite and Firestore)
        const response = await fetch(`/api/users/${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar_url: base64Image })
        });

        if (response.ok) {
          onUpdate({ ...user, avatar_url: base64Image });
          setSuccess("Profile picture updated!");
          setTimeout(() => setSuccess(""), 3000);
        } else {
          throw new Error('Failed to update profile');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Avatar update failed", err);
      setError("Failed to update avatar. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        onUpdate(formData);
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      if (response.ok) {
        onDelete();
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleEnableNotifications = async () => {
    if (Notification.permission === 'denied') {
      setError("Notifications are blocked. Click the lock icon (🔒) in your address bar and set Notifications to 'Allow'.");
      return;
    }

    setNotificationLoading(true);
    try {
      const registration = await registerServiceWorker();
      if (registration) {
        const success = await subscribeToPush(user.id);
        if (success) {
          setPushEnabled(true);
          setSuccess("Notifications enabled!");
          setTimeout(() => setSuccess(""), 3000);
        } else {
          setError("Failed to enable notifications. Ensure you clicked 'Allow' in the browser prompt.");
        }
      }
    } catch (err) {
      console.error("Notification error:", err);
      setError("An error occurred while enabling notifications.");
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleUpdateNotificationSettings = async (email: boolean, push: boolean) => {
    try {
      const res = await fetch(`/api/users/${user.id}/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailNotifications: email, pushNotifications: push })
      });
      if (res.ok) {
        setEmailNotifications(email);
        setGlobalPushEnabled(push);
        onUpdate({ ...user, emailNotifications: email, pushNotifications: push });
        setSuccess("Notification settings updated!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError("Failed to update notification settings");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pb-24 bg-black px-6"
      style={{ paddingTop: 'calc(100px + var(--safe-area-top))' }}
    >
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest hover:gap-4 transition-all mb-8 !outline-none"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="profile-gradient border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-xl shadow-2xl">
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
            </motion.div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </motion.div>
          )}

          {showDeleteConfirm ? (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-8 shadow-xl">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black uppercase italic mb-4">Are you sure?</h3>
              <p className="text-white/40 mb-10 leading-relaxed">
                This action is permanent and will delete all your training progress, history, and account data.
              </p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button onClick={handleDelete} className="bg-red-500 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest hover:bg-red-600 transition-colors">Confirm Delete</button>
                <button onClick={() => setShowDeleteConfirm(false)} className="bg-zinc-800 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest hover:bg-zinc-700 transition-colors">Cancel</button>
              </div>
            </div>
          ) : isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">First Name</label>
                  <input 
                    type="text" 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-gold outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Last Name</label>
                  <input 
                    type="text" 
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-gold outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Username</label>
                  <input 
                    type="text" 
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-gold outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:border-gold outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button type="submit" className="btn-gold flex-1 mt-4">Save Changes</button>
                <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-4 bg-zinc-800 text-white rounded-full font-black uppercase tracking-widest hover:bg-zinc-700 transition-colors mt-4">Cancel</button>
              </div>
            </form>
          ) : (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-10 border-b border-white/5">
                <div>
                  <h3 className="text-2xl font-black uppercase italic mb-1">Account Info</h3>
                  <p className="text-white/40 text-sm">Manage your personal information and settings.</p>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" /> Edit Profile
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 block">Name</label>
                    <div className="text-xl font-medium text-white">{(user.firstName || user.first_name || user.lastName || user.last_name) ? `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim() : 'Not set'}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 block">Username</label>
                    <div className="text-xl font-medium text-white">{user.username}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 block">Email</label>
                    <div className="text-xl font-medium text-white">{user.email}</div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 block">Account Status</label>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/20 rounded-full text-gold text-xs font-black uppercase tracking-widest">
                      <CheckCircle2 className="w-4 h-4" /> Active Member
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 block">Member Since</label>
                    <div className="text-xl font-medium text-white">{new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 block">Role</label>
                    <div className="text-xl font-medium text-white capitalize">{user.role}</div>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="pt-10 border-t border-white/5">
                <h4 className="text-lg font-black uppercase italic mb-6">Notification Settings</h4>
                
                <div className="space-y-6 bg-black/20 p-6 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${emailNotifications ? 'bg-gold/20 text-gold' : 'bg-white/5 text-white/40'}`}>
                        <Mail className="w-6 h-6" />
                      </div>
                      <div>
                        <h5 className="font-bold text-white">Email Notifications</h5>
                        <p className="text-sm text-white/40">Receive updates and messages via email</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleUpdateNotificationSettings(!emailNotifications, globalPushEnabled)}
                      className={`w-14 h-8 rounded-full transition-colors relative ${emailNotifications ? 'bg-gold' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${emailNotifications ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${globalPushEnabled ? 'bg-gold/20 text-gold' : 'bg-white/5 text-white/40'}`}>
                        {globalPushEnabled ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
                      </div>
                      <div>
                        <h5 className="font-bold text-white">Push Notifications</h5>
                        <p className="text-sm text-white/40">Receive instant alerts on your device</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {!pushEnabled && globalPushEnabled && (
                        <button 
                          onClick={handleEnableNotifications}
                          disabled={notificationLoading}
                          className="text-xs font-bold uppercase tracking-widest text-gold hover:text-yellow-400 transition-colors"
                        >
                          {notificationLoading ? 'Enabling...' : 'Enable on this device'}
                        </button>
                      )}
                      <button 
                        onClick={() => handleUpdateNotificationSettings(emailNotifications, !globalPushEnabled)}
                        className={`w-14 h-8 rounded-full transition-colors relative ${globalPushEnabled ? 'bg-gold' : 'bg-white/10'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${globalPushEnabled ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-white/5">
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6 py-3 border border-red-500/20 rounded-full text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-500/10 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
