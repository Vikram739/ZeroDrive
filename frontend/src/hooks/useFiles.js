import { useCallback, useEffect, useState } from 'react'
import * as fileService from '../services/fileService'

function isFolder(item) {
  return !('mime_type' in item)
}

export function useFiles(currentFolderId = null) {
  const [folders, setFolders] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [revision, setRevision] = useState(0)

  const refresh = useCallback(() => {
    setRevision((r) => r + 1)
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([
      fileService.listFolders(currentFolderId),
      fileService.listFiles(currentFolderId),
    ])
      .then(([foldersData, filesData]) => {
        if (active) {
          setFolders(foldersData)
          setFiles(filesData)
          setLoading(false)
          setError(null)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message)
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [currentFolderId, revision])

  const uploadFile = useCallback(
    async (file, onProgress) => {
      const created = await fileService.uploadFile(file, currentFolderId, onProgress)
      setRevision((r) => r + 1)
      return created
    },
    [currentFolderId],
  )

  const createFolder = useCallback(
    async (name) => {
      await fileService.createFolder(name, currentFolderId)
      setRevision((r) => r + 1)
    },
    [currentFolderId],
  )

  const deleteFile = useCallback(async (fileId) => {
    await fileService.deleteFile(fileId)
    setRevision((r) => r + 1)
  }, [])

  const deleteFolder = useCallback(async (targetFolderId) => {
    await fileService.deleteFolder(targetFolderId)
    setRevision((r) => r + 1)
  }, [])

  const renameFile = useCallback(async (fileId, newName) => {
    await fileService.updateFile(fileId, { name: newName })
    setRevision((r) => r + 1)
  }, [])

  const renameFolder = useCallback(async (targetFolderId, newName) => {
    await fileService.updateFolder(targetFolderId, { name: newName })
    setRevision((r) => r + 1)
  }, [])

  const starItem = useCallback(async (item) => {
    if (isFolder(item)) {
      await fileService.updateFolder(item.id, { is_starred: !item.is_starred })
    } else {
      await fileService.updateFile(item.id, { is_starred: !item.is_starred })
    }
    setRevision((r) => r + 1)
  }, [])

  return {
    folders,
    files,
    loading,
    error,
    refresh,
    uploadFile,
    createFolder,
    deleteFile,
    deleteFolder,
    renameFile,
    renameFolder,
    starItem,
  }
}
