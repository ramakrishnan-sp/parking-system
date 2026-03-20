import { Menu, Bell, Search } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Avatar from '@radix-ui/react-avatar';
import { Link } from 'react-router-dom';

export const Topbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuthStore();

  return (
    <header className="h-16 glass-nav flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="p-2 mr-4 text-white/70 hover:text-white lg:hidden rounded-lg hover:bg-white/5"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-1.5 focus-within:border-brand-purple/50 focus-within:ring-1 focus-within:ring-brand-purple/50 transition-all">
          <Search className="w-4 h-4 text-white/40 mr-2" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/40 w-64"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/5 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-pink rounded-full"></span>
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="outline-none">
              <Avatar.Root className="inline-flex items-center justify-center align-middle overflow-hidden w-8 h-8 rounded-full bg-brand-purple/20 border border-brand-purple/50">
                <Avatar.Image
                  className="w-full h-full object-cover"
                  src={user?.profile_photo_url}
                  alt={user?.full_name}
                />
                <Avatar.Fallback className="w-full h-full flex items-center justify-center text-sm font-medium text-brand-purple">
                  {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                </Avatar.Fallback>
              </Avatar.Root>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content 
              className="min-w-[220px] glass-panel p-2 mt-2 mr-4 shadow-xl animate-in fade-in zoom-in-95 z-50"
              sideOffset={5}
            >
              <div className="px-2 py-2 border-b border-white/10 mb-2">
                <p className="text-sm font-medium text-white">{user?.full_name}</p>
                <p className="text-xs text-white/50 truncate">{user?.email}</p>
              </div>
              
              <DropdownMenu.Item className="outline-none">
                <Link to="/profile" className="flex items-center px-2 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-md cursor-pointer">
                  Profile Settings
                </Link>
              </DropdownMenu.Item>
              
              <DropdownMenu.Item className="outline-none" onSelect={logout}>
                <div className="flex items-center px-2 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md cursor-pointer mt-1">
                  Sign Out
                </div>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
};
