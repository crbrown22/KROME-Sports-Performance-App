import React from 'react';
import { LayoutDashboard, Dumbbell, TrendingUp, Apple, User, ChevronLeft, Menu, ShoppingBag, Shield, Bell } from 'lucide-react';

interface TopNavigationProps {
  currentView: string;
  onNavigate: (view: string) => void;
  user: any;
  onMenuToggle?: () => void;
  setShowChat?: (show: boolean) => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({ currentView, onNavigate, user, onMenuToggle, setShowChat }) => {
  const navItems = [
    { id: 'messages', icon: Bell, label: 'Messages' },
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dash' },
    { id: 'programCatalog', icon: Dumbbell, label: 'Programs' },
    { id: 'shop', icon: ShoppingBag, label: 'Shop' },
    ...(user?.role === 'admin' || user?.role === 'coach' ? [{ id: 'admin', icon: Shield, label: user?.role === 'admin' ? 'Admin' : 'Coach' }] : []),
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'more', icon: Menu, label: 'More' },
  ];

  return (
    <div className="md:hidden fixed top-0 pt-[var(--safe-area-top)] pb-3 left-0 w-full bg-black/90 backdrop-blur-xl border-b border-white/10 px-4 flex justify-between items-center z-[90]">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            if (item.id === 'more') {
              onMenuToggle?.();
            } else if (item.id === 'messages') {
              setShowChat?.(true);
            } else {
              onNavigate(item.id);
            }
          }}
          className={`flex flex-col items-center gap-1 ${currentView === item.id ? 'text-gold' : 'text-krome'}`}
        >
          <item.icon className="w-5 h-5" />
          <span className="text-[10px]">{item.label}</span>
        </button>
      ))}
    </div>
  );
};
