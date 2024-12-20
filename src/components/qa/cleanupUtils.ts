import { initDB } from './indexedDBUtils';
import type { QAReport } from './types';

const STORE_NAME = 'images';

interface QAImage {
  id: string;
  reportId: string;
  timestamp: number;
}

export const cleanupOrphanedImages = async (): Promise<void> => {
  const db = await initDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  // Get all images
  const allImages = await new Promise<QAImage[]>((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  // Get all reports from localStorage
  const reports = new Map<string, QAReport>();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith('qa-report-')) continue;

    try {
      const report = JSON.parse(localStorage.getItem(key) || '') as QAReport;
      reports.set(report.reportId, report);
    } catch (err) {
      console.error('Error parsing report:', err);
    }
  }

  // Find orphaned images (images without a valid report or reference)
  const orphanedImages = allImages.filter(image => {
    // Check if report exists
    const report = reports.get(image.reportId);
    if (!report) return true;

    // Check if image is referenced in any issue
    const isReferenced = report.issues?.some(issue => 
      Array.isArray(issue.imageIds) && issue.imageIds.includes(image.id)
    );

    return !isReferenced;
  });

  // Delete orphaned images
  await Promise.all(
    orphanedImages.map(image => 
      new Promise<void>((resolve, reject) => {
        const request = store.delete(image.id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    )
  );

  console.log(`Cleaned up ${orphanedImages.length} orphaned images`);
};

// Run cleanup periodically (e.g., once per day)
export const startCleanupSchedule = () => {
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  
  const runCleanup = async () => {
    try {
      await cleanupOrphanedImages();
    } catch (err) {
      console.error('Error during image cleanup:', err);
    }
  };

  // Run immediately
  runCleanup();
  
  // Schedule periodic cleanup
  setInterval(runCleanup, CLEANUP_INTERVAL);
};