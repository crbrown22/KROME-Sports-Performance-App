import { safeStorage } from '../utils/storage';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Edit2, Activity } from 'lucide-react';

interface PARQData {
  dob: string;
  age: string;
  school: string;
  gradYear: string;
  sports: string[];
  parentName1: string;
  parentPhone1: string;
  parentEmail1: string;
  parentName2: string;
  parentPhone2: string;
  parentEmail2: string;
  tribalAffiliation: string;
  travelTeam: string;
  sessionRequests: string[];
  preferredTimes: string[];
  preferredDays: string[];
  positions: string[];
  bats: string;
  throws: string;
  shirtSize: string;
  
  q1: boolean | null;
  q2: boolean | null;
  q3: boolean | null;
  q4: boolean | null;
  q5: boolean | null;
  q6: boolean | null;
  q7: boolean | null;
  restingHeartRate: string;
  recoveryHeartRate: string;
  bodyFatPercentage: string;
  bloodPressure: string;
  waistMeasurement: string;
  hipMeasurement: string;
  rThighMeasurement: string;
  waistToHipRatio: string;
}

const INITIAL_PARQ: PARQData = {
  dob: '', age: '', school: '', gradYear: '', sports: [],
  parentName1: '', parentPhone1: '', parentEmail1: '',
  parentName2: '', parentPhone2: '', parentEmail2: '',
  tribalAffiliation: '', travelTeam: '', sessionRequests: [],
  preferredTimes: [], preferredDays: [], positions: [],
  bats: '', throws: '', shirtSize: '',
  q1: null, q2: null, q3: null, q4: null, q5: null, q6: null, q7: null,
  restingHeartRate: '', recoveryHeartRate: '', bodyFatPercentage: '',
  bloodPressure: '', waistMeasurement: '', hipMeasurement: '',
  rThighMeasurement: '', waistToHipRatio: ''
};

const questions = [
  { id: 'q1', text: 'Has your doctor ever said you have a heart condition and that you should only do physical activity recommended by a doctor?' },
  { id: 'q2', text: 'Do you feel pain in your chest when you do physical activity?' },
  { id: 'q3', text: 'In the past month, have you had chest pain when you were not doing physical activity?' },
  { id: 'q4', text: 'Do you lose your balance because of dizziness or do you ever lose consciousness?' },
  { id: 'q5', text: 'Do you have a bone or joint problem (for example, back, knee or hip) that could be made worse by a change in your physical activity?' },
  { id: 'q6', text: 'Is your doctor currently prescribing drugs (for example, water pills) for your blood pressure or heart condition?' },
  { id: 'q7', text: 'Do you know of any other reason why you should not do physical activity?' },
];

