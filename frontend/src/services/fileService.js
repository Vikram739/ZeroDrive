import api from './api'

function friendlyError(err) {
  const status = err?.response?.status
  if (status === 401) return 'Session expired. Please sign in again.'
  if (status === 413) return 'File is too large.'
  if (status === 502) return 'Upload failed. Please try again.'
  return 'Something went wrong. Please try again.'
}

export async function uploadFile(file, folderId, onProgress) {
  const form = new FormData()
  form.append('file', file)
  if (folderId != null) form.append('folder_id', folderId)
  try {
    const { data } = await api.post('/files/upload', form, {
      onUploadProgress(e) {
        if (onProgress && e.total) {
          onProgress({ percent: Math.round((e.loaded / e.total) * 100), loaded: e.loaded, total: e.total })
        }
      },
      timeout: 0,
    })
    return data
  } catch (err) {
    throw new Error(friendlyError(err), { cause: err })
  }
}

export async function downloadFile(fileId, filename) {
  try {
    const { data } = await api.get(`/files/${fileId}/download`, {
      responseType: 'blob',
      timeout: 0,
    })
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err) {
    throw new Error(friendlyError(err), { cause: err })
  }
}

export async function deleteFile(fileId, permanent = false) {
  try {
    const { data } = await api.delete(`/files/${fileId}`, { params: { permanent } })
    return data
  } catch (err) {
    throw new Error(friendlyError(err), { cause: err })
  }
}

export async function getFile(fileId) {
  try {
    const { data } = await api.get(`/files/${fileId}`)
    return data
  } catch (err) {
    throw new Error(friendlyError(err), { cause: err })
  }
}

export async function createFolder(name, parentId = null) {
  try {
    const { data } = await api.post('/folders', { name, parent_id: parentId })
    return data
  } catch (err) {
    throw new Error(friendlyError(err), { cause: err })
  }
}

export async function listFolders(parentId = null) {
  try {
    const params = {}
    if (parentId !== null) params.parent_id = parentId
    const { data } = await api.get('/folders', { params })
    return data
  } catch (err) {
    throw new Error(friendlyError(err), { cause: err })
  }
}

export async function deleteFolder(folderId, permanent = false) {
  try {
    const { data } = await api.delete(`/folders/${folderId}`, { params: { permanent } })
    return data
  } catch (err) {
    throw new Error(friendlyError(err), { cause: err })
  }
}

export async function listFiles(folderId = null) {
  try {
    const params = {}
    if (folderId !== null) params.folder_id = folderId
    const { data } = await api.get('/files', { params })
    return data
  } catch (err) {
    throw new Error(friendlyError(err), { cause: err })
  }
}

export async function updateFile(fileId, updates) {
  try {
    const { data } = await api.patch(`/files/${fileId}`, updates)
    return data
  } catch (err) {
    throw new Error(friendlyError(err), { cause: err })
  }
}

export async function updateFolder(folderId, updates) {
  try {
    const { data } = await api.patch(`/folders/${folderId}`, updates)
    return data
  } catch (err) {
    throw new Error(friendlyError(err), { cause: err })
  }
}

export async function getStarred() {
  try {
    const { data } = await api.get('/views/starred')
    return data
  } catch (err) {
    throw new Error(friendlyError(err), { cause: err })
  }
}

export async function getRecent() {
  try {
    const { data } = await api.get('/views/recent')
    return data
  } catch (err) {
    throw new Error(friendlyError(err), { cause: err })
  }
}

export async function getTrash() {
  try {
    const { data } = await api.get('/views/trash')
    return data
  } catch (err) {
    throw new Error(friendlyError(err), { cause: err })
  }
}

export async function getFolder(folderId) {
  try {
    const { data } = await api.get(`/folders/${folderId}`)
    return data
  } catch (err) {
    throw new Error(friendlyError(err), { cause: err })
  }
}

export async function restoreFile(fileId) {
  try {
    const { data } = await api.post(`/files/${fileId}/restore`)
    return data
  } catch (err) {
    throw new Error(friendlyError(err), { cause: err })
  }
}

export async function restoreFolder(folderId) {
  try {
    const { data } = await api.post(`/folders/${folderId}/restore`)
    return data
  } catch (err) {
    throw new Error(friendlyError(err), { cause: err })
  }
}

export async function emptyTrash() {
  try {
    const { data } = await api.post('/views/trash/empty')
    return data
  } catch (err) {
    throw new Error(friendlyError(err), { cause: err })
  }
}

export async function searchItems(query) {
  try {
    const { data } = await api.get('/views/search', { params: { q: query } })
    return data
  } catch (err) {
    throw new Error(friendlyError(err), { cause: err })
  }
}

export async function downloadFileBlob(fileId) {
  try {
    const { data } = await api.get(`/files/${fileId}/download`, {
      responseType: 'blob',
      timeout: 0,
    })
    return data
  } catch (err) {
    throw new Error(friendlyError(err), { cause: err })
  }
}

export async function downloadFolderAsZip(folderId, folderName, onProgress) {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  async function addFolderToZip(zipFolder, fId, path) {
    const [filesRes, foldersRes] = await Promise.all([
      api.get('/files', { params: { folder_id: fId } }),
      api.get('/folders', { params: { parent_id: fId } }),
    ])
    const files = filesRes.data
    const subFolders = foldersRes.data

    for (const file of files) {
      const blob = await downloadFileBlob(file.id)
      zipFolder.file(file.name, blob)
      if (onProgress) onProgress(path ? `${path}/${file.name}` : file.name)
    }
    for (const sub of subFolders) {
      const subZip = zipFolder.folder(sub.name)
      await addFolderToZip(subZip, sub.id, path ? `${path}/${sub.name}` : sub.name)
    }
  }

  const root = zip.folder(folderName)
  await addFolderToZip(root, folderId, '')

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${folderName}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
