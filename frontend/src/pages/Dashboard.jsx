import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  RotateCcw,
  ArrowLeft,
} from 'lucide-react'
import content from '../config/content.json'
import { useFiles } from '../hooks/useFiles'
import {
  downloadFile,
  downloadFolderAsZip,
  getRecent,
  getStarred,
  getTrash,
  restoreFile,
  restoreFolder,
  deleteFile,
  deleteFolder,
  emptyTrash as emptyTrashApi,
  getFolder,
  uploadFile as uploadFileApi,
  createFolder as createFolderApi,
  updateFile,
  updateFolder,
} from '../services/fileService'
import { useAuth } from '../context/AuthContext'
import DropdownMenu, { DropdownMenuItem } from '../components/ui/DropdownMenu'
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

function FileActionsMenu({ item, onAction }) {
  const folder = isFolder(item)

  let actions
  if (item.is_trashed) {
    actions = [
      { label: c.actions.restore, icon: RotateCcw, onClick: () => onAction('restore', item) },
      { label: c.actions.deletePermanent, icon: Trash2, onClick: () => onAction('deletePermanent', item), danger: true },
    ]
  } else if (folder) {
    actions = [
      { label: c.actions.open, icon: Folder, onClick: () => onAction('open', item) },
      { label: c.actions.downloadFolder, icon: Download, onClick: () => onAction('download', item) },
      { label: c.actions.rename, icon: Pencil, onClick: () => onAction('rename', item) },
      { label: item.is_starred ? c.actions.unstar : c.actions.star, icon: Star, onClick: () => onAction('star', item) },
      { label: c.actions.trash, icon: Trash2, onClick: () => onAction('trash', item), danger: true },
    ]
  } else {
    actions = [
      { label: c.actions.download, icon: Download, onClick: () => onAction('download', item) },
      { label: c.actions.rename, icon: Pencil, onClick: () => onAction('rename', item) },
      { label: item.is_starred ? c.actions.unstar : c.actions.star, icon: Star, onClick: () => onAction('star', item) },
      { label: c.actions.trash, icon: Trash2, onClick: () => onAction('trash', item), danger: true },
    ]
  }

  return (
    <DropdownMenu label={item.name} itemCount={actions.length} trigger={({ open, toggle }) => (
      <button
        type="button"
        onClick={toggle}
        aria-label="Item actions"
        className={`rounded-md p-1.5 transition-colors active:opacity-70 ${
          open
            ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
            : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
        }`}
      >
        <MoreVertical size={16} />
      </button>
    )}>
      {actions.map((a) => (
        <DropdownMenuItem key={a.label} label={a.label} icon={a.icon} onClick={a.onClick} danger={a.danger} />
      ))}
    </DropdownMenu>
  )
}

function AddMenu({ variant = 'button', onUploadClick, onUploadFolderClick, onNewFolder }) {
  const copy = c.emptyState
  const options = [
    { label: copy.buttonFile, icon: Upload, onClick: onUploadClick },
    { label: copy.buttonUploadFolder, icon: FolderPlus, onClick: onUploadFolderClick },
    { label: copy.buttonFolder, icon: FolderPlus, onClick: onNewFolder },
  ]

  return (
    <DropdownMenu label={c.newButton} itemCount={3} trigger={({ open, toggle }) =>
      variant === 'circle' ? (
        <button
          type="button"
          onClick={toggle}
          aria-label={copy.buttonFile}
          className="flex h-[88px] w-[88px] items-center justify-center rounded-full border-2 border-zinc-900 text-zinc-900 transition-colors hover:bg-zinc-100 active:opacity-70 dark:border-zinc-50 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          <Plus size={32} />
        </button>
      ) : (
        <button
          type="button"
          onClick={toggle}
          className={`flex items-center gap-2 rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 active:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 ${
            open ? 'ring-2 ring-zinc-900/20 dark:ring-zinc-50/20' : ''
          }`}
        >
          <Plus size={16} />
          {c.newButton}
        </button>
      )
    }>
      {options.map((opt) => (
        <DropdownMenuItem key={opt.label} label={opt.label} icon={opt.icon} onClick={opt.onClick} />
      ))}
    </DropdownMenu>
  )
}

function EmptyState({ onUploadClick, onUploadFolderClick, onNewFolder }) {
  const copy = c.emptyState
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <AddMenu variant="circle" onUploadClick={onUploadClick} onUploadFolderClick={onUploadFolderClick} onNewFolder={onNewFolder} />
      <h2 className="mt-8 text-xl font-semibold text-zinc-900 dark:text-zinc-50">{copy.title}</h2>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{copy.subtitle}</p>
    </div>
  )
}

