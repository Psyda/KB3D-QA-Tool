'use client'; 
import { Card } from "@/components/ui/card";
import { checklistItems } from './QAForm';  // Import shared constants
import { useState, useRef } from "react";
import type { QARendererProps } from '@/components/qa/types';
import { Button } from "@/components/ui/button";
import { FileText, Download } from 'lucide-react';
import type { QARendererProps } from './types';
import html2canvas from 'html2canvas';

const severityColors = {
  critical: "bg-red-100 border-red-500",
  high: "bg-orange-100 border-orange-500",
  medium: "bg-yellow-100 border-yellow-500",
  low: "bg-blue-100 border-blue-500",
  trivial: "bg-gray-100 border-gray-500"
} as const;

const QAReportRenderer: React.FC<QARendererProps> = ({ report }) => {
  const reportRef = useRef<HTMLDivElement>(null);

  if (!report) return null;

  return (
    <div id="downloadpdf">
      <div ref={reportRef} className="max-w-4xl mx-auto">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">3D Asset QA Report</h1>
            <div className="text-xl mt-4">
              <span className="font-semibold">{report.testerName}</span> - {report.packName}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Report ID: {report.reportId}
              <br />
              Generated: {new Date(report.timestamp).toLocaleString()}
            </div>
          </div>

          <div className="space-y-8">
            {Object.entries(checklistItems).map(([category, items]) => (
              <section key={category}>
                <h2 className="text-xl font-bold mb-4 capitalize">{category}</h2>
                <div className="space-y-4">
                  {items.map(item => {
                    const status = report.checklistStatus[category]?.[item];
                    if (!status) return null;
                    
                    return (
                      <div key={item} className="flex items-start gap-4">
                        <div className="w-6 h-6 border rounded flex items-center justify-center">
                          {status.checked ? '✓' : ''}
                        </div>
                        <div>
                          <div>{item}</div>
                          {status.notes && (
                            <div className="text-gray-600 mt-1">{status.notes}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
		</Card>
        <Card className="p-8">
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Issues Found</h2>
            <div className="space-y-6">
              {report.issues.map((issue, index) => (
                <div 
                  key={index}
                  className={`p-4 border-l-4 rounded ${severityColors[issue.severity]}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">Issue #{index + 1}</h3>
                    <span className="capitalize px-2 py-1 rounded text-sm font-medium">
                      {issue.severity} Priority
                    </span>
                  </div>
                  
                  {(issue.objectName || issue.materialName) && (
                    <div className="mb-4 text-sm">
                      {issue.objectName && (
                        <div><span className="font-medium">Object:</span> {issue.objectName}</div>
                      )}
                      {issue.materialName && (
                        <div><span className="font-medium">Material:</span> {issue.materialName}</div>
                      )}
                    </div>
                  )}
                  
                  <p className="mb-4 whitespace-pre-wrap">{issue.description}</p>
                  
                  {issue.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {issue.tags.map(tag => (
                        <span 
                          key={tag}
                          className="bg-gray-100 px-2 py-1 rounded text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {issue.notes && (
                    <div className="text-gray-600 whitespace-pre-wrap">
                      <div className="font-medium mb-1">Additional Notes:</div>
                      {issue.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default QAReportRenderer;