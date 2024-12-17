'use client'; 
import { useState, useEffect  } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Plus, Trash2 } from 'lucide-react';
import type { QAFormProps, QAReport, QAIssue, ChecklistStatus } from '@/components/qa/types';

export const checklistItems = {
  geometry: [
    "Check for realistic scale",
    "Overall orientation",
    "Objects are grouped logically",
    "Pivots are placed logically",
    "Smoothing groups are applied",
    "Normals are correct",
    "There is no floating geometry",
    "There is no intersecting geometry"
  ],
  uv: [
    "Check for stretching and/or seams",
    "Check for non-overlapping UVs"
  ],
  textures: [
    "Naming Conventions are consistent and work in Software/Renderer",
    "Make sure none of the textures are missing",
    "Check that textures don't tile in an obvious way",
    "Materials are applied to objects logically"
  ],
  shaders: [
    "PBR node setup is accurate in each renderer"
  ]
} as const;

export const issueTags = [
  "Cosmetic", "Text/language", "Texture", "UV", "Normal map", 
  "Geometry", "Major Concern", "Minor Concern", "Nitpicking"
] as const;

const QAForm: React.FC<QAFormProps> = ({ onSubmit, initialData, testerName, packName }) => {
  const [formData, setFormData] = useState<Omit<QAReport, 'timestamp' | 'reportId'>>({
    testerName,
    packName,
    checklistStatus: {} as ChecklistStatus,
    issues: []
  });

  useEffect(() => {
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
        images: []
      }]
    }));
  }, [initialData, testerName, packName]);

  const handleSubmit = () => {
    const report: QAReport = {
      ...formData,
      timestamp: new Date().toISOString(),
      reportId: initialData?.reportId || `QA-${Date.now()}`
    };
    onSubmit(report);
  };

  const updateField = (field: keyof Omit<QAReport, 'timestamp' | 'reportId'>, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateChecklistItem = (category: string, item: string, field: keyof ChecklistItem, value: any) => {
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

  const updateIssue = (index: number, field: keyof QAIssue, value: any) => {
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
        severity: 'medium',
        tags: [],
        notes: '',
        images: []
      }]
    }));
  };

  const removeIssue = (index: number) => {
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

  // Rest of the JSX remains the same as before, just adding type annotations where needed

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Create QA Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Form JSX remains the same */}
        <div className="space-y-8">
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
                      onChange={(e) => updateIssue(index, 'severity', e.target.value)}
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