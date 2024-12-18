import type { QAReport } from './types';
const MAX_IMAGE_DIMENSION = 1024; // Maximum width or height for stored images

// Compress image by resizing and reducing quality
async function compressImage(base64String: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Calculate new dimensions while maintaining aspect ratio
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        if (width > height) {
          height = Math.round(height * (MAX_IMAGE_DIMENSION / width));
          width = MAX_IMAGE_DIMENSION;
        } else {
          width = Math.round(width * (MAX_IMAGE_DIMENSION / height));
          height = MAX_IMAGE_DIMENSION;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      // Compress with reduced quality
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64String;
  });
}

// Save data with image compression
export async function saveFormDataWithCompression(
  data: Partial<QAReport>, 
  testerName: string, 
  packName: string
): Promise<void> {
  const compressedData = { ...data };
  
  // Compress all images in all issues
  if (compressedData.issues) {
    for (let i = 0; i < compressedData.issues.length; i++) {
      const issue = compressedData.issues[i];
      if (issue.images?.length) {
        const compressedImages = await Promise.all(
          issue.images.map(img => compressImage(img))
        );
        compressedData.issues[i] = {
          ...issue,
          images: compressedImages
        };
      }
    }
  }

  try {
    const key = `qa-form-temp-${testerName}-${packName}`;
    const saveData = {
      ...compressedData,
      lastSaved: new Date().toISOString()
    };
    const dataString = JSON.stringify(saveData);
    
    // Check if we can store the data
    const testKey = `${key}-test`;
    try {
      localStorage.setItem(testKey, dataString);
      localStorage.removeItem(testKey);
	{/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
    } catch (_) {
      throw new Error('Storage quota would be exceeded');
    }
    
    localStorage.setItem(key, dataString);
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Storage quota would be exceeded') {
        // If we can't save with images, try saving without them
        const dataWithoutImages = {
          ...compressedData,
          issues: compressedData.issues?.map(issue => ({
            ...issue,
            images: [] // Remove images from temp storage
          }))
        };
        
        try {
          localStorage.setItem(
            `qa-form-temp-${testerName}-${packName}`,
            JSON.stringify({
              ...dataWithoutImages,
              lastSaved: new Date().toISOString()
            })
          );
          throw new Error('Autosave completed without images due to storage limits');
		{/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
        } catch (_) {
          throw new Error('Could not save even without images. Please save your work.');
        }
      }
    }
    throw error;
  }
}