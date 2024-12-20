'use client';
import React, { useRef, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ImagePlus, X } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { storeImage, getImage, deleteImage, getStorageUsage } from './indexedDBUtils';

interface StorageStats {
  usedSize: string;
  totalSize: string;
  usedPercent: number;
}

interface ImageUploadProps {
  images?: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  reportId: string;
}

const formatSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images = [],
  onImagesChange,
  maxImages = 5,
  reportId
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);

  // Load preview URLs for images
  // Update storage stats
  const updateStorageStats = async () => {
    try {
      const stats = await getStorageUsage();
      setStorageStats({
        usedSize: formatSize(stats.used),
        totalSize: formatSize(stats.total),
        usedPercent: (stats.used / stats.total) * 100
      });
    } catch (error) {
      console.error('Error getting storage stats:', error);
    }
  };

  useEffect(() => {
    const loadImagePreviews = async () => {
      const newPreviewUrls: Record<string, string> = {};
      
      for (const imageId of images) {
        try {
          if (!previewUrls[imageId]) {
            const url = await getImage(imageId);
            newPreviewUrls[imageId] = url;
          }
        } catch (err) {
          console.error(`Error loading image ${imageId}:`, err);
        }
      }

      if (Object.keys(newPreviewUrls).length > 0) {
        setPreviewUrls(prev => ({...prev, ...newPreviewUrls}));
      }
    };

    loadImagePreviews();
    updateStorageStats();
  }, [images, previewUrls]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setLoading(true);
    setError(null);
    const maxSizeMB = 10;
    const newImageIds: string[] = [];

    try {
      for (const file of files) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          setError(`File ${file.name} is too large. Maximum size is ${maxSizeMB}MB.`);
          continue;
        }

        const imageId = await storeImage(file, reportId);
        newImageIds.push(imageId);
      }

      const updatedImages = [...images, ...newImageIds].slice(0, maxImages);
      onImagesChange(updatedImages);
      await updateStorageStats();
    } catch (err) {
      console.error('Error processing images:', err);
      setError('Failed to process images. Please try again.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = async (imageId: string, index: number) => {
    try {
      await deleteImage(imageId);
      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
      await updateStorageStats();
      
      // Clean up preview URL
      setPreviewUrls(prev => {
        const next = {...prev};
        delete next[imageId];
        return next;
      });
    } catch (err) {
      console.error('Error removing image:', err);
      setError('Failed to remove image. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      {storageStats && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Storage Used</span>
            <span>{storageStats.usedSize} / {storageStats.totalSize}</span>
          </div>
          <Progress value={storageStats.usedPercent} />
        </div>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-4">
        {images.map((imageId, index) => {
          const previewUrl = previewUrls[imageId];
          if (!previewUrl) return null;

          return (
            <div key={imageId} className="relative">
              <img
                src={previewUrl}
                alt={`Issue image ${index + 1}`}
                className="w-32 h-32 object-cover rounded border"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 w-6 h-6"
                onClick={() => removeImage(imageId, index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>
      
      {images.length < maxImages && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
            disabled={loading}
          >
            <ImagePlus className="w-4 h-4" />
            {loading ? 'Processing...' : 'Add Images'}
          </Button>
          <p className="text-sm text-gray-500 mt-1">
            Max {maxImages} images, 10MB each. {maxImages - images.length} remaining.
          </p>
        </div>
      )}
    </div>
  );
};