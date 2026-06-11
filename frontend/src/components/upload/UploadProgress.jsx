import { useEffect, useRef } from 'react'
import { X, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import content from '../../config/content.json'

const copy = content.dashboard.upload

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
    <div className="fixed bottom-6 right-6 z-50 flex w-72 flex-col gap-2">
      {uploads.map((upload) => (
        <div
          key={upload.id}
          className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="shrink-0">
              {upload.status === 'uploading' && (
                <Loader size={16} className="animate-spin text-zinc-500" />
              )}
              {upload.status === 'complete' && (
                <CheckCircle size={16} className="text-green-500" />
              )}
              {upload.status === 'failed' && (
                <AlertCircle size={16} className="text-red-500" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {upload.filename}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {upload.status === 'uploading' && copy.uploading}
                {upload.status === 'complete' && copy.complete}
                {upload.status === 'failed' && copy.failed}
              </p>
            </div>
            {(upload.status === 'complete' || upload.status === 'failed') && (
              <button
                type="button"
                onClick={() => onDismiss(upload.id)}
                aria-label="Dismiss"
                className="shrink-0 rounded p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {upload.status === 'uploading' && (
            <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-1 bg-zinc-900 transition-all duration-300 dark:bg-zinc-50"
                style={{ width: `${upload.progress}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
