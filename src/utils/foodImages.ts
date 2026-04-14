export const getFoodImage = (category: string, name: string): string => {
  const lowerName = name.toLowerCase();
  
  // Specific high-quality Unsplash mappings for common foods
  const specificMappings: Record<string, string> = {
    'apple': 'photo-1560806887-1e4cd0b6cbd6',
    'banana': 'photo-1603833665858-e61d17a86224',
    'berries': 'photo-1464965911861-746a04b4bca6',
    'broccoli': 'photo-1452948491233-ad8a1ed01085',
    'chicken breast': 'photo-1604908176997-125f25cc6f3d',
    'salmon': 'photo-1467003909585-2f8a72700288',
    'avocado': 'photo-1523049673857-eb18f1d7b578',
    'egg': 'photo-1506084868730-342b1f852e0d',
    'steak': 'photo-1600891964092-4316c288032e',
    'orange': 'photo-1557800636-894a64c1696f',
    'strawberry': 'photo-1464965911861-746a04b4bca6',
    'tomato': 'photo-1518977676601-b53f82aba655',
    'watermelon': 'photo-1587049352846-4a222e784d38',
    'asparagus': 'photo-1515471209610-dae1c92d8161',
    'cucumber': 'photo-1449300079323-02e209d9d02e',
    'sweet potato': 'photo-1596097635121-14b63b7a0c19',
    'almonds': 'photo-1508029060041-f3926f4434bb',
    'peanut butter': 'photo-1590301157890-4810ed352733',
    'greek yogurt': 'photo-1488477181946-6428a0291777',
    'cheese': 'photo-1486297678162-ad2a19b058f1',
    'cherries': 'photo-1528821128474-27fcaecc357e',
    'grapefruit': 'photo-1528826063941-df95f298831a',
    'grapes': 'photo-1537640538966-79f369b41e8f',
    'kiwi': 'photo-1591735156682-6b638b7158f1',
    'lemon': 'photo-1590502593747-42a996133562',
    'peach': 'photo-1521236575383-1f3007bb1eae',
    'pear': 'photo-1514756331096-242f390efe2a',
    'pineapple': 'photo-1550258114-b1364a03f838',
    'plum': 'photo-1521236752487-84afaa504460',
    'carrots': 'photo-1598170845058-32b996a6bd11',
    'mushrooms': 'photo-1504674900247-0877df9cc836',
    'corn': 'photo-1551754655-cd27e38d2076',
    'shrimp': 'photo-1559742811-822873691df8',
    'tuna': 'photo-1501595091296-3a970afb3ffb',
    'tilapia': 'photo-1534604973900-c43ab4c2e0ab',
    'butter': 'photo-1589985270826-4b7bb135bc9d',
    'mixed greens': 'photo-1540420773420-3366772f4999',
    'spinach': 'photo-1576045057995-568f588f82fb',
    'oatmeal': 'photo-1517673132405-a56a62b18caf',
    'rice': 'photo-1512058560366-cd2427ff1141',
    'pasta': 'photo-1473093226795-af9932fe5856',
    'bread': 'photo-1509440159596-0249088772ff',
    'milk': 'photo-1550583724-1255818c0533',
    'coffee': 'photo-1495474472287-4d71bcdd2085',
    'tea': 'photo-1544787210-22bb830636bb'
  };

  // Try to find a match by checking if the specific mapping key is contained in the name
  const match = Object.keys(specificMappings).find(key => lowerName.includes(key));
  
  if (match) {
    return `https://images.unsplash.com/${specificMappings[match]}?auto=format&fit=crop&w=400&q=80`;
  }

  // Fallback cleaning for LoremFlickr
  const keyword = lowerName
    .split(',')[0]
    .split('(')[0]
    .split('/')[0]
    .trim()
    .replace(/\s+/g, ',');
    
  return `https://loremflickr.com/400/400/food,${keyword}?lock=${lowerName.length}`;
};
