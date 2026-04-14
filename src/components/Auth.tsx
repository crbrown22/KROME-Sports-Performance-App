import { auth } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import React, { useState } from "react";
import { haptics } from '../utils/nativeBridge';
import { motion } from "framer-motion";
import { safeStorage } from '../utils/storage';
import { getCurrentDate } from '../utils/date';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  ChevronLeft,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

interface AuthProps {
  key?: string;
  onBack: () => void;
  onLoginSuccess: (user: any) => void;
  initialMode?: 'login' | 'register' | 'reset';
}

export default function Auth({ onBack, onLoginSuccess, initialMode = 'login' }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<'athlete' | 'coach'>('athlete');
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Fetch additional user data from our backend
        const response = await fetch(`/api/users/${user.uid}`);
        if (response.ok) {
          const userData = await response.json();
          haptics.success();
          onLoginSuccess(userData);
        } else {
          // If user exists in Firebase but not in our DB, register them
          const registerResponse = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              uid: user.uid,
              username: user.displayName || user.email?.split('@')[0], 
              email: user.email, 
              firstName: user.displayName?.split(' ')[0] || '',
              lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
              role: (user.email === 'swolecode@gmail.com' || user.email === 'kromefitness@gmail.com') ? 'admin' : 'athlete',
              avatarUrl: user.photoURL
            })
          });
          
          if (registerResponse.ok) {
            const userData = await registerResponse.json();
            haptics.success();
            onLoginSuccess(userData);
          } else {
            setError("Failed to sync user profile. Please try again.");
          }
        }
      } else if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update Firebase profile
        await updateProfile(user, {
          displayName: `${firstName} ${lastName}`.trim()
        });

        // Sync with our backend
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            uid: user.uid,
            username: username || email.split('@')[0], 
            email, 
            firstName,
            lastName,
            role,
            avatarUrl: user.photoURL
          })
        });
        
        if (response.ok) {
          const userData = await response.json();
          haptics.success();
          onLoginSuccess(userData);
        } else {
          const data = await response.json();
          setError(data.error || "Registration sync failed");
        }
      } else {
        await sendPasswordResetEmail(auth, email);
        setSuccess("A reset link has been sent to your email.");
      }
    } catch (err: any) {
      console.error(err);
      let message = "An error occurred. Please try again.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        message = "Invalid email or password.";
      } else if (err.code === 'auth/email-already-in-use') {
        message = "This email is already registered.";
      } else if (err.code === 'auth/weak-password') {
        message = "Password should be at least 6 characters.";
      }
      setError(message);
      haptics.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-32 pb-24 flex items-center justify-center bg-black px-6"
    >
      <div className="w-full max-w-md">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest mb-8 hover:gap-4 transition-all"
          aria-label="Go back to previous page"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Back
        </button>

        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-xl shadow-2xl">
          <div className="text-center mb-10">
            <div className="w-16 h-16 gold-gradient rounded-2xl flex items-center justify-center font-black text-black text-3xl italic mx-auto mb-6 shadow-lg shadow-gold/20">K</div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter">
              {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Join the Nation' : 'Reset Password'}
            </h2>
            <p className="text-white/60 text-sm mt-2">
              {mode === 'login' ? 'Enter your credentials to access your training.' : 
               mode === 'register' ? 'Create your account to start your 52-week journey.' : 
               'Enter your email to receive a reset link.'}
            </p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </motion.div>
          )}

          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1">First Name</label>
                    <input 
                      id="firstName"
                      type="text" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-gold outline-none transition-colors"
                      placeholder="John"
                      required
                      aria-required="true"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1">Last Name</label>
                    <input 
                      id="lastName"
                      type="text" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-gold outline-none transition-colors"
                      placeholder="Doe"
                      required
                      aria-required="true"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="username" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" aria-hidden="true" />
                    <input 
                      id="username"
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:border-gold outline-none transition-colors"
                      placeholder="krome_athlete"
                      required
                      aria-required="true"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1">Account Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRole('athlete')}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all ${
                        role === 'athlete' 
                          ? 'bg-gold text-black border-gold' 
                          : 'bg-black/50 text-white/60 border-white/10 hover:border-white/30'
                      }`}
                    >
                      Athlete
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('coach')}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all ${
                        role === 'coach' 
                          ? 'bg-gold text-black border-gold' 
                          : 'bg-black/50 text-white/60 border-white/10 hover:border-white/30'
                      }`}
                    >
                      Coach
                    </button>
                  </div>
                  {role === 'coach' && (
                    <p className="text-[10px] text-gold font-bold uppercase tracking-widest mt-2 ml-1">
                      Coaches are automatically assigned as Admin
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" aria-hidden="true" />
                <input 
                  id="email"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:border-gold outline-none transition-colors"
                  placeholder="athlete@krome.com"
                  required
                  aria-required="true"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1">Password</label>
                  {mode === 'login' && (
                    <button 
                      type="button" 
                      onClick={() => setMode('reset')} 
                      className="text-[10px] font-bold text-gold hover:underline uppercase tracking-widest"
                      aria-label="Forgot password? Click to reset"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" aria-hidden="true" />
                  <input 
                    id="password"
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:border-gold outline-none transition-colors"
                    placeholder="••••••••"
                    required
                    aria-required="true"
                  />
                </div>
              </div>
            )}

            <button type="submit" className="btn-gold w-full flex items-center justify-center gap-2 mt-4">
              {mode === 'login' ? 'Login' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-white/60 text-sm font-medium">
              {mode === 'login' ? "Don't have an account?" : "Already a member?"}
              <button 
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError("");
                  setSuccess("");
                }}
                className="text-gold font-bold ml-2 hover:underline"
                aria-label={mode === 'login' ? "Switch to registration" : "Switch to login"}
              >
                {mode === 'login' ? 'Register Now' : 'Login Here'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
