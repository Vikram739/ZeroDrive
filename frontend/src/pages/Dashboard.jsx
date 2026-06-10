import { useEffect, useRef, useState } from 'react'
import {
  Plus,
  Upload,
  FolderPlus,
  Folder,
  FileText,
  Image,
  FileSpreadsheet,
  File,
  MoreVertical,
  Grid,
  List,
  Download,
  Pencil,
  Star,
  Trash2
} from 'lucide-react'
import content from '../config/content.json'

const MOCK_FILES = [
  { id: 1, name: 'Projects', type: 'folder', modified: 'Today', size: null },
  { id: 2, name: 'Resume.pdf', type: 'pdf', modified: 'Yesterday', size: '245 KB' },
  { id: 3, name: 'Profile photo.jpg', type: 'image', modified: 'Jun 5', size: '1.2 MB' },
  { id: 4, name: 'Notes.txt', type: 'text', modified: 'Jun 1', size: '12 KB' },
  { id: 5, name: 'Budget.xlsx', type: 'sheet', modified: 'May 28', size: '89 KB' }
]

function FileIcon({ type, size = 40 }) {
  switch (type) {
    case 'folder':
      return <Folder size={size} className="text-yellow-500" />
    case 'pdf':
      return <FileText size={size} className="text-red-500" />
    case 'image':
      return <Image size={size} className="text-blue-500" />
    case 'sheet':
      return <FileSpreadsheet size={size} className="text-green-500" />
    default:
      return <File size={size} className="text-zinc-400" />
  }
}

function FileActionsMenu({ openUp = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const actions = [
    { label: content.dashboard.actions.download, icon: Download },
    { label: content.dashboard.actions.rename, icon: Pencil },
    { label: content.dashboard.actions.star, icon: Star },
    { label: content.dashboard.actions.trash, icon: Trash2 }
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="File actions"
        className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div
          className={`absolute right-0 z-10 w-44 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 ${
            openUp ? 'bottom-full mb-1' : 'mt-1'
          }`}
        >
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.label}
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                <Icon size={15} />
                {action.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AddMenu({ variant = 'button' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const copy = content.dashboard.emptyState

  useEffect(() => {
    if (!open) return undefined
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const options = [
    { label: copy.buttonFile, icon: Upload },
    { label: copy.buttonFolder, icon: FolderPlus }
  ]

  return (
    <div className="relative inline-block" ref={ref}>
      {variant === 'circle' ? (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={copy.buttonFile}
          className="flex h-[88px] w-[88px] items-center justify-center rounded-full border-2 border-zinc-900 text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-50 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          <Plus size={32} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus size={16} />
          {content.dashboard.newButton}
        </button>
      )}

      {open && (
        <div
          className={`absolute z-10 mt-2 w-44 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 ${
            variant === 'circle'
              ? 'left-1/2 -translate-x-1/2'
              : 'right-0'
          }`}
        >
          {options.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.label}
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                <Icon size={15} />
                {option.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  const copy = content.dashboard.emptyState

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <AddMenu variant="circle" />

      <h2 className="mt-8 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        {copy.title}
      </h2>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        {copy.subtitle}
      </p>
    </div>
  )
}

function GridView({ files }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {files.map((file) => (
        <div
          key={file.id}
          className="group relative flex flex-col items-center rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          <div className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <FileActionsMenu />
          </div>
          <div className="flex h-16 items-center justify-center">
            <FileIcon type={file.type} />
          </div>
          <p className="mt-2 w-full truncate text-center text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {file.name}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {file.modified}
          </p>
        </div>
      ))}
    </div>
  )
}

function ListView({ files }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-3 font-medium">
              {content.dashboard.columns.name}
            </th>
            <th className="px-4 py-3 font-medium">
              {content.dashboard.columns.modified}
            </th>
            <th className="hidden px-4 py-3 font-medium sm:table-cell">
              {content.dashboard.columns.size}
            </th>
            <th className="px-4 py-3">
              <span className="sr-only">
                {content.dashboard.columns.actions}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {files.map((file, index) => (
            <tr
              key={file.id}
              className={`hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                index !== files.length - 1
                  ? 'border-b border-zinc-200 dark:border-zinc-800'
                  : ''
              }`}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileIcon type={file.type} size={20} />
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {file.name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                {file.modified}
              </td>
              <td className="hidden px-4 py-3 text-zinc-500 dark:text-zinc-400 sm:table-cell">
                {file.size ?? content.dashboard.emptySize}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end">
                  <FileActionsMenu openUp={index === files.length - 1 && files.length > 2} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Dashboard() {
  const [files] = useState(MOCK_FILES)
  const [view, setView] = useState('grid')

  const isEmpty = files.length === 0

  return (
    <div className="flex flex-1 lg:pl-60">
      <main className="flex w-full flex-1 flex-col px-4 py-6 sm:px-6">
        {isEmpty ? (
          <EmptyState />
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {content.dashboard.heading}
              </h1>
              <div className="flex items-center gap-3">
                <AddMenu variant="button" />
                <div className="flex items-center gap-1 rounded-md border border-zinc-200 p-0.5 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setView('grid')}
                  aria-label="Grid view"
                  className={`rounded p-1.5 ${
                    view === 'grid'
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
                  }`}
                >
                  <Grid size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setView('list')}
                  aria-label="List view"
                  className={`rounded p-1.5 ${
                    view === 'list'
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
                  }`}
                >
                  <List size={18} />
                </button>
                </div>
              </div>
            </div>

            {view === 'grid' ? (
              <GridView files={files} />
            ) : (
              <ListView files={files} />
            )}
          </>
        )}
      </main>
    </div>
  )
}
