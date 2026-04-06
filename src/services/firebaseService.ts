import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, serverTimestamp, updateDoc, onSnapshot } from 'firebase/firestore';

export const subscribeToProgress = (userId: string, callback: (data: any[]) => void) => {
  const q = query(collection(db, 'progress'), where('user_id', '==', userId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
};

export const subscribeToWorkoutLogs = (userId: string, callback: (data: any[]) => void) => {
  const q = query(collection(db, 'workout_logs'), where('user_id', '==', userId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
};

export const subscribeToProgramProgress = (userId: string, callback: (data: any[]) => void) => {
  const q = query(collection(db, 'program_progress'), where('user_id', '==', userId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
};

export const subscribeToBodyComp = (userId: string, callback: (data: any[]) => void) => {
  const q = query(collection(db, 'body_composition_logs'), where('user_id', '==', userId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
};

export const subscribeToMetrics = (userId: string, callback: (data: any) => void) => {
  const q = query(collection(db, 'metrics'), where('user_id', '==', userId));
  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      callback({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
    } else {
      callback(null);
    }
  });
};

export const subscribeToCustomPrograms = (userId: string, callback: (data: any[]) => void) => {
  const q = query(collection(db, 'custom_programs'), where('user_id', '==', userId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
};

export const getProgress = async (userId: string) => {
  const q = query(collection(db, 'progress'), where('user_id', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addProgress = async (progressData: any) => {
  return await addDoc(collection(db, 'progress'), {
    ...progressData,
    user_id: progressData.user_id,
    recorded_at: serverTimestamp()
  });
};

export const deleteProgress = async (id: string) => {
  return await deleteDoc(doc(db, 'progress', id));
};

export const getWorkoutLogs = async (userId: string) => {
  const q = query(collection(db, 'workout_logs'), where('user_id', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addWorkoutLog = async (logData: any) => {
  return await addDoc(collection(db, 'workout_logs'), {
    ...logData,
    user_id: logData.user_id,
    created_at: serverTimestamp()
  });
};

export const updateWorkoutLog = async (id: string, logData: any) => {
  return await updateDoc(doc(db, 'workout_logs', id), {
    ...logData,
    updated_at: serverTimestamp()
  });
};

export const deleteWorkoutLog = async (id: string) => {
  return await deleteDoc(doc(db, 'workout_logs', id));
};

export const getProgramProgress = async (userId: string) => {
  const q = query(collection(db, 'program_progress'), where('user_id', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getNutritionLogs = async (userId: string) => {
  const q = query(collection(db, 'nutrition_logs'), where('user_id', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addNutritionLog = async (logData: any) => {
  return await addDoc(collection(db, 'nutrition_logs'), {
    ...logData,
    user_id: logData.user_id,
    created_at: serverTimestamp()
  });
};

export const getWorkoutFeedback = async (userId: string) => {
  const q = query(collection(db, 'workout_feedback'), where('user_id', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const deleteProgramProgress = async (userId: string, programId: string, phase: string, week: number, day: number) => {
  const progressId = `${userId}_${programId}_${phase}_${week}_${day}`;
  return await deleteDoc(doc(db, 'program_progress', progressId));
};

export const getExercises = async () => {
  const snapshot = await getDocs(collection(db, 'exercises'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addExercise = async (exerciseData: any) => {
  return await addDoc(collection(db, 'exercises'), {
    ...exerciseData,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
};

export const updateExercise = async (id: string, exerciseData: any) => {
  return await updateDoc(doc(db, 'exercises', id), {
    ...exerciseData,
    updated_at: serverTimestamp()
  });
};

export const deleteExercise = async (id: string) => {
  return await deleteDoc(doc(db, 'exercises', id));
};
