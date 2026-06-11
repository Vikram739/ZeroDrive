import { useEffect, useRef } from 'react'
import {
  X, CheckCircle, AlertCircle, Loader,
  FileText, Image, FileSpreadsheet, File, Folder,
} from 'lucide-react'
import content from '../../config/content.json'

const copy = content.dashboard.upload

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function MimeIcon({ filename, isFolder: folder }) {
  if (folder) return <Folder size={18} className="shrink-0 text-yellow-500" />
  const ext = filename?.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext))
    return <Image size={18} className="shrink-0 text-blue-500" />
  if (['pdf'].includes(ext))
    return <FileText size={18} className="shrink-0 text-red-500" />
  if (['xlsx', 'xls', 'csv'].includes(ext))
    return <FileSpreadsheet size={18} className="shrink-0 text-green-500" />
  if (['txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'py'].includes(ext))
    return <FileText size={18} className="shrink-0 text-zinc-500" />
  return <File size={18} className="shrink-0 text-zinc-400" />
}

export default function UploadProgress({ uploads, onDismiss }) {
  const dismissedRef = useRef(new Set())

  useEffect(() => {
    uploads.forEach((u) => {
      if (u.status === 'complete' && !dismissedRef.current.has(u.id)) {
        dismissedRef.current.add(u.id)
        setTimeout(() => onDismiss(u.id), 3000)
      }
    })
  }, [uploads, onDismiss])

  if (uploads.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col sm:bottom-6 sm:left-auto sm:right-6 sm:w-80 sm:gap-2">
      {uploads.map((upload) => (
        <div
          key={upload.id}
          className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 sm:overflow-hidden sm:rounded-lg sm:border sm:shadow-lg"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <MimeIcon filename={upload.filename} isFolder={upload.isFolder} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {upload.filename}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {upload.status === 'uploading' && upload.isFolder && upload.totalFiles > 0
                  ? copy.folderProgress
                      .replace('{current}', upload.currentFile ?? 0)
                      .replace('{total}', upload.totalFiles)
                  : null}
                {upload.status === 'uploading' && !upload.isFolder && upload.loaded != null && upload.total != null
                  ? `${formatBytes(upload.loaded)} / ${formatBytes(upload.total)}`
                  : null}
                {upload.status === 'uploading' && !upload.isFolder && upload.loaded == null
                  ? copy.uploading
                  : null}
                {upload.status === 'complete' ? copy.complete : null}
                {upload.status === 'failed' ? copy.failed : null}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {upload.status === 'uploading' && (
                <span className="text-xs font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
                  {upload.progress ?? 0}%
                </span>
              )}
              {upload.status === 'uploading' && (
                <Loader size={14} className="animate-spin text-zinc-500" />
              )}
              {upload.status === 'complete' && (
                <CheckCircle size={16} className="text-green-500" />
              )}
              {upload.status === 'failed' && (
                <AlertCircle size={16} className="text-red-500" />
              )}
              {(upload.status === 'complete' || upload.status === 'failed') && (
                <button
                  type="button"
                  onClick={() => onDismiss(upload.id)}
                  aria-label="Dismiss"
                  className="flex h-8 w-8 items-center justify-center rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          {upload.status === 'uploading' && (
            <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-1 bg-zinc-900 transition-all duration-300 dark:bg-zinc-50"
                style={{ width: `${upload.progress ?? 0}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
