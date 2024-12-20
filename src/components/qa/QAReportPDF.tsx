'use client';

import { useEffect, useState } from 'react';
import { Page, Text, Font, View, Document, StyleSheet, Image, Link } from '@react-pdf/renderer';
import type { QAReport } from './types';
import { checklistItems } from './constants';
import { getImage } from './indexedDBUtils';

Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'http://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf',
      fontWeight: 100,
    },
    {
      src: 'http://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyfMZhrib2Bg-4.ttf',
      fontWeight: 200,
    },
    {
      src: 'http://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuOKfMZhrib2Bg-4.ttf',
      fontWeight: 300,
    },
    {
      src: 'http://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf',
      fontWeight: 400,
    },
    {
      src: 'http://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fMZhrib2Bg-4.ttf',
      fontWeight: 500,
    },
    {
      src: 'http://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf',
      fontWeight: 600,
    },
    {
      src: 'http://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf',
      fontWeight: 700,
    },
    {
      src: 'http://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyYMZhrib2Bg-4.ttf',
      fontWeight: 800,
    },
    {
      src: 'http://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuBWYMZhrib2Bg-4.ttf',
      fontWeight: 900,
    },
  ],
});

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'trivial';

const severityColors: Record<Severity, string> = {
  critical: '#FEE2E2',
  high: '#FFEDD5',
  medium: '#FEF9C3',
  low: '#DBEAFE',
  trivial: '#F5F5F5'
};

const severityBackgrounds: Record<Severity, string> = {
  critical: '#FEE2E2',
  high: '#FFEDD5',
  medium: '#FEF9C3',
  low: '#DBEAFE',
  trivial: '#F5F5F5'
};

const borderColors: Record<Severity, string> = {
  critical: '#EF4444',  // red-500
  high: '#F97316',      // orange-500
  medium: '#EAB308',    // yellow-500
  low: '#3B82F6',       // blue-500
  trivial: '#6B7280'    // gray-500
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: "#ffffff",
    fontFamily: 'Inter',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 5,
  },
  testerName: {
    fontWeight: 'bold',
  },
  metadata: {
    fontSize: 10,
    color: '#666',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    marginBottom: 10,
    fontFamily: 'Inter',
    fontWeight: 'medium'
  },
  checklistItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  checkbox: {
    width: 12,
    height: 12,
    marginRight: 8,
    marginTop: 2,
  },
  checklistText: {
    flex: 1,
    fontSize: 12,
  },
  notes: {
    fontSize: 10,
    color: '#666',
    marginLeft: 20,
    marginTop: 4,
  },
  issuesContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  issue: {
    marginBottom: 15,
    padding: 10,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftStyle: 'solid',
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  issueTitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: 'medium'
  },
  issueSeverity: {
    fontSize: 12,
    color: '#666',
  },
  issueMetadata: {
    fontSize: 10,
    color: '#666',
    marginBottom: 5,
  },
  issueDescription: {
    fontSize: 11,
    fontFamily: 'Inter',
    fontWeight: 'light',
    marginBottom: 5,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 5,
  },
  tag: {
    fontSize: 10,
    backgroundColor: '#eee',
    padding: '2 6',
    borderRadius: 3,
  },
  severityLegend: {
    marginTop: 4,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    marginRight: 4,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
  },
  link: {
    color: '#4da6ff',
    textDecoration: 'underline'
  },
  imageContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  imagesGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageWrapper: {
    width: 200,
    height: 200,
    marginBottom: 10,
  },
});

const parseTextWithUrls = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let lastIndex = 0;
  const result: React.ReactNode[] = [];
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(
        <Text key={`text-${lastIndex}`}>
          {text.slice(lastIndex, match.index)}
        </Text>
      );
    }

    result.push(
      <Link key={`link-${match.index}`} src={match[0]}>
        <Text style={styles.link}>{match[0]}</Text>
      </Link>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    result.push(
      <Text key={`text-${lastIndex}`}>
        {text.slice(lastIndex)}
      </Text>
    );
  }

  return result;
};

interface QAReportPDFProps {
  report: QAReport;
}

