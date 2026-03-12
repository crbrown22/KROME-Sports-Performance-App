
export interface ExerciseTemplate {
  id: string;
  exerciseId: string;
  sets: string;
  reps: string;
  tempo?: string;
  rest?: string;
  notes?: string;
  nameOverride?: string;
  videoLinkOverride?: string;
  canGenerateVideo?: boolean;
}

export interface WorkoutTemplate {
  id: string;
  title: string;
  day: number;
  exercises: ExerciseTemplate[];
}

export interface WeekTemplate {
  week: number;
  workouts: WorkoutTemplate[];
}

export interface PhaseTemplate {
  name: string;
  weeks: WeekTemplate[];
}

export interface FullProgramTemplate {
  id: string;
  name: string;
  description: string;
  phases: PhaseTemplate[];
}

export const SOCCER_52_WEEK: FullProgramTemplate = {
  id: 'soccer-52-week',
  name: 'KSP Soccer 52-Week Elite Performance',
  description: 'A comprehensive 52-week program for soccer athletes, focusing on strength, power, speed, and conditioning.',
  phases: [
    {
      name: 'MEE (Metabolic Efficiency & Endurance)',
      weeks: Array.from({ length: 12 }, (_, i) => ({
        week: i + 1,
        workouts: [
          {
            id: `soccer-w${i+1}-d1`,
            title: 'Strength + Power (Lower)',
            day: 1,
            exercises: [
              { id: '1', exerciseId: 'trap-bar-deadlift', sets: '3', reps: '6-8', rest: '90-120s', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '2', exerciseId: 'bulgarian-split-squat', sets: '3', reps: '8 ea', rest: '60-90s', videoLinkOverride: 'https://www.youtube.com/watch?v=2C-uEi5t0gI', canGenerateVideo: true },
              { id: '3', exerciseId: 'box-jumps', sets: '4', reps: '4', rest: '2-3 min', videoLinkOverride: 'https://www.youtube.com/watch?v=5k9e6y2-F-Q', canGenerateVideo: true },
              { id: '4', exerciseId: 'mb-rotational-throw', sets: '3', reps: '6 ea', rest: '90s', videoLinkOverride: 'https://www.youtube.com/watch?v=R9K4tO8_6-w', canGenerateVideo: true },
              { id: '5', exerciseId: 'nordic-curl', sets: '3', reps: '6', videoLinkOverride: 'https://www.youtube.com/watch?v=d_Z991-Ww-o', canGenerateVideo: true }
            ]
          },
          {
            id: `soccer-w${i+1}-d2`,
            title: 'Speed / COD + Repeated Sprint',
            day: 2,
            exercises: [
              { id: '6', exerciseId: '30yd-sprints', sets: '6', reps: '30 yd', rest: '2.5-3.5 min' },
              { id: '7', exerciseId: 'pro-agility', sets: '4', reps: 'trials', rest: '2-3 min' },
              { id: '8', exerciseId: 'lateral-bound', sets: '3', reps: '5 ea', rest: '90s' },
              { id: '9', exerciseId: 'rsa', sets: '6', reps: '20m', rest: '20-30s' }
            ]
          },
          {
            id: `soccer-w${i+1}-d4`,
            title: 'Strength + Power (Upper + Unilateral)',
            day: 4,
            exercises: [
              { id: '100', exerciseId: 'push-press', sets: '4', reps: '6-8 ea', rest: '90s' },
              { id: '101', exerciseId: 'row', sets: '4', reps: '8 ea' },
              { id: '102', exerciseId: 'step-up', sets: '3', reps: '6-8 ea' },
              { id: '103', exerciseId: 'mb-chest-pass', sets: '4', reps: '6' }
            ]
          },
          {
            id: `soccer-w${i+1}-d6`,
            title: 'Agility + Conditioning',
            day: 6,
            exercises: [
              { id: '104', exerciseId: 'cod-ladder', sets: '1', reps: '6 min' },
              { id: '105', exerciseId: 'progressive-sprints', sets: '3', reps: 'rounds', rest: '2-3 min' },
              { id: '106', exerciseId: 'shuttle-set', sets: '6', reps: '25m' },
              { id: '107', exerciseId: 'reactive-drill', sets: '1', reps: '6-8 reps' }
            ]
          }
        ]
      }))
    },
    {
      name: 'S&P (Strength & Power)',
      weeks: Array.from({ length: 12 }, (_, i) => ({
        week: i + 13,
        workouts: [
          {
            id: `soccer-w${i+13}-d1`,
            title: 'Strength + Power (Lower)',
            day: 1,
            exercises: [
              { id: '108', exerciseId: 'back-squat', sets: '4', reps: '5', rest: '2-3 min', videoLinkOverride: 'https://www.youtube.com/watch?v=ultWZbUMPL8', canGenerateVideo: true },
              { id: '109', exerciseId: 'walking-lunges', sets: '3', reps: '8-10 ea', videoLinkOverride: 'https://www.youtube.com/watch?v=D7KaRcUTQeE', canGenerateVideo: true },
              { id: '110', exerciseId: 'depth-jumps', sets: '4', reps: '4', rest: 'Full', videoLinkOverride: 'https://www.youtube.com/watch?v=5k9e6y2-F-Q', canGenerateVideo: true },
              { id: '111', exerciseId: 'single-leg-rdl', sets: '3', reps: '8 ea', videoLinkOverride: 'https://www.youtube.com/watch?v=jW24H4p2-5Q', canGenerateVideo: true },
              { id: '112', exerciseId: 'mb-overhead-toss', sets: '3', reps: '6', videoLinkOverride: 'https://www.youtube.com/watch?v=R9K4tO8_6-w', canGenerateVideo: true }
            ]
          },
          {
            id: `soccer-w${i+13}-d2`,
            title: 'Speed / COD (Quality)',
            day: 2,
            exercises: [
              { id: '113', exerciseId: 'flying-20s', sets: '4', reps: '20m', rest: '3-4 min', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '114', exerciseId: 'pro-agility', sets: '4', reps: 'trials', videoLinkOverride: 'https://www.youtube.com/watch?v=5k9e6y2-F-Q', canGenerateVideo: true },
              { id: '115', exerciseId: 'crossover-bounds', sets: '3', reps: '6 ea', videoLinkOverride: 'https://www.youtube.com/watch?v=R9K4tO8_6-w', canGenerateVideo: true },
              { id: '116', exerciseId: 'rsa', sets: '8', reps: '20m', rest: '30s', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          },
          {
            id: `soccer-w${i+13}-d4`,
            title: 'Upper/Full (Power + Unilateral)',
            day: 4,
            exercises: [
              { id: '117', exerciseId: 'push-jerk', sets: '4', reps: '5-6 ea', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '118', exerciseId: 'pull-up', sets: '3', reps: 'Max', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '119', exerciseId: 'goblet-squat', sets: '3', reps: '10', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '120', exerciseId: 'mb-rotational-slam', sets: '4', reps: '6 ea', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          },
          {
            id: `soccer-w${i+13}-d6`,
            title: 'Agility + Game-specific Conditioning',
            day: 6,
            exercises: [
              { id: '121', exerciseId: 'cod-shuttle', sets: '3', reps: 'rounds', rest: 'Full', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '122', exerciseId: 'small-sided-cond', sets: '8', reps: '50m', rest: 'Short', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '123', exerciseId: 'acceleration-20', sets: '5', reps: '20 yds', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '124', exerciseId: 'max-velocity-40', sets: '3', reps: '40 yds', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          }
        ]
      }))
    },
    {
      name: 'SHP (Speed, Hypertrophy, Power)',
      weeks: Array.from({ length: 12 }, (_, i) => ({
        week: i + 25,
        workouts: [
          {
            id: `soccer-w${i+25}-d1`,
            title: 'Power & Hypertrophy (Lower)',
            day: 1,
            exercises: [
              { id: '125', exerciseId: 'trap-bar-deadlift', sets: '5', reps: '3-5', rest: '3 min', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '126', exerciseId: 'bulgarian-split-squat', sets: '4', reps: '6 ea', rest: '2 min', videoLinkOverride: 'https://www.youtube.com/watch?v=2C-uEi5t0gI', canGenerateVideo: true },
              { id: '127', exerciseId: 'box-jumps', sets: '5', reps: '3', rest: '3 min', videoLinkOverride: 'https://www.youtube.com/watch?v=5k9e6y2-F-Q', canGenerateVideo: true },
              { id: '128', exerciseId: 'mb-rotational-throw', sets: '4', reps: '5 ea', rest: '2 min', videoLinkOverride: 'https://www.youtube.com/watch?v=R9K4tO8_6-w', canGenerateVideo: true }
            ]
          },
          {
            id: `soccer-w${i+25}-d2`,
            title: 'Max Speed & Agility',
            day: 2,
            exercises: [
              { id: '129', exerciseId: 'sprint-40', sets: '5', reps: '40 yd', rest: '4-5 min', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '130', exerciseId: 'pro-agility', sets: '5', reps: 'trials', rest: '3 min', videoLinkOverride: 'https://www.youtube.com/watch?v=5k9e6y2-F-Q', canGenerateVideo: true },
              { id: '131', exerciseId: 'lateral-bound', sets: '4', reps: '4 ea', rest: '2 min', videoLinkOverride: 'https://www.youtube.com/watch?v=R9K4tO8_6-w', canGenerateVideo: true }
            ]
          },
          {
            id: `soccer-w${i+25}-d4`,
            title: 'Power & Hypertrophy (Upper)',
            day: 4,
            exercises: [
              { id: '132', exerciseId: 'bench-press', sets: '4', reps: '6-8', rest: '2 min', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '133', exerciseId: 'pull-up', sets: '4', reps: '6-8', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '134', exerciseId: 'db-shoulder-press', sets: '3', reps: '10', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '135', exerciseId: 'mb-chest-pass', sets: '4', reps: '8', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          },
          {
            id: `soccer-w${i+25}-d6`,
            title: 'High Intensity Conditioning',
            day: 6,
            exercises: [
              { id: '136', exerciseId: 'shuttle-300', sets: '3', reps: '300 yd', rest: '3 min', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '137', exerciseId: 'rsa', sets: '10', reps: '30m', rest: '45s', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          }
        ]
      }))
    },
    {
      name: 'FTTX (Functional Tactical Training)',
      weeks: Array.from({ length: 12 }, (_, i) => ({
        week: i + 37,
        workouts: [
          {
            id: `soccer-w${i+37}-d1`,
            title: 'Tactical Strength (Lower)',
            day: 1,
            exercises: [
              { id: '138', exerciseId: 'front-squat', sets: '4', reps: '6', rest: '2 min', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '139', exerciseId: 'walking-lunges', sets: '3', reps: '12 ea', videoLinkOverride: 'https://www.youtube.com/watch?v=2C-uEi5t0gI', canGenerateVideo: true },
              { id: '140', exerciseId: 'box-jumps', sets: '4', reps: '5 ea', videoLinkOverride: 'https://www.youtube.com/watch?v=5k9e6y2-F-Q', canGenerateVideo: true }
            ]
          },
          {
            id: `soccer-w${i+37}-d2`,
            title: 'Game Speed & Agility',
            day: 2,
            exercises: [
              { id: '141', exerciseId: 'sprint-40', sets: '8', reps: '20-40m', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '142', exerciseId: 'pro-agility', sets: '6', reps: '30s', videoLinkOverride: 'https://www.youtube.com/watch?v=5k9e6y2-F-Q', canGenerateVideo: true }
            ]
          },
          {
            id: `soccer-w${i+37}-d4`,
            title: 'Tactical Strength (Upper)',
            day: 4,
            exercises: [
              { id: '143', exerciseId: 'push-press', sets: '5', reps: '5', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '144', exerciseId: 'row', sets: '4', reps: '10', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          },
          {
            id: `soccer-w${i+37}-d6`,
            title: 'Tactical Conditioning',
            day: 6,
            exercises: [
              { id: '145', exerciseId: 'small-sided-cond', sets: '4', reps: '4 min', rest: '2 min', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '146', exerciseId: 'shuttle-set', sets: '5', reps: '100m', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          }
        ]
      }))
    },
    {
      name: 'OP (Off-season / Peak)',
      weeks: Array.from({ length: 4 }, (_, i) => ({
        week: i + 49,
        workouts: [
          {
            id: `soccer-w${i+49}-d1`,
            title: 'Peak Power (Lower)',
            day: 1,
            exercises: [
              { id: '147', exerciseId: 'back-squat', sets: '3', reps: '3', rest: '4 min', videoLinkOverride: 'https://www.youtube.com/watch?v=ultWZbUMPL8', canGenerateVideo: true },
              { id: '148', exerciseId: 'broad-jump', sets: '3', reps: '3', rest: 'Full', videoLinkOverride: 'https://www.youtube.com/watch?v=5k9e6y2-F-Q', canGenerateVideo: true }
            ]
          },
          {
            id: `soccer-w${i+49}-d2`,
            title: 'Peak Speed',
            day: 2,
            exercises: [
              { id: '149', exerciseId: 'sprint-10', sets: '4', reps: '10 yd', rest: '3 min', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '150', exerciseId: 'sprint-40', sets: '4', reps: '20 yd', rest: '3 min', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          },
          {
            id: `soccer-w${i+49}-d4`,
            title: 'Peak Power (Upper)',
            day: 4,
            exercises: [
              { id: '151', exerciseId: 'bench-press', sets: '3', reps: '3', rest: '4 min', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '152', exerciseId: 'pull-up', sets: '3', reps: '5', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          }
        ]
      }))
    }
  ]
};

export const SOFTBALL_WINTER: FullProgramTemplate = {
  id: 'softball-winter',
  name: 'KSP Softball Winter Break',
  description: 'Winter-specific program for softball athletes focusing on speed, conditioning, and strength.',
  phases: [
    {
      name: 'Winter Phase (Weeks 1-8)',
      weeks: Array.from({ length: 8 }, (_, i) => ({
        week: i + 1,
        workouts: [
          {
            id: `softball-w${i+1}-d1`,
            title: 'Acceleration & Rhythm',
            day: 1,
            exercises: [
              { id: '153', exerciseId: '60yd-buildups', sets: '2', reps: '60 yd', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '154', exerciseId: '10yd-accel', sets: '3', reps: '3x10 yd', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '155', exerciseId: '30yd-sprints', sets: '1', reps: '3x20 yd', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '156', exerciseId: 'lateral-shuffle-sprint', sets: '4', reps: '10 yd ea', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          },
          {
            id: `softball-w${i+1}-d2`,
            title: 'Lower Body Power + Core',
            day: 2,
            exercises: [
              { id: '157', exerciseId: 'box-jumps', sets: '4', reps: '4', videoLinkOverride: 'https://www.youtube.com/watch?v=5k9e6y2-F-Q', canGenerateVideo: true },
              { id: '158', exerciseId: 'hang-cleans', sets: '4', reps: '5/5/4/4', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '159', exerciseId: 'goblet-squats', sets: '3', reps: '10', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '160', exerciseId: 'rdls', sets: '3', reps: '10', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '161', exerciseId: 'walking-lunges', sets: '3', reps: '10 ea', videoLinkOverride: 'https://www.youtube.com/watch?v=D7KaRcUTQeE', canGenerateVideo: true }
            ]
          },
          {
            id: `softball-w${i+1}-d4`,
            title: 'Change of Direction',
            day: 4,
            exercises: [
              { id: '162', exerciseId: '60yd-buildups', sets: '2', reps: '60 yd', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '163', exerciseId: 'pro-shuttle', sets: '5', reps: 'reps', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '164', exerciseId: 'lateral-linear-sprints', sets: '3', reps: '20 yd', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '165', exerciseId: '20yd-flyins', sets: '2', reps: '2x20 yd', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          },
          {
            id: `softball-w${i+1}-d5`,
            title: 'Upper Body + Core',
            day: 5,
            exercises: [
              { id: '166', exerciseId: 'mb-chest-pass', sets: '4', reps: '6', videoLinkOverride: 'https://www.youtube.com/watch?v=R9K4tO8_6-w', canGenerateVideo: true },
              { id: '167', exerciseId: 'push-press', sets: '3', reps: '8', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '168', exerciseId: 'db-rows', sets: '3', reps: '10', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '169', exerciseId: 'pull-ups-lat', sets: '3', reps: '10', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          }
        ]
      }))
    }
  ]
};

export const BASEBALL_WINTER: FullProgramTemplate = {
  id: 'baseball-winter',
  name: 'KSP Baseball Winter Break',
  description: 'Winter-specific program for baseball athletes focusing on strength and conditioning.',
  phases: [
    {
      name: 'Winter Phase (Weeks 1-8)',
      weeks: Array.from({ length: 8 }, (_, i) => ({
        week: i + 1,
        workouts: [
          {
            id: `baseball-w${i+1}-d1`,
            title: 'Conditioning & Speed',
            day: 1,
            exercises: [
              { id: '170', exerciseId: '60yd-buildups', sets: '2', reps: '60 yd', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '171', exerciseId: '10yd-accel', sets: '3', reps: '3x10 yd', notes: 'Lead off position', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '172', exerciseId: '30yd-sprints', sets: '1', reps: '3x30 yd', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          },
          {
            id: `baseball-w${i+1}-d2`,
            title: 'Strength Training',
            day: 2,
            exercises: [
              { id: '173', exerciseId: 'hang-cleans', sets: '4', reps: '5/5/4/4', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '174', exerciseId: 'back-squat', sets: '4', reps: '8', notes: '75%', videoLinkOverride: 'https://www.youtube.com/watch?v=ultWZbUMPL8', canGenerateVideo: true },
              { id: '175', exerciseId: 'incline-chest-press', sets: '3', reps: '8', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '176', exerciseId: 'rdls', sets: '3', reps: '10/10/8', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '177', exerciseId: 'pull-up', sets: '3', reps: 'Burnout', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          },
          {
            id: `baseball-w${i+1}-d4`,
            title: 'Conditioning & Agility',
            day: 4,
            exercises: [
              { id: '178', exerciseId: '60yd-buildups', sets: '1', reps: '2x60 yd', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '179', exerciseId: '60yd-buildups', sets: '2', reps: '2x60 yd', notes: 'Delay Steal Start', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '180', exerciseId: '20yd-flyins', sets: '1', reps: '2x20 yd', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          },
          {
            id: `baseball-w${i+1}-d5`,
            title: 'Strength Training (Upper)',
            day: 5,
            exercises: [
              { id: '181', exerciseId: 'high-pulls', sets: '4', reps: '5/5/4/4', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '182', exerciseId: 'db-rows', sets: '3', reps: '10', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '183', exerciseId: 'walking-lunges', sets: '3', reps: '10', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '184', exerciseId: 'lat-pulldown', sets: '3', reps: '10', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '185', exerciseId: 'step-up', sets: '3', reps: '5 ea', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          }
        ]
      }))
    }
  ]
};

export const LOWER_BACK_REHAB: FullProgramTemplate = {
  id: 'lower-back-rehab',
  name: '6-Week Lower Back Rehabilitation',
  description: 'Designed for collegiate & professional soccer players to correct lumbar curvature and muscular imbalance.',
  phases: [
    {
      name: 'Mobility & Core Activation (Weeks 1-2)',
      weeks: Array.from({ length: 2 }, (_, i) => ({
        week: i + 1,
        workouts: [
          {
            id: `back-w${i+1}-d1`,
            title: 'Mobility & Alignment',
            day: 1,
            exercises: [
              { id: '186', exerciseId: 'cat-cow', sets: '2', reps: '10', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '187', exerciseId: 'bird-dogs', sets: '2', reps: '10 ea', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '188', exerciseId: 'cobra', sets: '2', reps: '10', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '189', exerciseId: 'mckenzie-press', sets: '2', reps: '10', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '190', exerciseId: 'pigeon-stretch', sets: '2', reps: '30s', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          },
          {
            id: `back-w${i+1}-d2`,
            title: 'Posterior Chain & Stability',
            day: 2,
            exercises: [
              { id: '191', exerciseId: 'staggered-rdl', sets: '3', reps: '8', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '192', exerciseId: 'glute-bridge', sets: '3', reps: '12', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '193', exerciseId: 'hamstring-walkouts', sets: '3', reps: '10', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '194', exerciseId: 'reverse-clamshells', sets: '3', reps: '15', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          }
        ]
      }))
    },
    {
      name: 'Unilateral Stability (Weeks 3-4)',
      weeks: Array.from({ length: 2 }, (_, i) => ({
        week: i + 3,
        workouts: [
          {
            id: `back-w${i+3}-d1`,
            title: 'Unilateral Stability',
            day: 1,
            exercises: [
              { id: '195', exerciseId: 'staggered-rdl', sets: '3', reps: '8', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '196', exerciseId: 'single-leg-rdl', sets: '3', reps: '8', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '197', exerciseId: 'single-leg-glute-bridge', sets: '3', reps: '12', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          }
        ]
      }))
    }
  ]
};

export const SOFTBALL_52_WEEK: FullProgramTemplate = {
  id: 'softball-52-week',
  name: 'KSP Softball 52-Week Elite Performance',
  description: 'A comprehensive 52-week program for softball athletes, focusing on rotational power, speed, and durability.',
  phases: [
    {
      name: 'MEE (Metabolic Efficiency & Endurance)',
      weeks: Array.from({ length: 12 }, (_, i) => ({
        week: i + 1,
        workouts: [
          {
            id: `softball-w${i+1}-d1`,
            title: 'Rotational Power + Lower',
            day: 1,
            exercises: [
              { id: '198', exerciseId: 'mb-rotational-throw', sets: '3', reps: '8 ea', rest: '90s', videoLinkOverride: 'https://www.youtube.com/watch?v=R9K4tO8_6-w', canGenerateVideo: true },
              { id: '199', exerciseId: 'trap-bar-deadlift', sets: '3', reps: '8-10', rest: '90s', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '200', exerciseId: 'lateral-lunges', sets: '3', reps: '10 ea', videoLinkOverride: 'https://www.youtube.com/watch?v=2C-uEi5t0gI', canGenerateVideo: true },
              { id: '201', exerciseId: 'plank-rotations', sets: '3', reps: '12 ea', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          },
          {
            id: `softball-w${i+1}-d2`,
            title: 'Speed & Agility',
            day: 2,
            exercises: [
              { id: '202', exerciseId: '20yd-sprints', sets: '6', reps: '20 yd', rest: '2 min' },
              { id: '203', exerciseId: 'pro-agility', sets: '4', reps: 'trials' },
              { id: '204', exerciseId: 'base-running-drills', sets: '1', reps: '10 min' }
            ]
          }
        ]
      }))
    },
    {
      name: 'S&P (Strength & Power)',
      weeks: Array.from({ length: 12 }, (_, i) => ({
        week: i + 13,
        workouts: [
          {
            id: `softball-w${i+13}-d1`,
            title: 'Strength & Power (Lower)',
            day: 1,
            exercises: [
              { id: '205', exerciseId: 'back-squat', sets: '4', reps: '5', rest: '2-3 min' },
              { id: '206', exerciseId: 'hang-clean', sets: '4', reps: '4', rest: '2-3 min' },
              { id: '207', exerciseId: 'med-ball-overhead-throw', sets: '4', reps: '6' }
            ]
          }
        ]
      }))
    },
    {
      name: 'SHP (Speed, Hypertrophy, Power)',
      weeks: Array.from({ length: 12 }, (_, i) => ({
        week: i + 25,
        workouts: [
          {
            id: `softball-w${i+25}-d1`,
            title: 'Hypertrophy & Power',
            day: 1,
            exercises: [
              { id: '208', exerciseId: 'incline-chest-press', sets: '4', reps: '8-10' },
              { id: '209', exerciseId: 'weighted-lunges', sets: '4', reps: '8 ea' }
            ]
          }
        ]
      }))
    },
    {
      name: 'FTTX (Functional Tactical Training)',
      weeks: Array.from({ length: 12 }, (_, i) => ({
        week: i + 37,
        workouts: [
          {
            id: `softball-w${i+37}-d1`,
            title: 'Tactical Performance',
            day: 1,
            exercises: [
              { id: '210', exerciseId: 'game-specific-agility', sets: '5', reps: '2 min' }
            ]
          }
        ]
      }))
    },
    {
      name: 'OP (Off-season / Peak)',
      weeks: Array.from({ length: 4 }, (_, i) => ({
        week: i + 49,
        workouts: [
          {
            id: `softball-w${i+49}-d1`,
            title: 'Peak Performance',
            day: 1,
            exercises: [
              { id: '211', exerciseId: 'max-effort-sprint', sets: '3', reps: '60 yd' }
            ]
          }
        ]
      }))
    }
  ]
};

export const BASEBALL_52_WEEK: FullProgramTemplate = {
  id: 'baseball-52-week',
  name: 'KSP Baseball 52-Week Elite Performance',
  description: 'A comprehensive 52-week program for baseball athletes, focusing on explosive power, arm health, and speed. Includes 5 phases of development with 4-5 workouts per week.',
  phases: [
    {
      name: 'MEE (Metabolic Efficiency & Endurance)',
      weeks: Array.from({ length: 12 }, (_, i) => ({
        week: i + 1,
        workouts: [
          {
            id: `bb-mee-w${i+1}-d1`,
            title: 'Lower Body & Core Stability',
            day: 1,
            exercises: [
              { id: '212', exerciseId: 'trap-bar-deadlift', sets: '3', reps: '10', rest: '90s', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '213', exerciseId: 'goblet-squat', sets: '3', reps: '12', rest: '60s', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '214', exerciseId: 'pallof-press', sets: '3', reps: '12 ea', rest: '60s', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          },
          {
            id: `bb-mee-w${i+1}-d2`,
            title: 'Upper Body & Arm Care',
            day: 2,
            exercises: [
              { id: '215', exerciseId: 'incline-chest-press', sets: '3', reps: '12', rest: '90s', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '216', exerciseId: 'db-rows', sets: '3', reps: '12 ea', rest: '60s', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          },
          {
            id: `bb-mee-w${i+1}-d3`,
            title: 'Speed Mechanics & Agility',
            day: 3,
            exercises: [
              { id: '217', exerciseId: 'pro-agility', sets: '4', reps: 'trials', rest: '90s' }
            ]
          },
          {
            id: `bb-mee-w${i+1}-d4`,
            title: 'Full Body & Rotational Stability',
            day: 4,
            exercises: [
              { id: '218', exerciseId: 'step-up', sets: '3', reps: '10 ea', rest: '60s', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '219', exerciseId: 'mb-rotational-slam', sets: '3', reps: '10 ea', rest: '60s', videoLinkOverride: 'https://www.youtube.com/watch?v=R9K4tO8_6-w', canGenerateVideo: true }
            ]
          }
        ]
      }))
    },
    {
      name: 'S&P (Strength & Power)',
      weeks: Array.from({ length: 12 }, (_, i) => ({
        week: i + 13,
        workouts: [
          {
            id: `bb-sp-w${i+13}-d1`,
            title: 'Max Strength Lower',
            day: 1,
            exercises: [
              { id: '220', exerciseId: 'back-squat', sets: '4', reps: '5', rest: '3 min', videoLinkOverride: 'https://www.youtube.com/watch?v=ultWZbUMPL8', canGenerateVideo: true },
              { id: '221', exerciseId: 'rdl', sets: '3', reps: '8', rest: '2 min', videoLinkOverride: 'https://www.youtube.com/watch?v=jW24H4p2-5Q', canGenerateVideo: true },
              { id: '222', exerciseId: 'box-jumps', sets: '4', reps: '4', rest: '2 min', videoLinkOverride: 'https://www.youtube.com/watch?v=5k9e6y2-F-Q', canGenerateVideo: true }
            ]
          },
          {
            id: `bb-sp-w${i+13}-d2`,
            title: 'Max Strength Upper',
            day: 2,
            exercises: [
              { id: '223', exerciseId: 'bench-press', sets: '4', reps: '5', rest: '3 min', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '224', exerciseId: 'pull-up', sets: '3', reps: '6-8', rest: '2 min', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '225', exerciseId: 'mb-chest-pass', sets: '4', reps: '6', rest: '90s', videoLinkOverride: 'https://www.youtube.com/watch?v=R9K4tO8_6-w', canGenerateVideo: true }
            ]
          },
          {
            id: `bb-sp-w${i+13}-d3`,
            title: 'Plyometrics & Sprinting',
            day: 3,
            exercises: [
              { id: '226', exerciseId: 'depth-jumps', sets: '4', reps: '4', rest: '3 min', videoLinkOverride: 'https://www.youtube.com/watch?v=5k9e6y2-F-Q', canGenerateVideo: true },
              { id: '227', exerciseId: '30yd-sprints', sets: '6', reps: '20yd', rest: '3 min' },
              { id: '228', exerciseId: 'broad-jump', sets: '4', reps: '3', rest: '2 min', videoLinkOverride: 'https://www.youtube.com/watch?v=5k9e6y2-F-Q', canGenerateVideo: true }
            ]
          },
          {
            id: `bb-sp-w${i+13}-d4`,
            title: 'Explosive Full Body',
            day: 4,
            exercises: [
              { id: '229', exerciseId: 'hang-clean', sets: '4', reps: '3', rest: '3 min', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '230', exerciseId: 'push-press', sets: '4', reps: '5', rest: '2 min', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '231', exerciseId: 'mb-rotational-throw', sets: '4', reps: '5 ea', rest: '90s', videoLinkOverride: 'https://www.youtube.com/watch?v=R9K4tO8_6-w', canGenerateVideo: true }
            ]
          }
        ]
      }))
    },
    {
      name: 'SHP (Speed, Hypertrophy, Power)',
      weeks: Array.from({ length: 12 }, (_, i) => ({
        week: i + 25,
        workouts: [
          {
            id: `bb-shp-w${i+25}-d1`,
            title: 'Hypertrophy Lower',
            day: 1,
            exercises: [
              { id: '232', exerciseId: 'front-squat', sets: '4', reps: '8-10', rest: '2 min', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '233', exerciseId: 'bulgarian-lunge', sets: '3', reps: '10 ea', rest: '90s', videoLinkOverride: 'https://www.youtube.com/watch?v=2C-uEi5t0gI', canGenerateVideo: true }
            ]
          },
          {
            id: `bb-shp-w${i+25}-d2`,
            title: 'Hypertrophy Upper',
            day: 2,
            exercises: [
              { id: '234', exerciseId: 'incline-chest-press', sets: '4', reps: '10', rest: '90s', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '235', exerciseId: 'lat-pulldown', sets: '4', reps: '10', rest: '90s', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          },
          {
            id: `bb-shp-w${i+25}-d3`,
            title: 'Max Velocity Sprints',
            day: 3,
            exercises: [
              { id: '236', exerciseId: 'sprint-40', sets: '5', reps: '40yd', rest: '4 min' },
              { id: '237', exerciseId: 'flying-20s', sets: '4', reps: '20yd', rest: '3 min' }
            ]
          },
          {
            id: `bb-shp-w${i+25}-d4`,
            title: 'Rotational Power',
            day: 4,
            exercises: [
              { id: '238', exerciseId: 'mb-rotational-throw-heavy', sets: '5', reps: '4 ea', rest: '2 min', videoLinkOverride: 'https://www.youtube.com/watch?v=R9K4tO8_6-w', canGenerateVideo: true }
            ]
          },
          {
            id: `bb-shp-w${i+25}-d5`,
            title: 'Conditioning Shuttles',
            day: 5,
            exercises: [
              { id: '239', exerciseId: 'shuttle-300', sets: '3', reps: '300yd', rest: '3 min' }
            ]
          }
        ]
      }))
    },
    {
      name: 'FTTX (Functional Tactical Training)',
      weeks: Array.from({ length: 12 }, (_, i) => ({
        week: i + 37,
        workouts: [
          {
            id: `bb-fttx-w${i+37}-d1`,
            title: 'Throwing Prep & Arm Speed',
            day: 1,
            exercises: [
              { id: '240', exerciseId: 'mb-overhead-slam', sets: '4', reps: '8', rest: '60s', videoLinkOverride: 'https://www.youtube.com/watch?v=R9K4tO8_6-w', canGenerateVideo: true }
            ]
          },
          {
            id: `bb-fttx-w${i+37}-d2`,
            title: 'Base Running & Acceleration',
            day: 2,
            exercises: [
              { id: '241', exerciseId: 'steal-starts', sets: '8', reps: '10yd', rest: '90s' }
            ]
          },
          {
            id: `bb-fttx-w${i+37}-d3`,
            title: 'Functional Strength',
            day: 3,
            exercises: [
              { id: '242', exerciseId: 'single-leg-rdl', sets: '4', reps: '8 ea', rest: '90s', videoLinkOverride: 'https://www.youtube.com/watch?v=jW24H4p2-5Q', canGenerateVideo: true },
              { id: '243', exerciseId: 'step-up', sets: '4', reps: '6 ea', rest: '90s', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          },
          {
            id: `bb-fttx-w${i+37}-d4`,
            title: 'Tactical Agility',
            day: 4,
            exercises: [
              { id: '244', exerciseId: 'reactive-shuttle', sets: '5', reps: 'trials', rest: '90s' }
            ]
          }
        ]
      }))
    },
    {
      name: 'OP (Off-season / Peak)',
      weeks: Array.from({ length: 4 }, (_, i) => ({
        week: i + 49,
        workouts: [
          {
            id: `bb-op-w${i+49}-d1`,
            title: 'Peak Power',
            day: 1,
            exercises: [
              { id: '245', exerciseId: 'deadlift', sets: '3', reps: '1', rest: '5 min', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          },
          {
            id: `bb-op-w${i+49}-d2`,
            title: 'Peak Speed',
            day: 2,
            exercises: [
              { id: '246', exerciseId: 'sprint-60', sets: '3', reps: '60yd', rest: '5 min' }
            ]
          },
          {
            id: `bb-op-w${i+49}-d3`,
            title: 'Maintenance Strength',
            day: 3,
            exercises: [
              { id: '247', exerciseId: 'full-body-maintenance', sets: '3', reps: '8', rest: '2 min' }
            ]
          }
        ]
      }))
    }
  ]
};

export const SOFTBALL_SUMMER: FullProgramTemplate = {
  id: 'softball-summer',
  name: 'KSP Softball Summer Break',
  description: 'Summer-specific program for softball athletes focusing on power, speed, and durability.',
  phases: [
    {
      name: 'Summer Phase (Weeks 1-8)',
      weeks: Array.from({ length: 8 }, (_, i) => ({
        week: i + 1,
        workouts: [
          {
            id: `softball-s${i+1}-d1`,
            title: 'Power & Speed',
            day: 1,
            exercises: [
              { id: '248', exerciseId: 'mb-rotational-throw', sets: '4', reps: '6 ea', videoLinkOverride: 'https://www.youtube.com/watch?v=R9K4tO8_6-w', canGenerateVideo: true },
              { id: '249', exerciseId: 'trap-bar-jumps', sets: '4', reps: '5', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          }
        ]
      }))
    }
  ]
};

export const BASEBALL_SUMMER: FullProgramTemplate = {
  id: 'baseball-summer',
  name: 'KSP Baseball Summer Break',
  description: 'Summer-specific program for baseball athletes focusing on explosive power and arm health.',
  phases: [
    {
      name: 'Summer Phase (Weeks 1-8)',
      weeks: Array.from({ length: 8 }, (_, i) => ({
        week: i + 1,
        workouts: [
          {
            id: `baseball-s${i+1}-d1`,
            title: 'Explosive Power',
            day: 1,
            exercises: [
              { id: '250', exerciseId: 'hang-clean', sets: '4', reps: '5', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '251', exerciseId: 'med-ball-overhead-throw', sets: '4', reps: '6', videoLinkOverride: 'https://www.youtube.com/watch?v=R9K4tO8_6-w', canGenerateVideo: true }
            ]
          }
        ]
      }))
    }
  ]
};

export const STRENGTH_POWER_PROGRAM: FullProgramTemplate = {
  id: 'strength-power',
  name: 'Strength & Power',
  description: 'A specialized track focusing on maximal strength and explosive power development.',
  phases: [
    {
      name: 'Phase 1: Hypertrophy Foundation',
      weeks: Array.from({ length: 3 }, (_, i) => ({
        week: i + 1,
        workouts: [
          {
            id: `sp-w${i+1}-d1`,
            title: 'Lower Body Power',
            day: 1,
            exercises: [
              { id: '252', exerciseId: 'back-squat', sets: '4', reps: '8', rest: '2 min', videoLinkOverride: 'https://www.youtube.com/watch?v=ultWZbUMPL8', canGenerateVideo: true },
              { id: '253', exerciseId: 'rdl', sets: '3', reps: '10', rest: '90s', videoLinkOverride: 'https://www.youtube.com/watch?v=jW24H4p2-5Q', canGenerateVideo: true }
            ]
          },
          {
            id: `sp-w${i+1}-d3`,
            title: 'Upper Body Strength',
            day: 3,
            exercises: [
              { id: '254', exerciseId: 'bench-press', sets: '4', reps: '8', rest: '2 min', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '255', exerciseId: 'row', sets: '3', reps: '10', rest: '90s', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          }
        ]
      }))
    },
    {
      name: 'Phase 2: Absolute Strength',
      weeks: Array.from({ length: 3 }, (_, i) => ({
        week: i + 4,
        workouts: [
          {
            id: `sp-w${i+4}-d1`,
            title: 'Maximal Lower Body',
            day: 1,
            exercises: [
              { id: '256', exerciseId: 'heavy-back-squat', sets: '5', reps: '3-5', rest: '3 min', notes: 'Placeholder data', videoLinkOverride: 'https://www.youtube.com/watch?v=ultWZbUMPL8', canGenerateVideo: true },
              { id: '257', exerciseId: 'heavy-deadlift', sets: '4', reps: '3-5', rest: '3 min', notes: 'Placeholder data', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          },
          {
            id: `sp-w${i+4}-d3`,
            title: 'Maximal Upper Body',
            day: 3,
            exercises: [
              { id: '258', exerciseId: 'heavy-bench-press', sets: '5', reps: '3-5', rest: '3 min', notes: 'Placeholder data', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '259', exerciseId: 'heavy-overhead-press', sets: '4', reps: '3-5', rest: '3 min', notes: 'Placeholder data', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          }
        ]
      }))
    }
  ]
};

export const SPEED_AGILITY_PROGRAM: FullProgramTemplate = {
  id: 'speed-agility',
  name: 'Speed & Agility',
  description: 'Develop elite-level linear speed and multi-directional agility.',
  phases: [
    {
      name: 'Phase 1: Acceleration Mechanics',
      weeks: Array.from({ length: 3 }, (_, i) => ({
        week: i + 1,
        workouts: [
          {
            id: `sa-w${i+1}-d1`,
            title: 'Linear Speed',
            day: 1,
            exercises: [
              { id: '260', exerciseId: 'sprint-10', sets: '5', reps: '10yd', rest: '2 min', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '261', exerciseId: 'broad-jump', sets: '4', reps: '3', rest: '90s', videoLinkOverride: 'https://www.youtube.com/watch?v=5k9e6y2-F-Q', canGenerateVideo: true }
            ]
          },
          {
            id: `sa-w${i+1}-d3`,
            title: 'Change of Direction',
            day: 3,
            exercises: [
              { id: '262', exerciseId: 'pro-agility', sets: '4', reps: 'trials', rest: '2 min', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '263', exerciseId: 'lateral-bound', sets: '3', reps: '5 ea', rest: '90s', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          }
        ]
      }))
    },
    {
      name: 'Phase 2: Top End Speed',
      weeks: Array.from({ length: 3 }, (_, i) => ({
        week: i + 4,
        workouts: [
          {
            id: `sa-w${i+4}-d1`,
            title: 'Max Velocity',
            day: 1,
            exercises: [
              { id: '264', exerciseId: 'flying-20s', sets: '6', reps: '20yd', rest: '3 min', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '265', exerciseId: 'bounding', sets: '4', reps: '20yd', rest: '2 min', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          },
          {
            id: `sa-w${i+4}-d3`,
            title: 'Reactive Agility',
            day: 3,
            exercises: [
              { id: '266', exerciseId: 'mirror-drill', sets: '5', reps: '15s', rest: '90s', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true },
              { id: '267', exerciseId: 'reactive-shuttle', sets: '4', reps: 'trials', rest: '2 min', videoLinkOverride: 'https://www.youtube.com/watch?v=1n0L2W1-h6g', canGenerateVideo: true }
            ]
          }
        ]
      }))
    }
  ]
};

export const AEROBIC_CAPACITY_PROGRAM: FullProgramTemplate = {
  id: 'aerobic-capacity',
  name: 'Aerobic Capacity Foundation',
  description: 'Build your aerobic base with elite conditioning protocols.',
  phases: [
    {
      name: 'Phase 1',
      weeks: []
    }
  ]
};

export const ALL_PROGRAMS = [SOCCER_52_WEEK, SOFTBALL_52_WEEK, BASEBALL_52_WEEK, SOFTBALL_WINTER, BASEBALL_WINTER, SOFTBALL_SUMMER, BASEBALL_SUMMER, LOWER_BACK_REHAB, STRENGTH_POWER_PROGRAM, SPEED_AGILITY_PROGRAM, AEROBIC_CAPACITY_PROGRAM];
