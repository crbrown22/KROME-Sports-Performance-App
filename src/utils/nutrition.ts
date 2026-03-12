import { BodyMetricsData } from "../types";

export function calculateNutritionRecommendations(data: BodyMetricsData) {
  // Mifflin-St. Jeor Equation
  // Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
  // Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
  
  const weightKg = data.initialWeight * 0.453592;
  const heightCm = data.height * 2.54;
  
  let rmr = (10 * weightKg) + (6.25 * heightCm) - (5 * data.age);
  rmr += data.gender === 'male' ? 5 : -161;
  
  const activityFactors = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very_active: 1.725,
    extra_active: 1.9
  };
  
  let amr = Math.round(rmr * activityFactors[data.activityLevel]);
  
  let calories = amr;
  if (data.primaryGoal === 'Muscle Gain' || data.primaryGoal === 'Weight Gain') calories += 500;
  else if (data.primaryGoal === 'Weight/Fat Loss' || data.primaryGoal === 'Weight Loss') calories -= 500;

  // Calculate Macros based on strategy
  let proteinPercent = 0.3;
  let carbPercent = 0.4;
  let fatPercent = 0.3;

  if (data.macroStrategy === 'Low-mod CHO/Mod PRO/Mod FAT') {
    proteinPercent = 0.5;
    carbPercent = 0.3;
    fatPercent = 0.2;
  } else if (data.macroStrategy === 'High CHO/Low FAT/Mod PRO') {
    proteinPercent = 0.3;
    carbPercent = 0.6;
    fatPercent = 0.1;
  }

  const proteinGrams = Math.round((calories * proteinPercent) / 4);
  const carbsGrams = Math.round((calories * carbPercent) / 4);
  const fatGrams = Math.round((calories * fatPercent) / 9);

  return {
    totalCalories: calories,
    proteinGrams,
    carbsGrams,
    fatGrams
  };
}