const PDFReport = ({ report, loadedImages }: { report: QAReport; loadedImages: Record<string, string> }) => {
  return (
    <Document>
      <Page size={[695.276, 'auto']} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>3D Asset QA Report</Text>
          <Text style={styles.subtitle}>
            <Text style={styles.testerName}>{report.testerName}</Text>
            {" - "}
            {report.packName}
          </Text>
          <Text style={styles.metadata}>
            Report ID: {report.reportId}{'\n'}
            Generated: {new Date(report.timestamp).toLocaleString()}
          </Text>
        </View>

        {Object.entries(checklistItems).map(([category, items]) => (
          <View key={category} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
            {items.map(item => {
              const status = report.checklistStatus[category][item];
              return (
                <View key={item} style={styles.checklistItem}>
                  <Image
                    src={status.checked ? "/checkbox-checked.png" : "/checkbox-empty.png"}
                    style={styles.checkbox}
                  />
                  <View style={styles.checklistText}>
                    <Text>{item}</Text>
                    {status.notes && (
                      <Text style={styles.notes}>{status.notes}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Issues Found</Text>
          <View style={styles.severityLegend}>
            {Object.entries(severityColors).map(([severity]) => (
              <View key={severity} style={styles.legendItem}>
                <View 
                  style={[
                    styles.legendColor, 
                    { 
                      backgroundColor: severityBackgrounds[severity as Severity],
                      borderLeftWidth: 2,
                      borderLeftColor: borderColors[severity as Severity],
                      borderLeftStyle: 'solid' 
                    }
                  ]} 
                />
                <Text style={styles.legendText}>
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </Text>
              </View>
            ))}
          </View>
          
          <View style={styles.issuesContainer}>
            {report.issues.map((issue, index) => (
              <View
                key={index}
                style={[
                  styles.issue,
                  { 
                    backgroundColor: severityBackgrounds[issue.severity as Severity],
                    borderLeftColor: borderColors[issue.severity as Severity]
                  }
                ]}
              >
                <View style={styles.issueHeader}>
                  <Text style={styles.issueTitle}>Issue #{index + 1}</Text>
                  <Text style={styles.issueSeverity}>{issue.severity} Priority</Text>
                </View>

                {(issue.objectName || issue.materialName) && (
                  <Text style={styles.issueMetadata}>
                    {issue.objectName && `Object: ${issue.objectName}\n`}
                    {issue.materialName && `Material: ${issue.materialName}`}
                  </Text>
                )}

                <Text style={styles.issueDescription}>
                  {parseTextWithUrls(issue.description)}
                </Text>

                {issue.tags.length > 0 && (
                  <View style={styles.tags}>
                    {issue.tags.map(tag => (
                      <Text key={tag} style={styles.tag}>{tag}</Text>
                    ))}
                  </View>
                )}

                {issue.notes && (
                  <View>
                    <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>Additional Notes:</Text>
                    <Text style={styles.notes}>{parseTextWithUrls(issue.notes)}</Text>
                  </View>
                )}

                {issue.imageIds && issue.imageIds.length > 0 && (
                  <View style={styles.imageContainer}>
                    <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>
                      Attached Images:
                    </Text>
                    <View style={styles.imagesGrid}>
                      {issue.imageIds.map((imageId, idx) => {
                        const imageUrl = loadedImages[imageId];
                        if (!imageUrl) return null;

                        return (
                          <View key={idx} style={styles.imageWrapper}>
                            <Image
                              src={imageUrl}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                              }}
                            />
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
};

const QAReportPDF = ({ report }: QAReportPDFProps) => {
  const [loadedImages, setLoadedImages] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadAllImages = async () => {
      const imagePromises: Promise<[string, string]>[] = [];
      
      report.issues?.forEach(issue => {
        if (!issue.imageIds) return;
        
        issue.imageIds.forEach(imageId => {
          if (!imageId) return;
          imagePromises.push(
            getImage(imageId)
              .then(url => [imageId, url] as [string, string])
              .catch(err => {
                console.error(`Error loading image ${imageId}:`, err);
                return [imageId, ''] as [string, string];
              })
          );
        });
      });

      try {
        const loadedImagePairs = await Promise.all(imagePromises);
        setLoadedImages(
          Object.fromEntries(loadedImagePairs)
        );
      } catch (error) {
        console.error('Error loading images for PDF:', error);
      }
    };

    loadAllImages();
  }, [report]);

  return <PDFReport report={report} loadedImages={loadedImages} />;
};

export default QAReportPDF;