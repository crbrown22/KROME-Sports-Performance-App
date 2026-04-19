import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ALL_PROGRAMS, FullProgramTemplate } from '../data/workoutTemplates';

interface ProgramContextType {
  programs: FullProgramTemplate[];
  loading: boolean;
  refreshPrograms: () => Promise<void>;
}

const ProgramContext = createContext<ProgramContextType | undefined>(undefined);

export const ProgramProvider = ({ children }: { children: ReactNode }) => {
  const [programs, setPrograms] = useState<FullProgramTemplate[]>(ALL_PROGRAMS);
  const [loading, setLoading] = useState(true);

  const refreshPrograms = async () => {
    try {
      const res = await fetch('/api/global-programs');
      if (res.ok) {
        const overrides = await res.json();
        if (overrides && Array.isArray(overrides)) {
          setPrograms(prev => {
            const merged = [...ALL_PROGRAMS];
            overrides.forEach((override: any) => {
              const index = merged.findIndex(p => p.id === override.id);
              if (index !== -1) {
                // Merge override into existing hardcoded program
                merged[index] = { 
                  ...merged[index], 
                  ...override,
                  // Ensure ID stays the same
                  id: merged[index].id 
                };
              } else {
                // New global program template
                merged.push(override);
              }
            });
            return merged;
          });
        }
      }
    } catch (err) {
      console.error("Error fetching global program overrides:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshPrograms();
  }, []);

  return (
    <ProgramContext.Provider value={{ programs, loading, refreshPrograms }}>
      {children}
    </ProgramContext.Provider>
  );
};

export const usePrograms = () => {
  const context = useContext(ProgramContext);
  if (context === undefined) {
    throw new Error('usePrograms must be used within a ProgramProvider');
  }
  return context;
};
