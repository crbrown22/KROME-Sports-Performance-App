export interface BodyMetricsData {
  gender: 'male' | 'female';
  initialWeight: number;
  targetWeight: number;
  height: number;
  age: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';
  actualRMR: number;
  fatBurnPercent: number;
  carbBurnPercent: number;
  primaryGoal: string;
  smartGoal: string;
  longTermGoal: string;
  notes: string;
  clientLevel: string;
  goalStrategy: 'balance' | 'low-mod' | 'high-cho';
  energyStrategy: string;
  macroStrategy: string;
  mealPattern: string;
  shoppingDay: string;
  mealPrepDay: string;
  behaviorFocus: string;
  assessments: {
    activeMetabolic: { date: string; retestDate: string };
    restingMetabolic: { date: string; retestDate: string };
    symptomQuestionnaire: { date: string; retestDate: string };
    labTesting: { initial: string; retest1: string; retest2: string; retest3: string };
  };
  metabolicPriority: {
    digestive: string;
    inflammation: string;
    hormone: string;
  };
  supplements: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    bedtime: string[];
    preWorkout: string[];
    intraWorkout: string[];
    postWorkout: string[];
  };
  recommendations: {
    proteinGrams: number;
    fatGrams: number;
    carbsGrams: number;
    totalCalories: number;
  };
}

export const INITIAL_DATA: BodyMetricsData = {
  gender: 'male',
  initialWeight: 0,
  targetWeight: 0,
  height: 0,
  age: 0,
  activityLevel: 'moderate',
  actualRMR: 0,
  fatBurnPercent: 0,
  carbBurnPercent: 0,
  primaryGoal: '',
  smartGoal: '',
  longTermGoal: '',
  notes: '',
  clientLevel: '',
  goalStrategy: 'balance',
  energyStrategy: '',
  macroStrategy: '',
  mealPattern: '',
  shoppingDay: '',
  mealPrepDay: '',
  behaviorFocus: '',
  assessments: {
    activeMetabolic: { date: '', retestDate: '' },
    restingMetabolic: { date: '', retestDate: '' },
    symptomQuestionnaire: { date: '', retestDate: '' },
    labTesting: { initial: '', retest1: '', retest2: '', retest3: '' }
  },
  metabolicPriority: {
    digestive: '',
    inflammation: '',
    hormone: ''
  },
  supplements: {
    breakfast: [],
    lunch: [],
    dinner: [],
    bedtime: [],
    preWorkout: [],
    intraWorkout: [],
    postWorkout: []
  },
  recommendations: {
    proteinGrams: 0,
    fatGrams: 0,
    carbsGrams: 0,
    totalCalories: 0
  }
};
