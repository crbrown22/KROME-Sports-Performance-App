
export const getProgramImage = (programName: string, sport?: string) => {
  const seed = programName.toLowerCase();
  const sportLower = sport?.toLowerCase() || '';
  
  // Use a simple hash of the name to pick a stable image from a list
  const getStableImage = (imageList: string[]) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return imageList[Math.abs(hash) % imageList.length];
  };

  // Map sports/keywords to Unsplash categories
  // Prioritize specific program overrides
  const isBaseball = sportLower.includes('baseball') || seed.includes('baseball') || seed.includes('basbell');
  const isSoftball = sportLower.includes('softball') || seed.includes('softball') || seed.includes('softaball');

  if (isBaseball) {
    if (seed.includes('52-week') || seed.includes('52 week')) {
      return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop'; // Elite training
    }
    if (seed.includes('summer')) {
      return 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=800&auto=format&fit=crop'; // Elite training
    }
    if (seed.includes('winter')) {
      return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop'; // Elite training
    }
  }

  if (isSoftball) {
    if (seed.includes('52-week') || seed.includes('52 week')) {
      return 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=800&auto=format&fit=crop'; // Female athlete
    }
    if (seed.includes('summer')) {
      return 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=800&auto=format&fit=crop'; // Female athlete
    }
    if (seed.includes('winter')) {
      return 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=800&auto=format&fit=crop'; // Female athlete
    }
  }
  
  if (seed.includes('strength') && seed.includes('power')) {
    return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop'; // Elite training
  }

  if (seed.includes('speed') || seed.includes('agility')) {
    return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop'; // Elite training
  }

  if (seed.includes('aerobic') && seed.includes('capacity')) {
    return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop'; // Running
  }

  // Prioritize sport parameter, then check name
  if (sportLower.includes('softball') || seed.includes('softball') || seed.includes('softaball')) {
    const softballImages = [
      'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515516089376-88db1e26e9c0?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1562077772-3bd90403f7f0?q=80&w=800&auto=format&fit=crop'
    ];
    return getStableImage(softballImages);
  }

  if (sportLower.includes('baseball') || seed.includes('baseball')) {
    const baseballImages = [
      'https://images.unsplash.com/photo-1574673139737-3a4ef97299ae?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1591117207239-7ad59a057fd6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507398941214-57f5162123bf?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80'
    ];
    return getStableImage(baseballImages);
  }

  if (sportLower.includes('soccer') || seed.includes('soccer')) {
    return `https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop`;
  }
  if (sportLower.includes('basketball') || seed.includes('basketball')) {
    return `https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop`;
  }
  if (sportLower.includes('football') || seed.includes('football')) {
    return `https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800&auto=format&fit=crop`;
  }
  if (seed.includes('rehab') || seed.includes('recovery')) {
    return `https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop`;
  }
  if (seed.includes('strength') || seed.includes('lift') || seed.includes('power')) {
    return `https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop`;
  }
  if (seed.includes('speed') || seed.includes('agility') || seed.includes('track')) {
    return `https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=800&auto=format&fit=crop`;
  }
  
  // Default athlete/workout images
  const defaults = [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80'
  ];
  
  return getStableImage(defaults);
};

export const getAthleteImage = (username: string = 'U') => {
  const safeUsername = username || 'U';
  const defaults = [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=800&q=80'
  ];
  
  let hash = 0;
  for (let i = 0; i < safeUsername.length; i++) {
    hash = safeUsername.charCodeAt(i) + ((hash << 5) - hash);
  }
  return defaults[Math.abs(hash) % defaults.length];
};
