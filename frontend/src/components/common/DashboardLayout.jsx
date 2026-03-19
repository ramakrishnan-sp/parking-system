import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto px-2 py-3 sm:px-4 sm:py-5">
        {/* Outer rounded card */}
        <div className="rounded-3xl bg-card shadow-card ring-1 ring-border overflow-hidden">

          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <div className="flex h-[95vh]">
            {/* Sidebar */}
            <div
              className={`
                fixed inset-y-0 left-0 z-50
                lg:relative lg:z-auto
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              `}
            >
              <Sidebar
                mobileOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
              />
            </div>

            {/* Main content */}
            <main className="flex-1 min-w-0 bg-muted rounded-b-3xl lg:rounded-r-3xl lg:rounded-bl-none overflow-auto px-4 py-3 sm:px-6 sm:py-5 md:px-8">
              <Topbar onMenuClick={() => setSidebarOpen(true)} />
              <div key={location.pathname} className="animate-fade-in">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}

