export const logActivity = async (userId: string | number, action: string, details: any) => {
  try {
    await fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, action, details })
    });
  } catch (err) {
    console.error("Failed to log activity", err);
  }
};
