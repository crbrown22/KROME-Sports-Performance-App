import React from 'react';
import { BodyMetricsData } from '../types';

export const getSupplementRecommendation = (supplementName: string, data: BodyMetricsData) => {
  const weightKg = data.initialWeight * 0.453592;
  const name = supplementName.toLowerCase();
  
  if (name.includes('creatine')) return `Recommended: ${Math.round(weightKg * 0.05)}g daily for ${data.primaryGoal}`;
  if (name.includes('protein')) return `Recommended: ${Math.round(weightKg * 2)}g daily for ${data.macroStrategy}`;
  if (name.includes('vitamin d')) return "Recommended: 2000-5000 IU daily with a meal";
  if (name.includes('magnesium')) return "Recommended: 200-400mg daily, preferably before bed";
  if (name.includes('omega-3') || name.includes('fish oil')) return "Recommended: 2g daily for inflammation management";
  if (name.includes('multivitamin')) return "Recommended: 1 serving daily to cover micronutrient gaps";
  
  return "Dosage based on individual needs";
};

export const generateDefaultSupplements = (data: BodyMetricsData, setData: React.Dispatch<React.SetStateAction<BodyMetricsData>>) => {
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
