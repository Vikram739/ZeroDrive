import { useCallback, useEffect, useRef, useState } from 'react'
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
  Trash2,
  Loader,
  X,
} from 'lucide-react'
import content from '../config/content.json'
import { useFiles } from '../hooks/useFiles'
import { downloadFile, getRecent, getStarred, getTrash } from '../services/fileService'
import NewFolderDialog from '../components/dialogs/NewFolderDialog'
import RenameDialog from '../components/dialogs/RenameDialog'
import ConfirmDialog from '../components/dialogs/ConfirmDialog'
import UploadProgress from '../components/upload/UploadProgress'

const c = content.dashboard

const VIEW_HEADINGS = {
  myDrive: c.heading,
  recent: content.sidebar.recent,
  starred: content.sidebar.starred,
  trash: content.sidebar.trash,
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatDate(isoStr) {
  if (!isoStr) return '--'
  const date = new Date(isoStr)
  const diff = Date.now() - date.getTime()
  if (diff < 86400000) return 'Today'
  if (diff < 172800000) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function mimeToIconType(mimeType) {
  if (!mimeType) return 'file'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.startsWith('text/')) return 'text'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'sheet'
  return 'file'
}

function isFolder(item) {
  return !('mime_type' in item)
}

function FileIcon({ item, size = 40 }) {
  if (isFolder(item)) return <Folder size={size} className="text-yellow-500" />
  const type = mimeToIconType(item.mime_type)
  switch (type) {
    case 'pdf': return <FileText size={size} className="text-red-500" />
    case 'image': return <Image size={size} className="text-blue-500" />
    case 'sheet': return <FileSpreadsheet size={size} className="text-green-500" />
    case 'text': return <FileText size={size} className="text-zinc-500" />
    default: return <File size={size} className="text-zinc-400" />
  }
}

function FileActionsMenu({ item, onOpen, onDownload, onRename, onStar, onTrash, openUp = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const folder = isFolder(item)

  useEffect(() => {
    if (!open) return undefined
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const actions = folder
    ? [
        { label: c.actions.open, icon: Folder, onClick: onOpen },
        { label: c.actions.rename, icon: Pencil, onClick: onRename },
        { label: item.is_starred ? c.actions.unstar : c.actions.star, icon: Star, onClick: onStar },
        { label: c.actions.trash, icon: Trash2, onClick: onTrash, danger: true },
      ]
    : [
        { label: c.actions.download, icon: Download, onClick: onDownload },
        { label: c.actions.rename, icon: Pencil, onClick: onRename },
        { label: item.is_starred ? c.actions.unstar : c.actions.star, icon: Star, onClick: onStar },
        { label: c.actions.trash, icon: Trash2, onClick: onTrash, danger: true },
      ]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p) }}
        aria-label="Item actions"
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
                onClick={() => { setOpen(false); action.onClick?.() }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900 ${
                  action.danger
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-zinc-700 dark:text-zinc-300'
                }`}
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

function AddMenu({ variant = 'button', onUploadClick, onNewFolder }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const copy = c.emptyState

  useEffect(() => {
    if (!open) return undefined
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const options = [
    { label: copy.buttonFile, icon: Upload, onClick: onUploadClick },
    { label: copy.buttonFolder, icon: FolderPlus, onClick: onNewFolder },
  ]

  return (
    <div className="relative inline-block" ref={ref}>
      {variant === 'circle' ? (
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          aria-label={copy.buttonFile}
          className="flex h-[88px] w-[88px] items-center justify-center rounded-full border-2 border-zinc-900 text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-50 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          <Plus size={32} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="flex items-center gap-2 rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus size={16} />
          {c.newButton}
        </button>
      )}
      {open && (
        <div
          className={`absolute z-10 mt-2 w-44 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 ${
            variant === 'circle' ? 'left-1/2 -translate-x-1/2' : 'right-0'
          }`}
        >
          {options.map((opt) => {
            const Icon = opt.icon
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => { setOpen(false); opt.onClick?.() }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                <Icon size={15} />
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EmptyState({ onUploadClick, onNewFolder }) {
  const copy = c.emptyState
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <AddMenu variant="circle" onUploadClick={onUploadClick} onNewFolder={onNewFolder} />
      <h2 className="mt-8 text-xl font-semibold text-zinc-900 dark:text-zinc-50">{copy.title}</h2>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{copy.subtitle}</p>
    </div>
  )
}

function GridView({ folders, files, onAction }) {
  const items = [
    ...folders.map((f) => ({ ...f, _kind: 'folder' })),
    ...files.map((f) => ({ ...f, _kind: 'file' })),
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item, idx) => (
        <div
          key={item.id}
          className="group relative flex flex-col items-center rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          <div className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <FileActionsMenu
              item={item}
              onOpen={() => onAction('open', item)}
              onDownload={() => onAction('download', item)}
              onRename={() => onAction('rename', item)}
              onStar={() => onAction('star', item)}
              onTrash={() => onAction('trash', item)}
              openUp={idx >= items.length - 3}
            />
          </div>
          <div className="flex h-16 items-center justify-center">
            <FileIcon item={item} />
          </div>
          <p className="mt-2 w-full truncate text-center text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {item.name}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {formatDate(item.updated_at)}
          </p>
        </div>
      ))}
    </div>
  )
}

function ListView({ folders, files, onAction }) {
  const items = [
    ...folders.map((f) => ({ ...f, _kind: 'folder' })),
    ...files.map((f) => ({ ...f, _kind: 'file' })),
  ]

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-3 font-medium">{c.columns.name}</th>
            <th className="px-4 py-3 font-medium">{c.columns.modified}</th>
            <th className="hidden px-4 py-3 font-medium sm:table-cell">{c.columns.size}</th>
            <th className="px-4 py-3">
              <span className="sr-only">{c.columns.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr
              key={item.id}
              className={`hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                idx !== items.length - 1 ? 'border-b border-zinc-200 dark:border-zinc-800' : ''
              }`}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileIcon item={item} size={20} />
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">{item.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                {formatDate(item.updated_at)}
              </td>
              <td className="hidden px-4 py-3 text-zinc-500 dark:text-zinc-400 sm:table-cell">
                {isFolder(item) ? c.emptySize : formatBytes(item.size_bytes)}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end">
                  <FileActionsMenu
                    item={item}
                    onOpen={() => onAction('open', item)}
                    onDownload={() => onAction('download', item)}
                    onRename={() => onAction('rename', item)}
                    onStar={() => onAction('star', item)}
                    onTrash={() => onAction('trash', item)}
                    openUp={idx >= items.length - 2}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Dashboard({ view = 'myDrive' }) {
  const fileInputRef = useRef(null)
  const filesHook = useFiles(null)

  const [viewData, setViewData] = useState({ folders: [], files: [] })

  const [uploadList, setUploadList] = useState([])
  const [displayMode, setDisplayMode] = useState('grid')

  const [showNewFolder, setShowNewFolder] = useState(false)
  const [showRename, setShowRename] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    if (view === 'myDrive') return undefined
    const fetchers = { recent: getRecent, starred: getStarred, trash: getTrash }
    const fetcher = fetchers[view]
    if (!fetcher) return undefined
    let active = true
    fetcher()
      .then((data) => { if (active) setViewData(data ?? { folders: [], files: [] }) })
      .catch((err) => { if (active) setErrorMsg(err.message) })
    return () => { active = false }
  }, [view])

  useEffect(() => {
    if (!errorMsg) return undefined
    const t = setTimeout(() => setErrorMsg(null), 5000)
    return () => clearTimeout(t)
  }, [errorMsg])

  const displayFolders = view === 'myDrive' ? filesHook.folders : (viewData.folders ?? [])
  const displayFiles = view === 'myDrive' ? filesHook.files : (viewData.files ?? [])
  const loading = view === 'myDrive' ? filesHook.loading : false

  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(e) {
    const picked = Array.from(e.target.files || [])
    e.target.value = ''
    for (const file of picked) {
      const id = crypto.randomUUID()
      setUploadList((prev) => [...prev, { id, filename: file.name, progress: 0, status: 'uploading' }])
      try {
        await filesHook.uploadFile(file, (p) => {
          setUploadList((prev) => prev.map((u) => (u.id === id ? { ...u, progress: p } : u)))
        })
        setUploadList((prev) => prev.map((u) => (u.id === id ? { ...u, progress: 100, status: 'complete' } : u)))
      } catch (err) {
        setUploadList((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'failed' } : u)))
        setErrorMsg(err.message)
      }
    }
  }

  async function handleNewFolder(name) {
    try {
      await filesHook.createFolder(name)
      setShowNewFolder(false)
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  const handleAction = useCallback(
    async (action, item) => {
      if (action === 'open') return
      if (action === 'download') {
        try {
          await downloadFile(item.id, item.name)
        } catch (err) {
          setErrorMsg(err.message)
        }
        return
      }
      if (action === 'rename') {
        setSelectedItem(item)
        setShowRename(true)
        return
      }
      if (action === 'star') {
        try {
          await filesHook.starItem(item)
        } catch (err) {
          setErrorMsg(err.message)
        }
        return
      }
      if (action === 'trash') {
        setSelectedItem(item)
        setShowConfirmDelete(true)
      }
    },
    [filesHook],
  )

  async function handleSaveRename(newName) {
    if (!selectedItem) return
    try {
      if (isFolder(selectedItem)) {
        await filesHook.renameFolder(selectedItem.id, newName)
      } else {
        await filesHook.renameFile(selectedItem.id, newName)
      }
      setShowRename(false)
      setSelectedItem(null)
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  async function handleConfirmTrash() {
    if (!selectedItem) return
    try {
      if (isFolder(selectedItem)) {
        await filesHook.deleteFolder(selectedItem.id)
      } else {
        await filesHook.deleteFile(selectedItem.id)
      }
      setSelectedItem(null)
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  function dismissUpload(id) {
    setUploadList((prev) => prev.filter((u) => u.id !== id))
  }

  const isMyDrive = view === 'myDrive'
  const isEmpty = displayFolders.length === 0 && displayFiles.length === 0

  return (
    <div className="flex flex-1 lg:pl-60">
      <main className="flex w-full flex-1 flex-col px-4 py-6 sm:px-6">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader size={28} className="animate-spin text-zinc-400" />
          </div>
        ) : isEmpty && isMyDrive ? (
          <EmptyState onUploadClick={handleUploadClick} onNewFolder={() => setShowNewFolder(true)} />
        ) : isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{c.emptyOtherTitle}</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {VIEW_HEADINGS[view]}
              </h1>
              <div className="flex items-center gap-3">
                {isMyDrive && (
                  <AddMenu
                    variant="button"
                    onUploadClick={handleUploadClick}
                    onNewFolder={() => setShowNewFolder(true)}
                  />
                )}
                <div className="flex items-center gap-1 rounded-md border border-zinc-200 p-0.5 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setDisplayMode('grid')}
                    aria-label="Grid view"
                    className={`rounded p-1.5 ${
                      displayMode === 'grid'
                        ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
                    }`}
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode('list')}
                    aria-label="List view"
                    className={`rounded p-1.5 ${
                      displayMode === 'list'
                        ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
                    }`}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>

            {displayMode === 'grid' ? (
              <GridView folders={displayFolders} files={displayFiles} onAction={handleAction} />
            ) : (
              <ListView folders={displayFolders} files={displayFiles} onAction={handleAction} />
            )}
          </>
        )}

        {filesHook.error && (
          <p className="mt-4 text-center text-sm text-red-500">{filesHook.error}</p>
        )}
      </main>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <NewFolderDialog
        key={showNewFolder ? 'nf-open' : 'nf-closed'}
        isOpen={showNewFolder}
        onClose={() => setShowNewFolder(false)}
        onCreate={handleNewFolder}
      />

      <RenameDialog
        key={selectedItem?.id ?? 'rename-closed'}
        isOpen={showRename}
        onClose={() => { setShowRename(false); setSelectedItem(null) }}
        currentName={selectedItem?.name ?? ''}
        onSave={handleSaveRename}
      />

      <ConfirmDialog
        isOpen={showConfirmDelete}
        onClose={() => { setShowConfirmDelete(false); setSelectedItem(null) }}
        title={c.dialogs.confirmDelete.title}
        subtitle={c.dialogs.confirmDelete.subtitle}
        cancelLabel={c.dialogs.confirmDelete.cancel}
        confirmLabel={c.dialogs.confirmDelete.confirm}
        onConfirm={handleConfirmTrash}
      />

      <UploadProgress uploads={uploadList} onDismiss={dismissUpload} />

      {errorMsg && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          <span className="text-sm text-zinc-900 dark:text-zinc-50">{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
