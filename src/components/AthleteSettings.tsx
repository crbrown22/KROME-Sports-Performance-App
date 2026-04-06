import { safeStorage } from '../utils/storage';
import React, { useState, useEffect } from 'react';
import { CheckCircle2, Edit3, Save, X } from 'lucide-react';

interface AthleteSettingsProps {
  user: any;
  onUpdate: (updatedUser: any) => void;
}

export default function AthleteSettings({ user, onUpdate }: AthleteSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    username: user?.username || "",
    fitness_goal: user?.fitness_goal || ""
  });
  const [purchasedPrograms, setPurchasedPrograms] = useState<string[]>([]);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await fetch(`/api/purchases/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setPurchasedPrograms(data.map((p: any) => p.item_name));
        }
      } catch (err) {
        console.error("Failed to fetch purchases", err);
      }
    };
    fetchPurchases();
  }, [user.id]);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        onUpdate({ ...user, ...formData });
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-xl shadow-2xl">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-10 border-b border-white/5">
          <div>
            <h3 className="text-2xl font-black uppercase italic mb-1">Account Info</h3>
            <p className="text-white/40 text-sm">Manage personal information and settings for this athlete.</p>
          </div>
          <div className="flex gap-4">
            <div className="px-4 py-2 bg-gold/10 border border-gold/20 rounded-full text-gold text-[10px] font-black uppercase tracking-widest">
              {user.role === 'admin' ? 'Administrator' : user.role === 'coach' ? 'Coach' : 'Athlete'}
            </div>
            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              {isEditing ? <Save className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
              {isEditing ? 'Save' : 'Edit'}
            </button>
            {isEditing && (
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">First Name</label>
              <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-gold outline-none transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Last Name</label>
              <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-gold outline-none transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Username</label>
              <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-gold outline-none transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Email Address</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-gold outline-none transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Fitness Goal</label>
              <select 
                value={formData.fitness_goal} 
                onChange={e => setFormData({...formData, fitness_goal: e.target.value})} 
                className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-gold outline-none transition-colors"
              >
                <option value="">Not Set</option>
                <option value="build-muscle">Build Muscle</option>
                <option value="increase-strength">Increase Strength</option>
                <option value="speed-agility">Speed & Agility</option>
                <option value="fat-loss">Fat Loss</option>
                <option value="mobility-health">Mobility & Health</option>
                <option value="sport-specific">Sport Specific</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Full Name</p>
              <p className="text-lg font-bold uppercase italic">
                {user.firstName || user.lastName ? `${user.firstName} ${user.lastName}` : 'Athlete Name Not Set'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Email Address</p>
              <p className="text-lg font-bold uppercase italic">{user.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Fitness Goal</p>
              <p className="text-lg font-bold uppercase italic text-gold">{user.fitness_goal?.replace('-', ' ') || 'Not Set'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Username</p>
              <p className="text-lg font-bold uppercase italic">{user.username}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Member Since</p>
              <p className="text-lg font-bold uppercase italic">
                {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        )}

        <div className="pt-10 border-t border-white/5">
          <h4 className="font-bold uppercase italic mb-6">Active Programs</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {purchasedPrograms.length > 0 ? (
              purchasedPrograms.map(program => (
                <div key={program} className="p-4 bg-black/50 border border-white/5 rounded-2xl text-xs font-bold uppercase tracking-widest text-gold text-center">
                  {program}
                </div>
              ))
            ) : (
              <p className="text-white/40 text-xs">No active programs.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