export default function PARQ({ userId, onComplete, initialReadOnly = false }: { userId: string, onComplete?: () => void, initialReadOnly?: boolean }) {
  const [data, setData] = useState<PARQData>(INITIAL_PARQ);
  const [isEditing, setIsEditing] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(initialReadOnly);

  useEffect(() => {
    setIsReadOnly(initialReadOnly);
  }, [initialReadOnly]);

  useEffect(() => {
    const loadData = async () => {
      if (!userId || userId === 'guest') return;
      try {
        const response = await fetch(`/api/parq/${userId}`);
        if (response.ok) {
          const dbData = await response.json();
          if (dbData) {
            setData(dbData);
          }
        }
      } catch (err) {
        console.error("Error loading PARQ:", err);
      }
    };
    
    loadData();
  }, [userId]);

  useEffect(() => {
    if (isEditing) {
      const priceMap: Record<string, number> = {
        'Personal Training Session': 60,
        '52 Week Program': 6000,
        '16 Week Online Training Program': 3000,
        '8 Week Online Training Program': 1500,
        '52 Week Flexibility & Mobility Online Program': 5000,
        '16 Week Flexibility & Mobility Online Program': 2500,
        '8 Week Flexibility & Mobility Online Program': 1500,
        '52 Week Nutrition Plan': 6000,
        '16 Week Nutrition Plan': 2500,
        '8 Week Nutrition Plan': 1200,
        'Baseball / Softball Hitting Lessons': 50,
        'Baseball / Softball Fielding Lessons': 50,
        'Baseball / Softball Hitting Analysis': 50,
        'Team Strength & Conditioning Clinic': 20,
        'Baseball / Softball Team Hitting Clinic': 20,
        'Baseball / Softball Team Defense Clinic': 20
      };

      const calculateLeadValue = (sessionRequests: string[] = []) => {
        let totalValue = 0;
        sessionRequests.forEach(request => {
          totalValue += priceMap[request] || 0;
        });
        return totalValue;
      };
      
      const leadValue = calculateLeadValue(data.sessionRequests);

      const updateLead = async () => {
        try {
          const leadsRes = await fetch('/api/leads');
          if (leadsRes.ok) {
            const leads = await leadsRes.json();
            const userLead = leads.find((l: any) => l.user_id === parseInt(userId));
            
            if (userLead) {
              await fetch(`/api/leads/${userLead.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sports: data.sports,
                  sessionRequests: data.sessionRequests,
                  preferredTimes: data.preferredTimes,
                  preferredDays: data.preferredDays,
                  positions: data.positions,
                  value: leadValue
                })
              });
            }
          }
        } catch (e) {
          console.error("Failed to update lead in CRM", e);
        }
      };
      
      updateLead();
    }
  }, [data, isEditing, userId]);

  const handleSave = async () => {
    if (userId && userId !== 'guest') {
      try {
        await fetch(`/api/parq/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        await fetch(`/api/users/${userId}/parq-complete`, {
          method: 'PATCH'
        });
      } catch (err) {
        console.error("Error saving PARQ:", err);
      }
    }
    
    setIsEditing(false);
    setIsReadOnly(true);
    if (onComplete) onComplete();
  };

  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl overflow-hidden">
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
        <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
          <Activity className="w-5 h-5 text-gold" /> PAR-Q & Health Metrics
        </h2>
        <button onClick={isEditing ? handleSave : () => { setIsEditing(true); setIsReadOnly(false); }} className="btn-gold flex items-center gap-2 px-4 py-2 text-xs">
          {isEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />} {isEditing ? 'Save' : 'Edit'}
        </button>
      </div>

      {!isReadOnly && (
        <div className="p-6 bg-gold/10 border-b border-gold/20 text-gold text-sm font-bold uppercase tracking-widest text-center">
          Please complete this form to continue.
        </div>
      )}

      <div className="p-6 space-y-8">
        {/* Athlete File Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-black uppercase italic tracking-tighter text-gold">Athlete File</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Date of Birth', key: 'dob', type: 'date' },
              { label: 'Age', key: 'age', type: 'number' },
              { label: 'Athlete School', key: 'school' },
              { label: 'Athlete Grad Yr.', key: 'gradYear' },
              { label: 'Tribal Affiliation', key: 'tribalAffiliation' },
              { label: 'Travel Team', key: 'travelTeam' },
              { label: 'Parent/Guardian Name (1)', key: 'parentName1', required: true },
              { label: 'Parent/Guardian Email (1)', key: 'parentEmail1', required: true },
              { label: 'Parent/Guardian Phone (1)', key: 'parentPhone1', required: true },
              { label: 'Parent/Guardian Name (2)', key: 'parentName2' },
              { label: 'Parent/Guardian Email (2)', key: 'parentEmail2' },
              { label: 'Parent/Guardian Phone (2)', key: 'parentPhone2' },
            ].map((field) => (
              <div key={field.key} className="p-4 bg-white/5 rounded-xl border border-white/5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gold mb-2 block">{field.label} {field.required && '*'}</label>
                {isEditing ? (
                  <input 
                    disabled={isReadOnly}
                    type={field.type || 'text'}
                    value={(data as any)[field.key]}
                    onChange={(e) => setData({...data, [field.key]: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm text-white"
                  />
                ) : (
                  <div className="text-sm text-white">{(data as any)[field.key] || 'Not Answered'}</div>
                )}
              </div>
            ))}
          </div>

          {/* Multi-select fields */}
          <div className="grid grid-cols-1 gap-4">
            {[
              { label: 'Sport(s) Played', key: 'sports', options: ['Baseball', 'Softball', 'Football', 'Soccer', 'Basketball', 'Wrestling', 'Track & Field', 'Golf', 'Cheerleading', 'Dance', 'Swimming'] },
              { label: 'Session Request', key: 'sessionRequests', options: [
                'Personal Training Session', 
                '52 Week Program', 
                '16 Week Online Training Program', 
                '8 Week Online Training Program',
                '52 Week Flexibility & Mobility Online Program',
                '16 Week Flexibility & Mobility Online Program',
                '8 Week Flexibility & Mobility Online Program',
                '52 Week Nutrition Plan',
                '16 Week Nutrition Plan',
                '8 Week Nutrition Plan',
                'Baseball / Softball Hitting Lessons', 
                'Baseball / Softball Fielding Lessons', 
                'Baseball / Softball Hitting Analysis', 
                'Team Strength & Conditioning Clinic', 
                'Baseball / Softball Team Hitting Clinic', 
                'Baseball / Softball Team Defense Clinic'
              ] },
              { label: 'Preferred Training Times', key: 'preferredTimes', options: ['Early Mornings (5am - 8am)', 'Mornings (9am - 11am)', 'Early Afternoon(12pm - 2pm)', 'Mid Afternoon (3pm - 5pm)', 'Early Evenings (6pm - 8pm)', 'Late (9pm - 10pm)', 'Online'] },
              { label: 'Preferred Training Days', key: 'preferredDays', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
            ].map((field) => (
              <div key={field.key} className="p-4 bg-white/5 rounded-xl border border-white/5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gold mb-2 block">{field.label} *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {field.options.map(option => (
                    <label key={option} className="flex items-center gap-2 text-xs text-white/70">
                      <input 
                        type="checkbox" 
                        disabled={isReadOnly}
                        checked={(data as any)[field.key]?.includes(option)}
                        onChange={(e) => {
                          const current = (data as any)[field.key] || [];
                          const next = e.target.checked ? [...current, option] : current.filter((o: string) => o !== option);
                          setData({...data, [field.key]: next});
                        }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {/* Dynamic Positions */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gold mb-2 block">Positions *</label>
              <div className="space-y-4">
                {(() => {
                  const sportPositions: Record<string, string[]> = {
                    'Baseball': ['P', 'C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF'],
                    'Softball': ['P', 'C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF'],
                    'Football': ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K/P'],
                    'Soccer': ['GK', 'DF', 'MF', 'FW'],
                    'Basketball': ['PG', 'SG', 'SF', 'PF', 'C'],
                    'Wrestling': ['Lightweight', 'Middleweight', 'Heavyweight'],
                    'Track & Field': ['Sprinter', 'Distance', 'Jumper', 'Thrower'],
                    'Golf': ['N/A'],
                    'Cheerleading': ['Flyer', 'Base', 'Backspot'],
                    'Dance': ['Dancer'],
                    'Swimming': ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly']
                  };
                  const activeSports = data.sports || [];
                  if (activeSports.length === 0) return <p className="text-xs text-white/40 italic">Select a sport to see positions</p>;

                  return activeSports.map(sport => (
                    <div key={sport}>
                      <h4 className="text-[10px] font-bold uppercase text-white/50 mb-1">{sport}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                        {sportPositions[sport]?.map(option => (
                          <label key={`${sport}-${option}`} className="flex items-center gap-2 text-xs text-white/70">
                            <input 
                              type="checkbox" 
                              disabled={isReadOnly}
                              checked={data.positions?.includes(`${sport}: ${option}`)}
                              onChange={(e) => {
                                const current = data.positions || [];
                                const value = `${sport}: ${option}`;
                                const next = e.target.checked ? [...current, value] : current.filter((o: string) => o !== value);
                                setData({...data, positions: next});
                              }}
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
            
            {/* Single select fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Bats', key: 'bats', options: ['Right', 'Left', 'Switch'] },
                { label: 'Throws', key: 'throws', options: ['Right', 'Left', 'Switch'] },
                { label: 'Shirt Size', key: 'shirtSize', options: ['Small', 'Medium', 'Large', 'X-Large', 'XX-Large'] },
              ].map((field) => (
                <div key={field.key} className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gold mb-2 block">{field.label} *</label>
                  {isEditing ? (
                    <select 
                      disabled={isReadOnly}
                      value={(data as any)[field.key]}
                      onChange={(e) => setData({...data, [field.key]: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm text-white"
                    >
                      <option value="">Select...</option>
                      {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <div className="text-sm text-white">{(data as any)[field.key] || 'Not Answered'}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Existing PAR-Q Questions */}
        <div className="space-y-4">
          <h3 className="text-lg font-black uppercase italic tracking-tighter text-gold">PAR-Q</h3>
          {questions.map((q) => (
            <div key={q.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <span className="text-sm text-white/80 flex-1">{q.text}</span>
              <div className="flex gap-4 ml-4">
                {isEditing ? (
                  <>
                    <label className="flex items-center gap-2 text-xs font-bold uppercase">
                      <input type="radio" disabled={isReadOnly} checked={data[q.id as keyof PARQData] === true} onChange={() => setData({...data, [q.id]: true})} /> Yes
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold uppercase">
                      <input type="radio" disabled={isReadOnly} checked={data[q.id as keyof PARQData] === false} onChange={() => setData({...data, [q.id]: false})} /> No
                    </label>
                  </>
                ) : (
                  <span className="text-xs font-bold uppercase text-gold">
                    {data[q.id as keyof PARQData] === true ? 'Yes' : data[q.id as keyof PARQData] === false ? 'No' : 'Not Answered'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Existing Health Metrics Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-black uppercase italic tracking-tighter text-gold">Health Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Resting Heart Rate', key: 'restingHeartRate' },
              { label: 'Recovery Heart Rate', key: 'recoveryHeartRate' },
              { label: 'Body Fat Percentage', key: 'bodyFatPercentage' },
              { label: 'Blood Pressure', key: 'bloodPressure' },
              { label: 'Waist Measurement', key: 'waistMeasurement' },
              { label: 'Hip Measurement', key: 'hipMeasurement' },
              { label: 'R. Thigh Measurement', key: 'rThighMeasurement' },
              { label: 'Waist to Hip Ratio', key: 'waistToHipRatio' },
            ].map((field) => (
              <div key={field.key} className="p-4 bg-white/5 rounded-xl border border-white/5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gold mb-2 block">{field.label}</label>
                {isEditing ? (
                  <input 
                    disabled={isReadOnly}
                    type="text"
                    value={(data as any)[field.key]}
                    onChange={(e) => setData({...data, [field.key]: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm text-white"
                  />
                ) : (
                  <div className="text-sm text-white">{(data as any)[field.key] || 'Not Answered'}</div>
                )}
              </div>
            ))}
          </div>
        </div>
        {isEditing && !isReadOnly && (
          <div className="p-6 border-t border-white/5 flex justify-end">
            <button onClick={handleSave} className="btn-gold flex items-center gap-2 px-8 py-3 text-sm font-bold uppercase tracking-widest">
              <Save className="w-4 h-4" /> Save Responses
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
