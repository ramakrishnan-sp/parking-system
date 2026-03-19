import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  Car, Bell, Menu, X, MapPin, LogOut,
  LayoutDashboard, User, Settings, ChevronDown,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { logout as apiLogout } from '../../api/auth'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen]     = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = async () => {
    const rToken = localStorage.getItem('refresh_token')
    if (rToken) {
      try { await apiLogout(rToken) } catch {}
    }
    logout()
    navigate('/login')
  }

  const navLinks = user
    ? user.user_type === 'seeker'
      ? [
          { to: '/map',      label: 'Find Parking', icon: <MapPin size={16} /> },
          { to: '/bookings', label: 'My Bookings',  icon: <Car size={16} /> },
        ]
      : user.user_type === 'owner'
      ? [
          { to: '/owner',       label: 'My Spaces',    icon: <LayoutDashboard size={16} /> },
          { to: '/owner/bookings', label: 'Bookings',  icon: <Car size={16} /> },
        ]
      : [
          { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
        ]
    : []

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Car size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">ParkEase</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Notification bell */}
                <button className="hidden md:flex p-2 rounded-lg hover:bg-gray-100 relative text-gray-600">
                  <Bell size={20} />
                </button>

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    {user.profile_photo_url ? (
                      <img
                        src={user.profile_photo_url}
                        alt="Profile"
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
                        {user.full_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="hidden md:block text-sm font-medium text-gray-800 max-w-24 truncate">
                      {user.full_name?.split(' ')[0]}
                    </span>
                    <ChevronDown size={14} className="text-gray-500" />
                  </button>

                  {profileOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setProfileOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-float border border-gray-100 z-20 animate-fade-in">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user.full_name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          <span className={`mt-1 badge ${
                            user.user_type === 'admin'  ? 'badge-blue' :
                            user.user_type === 'owner'  ? 'badge-green' : 'badge-gray'
                          }`}>
                            {user.user_type}
                          </span>
                        </div>
                        <div className="p-1.5">
                          <Link
                            to="/profile"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                          >
                            <User size={15} /> Profile
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <LogOut size={15} /> Sign out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm hidden md:block">Sign in</Link>
                <Link to="/register" className="btn-primary text-sm">Get started</Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-gray-100 animate-slide-up">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg mx-1 ${
                  isActive(link.to)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.icon} {link.label}
              </Link>
            ))}
            {user && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg mx-1 mt-1"
              >
                <LogOut size={15} /> Sign out
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
