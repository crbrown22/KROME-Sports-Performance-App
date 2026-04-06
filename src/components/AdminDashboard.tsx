import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { safeStorage } from '../utils/storage';
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrentDate } from '../utils/date';
import { 
  Users, 
  User,
  Shield, 
  Edit3,
  ChevronLeft, 
  Search,
  UserPlus,
  MoreVertical,
  ShieldCheck,
  ShieldAlert,
  Activity,
  X,
  TrendingUp,
  Apple,
  ChevronRight,
  Calendar,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Dumbbell,
  ShoppingBag,
  LineChart,
  MessageSquare,
  Bell,
  Star,
  Camera,
  History,
  Video,
  Zap,
  Settings,
  Image as ImageIcon,
  Check
} from "lucide-react";
import ProgressTracker from "./ProgressTracker";
import BodyMetrics from "./BodyMetrics";
import PARQ from "./PARQ";
import WorkoutTracker from "./WorkoutTracker";
import BodyCompositionTracker from "./BodyCompositionTracker";
import FitnessOverview from "./FitnessOverview";
import SupplementsAndVitamins from "./SupplementsAndVitamins";
import PurchaseCRM from "./PurchaseCRM";
import SalesAndGrowthCRM, { calculateKPIs } from "./SalesAndGrowthCRM";
import ProgramBuilder from "./ProgramBuilder";
import ProgramViewer from "./ProgramViewer";
import { LoggedFood } from "../data/nutritionData";
import { calculateNutritionRecommendations } from "../utils/nutrition";
import { getSupplementRecommendation, generateDefaultSupplements } from "../utils/supplements";
import { BodyMetricsData, INITIAL_DATA } from "../types";
import { haptics } from "../utils/nativeBridge";
import { FullProgramTemplate } from "../data/workoutTemplates";
import AdminAssistant from "./AdminAssistant";
import VideoAnalyzer from "./VideoAnalyzer";
import AthleteSettings from "./AthleteSettings";
import AITools from "./AITools";
import AdminMessageDashboard from "./AdminMessageDashboard";
import FeedbackViewer from "./FeedbackViewer";
import BrandAssets from "./BrandAssets";

interface UserRecord {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  firstName?: string;
  lastName?: string;
  avatar_url?: string;
  fitness_goal?: string;
  role: 'athlete' | 'coach' | 'admin';
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
}

interface AdminDashboardProps {
  key?: string;
  adminId?: number;
  user: any;
  onBack: () => void;
  onNavigate?: (view: string, targetUserId?: string) => void;
  initialTab?: 'progress' | 'metrics' | 'parq' | 'nutrition' | 'workouts' | 'composition' | 'overview' | 'activity' | 'programs' | 'builder' | 'library' | 'video' | 'settings' | 'ai-tools' | 'chat' | 'feedback' | 'brand' | 'system';
  unreadSenderIds?: Set<number>;
}

