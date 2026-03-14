import { safeStorage } from '../utils/storage';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Scale, 
  Target, 
  Calendar, 
  FileText, 
  Pill, 
  TrendingUp, 
  Save, 
  Edit2, 
  Plus, 
  Trash2, 
  Share2,
  ChevronDown,
  ChevronUp,
  Calculator,
  Info
} from 'lucide-react';
import { formatDate, getCurrentDate } from '../utils/date';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { BodyMetricsData, INITIAL_DATA } from '../types';
import { getSupplementRecommendation, generateDefaultSupplements } from '../utils/supplements';
import { calculateNutritionRecommendations } from '../utils/nutrition';
import { logActivity } from '../utils/activity';

interface BodyCompEntry {
  id: string;
  week: number;
  date: string;
  weight: number;
  height: number;
  bmi: number;
  bodyFat: number;
  leanMuscle: number;
  fatMass: number;
}

interface BodyMetricsProps {
  userId: string;
  data: BodyMetricsData;
  setData: React.Dispatch<React.SetStateAction<BodyMetricsData>>;
}

const SectionHeader = ({ title, icon: Icon, id, expandedSection, toggleSection }: { title: string, icon: any, id: string, expandedSection: string | null, toggleSection: (id: string) => void }) => (
  <button 
    onClick={() => toggleSection(id)}
    className={`w-full flex items-center justify-between p-6 md:p-8 transition-all border-b border-white/5 ${expandedSection === id ? 'bg-white/[0.02]' : 'hover:bg-white/[0.02]'}`}
    aria-expanded={expandedSection === id}
    aria-controls={`section-content-${id}`}
    aria-label={`Toggle ${title} section`}
  >
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${expandedSection === id ? 'bg-gold text-black' : 'bg-gold/10 text-gold'}`}>
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <div className="text-left">
        <h3 className="text-xl font-black uppercase italic tracking-tight">{title}</h3>
        {expandedSection !== id && <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Click to expand</p>}
      </div>
    </div>
    <div className={`w-10 h-10 rounded-full border border-white/10 flex items-center justify-center transition-all ${expandedSection === id ? 'rotate-180 bg-white/10 text-white' : 'text-white/40'}`}>
      <ChevronDown className="w-5 h-5" aria-hidden="true" />
    </div>
  </button>
);

export default function BodyMetrics({ userId, data, setData }: BodyMetricsProps) {
  const [bodyCompHistory, setBodyCompHistory] = useState<BodyCompEntry[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('bodyComp');

  function calculateRMR() {
    // Mifflin-St. Jeor Equation
    // Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
    // Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
    
    const weightKg = data.initialWeight * 0.453592;
    const heightCm = data.height * 2.54;
    
    let rmr = (10 * weightKg) + (6.25 * heightCm) - (5 * data.age);
    rmr += data.gender === 'male' ? 5 : -161;
    
    return Math.round(rmr);
  }

  function calculateAMR() {
    const rmr = calculateRMR();
    const activityFactors = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very_active: 1.725,
      extra_active: 1.9
    };
    return Math.round(rmr * activityFactors[data.activityLevel]);
  }

  useEffect(() => {
    const recommendations = calculateNutritionRecommendations(data);

    // 3. Update if different
    const hasChanged = 
      (data.recommendations.totalCalories !== recommendations.totalCalories && !(isNaN(data.recommendations.totalCalories) && isNaN(recommendations.totalCalories))) ||
      (data.recommendations.proteinGrams !== recommendations.proteinGrams && !(isNaN(data.recommendations.proteinGrams) && isNaN(recommendations.proteinGrams))) ||
      (data.recommendations.carbsGrams !== recommendations.carbsGrams && !(isNaN(data.recommendations.carbsGrams) && isNaN(recommendations.carbsGrams))) ||
      (data.recommendations.fatGrams !== recommendations.fatGrams && !(isNaN(data.recommendations.fatGrams) && isNaN(recommendations.fatGrams)));

    if (hasChanged) {
      setData(prev => ({
        ...prev,
        recommendations
      }));
    }
  }, [data.initialWeight, data.height, data.age, data.gender, data.activityLevel, data.primaryGoal, data.macroStrategy, setData]);

  const updatePrimaryGoal = (newPrimaryGoal: string) => {
    let newGoalStrategy: 'balance' | 'low-mod' | 'high-cho' = 'balance';
    let newMacroStrategy = 'Balanced: 40%CHO/30%PRO/30%FAT';
    
    if (newPrimaryGoal === 'Weight/Fat Loss') {
      newGoalStrategy = 'low-mod';
      newMacroStrategy = 'Low-mod CHO/Mod PRO/Mod FAT';
    } else if (newPrimaryGoal === 'Muscle Gain') {
      newGoalStrategy = 'high-cho';
      newMacroStrategy = 'High CHO/Low FAT/Mod PRO';
    }
    
    setData({...data, primaryGoal: newPrimaryGoal, goalStrategy: newGoalStrategy, macroStrategy: newMacroStrategy});
  };

  // Load data
  useEffect(() => {
    const loadData = async () => {
      // 1. Load Metrics
      if (userId !== 'guest') {
        try {
          const res = await fetch(`/api/metrics/${userId}`);
          if (res.ok) {
            const dbData = await res.json();
            if (dbData) {
              setData(dbData);
              safeStorage.setItem(`krome_metrics_${userId}`, JSON.stringify(dbData));
            }
          }
        } catch (err) {
          console.error("Failed to load metrics from DB", err);
        }

        // 2. Load History from DB
        try {
          const res = await fetch(`/api/body-comp/${userId}`);
          if (res.ok) {
            const dbHistory = await res.json();
            if (dbHistory && dbHistory.length > 0) {
              setBodyCompHistory(dbHistory);
              safeStorage.setItem(`krome_bodycomp_${userId}`, JSON.stringify(dbHistory));
            } else {
              // Fallback to local storage if DB is empty
              const savedHistory = safeStorage.getItem(`krome_bodycomp_${userId}`);
              if (savedHistory) {
                setBodyCompHistory(JSON.parse(savedHistory));
              }
            }
          }
        } catch (err) {
          console.error("Failed to load body comp history from DB", err);
        }
      } else {
        // Fallback to local storage for guest
        const savedData = safeStorage.getItem(`krome_metrics_${userId}`);
        if (savedData) setData(JSON.parse(savedData));
        
        const savedHistory = safeStorage.getItem(`krome_bodycomp_${userId}`);
        if (savedHistory) {
          setBodyCompHistory(JSON.parse(savedHistory));
        }
      }
    };
    
    loadData();
  }, [userId]);

  // Auto-save history to local storage whenever it changes
  useEffect(() => {
    if (bodyCompHistory.length > 0) {
      safeStorage.setItem(`krome_bodycomp_${userId}`, JSON.stringify(bodyCompHistory));
    }
  }, [bodyCompHistory, userId]);

  // Save data
  const handleSave = async () => {
    safeStorage.setItem(`krome_metrics_${userId}`, JSON.stringify(data));
    safeStorage.setItem(`krome_bodycomp_${userId}`, JSON.stringify(bodyCompHistory));
    
    if (userId !== 'guest') {
      try {
        // Save metrics
        await fetch(`/api/metrics/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        // Save history
        await fetch(`/api/body-comp/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ history: bodyCompHistory })
        });
        
        await logActivity(userId, 'metrics_updated', { message: 'Body metrics updated' });
      } catch (err) {
        console.error("Failed to save metrics to DB", err);
      }
    }
    
    setIsEditing(false);
  };

  const addBodyCompEntry = () => {
    const week = bodyCompHistory.length + 1;
    const newEntry: BodyCompEntry = {
      id: Date.now().toString(),
      week: week,
      date: getCurrentDate(),
      weight: week === 1 ? data.initialWeight : 0,
      height: data.height,
      bmi: 0,
      bodyFat: 0,
      leanMuscle: 0,
      fatMass: 0
    };

    // Calculate derived values for Week 1 if weight is set
    if (week === 1 && newEntry.weight > 0) {
      if (newEntry.height > 0) {
        newEntry.bmi = parseFloat(((newEntry.weight / (newEntry.height * newEntry.height)) * 703).toFixed(1));
      }
    }

    setBodyCompHistory([...bodyCompHistory, newEntry]);
    setIsEditing(true);
  };

  const updateBodyCompEntry = (id: string, field: keyof BodyCompEntry, value: any) => {
    const newHistory = bodyCompHistory.map(entry => {
      if (entry.id !== id) return entry;
      
      const numValue = value === '' ? 0 : parseFloat(value);
      const updated = { ...entry, [field]: isNaN(numValue) ? 0 : numValue };
      
      // Auto-calculate lean/fat mass if weight and body fat are present
      const w = field === 'weight' ? (isNaN(numValue) ? 0 : numValue) : entry.weight;
      const bf = field === 'bodyFat' ? (isNaN(numValue) ? 0 : numValue) : entry.bodyFat;
      
      updated.fatMass = parseFloat(((w * bf) / 100).toFixed(1));
      updated.leanMuscle = parseFloat((w - updated.fatMass).toFixed(1));
      
      // Calculate BMI: weight (lb) / [height (in)]^2 * 703
      const h = field === 'height' ? (isNaN(numValue) ? 0 : numValue) : entry.height;
      if (w > 0 && h > 0) {
        updated.bmi = parseFloat(((w / (h * h)) * 703).toFixed(1));
      }
      
      return updated;
    });

    setBodyCompHistory(newHistory);

    // Update initialWeight if the modified entry is the latest one
    const latestEntry = newHistory[newHistory.length - 1];
    if (latestEntry && latestEntry.id === id && field === 'weight') {
      setData(prevData => ({ ...prevData, initialWeight: latestEntry.weight }));
    }
  };

  const deleteBodyCompEntry = (id: string) => {
    setBodyCompHistory(prev => prev.filter(e => e.id !== id));
  };

  const handleShare = () => {
    const summary = `
Body Metrics Summary for ${formatDate(getCurrentDate())}
Weight: ${bodyCompHistory[bodyCompHistory.length - 1]?.weight || data.initialWeight} lbs
Body Fat: ${bodyCompHistory[bodyCompHistory.length - 1]?.bodyFat || '-'}%
RMR: ${calculateRMR()} kcal/day
Goal: ${data.primaryGoal}
    `.trim();
    
    navigator.clipboard.writeText(summary).then(() => {
      alert('Summary copied to clipboard!');
    });
  };

  const updateMacros = (field: keyof BodyMetricsData['recommendations'], value: number) => {
    const newRecommendations = { ...data.recommendations, [field]: value };
    const totalCalories = (newRecommendations.proteinGrams * 4) + (newRecommendations.carbsGrams * 4) + (newRecommendations.fatGrams * 9);
    setData({
      ...data,
      recommendations: { ...newRecommendations, totalCalories }
    });
  };

  const getSupplementRecommendation = (supplementName: string) => {
    const weightKg = data.initialWeight * 0.453592;
    const name = (supplementName || '').toLowerCase();
    
    if (name.includes('creatine')) return `Recommended: ${Math.round(weightKg * 0.05)}g daily for ${data.primaryGoal}`;
    if (name.includes('protein')) return `Recommended: ${Math.round(weightKg * 2)}g daily for ${data.macroStrategy}`;
    if (name.includes('vitamin d')) return "Recommended: 2000-5000 IU daily with a meal";
    if (name.includes('magnesium')) return "Recommended: 200-400mg daily, preferably before bed";
    if (name.includes('omega-3') || name.includes('fish oil')) return "Recommended: 2g daily for inflammation management";
    if (name.includes('multivitamin')) return "Recommended: 1 serving daily to cover micronutrient gaps";
    
    return "Dosage based on individual needs";
  };

  const generateDefaultSupplements = () => {
    const defaultSupps = {
      breakfast: ['Multivitamin', 'Omega-3 Fish Oil', 'Vitamin D3'],
      lunch: [],
      dinner: ['Magnesium'],
      bedtime: [],
      preWorkout: ['Pre-Workout'],
      intraWorkout: ['BCAAs'],
      postWorkout: ['Protein Powder', 'Creatine']
    };
    setData({ ...data, supplements: defaultSupps });
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] backdrop-blur-xl overflow-hidden">
      {/* Header Actions */}
      <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black/20">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">Body <span className="text-gold">Metrics</span></h2>
          <p className="text-xs font-bold uppercase tracking-widest text-white/40">Track your physical evolution</p>
        </div>
        <div className="flex gap-3">
          {isEditing ? (
            <button onClick={handleSave} className="btn-gold flex items-center gap-2 px-6 py-3 text-xs shadow-lg shadow-gold/20" aria-label="Save changes to body metrics">
              <Save className="w-4 h-4" aria-hidden="true" /> Save Changes
            </button>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all krome-outline" aria-label="Edit body metrics">
                <Edit2 className="w-4 h-4" aria-hidden="true" /> Edit
              </button>
              <button onClick={handleShare} className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all krome-outline" aria-label="Share body metrics summary">
                <Share2 className="w-4 h-4" aria-hidden="true" /> Share
              </button>
            </>
          )}
        </div>
      </div>

      {/* 1. Body Composition Tracking */}
      <div>
        <SectionHeader title="Body Composition" icon={Scale} id="bodyComp" expandedSection={expandedSection} toggleSection={toggleSection} />
        <AnimatePresence>
          {expandedSection === 'bodyComp' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Target Weight', key: 'targetWeight', unit: 'lbs' },
                    { label: 'Current Weight', key: 'initialWeight', unit: 'lbs' },
                    { label: 'Height', key: 'height', unit: 'in' },
                    { label: 'BMI', key: 'bmi', unit: '' },
                    { label: 'Goal', key: 'primaryGoal', unit: '', className: 'col-span-2 md:col-span-2' }
                  ].map((field) => (
                    <div key={field.key} className={`bg-black/20 border border-white/5 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden group hover:border-white/10 transition-colors ${field.className || ''}`}>
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity className="w-8 h-8" />
                      </div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">{field.label}</label>
                      {isEditing && field.key !== 'bmi' && field.key !== 'primaryGoal' ? (
                          field.key === 'height' ? (
                            <div className="flex gap-2">
                              <input 
                                type="number"
                                min="0"
                                placeholder="ft"
                                value={Math.floor((data.height || 0) / 12)}
                                onChange={(e) => {
                                  const ft = Math.max(0, parseInt(e.target.value) || 0);
                                  const inches = (data.height || 0) % 12;
                                  setData(prev => ({ ...prev, height: (ft * 12) + inches }));
                                }}
                                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-black italic text-lg w-full focus:border-gold/50"
                              />
                              <input 
                                type="number"
                                min="0"
                                max={11}
                                placeholder="in"
                                value={(data.height || 0) % 12}
                                onChange={(e) => {
                                  const inches = Math.max(0, Math.min(11, parseInt(e.target.value) || 0));
                                  const ft = Math.floor((data.height || 0) / 12);
                                  setData(prev => ({ ...prev, height: (ft * 12) + inches }));
                                }}
                                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-black italic text-lg w-full focus:border-gold/50"
                              />
                            </div>
                          ) : (
                            <input 
                              type={field.key === 'primaryGoal' ? 'text' : 'number'}
                              min={field.key === 'primaryGoal' ? undefined : "0"}
                              value={(data as any)[field.key]}
                              onChange={(e) => {
                                const val = field.key === 'primaryGoal' ? e.target.value : Math.max(0, parseFloat(e.target.value) || 0);
                                setData(prev => ({ ...prev, [field.key]: val }));
                                
                                // Auto-populate Week 1 weight if initialWeight is changed
                                if (field.key === 'initialWeight') {
                                  setBodyCompHistory(prevHistory => {
                                    const week1Entry = prevHistory.find(entry => entry.week === 1);
                                    if (week1Entry) {
                                      return prevHistory.map(entry => {
                                        if (entry.week === 1) {
                                          const numVal = typeof val === 'string' ? parseFloat(val) : val;
                                          const updated = { ...entry, weight: numVal };
                                          updated.fatMass = parseFloat(((updated.weight * updated.bodyFat) / 100).toFixed(1));
                                          updated.leanMuscle = parseFloat((updated.weight - updated.fatMass).toFixed(1));
                                          if (updated.weight > 0 && updated.height > 0) {
                                            updated.bmi = parseFloat(((updated.weight / (updated.height * updated.height)) * 703).toFixed(1));
                                          }
                                          return updated;
                                        }
                                        return entry;
                                      });
                                    }
                                    return prevHistory;
                                  });
                                }
                              }}
                              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-black italic text-lg w-full focus:border-gold/50"
                            />
                          )
                      ) : (
                        <div className="text-xl font-black italic text-white z-10 break-words leading-tight">
                          {field.key === 'bmi' 
                            ? (data.initialWeight > 0 && data.height > 0 ? parseFloat(((data.initialWeight / (data.height * data.height)) * 703).toFixed(1)) : '-')
                            : field.key === 'primaryGoal'
                              ? (data.primaryGoal || '-')
                              : field.key === 'height'
                                ? `${Math.floor(data.height / 12)}' ${data.height % 12}"`
                                : (data as any)[field.key]}
                          <span className="text-xs font-normal text-white/40 not-italic ml-1">{field.key === 'height' ? '' : field.unit}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Graph */}
                <div className="h-[400px] w-full bg-black/20 border border-white/5 rounded-[32px] p-6 relative">
                  <div className="absolute top-6 left-8 z-10">
                    <h4 className="text-sm font-black uppercase italic text-white/60">Progress <span className="text-gold">Chart</span></h4>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={bodyCompHistory.map(entry => ({ ...entry, targetWeight: data.targetWeight }))} margin={{ top: 40, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis dataKey="date" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} unit=" lbs" />
                      <YAxis yAxisId="right" orientation="right" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} unit="%" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#09090b', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          fontSize: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                        }}
                        itemStyle={{ color: '#D4AF37', fontWeight: 'bold' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                      <Area yAxisId="left" type="monotone" dataKey="weight" stroke="#D4AF37" fill="url(#colorWeight)" name="Weight" strokeWidth={3} />
                      <Line yAxisId="left" type="monotone" dataKey="targetWeight" stroke="#008080" name="Target" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="bodyFat" stroke="#8884d8" name="Body Fat %" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-black/20 border border-white/5 rounded-[32px] overflow-hidden">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                          <th className="p-4 whitespace-nowrap">Week</th>
                          <th className="p-4 whitespace-nowrap">Date</th>
                          <th className="p-4 whitespace-nowrap">Weight</th>
                          <th className="p-4 whitespace-nowrap">Body Fat</th>
                          <th className="p-4 whitespace-nowrap">Lean Mass</th>
                          <th className="p-4 whitespace-nowrap">Fat Mass</th>
                          {isEditing && <th className="p-4 text-right whitespace-nowrap">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {bodyCompHistory.map((entry) => (
                          <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                            <td className="p-4 font-black text-gold">#{entry.week}</td>
                            <td className="p-4">
                              {isEditing ? (
                                <input 
                                  type="date" 
                                  value={entry.date}
                                  onChange={(e) => updateBodyCompEntry(entry.id, 'date', e.target.value)}
                                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white w-32 focus:border-gold/50 krome-outline"
                                />
                              ) : <span className="font-mono text-white/80">{entry.date}</span>}
                            </td>
                            <td className="p-4">
                              {isEditing ? (
                                <input 
                                  type="number" 
                                  value={entry.weight}
                                  onChange={(e) => updateBodyCompEntry(entry.id, 'weight', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white w-24 focus:border-gold/50 krome-outline"
                                />
                              ) : <span className="font-bold">{entry.weight} <span className="text-xs font-normal text-white/40">lbs</span></span>}
                            </td>
                            <td className="p-4">
                              {isEditing ? (
                                <input 
                                  type="number" 
                                  value={entry.bodyFat}
                                  onChange={(e) => updateBodyCompEntry(entry.id, 'bodyFat', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white w-24 focus:border-gold/50 krome-outline"
                                />
                              ) : <span className="font-bold">{entry.bodyFat}<span className="text-xs font-normal text-white/40">%</span></span>}
                            </td>
                            <td className="p-4 text-white/60 font-mono">{entry.leanMuscle}</td>
                            <td className="p-4 text-white/60 font-mono">{entry.fatMass}</td>
                            {isEditing && (
                              <td className="p-4 text-right">
                                <button onClick={() => deleteBodyCompEntry(entry.id)} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all krome-outline">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {isEditing && (
                    <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                      <button onClick={addBodyCompEntry} className="w-full py-3 rounded-xl border border-dashed border-white/20 text-white/40 hover:text-gold hover:border-gold/50 hover:bg-gold/5 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 krome-outline">
                        <Plus className="w-4 h-4" /> Add New Entry
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Metabolic Profile */}
      <div>
        <SectionHeader title="Metabolic Profile" icon={Calculator} id="metabolic" expandedSection={expandedSection} toggleSection={toggleSection} />
        <AnimatePresence>
          {expandedSection === 'metabolic' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gold">RMR Calculator Inputs</h4>
                    <div className="group relative">
                      <Info className="w-4 h-4 text-white/40 cursor-help" />
                      <div className="absolute bottom-full left-0 mb-2 w-56 p-2 bg-zinc-800 text-[10px] text-white rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                        Basic metrics used to calculate your Predicted Resting Metabolic Rate (RMR) and Active Metabolic Rate (AMR).
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-2">Gender</label>
                      <select 
                        disabled={!isEditing}
                        value={data.gender}
                        onChange={(e) => setData({...data, gender: e.target.value as any})}
                        className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm text-white focus:border-gold/50 krome-outline"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-2">Age (yrs)</label>
                      <input 
                        disabled={!isEditing}
                        type="number"
                        value={data.age}
                        onChange={(e) => setData({...data, age: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                        className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm focus:border-gold/50 krome-outline"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-2">Height</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input 
                            disabled={!isEditing}
                            type="number"
                            placeholder="ft"
                            value={Math.floor((data.height || 0) / 12)}
                            onChange={(e) => {
                              const ft = parseInt(e.target.value) || 0;
                              const inches = (data.height || 0) % 12;
                              setData({...data, height: (ft * 12) + inches});
                            }}
                            className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm focus:border-gold/50 krome-outline"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">ft</span>
                        </div>
                        <div className="relative flex-1">
                          <input 
                            disabled={!isEditing}
                            type="number"
                            placeholder="in"
                            max={11}
                            value={(data.height || 0) % 12}
                            onChange={(e) => {
                              const inches = parseInt(e.target.value) || 0;
                              const ft = Math.floor((data.height || 0) / 12);
                              setData({...data, height: (ft * 12) + inches});
                            }}
                            className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm focus:border-gold/50 krome-outline"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">in</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-2">Initial Wt (lbs)</label>
                      <input 
                        disabled={!isEditing}
                        type="number"
                        value={data.initialWeight}
                        onChange={(e) => setData({...data, initialWeight: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                        className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm focus:border-gold/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-2">Activity Level</label>
                    <select 
                      disabled={!isEditing}
                      value={data.activityLevel}
                      onChange={(e) => setData({...data, activityLevel: e.target.value as any})}
                      className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm text-white focus:border-gold/50 krome-outline"
                    >
                      <option value="sedentary">Sedentary (Little or no exercise)</option>
                      <option value="light">Light Activity (1-3 days/week)</option>
                      <option value="moderate">Moderate Activity (3-5 days/week)</option>
                      <option value="very_active">Very Active (6-7 days/week)</option>
                      <option value="extra_active">Extra Active (Very hard exercise/physical job)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-2">VO2 Max</label>
                      <input 
                        disabled={!isEditing}
                        type="number"
                        value={data.vo2Max || ''}
                        onChange={(e) => setData({...data, vo2Max: Number(e.target.value)})}
                        placeholder="e.g. 45"
                        className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm focus:border-gold/50 krome-outline"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-2">Resting HR</label>
                      <input 
                        disabled={!isEditing}
                        type="number"
                        value={data.restingHR || ''}
                        onChange={(e) => setData({...data, restingHR: Number(e.target.value)})}
                        placeholder="e.g. 60"
                        className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm focus:border-gold/50 krome-outline"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-1 mb-2">
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Predicted RMR</div>
                        <div className="group relative">
                          <Info className="w-3 h-3 text-white/40 cursor-help" />
                          <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-zinc-800 text-[10px] text-white rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                            Resting Metabolic Rate (RMR) is the number of calories your body burns at rest. Calculated using the Mifflin-St. Jeor equation based on your age, gender, height, and weight.
                          </div>
                        </div>
                      </div>
                      <div className="text-3xl font-black italic text-gold">{calculateRMR()} <span className="text-sm font-normal text-white/40 not-italic">kcal/day</span></div>
                    </div>
                    
                    <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-1 mb-2">
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Predicted AMR</div>
                        <div className="group relative">
                          <Info className="w-3 h-3 text-white/40 cursor-help" />
                          <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-zinc-800 text-[10px] text-white rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                            Active Metabolic Rate (AMR) is your total daily energy expenditure (TDEE). Calculated by multiplying your RMR by your activity level factor.
                          </div>
                        </div>
                      </div>
                      <div className="text-3xl font-black italic text-gold">{calculateAMR()} <span className="text-sm font-normal text-white/40 not-italic">kcal/day</span></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gold">Actual Metabolic Data</h4>
                    <div className="group relative">
                      <Info className="w-4 h-4 text-white/40 cursor-help" />
                      <div className="absolute bottom-full left-0 md:left-auto md:right-0 mb-2 w-56 p-2 bg-zinc-800 text-[10px] text-white rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                        Data obtained from actual metabolic testing (e.g., indirect calorimetry) to measure your true RMR and substrate utilization (fat vs carb burn).
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-2">Actual RMR</label>
                      <input 
                        disabled={!isEditing}
                        type="number"
                        value={data.actualRMR}
                        onChange={(e) => setData({...data, actualRMR: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                        className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm focus:border-gold/50 krome-outline"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-2">Fat Burn %</label>
                      <input 
                        disabled={!isEditing}
                        type="number"
                        value={data.fatBurnPercent}
                        onChange={(e) => setData({...data, fatBurnPercent: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                        className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm focus:border-gold/50 krome-outline"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-2">Carb Burn %</label>
                      <input 
                        disabled={!isEditing}
                        type="number"
                        value={data.carbBurnPercent}
                        onChange={(e) => setData({...data, carbBurnPercent: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                        className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm focus:border-gold/50 krome-outline"
                      />
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-xs font-black uppercase tracking-widest text-gold">Metabolic Priorities</h4>
                      <div className="group relative">
                        <Info className="w-4 h-4 text-white/40 cursor-help" />
                        <div className="absolute bottom-full left-0 md:left-auto md:right-0 mb-2 w-56 p-2 bg-zinc-800 text-[10px] text-white rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                          Assessment of potential metabolic issues based on symptom questionnaires. Helps prioritize interventions for hormonal or metabolic health.
                        </div>
                      </div>
                    </div>
                    {Object.entries(data.metabolicPriority).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center p-4 bg-black/20 rounded-xl border border-white/5">
                        <span className="text-xs font-bold uppercase text-white/60">{key}</span>
                        {isEditing ? (
                          <select 
                            value={value as string}
                            onChange={(e) => setData({...data, metabolicPriority: {...data.metabolicPriority, [key]: e.target.value}})}
                            className="bg-black/50 border border-white/10 rounded-lg text-xs p-2 text-white focus:border-gold/50"
                          >
                            <option value="High concern (7+ symptoms)">High</option>
                            <option value="Moderate concern (5-7 symptoms)">Moderate</option>
                            <option value="Low concern (0-4 symptoms)">Low</option>
                          </select>
                        ) : (
                          <span className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg ${
                            (value as string).includes('High') ? 'bg-red-500/20 text-red-400' :
                            (value as string).includes('Moderate') ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>{(value as string).split(' ')[0]}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Goals & Strategy */}
      <div>
        <SectionHeader title="Goals & Strategy" icon={Target} id="goals" expandedSection={expandedSection} toggleSection={toggleSection} />
        <AnimatePresence>
          {expandedSection === 'goals' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gold mb-4">Goals</h4>
                  
                  <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">Primary Outcome Goal</label>
                    {isEditing ? (
                      <select 
                        value={data.primaryGoal}
                        onChange={(e) => {
                          const newPrimaryGoal = e.target.value;
                          let newGoalStrategy: 'balance' | 'low-mod' | 'high-cho' = 'balance';
                          if (newPrimaryGoal === 'Weight/Fat Loss') newGoalStrategy = 'low-mod';
                          else if (newPrimaryGoal === 'Muscle Gain') newGoalStrategy = 'high-cho';
                          setData({...data, primaryGoal: newPrimaryGoal, goalStrategy: newGoalStrategy});
                        }}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-gold/50"
                      >
                        <option value="Weight/Fat Loss">Weight/Fat Loss</option>
                        <option value="Muscle Gain">Muscle Gain</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Overall Health">Overall Health</option>
                        <option value="Performance">Performance</option>
                      </select>
                    ) : (
                      <div className="text-lg font-black italic text-white">{data.primaryGoal || '-'}</div>
                    )}
                  </div>

                  {[
                    { label: '3-Month SMART Goal', key: 'smartGoal' },
                    { label: 'Long-Term Goal', key: 'longTermGoal' }
                  ].map((field) => (
                    <div key={field.key} className="bg-black/20 p-5 rounded-2xl border border-white/5">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">{field.label}</label>
                      {isEditing ? (
                        <input 
                          type="text"
                          value={(data as any)[field.key]}
                          onChange={(e) => setData({...data, [field.key]: e.target.value})}
                          className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-gold/50"
                        />
                      ) : (
                        <div className="text-sm font-medium text-white">{(data as any)[field.key] || '-'}</div>
                      )}
                    </div>
                  ))}

                  <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">Notes</label>
                    {isEditing ? (
                      <textarea 
                        value={data.notes}
                        onChange={(e) => setData({...data, notes: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-gold/50  h-24"
                      />
                    ) : (
                      <div className="text-sm font-medium text-white/60">{data.notes || '-'}</div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gold mb-4">Strategy Summary</h4>
                  <div className="bg-black/20 p-5 rounded-2xl border border-white/5 space-y-4">
                    {[
                        { label: 'Client Level', key: 'clientLevel', options: ['Level 1: Behavioral Focus', 'Level 2: Track Macros / Calories', 'Level 3: Precise Diet Management'] },
                        { label: 'Goal Strategy', key: 'goalStrategy', readOnly: true },
                        { label: 'Energy Strategy', key: 'energyStrategy', options: ['Deficit', 'Maintenance', 'Surplus'] },
                        { label: 'Macro Strategy', key: 'macroStrategy', options: ['Balanced: 40%CHO/30%PRO/30%FAT', 'Low-mod CHO/Mod PRO/Mod FAT', 'High CHO/Low FAT/Mod PRO', 'Other'] },
                        { label: 'Meal Pattern', key: 'mealPattern', options: ['3 Meals', '2 Meals + 1-2 Shakes', '3 Meals + 1-2 Shakes', '4 Meals + Post-Workout Shake', 'Other'] },
                        { label: 'Shopping Day', key: 'shoppingDay', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
                        { label: 'Meal Prep Day', key: 'mealPrepDay', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">{field.label}</label>
                        {isEditing && !field.readOnly ? (
                          <select 
                            value={(data as any)[field.key]}
                            onChange={(e) => setData({...data, [field.key]: e.target.value})}
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-gold/50"
                          >
                            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <div className="text-sm font-medium text-white">{(data as any)[field.key] || '-'}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">Behavior Focus</label>
                    {isEditing ? (
                      <input 
                        type="text"
                        value={data.behaviorFocus}
                        onChange={(e) => setData({...data, behaviorFocus: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-gold/50"
                      />
                    ) : (
                      <div className="text-sm font-medium text-white">{data.behaviorFocus || '-'}</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Assessments */}
      <div>
        <SectionHeader title="Assessments" icon={Calendar} id="assessments" expandedSection={expandedSection} toggleSection={toggleSection} />
        <AnimatePresence>
          {expandedSection === 'assessments' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gold mb-4">Metabolic Assessments</h4>
                  {['activeMetabolic', 'restingMetabolic', 'symptomQuestionnaire'].map((key) => {
                    const assessment = data.assessments?.[key as keyof typeof data.assessments] as { date: string; retestDate: string } | undefined;
                    return (
                      <div key={key} className="bg-black/20 p-5 rounded-2xl border border-white/5">
                        <div className="text-xs font-bold uppercase mb-4 text-white/60">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-2">Date</label>
                            {isEditing ? (
                              <input 
                                type="date"
                                value={assessment?.date || ''}
                                onChange={(e) => setData({
                                  ...data, 
                                  assessments: {
                                    ...data.assessments, 
                                    [key]: { ...assessment, date: e.target.value }
                                  }
                                })}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-2 text-xs focus:border-gold/50"
                              />
                            ) : (
                              <div className="text-sm font-mono">{assessment?.date || '-'}</div>
                            )}
                          </div>
                          <div>
                            <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-2">Re-Test</label>
                            {isEditing ? (
                              <input 
                                type="date"
                                value={assessment?.retestDate || ''}
                                onChange={(e) => setData({
                                  ...data, 
                                  assessments: {
                                    ...data.assessments, 
                                    [key]: { ...assessment, retestDate: e.target.value }
                                  }
                                })}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-2 text-xs focus:border-gold/50"
                              />
                            ) : (
                              <div className="text-sm font-mono">{assessment?.retestDate || '-'}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gold mb-4">Lab Testing</h4>
                  {['initial', 'retest1', 'retest2', 'retest3'].map((key) => (
                    <div key={key} className="flex justify-between items-center p-4 bg-black/20 rounded-2xl border border-white/5">
                      <span className="text-xs font-bold uppercase text-white/60">{key.replace(/([A-Z0-9])/g, ' $1').trim()}</span>
                      {isEditing ? (
                        <input 
                          type="date"
                          value={data.assessments?.labTesting?.[key as keyof typeof data.assessments.labTesting] || ''}
                          onChange={(e) => setData({
                            ...data, 
                            assessments: {
                              ...data.assessments, 
                              labTesting: { ...data.assessments?.labTesting, [key]: e.target.value }
                            }
                          })}
                          className="bg-black/50 border border-white/10 rounded-xl p-2 text-xs w-32 focus:border-gold/50"
                        />
                      ) : (
                        <span className="text-sm font-mono text-white/80">{data.assessments?.labTesting?.[key as keyof typeof data.assessments.labTesting] || '-'}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. Nutrition Recommendations */}
      <div>
        <SectionHeader title="Nutrition Targets" icon={Pill} id="nutrition" expandedSection={expandedSection} toggleSection={toggleSection} />
        <AnimatePresence>
          {expandedSection === 'nutrition' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-8 space-y-8">
                 <div className="text-xs text-white/60 bg-gold/5 p-5 rounded-2xl border border-gold/10 flex items-start gap-3">
                   <Info className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                   <div className="leading-relaxed">
                     <span className="font-bold text-gold block mb-1 text-sm uppercase tracking-wide">Calculation Logic</span>
                     Total calories are based on your Predicted AMR ({calculateAMR()} kcal) 
                     {data.primaryGoal === 'Muscle Gain' || data.primaryGoal === 'Weight Gain' ? ' + 500 kcal for Weight Gain' : 
                      data.primaryGoal === 'Weight/Fat Loss' || data.primaryGoal === 'Weight Loss' ? ' - 500 kcal for Weight Loss' : 
                      ` (No change for ${data.primaryGoal})`}.
                   </div>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Protein (g)', key: 'proteinGrams' },
                      { label: 'Fat (g)', key: 'fatGrams' },
                      { label: 'Carbs (g)', key: 'carbsGrams' },
                      { label: 'Total Calories', key: 'totalCalories' }
                    ].map((item) => (
                      <div key={item.key} className="bg-black/40 p-6 rounded-2xl border border-white/5 text-center group hover:border-gold/30 transition-colors relative overflow-hidden">
                        <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 relative z-10">{item.label}</div>
                        <div className="text-3xl font-black italic text-gold group-hover:scale-110 transition-transform relative z-10">{(data.recommendations as any)[item.key]}</div>
                      </div>
                    ))}
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
