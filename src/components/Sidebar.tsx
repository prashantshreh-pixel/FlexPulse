import React from 'react';
import { ViewTab } from '../types';
import { LayoutDashboard, Dumbbell, BookOpen, ClipboardList, User } from 'lucide-react';

interface SidebarProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  username: string;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, username, onLogout }) => {
  const navItems: { id: ViewTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'dashboard',    label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live_workout', label: 'Today',     icon: Dumbbell,     badge: '●' },
    { id: 'exercises',   label: 'Exercises', icon: BookOpen },
    { id: 'routines',    label: 'Routines',  icon: ClipboardList },
    { id: 'profile',     label: 'Profile',   icon: User },
  ];

  return (
    <aside className="w-full md:w-[220px] bg-[#f8f7f4] border-r-2 border-[#1a1a1a] p-6 flex flex-col gap-3 shrink-0 select-none">
      <div className="font-mono text-[0.6rem] uppercase tracking-widest text-[#1a1a1a]/60 mb-2">
        FlexPulse / v2.0
      </div>

      <nav className="flex flex-col gap-1.5">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`font-oswald uppercase text-[1.05rem] px-3 py-2.5 text-left cursor-pointer transition-all flex items-center gap-3 border ${
                isActive
                  ? 'border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] bg-white font-bold text-[#1a1a1a]'
                  : 'border-transparent text-[#1a1a1a]/70 hover:text-[#1a1a1a] hover:bg-[#1a1a1a]/5'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#ff4d00]' : 'text-[#1a1a1a]/40'}`} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[#ff4d00] font-black text-sm leading-none">{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-[#1a1a1a]/10">
        <div className="flex items-center justify-between mb-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className="font-mono text-[0.75rem] font-bold uppercase text-[#1a1a1a] hover:text-[#ff4d00] transition cursor-pointer truncate text-left max-w-[100px]"
          >
            {username}
          </button>
          <div className="flex items-center gap-2">
            <a 
              href="/admin" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[0.6rem] font-mono font-bold uppercase text-[#ff4d00] hover:underline"
            >
              Admin
            </a>
            <span className="text-[0.6rem] font-mono text-[#1a1a1a]/30">|</span>
            <button 
              onClick={onLogout}
              className="text-[0.6rem] font-mono font-bold uppercase text-[#ff4d00] hover:underline cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
        <div className="font-mono text-[0.6rem] leading-relaxed text-[#1a1a1a]/60">
          STATUS: <span className="text-emerald-600 font-bold">ACTIVE</span><br />
          50 exercises / 6 programs
        </div>
      </div>
    </aside>
  );
};
