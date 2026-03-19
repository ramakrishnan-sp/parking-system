import { Bell, Search, Settings, Menu } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { ThemeToggle } from './ThemeToggle'
import { ColorThemePicker } from './ColorThemePicker'
import useAuthStore from '../../store/authStore'
import { getMyNotifications } from '../../api/users'

export function Topbar({ onMenuClick }) {
  const { user } = useAuthStore()
  const [q, setQ] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return
    getMyNotifications()
      .then((r) => {
        const unread = r.data.filter((n) => !n.is_read).length
        setUnreadCount(unread)
      })
      .catch(() => {})
  }, [user])

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '?'

  const roleLabel = {
    seeker: 'Seeker',
    owner: 'Owner',
    admin: 'Admin',
  }[user?.user_type] ?? ''

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border mb-6">
      <div className="h-16 px-4 flex items-center justify-between gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-full p-2 hover:bg-muted transition-colors"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-sm">
          <label className="relative block">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search className="size-4" />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search parking, bookings…"
              className="w-full rounded-full border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </label>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative rounded-full p-2 hover:bg-muted transition-colors focus:outline-none">
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex items-center justify-center bg-red-500 text-white text-[10px] rounded-full h-4 min-w-4 px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {unreadCount === 0
                ? <DropdownMenuItem className="text-muted-foreground">No new notifications</DropdownMenuItem>
                : <DropdownMenuItem asChild>
                    <Link to="/profile">View all notifications</Link>
                  </DropdownMenuItem>
              }
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full p-2 hover:bg-muted transition-colors focus:outline-none">
                <Settings className="size-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <ThemeToggle />
              </div>
              <ColorThemePicker />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full p-1 hover:bg-muted transition-colors focus:outline-none">
                {user?.profile_photo_url ? (
                  <img
                    src={user.profile_photo_url}
                    alt="Profile"
                    className="size-8 rounded-full object-cover"
                  />
                ) : (
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-brand text-white text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-sm truncate">{user?.full_name}</span>
                  <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                  <span className="text-xs text-brand font-medium">{roleLabel}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">Profile &amp; Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" asChild>
                <Link to="/login">Sign out</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
