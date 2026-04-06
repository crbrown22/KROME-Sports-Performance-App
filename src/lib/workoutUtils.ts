import { WorkoutTemplate, ExerciseTemplate } from "../data/workoutTemplates";

/**
 * Extracts all exercises from a workout template, supporting both structured (warmUp, quickness, etc.)
 * and legacy (exercises array) formats.
 */
export const getWorkoutExercises = (workout: WorkoutTemplate): ExerciseTemplate[] => {
  if (!workout) return [];
  
  const structured = [
    ...(workout.warmUp || []),
    ...(workout.quickness || []),
    ...(workout.lift || []),
    ...(workout.metabolic || []),
    ...(workout.coolDown || [])
  ];
  
  const legacy = workout.exercises || [];
  
  // Combine all exercises from all possible locations
  return [...structured, ...legacy];
};

/**
 * Calculates the completion percentage for a given workout.
 */
export const calculateWorkoutProgress = (workout: WorkoutTemplate, completedExercises: Record<string, boolean>): number => {
  const exercises = getWorkoutExercises(workout);
  if (exercises.length === 0) return 0;
  
  const completedCount = exercises.filter(ex => completedExercises[`${workout.id}-${ex.id}`]).length;
  return Math.round((completedCount / exercises.length) * 100);
};