function GridView({ folders, files, onAction, draggedItem, onDragStart, onDragEnd, onDragOver, onDrop }) {
  const items = [
    ...folders.map((f) => ({ ...f, _kind: 'folder' })),
    ...files.map((f) => ({ ...f, _kind: 'file' })),
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => {
        const canDrop = isFolder(item) && draggedItem && draggedItem.id !== item.id
        return (
          <div
            key={item.id}
            draggable={!item.is_trashed}
            onDragStart={() => onDragStart(item)}
            onDragEnd={onDragEnd}
            onDragOver={canDrop ? (e) => onDragOver(e) : undefined}
            onDrop={canDrop ? (e) => onDrop(e, item) : undefined}
            onClick={() => { if (isFolder(item) && !item.is_trashed) onAction('open', item) }}
            className={`group relative flex flex-col items-center rounded-lg border p-3 transition-colors sm:p-4 ${
              isFolder(item) && !item.is_trashed ? 'cursor-pointer' : ''
            } ${
              canDrop
                ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-400 dark:bg-zinc-900'
                : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900'
            }`}
          >
            <div className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <FileActionsMenu item={item} onAction={onAction} />
            </div>
            <div className="flex h-12 items-center justify-center sm:h-14 md:h-16">
              <FileIcon item={item} size={36} />
            </div>
            <p className="mt-2 w-full truncate text-center text-xs font-medium text-zinc-900 dark:text-zinc-50 sm:text-sm">
              {item.name}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {formatDate(item.updated_at)}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function ListView({ folders, files, onAction, draggedItem, onDragStart, onDragEnd, onDragOver, onDrop }) {
  const items = [
    ...folders.map((f) => ({ ...f, _kind: 'folder' })),
    ...files.map((f) => ({ ...f, _kind: 'file' })),
  ]

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="px-3 py-3 font-medium sm:px-4">{c.columns.name}</th>
            <th className="hidden px-4 py-3 font-medium sm:table-cell">{c.columns.modified}</th>
            <th className="hidden px-4 py-3 font-medium md:table-cell">{c.columns.size}</th>
            <th className="px-3 py-3 sm:px-4"><span className="sr-only">{c.columns.actions}</span></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const canDrop = isFolder(item) && draggedItem && draggedItem.id !== item.id
            return (
              <tr
                key={item.id}
                draggable={!item.is_trashed}
                onDragStart={() => onDragStart(item)}
                onDragEnd={onDragEnd}
                onDragOver={canDrop ? (e) => onDragOver(e) : undefined}
                onDrop={canDrop ? (e) => onDrop(e, item) : undefined}
                onClick={() => { if (isFolder(item) && !item.is_trashed) onAction('open', item) }}
                className={`${isFolder(item) && !item.is_trashed ? 'cursor-pointer' : ''} ${
                  canDrop ? 'bg-zinc-50 dark:bg-zinc-900' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900'
                } ${idx !== items.length - 1 ? 'border-b border-zinc-200 dark:border-zinc-800' : ''}`}
              >
                <td className="px-3 py-3 sm:px-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FileIcon item={item} size={18} />
                    <span className="max-w-[140px] truncate font-medium text-zinc-900 dark:text-zinc-50 sm:max-w-xs">{item.name}</span>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-zinc-500 dark:text-zinc-400 sm:table-cell">
                  {formatDate(item.updated_at)}
                </td>
                <td className="hidden px-4 py-3 text-zinc-500 dark:text-zinc-400 md:table-cell">
                  {isFolder(item) ? c.emptySize : formatBytes(item.size_bytes)}
                </td>
                <td className="px-3 py-3 text-right sm:px-4">
                  <div className="flex justify-end">
                    <FileActionsMenu item={item} onAction={onAction} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function Dashboard({ view = 'myDrive', folderId = null }) {
  const { refreshUser } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const folderInputRef = useRef(null)
  const filesHook = useFiles(view === 'myDrive' ? folderId : null)

  const [viewData, setViewData] = useState({ folders: [], files: [] })
  const [folderName, setFolderName] = useState(null)
  const [uploadList, setUploadList] = useState([])
  const [displayMode, setDisplayMode] = useState('grid')
  const [draggedItem, setDraggedItem] = useState(null)

  const [showNewFolder, setShowNewFolder] = useState(false)
  const [showRename, setShowRename] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showConfirmPermanent, setShowConfirmPermanent] = useState(false)
  const [showConfirmEmptyTrash, setShowConfirmEmptyTrash] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    if (view !== 'myDrive' || !folderId) return undefined
    let active = true
    getFolder(folderId)
      .then((data) => { if (active && data) setFolderName(data.name) })
      .catch(() => {})
    return () => { active = false }
  }, [view, folderId])

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
  const isMyDrive = view === 'myDrive'
  const isEmpty = displayFolders.length === 0 && displayFiles.length === 0

  function handleUploadClick() { fileInputRef.current?.click() }
  function handleUploadFolderClick() { folderInputRef.current?.click() }

  async function handleFileChange(e) {
    const picked = Array.from(e.target.files || [])
    e.target.value = ''
    for (const file of picked) {
      const id = crypto.randomUUID()
      setUploadList((prev) => [...prev, { id, filename: file.name, progress: 0, status: 'uploading' }])
      try {
        await filesHook.uploadFile(file, (p) => {
          setUploadList((prev) => prev.map((u) => (u.id === id ? { ...u, ...p } : u)))
        })
        setUploadList((prev) => prev.map((u) => (u.id === id ? { ...u, progress: 100, status: 'complete' } : u)))
        refreshUser()
      } catch (err) {
        setUploadList((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'failed' } : u)))
        setErrorMsg(err.message)
      }
    }
  }

  async function handleFolderChange(e) {
    const allFiles = Array.from(e.target.files || [])
    e.target.value = ''
    if (!allFiles.length) return

    const rootName = allFiles[0].webkitRelativePath.split('/')[0]
    const folderIdMap = new Map()
    const folderPaths = []

    for (const file of allFiles) {
      const parts = file.webkitRelativePath.split('/')
      for (let depth = 1; depth < parts.length; depth++) {
        const p = parts.slice(0, depth).join('/')
        if (!folderIdMap.has(p)) {
          folderIdMap.set(p, null)
          folderPaths.push(p)
        }
      }
    }

    const uploadId = crypto.randomUUID()
    setUploadList((prev) => [
      ...prev,
      { id: uploadId, filename: `${rootName}/`, progress: 0, status: 'uploading', currentFile: 0, totalFiles: allFiles.length, isFolder: true },
    ])

    try {
      for (const folderPath of folderPaths) {
        const parts = folderPath.split('/')
        const name = parts[parts.length - 1]
        const parentPath = parts.length > 1 ? parts.slice(0, -1).join('/') : null
        const parentId = parentPath ? folderIdMap.get(parentPath) : folderId
        const created = await createFolderApi(name, parentId)
        folderIdMap.set(folderPath, created.id)
      }

      let done = 0
      for (const file of allFiles) {
        const parts = file.webkitRelativePath.split('/')
        const parentPath = parts.slice(0, -1).join('/')
        const targetId = folderIdMap.get(parentPath) ?? folderId
        await uploadFileApi(file, targetId, () => {})
        done++
        setUploadList((prev) =>
          prev.map((u) =>
            u.id === uploadId
              ? { ...u, progress: Math.round((done / allFiles.length) * 100), currentFile: done }
              : u
          )
        )
      }

      setUploadList((prev) => prev.map((u) => (u.id === uploadId ? { ...u, progress: 100, status: 'complete' } : u)))
      filesHook.refresh()
      refreshUser()
    } catch (err) {
      setUploadList((prev) => prev.map((u) => (u.id === uploadId ? { ...u, status: 'failed' } : u)))
      setErrorMsg(err.message)
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

  function handleDragStart(item) { setDraggedItem(item) }
  function handleDragEnd() { setDraggedItem(null) }
  function handleDragOver(e) { e.preventDefault() }

  async function handleDrop(e, targetFolder) {
    e.preventDefault()
    if (!draggedItem) return
    setDraggedItem(null)
    try {
      if (isFolder(draggedItem)) {
        await updateFolder(draggedItem.id, { parent_id: targetFolder.id })
      } else {
        await updateFile(draggedItem.id, { folder_id: targetFolder.id })
      }
      filesHook.refresh()
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  const handleAction = useCallback(
    async (action, item) => {
      if (action === 'open') {
        navigate(`/dashboard/folder/${item.id}`)
        return
      }
      if (action === 'download') {
        try {
          if (isFolder(item)) {
            await downloadFolderAsZip(item.id, item.name)
          } else {
            await downloadFile(item.id, item.name)
          }
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
        try { await filesHook.starItem(item) } catch (err) { setErrorMsg(err.message) }
        return
      }
      if (action === 'trash') {
        setSelectedItem(item)
        setShowConfirmDelete(true)
        return
      }
      if (action === 'restore') {
        try {
          if (isFolder(item)) {
            await restoreFolder(item.id)
          } else {
            await restoreFile(item.id)
          }
          setViewData((prev) => ({
            folders: prev.folders.filter((f) => f.id !== item.id),
            files: prev.files.filter((f) => f.id !== item.id),
          }))
        } catch (err) {
          setErrorMsg(err.message)
        }
        return
      }
      if (action === 'deletePermanent') {
        setSelectedItem(item)
        setShowConfirmPermanent(true)
      }
    },
    [filesHook, navigate],
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

  async function handleConfirmPermanent() {
    if (!selectedItem) return
    try {
      if (isFolder(selectedItem)) {
        await deleteFolder(selectedItem.id, true)
      } else {
        await deleteFile(selectedItem.id, true)
      }
      setViewData((prev) => ({
        folders: prev.folders.filter((f) => f.id !== selectedItem.id),
        files: prev.files.filter((f) => f.id !== selectedItem.id),
      }))
      setSelectedItem(null)
      setShowConfirmPermanent(false)
      refreshUser()
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  async function handleEmptyTrash() {
    try {
      await emptyTrashApi()
      setViewData({ folders: [], files: [] })
      setShowConfirmEmptyTrash(false)
      refreshUser()
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  function dismissUpload(id) {
    setUploadList((prev) => prev.filter((u) => u.id !== id))
  }

  const breadcrumb = folderId ? (
    <nav className="mb-1 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-50 sm:hidden"
      >
        <ArrowLeft size={12} />
        <span>{c.breadcrumb.root}</span>
      </button>
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="hidden hover:text-zinc-900 dark:hover:text-zinc-50 sm:inline"
      >
        {c.breadcrumb.root}
      </button>
      <span className="hidden sm:inline">/</span>
      <span className="hidden text-zinc-900 dark:text-zinc-50 sm:inline">{folderName ?? '...'}</span>
    </nav>
  ) : null

  const headingText = folderId && folderName ? folderName : VIEW_HEADINGS[view]

  const dragProps = {
    draggedItem,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  }

  return (
    <>
      <main className="flex w-full flex-1 flex-col px-3 py-4 sm:px-6 sm:py-6">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader size={28} className="animate-spin text-zinc-400" />
          </div>
        ) : isEmpty && isMyDrive && !folderId ? (
          <EmptyState
            onUploadClick={handleUploadClick}
            onUploadFolderClick={handleUploadFolderClick}
            onNewFolder={() => setShowNewFolder(true)}
          />
        ) : (
          <>
            <div className="mb-4 flex items-start justify-between gap-3 sm:mb-6">
              <div className="min-w-0">
                {breadcrumb}
                <h1 className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-50 sm:text-xl">{headingText}</h1>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                {view === 'trash' && !isEmpty && (
                  <button
                    type="button"
                    onClick={() => setShowConfirmEmptyTrash(true)}
                    className="flex items-center gap-1.5 rounded-md border border-red-200 px-2.5 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 active:opacity-70 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 sm:gap-2 sm:px-3.5 sm:text-sm"
                  >
                    <Trash2 size={14} />
                    <span className="hidden sm:inline">{c.emptyTrash}</span>
                  </button>
                )}
                {isMyDrive && (
                  <AddMenu
                    variant="button"
                    onUploadClick={handleUploadClick}
                    onUploadFolderClick={handleUploadFolderClick}
                    onNewFolder={() => setShowNewFolder(true)}
                  />
                )}
                <div className="flex items-center gap-0.5 rounded-md border border-zinc-200 p-0.5 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setDisplayMode('grid')}
                    aria-label="Grid view"
                    className={`rounded p-1.5 transition-colors ${
                      displayMode === 'grid'
                        ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
                    }`}
                  >
                    <Grid size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode('list')}
                    aria-label="List view"
                    className={`rounded p-1.5 transition-colors ${
                      displayMode === 'list'
                        ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
                    }`}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {isEmpty ? (
              <div className="flex flex-1 items-center justify-center py-20">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{c.emptyOtherTitle}</p>
              </div>
            ) : displayMode === 'grid' ? (
              <GridView folders={displayFolders} files={displayFiles} onAction={handleAction} {...dragProps} />
            ) : (
              <ListView folders={displayFolders} files={displayFiles} onAction={handleAction} {...dragProps} />
            )}
          </>
        )}

        {filesHook.error && (
          <p className="mt-4 text-center text-sm text-red-500">{filesHook.error}</p>
        )}
      </main>

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
      <input ref={folderInputRef} type="file" webkitdirectory="" className="hidden" onChange={handleFolderChange} />

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

      <ConfirmDialog
        isOpen={showConfirmPermanent}
        onClose={() => { setShowConfirmPermanent(false); setSelectedItem(null) }}
        title={c.dialogs.confirmDeletePermanent.title}
        subtitle={c.dialogs.confirmDeletePermanent.subtitle}
        cancelLabel={c.dialogs.confirmDeletePermanent.cancel}
        confirmLabel={c.dialogs.confirmDeletePermanent.confirm}
        onConfirm={handleConfirmPermanent}
      />

      <ConfirmDialog
        isOpen={showConfirmEmptyTrash}
        onClose={() => setShowConfirmEmptyTrash(false)}
        title={c.dialogs.emptyTrash.title}
        subtitle={c.dialogs.emptyTrash.subtitle}
        cancelLabel={c.dialogs.emptyTrash.cancel}
        confirmLabel={c.dialogs.emptyTrash.confirm}
        onConfirm={handleEmptyTrash}
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
    </>
  )
}
