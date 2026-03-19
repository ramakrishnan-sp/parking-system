import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  MapPin, CalendarCheck, Building2, LayoutDashboard,
  User, LogOut, ChevronFirst, ChevronLast,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import useAuthStore from '../../store/authStore'
import { logoutUser } from '../../api/auth'
import { toast } from 'sonner'

const NAV_BY_ROLE = {
  seeker: [
    { href: '/map',      label: 'Find Parking', icon: MapPin },
    { href: '/bookings', label: 'My Bookings',  icon: CalendarCheck },
    { href: '/profile',  label: 'Profile',      icon: User },
  ],
  owner: [
    { href: '/owner',    label: 'My Spaces',    icon: Building2 },
    { href: '/profile',  label: 'Profile',      icon: User },
  ],
  admin: [
    { href: '/admin',    label: 'Dashboard',    icon: LayoutDashboard },
    { href: '/profile',  label: 'Profile',      icon: User },
  ],
}

export function Sidebar({ mobileOpen, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [open, setOpen] = useState(true)

  // Persist collapse state
  useEffect(() => {
    const saved = localStorage.getItem('parkease-sidebar-open')
    if (saved !== null) setOpen(saved === '1')
  }, [])
  useEffect(() => {
    localStorage.setItem('parkease-sidebar-open', open ? '1' : '0')
  }, [open])

  const navItems = NAV_BY_ROLE[user?.user_type] ?? []

  const handleLogout = async () => {
    const rt = localStorage.getItem('parkease_refresh_token')
    try {
      if (rt) await logoutUser(rt)
    } catch {}
    logout()
    toast.success('Signed out successfully')
    navigate('/login')
  }

  const isActive = (href) =>
    location.pathname === href ||
    (href !== '/' && location.pathname.startsWith(href + '/'))

  return (
    <aside
      className={cn(
        'bg-sidebar-gradient text-white flex flex-col h-full transition-[width] duration-300 shrink-0',
        open ? 'w-52' : 'w-[72px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-9 rounded-xl bg-white/20 grid place-items-center font-bold text-sm shrink-0">
            PE
          </div>
          {open && (
            <span className="text-sm font-semibold truncate">ParkEase</span>
          )}
        </div>
        <button
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg bg-white/20 p-1.5 hover:bg-white/30 shrink-0"
        >
          {open
            ? <ChevronFirst className="size-4" />
            : <ChevronLast  className="size-4" />
          }
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 mt-1">
        <ul className="flex flex-col gap-1 px-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <li key={href}>
                <Link
                  to={href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-3 transition-colors',
                    active
                      ? 'bg-white text-brand font-medium'
                      : 'text-white/90 hover:bg-white/15'
                  )}
                >
                  <Icon className={cn('size-5 shrink-0', active ? 'text-brand' : 'text-white')} />
                  {open && <span className="text-sm">{label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer: tip + logout */}
      <div className="px-3 pb-5 pt-2 space-y-2">
        {open && (
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-xs leading-5 text-white/80">
              {user?.user_type === 'seeker'
                ? 'Find and book nearby parking in seconds.'
                : user?.user_type === 'owner'
                ? 'Manage your spaces and track earnings.'
                : 'Manage the platform from here.'}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 w-full',
            'text-white/80 hover:bg-white/15 transition-colors'
          )}
        >
          <LogOut className="size-5 shrink-0" />
          {open && <span className="text-sm">Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
