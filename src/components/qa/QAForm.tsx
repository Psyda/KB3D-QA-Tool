'use client';
import { useState, useEffect, useCallback } from "react";
import { ImageUpload } from './ImageUpload';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Plus, Trash2 } from 'lucide-react';
import { checklistItems, issueTags } from './constants';
import { deleteReportImages } from './indexedDBUtils';
import type { QAFormProps, QAReport, QAIssue, ChecklistStatus, ChecklistItem, Severity } from './types';

// QOL Helper functions
const AUTOSAVE_INTERVAL = 30000; // 30 seconds
const TEMP_STORAGE_KEY = (testerName: string, packName: string) => 
  `qa-form-temp-${testerName}-${packName}`;

const saveToTempStorage = (data: Partial<QAReport>, testerName: string, packName: string) => {
  if (!testerName || !packName) return;
  
  try {
    const key = TEMP_STORAGE_KEY(testerName, packName);
    const saveData = {
      ...data,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(saveData));
  } catch (error) {
    console.error('Error saving temporary data:', error);
  }
};

const loadFromTempStorage = (testerName: string, packName: string) => {
  if (!testerName || !packName) return null;
  
  try {
    const key = TEMP_STORAGE_KEY(testerName, packName);
    const savedData = localStorage.getItem(key);
    if (!savedData) return null;
    
    const parsedData = JSON.parse(savedData);
    const lastSaved = new Date(parsedData.lastSaved);
    const now = new Date();
    const hoursSinceLastSave = (now.getTime() - lastSaved.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastSave > 24) {
      localStorage.removeItem(key);
      return null;
    }
    
    return parsedData;
  } catch (error) {
    console.error('Error loading temporary data:', error);
    return null;
  }
};

const clearTempStorage = (testerName: string, packName: string) => {
  if (!testerName || !packName) return;
  const key = TEMP_STORAGE_KEY(testerName, packName);
  localStorage.removeItem(key);
};

