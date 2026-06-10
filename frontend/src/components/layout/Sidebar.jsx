import { useEffect, useState } from 'react'
import { HardDrive, Clock, Star, Trash2, X } from 'lucide-react'
import content from '../../config/content.json'

const NAV_ITEMS = [
  { key: 'myDrive', label: content.sidebar.myDrive, icon: HardDrive },
  { key: 'recent', label: content.sidebar.recent, icon: Clock },
  { key: 'starred', label: content.sidebar.starred, icon: Star },
  { key: 'trash', label: content.sidebar.trash, icon: Trash2 }
]

function StorageMeter() {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const percent = 0
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="border-t border-zinc-200 px-5 py-5 dark:border-zinc-800">
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
            {percent}%
          </span>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {content.sidebar.storageInfo}
        </p>
      </div>
    </div>
  )
}

function SidebarNav({ active, setActive }) {
  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = active === item.key
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => setActive(item.key)}
            className={`flex w-full items-center gap-3 rounded-md border-l-[3px] px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'border-zinc-900 bg-zinc-100 text-zinc-900 dark:border-zinc-50 dark:bg-zinc-900 dark:text-zinc-50'
                : 'border-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
            }`}
          >
            <Icon size={18} />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}

export default function Sidebar() {
  const [active, setActive] = useState('myDrive')
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const open = () => setDrawerOpen(true)
    window.addEventListener('toggle-sidebar', open)
    return () => window.removeEventListener('toggle-sidebar', open)
  }, [])

  return (
    <>
      <aside className="fixed bottom-0 left-0 top-16 hidden w-60 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:flex">
        <SidebarNav active={active} setActive={setActive} />
        <StorageMeter />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute bottom-0 left-0 top-0 flex w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {content.brand.name}
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="rounded-md p-1.5 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                <X size={18} />
              </button>
            </div>
            <SidebarNav active={active} setActive={setActive} />
            <StorageMeter />
          </aside>
        </div>
      )}
    </>
  )
}
