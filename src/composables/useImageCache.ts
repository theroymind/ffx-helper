import { ref } from 'vue'

interface CachedImage {
  url: string
  timestamp: number
  blob: Blob
}

// In-memory cache singleton
const imageCache = new Map<string, HTMLImageElement>()

// IndexedDB setup
const DB_NAME = 'ffx-image-cache'
const DB_VERSION = 1
const STORE_NAME = 'images'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'url' })
      }
    }
  })
}

async function getFromIndexedDB(url: string): Promise<Blob | null> {
  try {
    const db = await openDatabase()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(url)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result as CachedImage | undefined
        resolve(result?.blob || null)
      }
    })
  } catch (error) {
    console.error('IndexedDB get error:', error)
    return null
  }
}

async function saveToIndexedDB(url: string, blob: Blob): Promise<void> {
  try {
    const db = await openDatabase()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const data: CachedImage = {
        url,
        timestamp: Date.now(),
        blob,
      }
      const request = store.put(data)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch (error) {
    console.error('IndexedDB save error:', error)
  }
}

async function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(blob)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(img)
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image from blob'))
    }

    img.src = objectUrl
  })
}

async function fetchAndCacheImage(url: string): Promise<HTMLImageElement> {
  // Fetch the image
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`)
  }

  const blob = await response.blob()

  // Save to IndexedDB in background
  saveToIndexedDB(url, blob).catch((error) => {
    console.warn('Failed to save to IndexedDB:', error)
  })

  // Load image from blob
  const img = await loadImageFromBlob(blob)

  // Cache in memory
  imageCache.set(url, img)

  return img
}

export function useImageCache() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function loadImage(url: string): Promise<HTMLImageElement | null> {
    isLoading.value = true
    error.value = null

    try {
      // 1. Check in-memory cache first
      const cachedImage = imageCache.get(url)
      if (cachedImage) {
        console.log('Image loaded from memory cache')
        return cachedImage
      }

      // 2. Check IndexedDB
      const blob = await getFromIndexedDB(url)
      if (blob) {
        console.log('Image loaded from IndexedDB cache')
        const img = await loadImageFromBlob(blob)
        imageCache.set(url, img)
        return img
      }

      // 3. Fetch from network and cache
      console.log('Image fetched from network')
      const img = await fetchAndCacheImage(url)
      return img
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load image'
      console.error('Image cache error:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function clearCache(url?: string): Promise<void> {
    if (url) {
      // Clear specific image
      imageCache.delete(url)
      try {
        const db = await openDatabase()
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(STORE_NAME, 'readwrite')
          const store = transaction.objectStore(STORE_NAME)
          const request = store.delete(url)

          request.onerror = () => reject(request.error)
          request.onsuccess = () => resolve()
        })
      } catch (error) {
        console.error('Failed to clear from IndexedDB:', error)
      }
    } else {
      // Clear all
      imageCache.clear()
      try {
        const db = await openDatabase()
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(STORE_NAME, 'readwrite')
          const store = transaction.objectStore(STORE_NAME)
          const request = store.clear()

          request.onerror = () => reject(request.error)
          request.onsuccess = () => resolve()
        })
      } catch (error) {
        console.error('Failed to clear IndexedDB:', error)
      }
    }
  }

  return {
    loadImage,
    clearCache,
    isLoading,
    error,
  }
}
