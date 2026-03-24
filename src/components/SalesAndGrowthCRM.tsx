import { safeStorage } from '../utils/storage';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getCurrentDate } from '../utils/date';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity, 
  Target, 
  UserPlus, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreHorizontal,
  Plus
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  status: 'New Lead' | 'Contacted' | 'Consultation' | 'Proposal' | 'Closed Won' | 'Closed Lost';
  value: number;
  dateAdded: string;
  lastContact: string;
  notes?: string;
  // New PAR-Q fields
  sports?: string[];
  sessionRequests?: string[];
  preferredTimes?: string[];
  preferredDays?: string[];
  positions?: string[];
  userId?: string;
}

const initialLeads: Lead[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', status: 'New Lead', value: 150, dateAdded: '2026-03-01', lastContact: '2026-03-01' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'Contacted', value: 300, dateAdded: '2026-02-28', lastContact: '2026-03-05' },
  { id: '3', name: 'Mike Johnson', email: 'mike@example.com', status: 'Consultation', value: 500, dateAdded: '2026-02-25', lastContact: '2026-03-07' },
  { id: '4', name: 'Sarah Williams', email: 'sarah@example.com', status: 'Proposal', value: 1200, dateAdded: '2026-02-20', lastContact: '2026-03-08' },
  { id: '5', name: 'David Brown', email: 'david@example.com', status: 'Closed Won', value: 1200, dateAdded: '2026-02-15', lastContact: '2026-03-02' },
  { id: '6', name: 'Emily Davis', email: 'emily@example.com', status: 'Closed Lost', value: 300, dateAdded: '2026-02-10', lastContact: '2026-02-25' },
];

const stages = ['New Lead', 'Contacted', 'Consultation', 'Proposal', 'Closed Won', 'Closed Lost'];

export const calculateKPIs = (users: any[], purchases: any[], leads: Lead[]) => {
  const totalRevenue = purchases.reduce((sum, p) => sum + (p.price || 0), 0);
  const mrr = totalRevenue > 0 ? totalRevenue / Math.max(1, new Date().getMonth() + 1) : 12450;
  const ltv = users.length > 0 ? totalRevenue / users.length : 850;
  
  const websiteVisitors = 12500;
  const leadsGenerated = Math.max(850, leads.length);
  const consultations = Math.max(120, leads.filter(l => ['Consultation', 'Proposal', 'Closed Won'].includes(l.status)).length);
  const closedWon = Math.max(45, leads.filter(l => l.status === 'Closed Won').length);

  const leadsPercentage = leadsGenerated > 0 ? ((consultations / leadsGenerated) * 100).toFixed(1) : '0.0';
  const consultationsPercentage = leadsGenerated > 0 ? ((consultations / leadsGenerated) * 100).toFixed(1) : '0.0';
  const closedWonPercentage = consultations > 0 ? ((closedWon / consultations) * 100).toFixed(1) : '0.0';

  return {
    totalRevenue,
    mrr,
    ltv,
    activeUsers: users.length,
    websiteVisitors,
    leadsGenerated,
    consultations,
    closedWon,
    leadsPercentage,
    consultationsPercentage,
    closedWonPercentage
  };
};

