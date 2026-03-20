import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { USER_TYPES } from '@/lib/constants';
import { MapPin, Calendar, LayoutDashboard, User, LogOut, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuthStore();
  
  const links = [
    { to: '/seeker/map', icon: MapPin, label: 'Find Parking', roles: [USER_TYPES.SEEKER] },
    { to: '/seeker/bookings', icon: Calendar, label: 'My Bookings', roles: [USER_TYPES.SEEKER] },
    { to: '/owner', icon: LayoutDashboard, label: 'Owner Dashboard', roles: [USER_TYPES.OWNER] },
    { to: '/admin', icon: LayoutDashboard, label: 'Admin Dashboard', roles: [USER_TYPES.ADMIN] },
    { to: '/profile', icon: User, label: 'Profile', roles: [USER_TYPES.SEEKER, USER_TYPES.OWNER, USER_TYPES.ADMIN] },
  ];

  const filteredLinks = links.filter(link => link.roles.includes(user?.user_type));

  return (
    <>
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 glass-panel border-y-0 border-l-0 rounded-none flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <MapPin className="w-6 h-6 text-brand-purple mr-2" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-[var(--brand-gradient)]">ParkEase</span>
          <button className="ml-auto lg:hidden text-white/70" onClick={() => setIsOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {filteredLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                isActive 
                  ? "bg-brand-purple/20 text-brand-purple border border-brand-purple/30" 
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <link.icon className="w-5 h-5 mr-3" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-400 rounded-xl hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </div>
      
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
