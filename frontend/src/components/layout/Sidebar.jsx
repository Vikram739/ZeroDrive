import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { HardDrive, Clock, Star, Trash2, X } from 'lucide-react'
import content from '../../config/content.json'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { path: '/dashboard', label: content.sidebar.myDrive, icon: HardDrive, end: true },
  { path: '/dashboard/recent', label: content.sidebar.recent, icon: Clock, end: false },
  { path: '/dashboard/starred', label: content.sidebar.starred, icon: Star, end: false },
  { path: '/dashboard/trash', label: content.sidebar.trash, icon: Trash2, end: false },
]

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

const STORAGE_CAP = 100 * 1024 * 1024 * 1024

function StorageMeter() {
  const { user } = useAuth()
  const used = user?.storage_used_bytes ?? 0
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(used / STORAGE_CAP, 1)
  const offset = circumference * (1 - pct)
  const displayPct = Math.round(pct * 100)

  return (
    <div className="border-t border-zinc-200 bg-white px-5 py-5 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {content.sidebar.storageLabel}
      </p>
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16 shrink-0">
          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              strokeWidth="6"
              className="stroke-zinc-200 dark:stroke-zinc-800"
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="stroke-zinc-900 dark:stroke-zinc-50"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-zinc-900 dark:text-zinc-50">
            {displayPct}%
          </span>
        </div>
        <p className="text-sm leading-snug text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{formatBytes(used)}</span>
          <br />
          {content.sidebar.storageInfo}
        </p>
      </div>
    </div>
  )
}

function SidebarNav() {
  const activeClass =
    'border-zinc-900 bg-zinc-100 text-zinc-900 dark:border-zinc-50 dark:bg-zinc-900 dark:text-zinc-50'
  const inactiveClass =
    'border-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex w-full items-center gap-3 rounded-md border-l-[3px] px-3 py-2.5 text-sm font-medium transition-colors lg:py-2 ${
                isActive ? activeClass : inactiveClass
              }`
            }
          >
            <Icon size={18} />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

export default function Sidebar() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const open = () => setDrawerOpen(true)
    window.addEventListener('toggle-sidebar', open)
    return () => window.removeEventListener('toggle-sidebar', open)
  }, [])

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  return (
    <>
      {/* Desktop sidebar - flex child in the layout row */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:flex">
        <SidebarNav />
        <StorageMeter />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute bottom-0 left-0 top-0 flex w-72 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {content.brand.name}
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="flex h-11 w-11 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                <X size={20} />
              </button>
            </div>
            <SidebarNav />
            <StorageMeter />
          </aside>
        </div>
      )}
    </>
  )
}
