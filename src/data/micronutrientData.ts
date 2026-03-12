export interface Micronutrient {
  id: string;
  name: string;
  benefits: string;
  dosage: string;
  solubility: "Fat-soluble" | "Water-soluble";
  description: string;
  sources: string;
  performanceTip: string;
  color: string;
}

export const micronutrients: Micronutrient[] = [
  {
    id: "vit_a",
    name: "Vitamin A",
    benefits: "Vision, immune, cell growth",
    dosage: "900 mcg (M), 700 mcg (F)",
    solubility: "Fat-soluble",
    description: "Healthy skin, eyes, immunity",
    sources: "Carrots, sweet potatoes, spinach, kale",
    performanceTip: "Maintains night vision, reduces infection risk",
    color: "text-green-400"
  },
  {
    id: "vit_b1",
    name: "Vitamin B1 (Thiamine)",
    benefits: "Energy metabolism, nerve function",
    dosage: "1.2 mg (M), 1.1 mg (F)",
    solubility: "Water-soluble",
    description: "Converts carbs into energy, supports nerves",
    sources: "Whole grains, pork, legumes, seeds",
    performanceTip: "Supports endurance and coordination",
    color: "text-blue-400"
  },
  {
    id: "vit_b2",
    name: "Vitamin B2 (Riboflavin)",
    benefits: "Energy production, antioxidant",
    dosage: "1.3 mg (M), 1.1 mg (F)",
    solubility: "Water-soluble",
    description: "Supports metabolism and reduces oxidative stress",
    sources: "Milk, eggs, almonds, leafy greens",
    performanceTip: "Reduces fatigue and soreness",
    color: "text-blue-400"
  },
  {
    id: "vit_b3",
    name: "Vitamin B3 (Niacin)",
    benefits: "Energy metabolism, DNA repair",
    dosage: "16 mg (M), 14 mg (F)",
    solubility: "Water-soluble",
    description: "Converts food to energy",
    sources: "Poultry, tuna, peanuts, mushrooms",
    performanceTip: "Enhances ATP production for explosive power",
    color: "text-blue-400"
  },
  {
    id: "vit_b5",
    name: "Vitamin B5 (Pantothenic Acid)",
    benefits: "Fat metabolism, hormone synthesis",
    dosage: "5 mg",
    solubility: "Water-soluble",
    description: "Produces energy and hormones",
    sources: "Eggs, avocados, whole grains, chicken",
    performanceTip: "Supports endurance during prolonged activity",
    color: "text-blue-400"
  },
  {
    id: "vit_b6",
    name: "Vitamin B6 (Pyridoxine)",
    benefits: "Protein metabolism, neurotransmitter synthesis",
    dosage: "1.3–2 mg",
    solubility: "Water-soluble",
    description: "Breaks down protein, supports brain function",
    sources: "Chicken, bananas, potatoes, salmon",
    performanceTip: "Supports muscle repair and mental focus",
    color: "text-green-400"
  },
  {
    id: "vit_b7",
    name: "Vitamin B7 (Biotin)",
    benefits: "Fat & carb metabolism",
    dosage: "30 mcg",
    solubility: "Water-soluble",
    description: "Energy production, hair/skin/nails",
    sources: "Eggs, nuts, legumes",
    performanceTip: "Supports efficient energy utilization",
    color: "text-blue-400"
  },
  {
    id: "vit_b9",
    name: "Vitamin B9 (Folate)",
    benefits: "Red blood cells, DNA synthesis",
    dosage: "400 mcg",
    solubility: "Water-soluble",
    description: "Cell division and oxygen transport",
    sources: "Leafy greens, beans, fortified grains",
    performanceTip: "Helps oxygen delivery to muscles",
    color: "text-blue-400"
  },
  {
    id: "vit_b12",
    name: "Vitamin B12 (Cobalamin)",
    benefits: "RBC formation, nerve function",
    dosage: "2.4 mcg",
    solubility: "Water-soluble",
    description: "Energy metabolism and neurological health",
    sources: "Meat, fish, dairy, fortified cereals",
    performanceTip: "Supports endurance and recovery",
    color: "text-green-400"
  },
  {
    id: "vit_c",
    name: "Vitamin C",
    benefits: "Antioxidant, immune support, collagen",
    dosage: "90 mg (M), 75 mg (F)",
    solubility: "Water-soluble",
    description: "Tissue repair, reduces oxidative stress",
    sources: "Citrus, strawberries, bell peppers",
    performanceTip: "Reduces oxidative damage from training",
    color: "text-purple-400"
  },
  {
    id: "vit_d",
    name: "Vitamin D",
    benefits: "Bone health, immune support, muscle function",
    dosage: "600 IU (15 mcg)",
    solubility: "Fat-soluble",
    description: "Regulates calcium & phosphorus",
    sources: "Fatty fish, fortified dairy, sunlight",
    performanceTip: "Enhances muscle strength, reduces injury risk",
    color: "text-orange-400"
  },
  {
    id: "vit_e",
    name: "Vitamin E",
    benefits: "Antioxidant, protects cells",
    dosage: "15 mg",
    solubility: "Fat-soluble",
    description: "Protects cells, supports recovery",
    sources: "Almonds, sunflower seeds, spinach",
    performanceTip: "Reduces muscle damage and inflammation",
    color: "text-purple-400"
  },
  {
    id: "vit_k",
    name: "Vitamin K",
    benefits: "Blood clotting, bone health",
    dosage: "120 mcg (M), 90 mcg (F)",
    solubility: "Fat-soluble",
    description: "Clotting and strong bones",
    sources: "Kale, spinach, broccoli",
    performanceTip: "Maintains bone density, prevents fractures",
    color: "text-orange-400"
  }
];