export default function AdminDashboard({ onBack, onNavigate, initialTab, adminId, user, unreadSenderIds = new Set() }: AdminDashboardProps) {
  const finalAdminId = adminId || 1;
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(() => {
    return safeStorage.getItem('krome_admin_search_term') || "";
  });
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(() => {
    try {
      const saved = safeStorage.getItem('krome_admin_selected_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse saved admin user", e);
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState<'menu' | 'progress' | 'metrics' | 'parq' | 'nutrition' | 'workouts' | 'composition' | 'overview' | 'activity' | 'programs' | 'builder' | 'library' | 'video' | 'settings' | 'ai-tools' | 'chat' | 'feedback' | 'brand' | 'system' | 'assign-program' | 'assign-workout'>(() => {
    const saved = safeStorage.getItem('krome_admin_active_tab');
    if (window.innerWidth < 1024) return 'menu';
    return initialTab || (saved as any) || 'workouts';
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [topLevelTab, setTopLevelTab] = useState<'users' | 'purchases' | 'sales' | 'chat' | 'feedback' | 'brand' | 'system'>(() => {
    const saved = safeStorage.getItem('krome_admin_top_level_tab');
    if (initialTab === 'chat') return 'chat';
    if (initialTab === 'feedback') return 'feedback';
    if (initialTab === 'brand') return 'brand';
    if (initialTab === 'system') return 'system';
    return (saved as any) || 'sales';
  });

  useEffect(() => {
    safeStorage.setItem('krome_admin_top_level_tab', topLevelTab);
  }, [topLevelTab]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      if (initialTab === 'chat') {
        setTopLevelTab('chat');
      } else if (initialTab === 'feedback') {
        setTopLevelTab('feedback');
      }
    }
  }, [initialTab]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [bodyMetricsData, setBodyMetricsData] = useState<BodyMetricsData>(INITIAL_DATA);
  const [nutritionLogs, setNutritionLogs] = useState<LoggedFood[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'action'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredAndSortedLogs = activityLogs
    .filter(log => activityFilter === 'all' || log.action === activityFilter)
    .sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        return sortOrder === 'asc' ? a.action.localeCompare(b.action) : b.action.localeCompare(a.action);
      }
    });
  const [isEditingNutrition, setIsEditingNutrition] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const saved = safeStorage.getItem('krome_admin_selected_date');
    if (saved) return saved;
    return getCurrentDate();
  });
  const [userToDelete, setUserToDelete] = useState<UserRecord | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'athlete' as 'athlete' | 'coach' | 'admin'
  });
  const [selectedProgram, setSelectedProgram] = useState<FullProgramTemplate | undefined>(undefined);
  const [isCustomProgram, setIsCustomProgram] = useState(false);
  const [isGlobalTemplate, setIsGlobalTemplate] = useState(false);
  const [globalTemplates, setGlobalTemplates] = useState<any[]>([]);
  const [assignedPrograms, setAssignedPrograms] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editFormData, setEditFormData] = useState({ 
    first_name: '', 
    last_name: '', 
    email: '', 
    role: 'athlete' as 'athlete' | 'coach' | 'admin',
    status: 'active' as 'active' | 'inactive' | 'pending'
  });

  useEffect(() => {
    if (editingUser) {
      setEditFormData({ 
        first_name: editingUser.first_name || editingUser.firstName || '', 
        last_name: editingUser.last_name || editingUser.lastName || '', 
        email: editingUser.email,
        role: editingUser.role,
        status: editingUser.status || 'active'
      });
    }
  }, [editingUser]);

  const saveUserChanges = async () => {
    if (!editingUser) return;
    try {
      await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      showError("Failed to update user");
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addFormData)
      });
      if (res.ok) {
        setShowAddUserModal(false);
        setAddFormData({
          username: '',
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          role: 'athlete'
        });
        fetchUsers();
      } else {
        const data = await res.json();
        showError(data.error || "Failed to create user");
      }
    } catch (err) {
      showError("Network error creating user");
    }
  };

  useEffect(() => {
    const loadActivityLogs = async () => {
      if (!selectedUser) return;
      
      const cached = safeStorage.getItem(`krome_admin_activity_${selectedUser.id}`);
      if (cached) setActivityLogs(JSON.parse(cached));

      try {
        const response = await fetch(`/api/activity/${selectedUser?.id}`);
        if (response.ok) {
          const data = await response.json();
          setActivityLogs(data);
          safeStorage.setItem(`krome_admin_activity_${selectedUser.id}`, JSON.stringify(data));
        } else {
          showError("Failed to load activity logs");
        }
      } catch (error) {
        showError("Failed to load activity logs");
      }
    };

    if (selectedUser) {
      loadActivityLogs();
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Fetched users:", data);
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        showError("API returned non-array data");
        setUsers([]);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      showError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch('/api/program-templates');
        if (res.ok) {
          const data = await res.json();
          setGlobalTemplates(data);
        }
      } catch (err) {
        console.error("Failed to fetch templates", err);
      }
    };
    fetchTemplates();
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchAssigned = async () => {
      if (!selectedUser) return;
      try {
        const res = await fetch(`/api/assigned-programs/${selectedUser.id}`);
        if (res.ok) {
          const data = await res.json();
          setAssignedPrograms(data);
        }
      } catch (err) {
        console.error("Failed to fetch assigned programs", err);
      }
    };
    fetchAssigned();
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUser) {
      safeStorage.setItem('krome_admin_selected_user', JSON.stringify(selectedUser));
    } else {
      safeStorage.removeItem('krome_admin_selected_user');
    }
  }, [selectedUser]);

  useEffect(() => {
    safeStorage.setItem('krome_admin_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    safeStorage.setItem('krome_admin_selected_date', selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    safeStorage.setItem('krome_admin_search_term', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    const loadNutrition = async () => {
      if (!selectedUser) return;
      
      const cached = safeStorage.getItem(`krome_admin_nutrition_${selectedUser.id}`);
      if (cached) setNutritionLogs(JSON.parse(cached));

      try {
        const response = await fetch(`/api/nutrition/${selectedUser?.id}`);
        if (response.ok) {
          const data = await response.json();
          const formattedLogs: LoggedFood[] = data.map((item: any) => ({
            id: item.food_id,
            logId: item.log_id,
            name: item.name,
            category: item.category,
            meal: item.meal,
            date: item.date,
            servings: item.servings,
            serving: {
              size: item.serving_size,
              calories: item.calories,
              protein: item.protein,
              carbs: item.carbs,
              fat: item.fat
            },
            per100g: { calories: 0, protein: 0, carbs: 0, fat: 0 }
          }));
          setNutritionLogs(formattedLogs);
          safeStorage.setItem(`krome_admin_nutrition_${selectedUser.id}`, JSON.stringify(formattedLogs));
        } else {
          showError("Failed to load nutrition logs");
        }
      } catch (error) {
        showError("Failed to load nutrition logs");
      }
    };

    if (selectedUser) {
      loadNutrition();
    }
  }, [selectedUser]);

  useEffect(() => {
    const loadMetrics = async () => {
      if (!selectedUser) return;
      
      const cached = safeStorage.getItem(`krome_admin_metrics_${selectedUser.id}`);
      if (cached) setBodyMetricsData(JSON.parse(cached));

      try {
        const res = await fetch(`/api/metrics/${selectedUser?.id}`);
        if (res.ok) {
          const dbData = await res.json();
          if (dbData) {
            setBodyMetricsData(dbData);
            safeStorage.setItem(`krome_admin_metrics_${selectedUser.id}`, JSON.stringify(dbData));
          }
        } else {
          showError("Failed to load metrics");
        }
      } catch (err) {
        showError("Failed to load metrics");
      }
    };

    if (selectedUser) {
      loadMetrics();
    }
  }, [selectedUser]);

  const getTodayStr = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const changeDate = (days: number) => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day + days);
    setSelectedDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
  };

  const displayDate = () => {
    const todayStr = getTodayStr();
    if (selectedDate === todayStr) return "Today";
    
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  const today = getTodayStr();
  const selectedDateLogs = nutritionLogs.filter(log => (log.date || today) === selectedDate);
  
  const nutritionTotals = selectedDateLogs.reduce((acc, item) => {
    return {
      calories: acc.calories + (Number(item.serving.calories) * Number(item.servings)),
      protein: acc.protein + (Number(item.serving.protein) * Number(item.servings)),
      carbs: acc.carbs + (Number(item.serving.carbs) * Number(item.servings)),
      fat: acc.fat + (Number(item.serving.fat) * Number(item.servings)),
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const recommendations = bodyMetricsData.recommendations || calculateNutritionRecommendations(bodyMetricsData);
  const targets = {
    calories: Number(recommendations.totalCalories),
    protein: Number(recommendations.proteinGrams),
    carbs: Number(recommendations.carbsGrams),
    fat: Number(recommendations.fatGrams)
  };

  const getProgressState = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage > 110) return "over";
    if (percentage >= 90) return "good";
    if (percentage >= 50) return "warning";
    return "under";
  };

  const getCardColor = (current: number, target: number) => {
    const state = getProgressState(current, target);
    if (state === 'over') return "border-red-500 bg-red-500/10 text-red-500";
    if (state === 'good') return "border-green-500 bg-green-500/10 text-green-500";
    if (state === 'warning') return "border-yellow-500 bg-yellow-500/10 text-yellow-500";
    return "border-white/5 bg-black/40 text-white";
  };

  const getBarColor = (current: number, target: number, defaultColor: string) => {
    const state = getProgressState(current, target);
    if (state === 'over') return "bg-red-500";
    if (state === 'good') return "bg-green-500";
    if (state === 'warning') return "bg-yellow-500";
    return defaultColor;
  };

  const toggleRole = async (id: number, currentRole: string) => {
    const roles: ('athlete' | 'coach' | 'admin')[] = ['athlete', 'coach', 'admin'];
    const currentIndex = roles.indexOf(currentRole as any);
    const newRole = roles[(currentIndex + 1) % roles.length];
    
    try {
      await fetch(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole, adminId: user.id })
      });
      fetchUsers();
    } catch (err) {
      showError("Failed to update role");
    }
  };

  const deleteUser = async (user: UserRecord) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await fetch(`/api/admin/users/${userToDelete.id}?adminId=${user.id}`, { method: 'DELETE' });
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      showError("Failed to delete user");
    }
  };

  const sendTestNotification = async (userId: number) => {
    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        // Show success
      } else {
        showError("Failed to send test notification. User might not be subscribed.");
      }
    } catch (err) {
      showError("Network error sending test notification");
    }
  };

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');

  const filteredUsers = users.filter(u => {
    const search = (searchTerm || '').toLowerCase();
    const matchesSearch = (u.username?.toLowerCase() || '').includes(search) ||
                          (u.email?.toLowerCase() || '').includes(search);
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const [error, setError] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [purchasesRes, leadsRes] = await Promise.all([
          fetch('/api/admin/purchases'),
          fetch('/api/leads')
        ]);
        
        if (purchasesRes.ok) {
          const purchasesData = await purchasesRes.json();
          if (Array.isArray(purchasesData)) setPurchases(purchasesData);
        }
        
        if (leadsRes.ok) {
          const leadsData = await leadsRes.json();
          if (Array.isArray(leadsData)) setLeads(leadsData);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      }
    };
    
    fetchData();
  }, []);

  const kpiData = calculateKPIs(users, purchases, leads);

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pb-24 bg-black px-6"
      style={{ paddingTop: 'calc(100px + var(--safe-area-top))' }}
    >
      {error && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg font-bold text-sm uppercase tracking-widest">
          {error}
        </div>
      )}
      <div className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 px-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest hover:gap-4 transition-all !outline-none"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl gold-gradient p-0.5">
                <div className="w-full h-full bg-zinc-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-8 h-8 text-gold/20" />
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black uppercase italic tracking-tighter">
                  {user?.first_name} {user?.last_name}
                </h1>
                <p className="text-xs font-bold uppercase tracking-widest text-gold">{user?.role === 'admin' ? 'Admin Dashboard' : 'Coach Dashboard'}</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            {topLevelTab === 'users' && !selectedUser && (
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" aria-hidden="true" />
                  <input 
                    type="text" 
                    placeholder="Search athletes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:border-gold outline-none transition-colors"
                    aria-label="Search athletes"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-zinc-900 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-gold outline-none transition-colors"
                  aria-label="Filter by status"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="bg-gold text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4" /> Add User
                </button>
                <button
                  onClick={() => {
                    setSelectedProgram(undefined);
                    setIsCustomProgram(false);
                    setIsGlobalTemplate(true);
                    setActiveTab('builder');
                  }}
                  className="bg-emerald-500 text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Dumbbell className="w-4 h-4" /> Create Program
                </button>
              </div>
            )}
          </div>
        </div>

        {!selectedUser && (
          <Tabs value={topLevelTab} onValueChange={(v) => setTopLevelTab(v as any)} className="mb-8">
            <TabsList className="bg-zinc-900 border border-white/10 p-1 h-auto flex flex-wrap gap-2">
              <TabsTrigger value="users" className="data-[state=active]:bg-gold data-[state=active]:text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2">
                <Users className="w-4 h-4" /> Athletes
              </TabsTrigger>
              <TabsTrigger value="purchases" className="data-[state=active]:bg-gold data-[state=active]:text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Purchase CRM
              </TabsTrigger>
              <TabsTrigger value="sales" className="data-[state=active]:bg-gold data-[state=active]:text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2">
                <LineChart className="w-4 h-4" /> Sales & Growth
              </TabsTrigger>
              <TabsTrigger value="chat" className="data-[state=active]:bg-gold data-[state=active]:text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Chat
              </TabsTrigger>
              <TabsTrigger value="feedback" className="data-[state=active]:bg-gold data-[state=active]:text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2">
                <Star className="w-4 h-4" /> Feedback
              </TabsTrigger>
              <TabsTrigger value="brand" className="data-[state=active]:bg-gold data-[state=active]:text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Brand
              </TabsTrigger>
              <TabsTrigger value="system" className="data-[state=active]:bg-gold data-[state=active]:text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2">
                <Settings className="w-4 h-4" /> System
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {topLevelTab === 'brand' && !selectedUser ? (
          <BrandAssets onBack={() => setTopLevelTab('sales')} />
        ) : topLevelTab === 'purchases' && !selectedUser ? (
          <PurchaseCRM />
        ) : topLevelTab === 'sales' && !selectedUser ? (
          <SalesAndGrowthCRM />
        ) : topLevelTab === 'chat' && !selectedUser ? (
          <AdminMessageDashboard adminId={finalAdminId.toString()} />
        ) : topLevelTab === 'feedback' && !selectedUser ? (
          <FeedbackViewer />
        ) : topLevelTab === 'system' && !selectedUser ? (
          <div className="space-y-8">
            <div className="bg-zinc-900/50 border border-white/10 rounded-[40px] p-10 backdrop-blur-xl shadow-2xl">
              <h2 className="text-3xl font-black uppercase italic mb-2 flex items-center gap-3">
                <Settings className="w-8 h-8 text-gold" />
                System <span className="text-gold">Settings</span>
              </h2>
              <p className="text-white/40 mb-10 text-sm">Manage system-wide configurations and test integrations.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-black/40 rounded-3xl border border-white/5 hover:border-gold/20 transition-all group">
                  <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold mb-6 group-hover:scale-110 transition-transform">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold uppercase italic mb-2">Email Integration</h3>
                  <p className="text-xs text-white/40 mb-6 leading-relaxed">Verify that your SMTP settings are correctly configured by sending a test email to kromefitness@gmail.com.</p>
                  <button 
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/admin/test-smtp', { method: 'POST' });
                        const data = await res.json();
                        if (res.ok) {
                          alert(data.message);
                        } else {
                          alert("Error: " + data.error);
                        }
                      } catch (err) {
                        alert("Network error testing SMTP");
                      }
                    }}
                    className="w-full py-3 bg-white/5 hover:bg-gold hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Test SMTP Settings
                  </button>
                </div>

                <div className="p-8 bg-black/40 rounded-3xl border border-white/5 hover:border-gold/20 transition-all group">
                  <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold mb-6 group-hover:scale-110 transition-transform">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold uppercase italic mb-2">Registration Test</h3>
                  <p className="text-xs text-white/40 mb-6 leading-relaxed">Simulate a new athlete registration to verify that both welcome and admin notification emails are sent.</p>
                  <button 
                    onClick={async () => {
                      const testEmail = prompt("Enter a test email address to receive the welcome email:", "test-athlete@example.com");
                      if (!testEmail) return;
                      
                      try {
                        const res = await fetch('/api/auth/register', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            username: 'test_athlete_' + Date.now(),
                            email: testEmail,
                            password: 'testpassword123',
                            firstName: 'Test',
                            lastName: 'Athlete',
                            role: 'athlete',
                            uid: 'test-uid-' + Date.now()
                          })
                        });
                        const data = await res.json();
                        if (res.ok) {
                          alert("Test registration successful! Check " + testEmail + " for the welcome email and kromefitness@gmail.com for the admin notification.");
                        } else {
                          alert("Error: " + data.error);
                        }
                      } catch (err) {
                        alert("Network error testing registration");
                      }
                    }}
                    className="w-full py-3 bg-white/5 hover:bg-gold hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Run Registration Test
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : !selectedUser ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 px-6 pb-12">
            {loading ? (
              <div className="col-span-full p-20 text-center text-white/40 font-bold uppercase tracking-widest">Loading athletes...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="col-span-full p-20 text-center text-white/40 font-bold uppercase tracking-widest">No athletes found</div>
            ) : filteredUsers.map((user) => (
              <div key={user.id} className="bg-black/20 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden hover:border-gold/50 transition-all group relative flex flex-col h-full krome-outline">
                <div className="h-48 relative overflow-hidden">
                  <img 
                    src={`https://picsum.photos/seed/${user.username}-athlete/800/600`} 
                    alt={user.username} 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                  
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl gold-gradient p-0.5 shrink-0 shadow-xl">
                      <div className="w-full h-full bg-zinc-900 rounded-[10px] flex items-center justify-center overflow-hidden">
                        {user?.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt={user.username || 'User'} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-xs font-black italic text-gold/40">{(user?.username?.[0] || 'U').toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="font-black uppercase italic text-sm truncate text-white drop-shadow-md">{user?.username || 'Unknown Athlete'}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gold drop-shadow-md">
                        {user?.fitness_goal ? user.fitness_goal.replace('-', ' ') : 'Elite Athlete'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <div className="space-y-3 text-[10px] font-bold uppercase tracking-widest text-white/60 mb-6 flex-1">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span>Name</span>
                      <span className="text-white">
                        {user?.first_name || user?.last_name || user?.firstName || user?.lastName ? 
                          `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim() : 
                          'Not Set'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span>Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] ${user?.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                        {user?.status || 'inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span>Role</span>
                      <span className="text-gold">{user?.role || 'athlete'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email</span>
                      <span className="text-white/40 truncate ml-4 max-w-[120px]">{user?.email}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => {
                        setSelectedUser(user);
                        setActiveTab('overview');
                      }}
                      className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-white"
                    >
                      Profile
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedUser(user);
                        setActiveTab('programs');
                      }}
                      className="py-3 bg-gold hover:bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-gold/20"
                    >
                      View Program
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <AnimatePresence>
        {(selectedUser || isGlobalTemplate) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedUser(null);
                setIsGlobalTemplate(false);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              key={selectedUser?.id || 'global'}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-7xl bg-zinc-900 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden h-full lg:h-[92vh] flex flex-col lg:flex-row"
            >
              {/* Sidebar - Desktop Only */}
              {!isMobile && selectedUser && (
                <div className="w-80 border-r border-white/5 flex flex-col bg-zinc-900/80 backdrop-blur-2xl flex-none">
                  <div className="p-8 flex flex-col items-center border-b border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-gold/10 via-transparent to-transparent opacity-50" />
                    <div className="relative w-24 h-24 rounded-2xl gold-gradient p-0.5 shadow-2xl shadow-gold/20 mb-4 group cursor-pointer">
                      <div className="w-full h-full bg-zinc-900 rounded-[18px] flex items-center justify-center overflow-hidden">
                        {selectedUser?.avatar_url ? (
                          <img 
                            src={selectedUser.avatar_url} 
                            alt={selectedUser.username} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="text-3xl font-black italic text-gold/40">
                            {(selectedUser?.username?.[0] || 'U').toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    <h3 className="relative text-xl font-black uppercase italic tracking-tight text-center leading-tight">
                      {selectedUser?.first_name || selectedUser?.last_name || selectedUser?.firstName || selectedUser?.lastName ? 
                        `${selectedUser.first_name || selectedUser.firstName || ''} ${selectedUser.last_name || selectedUser.lastName || ''}`.trim() : 
                        selectedUser?.username}
                    </h3>
                    <p className="relative text-[9px] font-bold uppercase tracking-widest text-gold mt-2 px-3 py-1 bg-gold/10 rounded-full border border-gold/20">Athlete Profile</p>
                    {selectedUser?.fitness_goal && (
                      <div className="relative mt-3 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/60 text-center">
                          Goal: <span className="text-gold">{selectedUser.fitness_goal.replace('-', ' ')}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1.5">
                    <button 
                      onClick={() => setActiveTab('progress')}
                      className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'progress' ? 'bg-gold text-black shadow-xl shadow-gold/20 scale-[1.02]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                    >
                      <TrendingUp className="w-4 h-4" /> Training Stats
                    </button>
                    <button 
                      onClick={() => setActiveTab('programs')}
                      className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'programs' ? 'bg-gold text-black shadow-xl shadow-gold/20 scale-[1.02]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                    >
                      <Calendar className="w-4 h-4" /> Training Program
                    </button>
                    <button 
                      onClick={() => setActiveTab('assign-program')}
                      className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'assign-program' ? 'bg-gold text-black shadow-xl shadow-gold/20 scale-[1.02]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                    >
                      <ShoppingBag className="w-4 h-4" /> Assign Program
                    </button>
                    <button 
                      onClick={() => setActiveTab('assign-workout')}
                      className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'assign-workout' ? 'bg-gold text-black shadow-xl shadow-gold/20 scale-[1.02]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                    >
                      <Dumbbell className="w-4 h-4" /> Assign Workout
                    </button>
                    <button 
                      onClick={() => setActiveTab('builder')}
                      className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'builder' ? 'bg-gold text-black shadow-xl shadow-gold/20 scale-[1.02]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                    >
                      <Edit3 className="w-4 h-4" /> Program Builder
                    </button>
                    <button 
                      onClick={() => setActiveTab('library')}
                      className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'library' ? 'bg-gold text-black shadow-xl shadow-gold/20 scale-[1.02]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                    >
                      <Dumbbell className="w-4 h-4" /> Exercise Library
                    </button>
                    <button 
                      onClick={() => setActiveTab('metrics')}
                      className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'metrics' ? 'bg-gold text-black shadow-xl shadow-gold/20 scale-[1.02]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                    >
                      <Activity className="w-4 h-4" /> Body Metrics
                    </button>
                    <button 
                      onClick={() => setActiveTab('workouts')}
                      className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'workouts' ? 'bg-gold text-black shadow-xl shadow-gold/20 scale-[1.02]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                    >
                      <Dumbbell className="w-4 h-4" /> Workouts
                    </button>
                    <button 
                      onClick={() => setActiveTab('composition')}
                      className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'composition' ? 'bg-gold text-black shadow-xl shadow-gold/20 scale-[1.02]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                    >
                      <Camera className="w-4 h-4" /> Body Comp
                    </button>
                    <button 
                      onClick={() => setActiveTab('overview')}
                      className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-gold text-black shadow-xl shadow-gold/20 scale-[1.02]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                    >
                      <TrendingUp className="w-4 h-4" /> Overview
                    </button>
                    <button 
                      onClick={() => setActiveTab('parq')}
                      className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'parq' ? 'bg-gold text-black shadow-xl shadow-gold/20 scale-[1.02]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                    >
                      <ShieldAlert className="w-4 h-4" /> PAR Q
                    </button>
                    <button 
                      onClick={() => setActiveTab('nutrition')}
                      className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'nutrition' ? 'bg-gold text-black shadow-xl shadow-gold/20 scale-[1.02]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                    >
                      <Apple className="w-4 h-4" /> Nutrition
                    </button>
                    <button 
                      onClick={() => setActiveTab('activity')}
                      className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'activity' ? 'bg-gold text-black shadow-xl shadow-gold/20 scale-[1.02]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                    >
                      <History className="w-4 h-4" /> Activity Log
                    </button>
                    <button 
                      onClick={() => setActiveTab('video')}
                      className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'video' ? 'bg-gold text-black shadow-xl shadow-gold/20 scale-[1.02]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                    >
                      <Video className="w-4 h-4" /> Video Analysis
                    </button>
                    <button 
                      onClick={() => setActiveTab('ai-tools')}
                      className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'ai-tools' ? 'bg-gold text-black shadow-xl shadow-gold/20 scale-[1.02]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                    >
                      <Zap className="w-4 h-4" /> AI Academy Lab
                    </button>
                    <button 
                      onClick={() => setActiveTab('chat')}
                      className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'bg-gold text-black shadow-xl shadow-gold/20 scale-[1.02]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                    >
                      <MessageSquare className="w-4 h-4" /> Chat
                    </button>
                    <button 
                      onClick={() => setActiveTab('feedback')}
                      className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'feedback' ? 'bg-gold text-black shadow-xl shadow-gold/20 scale-[1.02]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                    >
                      <Star className="w-4 h-4" /> Feedback
                    </button>
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-gold text-black shadow-xl shadow-gold/20 scale-[1.02]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                  </div>

                  <div className="p-6 border-t border-white/5 bg-zinc-900/50">
                    <button 
                      onClick={() => setSelectedUser(null)}
                      className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white flex items-center justify-center gap-3 group"
                    >
                      <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Dashboard
                    </button>
                  </div>
                </div>
              )}

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col overflow-hidden bg-black/20 min-h-0">
                <div className="p-4 lg:p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/30 backdrop-blur-xl">
                  <div className="flex items-center gap-4">
                    {isMobile && activeTab !== 'menu' && (
                      <button 
                        onClick={() => setActiveTab('menu')}
                        className="p-2 bg-white/5 rounded-xl border border-white/10 text-gold hover:bg-white/10 transition-all"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    )}
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/40">
                      {activeTab === 'menu' ? 'Menu' : activeTab.replace('-', ' ')}
                    </h2>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedUser(null);
                      setIsGlobalTemplate(false);
                    }}
                    className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white/60 hover:text-white"
                  >
                    <X className="w-4 h-4 lg:w-5 lg:h-5" />
                  </button>
                </div>
                
                <div className="flex-1 p-4 lg:p-10 overflow-y-auto custom-scrollbar">
                {isMobile && activeTab === 'menu' ? (
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className="relative p-6 flex flex-col items-center bg-zinc-900/50 rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
                      {/* Background Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-transparent" />
                      
                      <div className="relative w-20 h-20 rounded-2xl gold-gradient p-0.5 shadow-2xl shadow-gold/20 mb-4">
                        <div className="w-full h-full bg-zinc-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                          {selectedUser?.avatar_url ? (
                            <img 
                              src={selectedUser.avatar_url} 
                              alt={selectedUser.username} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="text-3xl font-black italic text-gold/40">
                              {(selectedUser?.username?.[0] || 'U').toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      <h3 className="relative text-2xl font-black uppercase italic tracking-tight text-center leading-none">
                        {selectedUser?.first_name || selectedUser?.last_name || selectedUser?.firstName || selectedUser?.lastName ? 
                          `${selectedUser.first_name || selectedUser.firstName || ''} ${selectedUser.last_name || selectedUser.lastName || ''}`.trim() : 
                          selectedUser?.username}
                      </h3>
                      <div className="relative flex items-center gap-2 mt-3">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gold px-3 py-1 bg-gold/10 rounded-full border border-gold/20">Athlete Profile</p>
                        {selectedUser?.status && (
                           <p className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${selectedUser.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                             {selectedUser.status}
                           </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-10">
                      <button 
                        onClick={() => setActiveTab('progress')}
                        className="px-4 py-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex flex-col items-start gap-3 group hover:border-gold/50 transition-all shadow-xl"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-[9px] font-black uppercase tracking-widest text-white">Training Stats</span>
                          <span className="text-[7px] font-bold uppercase tracking-widest text-white/40 mt-0.5">Performance</span>
                        </div>
                      </button>
                      <button 
                        onClick={() => setActiveTab('programs')}
                        className="px-4 py-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex flex-col items-start gap-3 group hover:border-gold/50 transition-all shadow-xl"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-[9px] font-black uppercase tracking-widest text-white">Training Program</span>
                          <span className="text-[7px] font-bold uppercase tracking-widest text-white/40 mt-0.5">Schedule</span>
                        </div>
                      </button>
                      <button 
                        onClick={() => setActiveTab('assign-program')}
                        className="px-4 py-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex flex-col items-start gap-3 group hover:border-gold/50 transition-all shadow-xl"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-[9px] font-black uppercase tracking-widest text-white">Assign Program</span>
                          <span className="text-[7px] font-bold uppercase tracking-widest text-white/40 mt-0.5">Assignments</span>
                        </div>
                      </button>
                      <button 
                        onClick={() => setActiveTab('assign-workout')}
                        className="px-4 py-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex flex-col items-start gap-3 group hover:border-gold/50 transition-all shadow-xl"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                          <Dumbbell className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-[9px] font-black uppercase tracking-widest text-white">Assign Workout</span>
                          <span className="text-[7px] font-bold uppercase tracking-widest text-white/40 mt-0.5">Sessions</span>
                        </div>
                      </button>
                      <button 
                        onClick={() => setActiveTab('builder')}
                        className="px-4 py-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex flex-col items-start gap-3 group hover:border-gold/50 transition-all shadow-xl"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                          <Edit3 className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-[9px] font-black uppercase tracking-widest text-white">Program Builder</span>
                          <span className="text-[7px] font-bold uppercase tracking-widest text-white/40 mt-0.5">Custom</span>
                        </div>
                      </button>
                      <button 
                        onClick={() => setActiveTab('metrics')}
                        className="px-4 py-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex flex-col items-start gap-3 group hover:border-gold/50 transition-all shadow-xl"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-[9px] font-black uppercase tracking-widest text-white">Body Metrics</span>
                          <span className="text-[7px] font-bold uppercase tracking-widest text-white/40 mt-0.5">Vitals</span>
                        </div>
                      </button>
                      <button 
                        onClick={() => setActiveTab('nutrition')}
                        className="px-4 py-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex flex-col items-start gap-3 group hover:border-gold/50 transition-all shadow-xl"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                          <Apple className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-[9px] font-black uppercase tracking-widest text-white">Nutrition</span>
                          <span className="text-[7px] font-bold uppercase tracking-widest text-white/40 mt-0.5">Dietary</span>
                        </div>
                      </button>
                      <button 
                        onClick={() => setActiveTab('video')}
                        className="px-4 py-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex flex-col items-start gap-3 group hover:border-gold/50 transition-all shadow-xl"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                          <Video className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-[9px] font-black uppercase tracking-widest text-white">Video Analysis</span>
                          <span className="text-[7px] font-bold uppercase tracking-widest text-white/40 mt-0.5">Form</span>
                        </div>
                      </button>
                      <button 
                        onClick={() => setActiveTab('chat')}
                        className="px-4 py-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex flex-col items-start gap-3 group hover:border-gold/50 transition-all shadow-xl"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-[9px] font-black uppercase tracking-widest text-white">Chat</span>
                          <span className="text-[7px] font-bold uppercase tracking-widest text-white/40 mt-0.5">Messages</span>
                        </div>
                      </button>
                      <button 
                        onClick={() => setActiveTab('settings')}
                        className="px-4 py-4 rounded-2xl bg-zinc-900/50 border border-white/10 flex flex-col items-start gap-3 group hover:border-gold/50 transition-all shadow-xl"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 group-hover:text-white group-hover:scale-110 transition-transform">
                          <Settings className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-[9px] font-black uppercase tracking-widest text-white">Settings</span>
                          <span className="text-[7px] font-bold uppercase tracking-widest text-white/40 mt-0.5">Account</span>
                        </div>
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => setSelectedUser(null)}
                      className="w-full py-6 rounded-[32px] bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase tracking-widest text-xs mt-8 hover:bg-red-500/20 transition-all shadow-xl"
                    >
                      Close Athlete Profile
                    </button>
                  </div>
                ) : activeTab === 'progress' ? (
                  <ProgressTracker userId={selectedUser?.id || 0} isAdmin={true} />
                ) : activeTab === 'chat' ? (
                  <AdminMessageDashboard adminId={finalAdminId.toString()} />
                ) : activeTab === 'workouts' ? (
                  <div className="space-y-8">
                    <WorkoutTracker userId={selectedUser?.id?.toString() || '0'} isAdminView={true} />
                    <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-8">
                      <h3 className="text-xl font-black uppercase italic tracking-tight mb-6 text-white/80">Athlete <span className="text-gold">Exercises</span></h3>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Note: In a real app, we'd fetch unique exercises for the selected user. 
                            For now, this demonstrates the UI placement. */}
                        <button 
                          onClick={() => setSelectedExercise("Bench Press")}
                          className="p-3 bg-black/20 rounded-xl border border-white/5 hover:border-gold transition-colors text-xs font-bold uppercase tracking-widest text-white/70 text-left truncate krome-outline"
                        >
                          Bench Press
                        </button>
                        <button 
                          onClick={() => setSelectedExercise("Squat")}
                          className="p-3 bg-black/20 rounded-xl border border-white/5 hover:border-gold transition-colors text-xs font-bold uppercase tracking-widest text-white/70 text-left truncate"
                        >
                          Squat
                        </button>
                      </div>
                    </div>
                  </div>
                ) : activeTab === 'assign-workout' ? (
                  <div className="space-y-8">
                    <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                            <Dumbbell className="w-6 h-6 text-gold" />
                            Assign Workout
                          </h3>
                          <p className="text-white/40 text-xs mt-1 uppercase tracking-widest font-bold">Assign individual workouts to {selectedUser?.username}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {globalTemplates.flatMap(template => 
                          template.phases.flatMap(phase => 
                            phase.weeks.flatMap(week => week.workouts)
                          )
                        ).map((workout) => (
                          <div 
                            key={workout.id}
                            className="p-6 rounded-3xl border bg-white/5 border-white/10 hover:border-gold/30 transition-all group relative overflow-hidden"
                          >
                            <div className="relative z-10">
                              <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                                  <Activity className="w-6 h-6" />
                                </div>
                              </div>
                              <h4 className="text-lg font-black uppercase italic text-white mb-2">{workout.title}</h4>
                              <p className="text-white/40 text-xs line-clamp-2 mb-6 h-8">Day {workout.day}</p>
                              
                              <div className="flex items-center justify-end mt-auto">
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await fetch('/api/admin/assign-workout', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          userId: selectedUser?.id,
                                          workoutId: workout.id,
                                          assignedBy: user.id
                                        })
                                      });
                                      if (res.ok) {
                                        alert("Workout assigned successfully!");
                                      } else {
                                        alert("Failed to assign workout");
                                      }
                                    } catch (err) {
                                      console.error("Failed to assign workout", err);
                                    }
                                  }}
                                  className="px-6 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all bg-gold text-black hover:scale-105 active:scale-95 shadow-lg shadow-gold/20"
                                >
                                  Assign Now
                                </button>
                              </div>
                            </div>
                            
                            {/* Background Accent */}
                            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gold/5 rounded-full blur-2xl group-hover:bg-gold/10 transition-colors" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : activeTab === 'assign-program' ? (
                  <div className="space-y-8">
                    <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                            <ShoppingBag className="w-6 h-6 text-gold" />
                            Assign Program
                          </h3>
                          <p className="text-white/40 text-xs mt-1 uppercase tracking-widest font-bold">Assign pre-built programs to {selectedUser?.username}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {globalTemplates.map((template) => {
                          const isAssigned = assignedPrograms.some(ap => (ap.programId || ap.program_id) === template.id);
                          return (
                            <div 
                              key={template.id}
                              className={`p-6 rounded-3xl border transition-all group relative overflow-hidden ${isAssigned ? 'bg-gold/5 border-gold/20' : 'bg-white/5 border-white/10 hover:border-gold/30'}`}
                            >
                              <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                                    <Dumbbell className="w-6 h-6" />
                                  </div>
                                  {isAssigned && (
                                    <div className="px-3 py-1 rounded-full bg-gold text-black text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                      <Check className="w-3 h-3" /> Assigned
                                    </div>
                                  )}
                                </div>
                                <h4 className="text-lg font-black uppercase italic text-white mb-2">{template.name}</h4>
                                <p className="text-white/40 text-xs line-clamp-2 mb-6 h-8">{template.description}</p>
                                
                                <div className="flex items-center justify-between mt-auto">
                                  <span className="text-gold font-black text-lg">${template.price}</span>
                                  <button
                                    disabled={isAssigned}
                                    onClick={async () => {
                                      try {
                                        const res = await fetch('/api/admin/assign-program', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            userId: selectedUser?.id,
                                            programId: template.id,
                                            assignedBy: user.id
                                          })
                                        });
                                        if (res.ok) {
                                          // Refresh assigned programs
                                          const assignedRes = await fetch(`/api/assigned-programs/${selectedUser?.id}`);
                                          if (assignedRes.ok) {
                                            const data = await assignedRes.json();
                                            setAssignedPrograms(data);
                                          }
                                        } else {
                                          const errorData = await res.json();
                                          alert(errorData.error || "Failed to assign program");
                                        }
                                      } catch (err) {
                                        console.error("Failed to assign program", err);
                                        alert("Failed to assign program");
                                      }
                                    }}
                                    className={`px-6 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${isAssigned ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-gold text-black hover:scale-105 active:scale-95 shadow-lg shadow-gold/20'}`}
                                  >
                                    {isAssigned ? 'Assigned' : 'Assign Now'}
                                  </button>
                                </div>
                              </div>
                              
                              {/* Background Accent */}
                              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gold/5 rounded-full blur-2xl group-hover:bg-gold/10 transition-colors" />
                            </div>
                          );
                        })}
                        
                        {globalTemplates.length === 0 && (
                          <div className="col-span-full py-20 text-center">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 text-white/20">
                              <ShoppingBag className="w-10 h-10" />
                            </div>
                            <h4 className="text-white/40 font-black uppercase tracking-widest">No programs available</h4>
                            <p className="text-white/20 text-xs mt-2">Create programs in the main dashboard to assign them here.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : activeTab === 'composition' ? (
                  <BodyCompositionTracker userId={selectedUser?.id?.toString() || '0'} onBack={() => setActiveTab('progress')} isAdminView={true} />
                ) : activeTab === 'overview' ? (
                  <div className="space-y-8">
                    <FitnessOverview userId={selectedUser?.id?.toString() || '0'} showGenerationCard={false} />
                  </div>
                ) : activeTab === 'metrics' ? (
                  <BodyMetrics userId={selectedUser?.id?.toString() || '0'} data={bodyMetricsData} setData={setBodyMetricsData} />
                ) : activeTab === 'nutrition' ? (
                  <div className="space-y-8">
                    <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <h3 className="font-bold uppercase italic flex items-center gap-2">
                          <Apple className="w-4 h-4 text-gold" />
                          Nutrition Logs
                        </h3>
                        
                        {/* Date Selector */}
                        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-1">
                          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white/10 rounded-xl transition-colors krome-outline">
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <div className="flex items-center gap-2 px-2">
                            <Calendar className="w-4 h-4 text-gold" />
                            <span className="font-bold uppercase tracking-widest text-[10px]">
                              {displayDate()}
                            </span>
                          </div>
                          <button onClick={() => changeDate(1)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        {/* Calories */}
                        <div className={`rounded-3xl p-6 relative overflow-hidden transition-colors border ${getCardColor(nutritionTotals.calories, targets.calories)}`}>
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Flame className="w-16 h-16" />
                          </div>
                          <div className="relative z-10">
                            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Calories</div>
                            <div className="text-2xl font-black italic mb-1">{Math.round(nutritionTotals.calories)}</div>
                            <div className="text-[10px] text-white/40 mb-3">/ {targets.calories} kcal</div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((nutritionTotals.calories / targets.calories) * 100, 100)}%` }}
                                className={`h-full ${getBarColor(nutritionTotals.calories, targets.calories, 'bg-gold')}`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Protein */}
                        <div className={`rounded-3xl p-6 relative overflow-hidden transition-colors border ${getCardColor(nutritionTotals.protein, targets.protein)}`}>
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Beef className="w-16 h-16" />
                          </div>
                          <div className="relative z-10">
                            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Protein</div>
                            <div className="text-2xl font-black italic mb-1">{Math.round(nutritionTotals.protein)}g</div>
                            <div className="text-[10px] text-white/40 mb-3">/ {targets.protein}g</div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((nutritionTotals.protein / targets.protein) * 100, 100)}%` }}
                                className={`h-full ${getBarColor(nutritionTotals.protein, targets.protein, 'bg-blue-500')}`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Carbs */}
                        <div className={`rounded-3xl p-6 relative overflow-hidden transition-colors border ${getCardColor(nutritionTotals.carbs, targets.carbs)}`}>
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Wheat className="w-16 h-16" />
                          </div>
                          <div className="relative z-10">
                            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Carbs</div>
                            <div className="text-2xl font-black italic mb-1">{Math.round(nutritionTotals.carbs)}g</div>
                            <div className="text-[10px] text-white/40 mb-3">/ {targets.carbs}g</div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((nutritionTotals.carbs / targets.carbs) * 100, 100)}%` }}
                                className={`h-full ${getBarColor(nutritionTotals.carbs, targets.carbs, 'bg-green-500')}`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Fat */}
                        <div className={`rounded-3xl p-6 relative overflow-hidden transition-colors border ${getCardColor(nutritionTotals.fat, targets.fat)}`}>
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Droplets className="w-16 h-16" />
                          </div>
                          <div className="relative z-10">
                            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Fat</div>
                            <div className="text-2xl font-black italic mb-1">{Math.round(nutritionTotals.fat)}g</div>
                            <div className="text-[10px] text-white/40 mb-3">/ {targets.fat}g</div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((nutritionTotals.fat / targets.fat) * 100, 100)}%` }}
                                className={`h-full ${getBarColor(nutritionTotals.fat, targets.fat, 'bg-yellow-500')}`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Meals for {displayDate()}</h4>
                      <div className="space-y-2">
                        {selectedDateLogs.length === 0 ? (
                          <p className="text-center text-white/20 py-8 text-xs font-bold uppercase tracking-widest">No meals logged for this date</p>
                        ) : (
                          selectedDateLogs.map((log) => (
                            <div key={log.logId} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                              <div>
                                <div className="font-bold text-sm">{log.name}</div>
                                <div className="text-[10px] text-white/40 uppercase tracking-wider">{log.meal} • {log.servings}x</div>
                              </div>
                              <div className="text-xs font-mono text-gold">{Math.round(log.serving.calories * log.servings)} kcal</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button 
                        onClick={() => {
                          if (selectedUser && onNavigate) {
                            onNavigate('performanceMacroNutrients', selectedUser.id.toString());
                          } else {
                            setIsEditingNutrition(!isEditingNutrition);
                          }
                        }}
                        className="btn-gold px-6 py-2 text-xs flex items-center gap-2"
                      >
                        <Apple className="w-4 h-4" /> Edit Nutrition Plan
                      </button>
                    </div>

                    <SupplementsAndVitamins 
                      data={bodyMetricsData} 
                      setData={setBodyMetricsData} 
                      isEditing={isEditingNutrition} 
                      getSupplementRecommendation={(name) => getSupplementRecommendation(name, bodyMetricsData)}
                      generateDefaultSupplements={() => generateDefaultSupplements(bodyMetricsData, setBodyMetricsData)}
                    />
                  </div>
                ) : activeTab === 'activity' ? (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <select 
                        value={activityFilter} 
                        onChange={(e) => setActivityFilter(e.target.value)}
                        className="flex-1 bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs text-white"
                      >
                        <option value="all">All Activities</option>
                        <option value="login">Login</option>
                        <option value="logout">Logout</option>
                        <option value="workout_started">Workout Started</option>
                        <option value="workout_completed">Workout Completed</option>
                      </select>
                      <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value as 'date' | 'action')}
                        className="w-24 bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs text-white"
                      >
                        <option value="date">Date</option>
                        <option value="action">Action</option>
                      </select>
                      <button 
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="w-10 bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs text-white flex items-center justify-center krome-outline"
                      >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </button>
                    </div>
                    {filteredAndSortedLogs.map((log) => (
                      <div key={log.id} className="p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-sm uppercase">{log.action.replace(/_/g, ' ')}</div>
                          <div className="text-xs text-white/40">
                            {(() => {
                              try {
                                return log.details ? JSON.stringify(JSON.parse(log.details)) : '';
                              } catch (e) {
                                return log.details || '';
                              }
                            })()}
                          </div>
                        </div>
                        <div className="text-xs font-mono text-white/40">{new Date(log.created_at).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                ) : activeTab === 'programs' ? (
                  <div className="space-y-8">
                    <ProgramViewer 
                      userId={selectedUser?.id?.toString() || '0'} 
                      onBack={() => setActiveTab('overview')} 
                      isAdmin={true} 
                      onEdit={(program, isCustom) => {
                        // When editing from the programs list, switch to builder tab
                        // and pass the program to it
                        setSelectedProgram(program);
                        setIsCustomProgram(isCustom);
                        setActiveTab('builder');
                      }}
                      onAssign={async (program) => {
                        if (!selectedUser) return;
                        try {
                          const res = await fetch('/api/admin/assign-program', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              userId: selectedUser.id,
                              programId: program.id,
                              itemName: program.name,
                              price: 0
                            })
                          });
                          if (res.ok) {
                            haptics.success();
                          } else {
                            haptics.error();
                          }
                        } catch (err) {
                          console.error(err);
                          haptics.error();
                        }
                      }}
                    />
                  </div>
                ) : (activeTab === 'builder' || activeTab === 'library') ? (
                  <motion.div
                    key="builder"
                    className="fixed inset-0 z-50 bg-zinc-950 overflow-y-auto pt-20 p-4 md:p-8"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <ProgramBuilder 
                      key={selectedUser?.id ? `builder-${selectedUser.id}-${selectedProgram?.id || 'new'}-${activeTab}` : `builder-none-${activeTab}`}
                      userId={selectedUser?.id?.toString() || '0'} 
                      userRole={user?.role}
                      initialProgram={selectedProgram}
                      isCustom={isCustomProgram}
                      isGlobalTemplate={isGlobalTemplate}
                      initialView={activeTab === 'library' ? 'library' : 'builder'}
                      onSave={() => {
                        if (selectedUser) {
                          fetch('/api/activity', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              userId: selectedUser.id,
                              action: 'admin_updated_program',
                              details: JSON.stringify({ message: `${user?.role === 'admin' ? 'Admin' : 'Coach'} built/updated a custom program` })
                            })
                          }).catch(console.error);
                        }
                        
                        setSelectedProgram(undefined);
                        setIsCustomProgram(false);
                        setIsGlobalTemplate(false);
                        setActiveTab('programs');
                      }}
                      onBack={() => {
                        setSelectedProgram(undefined);
                        setIsCustomProgram(false);
                        setIsGlobalTemplate(false);
                        setActiveTab(selectedUser ? 'programs' : 'menu');
                      }}
                    />
                  </motion.div>
                ) : activeTab === 'video' ? (
                  <div className="space-y-8">
                    <VideoAnalyzer userId={selectedUser?.id?.toString() || '0'} />
                  </div>
                ) : activeTab === 'ai-tools' ? (
                  <div className="space-y-8">
                    <AITools />
                  </div>
                ) : activeTab === 'settings' ? (
                  <div className="space-y-8">
                    <AthleteSettings 
                      user={selectedUser} 
                      onUpdate={(updated) => {
                        setSelectedUser(updated);
                        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
                      }} 
                    />
                  </div>
                ) : activeTab === 'feedback' ? (
                  <FeedbackViewer />
                ) : activeTab === 'system' ? (
                  <div className="space-y-8">
                    <div className="bg-zinc-900/50 border border-white/10 rounded-[40px] p-10 backdrop-blur-xl shadow-2xl">
                      <h2 className="text-3xl font-black uppercase italic mb-2 flex items-center gap-3">
                        <Settings className="w-8 h-8 text-gold" />
                        System <span className="text-gold">Settings</span>
                      </h2>
                      <p className="text-white/40 mb-10 text-sm">Manage system-wide configurations and test integrations.</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-8 bg-black/40 rounded-3xl border border-white/5 hover:border-gold/20 transition-all group">
                          <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold mb-6 group-hover:scale-110 transition-transform">
                            <Bell className="w-6 h-6" />
                          </div>
                          <h3 className="text-lg font-bold uppercase italic mb-2">Email Integration</h3>
                          <p className="text-xs text-white/40 mb-6 leading-relaxed">Verify that your SMTP settings are correctly configured by sending a test email to kromefitness@gmail.com.</p>
                          <button 
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/admin/test-smtp', { method: 'POST' });
                                const data = await res.json();
                                if (res.ok) {
                                  alert(data.message);
                                } else {
                                  alert("Error: " + data.error);
                                }
                              } catch (err) {
                                alert("Network error testing SMTP");
                              }
                            }}
                            className="w-full py-3 bg-white/5 hover:bg-gold hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            Test SMTP Settings
                          </button>
                        </div>

                        <div className="p-8 bg-black/40 rounded-3xl border border-white/5 hover:border-gold/20 transition-all group">
                          <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold mb-6 group-hover:scale-110 transition-transform">
                            <UserPlus className="w-6 h-6" />
                          </div>
                          <h3 className="text-lg font-bold uppercase italic mb-2">Registration Test</h3>
                          <p className="text-xs text-white/40 mb-6 leading-relaxed">Simulate a new athlete registration to verify that both welcome and admin notification emails are sent.</p>
                          <button 
                            onClick={async () => {
                              const testEmail = prompt("Enter a test email address to receive the welcome email:", "test-athlete@example.com");
                              if (!testEmail) return;
                              
                              try {
                                const res = await fetch('/api/auth/register', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    username: 'test_athlete_' + Date.now(),
                                    email: testEmail,
                                    password: 'testpassword123',
                                    firstName: 'Test',
                                    lastName: 'Athlete',
                                    role: 'athlete',
                                    uid: 'test-uid-' + Date.now()
                                  })
                                });
                                const data = await res.json();
                                if (res.ok) {
                                  alert("Test registration successful! Check " + testEmail + " for the welcome email and kromefitness@gmail.com for the admin notification.");
                                } else {
                                  alert("Error: " + data.error);
                                }
                              } catch (err) {
                                alert("Network error testing registration");
                              }
                            }}
                            className="w-full py-3 bg-white/5 hover:bg-gold hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            Run Registration Test
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <PARQ userId={selectedUser?.id?.toString() || '0'} initialReadOnly={false} />
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

      {/* Exercise History Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[110] p-6">
          <div className="bg-zinc-900 border border-white/10 rounded-[40px] p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black uppercase italic tracking-tight">
                History: <span className="text-gold">{selectedExercise}</span>
              </h3>
              <button 
                onClick={() => setSelectedExercise(null)}
                className="text-white/40 hover:text-white font-bold uppercase tracking-widest text-xs"
              >
                Close
              </button>
            </div>
            <div className="space-y-4">
              {/* In a real app, we'd fetch the actual history for the selected user and exercise */}
              <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                <span className="text-xs font-bold uppercase tracking-widest text-white/70">2026-03-07</span>
                <span className="text-xs font-black italic text-emerald-500">Completed</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && userToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-red-500/20 rounded-[40px] p-10 text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-8 shadow-xl">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black uppercase italic mb-4">Terminate Athlete?</h3>
              <p className="text-white/40 mb-10 leading-relaxed text-sm">
                Are you sure you want to delete <span className="text-white font-bold">{userToDelete.username}</span>? This action is permanent and will wipe all their training data.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmDelete}
                  className="w-full py-4 bg-red-500 text-white rounded-full font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 krome-outline"
                >
                  Confirm Termination
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-4 bg-white/5 text-white rounded-full font-black uppercase tracking-widest hover:bg-white/10 transition-all krome-outline"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {editingUser && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[40px] p-10 shadow-2xl"
            >
              <h3 className="text-2xl font-black uppercase italic mb-8">Edit Athlete</h3>
              <div className="space-y-4">
                <input type="text" value={editFormData.first_name} onChange={e => setEditFormData({...editFormData, first_name: e.target.value})} placeholder="First Name" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm" />
                <input type="text" value={editFormData.last_name} onChange={e => setEditFormData({...editFormData, last_name: e.target.value})} placeholder="Last Name" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm" />
                <input type="email" value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} placeholder="Email" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm" />
                <select value={editFormData.role} onChange={e => setEditFormData({...editFormData, role: e.target.value as 'athlete' | 'coach' | 'admin'})} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm">
                  <option value="athlete">Athlete</option>
                  <option value="coach">Coach</option>
                  <option value="admin">Admin</option>
                </select>
                <select value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value as 'active' | 'inactive' | 'pending'})} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="flex gap-4 mt-10">
                <button onClick={() => setEditingUser(null)} className="flex-1 py-4 rounded-full bg-zinc-800 font-black uppercase tracking-widest text-xs hover:bg-zinc-700 transition-all krome-outline">Cancel</button>
                <button onClick={saveUserChanges} className="flex-1 py-4 rounded-full bg-gold text-black font-black uppercase tracking-widest text-xs hover:bg-gold/90 transition-all">Save Changes</button>
              </div>
            </motion.div>
          </div>
        )}
        <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
          <DialogContent className="bg-zinc-900 border-white/10 text-white rounded-[40px] p-10 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase italic mb-4">Add New <span className="text-gold">Athlete</span></DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input required id="username" value={addFormData.username} onChange={e => setAddFormData({...addFormData, username: e.target.value})} placeholder="Username" className="bg-black/50 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input required id="email" type="email" value={addFormData.email} onChange={e => setAddFormData({...addFormData, email: e.target.value})} placeholder="Email" className="bg-black/50 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input required id="password" type="password" value={addFormData.password} onChange={e => setAddFormData({...addFormData, password: e.target.value})} placeholder="Password" className="bg-black/50 border-white/10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" value={addFormData.first_name} onChange={e => setAddFormData({...addFormData, first_name: e.target.value})} placeholder="First Name" className="bg-black/50 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" value={addFormData.last_name} onChange={e => setAddFormData({...addFormData, last_name: e.target.value})} placeholder="Last Name" className="bg-black/50 border-white/10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={addFormData.role} onValueChange={(v) => setAddFormData({...addFormData, role: v as any})}>
                  <SelectTrigger className="bg-black/50 border-white/10">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white">
                    <SelectItem value="athlete">Athlete</SelectItem>
                    <SelectItem value="coach">Coach</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="flex gap-4 mt-10">
                <Button type="button" variant="outline" onClick={() => setShowAddUserModal(false)} className="flex-1 border-white/10 hover:bg-white/5">Cancel</Button>
                <Button type="submit" className="flex-1 bg-gold text-black hover:bg-gold/90">Create User</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </AnimatePresence>
      <AdminAssistant kpiData={kpiData} users={users} leads={leads} purchases={purchases} />
    </motion.div>
  );
}
