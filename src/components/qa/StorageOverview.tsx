import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { getStorageUsage, getReportImageSizes } from './indexedDBUtils';
import type { QAReport } from './types';

interface StorageOverviewProps {
  onProjectSelect: (testerName: string, packName: string) => void;
  onProjectDelete: (key: string) => void;
}

interface StorageInfo {
  used: number;
  total: number;
  projects: Array<{
    key: string;
    size: number;
    jsonSize: number;
    imageSize: number;
    report: QAReport;
  }>;
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

const getStorageInfo = async (): Promise<StorageInfo> => {
  const storage = await getStorageUsage();
  const projects = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith('qa-report-')) continue;

    const value = localStorage.getItem(key);
    if (!value) continue;

    try {
      const report = JSON.parse(value) as QAReport;
      // Calculate size of report JSON
      const jsonSize = new Blob([value]).size;
      // Get size of all images associated with this report
      const imageSize = await getReportImageSizes(report.reportId);
      const totalSize = jsonSize + imageSize;
      
      projects.push({ 
        key, 
        size: totalSize,
        jsonSize,
        imageSize,
        report 
      });
    } catch (error) {
      console.error('Error parsing report:', error);
    }
  }

  return {
    used: storage.used,
    total: storage.total,
    projects
  };
};

const StorageOverview: React.FC<StorageOverviewProps> = ({ 
  onProjectSelect,
  onProjectDelete
}) => {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);

  const updateStorageInfo = async () => {
    try {
      const info = await getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Error getting storage info:', error);
    }
  };

  useEffect(() => {
    updateStorageInfo();

    const handleStorage = () => {
      updateStorageInfo();
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleDelete = async (key: string) => {
    onProjectDelete(key);
    await updateStorageInfo();
  };

  if (!storageInfo) {
    return <Card className="p-4">Loading storage information...</Card>;
  }

  const usagePercentage = (storageInfo.used / storageInfo.total) * 100;

  return (
    <Card className="p-4 max-h-[60vh] overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Storage Usage</h3>
        <Progress value={usagePercentage} />
        <p className="text-sm text-gray-500 mt-1">
          {formatSize(storageInfo.used)} used of {formatSize(storageInfo.total)}
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Existing Projects</h3>
        {storageInfo.projects.length === 0 ? (
          <p className="text-sm text-gray-500">No existing projects found</p>
        ) : (
          storageInfo.projects.map(({ key, size, jsonSize, imageSize, report }) => (
            <div 
              key={key} 
              className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100"
            >
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => onProjectSelect(report.testerName, report.packName)}
              >
                <p className="font-medium">{report.packName}</p>
                <p className="text-sm text-gray-500">
                  By: {report.testerName}
                </p>
                <p className="text-sm text-gray-500">
                  Size: {formatSize(size)} (Report: {formatSize(jsonSize)}, Images: {formatSize(imageSize)})
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(key)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default StorageOverview;