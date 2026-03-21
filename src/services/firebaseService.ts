import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, serverTimestamp, updateDoc } from 'firebase/firestore';

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
