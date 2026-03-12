import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, User, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDate } from '../utils/date';

interface Feedback {
  id: number;
  user_id: number;
  workout_id: string;
  program_id: string;
  rating: number;
  comment: string;
  created_at: string;
  username?: string;
}

export default function FeedbackViewer() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await fetch('/api/admin/feedback');
        if (res.ok) {
          const data = await res.json();
          setFeedback(data);
        }
      } catch (err) {
        console.error("Failed to fetch feedback", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  if (loading) {
    return (
      <div className="p-20 text-center">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Loading feedback...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-black uppercase italic tracking-tight">Athlete <span className="text-gold">Feedback</span></h3>
        <div className="px-4 py-1 bg-gold/10 border border-gold/20 rounded-full text-gold text-[10px] font-black uppercase tracking-widest">
          {feedback.length} Submissions
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {feedback.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all group"
          >
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center text-black font-black italic shadow-lg shrink-0">
                  {item.username?.[0].toUpperCase() || 'A'}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-black uppercase italic text-white">{item.username || `Athlete #${item.user_id}`}</p>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-3 h-3 ${star <= item.rating ? 'fill-gold text-gold' : 'text-white/10'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/40">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(item.created_at)}</span>
                    <span className="flex items-center gap-1 text-gold"><MessageSquare className="w-3 h-3" /> {item.workout_id.replace(/-/g, ' ')}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {item.comment && (
              <div className="mt-6 p-4 bg-black/40 rounded-2xl border border-white/5 text-sm text-white/70 leading-relaxed italic">
                "{item.comment}"
              </div>
            )}
          </motion.div>
        ))}

        {feedback.length === 0 && (
          <div className="p-20 text-center bg-zinc-900/30 border border-dashed border-white/10 rounded-[40px]">
            <MessageSquare className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">No feedback received yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
