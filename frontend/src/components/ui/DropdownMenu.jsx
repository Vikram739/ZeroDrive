import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

const MENU_W = 200

function computeStyle(el, itemCount) {
  const r = el.getBoundingClientRect()
  const estimatedH = Math.min(itemCount * 44 + 16, 360)
  let top = r.bottom + 4
  let left = r.right - MENU_W
  if (left < 8) left = 8
  if (left + MENU_W > window.innerWidth - 8) left = window.innerWidth - MENU_W - 8
  if (top + estimatedH > window.innerHeight - 8) top = r.top - estimatedH - 4
  if (top < 8) top = 8
  return { top, left, width: MENU_W }
}

export function DropdownMenuItem({ label, icon: Icon, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full min-h-[44px] items-center gap-3 px-4 text-sm transition-colors active:opacity-70 sm:min-h-0 sm:py-2.5 ${
        danger
          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950'
          : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900'
      }`}
    >
      {Icon && <Icon size={16} className="shrink-0" />}
      <span>{label}</span>
    </button>
  )
}

export default function DropdownMenu({ label, itemCount = 4, trigger, children }) {
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState({})
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  function toggle(e) {
    e.stopPropagation()
    if (!open && !isMobile && triggerRef.current) {
      setStyle(computeStyle(triggerRef.current, itemCount))
    }
    setOpen((p) => !p)
  }

  useEffect(() => {
    if (!open) return undefined
    function close(e) {
      if (panelRef.current?.contains(e.target)) return
      if (triggerRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
    }
  }, [open])

  const panel = !open ? null : isMobile
    ? createPortal(
        <div
          className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/40"
          onMouseDown={() => setOpen(false)}
          onTouchStart={() => setOpen(false)}
        >
          <div
            ref={panelRef}
            className="w-full rounded-t-2xl border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {label ?? 'Actions'}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                <X size={18} />
              </button>
            </div>
            <div className="pb-6 pt-1" onClick={() => setOpen(false)}>
              {children}
            </div>
          </div>
        </div>,
        document.body
      )
    : createPortal(
        <div
          ref={panelRef}
          style={style}
          className="fixed z-[60] overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>,
        document.body
      )

  return (
    <>
      <div ref={triggerRef} className="inline-flex">
        {trigger({ open, toggle })}
      </div>
      {panel}
    </>
  )
}