export default function SalesAndGrowthCRM() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'kpis'>('kpis');
  const [users, setUsers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [growthKPIs, setGrowthKPIs] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    name: '',
    email: '',
    value: 0,
    status: 'New Lead'
  });
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingCardData, setEditingCardData] = useState<Partial<Lead>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsRes, usersRes, purchasesRes, growthRes] = await Promise.all([
          fetch('/api/leads'),
          fetch('/api/users'),
          fetch('/api/purchases'),
          fetch('/api/admin/growth-kpis')
        ]);
        
        if (leadsRes.ok) setLeads(await leadsRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());
        if (purchasesRes.ok) setPurchases(await purchasesRes.json());
        if (growthRes.ok) setGrowthKPIs(await growthRes.json());
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch data", err);
        setLoading(false);
      }
    };

    fetchData();

    // Real-time updates every 30 seconds
    const interval = setInterval(async () => {
      try {
        const growthRes = await fetch('/api/admin/growth-kpis');
        if (growthRes.ok) {
          setGrowthKPIs(await growthRes.json());
        }
      } catch (err) {
        console.error("Failed to refresh growth KPIs", err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleAddLead = async () => {
    if (!newLead.name || !newLead.email) return;
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLead.name,
          email: newLead.email,
          status: newLead.status || 'New Lead',
          value: Number(newLead.value) || 0,
          dateAdded: getCurrentDate(),
          lastContact: getCurrentDate(),
        })
      });
      if (response.ok) {
        const newLeadData = await response.json();
        setLeads(prev => [newLeadData, ...prev]);
        setShowAddModal(false);
        setNewLead({ name: '', email: '', value: 0, status: 'New Lead' });
      }
    } catch (err) {
      console.error("Failed to add lead", err);
    }
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingLead) return;
    try {
      const response = await fetch(`/api/leads/${editingLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingLead)
      });
      if (response.ok) {
        setLeads(prev => prev.map(l => l.id === editingLead.id ? editingLead : l));
        setShowEditModal(false);
        setEditingLead(null);
      }
    } catch (err) {
      console.error("Failed to update lead", err);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: Lead['status']) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, lastContact: getCurrentDate() })
      });
      if (response.ok) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus, lastContact: getCurrentDate() } : l));
      }
    } catch (err) {
      console.error("Failed to update lead status", err);
    }
  };

  const deleteLead = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
      if (response.ok) {
        setLeads(prev => prev.filter(l => l.id !== leadId));
      }
    } catch (err) {
      console.error("Failed to delete lead", err);
    }
  };

  const handleSaveCardEdit = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCardData)
      });
      if (response.ok) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...editingCardData } : l));
        setEditingCardId(null);
      }
    } catch (err) {
      console.error("Failed to update lead", err);
    }
  };

  const getLeadsByStatus = (status: string) => leads.filter(lead => lead.status === status);

  const allPrograms = [
    { title: '52 Week Program', price: 6000 },
    { title: '16 Week Online Training Program', price: 3000 },
    { title: '8 Week Online Training Program', price: 1500 },
    { title: 'Personal Training Session', price: 60 },
    { title: '52 Week Flexibility & Mobility Online Program', price: 5000 },
    { title: '16 Week Flexibility & Mobility Online Program', price: 2500 },
    { title: '8 Week Flexibility & Mobility Online Program', price: 1500 },
    { title: '52 Week Nutrition Plan', price: 6000 },
    { title: '16 Week Nutrition Plan', price: 2500 },
    { title: '8 Week Nutrition Plan', price: 1200 },
    { title: 'Baseball / Softball Hitting Lessons', price: 50 },
    { title: 'Baseball / Softball Fielding Lessons', price: 50 },
    { title: 'Baseball / Softball Hitting Analysis', price: 50 },
    { title: 'Team Strength & Conditioning Clinic', price: 20 },
    { title: 'Baseball / Softball Team Hitting Clinic', price: 20 },
    { title: 'Baseball / Softball Team Defense Clinic', price: 20 },
  ];

  const calculateTotalPipelineValue = () => leads
      .filter(lead => !['Closed Won', 'Closed Lost'].includes(lead.status))
      .reduce((sum, lead) => sum + lead.value, 0);

  const kpis = calculateKPIs(users, purchases, leads);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors ${activeTab === 'pipeline' ? 'bg-gold text-black' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
          >
            Sales Pipeline
          </button>
          <button
            onClick={() => setActiveTab('kpis')}
            className={`px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors ${activeTab === 'kpis' ? 'bg-gold text-black' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
          >
            Growth KPIs
          </button>
        </div>
      </div>

      {activeTab === 'kpis' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                label: 'Total Revenue', 
                value: `$${(growthKPIs?.totalRevenue || kpis.totalRevenue).toLocaleString()}`, 
                icon: DollarSign,
                growth: growthKPIs?.revenueGrowth
              },
              { 
                label: 'Monthly Revenue', 
                value: `$${(growthKPIs?.mrr || kpis.mrr).toLocaleString()}`, 
                icon: TrendingUp,
                growth: growthKPIs?.revenueGrowth // Using same growth for now as it's month-over-month
              },
              { 
                label: 'Lifetime Value (LTV)', 
                value: `$${(growthKPIs?.ltv || kpis.ltv).toLocaleString()}`, 
                icon: Target 
              },
              { 
                label: 'Active Users', 
                value: (growthKPIs?.totalUsers || kpis.activeUsers).toString(), 
                icon: Users,
                growth: growthKPIs?.userGrowth
              },
            ].map((kpi, i) => (
              <div key={i} className="bg-zinc-900 border border-white/10 p-6 rounded-3xl">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/5 rounded-2xl">
                    <kpi.icon className="w-6 h-6 text-gold" />
                  </div>
                  {kpi.growth !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-bold ${kpi.growth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {kpi.growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(kpi.growth)}%
                    </div>
                  )}
                </div>
                <div className="text-3xl font-black italic">{kpi.value}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-white/60 mt-1">{kpi.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { 
                label: 'Lead Conversion Rate', 
                value: `${growthKPIs?.leadConversionRate || kpis.leadsPercentage}%`,
                growth: growthKPIs?.leadGrowth
              },
              { 
                label: 'Consultation Rate', 
                value: `${growthKPIs?.consultationRate || kpis.consultationsPercentage}%` 
              },
              { 
                label: 'Close Rate', 
                value: `${growthKPIs?.closeRate || kpis.closedWonPercentage}%` 
              },
            ].map((kpi, i) => (
              <div key={i} className="bg-zinc-900 border border-white/10 p-6 rounded-3xl">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-bold uppercase tracking-widest text-white/60">{kpi.label}</div>
                  {kpi.growth !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-bold ${kpi.growth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {kpi.growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(kpi.growth)}%
                    </div>
                  )}
                </div>
                <div className="text-4xl font-black italic text-gold">{kpi.value}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black uppercase italic">
              Pipeline Value: <span className="text-gold">${calculateTotalPipelineValue().toLocaleString()}</span>
            </h3>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gold text-black rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Lead
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {stages.map(stage => (
              <div key={stage} className="flex-none w-80 bg-zinc-900/30 border border-white/5 rounded-3xl p-4 flex flex-col max-h-[70vh]">
                <div className="flex justify-between items-center mb-4 px-2">
                  <h4 className="font-bold uppercase tracking-widest text-xs text-white/60">{stage}</h4>
                  <span className="bg-white/10 text-white/60 text-[10px] px-2 py-1 rounded-full font-bold">
                    {getLeadsByStatus(stage).length}
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                  {getLeadsByStatus(stage).map(lead => {
                    const isEditing = editingCardId === lead.id;
                    return (
                    <motion.div 
                      layoutId={lead.id}
                      key={lead.id}
                      className="bg-zinc-900 border border-white/10 p-4 rounded-2xl cursor-pointer hover:border-gold/50 transition-colors"
                      onClick={(e) => {
                        if (!isEditing && !(e.target as HTMLElement).closest('button')) {
                          setEditingCardId(lead.id);
                          setEditingCardData(lead);
                        }
                      }}
                    >
                      {isEditing ? (
                        <div className="space-y-3" onClick={e => e.stopPropagation()}>
                          <input 
                            type="text" 
                            value={editingCardData.name || ''} 
                            onChange={e => setEditingCardData({...editingCardData, name: e.target.value})}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-gold/50 outline-none"
                            placeholder="Name"
                          />
                          <input 
                            type="email" 
                            value={editingCardData.email || ''} 
                            onChange={e => setEditingCardData({...editingCardData, email: e.target.value})}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-gold/50 outline-none"
                            placeholder="Email"
                          />
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              value={editingCardData.value || ''} 
                              onChange={e => setEditingCardData({...editingCardData, value: Number(e.target.value)})}
                              className="w-1/2 bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-gold/50 outline-none"
                              placeholder="Value ($)"
                            />
                            <input 
                              type="date" 
                              value={editingCardData.lastContact || ''} 
                              onChange={e => setEditingCardData({...editingCardData, lastContact: e.target.value})}
                              className="w-1/2 bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-gold/50 outline-none"
                            />
                          </div>
                          <textarea
                            value={editingCardData.notes || ''}
                            onChange={e => setEditingCardData({...editingCardData, notes: e.target.value})}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-gold/50 outline-none min-h-[60px] resize-none"
                            placeholder="Interaction notes..."
                          />
                          <div className="flex gap-2 pt-2">
                            <button 
                              onClick={() => setEditingCardId(null)}
                              className="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border border-white/10 hover:bg-white/5 transition-colors"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => handleSaveCardEdit(lead.id)}
                              className="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest bg-gold text-black hover:bg-white transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-bold text-sm">{lead.name}</h5>
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const menu = document.getElementById(`menu-${lead.id}`);
                              if (menu) menu.classList.toggle('hidden');
                            }}
                            className="p-1 text-white/40 hover:text-white cursor-pointer"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          <div id={`menu-${lead.id}`} className="absolute right-0 top-full mt-2 w-48 bg-zinc-800 border border-white/10 rounded-xl shadow-xl hidden z-20 overflow-hidden">
                            <div className="p-2 text-[10px] font-bold uppercase tracking-widest text-white/40 border-b border-white/5">Actions</div>
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation();
                                setEditingCardId(lead.id);
                                setEditingCardData(lead);
                                document.getElementById(`menu-${lead.id}`)?.classList.add('hidden'); 
                              }}
                              className="w-full text-left px-4 py-2 text-xs hover:bg-white/5 transition-colors"
                            >
                              Edit Lead
                            </button>
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation();
                                setLeads(leads.map(l => l.id === lead.id ? { ...l, lastContact: getCurrentDate() } : l));
                                document.getElementById(`menu-${lead.id}`)?.classList.add('hidden'); 
                              }}
                              className="w-full text-left px-4 py-2 text-xs hover:bg-white/5 transition-colors"
                            >
                              Log Contact Today
                            </button>
                            <div className="p-2 text-[10px] font-bold uppercase tracking-widest text-white/40 border-b border-white/5">Move to...</div>
                            {stages.filter(s => s !== stage).map(s => (
                              <button 
                                key={s}
                                onClick={(e) => { 
                                  e.stopPropagation();
                                  updateLeadStatus(lead.id, s as any); 
                                  document.getElementById(`menu-${lead.id}`)?.classList.add('hidden'); 
                                }}
                                className="w-full text-left px-4 py-2 text-xs hover:bg-white/5 transition-colors"
                              >
                                {s}
                              </button>
                            ))}
                            <div className="border-t border-white/5 mt-1 pt-1">
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation();
                                  deleteLead(lead.id); 
                                  document.getElementById(`menu-${lead.id}`)?.classList.add('hidden'); 
                                }}
                                className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                Delete Lead
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-white/40 mb-3">{lead.email}</div>
                      {lead.notes && (
                        <div className="text-xs text-white/60 mb-3 bg-black/20 p-2 rounded-lg border border-white/5 italic">
                          "{lead.notes}"
                        </div>
                      )}
                      {(lead.sports || lead.sessionRequests || lead.positions) && (
                        <div className="text-[10px] text-white/60 mb-3 bg-black/20 p-2 rounded-lg border border-white/5 space-y-1">
                          {lead.sports && <div><span className="font-bold text-gold">Sports:</span> {lead.sports.join(', ')}</div>}
                          {lead.positions && <div><span className="font-bold text-gold">Positions:</span> {lead.positions.join(', ')}</div>}
                          {lead.sessionRequests && <div><span className="font-bold text-gold">Requests:</span> {lead.sessionRequests.join(', ')}</div>}
                        </div>
                      )}
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-emerald-400">${lead.value}</span>
                        <span className="text-white/40" title="Last Contacted">
                          <Activity className="w-3 h-3 inline mr-1 opacity-50" />
                          {new Date(lead.lastContact).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      </>
                      )}
                    </motion.div>
                  )})}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showEditModal && editingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-md w-full"
          >
            <h3 className="text-2xl font-black uppercase italic mb-6">Edit Lead</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1 block">Name</label>
                <input type="text" value={editingLead.name} onChange={(e) => setEditingLead({...editingLead, name: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-gold/50 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1 block">Email</label>
                <input type="email" value={editingLead.email} onChange={(e) => setEditingLead({...editingLead, email: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-gold/50 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1 block">Program</label>
                <select
                  onChange={(e) => {
                    const selected = allPrograms.find(p => p.title === e.target.value);
                    if (selected) {
                      setEditingLead({...editingLead, value: selected.price});
                    }
                  }}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-gold/50 outline-none"
                >
                  <option value="">Select a program</option>
                  {allPrograms.map(p => (
                    <option key={p.title} value={p.title}>{p.title} - ${p.price}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1 block">Potential Value ($)</label>
                <input type="number" value={editingLead.value || ''} onChange={(e) => setEditingLead({...editingLead, value: Number(e.target.value)})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-gold/50 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1 block">Last Contact Date</label>
                <input type="date" value={editingLead.lastContact || ''} onChange={(e) => setEditingLead({...editingLead, lastContact: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-gold/50 outline-none" />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-xs border border-white/10 hover:bg-white/5 transition-colors">Cancel</button>
              <button onClick={handleSaveEdit} className="flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-xs bg-gold text-black hover:bg-white transition-colors">Save Changes</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-md w-full"
          >
            <h3 className="text-2xl font-black uppercase italic mb-6">Add New Lead</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1 block">Name</label>
                <input 
                  type="text" 
                  value={newLead.name}
                  onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-gold/50 outline-none"
                  placeholder="e.g. John Doe"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1 block">Email</label>
                <input 
                  type="email" 
                  value={newLead.email}
                  onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-gold/50 outline-none"
                  placeholder="e.g. john@example.com"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1 block">Potential Value ($)</label>
                <input 
                  type="number" 
                  value={newLead.value || ''}
                  onChange={(e) => setNewLead({...newLead, value: Number(e.target.value)})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-gold/50 outline-none"
                  placeholder="e.g. 500"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1 block">Initial Status</label>
                <select
                  value={newLead.status}
                  onChange={(e) => setNewLead({...newLead, status: e.target.value as Lead['status']})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-gold/50 outline-none"
                >
                  {stages.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-xs border border-white/10 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddLead}
                disabled={!newLead.name || !newLead.email}
                className="flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-xs bg-gold text-black hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Lead
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
