export type Exercise = {
  id: string;
  category?: string;
  name: string;
  equipment?: string;
  sets: string | number;
  reps?: string | number;
  distance?: string;
  seconds?: string;
  notes?: string;
  link?: string;
};

export type WorkoutSection = {
  id: string;
  title: string;
  exercises: Exercise[];
};

export type DailyWorkout = {
  day: number;
  title: string;
  sections: WorkoutSection[];
};

export const aerobicCapacityWeek1: DailyWorkout[] = [
  {
    day: 1,
    title: "Day 1: Foundation & Strength",
    sections: [
      {
        id: "d1-mobility",
        title: "Mobility",
        exercises: [
          { id: "d1-m1", name: "Rockers", sets: 1, seconds: "20 - 30" },
          { id: "d1-m2", name: "Cat & Camel", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/Yd0vcoMmb6c?si=lJ3YelRQp5p0uhxC" },
          { id: "d1-m3", name: "Bird Dogs", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/Oioq8Kovhzc?si=Ga_XiuIQ3hUfwGcp" },
          { id: "d1-m4", name: "Fire Hydrants", sets: 1, seconds: "20 - 30" },
          { id: "d1-m5", name: "Worlds Greatest Stretch Sequence", sets: 1, seconds: "20 - 30" },
        ]
      },
      {
        id: "d1-prep",
        title: "Movement Prep",
        exercises: [
          { id: "d1-p1", name: "Knee Pulls", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/urp1wvsAKiM?feature=share" },
          { id: "d1-p2", name: "Quad Pulls", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/cdVRq2ISB9Q?feature=share" },
          { id: "d1-p3", name: "Ankle Tugs", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/Oioq8Kovhzc?si=Ga_XiuIQ3hUfwGcp" },
          { id: "d1-p4", name: "Toe Swoops", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/vza2w1R16II?feature=share" },
          { id: "d1-p5", name: "Lateral Lunges", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/gdUXCRo5CGs?feature=share" },
        ]
      },
      {
        id: "d1-warmup",
        title: "Dynamic Warm-Up",
        exercises: [
          { id: "d1-w1", name: "High Knees", sets: 1, distance: "10 Yards" },
          { id: "d1-w2", name: "Butt Kickers", sets: 1, distance: "10 Yards" },
          { id: "d1-w3", name: "Irish Jigs", sets: 1, distance: "10 Yards" },
          { id: "d1-w4", name: "A Runs", sets: 1, distance: "10 Yards" },
          { id: "d1-w5", name: "Cha Cha's", sets: 1, distance: "10 Yards" },
        ]
      },
      {
        id: "d1-block",
        title: "Main Block",
        exercises: [
          { id: "d1-b1", category: "A - Plyometrics", name: "Box Jumps", equipment: "Box", sets: 3, reps: 5 },
          { id: "d1-b2", category: "A - Fast Twitch", name: "Split Squat Switches", equipment: "Bodyweight", sets: 3, reps: 8 },
          { id: "d1-b3", category: "B - Squat", name: "Box Squats", equipment: "Bar or Dumbbells", sets: 3, reps: 12 },
          { id: "d1-b4", category: "B - Back", name: "Bear Rows", equipment: "Dumbbells", sets: 3, reps: 10 },
          { id: "d1-b5", category: "C - Scapula", name: "IYT's", equipment: "Plates", sets: 3, reps: 10 },
          { id: "d1-b6", category: "C - Chest", name: "Explosion Push Ups", equipment: "Bodyweight", sets: 3, reps: 10 },
          { id: "d1-b7", category: "C - Rotational", name: "Lunge Chop & Lifts", equipment: "Plate or Medicine Ball", sets: 3, reps: 10 },
          { id: "d1-b8", category: "D - Core", name: "Farmers Carries", equipment: "Dumbbell", sets: 3, distance: "10 Yards" },
          { id: "d1-b9", category: "D - Core", name: "Side Planks", equipment: "Bodyweight", sets: 3, seconds: "30 - 45" },
        ]
      },
      {
        id: "d1-cooldown",
        title: "Mobility (Cool Down)",
        exercises: [
          { id: "d1-c1", name: "Tripod T-Spine", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/ijxKkufICpU?si=ukJOBQ1WilTMf_Eu" },
          { id: "d1-c2", name: "Sumo Stretch", sets: 1, seconds: "20 - 30" },
          { id: "d1-c3", name: "Figure 4", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/aYH41yEYST0?si=RuvjKtY45Kv1X6WR" },
          { id: "d1-c4", name: "Hamstring Pulls", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/QxbFiKb3OLc?si=gbuXdjDSHM0OFiZJ" },
          { id: "d1-c5", name: "Arm Stretches", sets: 1, seconds: "20 - 30" },
        ]
      }
    ]
  },
  {
    day: 2,
    title: "Day 2: Speed & Agility",
    sections: [
      {
        id: "d2-prep",
        title: "Movement Prep",
        exercises: [
          { id: "d2-p1", name: "Knee Pulls", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/bjDUyF7CW6M?si=Qc848MXQWscFe1ip" },
          { id: "d2-p2", name: "Quad Pulls", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/cdVRq2ISB9Q?feature=share" },
          { id: "d2-p3", name: "Ankle Tugs", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/Oioq8Kovhzc?si=Ga_XiuIQ3hUfwGcp" },
          { id: "d2-p4", name: "Toe Swoops", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/l4pY8TBMTe0?si=WEk58zj9y754wC3x" },
          { id: "d2-p5", name: "Lateral Lunges", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/fwc0nrqAdjk?si=n7QjVvguxYLMQQcz" },
          { id: "d2-p6", name: "Frankenstiens", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/KGe6u04kUVM?feature=share" },
          { id: "d2-p7", name: "Walking Squats", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/1m8OF2BcPkc?feature=share" },
          { id: "d2-p8", name: "Single Leg RDL's", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/hG8wFpPcRdM?feature=share" },
          { id: "d2-p9", name: "Inchworms", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/RNHqs1Qg7F8?feature=share" },
          { id: "d2-p10", name: "Heismans", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/-AelmZqFkpg?feature=share" },
        ]
      },
      {
        id: "d2-warmup",
        title: "Dynamic Warm-Up",
        exercises: [
          { id: "d2-w1", name: "High Knees", sets: 1, distance: "10 Yards" },
          { id: "d2-w2", name: "Butt Kickers", sets: 1, distance: "10 Yards" },
          { id: "d2-w3", name: "Irish Jigs", sets: 1, distance: "10 Yards" },
          { id: "d2-w4", name: "A Runs", sets: 1, distance: "10 Yards" },
          { id: "d2-w5", name: "Cha Cha's", sets: 1, distance: "10 Yards" },
          { id: "d2-w6", name: "Big Crossovers", sets: 1, distance: "10 Yards" },
          { id: "d2-w7", name: "Reverse Hurdles", sets: 1, distance: "10 Yards" },
          { id: "d2-w8", name: "Pogo Sequence", sets: 1, distance: "10 Yards" },
          { id: "d2-w9", name: "Power Skips High", sets: 1, distance: "10 Yards" },
          { id: "d2-w10", name: "Power Skips Distance", sets: 1, distance: "10 Yards" },
        ]
      },
      {
        id: "d2-block",
        title: "Main Block",
        exercises: [
          { id: "d2-b1", category: "A - Plyometrics", name: "UAP Drops", sets: 8, reps: 1 },
          { id: "d2-b2", category: "A - Plyometrics", name: "UAP Drops (Single Leg)", sets: 8, reps: "2 (One Each Leg)" },
          { id: "d2-b3", category: "A - Plyometrics", name: "Linear Bounds", sets: 3, reps: 3 },
          { id: "d2-b4", category: "A - Plyometrics", name: "Lateral Bounds", sets: 3, reps: 3 },
          { id: "d2-b5", category: "B - Agility", name: "Pro Agility (Curve)", sets: 6, reps: 1 },
          { id: "d2-b6", category: "C - Sprints", name: "Take Offs (10 Yards)", sets: 6, reps: 1 },
          { id: "d2-b7", category: "D - Sprints", name: "Half Kneeling Linear (40 Yards)", sets: 2, reps: 2 },
          { id: "d2-b8", category: "E - Sprints", name: "Drop Step Sprint (20 Yards)", sets: 4, reps: 1 },
          { id: "d2-b9", category: "F - Sprints", name: "Build Up (60 Yards)", sets: 2, reps: 1 },
        ]
      },
      {
        id: "d2-cooldown",
        title: "Mobility (Cool Down)",
        exercises: [
          { id: "d2-c1", name: "Rockers", sets: 1, seconds: "20 - 30" },
          { id: "d2-c2", name: "Cat & Camel", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/Yd0vcoMmb6c?si=lJ3YelRQp5p0uhxC" },
          { id: "d2-c3", name: "Bird Dogs", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/Oioq8Kovhzc?si=Ga_XiuIQ3hUfwGcp" },
          { id: "d2-c4", name: "Fire Hydrants", sets: 1, seconds: "20 - 30" },
          { id: "d2-c5", name: "Worlds Greatest Stretch Sequence", sets: 1, seconds: "20 - 30" },
          { id: "d2-c6", name: "Lying Hamstring Stretch", sets: 1, seconds: "20 - 30" },
          { id: "d2-c7", name: "Figure 4 Stretch", sets: 1, seconds: "20 - 30" },
          { id: "d2-c8", name: "Couch Stretch", sets: 1, seconds: "20 - 30" },
        ]
      }
    ]
  },
  {
    day: 3,
    title: "Day 3: Power & Push",
    sections: [
      {
        id: "d3-mobility",
        title: "Mobility",
        exercises: [
          { id: "d3-m1", name: "Tripod T-Spine", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/ijxKkufICpU?si=ukJOBQ1WilTMf_Eu" },
          { id: "d3-m2", name: "Sumo Stretch", sets: 1, seconds: "20 - 30" },
          { id: "d3-m3", name: "Figure 4", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/aYH41yEYST0?si=RuvjKtY45Kv1X6WR" },
          { id: "d3-m4", name: "Hamstring Pulls", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/QxbFiKb3OLc?si=gbuXdjDSHM0OFiZJ" },
          { id: "d3-m5", name: "Arm Stretches", sets: 1, seconds: "20 - 30" },
        ]
      },
      {
        id: "d3-prep",
        title: "Movement Prep",
        exercises: [
          { id: "d3-p1", name: "Frankenstiens", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/KGe6u04kUVM?feature=share" },
          { id: "d3-p2", name: "Walking Squats", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/1m8OF2BcPkc?feature=share" },
          { id: "d3-p3", name: "Single Leg RDL's", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/hG8wFpPcRdM?feature=share" },
          { id: "d3-p4", name: "Inchworms", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/RNHqs1Qg7F8?feature=share" },
          { id: "d3-p5", name: "Heismans", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/-AelmZqFkpg?feature=share" },
        ]
      },
      {
        id: "d3-warmup",
        title: "Dynamic Warm-Up",
        exercises: [
          { id: "d3-w1", name: "Big Crossovers", sets: 1, distance: "10 Yards" },
          { id: "d3-w2", name: "Reverse Hurdles", sets: 1, distance: "10 Yards" },
          { id: "d3-w3", name: "Pogo Sequence", sets: 1, distance: "10 Yards" },
          { id: "d3-w4", name: "Power Skips High", sets: 1, distance: "10 Yards" },
          { id: "d3-w5", name: "Power Skips Distance", sets: 1, distance: "10 Yards" },
        ]
      },
      {
        id: "d3-block",
        title: "Main Block",
        exercises: [
          { id: "d3-b1", category: "A - Olympic", name: "Shrugs (Pin / Power Position)", equipment: "Bar or Dumbell", sets: 3, reps: 5 },
          { id: "d3-b2", category: "B - Power", name: "Clean Step Through", equipment: "Dumbbell", sets: 3, reps: 4 },
          { id: "d3-b3", category: "B - Push", name: "Push Press", equipment: "Dumbbell", sets: 3, reps: 6 },
          { id: "d3-b4", category: "C - Shoulders", name: "Lateral Raises", equipment: "Dumbbell", sets: 3, reps: 8 },
          { id: "d3-b5", category: "C - Back", name: "Incline Rows", equipment: "Dumbbell", sets: 3, reps: 10 },
          { id: "d3-b6", category: "C - Legs", name: "Lateral Step Ups", equipment: "Dumbbell", sets: 3, reps: "5 (Each Leg)" },
          { id: "d3-b7", category: "D - Core", name: "Planks", equipment: "Bodyweight", sets: 3, seconds: "20 - 30" },
          { id: "d3-b8", category: "D - Core", name: "Plank Hip Rotations", equipment: "Bodyweight", sets: 3, seconds: "20 - 30" },
          { id: "d3-b9", category: "D - Back", name: "Pull Ups (Neutral Grip)", equipment: "Bodyweight", sets: 3, reps: 10 },
        ]
      },
      {
        id: "d3-cooldown",
        title: "Mobility (Cool Down)",
        exercises: [
          { id: "d3-c1", name: "Tripod T-Spine", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/ijxKkufICpU?si=ukJOBQ1WilTMf_Eu" },
          { id: "d3-c2", name: "Sumo Stretch", sets: 1, seconds: "20 - 30" },
          { id: "d3-c3", name: "Figure 4", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/aYH41yEYST0?si=RuvjKtY45Kv1X6WR" },
          { id: "d3-c4", name: "Hamstring Pulls", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/QxbFiKb3OLc?si=gbuXdjDSHM0OFiZJ" },
          { id: "d3-c5", name: "Arm Stretches", sets: 1, seconds: "20 - 30" },
        ]
      }
    ]
  },
  {
    day: 4,
    title: "Day 4: Plyometrics & Conditioning",
    sections: [
      {
        id: "d4-prep",
        title: "Movement Prep",
        exercises: [
          { id: "d4-p1", name: "Knee Pulls", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/urp1wvsAKiM?feature=share" },
          { id: "d4-p2", name: "Quad Pulls", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/cdVRq2ISB9Q?feature=share" },
          { id: "d4-p3", name: "Ankle Tugs", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/Oioq8Kovhzc?si=Ga_XiuIQ3hUfwGcp" },
          { id: "d4-p4", name: "Toe Swoops", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/vza2w1R16II?feature=share" },
          { id: "d4-p5", name: "Lateral Lunges", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/gdUXCRo5CGs?feature=share" },
          { id: "d4-p6", name: "Frankenstiens", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/KGe6u04kUVM?feature=share" },
          { id: "d4-p7", name: "Walking Squats", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/1m8OF2BcPkc?feature=share" },
          { id: "d4-p8", name: "Single Leg RDL's", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/hG8wFpPcRdM?feature=share" },
          { id: "d4-p9", name: "Inchworms", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/RNHqs1Qg7F8?feature=share" },
          { id: "d4-p10", name: "Heismans", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/-AelmZqFkpg?feature=share" },
        ]
      },
      {
        id: "d4-warmup",
        title: "Dynamic Warm-Up",
        exercises: [
          { id: "d4-w1", name: "Irish Jigs", sets: 1, distance: "10 Yards" },
          { id: "d4-w2", name: "Big Crossovers", sets: 1, distance: "10 Yards" },
          { id: "d4-w3", name: "Reverse Hurdles", sets: 1, distance: "10 Yards" },
          { id: "d4-w4", name: "Pogo Sequence", sets: 1, distance: "10 Yards" },
          { id: "d4-w5", name: "Power Skips High", sets: 1, distance: "10 Yards" },
          { id: "d4-w6", name: "Power Skips Distance", sets: 1, distance: "10 Yards" },
        ]
      },
      {
        id: "d4-block",
        title: "Main Block",
        exercises: [
          { id: "d4-b1", category: "A - Plyometrics", name: "Jump Tuck / Bound", equipment: "Body Weight", sets: 3, reps: 10 },
          { id: "d4-b2", category: "A - Plyometrics", name: "Bulgarian Jump Tucks", equipment: "Body Weight", sets: 3, reps: 10 },
          { id: "d4-b3", category: "B - Shoulder / Scapula", name: "LU Raises", equipment: "Plate", sets: 3, reps: 10 },
          { id: "d4-b4", category: "B - Chest", name: "Incline Chest Press (Alternating)", equipment: "Dumbbells", sets: 3, reps: 10 },
          { id: "d4-b5", category: "B - Legs", name: "Split Squat (Front Rack Position)", equipment: "Dumbbells", sets: 3, reps: "8 (Each Leg)" },
          { id: "d4-b6", category: "C - Core", name: "Lifts (Kneeling)", equipment: "Plate", sets: 3, reps: 20 },
          { id: "d4-b7", category: "C - Core", name: "Chops (Kneeling)", equipment: "Plate", sets: 3, reps: 20 },
          { id: "d4-b8", category: "C - Core", name: "Dead Bugs", equipment: "Plate", sets: 3, reps: 20 },
          { id: "d4-b9", category: "D - Interval Conditioning", name: "Jog Sprint Jog (75 - 100 Yards)", equipment: "Bodyweight", sets: 1, reps: 2 },
          { id: "d4-b10", category: "D - Low Intensity Conditioning", name: "Jog", equipment: "65-70% MHR", sets: 1, reps: "10 (Minutes)" },
        ]
      },
      {
        id: "d4-cooldown",
        title: "Mobility (Cool Down)",
        exercises: [
          { id: "d4-c1", name: "Tripod T-Spine", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/ijxKkufICpU?si=ukJOBQ1WilTMf_Eu" },
          { id: "d4-c2", name: "Sumo Stretch", sets: 1, seconds: "20 - 30" },
          { id: "d4-c3", name: "Figure 4", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/aYH41yEYST0?si=RuvjKtY45Kv1X6WR" },
          { id: "d4-c4", name: "Hamstring Pulls", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/QxbFiKb3OLc?si=gbuXdjDSHM0OFiZJ" },
          { id: "d4-c5", name: "Couch Stretch", sets: 1, seconds: "20 - 30" },
        ]
      }
    ]
  },
  {
    day: 5,
    title: "Day 5: Active Recovery",
    sections: [
      {
        id: "d5-recovery",
        title: "Active Recovery",
        exercises: [
          { id: "d5-r1", name: "Light Jog or Walk", sets: 1, seconds: "15 - 20 Minutes", notes: "Keep heart rate low (Zone 1-2)" },
          { id: "d5-r2", name: "Full Body Stretching", sets: 1, seconds: "10 - 15 Minutes", notes: "Focus on tight areas from the week" },
          { id: "d5-r3", name: "Foam Rolling", sets: 1, seconds: "10 Minutes", notes: "Quads, Hamstrings, Calves, Back" },
        ]
      }
    ]
  }
];

export const aerobicCapacityWeek2: DailyWorkout[] = [
  {
    day: 1,
    title: "Day 1: Foundation & Strength",
    sections: [
      {
        id: "w2-d1-mobility",
        title: "Mobility",
        exercises: [
          { id: "w2-d1-m1", name: "Rockers", sets: 1, seconds: "20 - 30" },
          { id: "w2-d1-m2", name: "Cat & Camel", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/Yd0vcoMmb6c?si=lJ3YelRQp5p0uhxC" },
          { id: "w2-d1-m3", name: "Bird Dogs", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/Oioq8Kovhzc?si=Ga_XiuIQ3hUfwGcp" },
          { id: "w2-d1-m4", name: "Fire Hydrants", sets: 1, seconds: "20 - 30" },
          { id: "w2-d1-m5", name: "Worlds Greatest Stretch Sequence", sets: 1, seconds: "20 - 30" },
        ]
      },
      {
        id: "w2-d1-prep",
        title: "Movement Prep",
        exercises: [
          { id: "w2-d1-p1", name: "Knee Pulls", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/urp1wvsAKiM?feature=share" },
          { id: "w2-d1-p2", name: "Quad Pulls", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/cdVRq2ISB9Q?feature=share" },
          { id: "w2-d1-p3", name: "Ankle Tugs", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/Oioq8Kovhzc?si=Ga_XiuIQ3hUfwGcp" },
          { id: "w2-d1-p4", name: "Toe Swoops", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/vza2w1R16II?feature=share" },
          { id: "w2-d1-p5", name: "Lateral Lunges", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/gdUXCRo5CGs?feature=share" },
        ]
      },
      {
        id: "w2-d1-warmup",
        title: "Dynamic Warm-Up",
        exercises: [
          { id: "w2-d1-w1", name: "High Knees", sets: 1, distance: "10 Yards" },
          { id: "w2-d1-w2", name: "Butt Kickers", sets: 1, distance: "10 Yards" },
          { id: "w2-d1-w3", name: "Irish Jigs", sets: 1, distance: "10 Yards" },
          { id: "w2-d1-w4", name: "A Runs", sets: 1, distance: "10 Yards" },
          { id: "w2-d1-w5", name: "Cha Cha's", sets: 1, distance: "10 Yards" },
        ]
      },
      {
        id: "w2-d1-block",
        title: "Main Block",
        exercises: [
          { id: "w2-d1-b1", category: "A - Plyometrics", name: "Seated Box Jumps", equipment: "Box", sets: 3, reps: 5 },
          { id: "w2-d1-b2", category: "A - Fast Twitch", name: "Bulgarian Hurdles (Lateral)", equipment: "Bodyweight", sets: 3, reps: 8 },
          { id: "w2-d1-b3", category: "B - Squat", name: "Squats", equipment: "Bar or Dumbbells", sets: 3, reps: 8 },
          { id: "w2-d1-b4", category: "B - Back", name: "Renegade Rows", equipment: "Dumbbells", sets: 3, reps: 10 },
          { id: "w2-d1-b5", category: "C - Scapula", name: "IYT's", equipment: "Plates", sets: 3, reps: 8 },
          { id: "w2-d1-b6", category: "C - Chest", name: "Med Ball Push Ups", equipment: "Bodyweight", sets: 3, reps: 10 },
          { id: "w2-d1-b7", category: "C - Rotational", name: "Drop Lunge Chop & Lifts", equipment: "Plate or Medicine Ball", sets: 3, reps: 10 },
          { id: "w2-d1-b8", category: "D - Core", name: "Offset Farmers Carries", equipment: "Dumbbell", sets: 3, distance: "10 Yards" },
          { id: "w2-d1-b9", category: "D - Core", name: "Side Planks", equipment: "Bodyweight", sets: 3, seconds: "30 - 45" },
        ]
      },
      {
        id: "w2-d1-cooldown",
        title: "Mobility (Cool Down)",
        exercises: [
          { id: "w2-d1-c1", name: "Tripod T-Spine", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/ijxKkufICpU?si=ukJOBQ1WilTMf_Eu" },
          { id: "w2-d1-c2", name: "Sumo Stretch", sets: 1, seconds: "20 - 30" },
          { id: "w2-d1-c3", name: "Figure 4", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/aYH41yEYST0?si=RuvjKtY45Kv1X6WR" },
          { id: "w2-d1-c4", name: "Hamstring Pulls", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/QxbFiKb3OLc?si=gbuXdjDSHM0OFiZJ" },
          { id: "w2-d1-c5", name: "Arm Stretches", sets: 1, seconds: "20 - 30" },
        ]
      }
    ]
  },
  {
    day: 2,
    title: "Day 2: Speed & Agility",
    sections: [
      {
        id: "w2-d2-prep",
        title: "Movement Prep",
        exercises: [
          { id: "w2-d2-p1", name: "Knee Pulls", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/urp1wvsAKiM?feature=share" },
          { id: "w2-d2-p2", name: "Quad Pulls", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/cdVRq2ISB9Q?feature=share" },
          { id: "w2-d2-p3", name: "Ankle Tugs", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/Oioq8Kovhzc?si=Ga_XiuIQ3hUfwGcp" },
          { id: "w2-d2-p4", name: "Toe Swoops", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/l4pY8TBMTe0?si=WEk58zj9y754wC3x" },
          { id: "w2-d2-p5", name: "Lateral Lunges", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/fwc0nrqAdjk?si=n7QjVvguxYLMQQcz" },
          { id: "w2-d2-p6", name: "Frankenstiens", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/KGe6u04kUVM?feature=share" },
          { id: "w2-d2-p7", name: "Walking Squats", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/1m8OF2BcPkc?feature=share" },
          { id: "w2-d2-p8", name: "Single Leg RDL's", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/hG8wFpPcRdM?feature=share" },
          { id: "w2-d2-p9", name: "Inchworms", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/RNHqs1Qg7F8?feature=share" },
          { id: "w2-d2-p10", name: "Heismans", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/-AelmZqFkpg?feature=share" },
        ]
      },
      {
        id: "w2-d2-warmup",
        title: "Dynamic Warm-Up",
        exercises: [
          { id: "w2-d2-w1", name: "High Knees", sets: 1, distance: "10 Yards" },
          { id: "w2-d2-w2", name: "Butt Kickers", sets: 1, distance: "10 Yards" },
          { id: "w2-d2-w3", name: "Irish Jigs", sets: 1, distance: "10 Yards" },
          { id: "w2-d2-w4", name: "A Runs", sets: 1, distance: "10 Yards" },
          { id: "w2-d2-w5", name: "Cha Cha's", sets: 1, distance: "10 Yards" },
          { id: "w2-d2-w6", name: "Big Crossovers", sets: 1, distance: "10 Yards" },
          { id: "w2-d2-w7", name: "Reverse Hurdles", sets: 1, distance: "10 Yards" },
          { id: "w2-d2-w8", name: "Pogo Sequence", sets: 1, distance: "10 Yards" },
          { id: "w2-d2-w9", name: "Power Skips High", sets: 1, distance: "10 Yards" },
          { id: "w2-d2-w10", name: "Power Skips Distance", sets: 1, distance: "10 Yards" },
        ]
      },
      {
        id: "w2-d2-block",
        title: "Main Block",
        exercises: [
          { id: "w2-d2-b1", category: "A - Plyometrics", name: "UAP Drops / Squat Jump", sets: 8, reps: 1 },
          { id: "w2-d2-b2", category: "A - Plyometrics", name: "UAP Drops / Squat Jump (Single Leg)", sets: 8, reps: "2 (One Each Leg)", notes: "Land on both feet" },
          { id: "w2-d2-b3", category: "A - Plyometrics", name: "Linear Bounds (Single Leg)", sets: 3, reps: 3, notes: "Land on both feet" },
          { id: "w2-d2-b4", category: "A - Plyometrics", name: "Lateral Bounds (Single Leg)", sets: 3, reps: 3, notes: "Land on both feet" },
          { id: "w2-d2-b5", category: "B - Agility", name: "Pro Agility", sets: 6, reps: 1 },
          { id: "w2-d2-b6", category: "C - Sprints", name: "Take Offs (10 Yards)", sets: 8, reps: 1 },
          { id: "w2-d2-b7", category: "D - Sprints", name: "Half Kneeling Lateral (40 Yards)", sets: 2, reps: 2 },
          { id: "w2-d2-b8", category: "E - Sprints", name: "3 Shuffle to Sprint (20 Yards)", sets: 4, reps: 1 },
          { id: "w2-d2-b9", category: "F - Sprints", name: "Build Up (60 Yards)", sets: 3, reps: 1 },
        ]
      },
      {
        id: "w2-d2-cooldown",
        title: "Mobility (Cool Down)",
        exercises: [
          { id: "w2-d2-c1", name: "Rockers", sets: 1, seconds: "20 - 30" },
          { id: "w2-d2-c2", name: "Cat & Camel", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/Yd0vcoMmb6c?si=lJ3YelRQp5p0uhxC" },
          { id: "w2-d2-c3", name: "Bird Dogs", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/Oioq8Kovhzc?si=Ga_XiuIQ3hUfwGcp" },
          { id: "w2-d2-c4", name: "Fire Hydrants", sets: 1, seconds: "20 - 30" },
          { id: "w2-d2-c5", name: "Worlds Greatest Stretch Sequence", sets: 1, seconds: "20 - 30" },
          { id: "w2-d2-c6", name: "Lying Hamstring Stretch", sets: 1, seconds: "20 - 30" },
          { id: "w2-d2-c7", name: "Figure 4 Stretch", sets: 1, seconds: "20 - 30" },
          { id: "w2-d2-c8", name: "Couch Stretch", sets: 1, seconds: "20 - 30" },
        ]
      }
    ]
  },
  {
    day: 3,
    title: "Day 3: Power & Push",
    sections: [
      {
        id: "w2-d3-mobility",
        title: "Mobility",
        exercises: [
          { id: "w2-d3-m1", name: "Tripod T-Spine", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/ijxKkufICpU?si=ukJOBQ1WilTMf_Eu" },
          { id: "w2-d3-m2", name: "Sumo Stretch", sets: 1, seconds: "20 - 30" },
          { id: "w2-d3-m3", name: "Figure 4", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/aYH41yEYST0?si=RuvjKtY45Kv1X6WR" },
          { id: "w2-d3-m4", name: "Hamstring Pulls", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/QxbFiKb3OLc?si=gbuXdjDSHM0OFiZJ" },
          { id: "w2-d3-m5", name: "Arm Stretches", sets: 1, seconds: "20 - 30" },
        ]
      },
      {
        id: "w2-d3-prep",
        title: "Movement Prep",
        exercises: [
          { id: "w2-d3-p1", name: "Frankenstiens", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/KGe6u04kUVM?feature=share" },
          { id: "w2-d3-p2", name: "Walking Squats", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/1m8OF2BcPkc?feature=share" },
          { id: "w2-d3-p3", name: "Single Leg RDL's", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/hG8wFpPcRdM?feature=share" },
          { id: "w2-d3-p4", name: "Inchworms", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/RNHqs1Qg7F8?feature=share" },
          { id: "w2-d3-p5", name: "Heismans", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/-AelmZqFkpg?feature=share" },
        ]
      },
      {
        id: "w2-d3-warmup",
        title: "Dynamic Warm-Up",
        exercises: [
          { id: "w2-d3-w1", name: "Big Crossovers", sets: 1, distance: "10 Yards" },
          { id: "w2-d3-w2", name: "Reverse Hurdles", sets: 1, distance: "10 Yards" },
          { id: "w2-d3-w3", name: "Pogo Sequence", sets: 1, distance: "10 Yards" },
          { id: "w2-d3-w4", name: "Power Skips High", sets: 1, distance: "10 Yards" },
          { id: "w2-d3-w5", name: "Power Skips Distance", sets: 1, distance: "10 Yards" },
        ]
      },
      {
        id: "w2-d3-block",
        title: "Main Block",
        exercises: [
          { id: "w2-d3-b1", category: "A - Olympic", name: "Shrugs / High Pull (Pin / Power Position)", equipment: "Bar or Dumbell", sets: 3, reps: 5 },
          { id: "w2-d3-b2", category: "B - Power", name: "Clean Step Through", equipment: "Dumbbell", sets: 3, reps: 4 },
          { id: "w2-d3-b3", category: "B - Push", name: "Jerk Press", equipment: "Dumbbell", sets: 3, reps: 6 },
          { id: "w2-d3-b4", category: "C - Shoulders", name: "Rear Delt Fly's", equipment: "Dumbbell", sets: 3, reps: 8 },
          { id: "w2-d3-b5", category: "C - Back", name: "Single Arm Rows", equipment: "Dumbbell", sets: 3, reps: 10 },
          { id: "w2-d3-b6", category: "C - Legs", name: "Linear Step Ups", equipment: "Dumbbell", sets: 3, reps: "5 (Each Leg)" },
          { id: "w2-d3-b7", category: "D - Core", name: "Plank Ups", equipment: "Bodyweight", sets: 3, seconds: "30" },
          { id: "w2-d3-b8", category: "D - Core", name: "Alternating V-Ups", equipment: "Bodyweight", sets: 3, seconds: "30" },
          { id: "w2-d3-b9", category: "D - Back", name: "Pull Ups (Neutral Grip)", equipment: "Bodyweight", sets: 3, reps: "AMRAP" },
        ]
      },
      {
        id: "w2-d3-cooldown",
        title: "Mobility (Cool Down)",
        exercises: [
          { id: "w2-d3-c1", name: "Tripod T-Spine", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/ijxKkufICpU?si=ukJOBQ1WilTMf_Eu" },
          { id: "w2-d3-c2", name: "Sumo Stretch", sets: 1, seconds: "20 - 30" },
          { id: "w2-d3-c3", name: "Figure 4", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/aYH41yEYST0?si=RuvjKtY45Kv1X6WR" },
          { id: "w2-d3-c4", name: "Hamstring Pulls", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/QxbFiKb3OLc?si=gbuXdjDSHM0OFiZJ" },
          { id: "w2-d3-c5", name: "Arm Stretches", sets: 1, seconds: "20 - 30" },
        ]
      }
    ]
  },
  {
    day: 4,
    title: "Day 4: Plyometrics & Conditioning",
    sections: [
      {
        id: "w2-d4-prep",
        title: "Movement Prep",
        exercises: [
          { id: "w2-d4-p1", name: "Knee Pulls", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/urp1wvsAKiM?feature=share" },
          { id: "w2-d4-p2", name: "Quad Pulls", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/cdVRq2ISB9Q?feature=share" },
          { id: "w2-d4-p3", name: "Ankle Tugs", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/Oioq8Kovhzc?si=Ga_XiuIQ3hUfwGcp" },
          { id: "w2-d4-p4", name: "Toe Swoops", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/vza2w1R16II?feature=share" },
          { id: "w2-d4-p5", name: "Lateral Lunges", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/gdUXCRo5CGs?feature=share" },
          { id: "w2-d4-p6", name: "Frankenstiens", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/KGe6u04kUVM?feature=share" },
          { id: "w2-d4-p7", name: "Walking Squats", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/1m8OF2BcPkc?feature=share" },
          { id: "w2-d4-p8", name: "Single Leg RDL's", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/hG8wFpPcRdM?feature=share" },
          { id: "w2-d4-p9", name: "Inchworms", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/RNHqs1Qg7F8?feature=share" },
          { id: "w2-d4-p10", name: "Heismans", sets: 1, distance: "10 Yards", link: "https://youtube.com/shorts/-AelmZqFkpg?feature=share" },
        ]
      },
      {
        id: "w2-d4-warmup",
        title: "Dynamic Warm-Up",
        exercises: [
          { id: "w2-d4-w1", name: "Irish Jigs", sets: 1, distance: "10 Yards" },
          { id: "w2-d4-w2", name: "Big Crossovers", sets: 1, distance: "10 Yards" },
          { id: "w2-d4-w3", name: "Reverse Hurdles", sets: 1, distance: "10 Yards" },
          { id: "w2-d4-w4", name: "Pogo Sequence", sets: 1, distance: "10 Yards" },
          { id: "w2-d4-w5", name: "Power Skips High", sets: 1, distance: "10 Yards" },
          { id: "w2-d4-w6", name: "Power Skips Distance", sets: 1, distance: "10 Yards" },
        ]
      },
      {
        id: "w2-d4-block",
        title: "Main Block",
        exercises: [
          { id: "w2-d4-b1", category: "A - Plyometrics", name: "Skater / Bound", equipment: "Body Weight", sets: 3, reps: 10, notes: "5 each side" },
          { id: "w2-d4-b2", category: "A - Plyometrics", name: "Triple Jump Single Leg Bounds", equipment: "Body Weight", sets: 5, reps: 1, notes: "3 Bound jumps on single leg, landing on both feet (UAP) on the last landing" },
          { id: "w2-d4-b3", category: "B - Shoulder / Scapula", name: "Band Pulls", equipment: "Band", sets: 3, reps: 10 },
          { id: "w2-d4-b4", category: "B - Chest", name: "Incline Chest Press", equipment: "Dumbbells", sets: 3, reps: 10, notes: "Neutral Grip" },
          { id: "w2-d4-b5", category: "B - Legs", name: "Split Squat", equipment: "Dumbbells or Bar", sets: 3, reps: "8 (Each Leg)" },
          { id: "w2-d4-b6", category: "C - Core", name: "Rotations (Kneeling)", equipment: "Plate", sets: 3, reps: 20 },
          { id: "w2-d4-b7", category: "C - Core", name: "Digs (Kneeling)", equipment: "Plate", sets: 3, reps: 20 },
          { id: "w2-d4-b8", category: "C - Core", name: "Russian Twist", equipment: "Plate", sets: 3, reps: 20, notes: "Each side" },
          { id: "w2-d4-b9", category: "D - Interval Conditioning", name: "Jog Sprint Jog (75 - 100 Yards)", equipment: "Bodyweight", sets: 3, reps: 1 },
          { id: "w2-d4-b10", category: "D - Low Intensity Conditioning", name: "Jog", equipment: "65-70% MHR", sets: 1, reps: "10 (Minutes)" },
        ]
      },
      {
        id: "w2-d4-cooldown",
        title: "Mobility (Cool Down)",
        exercises: [
          { id: "w2-d4-c1", name: "Tripod T-Spine", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/ijxKkufICpU?si=ukJOBQ1WilTMf_Eu" },
          { id: "w2-d4-c2", name: "Sumo Stretch", sets: 1, seconds: "20 - 30" },
          { id: "w2-d4-c3", name: "Figure 4", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/aYH41yEYST0?si=RuvjKtY45Kv1X6WR" },
          { id: "w2-d4-c4", name: "Hamstring Pulls", sets: 1, seconds: "20 - 30", link: "https://youtube.com/shorts/QxbFiKb3OLc?si=gbuXdjDSHM0OFiZJ" },
          { id: "w2-d4-c5", name: "Couch Stretch", sets: 1, seconds: "20 - 30" },
        ]
      }
    ]
  },
  {
    day: 5,
    title: "Day 5: Active Recovery",
    sections: [
      {
        id: "w2-d5-recovery",
        title: "Active Recovery",
        exercises: [
          { id: "w2-d5-r1", name: "Light Jog or Walk", sets: 1, seconds: "15 - 20 Minutes", notes: "Keep heart rate low (Zone 1-2)" },
          { id: "w2-d5-r2", name: "Full Body Stretching", sets: 1, seconds: "10 - 15 Minutes", notes: "Focus on tight areas from the week" },
          { id: "w2-d5-r3", name: "Foam Rolling", sets: 1, seconds: "10 Minutes", notes: "Quads, Hamstrings, Calves, Back" },
        ]
      }
    ]
  }
];
