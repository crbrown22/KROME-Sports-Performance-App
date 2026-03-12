export type FoodItem = {
  id: string;
  name: string;
  per100g: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  };
  serving: {
    size: string;
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  };
  category: string;
};

export interface LoggedFood extends FoodItem {
  logId: string;
  servings: number;
  meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  date: string; // YYYY-MM-DD
}

export const foodDatabase: FoodItem[] = [
  // Fruits
  { id: "apple", name: "Apple", category: "Fruit", per100g: { calories: 52, carbs: 14, protein: 0.3, fat: 0.2 }, serving: { size: "1 medium (182g)", calories: 95, carbs: 25, protein: 0.5, fat: 0.3 } },
  { id: "banana", name: "Banana", category: "Fruit", per100g: { calories: 89, carbs: 23, protein: 1.1, fat: 0.3 }, serving: { size: "1 medium (118g)", calories: 105, carbs: 27, protein: 1.3, fat: 0.3 } },
  { id: "berries", name: "Berries (avg mixed)", category: "Fruit", per100g: { calories: 57, carbs: 14, protein: 1, fat: 0.3 }, serving: { size: "1 cup (150g)", calories: 85, carbs: 21, protein: 1.5, fat: 0.5 } },
  { id: "cherries", name: "Cherries", category: "Fruit", per100g: { calories: 63, carbs: 16, protein: 1, fat: 0.2 }, serving: { size: "1 cup (154g)", calories: 97, carbs: 25, protein: 1.6, fat: 0.3 } },
  { id: "grapefruit", name: "Grapefruit", category: "Fruit", per100g: { calories: 42, carbs: 11, protein: 0.8, fat: 0.1 }, serving: { size: "1/2 fruit (123g)", calories: 52, carbs: 13, protein: 1, fat: 0.2 } },
  { id: "grapes", name: "Grapes", category: "Fruit", per100g: { calories: 69, carbs: 18, protein: 0.7, fat: 0.2 }, serving: { size: "1 cup (151g)", calories: 104, carbs: 27, protein: 1, fat: 0.3 } },
  { id: "kiwi", name: "Kiwi", category: "Fruit", per100g: { calories: 61, carbs: 15, protein: 1.1, fat: 0.5 }, serving: { size: "1 medium (69g)", calories: 42, carbs: 10, protein: 0.8, fat: 0.4 } },
  { id: "lemon", name: "Lemon", category: "Fruit", per100g: { calories: 29, carbs: 9, protein: 1.1, fat: 0.3 }, serving: { size: "1 fruit (58g)", calories: 17, carbs: 5, protein: 0.6, fat: 0.2 } },
  { id: "orange", name: "Orange", category: "Fruit", per100g: { calories: 47, carbs: 12, protein: 0.9, fat: 0.1 }, serving: { size: "1 medium (131g)", calories: 62, carbs: 15, protein: 1.2, fat: 0.2 } },
  { id: "peach", name: "Peach", category: "Fruit", per100g: { calories: 39, carbs: 10, protein: 0.9, fat: 0.3 }, serving: { size: "1 medium (150g)", calories: 59, carbs: 15, protein: 1.4, fat: 0.4 } },
  { id: "pear", name: "Pear", category: "Fruit", per100g: { calories: 57, carbs: 15, protein: 0.4, fat: 0.1 }, serving: { size: "1 medium (178g)", calories: 101, carbs: 27, protein: 1, fat: 0.3 } },
  { id: "pineapple", name: "Pineapple", category: "Fruit", per100g: { calories: 50, carbs: 13, protein: 0.5, fat: 0.1 }, serving: { size: "1 cup chunks (165g)", calories: 83, carbs: 22, protein: 1, fat: 0.2 } },
  { id: "plum", name: "Plum", category: "Fruit", per100g: { calories: 46, carbs: 11, protein: 0.7, fat: 0.3 }, serving: { size: "1 medium (66g)", calories: 30, carbs: 8, protein: 0.5, fat: 0.2 } },
  { id: "strawberries", name: "Strawberries", category: "Fruit", per100g: { calories: 32, carbs: 8, protein: 0.7, fat: 0.3 }, serving: { size: "1 cup (152g)", calories: 49, carbs: 12, protein: 1, fat: 0.5 } },
  { id: "tomato", name: "Tomato", category: "Fruit", per100g: { calories: 18, carbs: 4, protein: 0.9, fat: 0.2 }, serving: { size: "1 medium (123g)", calories: 22, carbs: 5, protein: 1, fat: 0.2 } },
  { id: "watermelon", name: "Watermelon", category: "Fruit", per100g: { calories: 30, carbs: 8, protein: 0.6, fat: 0.2 }, serving: { size: "1 cup (152g)", calories: 46, carbs: 12, protein: 1, fat: 0.2 } },
  { id: "dried_cranberries", name: "Dried Cranberries (low sugar)", category: "Fruit", per100g: { calories: 308, carbs: 82, protein: 0.1, fat: 1.4 }, serving: { size: "1/4 cup (40g)", calories: 123, carbs: 33, protein: 0, fat: 0.6 } },
  { id: "raisins", name: "Raisins (low sugar)", category: "Fruit", per100g: { calories: 299, carbs: 79, protein: 3.1, fat: 0.5 }, serving: { size: "1/4 cup (43g)", calories: 129, carbs: 34, protein: 1.3, fat: 0.2 } },

  // Vegetables
  { id: "asparagus", name: "Asparagus", category: "Vegetable", per100g: { calories: 20, carbs: 3.9, protein: 2.2, fat: 0.1 }, serving: { size: "1 cup (134g)", calories: 27, carbs: 5, protein: 3, fat: 0.2 } },
  { id: "bell_peppers", name: "Bell Peppers", category: "Vegetable", per100g: { calories: 31, carbs: 6, protein: 1, fat: 0.3 }, serving: { size: "1 medium (119g)", calories: 37, carbs: 7, protein: 1, fat: 0.4 } },
  { id: "broccoli", name: "Broccoli", category: "Vegetable", per100g: { calories: 34, carbs: 7, protein: 3, fat: 0.4 }, serving: { size: "1 cup (91g)", calories: 31, carbs: 6, protein: 2.5, fat: 0.3 } },
  { id: "brussel_sprouts", name: "Brussel Sprouts", category: "Vegetable", per100g: { calories: 43, carbs: 9, protein: 3.4, fat: 0.3 }, serving: { size: "1 cup (88g)", calories: 38, carbs: 8, protein: 3, fat: 0.3 } },
  { id: "cabbage", name: "Cabbage", category: "Vegetable", per100g: { calories: 25, carbs: 6, protein: 1.3, fat: 0.1 }, serving: { size: "1 cup (89g)", calories: 22, carbs: 5, protein: 1, fat: 0.1 } },
  { id: "cauliflower", name: "Cauliflower", category: "Vegetable", per100g: { calories: 25, carbs: 5, protein: 1.9, fat: 0.3 }, serving: { size: "1 cup (107g)", calories: 27, carbs: 5, protein: 2, fat: 0.3 } },
  { id: "celery", name: "Celery", category: "Vegetable", per100g: { calories: 16, carbs: 3, protein: 0.7, fat: 0.2 }, serving: { size: "1 stalk (40g)", calories: 6, carbs: 1.2, protein: 0.3, fat: 0 } },
  { id: "collard_greens", name: "Collard Greens", category: "Vegetable", per100g: { calories: 32, carbs: 6, protein: 3, fat: 0.6 }, serving: { size: "1 cup (190g cooked)", calories: 63, carbs: 11, protein: 5, fat: 1 } },
  { id: "cucumber", name: "Cucumber", category: "Vegetable", per100g: { calories: 15, carbs: 4, protein: 0.7, fat: 0.1 }, serving: { size: "1/2 cucumber (150g)", calories: 23, carbs: 6, protein: 1, fat: 0.1 } },
  { id: "eggplant", name: "Eggplant", category: "Vegetable", per100g: { calories: 25, carbs: 6, protein: 1, fat: 0.2 }, serving: { size: "1 cup (82g)", calories: 20, carbs: 5, protein: 0.8, fat: 0.1 } },
  { id: "green_beans", name: "Green Beans", category: "Vegetable", per100g: { calories: 31, carbs: 7, protein: 1.8, fat: 0.1 }, serving: { size: "1 cup (125g)", calories: 31, carbs: 7, protein: 2, fat: 0.2 } },
  { id: "lettuce", name: "Lettuce", category: "Vegetable", per100g: { calories: 15, carbs: 2.9, protein: 1.4, fat: 0.2 }, serving: { size: "1 cup shredded (36g)", calories: 5, carbs: 1, protein: 0.5, fat: 0 } },
  { id: "mushrooms", name: "Mushrooms", category: "Vegetable", per100g: { calories: 22, carbs: 3.3, protein: 3.1, fat: 0.3 }, serving: { size: "1 cup (96g)", calories: 21, carbs: 3, protein: 3, fat: 0.3 } },
  { id: "parsley", name: "Parsley", category: "Vegetable", per100g: { calories: 36, carbs: 6, protein: 3, fat: 0.8 }, serving: { size: "1 cup (60g)", calories: 22, carbs: 4, protein: 2, fat: 0.5 } },
  { id: "sweet_potato", name: "Sweet Potato", category: "Vegetable", per100g: { calories: 86, carbs: 20, protein: 1.6, fat: 0.1 }, serving: { size: "1 medium (130g)", calories: 112, carbs: 26, protein: 2, fat: 0.1 } },
  { id: "radish", name: "Radish", category: "Vegetable", per100g: { calories: 16, carbs: 3, protein: 0.7, fat: 0.1 }, serving: { size: "1 cup (116g)", calories: 18, carbs: 4, protein: 1, fat: 0.1 } },
  { id: "mixed_greens", name: "Mixed Greens/Spinach", category: "Vegetable", per100g: { calories: 23, carbs: 3.6, protein: 2.9, fat: 0.4 }, serving: { size: "1 cup raw (30g)", calories: 7, carbs: 1, protein: 1, fat: 0 } },
  { id: "steamed_veggies", name: "Steamed Veggies (avg mix)", category: "Vegetable", per100g: { calories: 35, carbs: 7, protein: 2, fat: 0.5 }, serving: { size: "1 cup (160g)", calories: 55, carbs: 11, protein: 3, fat: 1 } },
  { id: "zucchini", name: "Zucchini", category: "Vegetable", per100g: { calories: 17, carbs: 3, protein: 1.2, fat: 0.3 }, serving: { size: "1 cup (124g)", calories: 21, carbs: 4, protein: 1.5, fat: 0.3 } },
  { id: "carrots", name: "Carrots", category: "Vegetable", per100g: { calories: 41, carbs: 10, protein: 0.9, fat: 0.2 }, serving: { size: "1 cup (128g)", calories: 52, carbs: 12, protein: 1, fat: 0.3 } },
  { id: "beans", name: "Beans (avg cooked)", category: "Vegetable", per100g: { calories: 127, carbs: 23, protein: 9, fat: 0.5 }, serving: { size: "1 cup (172g)", calories: 227, carbs: 41, protein: 15, fat: 1 } },
  { id: "onions", name: "Onions", category: "Vegetable", per100g: { calories: 40, carbs: 9, protein: 1.1, fat: 0.1 }, serving: { size: "1 medium (110g)", calories: 44, carbs: 10, protein: 1, fat: 0.1 } },
  { id: "pickles", name: "Pickles", category: "Vegetable", per100g: { calories: 12, carbs: 2, protein: 0.3, fat: 0.2 }, serving: { size: "1 spear (37g)", calories: 4, carbs: 0.9, protein: 0.1, fat: 0 } },
  { id: "corn", name: "Corn (cooked)", category: "Vegetable", per100g: { calories: 96, carbs: 21, protein: 3.4, fat: 1.5 }, serving: { size: "1 ear (90g)", calories: 77, carbs: 17, protein: 3, fat: 1 } },

  // Proteins & Fats (Nuts, Seeds, Oils, Fish)
  { id: "almonds", name: "Almonds", category: "Protein/Fat", per100g: { calories: 579, carbs: 22, protein: 21, fat: 50 }, serving: { size: "1 oz (23 nuts)", calories: 165, carbs: 6, protein: 6, fat: 14 } },
  { id: "avocado", name: "Avocado", category: "Fat", per100g: { calories: 160, carbs: 9, protein: 2, fat: 15 }, serving: { size: "½ medium (100 g)", calories: 160, carbs: 9, protein: 2, fat: 15 } },
  { id: "cashews", name: "Cashews", category: "Protein/Fat", per100g: { calories: 553, carbs: 30, protein: 18, fat: 44 }, serving: { size: "1 oz (18 nuts)", calories: 155, carbs: 9, protein: 5, fat: 12 } },
  { id: "baked_fish", name: "Baked Fish (Salmon, etc.)", category: "Protein", per100g: { calories: 206, carbs: 0, protein: 22, fat: 12 }, serving: { size: "3 oz cooked", calories: 180, carbs: 0, protein: 22, fat: 10 } },
  { id: "flax_seeds", name: "Flax Seeds", category: "Fat", per100g: { calories: 534, carbs: 29, protein: 18, fat: 42 }, serving: { size: "2 tbsp (14 g)", calories: 75, carbs: 4, protein: 3, fat: 6 } },
  { id: "olive_oil", name: "Olive Oil", category: "Fat", per100g: { calories: 884, carbs: 0, protein: 0, fat: 100 }, serving: { size: "1 tbsp (14 g)", calories: 120, carbs: 0, protein: 0, fat: 14 } },
  { id: "coconut_oil", name: "Coconut Oil", category: "Fat", per100g: { calories: 862, carbs: 0, protein: 0, fat: 100 }, serving: { size: "1 tbsp (14 g)", calories: 120, carbs: 0, protein: 0, fat: 14 } },
  { id: "peanut_butter", name: "Peanut Butter", category: "Protein/Fat", per100g: { calories: 588, carbs: 20, protein: 25, fat: 50 }, serving: { size: "2 tbsp (32 g)", calories: 190, carbs: 7, protein: 8, fat: 16 } },
  { id: "peanuts", name: "Peanuts", category: "Protein/Fat", per100g: { calories: 567, carbs: 16, protein: 26, fat: 49 }, serving: { size: "1 oz (28 g)", calories: 165, carbs: 6, protein: 7, fat: 14 } },
  { id: "pecans", name: "Pecans", category: "Fat", per100g: { calories: 691, carbs: 14, protein: 9, fat: 72 }, serving: { size: "1 oz (19 halves)", calories: 200, carbs: 4, protein: 3, fat: 20 } },
  { id: "sunflower_seeds", name: "Sunflower Seeds", category: "Protein/Fat", per100g: { calories: 584, carbs: 20, protein: 21, fat: 51 }, serving: { size: "1 oz (28 g)", calories: 165, carbs: 6, protein: 5, fat: 14 } },
  { id: "walnuts", name: "Walnuts", category: "Fat", per100g: { calories: 654, carbs: 14, protein: 15, fat: 65 }, serving: { size: "1 oz (14 halves)", calories: 185, carbs: 4, protein: 4, fat: 18 } },

  // Animal Proteins & Dairy
  { id: "salmon", name: "Salmon (cooked)", category: "Protein", per100g: { calories: 206, carbs: 0, protein: 22, fat: 13 }, serving: { size: "1 fillet (154g)", calories: 280, carbs: 0, protein: 34, fat: 20 } },
  { id: "shrimp", name: "Shrimp (cooked)", category: "Protein", per100g: { calories: 99, carbs: 0, protein: 24, fat: 0.3 }, serving: { size: "3 oz (85g)", calories: 84, carbs: 0, protein: 20, fat: 0.2 } },
  { id: "tilapia", name: "Tilapia (cooked)", category: "Protein", per100g: { calories: 128, carbs: 0, protein: 26, fat: 3 }, serving: { size: "1 fillet (87g)", calories: 111, carbs: 0, protein: 23, fat: 2.5 } },
  { id: "tuna", name: "Tuna (cooked, fresh)", category: "Protein", per100g: { calories: 132, carbs: 0, protein: 28, fat: 1 }, serving: { size: "3 oz (85g)", calories: 112, carbs: 0, protein: 24, fat: 1 } },
  { id: "chicken_breast", name: "Chicken Breast (skinless, cooked)", category: "Protein", per100g: { calories: 165, carbs: 0, protein: 31, fat: 3.6 }, serving: { size: "1 breast (120g)", calories: 198, carbs: 0, protein: 37, fat: 4 } },
  { id: "chicken_thigh", name: "Chicken Thigh (skinless, cooked)", category: "Protein", per100g: { calories: 209, carbs: 0, protein: 26, fat: 10.9 }, serving: { size: "1 thigh (130g)", calories: 272, carbs: 0, protein: 34, fat: 14 } },
  { id: "steak", name: "Steak (sirloin, grilled)", category: "Protein", per100g: { calories: 271, carbs: 0, protein: 25, fat: 19 }, serving: { size: "3 oz (85g)", calories: 228, carbs: 0, protein: 22, fat: 16 } },
  { id: "egg", name: "Egg (whole)", category: "Protein/Fat", per100g: { calories: 155, carbs: 1.1, protein: 13, fat: 11 }, serving: { size: "1 large (50g)", calories: 72, carbs: 0.4, protein: 6, fat: 5 } },
  { id: "whey_protein", name: "Whey Protein Isolate", category: "Protein", per100g: { calories: 370, carbs: 8, protein: 90, fat: 1 }, serving: { size: "1 scoop (30g)", calories: 110, carbs: 2, protein: 27, fat: 0.3 } },
  { id: "butter", name: "Butter (unsalted)", category: "Fat", per100g: { calories: 717, carbs: 0.1, protein: 0.9, fat: 81 }, serving: { size: "1 tbsp (14g)", calories: 102, carbs: 0, protein: 0.1, fat: 11 } },
  { id: "greek_yogurt", name: "Greek Yogurt (plain, nonfat)", category: "Protein", per100g: { calories: 59, carbs: 3.6, protein: 10, fat: 0.4 }, serving: { size: "1 cup (170g)", calories: 100, carbs: 6, protein: 17, fat: 0 } },
  { id: "cheese", name: "Cheese (cheddar, avg)", category: "Protein/Fat", per100g: { calories: 402, carbs: 1.3, protein: 25, fat: 33 }, serving: { size: "1 slice (28g)", calories: 113, carbs: 0.4, protein: 7, fat: 9 } },
];
