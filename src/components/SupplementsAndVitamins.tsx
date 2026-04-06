import { safeStorage } from '../utils/storage';
import React from 'react';
import { Pill } from 'lucide-react';
import { BodyMetricsData } from '../types';

interface SupplementsAndVitaminsProps {
  data: BodyMetricsData;
  setData: React.Dispatch<React.SetStateAction<BodyMetricsData>>;
  isEditing: boolean;
  getSupplementRecommendation: (name: string, data: BodyMetricsData) => string;
  generateDefaultSupplements: (data: BodyMetricsData, setData: React.Dispatch<React.SetStateAction<BodyMetricsData>>) => void;
}

export default function SupplementsAndVitamins({ data, setData, isEditing, getSupplementRecommendation, generateDefaultSupplements }: SupplementsAndVitaminsProps) {
  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
            <Pill className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold uppercase italic text-white">Supplements and Vitamins</h3>
        </div>
      </div>
      <div className="flex justify-end">
        <button 
          onClick={() => generateDefaultSupplements(data, setData)}
          className="text-xs font-bold uppercase tracking-widest text-gold hover:text-white transition-colors"
        >
          Auto-fill Supplements
        </button>
      </div>
      <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
          <h4 className="text-xs font-black uppercase tracking-widest text-gold mb-4">Recommended Supplements</h4>
          <div className="text-sm text-white/70 space-y-2">
              {data.primaryGoal === 'Muscle Gain' && (
                <p>• <strong>Creatine Monohydrate:</strong> 5g daily to support muscle growth and strength.</p>
              )}
              {data.primaryGoal === 'Weight/Fat Loss' && (
                <p>• <strong>Green Tea Extract:</strong> 250-500mg daily to support metabolic rate.</p>
              )}
              <p>• <strong>Multivitamin:</strong> 1 serving daily to cover micronutrient gaps.</p>
              <p>• <strong>Omega-3 Fish Oil:</strong> 2g daily for inflammation management and heart health.</p>
              <p>• <strong>Vitamin D3:</strong> 2000-5000 IU daily to support immune function and mood.</p>
              <p>• <strong>Magnesium:</strong> 200-400mg daily to support sleep and recovery.</p>
          </div>
        </div>
      <div>
        <h4 className="text-xs font-black uppercase tracking-widest text-gold mb-4">Daily Supplements</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['breakfast', 'lunch', 'dinner', 'bedtime'].map((time) => (
            <div key={time} className="bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">{time}</div>
              {isEditing ? (
                <textarea 
                  value={(data.supplements as any)?.[time]?.join('\n') || ''}
                  onChange={(e) => setData({
                    ...data, 
                    supplements: { ...data.supplements, [time]: e.target.value.split('\n') }
                  })}
                  placeholder="Enter supplements (one per line)"
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs h-24"
                />
              ) : (
                <ul className="list-disc list-inside text-sm text-white/80 space-y-1">
                  {(data.supplements as any)?.[time]?.length > 0 ? (
                    (data.supplements as any)[time].map((item: string, i: number) => (
                      <li key={i}>
                        {item}
                        {isEditing && (
                          <div className="text-[10px] text-gold italic mt-1">
                            {getSupplementRecommendation(item, data)}
                          </div>
                        )}
                      </li>
                    ))
                  ) : (
                    <li className="text-white/20 list-none text-xs italic">No supplements listed</li>
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-black uppercase tracking-widest text-gold mb-4">Workout Supplements</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['preWorkout', 'intraWorkout', 'postWorkout'].map((time) => (
            <div key={time} className="bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">{time.replace(/([A-Z])/g, '-$1').trim()}</div>
              {isEditing ? (
                <textarea 
                  value={(data.supplements as any)?.[time]?.join('\n') || ''}
                  onChange={(e) => setData({
                    ...data, 
                    supplements: { ...data.supplements, [time]: e.target.value.split('\n') }
                  })}
                  placeholder="Enter supplements (one per line)"
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs h-24"
                />
              ) : (
                <ul className="list-disc list-inside text-sm text-white/80 space-y-1">
                  {(data.supplements as any)?.[time]?.length > 0 ? (
                    (data.supplements as any)[time].map((item: string, i: number) => (
                      <li key={i}>
                        {item}
                        {isEditing && (
                          <div className="text-[10px] text-gold italic mt-1">
                            {getSupplementRecommendation(item, data)}
                          </div>
                        )}
                      </li>
                    ))
                  ) : (
                    <li className="text-white/20 list-none text-xs italic">None</li>
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
