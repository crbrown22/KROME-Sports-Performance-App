import { safeStorage } from '../utils/storage';
import React, { useState } from 'react';
import { Star, Send, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentDate } from '../utils/date';

interface WorkoutFeedbackProps {
  userId: string;
  workoutId: string;
  programId: string;
  phase?: string;
  week?: number;
  day?: number;
  onSuccess?: () => void;
}

export default function WorkoutFeedback({ userId, workoutId, programId, phase, week, day, onSuccess }: WorkoutFeedbackProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setSubmitting(true);
    try {
      const today = getCurrentDate();

      // 1. Finish the workout to set the end time
      await fetch(`/api/workout-logs/${userId}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workout_id: workoutId,
          date: today,
          end_time: new Date().toISOString()
        })
      });

      // 2. Update program progress to mark as completed (if phase/week/day provided)
      if (phase && week !== undefined && day !== undefined) {
        await fetch(`/api/program-progress/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            progress: [{
              programId,
              phase,
              week,
              day,
              completed: true,
              date: today
            }]
          })
        });
      }

      // 3. Submit the feedback
      const response = await fetch('/api/workout-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          workout_id: workoutId,
          program_id: programId,
          rating,
          comment
        })
      });

      if (response.ok) {
        setSubmitted(true);
        window.dispatchEvent(new CustomEvent('workout-completed'));
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error("Failed to submit feedback", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 text-center"
      >
        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-8 h-8 text-black" />
        </div>
        <h3 className="text-xl font-black uppercase italic text-emerald-500 mb-2">Feedback Received!</h3>
        <p className="text-white/60 text-sm uppercase tracking-widest font-bold">Thank you for helping us improve your elite performance system.</p>
      </motion.div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8">
      <h3 className="text-xl font-black uppercase italic tracking-tight mb-2">Workout <span className="text-gold">Feedback</span></h3>
      <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-8">How was today's session? Your input drives the evolution.</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-all hover:scale-110 active:scale-95"
              >
                <Star 
                  className={`w-10 h-10 ${
                    (hoveredRating || rating) >= star 
                      ? 'fill-gold text-gold drop-shadow-[0_0_8px_rgba(197,156,33,0.5)]' 
                      : 'text-white/10'
                  }`} 
                />
              </button>
            ))}
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gold">
            {rating === 1 ? 'Brutal' : 
             rating === 2 ? 'Challenging' : 
             rating === 3 ? 'Solid' : 
             rating === 4 ? 'Elite' : 
             rating === 5 ? 'Legendary' : 'Select Rating'}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Additional Comments (Optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your intensity, recovery, or any specific challenges..."
            className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 px-4 text-sm text-white focus:border-gold outline-none transition-all min-h-[120px] resize-none placeholder:text-white/10"
          />
        </div>

        <button
          type="submit"
          disabled={rating === 0 || submitting}
          className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Feedback
            </>
          )}
        </button>
      </form>
    </div>
  );
}
