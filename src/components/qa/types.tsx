export interface ChecklistItem {
  checked: boolean;
  notes: string;
}

export interface ChecklistStatus {
  [category: string]: {
    [item: string]: ChecklistItem;
  };
}

export interface QAIssue {
  description: string;
  objectName: string;
  materialName: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'trivial';
  tags: string[];
  notes: string;
  images: string[];
}

export interface QAReport {
  testerName: string;
  packName: string;
  checklistStatus: ChecklistStatus;
  issues: QAIssue[];
  timestamp: string;
  reportId: string;
}

export interface QAFormProps {
  onSubmit: (report: QAReport) => void;
  initialData?: QAReport | null;
  testerName: string;
  packName: string;
}

export interface QARendererProps {
  report: QAReport;
}

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'trivial';