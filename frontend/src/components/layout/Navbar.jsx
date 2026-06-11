import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Sun,
  Moon,
  Search,
  MessageSquare,
  Menu,
  User,
  Lock,
  LogOut
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import content from '../../config/content.json'

const AVATAR_COLORS = [
  'bg-slate-700',
  'bg-zinc-700',
  'bg-stone-700',
  'bg-neutral-700'
]

function getFirstName(name) {
  if (!name) return ''
  return name.trim().split(/\s+/)[0]
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function Navbar() {
  const { user, isAuthenticated, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const isDashboard = location.pathname.startsWith('/dashboard')

  useEffect(() => {
    if (!menuOpen) return undefined
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const handleSignOut = async () => {
    setMenuOpen(false)
    try {
      await signOut()
    } catch {
      // ignore sign-out errors
    }
    navigate('/signin')
  }

  const openChatbot = () => {
    window.dispatchEvent(new CustomEvent('open-chatbot'))
  }

  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggle-sidebar'))
  }

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex h-full items-center gap-3 px-4 sm:px-6">
        {isAuthenticated && isDashboard && (
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Open menu"
            className="-ml-1 rounded-md p-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900 lg:hidden"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-900 dark:bg-white">
            <span className="text-lg font-bold text-white dark:text-zinc-900">
              {content.brand.logoLetter}
            </span>
          </div>
          <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {content.brand.name}
          </span>
        </div>

        {isAuthenticated && (
          <div className="hidden items-center gap-3 sm:flex">
            <span className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {`${content.navbar.greeting}, ${getFirstName(user.name)}`}
            </span>
          </div>
        )}

        {isAuthenticated && (
          <div className="mx-auto hidden w-full max-w-md md:block">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                placeholder={content.navbar.searchPlaceholder}
                className="w-full rounded-md border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-50/10"
              />
            </div>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          {isAuthenticated && (
            <button
              type="button"
              onClick={openChatbot}
              aria-label={content.chatbot.title}
              className="rounded-md p-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              <MessageSquare size={20} />
            </button>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-md p-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {isAuthenticated && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Account menu"
                className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-medium text-white ${user.photoURL ? '' : getAvatarColor(user.name)}`}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  getInitials(user.name)
                )}
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="px-4 py-3">
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {user.email}
                    </p>
                  </div>
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
                  <nav className="py-1">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    >
                      <User size={16} />
                      {content.navbar.menu.editProfile}
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    >
                      <Lock size={16} />
                      {content.navbar.menu.changePassword}
                    </button>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    >
                      <LogOut size={16} />
                      {content.navbar.menu.signOut}
                    </button>
                  </nav>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