const QAForm: React.FC<QAFormProps> = ({ onSubmit, initialData, testerName, packName }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Omit<QAReport, 'timestamp' | 'reportId'>>({
    testerName,
    packName,
    checklistStatus: {} as ChecklistStatus,
    issues: []
  });

  // Generate a stable report ID for image storage
  const reportId = initialData?.reportId || `QA-${testerName}-${packName}-${Date.now()}`;

  // Add autosave functionality
  const performAutosave = useCallback(() => {
    saveToTempStorage(formData, testerName, packName);
  }, [formData, testerName, packName]);

  useEffect(() => {
    if (!initialData) {
      const tempData = loadFromTempStorage(testerName, packName);
      if (tempData) {
        const hoursSinceLastSave = (new Date().getTime() - new Date(tempData.lastSaved).getTime()) / (1000 * 60 * 60);
        toast({
          title: "Restored unsaved progress",
          description: `Found unsaved work from ${Math.round(hoursSinceLastSave)} hours ago.`,
          duration: 5000,
        });
        setFormData(tempData);
        return;
      }
    }

    // Initialize form data
    const initialChecklist = Object.entries(checklistItems).reduce((acc, [category, items]) => {
      acc[category] = items.reduce((itemAcc, item) => {
        itemAcc[item] = initialData?.checklistStatus?.[category]?.[item] || { checked: false, notes: '' };
        return itemAcc;
      }, {} as Record<string, ChecklistItem>);
      return acc;
    }, {} as ChecklistStatus);
    
    setFormData(prev => ({
      ...prev,
      testerName,
      packName,
      checklistStatus: initialChecklist,
      issues: initialData?.issues || [{
        description: '',
        objectName: '',
        materialName: '',
        severity: 'medium',
        tags: [],
        notes: '',
        imageIds: []
      }]
    }));
  }, [initialData, testerName, packName, toast]);

  // Set up autosave interval
  useEffect(() => {
    const intervalId = setInterval(performAutosave, AUTOSAVE_INTERVAL);
    
    const handleBeforeUnload = () => {
      performAutosave();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [performAutosave]);

  const handleSubmit = () => {
    const report: QAReport = {
      ...formData,
      timestamp: new Date().toISOString(),
      reportId
    };
    onSubmit(report);
    clearTempStorage(testerName, packName);
  };

  const updateField = (
    field: keyof Omit<QAReport, 'timestamp' | 'reportId'>,
    value: string | ChecklistStatus | QAIssue[]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateChecklistItem = (
    category: string,
    item: string,
    field: keyof ChecklistItem,
    value: boolean | string
  ) => {
    setFormData(prev => ({
      ...prev,
      checklistStatus: {
        ...prev.checklistStatus,
        [category]: {
          ...prev.checklistStatus[category],
          [item]: {
            ...prev.checklistStatus[category][item],
            [field]: value
          }
        }
      }
    }));
  };

  const updateIssue = (
    index: number,
    field: keyof QAIssue,
    value: string | string[] | Severity
  ) => {
    setFormData(prev => ({
      ...prev,
      issues: prev.issues.map((issue, i) => 
        i === index ? { ...issue, [field]: value } : issue
      )
    }));
  };

  const addIssue = () => {
    setFormData(prev => ({
      ...prev,
      issues: [...prev.issues, {
        description: '',
        objectName: '',
        materialName: '',
        severity: 'medium' as Severity,
        tags: [],
        notes: '',
        imageIds: []
      }]
    }));
  };

  const removeIssue = async (index: number) => {
    const issue = formData.issues[index];
    // Clean up images for this issue
    if (issue.imageIds.length > 0) {
      try {
        await Promise.all(issue.imageIds.map(id => deleteReportImages(id)));
      } catch (error) {
        console.error('Error cleaning up images:', error);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      issues: prev.issues.filter((_, i) => i !== index)
    }));
  };

  const toggleIssueTag = (index: number, tag: string) => {
    setFormData(prev => ({
      ...prev,
      issues: prev.issues.map((issue, i) => {
        if (i === index) {
          const tags = issue.tags.includes(tag)
            ? issue.tags.filter(t => t !== tag)
            : [...issue.tags, tag];
          return { ...issue, tags };
        }
        return issue;
      })
    }));
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Create QA Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>QA Tester Name</Label>
              <Input
                value={formData.testerName}
                onChange={(e) => updateField('testerName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Pack Name</Label>
              <Input
                value={formData.packName}
                onChange={(e) => updateField('packName', e.target.value)}
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-6">
            {Object.entries(checklistItems).map(([category, items]) => (
              <div key={category} className="space-y-4">
                <h3 className="text-lg font-semibold capitalize">{category}</h3>
                {items.map(item => (
                  <div key={item} className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={formData.checklistStatus[category]?.[item]?.checked || false}
                      onChange={(e) => updateChecklistItem(category, item, 'checked', e.target.checked)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label>{item}</Label>
                      <Input
                        value={formData.checklistStatus[category]?.[item]?.notes || ''}
                        onChange={(e) => updateChecklistItem(category, item, 'notes', e.target.value)}
                        placeholder="Add notes if needed..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Issues */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Issues Found</h3>
            {formData.issues.map((issue, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label>Issue #{index + 1}</Label>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeIssue(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Object Name (Optional)</Label>
                      <Input
                        value={issue.objectName}
                        onChange={(e) => updateIssue(index, 'objectName', e.target.value)}
                        placeholder="e.g., Wall_01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Material Name (Optional)</Label>
                      <Input
                        value={issue.materialName}
                        onChange={(e) => updateIssue(index, 'materialName', e.target.value)}
                        placeholder="e.g., M_Brick_01"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={issue.description}
                      onChange={(e) => updateIssue(index, 'description', e.target.value)}
                      placeholder="Describe the issue..."
                      className="h-24"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <select
                      value={issue.severity}
                      onChange={(e) => updateIssue(index, 'severity', e.target.value as Severity)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                      <option value="trivial">Trivial</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {issueTags.map(tag => (
                        <Button
                          key={tag}
                          type="button"
                          variant={issue.tags.includes(tag) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleIssueTag(index, tag)}
                        >
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Additional Notes</Label>
                    <Textarea
                      value={issue.notes}
                      onChange={(e) => updateIssue(index, 'notes', e.target.value)}
                      placeholder="Additional notes..."
                      className="h-24"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Images</Label>
                    <ImageUpload
                      images={issue.imageIds}
                      onImagesChange={(imageIds) => updateIssue(index, 'imageIds', imageIds)}
                      maxImages={5}
                      reportId={reportId}
                    />
                  </div>
                </div>
              </Card>
            ))}
            
            <Button
              type="button"
              onClick={addIssue}
              className="w-full flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Issue
            </Button>
          </div>

          <div className="flex justify-end space-x-4">
            <Button onClick={handleSubmit}>
              {initialData ? 'Update Report' : 'Generate Report'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QAForm;