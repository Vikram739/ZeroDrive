import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Sun, Moon, Search, MessageSquare, Menu, User, Lock, LogOut,
  Folder, File, ArrowLeft,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { searchItems } from '../../services/fileService'
import DropdownMenu, { DropdownMenuItem } from '../ui/DropdownMenu'
import content from '../../config/content.json'

const AVATAR_COLORS = ['bg-slate-700', 'bg-zinc-700', 'bg-stone-700', 'bg-neutral-700']

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

function isFolder(item) {
  return !('mime_type' in item)
}

function SearchResults({ results, onResultClick }) {
  const all = results
    ? [
        ...(results.folders ?? []).map((f) => ({ ...f, _kind: 'folder' })),
        ...(results.files ?? []).map((f) => ({ ...f, _kind: 'file' })),
      ]
    : []

  if (!results) return null

  return (
    <>
      {all.length === 0 ? (
        <p className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
          {content.navbar.noResults}
        </p>
      ) : (
        <ul className="max-h-72 overflow-y-auto py-1">
          {all.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onResultClick(item)}
                className="flex w-full min-h-[44px] items-center gap-3 px-4 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900 sm:min-h-0 sm:py-2.5"
              >
                {isFolder(item)
                  ? <Folder size={16} className="shrink-0 text-yellow-500" />
                  : <File size={16} className="shrink-0 text-zinc-400" />
                }
                <span className="truncate text-zinc-900 dark:text-zinc-50">{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default function Navbar() {
  const { user, isAuthenticated, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searchDropOpen, setSearchDropOpen] = useState(false)
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false)
  const searchRef = useRef(null)
  const searchDropRef = useRef(null)
  const overlayInputRef = useRef(null)
  const debounceRef = useRef(null)

  const isDashboard = location.pathname.startsWith('/dashboard')

  useEffect(() => {
    if (!searchDropOpen) return undefined
    const handler = (e) => {
      if (searchRef.current?.contains(e.target)) return
      if (searchDropRef.current?.contains(e.target)) return
      setSearchDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [searchDropOpen])

  useEffect(() => {
    if (searchOverlayOpen && overlayInputRef.current) {
      overlayInputRef.current.focus()
    }
  }, [searchOverlayOpen])

  const runSearch = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults(null); return }
    try {
      const data = await searchItems(q)
      setSearchResults(data)
    } catch {
      setSearchResults({ folders: [], files: [] })
    }
  }, [])

  function handleQueryChange(e) {
    const val = e.target.value
    setQuery(val)
    setSearchDropOpen(true)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(val), 300)
  }

  function handleResultClick(item) {
    setSearchDropOpen(false)
    setSearchOverlayOpen(false)
    setQuery('')
    setSearchResults(null)
    if (isFolder(item)) navigate(`/dashboard/folder/${item.id}`)
  }

  const handleSignOut = async () => {
    try { await signOut() } catch { /* ignore */ }
    navigate('/signin')
  }

  const openChatbot = () => window.dispatchEvent(new CustomEvent('open-chatbot'))
  const toggleSidebar = () => window.dispatchEvent(new CustomEvent('toggle-sidebar'))

  return (
    <>
      <header className="sticky top-0 z-40 h-[72px] border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex h-full items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:px-6">

          {/* Hamburger - mobile/tablet on dashboard */}
          {isAuthenticated && isDashboard && (
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Open menu"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900 lg:hidden"
            >
              <Menu size={20} />
            </button>
          )}

          {/* Logo */}
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-900 dark:bg-white">
              <span className="text-lg font-bold text-white dark:text-zinc-900">
                {content.brand.logoLetter}
              </span>
            </div>
            <span className="hidden text-base font-semibold text-zinc-900 dark:text-zinc-50 sm:inline">
              {content.brand.name}
            </span>
          </div>

          {/* Greeting - desktop only */}
          {isAuthenticated && (
            <div className="hidden items-center gap-3 lg:flex">
              <span className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {`${content.navbar.greeting}, ${getFirstName(user.name)}`}
              </span>
            </div>
          )}

          {/* Desktop/tablet search */}
          {isAuthenticated && (
            <div className="relative mx-auto hidden w-full max-w-sm sm:block lg:max-w-md" ref={searchRef}>
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                value={query}
                onChange={handleQueryChange}
                onFocus={() => { if (query.trim()) setSearchDropOpen(true) }}
                placeholder={content.navbar.searchPlaceholder}
                className="w-full rounded-md border border-zinc-200 bg-zinc-50 py-2 pl-8 pr-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-50/10"
              />
              {searchDropOpen && query.trim() && (
                <div
                  ref={searchDropRef}
                  className="absolute left-0 top-full z-50 mt-1.5 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <SearchResults results={searchResults} onResultClick={handleResultClick} />
                </div>
              )}
            </div>
          )}

          {/* Right actions */}
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {/* Mobile search icon */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setSearchOverlayOpen(true)}
                aria-label="Search"
                className="flex h-10 w-10 items-center justify-center rounded-md text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900 sm:hidden"
              >
                <Search size={20} />
              </button>
            )}

            {/* Chatbot - hidden on mobile */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={openChatbot}
                aria-label={content.chatbot.title}
                className="hidden h-10 w-10 items-center justify-center rounded-md text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900 sm:flex"
              >
                <MessageSquare size={20} />
              </button>
            )}

            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex h-10 w-10 items-center justify-center rounded-md text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Account menu */}
            {isAuthenticated && (
              <DropdownMenu
                label={user.name}
                itemCount={3}
                trigger={({ open, toggle }) => (
                  <button
                    type="button"
                    onClick={toggle}
                    aria-label="Account menu"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-medium text-white ring-2 transition-all ${
                      open
                        ? 'ring-zinc-400 dark:ring-zinc-500'
                        : 'ring-transparent hover:ring-zinc-300 dark:hover:ring-zinc-600'
                    } ${user.photoURL ? '' : getAvatarColor(user.name)}`}
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
                )}
              >
                <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {user.email}
                  </p>
                </div>
                <DropdownMenuItem label={content.navbar.menu.editProfile} icon={User} onClick={() => {}} />
                <DropdownMenuItem label={content.navbar.menu.changePassword} icon={Lock} onClick={() => {}} />
                <DropdownMenuItem label={content.navbar.menu.signOut} icon={LogOut} onClick={handleSignOut} danger />
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Mobile search overlay */}
      {searchOverlayOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-950 sm:hidden">
          <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => { setSearchOverlayOpen(false); setQuery(''); setSearchResults(null) }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              <ArrowLeft size={20} />
            </button>
            <input
              ref={overlayInputRef}
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder={content.navbar.searchPlaceholder}
              className="flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:text-zinc-100"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setSearchResults(null) }}
                className="flex h-10 w-10 items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {searchResults && (
              <SearchResults results={searchResults} onResultClick={handleResultClick} />
            )}
            {!searchResults && !query && (
              <p className="px-4 py-8 text-center text-sm text-zinc-400">
                {content.navbar.searchPlaceholder}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
