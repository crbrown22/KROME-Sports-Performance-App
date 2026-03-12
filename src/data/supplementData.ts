export interface Supplement {
  id: string;
  name: string;
  benefits: string;
  dosage: string;
  timing: string;
  description: string;
  sources: string;
  ranking: number;
}

export const supplements: Supplement[] = [
  {
    id: "creatine",
    name: "Creatine Monohydrate",
    benefits: "Increases strength, power, lean muscle mass, recovery",
    dosage: "3–5 g/day",
    timing: "Pre- or Post-workout",
    description: "Most researched supplement for strength & high-intensity performance",
    sources: "Optimum Nutrition, MuscleTech, BulkSupplements",
    ranking: 1
  },
  {
    id: "whey",
    name: "Whey Protein (Isolate/Concentrate)",
    benefits: "Supports muscle repair and growth, quick protein source",
    dosage: "20–40 g per serving",
    timing: "Post-workout or between meals",
    description: "Fast-digesting protein to optimize recovery and protein intake",
    sources: "Optimum Nutrition, Dymatize, MyProtein",
    ranking: 2
  },
  {
    id: "omega3",
    name: "EPA/DHA (Omega-3)",
    benefits: "Reduces inflammation, supports heart & brain function, aids recovery",
    dosage: "1–3 g combined EPA/DHA per day",
    timing: "Anytime with food",
    description: "Beneficial for joint health, recovery, and anti-inflammatory support",
    sources: "Nordic Naturals, Viva Labs, NOW Foods",
    ranking: 3
  },
  {
    id: "beta_alanine",
    name: "Beta-Alanine",
    benefits: "Delays muscle fatigue, improves high-intensity performance",
    dosage: "3–6 g/day",
    timing: "Split doses",
    description: "Boosts muscle carnosine levels, delaying lactic acid build-up",
    sources: "NOW Foods, Optimum Nutrition, BulkSupplements",
    ranking: 4
  },
  {
    id: "nitric_oxide",
    name: "Nitric Oxide Boosters (L-Arginine, L-Citrulline)",
    benefits: "Improves blood flow, enhances endurance & pump",
    dosage: "3–6 g L-Citrulline",
    timing: "Pre-workout",
    description: "May enhance oxygen delivery and nutrient transport to muscles",
    sources: "BulkSupplements, Kaged Muscle, Nutricost",
    ranking: 5
  },
  {
    id: "caffeine",
    name: "Caffeine / Pre-Workout",
    benefits: "Increases energy, focus, alertness, endurance",
    dosage: "3–6 mg/kg body weight",
    timing: "30–60 min pre-workout",
    description: "Enhances focus and explosive power; avoid late in the day",
    sources: "Coffee, pre-workout powders",
    ranking: 6
  },
  {
    id: "l_theanine",
    name: "L-Theanine + Caffeine",
    benefits: "Smooth focus, reduces jitters",
    dosage: "100–200 mg L-Theanine + 100–200 mg caffeine",
    timing: "Pre-workout or morning",
    description: "Synergistic effect for mental focus and reaction time",
    sources: "Nootropic blends, powders",
    ranking: 7
  },
  {
    id: "magnesium",
    name: "Magnesium (Glycinate or Citrate)",
    benefits: "Supports muscle relaxation, recovery, sleep quality",
    dosage: "300–400 mg/day",
    timing: "Evening",
    description: "Helps improve sleep quality, reduce cramps",
    sources: "NOW Foods, Doctor’s Best, Nature Made",
    ranking: 8
  },
  {
    id: "tart_cherry",
    name: "Tart Cherry / Melatonin",
    benefits: "Improves sleep, recovery, reduces muscle soreness",
    dosage: "1–2 servings tart cherry juice or 0.5–3 mg melatonin",
    timing: "Evening",
    description: "Enhances sleep and overnight muscle repair",
    sources: "CherryActive, Natrol",
    ranking: 9
  },
  {
    id: "hmb",
    name: "HMB (Beta-Hydroxy Beta-Methylbutyrate)",
    benefits: "Reduces muscle breakdown, supports lean mass",
    dosage: "3 g/day",
    timing: "Split doses",
    description: "Especially useful during high-intensity training blocks",
    sources: "Optimum Nutrition, MET-Rx",
    ranking: 10
  },
  {
    id: "beetroot",
    name: "Beetroot Juice / Nitrates",
    benefits: "Improves endurance, oxygen efficiency",
    dosage: "500 ml/day or 6–8 mmol nitrates",
    timing: "2–3 hrs pre-workout",
    description: "Supports stamina, speed, and recovery",
    sources: "Beet It, HumanN",
    ranking: 11
  },
  {
    id: "greens",
    name: "Green Supplements (Spirulina, Chlorella, Greens Powders)",
    benefits: "Supports immunity, antioxidant activity, micronutrient intake",
    dosage: "5–10 g per day",
    timing: "Anytime",
    description: "Helps fill micronutrient gaps, may support recovery & reduce oxidative stress",
    sources: "Athletic Greens, Amazing Grass, NOW Foods",
    ranking: 12
  },
  {
    id: "zinc",
    name: "Zinc",
    benefits: "Supports immunity, hormone production, recovery",
    dosage: "15–30 mg/day",
    timing: "With meal",
    description: "Supports testosterone levels and recovery",
    sources: "NOW Foods, Nature’s Way",
    ranking: 13
  },
  {
    id: "electrolytes",
    name: "Electrolytes",
    benefits: "Maintain hydration, reduce cramping",
    dosage: "As needed (varies)",
    timing: "During or post-workout",
    description: "Especially important for long training sessions",
    sources: "Nuun, Skratch Labs",
    ranking: 14
  }
];
