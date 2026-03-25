import { InstallPrompt } from "./components/InstallPrompt";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dumbbell, 
  Zap, 
  StretchHorizontal, 
  PlayCircle, 
  ChevronRight, 
  Menu, 
  X,
  Instagram,
  Youtube,
  Facebook,
  ChevronDown,
  User,
  Shield,
  ChevronLeft,
  Lock,
  LogOut,
  Share2,
  ShoppingBag
} from "lucide-react";
import { useState, useEffect } from "react";
import { NotificationProvider } from "./context/NotificationContext";
import NotificationIcon from "./components/NotificationIcon";
import ProgramIntro from "./components/ProgramIntro";
import SpecializedProgram from "./components/SpecializedProgram";
import FlexibilityMobility from "./components/FlexibilityMobility";
import StrengthPower from "./components/StrengthPower";
import ConditioningSpeed from "./components/ConditioningSpeed";
import AerobicCapacityFoundation from "./components/AerobicCapacityFoundation";
import PerformanceMacroNutrients from "./components/PerformanceMacroNutrients";
import MicronutrientOptimization from "./components/MicronutrientOptimization";
import RecipeLibrary from "./components/RecipeLibrary";
import Shop from "./components/Shop";
import Contact from "./components/Contact";
import Auth from "./components/Auth";
import Profile from "./components/Profile";
import AdminDashboard from "./components/AdminDashboard";
import UserAdminChat from "./components/UserAdminChat";
import SpecializedTrainingLanding from "./components/SpecializedTrainingLanding";
import MovementLanding from "./components/MovementLanding";
import NutritionLanding from "./components/NutritionLanding";
import BreakProgramsLanding from "./components/BreakProgramsLanding";
import ProgramBuilder from "./components/ProgramBuilder";
import ProgramViewer from "./components/ProgramViewer";
import ProgramCatalog from "./components/ProgramCatalog";
import ProductDescription from "./components/ProductDescription";
import WorkoutTracker from "./components/WorkoutTracker";
import FitnessOverview from "./components/FitnessOverview";
import ProgressTracker from "./components/ProgressTracker";
import NutritionDashboard from "./components/NutritionDashboard";
import BodyCompositionTracker from "./components/BodyCompositionTracker";
import BodyMetrics from "./components/BodyMetrics";
import FitnessGoalOnboarding from "./components/FitnessGoalOnboarding";
import OnboardingFlow from "./components/OnboardingFlow";
import { BodyMetricsData, INITIAL_DATA } from "./types";
import VideoAnalyzer from "./components/VideoAnalyzer";
import PARQ from "./components/PARQ";
import ProgramCalendar from "./components/ProgramCalendar";
import AccountSettings from "./components/AccountSettings";
import { ALL_PROGRAMS } from "./data/workoutTemplates";
import { logActivity } from "./utils/activity";
import { haptics } from "./utils/nativeBridge";
import Chatbot from "./components/Chatbot";
import { safeStorage } from "./utils/storage";
import ErrorBoundary from "./components/ErrorBoundary";

const programs = [
  {
    id: "flexibility",
    title: "Flexibility & Mobility",
    description: "Improve joint health and enhance your movement potential with elite mobility protocols.",
    icon: <StretchHorizontal className="w-8 h-8" />,
    image: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=800&auto=format&fit=crop",
    link: "#"
  },
  {
    id: "conditioning",
    title: "Conditioning & Speed",
    description: "Boost your VO2 Max and overall athletic performance with high-intensity agility training.",
    icon: <Zap className="w-8 h-8" />,
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=800&auto=format&fit=crop",
    link: "#"
  },
  {
    id: "strength",
    title: "Strength & Power",
    description: "Maximize explosive power by tapping into the kinetic chain for peak performance.",
    icon: <Dumbbell className="w-8 h-8" />,
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop",
    link: "#"
  },
  {
    id: "specialized",
    title: "Specialized Training",
    description: "Targeted protocols for specific goals, including speed, movement, and nutrition.",
    icon: <Zap className="w-8 h-8" />,
    image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=800&auto=format&fit=crop",
    link: "#"
  }
];

type View = 'home' | 'programIntro' | 'specialized' | 'auth' | 'profile' | 'admin' | 'flexibilityMobility' | 'strengthPower' | 'conditioningSpeed' | 'aerobicCapacityFoundation' | 'performanceMacroNutrients' | 'micronutrientOptimization' | 'recipeLibrary' | 'specializedLanding' | 'shop' | 'contact' | 'programBuilder' | 'programViewer' | 'programCatalog' | 'myPrograms' | 'breakPrograms' | 'movementPrograms' | 'productDescription' | 'movementLanding' | 'nutritionLanding' | 'breakProgramsLanding' | 'workoutTracker' | 'fitnessOverview' | 'progressTracker' | 'nutritionDashboard' | 'bodyComposition' | 'bodyMetrics' | 'videoAnalysis' | 'parq' | 'programCalendar' | 'accountSettings' | 'fitnessGoal' | 'onboarding';

