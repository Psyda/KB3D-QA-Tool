'use client';

import { useState, useEffect } from "react";
import QAForm from './QAForm';
import QAReportRenderer from './QAReportRenderer';
import StorageOverview from './StorageOverview';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2, Download, FileDown } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import QAReportPDF from './QAReportPDF';
import type { QAReport } from './types';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const QAReportApp = () => {
  // Initialize image cleanup schedule
  useEffect(() => {
    import('./cleanupUtils').then(({ startCleanupSchedule }) => {
      startCleanupSchedule();
    });
  }, []);
  const [report, setReport] = useState<QAReport | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [showInitialDialog, setShowInitialDialog] = useState(true);
  const [testerName, setTesterName] = useState('');
  const [packName, setPackName] = useState('');
  const [existingFile, setExistingFile] = useState<string | null>(null);

  useEffect(() => {
    if (testerName && packName) {
      const key = `qa-report-${testerName}-${packName}`;
      const savedReport = localStorage.getItem(key);
      if (savedReport) {
        setExistingFile(key);
      } else {
        setExistingFile(null);
      }
    }
  }, [testerName, packName]);

  const handleStartNew = () => {
    if (!testerName || !packName) return;
    setShowInitialDialog(false);
    setIsEditing(true);
    setReport(null);
  };

  const handleLoadExisting = () => {
    if (!existingFile) return;
    try {
      const savedReport = localStorage.getItem(existingFile);
      if (savedReport) {
        const loadedReport = JSON.parse(savedReport) as QAReport;
        setReport(loadedReport);
        setIsEditing(false);
        setShowInitialDialog(false);
      }
    } catch (error) {
      console.error('Error loading report:', error);
    }
  };

  const handleProjectSelect = (selectedTesterName: string, selectedPackName: string) => {
    setTesterName(selectedTesterName);
    setPackName(selectedPackName);
    const key = `qa-report-${selectedTesterName}-${selectedPackName}`;
    const savedReport = localStorage.getItem(key);
    if (savedReport) {
      const loadedReport = JSON.parse(savedReport) as QAReport;
      setReport(loadedReport);
      setIsEditing(false);
      setShowInitialDialog(false);
    }
  };

  const handleProjectDelete = (key: string) => {
    try {
      localStorage.removeItem(key);
      if (key === existingFile) {
        setExistingFile(null);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleSubmit = (reportData: QAReport) => {
    const key = `qa-report-${reportData.testerName}-${reportData.packName}`;
    try {
      localStorage.setItem(key, JSON.stringify(reportData));
      setReport(reportData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  const handleDownload = () => {
    if (!report) return;
    
    const jsonString = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.testerName}-${report.packName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEdit = () => {
    if (report) {
      setIsEditing(true);
    }
  };

  if (showInitialDialog) {
    return (
      <Dialog open={showInitialDialog} onOpenChange={setShowInitialDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Start QA Report</DialogTitle>
            <DialogDescription>
              Enter the tester name and pack name to begin
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testerName">QA Tester Name</Label>
                <Input
                  id="testerName"
                  value={testerName}
                  onChange={(e) => setTesterName(e.target.value)}
                  placeholder="Enter tester name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packName">Pack Name</Label>
                <Input
                  id="packName"
                  value={packName}
                  onChange={(e) => setPackName(e.target.value)}
                  placeholder="Enter pack name"
                  required
                />
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={handleStartNew}
                  disabled={!testerName || !packName}
                >
                  Start New Report
                </Button>
                {existingFile && (
                  <Button
                    variant="secondary"
                    onClick={handleLoadExisting}
                  >
                    Load Existing Report
                  </Button>
                )}
              </div>
            </div>
            <StorageOverview
              onProjectSelect={handleProjectSelect}
              onProjectDelete={handleProjectDelete}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isEditing) {
    return (
      <QAForm 
        onSubmit={handleSubmit} 
        initialData={report}
        testerName={testerName}
        packName={packName}
      />
    );
  }

  const renderDownloadButton = () => {
    if (!report) return null;

    return (
      <PDFDownloadLink
        document={<QAReportPDF report={report} />}
        fileName={`${report.testerName}-${report.packName}-QA-Report.pdf`}
      >
		{/* @ts-expect-error: react-pdf known issue with PDFDownloadLink render prop types https://github.com/diegomura/react-pdf/issues/2886 */}
        {({ loading }) => (
          <Button
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading}
          >
            <FileDown className="w-4 h-4" />
            {loading ? 'Preparing PDF...' : 'Download PDF'}
          </Button>
        )}
      </PDFDownloadLink>
    );
  };

  return (
    <div>
      <div className="max-w-4xl mx-auto mb-4 flex justify-between">
        <Button 
          onClick={handleEdit}
          className="flex items-center gap-2"
        >
          <Edit2 className="w-4 h-4" />
          Edit Report
        </Button>
        <div className="flex gap-2">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download JSON
          </Button>
          {renderDownloadButton()}
        </div>
      </div>
      {report && <QAReportRenderer report={report} />}
    </div>
  );
};

export default QAReportApp;