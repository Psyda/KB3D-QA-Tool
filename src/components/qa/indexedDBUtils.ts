const DB_NAME = 'qa-tool-db';
const DB_VERSION = 1;
const STORE_NAME = 'images';

interface QAImage {
  id: string;
  fileName: string;
  type: string;
  size: number;
  data: ArrayBuffer;
  reportId: string;
}

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('reportId', 'reportId', { unique: false });
      }
    };
  });
};

export const storeImage = async (
  file: File, 
  reportId: string
): Promise<string> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const imageId = `${reportId}-${Date.now()}-${file.name}`;
      const imageData: QAImage = {
        id: imageId,
        fileName: file.name,
        type: file.type,
        size: file.size,
        data: reader.result as ArrayBuffer,
        reportId
      };

      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.add(imageData);
      
      request.onsuccess = () => resolve(imageId);
      request.onerror = () => reject(request.error);
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

export const getImage = async (imageId: string): Promise<string> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(imageId);

    request.onsuccess = () => {
      if (!request.result) {
        reject(new Error('Image not found'));
        return;
      }

      const blob = new Blob([request.result.data], { type: request.result.type });
      resolve(URL.createObjectURL(blob));
    };

    request.onerror = () => reject(request.error);
  });
};

export const deleteImage = async (imageId: string): Promise<void> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(imageId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getReportImageSizes = async (reportId: string): Promise<number> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('reportId');
    const request = index.getAll(reportId);

    request.onsuccess = () => {
      const images = request.result as QAImage[];
      const totalSize = images.reduce((total, img) => total + img.size, 0);
      resolve(totalSize);
    };

    request.onerror = () => reject(request.error);
  });
};

export const getStorageUsage = async (): Promise<{
  used: number;
  total: number;
}> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = async () => {
      try {
        const images = request.result as QAImage[];
        const usedBytes = images.reduce((total, img) => total + img.size, 0);
        
        // Default total storage size (10GB)
        const defaultTotal = 1024 * 1024 * 1024 * 10;
        
        // Try to get actual quota if available
        let totalBytes = defaultTotal;
        try {
          if (navigator?.storage?.estimate) {
            const estimate = await navigator.storage.estimate();
            if (estimate.quota) {
              totalBytes = estimate.quota;
            }
          }
        } catch (error) {
          console.warn('Storage estimation not available:', error);
        }

        resolve({
          used: usedBytes,
          total: totalBytes
        });
      } catch (error) {
        reject(error);
      }
    };

    request.onerror = () => reject(request.error);
  });
};



export const deleteReportImages = async (reportId: string): Promise<void> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('reportId');
    const request = index.getAll(reportId);

    request.onsuccess = () => {
      const deletePromises = request.result.map((image: QAImage) => 
        deleteImage(image.id)
      );
      Promise.all(deletePromises)
        .then(() => resolve())
        .catch(reject);
    };

    request.onerror = () => reject(request.error);
  });
};