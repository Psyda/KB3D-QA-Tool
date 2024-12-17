'use client'; 
import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ImagePlus, X } from 'lucide-react';
import { Image } from '@react-pdf/renderer';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ 
  images, 
  onImagesChange,
  maxImages = 5 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newImages: string[] = [];
    const maxSizeMB = 5;

    for (const file of files) {
      // Check file size (5MB limit)
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSizeMB}MB.`);
        continue;
      }

      try {
        // Convert to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newImages.push(base64);
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }

    // Update images, respecting maxImages limit
    const updatedImages = [...images, ...newImages].slice(0, maxImages);
    onImagesChange(updatedImages);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative">
            <img
              src={image}
              alt={`Issue image ${index + 1}`}
              className="w-32 h-32 object-cover rounded border"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 w-6 h-6"
              onClick={() => removeImage(index)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
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
          >
            <ImagePlus className="w-4 h-4" />
            Add Images
          </Button>
          <p className="text-sm text-gray-500 mt-1">
            Max {maxImages} images, 5MB each. {maxImages - images.length} remaining.
          </p>
        </div>
      )}
    </div>
  );
};

// PDF Image Component
export const PDFImage = ({ imageData }: { imageData: string }) => {
  // Remove base64 prefix if present
  const base64Data = imageData.split(',')[1] || imageData;
  
	{/* eslint-disable-next-line jsx-a11y/alt-text */}
  return (
    <Image src={`data:image/jpeg;base64,${base64Data}`} />
  );
};