const programPrices: Record<string, number> = {
  'soccer-52-week': 99.99,
  'softball-52-week': 99.99,
  'baseball-52-week': 99.99,
  'softball-winter': 49.99,
  'baseball-winter': 49.99,
  'softball-summer': 49.99,
  'baseball-summer': 49.99,
  'lower-back-rehab': 29.99,
  'strength-power': 79.99,
  'speed-agility': 79.99,
  'aerobic-capacity': 49.99
};

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewStack, setViewStack] = useState<View[]>(['home']);
  const currentView = viewStack[viewStack.length - 1];

  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  const navigateTo = (view: View, targetId?: string) => {
    if (viewStack[viewStack.length - 1] === view && targetUserId === targetId) return;
    if (targetId) setTargetUserId(targetId);
    else setTargetUserId(null);
    setViewStack(prev => [...prev, view]);
  };

  const setCurrentView = navigateTo;

  const goBack = () => {
    if (viewStack.length > 1) {
      setViewStack(prev => prev.slice(0, -1));
    } else {
      setViewStack(['home']);
    }
  };

  const resetToView = (view: View) => {
    setViewStack([view]);
  };

  const [selectedProgramId, setSelectedProgramId] = useState<string | undefined>(undefined);
  const [selectedProgram, setSelectedProgram] = useState<any | undefined>(undefined);
  const [isCustomProgram, setIsCustomProgram] = useState(false);
  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState<number | undefined>(undefined);
  const [programsDropdownOpen, setProgramsDropdownOpen] = useState(false);
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [shopCategory, setShopCategory] = useState<'all' | 'programs' | 'apparel'>('all');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = safeStorage.getItem('krome_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);
  const [showChat, setShowChat] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<'progress' | 'metrics' | 'parq' | 'nutrition' | 'workouts' | 'composition' | 'overview' | 'activity' | 'programs' | 'builder' | 'video' | 'settings' | 'ai-tools' | 'chat' | 'feedback'>('progress');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [specializedType, setSpecializedType] = useState<'movement' | 'speed' | 'strength' | 'nutrition'>('movement');
  const [purchasedPrograms, setPurchasedPrograms] = useState<string[]>([]);
  const [bodyMetricsData, setBodyMetricsData] = useState<BodyMetricsData>(INITIAL_DATA);

  const BottomNav = () => {
    const navItems = [
      { id: 'messages', icon: <NotificationIcon userId={user?.id} onOpenChat={() => setShowChat(true)} onOpenAdminChat={() => { setAdminInitialTab('chat'); navigateTo('admin'); safeStorage.setItem('krome_admin_active_tab', 'chat'); }} isAdmin={user?.role === 'admin'} unreadCount={unreadCount} standalone={false} />, label: 'Messages' },
      { id: 'programCatalog', icon: <Zap className="w-5 h-5" />, label: 'Programs' },
      { id: 'shop', icon: <ShoppingBag className="w-5 h-5" />, label: 'Shop' },
      { id: 'profile', icon: <User className="w-5 h-5" />, label: 'Profile' },
      { id: 'more', icon: <Menu className="w-5 h-5" />, label: 'More' },
    ];

    return (
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-black/90 backdrop-blur-xl border-t border-white/10 px-4 py-3 flex justify-between items-center z-[100] pb-[calc(12px+var(--safe-area-bottom))]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'more') {
                setMobileMenuOpen(!mobileMenuOpen);
              } else if (item.id === 'messages') {
                setShowChat(true);
              } else if (item.id === 'profile' && !user) {
                setAuthMode('login');
                navigateTo('auth');
              } else {
                navigateTo(item.id as View);
                setMobileMenuOpen(false);
              }
            }}
            className={`mobile-nav-item ${currentView === item.id || (item.id === 'more' && mobileMenuOpen) ? 'mobile-nav-active' : 'mobile-nav-inactive'}`}
          >
            {item.icon}
            <span className="text-[10px]">{item.label}</span>
          </button>
        ))}
      </div>
    );
  };

  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadSenderIds, setUnreadSenderIds] = useState<Set<number>>(new Set());

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const fetchUnread = async () => {
      if (!user) {
        setUnreadCount(0);
        setUnreadSenderIds(new Set());
        return;
      }
      try {
        const url = `${window.location.origin}/api/messages/unread?userId=${user.id}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.length);
          if (user.role === 'admin') {
            const ids = new Set<number>(data.map((m: any) => m.sender_id));
            setUnreadSenderIds(ids);
          }
        }
      } catch (err) {
        console.error("Failed to load unread messages", err);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (user) {
      const fetchPurchases = async () => {
        try {
          const res = await fetch(`/api/purchases/${user.id}`);
          if (res.ok) {
            const data = await res.json();
            setPurchasedPrograms(data.map((p: any) => p.item_name));
          }
        } catch (err) {
          console.error("Failed to fetch purchases", err);
        }
      };
      fetchPurchases();
    } else {
      setPurchasedPrograms([]);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const fetchMetrics = async () => {
        try {
          const res = await fetch(`/api/metrics/${user.id}`);
          if (res.ok) {
            const dbData = await res.json();
            if (dbData) {
              setBodyMetricsData(dbData);
            }
          }
        } catch (err) {
          console.error("Failed to load metrics", err);
        }
      };
      fetchMetrics();
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      const needsOnboarding = !user.fitness_goal || user.parq_completed == 0;
      // Allow them to stay on profile to see the prompt, but redirect from other pages
      if (needsOnboarding && currentView !== 'onboarding' && currentView !== 'profile') {
        resetToView('onboarding');
      }
    }
  }, [user, currentView]);

  useEffect(() => {
    if (user) {
      safeStorage.setItem('krome_user', JSON.stringify(user));
    } else {
      safeStorage.removeItem('krome_user');
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('success')) {
      alert('Order placed! You will receive an email confirmation.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (query.get('canceled')) {
      alert('Order canceled -- continue to shop around and checkout when you\'re ready.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleProgramClick = (id: string) => {
    if (id === 'flexibility') {
      setSelectedProgramId('lower-back-rehab');
      navigateTo('programViewer');
    } else if (id === 'strength') {
      setSelectedProgramId('soccer-52-week');
      navigateTo('programViewer');
    } else if (id === 'conditioning') {
      setSelectedProgramId('softball-52-week');
      navigateTo('programViewer');
    } else if (id === 'aerobic') {
      setSelectedProgramId('baseball-52-week');
      navigateTo('programViewer');
    } else if (id === 'specialized') {
      navigateTo('specializedLanding');
    }
  };

  const handleLoginSuccess = (userData: any) => {
    console.log("Login success, user:", userData);
    setUser(userData);
    safeStorage.setItem('krome_user', JSON.stringify(userData));
    
    const needsOnboarding = !userData.fitness_goal || userData.parq_completed === 0;
    if (needsOnboarding && userData.role !== 'admin') {
      resetToView('onboarding');
    } else {
      resetToView('profile');
    }
    
    logActivity(userData.id, 'login', { username: userData.username });
  };

  const handleLogout = async () => {
    if (user) {
      logActivity(user?.id, 'logout', { username: user?.username });
    }
    setUser(null);
    safeStorage.removeItem('krome_user');
    resetToView('home');
  };

  const handleShare = async () => {
    const shareData = {
      title: 'KROME Sports Performance',
      text: 'Check out KROME Sports Performance for elite athletic training!',
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.origin);
        haptics.success();
      } catch (err) {
        console.error('Error copying to clipboard:', err);
      }
    }
  };

  return (
    <NotificationProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-black overflow-x-hidden pb-20 md:pb-0">
        {/* Navbar */}
      <nav 
        role="navigation" 
        aria-label="Main navigation"
        className={`hidden md:block fixed top-0 w-full z-[1000] transition-all duration-300 ${isScrolled || currentView !== 'home' || mobileMenuOpen ? "bg-black/95 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/50" : "bg-transparent"}`}
        style={{ 
          paddingTop: 'var(--safe-area-top)',
          pointerEvents: 'auto'
        }}
      >
        <div className={`max-w-7xl mx-auto px-6 flex justify-between items-center transition-all duration-300 ${isScrolled || currentView !== 'home' || mobileMenuOpen ? "py-2" : "py-4"}`}>
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => { navigateTo('home'); setMobileMenuOpen(false); }}
            role="button"
            aria-label="KROME Sports Home"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigateTo('home'); }}
          >
            <span className="text-xl font-black tracking-tighter uppercase italic">
              KROME <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent pr-1 pb-1">Sports</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest">
            <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('home'); }} className="hover:text-gold transition-colors !outline-none hover:krome-outline px-2 py-1 rounded-lg">Home</a>
            
            <div 
              className="relative group"
              onMouseEnter={() => setProgramsDropdownOpen(true)}
              onMouseLeave={() => setProgramsDropdownOpen(false)}
            >
              <button 
                className="flex items-center gap-1 hover:text-gold transition-colors uppercase tracking-widest !outline-none hover:krome-outline px-2 py-1 rounded-lg"
                aria-expanded={programsDropdownOpen}
                aria-haspopup="true"
                aria-label="Programs menu"
              >
                Programs <ChevronDown className="w-4 h-4" aria-hidden="true" />
              </button>
              
              <AnimatePresence>
                {programsDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-4 w-72 bg-zinc-900 border border-white/10 rounded-2xl p-4 shadow-2xl"
                  >
                    <div className="flex flex-col gap-1 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                      <button 
                        onClick={() => { navigateTo('programCatalog'); setProgramsDropdownOpen(false); }}
                        className="text-left p-3 rounded-xl hover:bg-white/5 transition-colors group !outline-none"
                      >
                        <div className="text-sm font-bold group-hover:text-gold transition-colors uppercase italic">52 Week Program</div>
                        <div className="text-[10px] text-white/40 mt-1">Complete athlete development system</div>
                      </button>

                      <button 
                        onClick={() => { navigateTo('specializedLanding'); setProgramsDropdownOpen(false); }}
                        className="text-left p-3 rounded-xl hover:bg-white/5 transition-colors group !outline-none"
                      >
                        <div className="text-sm font-bold group-hover:text-gold transition-colors uppercase italic">Specialized Training</div>
                        <div className="text-[10px] text-white/40 mt-1">Targeted protocols for specific goals</div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div 
              className="relative group"
              onMouseEnter={() => setShopDropdownOpen(true)}
              onMouseLeave={() => setShopDropdownOpen(false)}
            >
              <button 
                onClick={() => { setShopCategory('all'); navigateTo('shop'); setShopDropdownOpen(false); }}
                className="flex items-center gap-1 hover:text-gold transition-colors uppercase tracking-widest !outline-none hover:krome-outline px-2 py-1 rounded-lg"
                aria-expanded={shopDropdownOpen}
                aria-haspopup="true"
                aria-label="Shop menu"
              >
                Shop <ChevronDown className="w-4 h-4" aria-hidden="true" />
              </button>
              
              <AnimatePresence>
                {shopDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-4 w-48 bg-zinc-900 border border-white/10 rounded-2xl p-4 shadow-2xl"
                  >
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => { setShopCategory('programs'); navigateTo('shop'); setShopDropdownOpen(false); }}
                        className="text-left p-3 rounded-xl hover:bg-white/5 transition-colors group !outline-none"
                      >
                        <div className="text-sm font-bold group-hover:text-gold transition-colors uppercase italic">Programs</div>
                      </button>
                      <button 
                        onClick={() => { setShopCategory('apparel'); navigateTo('shop'); setShopDropdownOpen(false); }}
                        className="text-left p-3 rounded-xl hover:bg-white/5 transition-colors group !outline-none"
                      >
                        <div className="text-sm font-bold group-hover:text-gold transition-colors uppercase italic">Apparel</div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                navigateTo('contact');
              }} 
              className="hover:text-gold transition-colors !outline-none hover:krome-outline px-2 py-1 rounded-lg"
            >
              Contact KSP
            </a>

            
            {user?.role === 'admin' && (
              <button 
                onClick={() => navigateTo('admin')}
                className="text-gold hover:text-white transition-colors flex items-center gap-2 !outline-none hover:krome-outline px-2 py-1 rounded-lg"
              >
                <Shield className="w-4 h-4" /> Admin
              </button>
            )}

            <button 
              onClick={handleShare}
              className="text-accent hover:text-white transition-colors flex items-center gap-2 !outline-none hover:krome-outline px-2 py-1 rounded-lg"
              aria-label="Share app"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>

            <NotificationIcon 
              userId={user?.id}
              onOpenChat={() => setShowChat(true)} 
              onOpenAdminChat={() => { setAdminInitialTab('chat'); navigateTo('admin'); safeStorage.setItem('krome_admin_active_tab', 'chat'); }}
              isAdmin={user?.role === 'admin'}
              unreadCount={unreadCount}
            />

            {user ? (
              <button 
                onClick={() => navigateTo('profile')}
                className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full hover:bg-white/10 transition-all group krome-outline"
              >
                <div className="w-6 h-6 rounded-full gold-gradient flex items-center justify-center text-black overflow-hidden relative">
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.username} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 border border-zinc-900"></span>
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold group-hover:text-gold transition-colors">{user.username}</span>
              </button>
            ) : (
              <button 
                onClick={() => { setAuthMode('login'); navigateTo('auth'); }}
                className="btn-gold !py-2 !px-6 !text-xs !outline-none"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden text-white p-2 !outline-none cursor-pointer active:scale-95 transition-transform" 
            onClick={(e) => {
              e.stopPropagation();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden fixed top-0 left-0 w-full bg-black/95 border-b border-white/10 p-6 flex flex-col gap-4 text-center uppercase font-bold tracking-widest overflow-y-auto max-h-[80vh] z-[1000]"
            style={{ paddingTop: 'calc(var(--safe-area-top) + 20px)' }}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <span className="text-lg font-black tracking-tighter uppercase italic">KROME <span className="text-gold">Sports</span></span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-white/60 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('home'); setMobileMenuOpen(false); }} className="!outline-none py-2 border-b border-white/5">Home</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('contact'); setMobileMenuOpen(false); }} className="!outline-none py-2 border-b border-white/5">Contact</a>
            
            <div className="text-[10px] text-white/30 mt-4 border-b border-white/5 pb-2">Programs</div>
            <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('programCatalog'); setMobileMenuOpen(false); }} className="text-gold !outline-none py-2">52 Week Program</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('specializedLanding'); setMobileMenuOpen(false); }} className="text-gold !outline-none py-2">Specialized Training</a>

            <div className="mt-4 border-t border-white/5 pt-4 flex flex-col gap-4">
              <button 
                onClick={() => { handleShare(); setMobileMenuOpen(false); }} 
                className="text-accent flex items-center justify-center gap-2 !outline-none py-2"
              >
                <Share2 className="w-4 h-4" /> Share App
              </button>
              <a href="#" onClick={(e) => { e.preventDefault(); setShopCategory('all'); navigateTo('shop'); setMobileMenuOpen(false); }} className="text-gold !outline-none py-2">Shop</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setShopCategory('programs'); navigateTo('shop'); setMobileMenuOpen(false); }} className="text-gold !outline-none py-2">Programs</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setShopCategory('apparel'); navigateTo('shop'); setMobileMenuOpen(false); }} className="text-gold !outline-none py-2">Apparel</a>

              {user?.role === 'admin' && (
                <button onClick={() => { navigateTo('admin'); setMobileMenuOpen(false); }} className="text-gold !outline-none py-2">Admin Dashboard</button>
              )}
              
              {user ? (
                <button onClick={() => { navigateTo('profile'); setMobileMenuOpen(false); }} className="text-gold relative inline-flex items-center gap-2 mx-auto !outline-none py-2">
                  Profile
                  {unreadCount > 0 && (
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  )}
                </button>
              ) : (
                <button 
                  onClick={() => { setAuthMode('login'); navigateTo('auth'); setMobileMenuOpen(false); }}
                  className="btn-gold mx-auto !outline-none"
                >
                  Login
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        {showChat && user && (
          <div className="fixed bottom-28 md:bottom-6 right-6 z-[110] w-full max-w-sm px-6 md:px-0">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative"
            >
              <UserAdminChat userId={user.id} onClose={() => setShowChat(false)} />
            </motion.div>
          </div>
        )}

        <BottomNav />

      <AnimatePresence mode="wait">
        {currentView === 'home' && (
          <motion.div key="home">
            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 z-0 flex">
                <div className="w-1/3 h-full relative hidden md:block">
                  <img 
                    src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop" 
                    className="w-full h-full object-cover opacity-30 grayscale"
                    alt="Athlete training"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black" />
                </div>
                <div className="w-full md:w-1/3 h-full relative">
                  <img 
                    src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop" 
                    className="w-full h-full object-cover opacity-30 grayscale"
                    alt="Athlete training"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black" />
                </div>
                <div className="w-1/3 h-full relative hidden md:block">
                  <img 
                    src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=800&auto=format&fit=crop" 
                    className="w-full h-full object-cover opacity-30 grayscale"
                    alt="Athlete training"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/50 to-[#b2d8d8]/20" />
              </div>

              <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
                    <Zap className="w-4 h-4 text-accent" />
                    <span className="text-xs font-bold uppercase tracking-widest text-accent">Elite Performance</span>
                  </div>
                  <h1 className="text-5xl md:text-9xl font-black uppercase italic leading-none tracking-tighter mb-6">
                    Unlock Your <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent pr-2 pb-2">Potential</span>
                  </h1>
                  <p className="text-base md:text-2xl text-white/80 max-w-2xl mx-auto mb-10 font-medium px-4">
                    Elite sports performance training designed to build strength, speed, and durability.
                  </p>
                  <div className="flex flex-col md:flex-row gap-4 justify-center px-6">
                    <button className="btn-gold text-base md:text-lg w-full md:w-auto" onClick={() => navigateTo('programCatalog')}>Start Training</button>
                    <button className="btn-outline-accent text-base md:text-lg w-full md:w-auto" onClick={() => navigateTo('programCatalog')}>View Programs</button>
                  </div>
                </motion.div>
              </div>

              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-accent"
              >
                <div className="w-6 h-10 border-2 border-accent rounded-full flex justify-center p-1">
                  <div className="w-1 h-2 bg-accent rounded-full" />
                </div>
              </motion.div>
            </section>

            {/* Programs Section */}
            <section className="py-24 bg-zinc-950 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[var(--color-accent)]/5 to-transparent pointer-events-none" />
              <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                  <div>
                    <h2 className="text-accent font-bold uppercase tracking-[0.2em] text-sm mb-4">Our Expertise</h2>
                    <h3 className="text-4xl md:text-6xl font-black uppercase italic leading-tight">
                      Performance <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent pr-2 pb-2">Programs</span>
                    </h3>
                  </div>
                  <p className="max-w-md text-white/70 text-lg">
                    Science-backed training methodologies adapted for athletes of all levels.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {programs.map((program, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -5 }}
                      onClick={() => handleProgramClick(program.id)}
                      className="group relative bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 cursor-pointer hover:border-accent/30 transition-colors"
                    >
                      <div className="h-40 overflow-hidden">
                        <img 
                          src={program.image} 
                          alt={program.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-60 group-hover:opacity-100"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="p-6">
                        <div className="text-gold group-hover:text-accent transition-colors mb-3 scale-75 origin-left" aria-hidden="true">{program.icon}</div>
                        <h4 className="text-lg font-bold mb-2 uppercase italic">{program.title}</h4>
                        <p className="text-white/70 mb-4 leading-relaxed text-xs line-clamp-2">
                          {program.description}
                        </p>
                        <div className="inline-flex items-center gap-2 text-gold group-hover:text-accent font-bold uppercase text-[10px] tracking-widest group-hover:gap-3 transition-all">
                          Learn More <ChevronRight className="w-3 h-3" aria-hidden="true" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Video Section */}
            <section className="py-24 bg-black relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[var(--color-accent)]/5 to-transparent pointer-events-none" />
              <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                  >
                    <h2 className="text-5xl md:text-7xl font-black uppercase italic leading-none mb-8">
                      Master Every <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent pr-2 pb-2">Movement</span>
                    </h2>
                    <p className="text-xl text-white/70 mb-8 leading-relaxed">
                      Unlock 100+ exercise videos with the KROME Fitness Exercise Library. Get workout ideas you can do at home, the gym, or anywhere—anytime!
                    </p>
                    <a 
                      href="https://www.youtube.com/@kromefitnessexerciselibrar9313/playlists"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-accent inline-flex items-center gap-3"
                      aria-label="Explore KROME Fitness Exercise Library on YouTube"
                    >
                      <PlayCircle className="w-6 h-6" aria-hidden="true" />
                      Explore Library
                    </a>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative aspect-video max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl shadow-accent/10 border border-accent/20"
                  >
                    <iframe 
                      className="w-full h-full"
                      src="https://www.youtube.com/embed/fU599S2F3k4" 
                      title="KROME Sports Performance"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 border-y border-white/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#b2d8d8]/5 to-transparent pointer-events-none" />
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center relative z-10">
                {[
                  { label: "Athletes Trained", value: "500+" },
                  { label: "Exercise Videos", value: "100+" },
                  { label: "Programs", value: "12" },
                  { label: "Success Rate", value: "98%" }
                ].map((stat, idx) => (
                  <div key={idx}>
                    <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent pr-1 pb-1 mb-2">{stat.value}</div>
                    <div className="text-xs uppercase tracking-widest text-white/60 font-bold">{stat.label}</div>
                  </div>
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {currentView === 'programCatalog' && (
          <ProgramCatalog 
            key="programCatalog"
            userId={user?.id || 'guest'}
            isAdmin={user?.role === 'admin'}
            type="all"
            onBack={goBack}
            onSelectProgram={(program, locked) => {
              if (locked && !user) {
                setAuthMode('login');
                navigateTo('auth');
                return;
              }
              if (locked) {
                setSelectedProgram(program);
                navigateTo('productDescription');
                return;
              }
              setSelectedProgramId(program.id);
              navigateTo('programViewer');
            }}
          />
        )}

        {currentView === 'myPrograms' && (
          <ProgramCatalog 
            key="myPrograms"
            userId={user?.id || 'guest'}
            isAdmin={user?.role === 'admin'}
            type="myPrograms"
            onBack={goBack}
            onSelectProgram={(program, locked) => {
              if (locked && !user) {
                setAuthMode('login');
                navigateTo('auth');
                return;
              }
              if (locked) {
                setSelectedProgram(program);
                navigateTo('productDescription');
                return;
              }
              setSelectedProgramId(program.id);
              navigateTo('programViewer');
            }}
          />
        )}

        {currentView === 'breakPrograms' && (
          <ProgramCatalog 
            key="breakPrograms"
            userId={user?.id || 'guest'}
            isAdmin={user?.role === 'admin'}
            type="breaks"
            onBack={goBack}
            onSelectProgram={(program, locked) => {
              if (locked && !user) {
                setAuthMode('login');
                navigateTo('auth');
                return;
              }
              if (locked) {
                setSelectedProgram(program);
                navigateTo('productDescription');
                return;
              }
              setSelectedProgramId(program.id);
              navigateTo('programViewer');
            }}
          />
        )}

        {currentView === 'movementPrograms' && (
          <ProgramCatalog 
            key="movementPrograms"
            userId={user?.id || 'guest'}
            isAdmin={user?.role === 'admin'}
            type="movement"
            onBack={goBack}
            onSelectProgram={(program, locked) => {
              if (locked && !user) {
                setAuthMode('login');
                navigateTo('auth');
                return;
              }
              if (locked) {
                setSelectedProgram(program);
                navigateTo('productDescription');
                return;
              }
              setSelectedProgramId(program.id);
              navigateTo('programViewer');
            }}
          />
        )}

        {currentView === 'programIntro' && (
          <ProgramIntro 
            key="programIntro" 
            onBack={goBack} 
            onSelectPhase={(num) => {
              if (num <= 5) {
                setSelectedProgramId('soccer-52-week');
                setSelectedPhaseIdx(num - 1);
                navigateTo('programViewer');
              } else if (num === 6) {
                setSpecializedType('speed');
                navigateTo('specialized');
              } else if (num === 7) {
                setSpecializedType('movement');
                navigateTo('specialized');
              } else if (num === 8) {
                setSpecializedType('nutrition');
                navigateTo('specialized');
              }
            }}
          />
        )}

        {currentView === 'movementLanding' && (
          <MovementLanding 
            key="movementLanding"
            onBack={goBack}
            onStartProgram={() => {
              navigateTo('movementPrograms');
            }}
          />
        )}

        {currentView === 'nutritionLanding' && (
          <NutritionLanding 
            key="nutritionLanding"
            onBack={goBack}
            onStartProgram={() => {
              setSpecializedType('nutrition');
              navigateTo('specialized');
            }}
          />
        )}

        {currentView === 'breakProgramsLanding' && (
          <BreakProgramsLanding 
            key="breakProgramsLanding"
            onBack={goBack}
            onStartProgram={() => {
              navigateTo('breakPrograms');
            }}
          />
        )}

        {currentView === 'specializedLanding' && (
          <SpecializedTrainingLanding 
            key="specializedLanding"
            onBack={goBack}
            onNavigate={(view) => {
              navigateTo(view as View);
            }}
          />
        )}

        {currentView === 'specialized' && (
          <SpecializedProgram 
            key={`specialized-${specializedType}`}
            type={specializedType} 
            onBack={goBack} 
            onNavigate={(view) => navigateTo(view as View)}
          />
        )}

        {currentView === 'fitnessGoal' && user && (
          <FitnessGoalOnboarding 
            user={user}
            onComplete={(goal) => {
              const updatedUser = { ...user, fitness_goal: goal };
              setUser(updatedUser);
              safeStorage.setItem('krome_user', JSON.stringify(updatedUser));
              if (updatedUser.parq_completed === 0) {
                resetToView('profile');
              } else {
                resetToView('home');
              }
            }}
          />
        )}

        {currentView === 'onboarding' && user && (
          <OnboardingFlow 
            user={user}
            onComplete={() => {
              // Refresh user data to get updated fitness_goal and parq_completed
              fetch(`/api/users/${user.id}`)
                .then(res => res.json())
                .then(updatedUser => {
                  setUser(updatedUser);
                  safeStorage.setItem('krome_user', JSON.stringify(updatedUser));
                  resetToView('home');
                })
                .catch(err => {
                  console.error('Failed to refresh user after onboarding:', err);
                  // Fallback: just update local state if fetch fails
                  const finalUser = { ...user, fitness_goal: user.fitness_goal || 'General Fitness', parq_completed: 1 };
                  setUser(finalUser);
                  safeStorage.setItem('krome_user', JSON.stringify(finalUser));
                  resetToView('home');
                });
            }}
          />
        )}

        {currentView === 'auth' && (
          <Auth 
            key="auth" 
            initialMode={authMode}
            onBack={goBack} 
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {currentView === 'profile' && user && (
          <Profile 
            key="profile" 
            user={user} 
            onLogout={handleLogout}
            onBack={goBack}
            onUpdate={(updated) => {
              setUser(updated);
              safeStorage.setItem('krome_user', JSON.stringify(updated));
            }}
            onDelete={handleLogout}
            onNavigate={(view) => navigateTo(view as View)}
            onProgramSelect={(programId) => {
              setSelectedProgramId(programId);
              navigateTo('programViewer');
            }}
            initialTab={user.parq_completed === 0 ? 'parq' : 'workouts'}
          />
        )}

        {currentView === 'workoutTracker' && user && (
          <div className="pt-24 px-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <button 
                onClick={() => navigateTo('profile')}
                className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest hover:gap-4 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Profile
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-500 font-bold uppercase text-xs tracking-widest hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
            <WorkoutTracker 
              userId={user.id.toString()} 
            />
          </div>
        )}

        {currentView === 'fitnessOverview' && user && (
          <div className="pt-24 px-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <button 
                onClick={() => navigateTo('profile')}
                className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest hover:gap-4 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Profile
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-500 font-bold uppercase text-xs tracking-widest hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
            <FitnessOverview 
              userId={user.id.toString()} 
            />
          </div>
        )}

        {currentView === 'progressTracker' && user && (
          <div className="pt-24 px-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <button 
                onClick={goBack}
                className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest hover:gap-4 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-500 font-bold uppercase text-xs tracking-widest hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
            <ProgressTracker 
              userId={user.id.toString()} 
            />
          </div>
        )}

        {currentView === 'nutritionDashboard' && user && (
          <div className="pt-24 px-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <button 
                onClick={goBack}
                className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest hover:gap-4 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-500 font-bold uppercase text-xs tracking-widest hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
            <NutritionDashboard 
              user={targetUserId ? { ...user, id: targetUserId } : user} 
              onBack={goBack} 
              onLogout={handleLogout}
            />
          </div>
        )}

        {currentView === 'bodyComposition' && user && (
          <div className="pt-24 px-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <button 
                onClick={goBack}
                className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest hover:gap-4 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-500 font-bold uppercase text-xs tracking-widest hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
            <BodyCompositionTracker 
              userId={user.id.toString()} 
              onBack={goBack} 
            />
          </div>
        )}

        {currentView === 'bodyMetrics' && user && (
          <div className="pt-24 px-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <button 
                onClick={goBack}
                className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest hover:gap-4 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-500 font-bold uppercase text-xs tracking-widest hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
            <BodyMetrics 
              userId={user.id.toString()} 
              data={bodyMetricsData} 
              setData={setBodyMetricsData} 
            />
          </div>
        )}

        {currentView === 'videoAnalysis' && user && (
          <div className="pt-24 px-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <button 
                onClick={goBack}
                className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest hover:gap-4 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-500 font-bold uppercase text-xs tracking-widest hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
            <VideoAnalyzer 
              userId={user.id.toString()} 
            />
          </div>
        )}

        {currentView === 'parq' && user && (
          <div className="pt-24 px-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <button 
                onClick={goBack}
                className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest hover:gap-4 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-500 font-bold uppercase text-xs tracking-widest hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
            <PARQ 
              userId={user.id.toString()} 
              initialReadOnly={user.parq_completed === 1}
              onComplete={() => {
                const updatedUser = { ...user, parq_completed: 1 };
                setUser(updatedUser);
                safeStorage.setItem('krome_user', JSON.stringify(updatedUser));
                goBack();
              }}
            />
          </div>
        )}

        {currentView === 'programCalendar' && user && (
          <div className="pt-24 px-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <button 
                onClick={goBack}
                className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest hover:gap-4 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-500 font-bold uppercase text-xs tracking-widest hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
            <ProgramCalendar 
              userId={user.id.toString()} 
              programId={selectedProgramId || ''} 
              programData={selectedProgram}
            />
          </div>
        )}

        {currentView === 'accountSettings' && user && (
          <div className="pt-24 px-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <button 
                onClick={goBack}
                className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest hover:gap-4 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-500 font-bold uppercase text-xs tracking-widest hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
            <AccountSettings 
              user={user} 
              onUpdate={(updated) => {
                setUser(updated);
                safeStorage.setItem('krome_user', JSON.stringify(updated));
              }}
              onDelete={handleLogout}
              onBack={goBack}
              onLogout={handleLogout}
            />
          </div>
        )}

        {currentView === 'admin' && user?.role === 'admin' && (
          <AdminDashboard 
            key="admin"
            adminId={user.id}
            user={user}
            onBack={goBack}
            onNavigate={(view, targetId) => navigateTo(view as View, targetId)}
            initialTab={adminInitialTab}
            unreadSenderIds={unreadSenderIds}
          />
        )}

        {currentView === 'shop' && (
          <Shop 
            key={`shop-${shopCategory}`} 
            onBack={goBack} 
            userId={user?.id || ''} 
            onRedirectToLogin={() => {
              setAuthMode('login');
              navigateTo('auth');
            }}
            initialCategory={shopCategory} 
          />
        )}

        {currentView === 'contact' && (
          <Contact 
            onBack={goBack} 
            onNavigateToRegister={() => { setAuthMode('register'); navigateTo('auth'); }}
            user={user}
          />
        )}

        {currentView === 'flexibilityMobility' && (
          user ? (
            <FlexibilityMobility 
              key="flexibilityMobility"
              onBack={goBack}
              onStartProgram={() => {
                const program = ALL_PROGRAMS.find(p => p.id === 'lower-back-rehab');
                const isPurchased = purchasedPrograms.includes(program?.name || '');
                const isAdmin = user?.role === 'admin';

                if (!isPurchased && !isAdmin) {
                  setSelectedProgram(program);
                  navigateTo('productDescription');
                  return;
                }
                
                setSelectedProgramId('lower-back-rehab');
                setSelectedPhaseIdx(0);
                navigateTo('programViewer');
              }}
            />
          ) : (
            <Auth key="auth" initialMode="login" onBack={() => navigateTo('home')} onLoginSuccess={handleLoginSuccess} />
          )
        )}

        {currentView === 'strengthPower' && (
          user ? (
            <StrengthPower 
              key="strengthPower"
              onBack={goBack}
              onStartProgram={() => {
                const program = ALL_PROGRAMS.find(p => p.id === 'strength-power');
                const isPurchased = purchasedPrograms.includes(program?.name || '');
                const isAdmin = user?.role === 'admin';
                
                if (!isPurchased && !isAdmin) {
                  setSelectedProgram(program);
                  setCurrentView('productDescription');
                  return;
                }
                
                setSelectedProgramId('strength-power');
                setSelectedPhaseIdx(0);
                setCurrentView('programViewer');
              }}
            />
          ) : (
            <Auth key="auth" initialMode="login" onBack={() => setCurrentView('home')} onLoginSuccess={handleLoginSuccess} />
          )
        )}

        {currentView === 'conditioningSpeed' && (
          user ? (
            <ConditioningSpeed 
              key="conditioningSpeed"
              onBack={goBack}
              onStartProgram={() => {
                const program = ALL_PROGRAMS.find(p => p.id === 'speed-agility');
                const isPurchased = purchasedPrograms.includes(program?.name || '');
                const isAdmin = user?.role === 'admin';

                if (!isPurchased && !isAdmin) {
                  setSelectedProgram(program);
                  setCurrentView('productDescription');
                  return;
                }

                setSelectedProgramId('speed-agility');
                setSelectedPhaseIdx(0);
                setCurrentView('programViewer');
              }}
            />
          ) : (
            <Auth key="auth" initialMode="login" onBack={() => setCurrentView('home')} onLoginSuccess={handleLoginSuccess} />
          )
        )}

        {currentView === 'aerobicCapacityFoundation' && (
          user ? (
            (() => {
              const program = ALL_PROGRAMS.find(p => p.id === 'aerobic-capacity');
              const isPurchased = purchasedPrograms.includes(program?.name || '');
              const isAdmin = user?.role === 'admin';

              if (!isPurchased && !isAdmin) {
                return (
                  <div className="pt-24 px-6 max-w-7xl mx-auto">
                    <button 
                      onClick={() => setCurrentView('home')}
                      className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest mb-12 hover:gap-4 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-12 text-center backdrop-blur-xl">
                      <Lock className="w-16 h-16 text-gold mx-auto mb-6" />
                      <h2 className="text-3xl font-black uppercase italic mb-4">Program Locked</h2>
                      <p className="text-white/60 mb-8 max-w-md mx-auto">
                        You need to purchase the Aerobic Capacity Foundation program to access this content.
                      </p>
                      <button 
                        onClick={() => {
                          setSelectedProgram(program);
                          setCurrentView('productDescription');
                        }}
                        className="btn-accent px-8 py-4"
                      >
                        View Purchase Options
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <AerobicCapacityFoundation 
                  key="aerobicCapacityFoundation"
                  onBack={goBack}
                  userId={user.id.toString()}
                />
              );
            })()
          ) : (
            <Auth key="auth" initialMode="login" onBack={goBack} onLoginSuccess={handleLoginSuccess} />
          )
        )}

        {currentView === 'performanceMacroNutrients' && (
          user ? (
            <PerformanceMacroNutrients 
              key="performanceMacroNutrients"
              userId={targetUserId || user.id.toString()}
              onBack={goBack}
            />
          ) : (
            <Auth key="auth" initialMode="login" onBack={goBack} onLoginSuccess={handleLoginSuccess} />
          )
        )}

        {currentView === 'micronutrientOptimization' && (
          user ? (
            <MicronutrientOptimization 
              key="micronutrientOptimization"
              onBack={goBack}
            />
          ) : (
            <Auth key="auth" initialMode="login" onBack={goBack} onLoginSuccess={handleLoginSuccess} />
          )
        )}

        {currentView === 'recipeLibrary' && (
          user ? (
            <RecipeLibrary 
              key="recipeLibrary"
              userId={user.id.toString()}
              onBack={goBack}
            />
          ) : (
            <Auth key="auth" initialMode="login" onBack={goBack} onLoginSuccess={handleLoginSuccess} />
          )
        )}

        {currentView === 'programBuilder' && user && (
          <div className="pt-24 px-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <button 
                onClick={goBack}
                className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest hover:gap-4 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-500 font-bold uppercase text-xs tracking-widest hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
            <ProgramBuilder 
              key={selectedProgram?.id || 'programBuilder'}
              userId={user.id.toString()}
              initialProgram={selectedProgram}
              initialPhaseIdx={selectedPhaseIdx}
              isCustom={isCustomProgram}
              onSave={() => {
                setSelectedProgram(undefined);
                setIsCustomProgram(false);
                setCurrentView('programViewer');
              }}
            />
          </div>
        )}

        {currentView === 'productDescription' && selectedProgram && (
          <ProductDescription
            key="productDescription"
            program={selectedProgram}
            onBack={goBack}
            onPurchase={async () => {
              if (!user) {
                setAuthMode('login');
                setCurrentView('auth');
                return;
              }
              try {
                const response = await fetch('/api/create-checkout-session', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId: user?.id,
                    itemName: selectedProgram.name,
                    price: programPrices[selectedProgram.id] || 0,
                    programId: selectedProgram.id
                  })
                });
                const data = await response.json();
                if (data.url) {
                  window.location.href = data.url;
                } else {
                  alert('Failed to initiate purchase.');
                }
              } catch (err) {
                console.error('Purchase error:', err);
                alert('Purchase error.');
              }
            }}
          />
        )}

        {currentView === 'programViewer' && (
          user ? (
            <div className="pt-24 px-6 max-w-7xl mx-auto">
              <ProgramViewer 
                key="programViewer"
                userId={user.id.toString()}
                isAdmin={user?.role === 'admin'}
                initialProgramId={selectedProgramId}
                initialPhaseIdx={selectedPhaseIdx}
                onBack={goBack}
                onSelectLockedProgram={(program) => {
                  setSelectedProgram(program);
                  setCurrentView('productDescription');
                }}
                onEdit={(program, isCustom) => {
                  setSelectedProgram(program);
                  setIsCustomProgram(isCustom);
                  setCurrentView('programBuilder');
                }}
                onCreateNew={() => {
                  setSelectedProgram(undefined);
                  setIsCustomProgram(true);
                  setCurrentView('programBuilder');
                }}
                onDelete={async (programId) => {
                  if (confirm('Are you sure you want to delete this custom program?')) {
                    try {
                      await fetch(`/api/custom-programs/${user.id}/${programId}`, { method: 'DELETE' });
                      // Refresh the view to update the list
                      resetToView('home');
                      setTimeout(() => setCurrentView('programViewer'), 100);
                    } catch (err) {
                      console.error('Failed to delete program', err);
                    }
                  }
                }}
              />
            </div>
          ) : (
            <Auth key="auth" initialMode="login" onBack={goBack} onLoginSuccess={handleLoginSuccess} />
          )
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer role="contentinfo" className="py-20 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
            <div className="max-w-sm">
              <div 
                className="flex items-center gap-2 mb-6 cursor-pointer" 
                onClick={() => setCurrentView('home')}
                role="button"
                aria-label="KROME Sports Home"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigateTo('home'); }}
              >
                <img src="https://storage.googleapis.com/kspimage/KLogo.jpg" alt="KROME Sports Logo" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                <span className="text-lg font-black tracking-tighter uppercase italic">
                  KROME <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent pr-1 pb-1">Sports</span>
                </span>
              </div>
              <p className="text-white/60 leading-relaxed mb-8">
                The ultimate destination for sports performance training, mobility, and strength development.
              </p>
              <div className="flex gap-4">
                <a href="https://instagram.com/ksp_2407" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-gold hover:text-black transition-all krome-outline">
                  <Instagram className="w-5 h-5" aria-hidden="true" />
                </a>
                <a href="https://youtube.com/@kromesports" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-gold hover:text-black transition-all krome-outline">
                  <Youtube className="w-5 h-5" aria-hidden="true" />
                </a>
                <a href="https://facebook.com/kromesports" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-gold hover:text-black transition-all krome-outline">
                  <Facebook className="w-5 h-5" aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-16">
              <div>
                <h5 className="font-bold uppercase tracking-widest text-xs text-white/60 mb-6">Quick Links</h5>
                <ul className="flex flex-row gap-6 text-sm font-medium">
                  <li><a href="#" onClick={() => navigateTo('home')} className="hover:text-accent transition-colors">About Us</a></li>
                  <li><a href="#" onClick={() => navigateTo('programCatalog')} className="hover:text-accent transition-colors">Programs</a></li>
                  <li><a href="#" onClick={() => { setShopCategory('all'); navigateTo('shop'); }} className="hover:text-accent transition-colors">Shop</a></li>
                  <li><a href="#" onClick={() => navigateTo('contact')} className="hover:text-accent transition-colors">Contact</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <p>&copy; 2024 KROME Sports Performance.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <a href="#" className="hover:text-white transition-colors">Cookies</a>
              </div>
            </div>
            <p className="text-accent/60">Designed by SwoleCode Small Business Solutions</p>
          </div>
        </div>
      </footer>
      {/* Chatbot */}
      <Chatbot user={user} />
      <InstallPrompt />
    </div>
      </ErrorBoundary>
    </NotificationProvider>
  );
}

