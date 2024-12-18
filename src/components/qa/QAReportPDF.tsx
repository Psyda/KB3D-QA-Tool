'use client'; 
import { Page, Text, Font, View, Document, StyleSheet, Image, Link } from '@react-pdf/renderer';
import type { QAReport } from './types';
import { checklistItems } from './constants';

// Register Font
Font.register({
  family: "Roboto",
  fonts: [
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf", fontWeight: 300 },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf", fontWeight: 400 },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf", fontWeight: 500 },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf", fontWeight: 600 },
  ],
})

const severityColors = {
  critical: '#FFEBEE',  // Light red
  high: '#FFF3E0',     // Light orange
  medium: '#FFF8E1',   // Light yellow
  low: '#E3F2FD',      // Light blue
  trivial: '#F5F5F5'   // Light gray
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: "#ffffff",
    fontFamily: 'Roboto',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 5,
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
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
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
  issue: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f8f8f8',
    breakInside: 'avoid',
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  issueTitle: {
    fontSize: 14,
    fontWeight: 'bold',
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
    fontSize: 12,
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
    marginTop: 15,
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f8f8f8',
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendColor: {
    width: 16,
    height: 16,
    marginRight: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
  },
  link: {
  color: '#4da6ff',
  textDecoration: 'underline'
  },
});

const parseTextWithUrls = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let lastIndex = 0;
  const result: React.ReactNode[] = [];
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      result.push(
        <Text key={`text-${lastIndex}`}>
          {text.slice(lastIndex, match.index)}
        </Text>
      );
    }

    // Add the URL as a link
    result.push(
      <Link key={`link-${match.index}`} src={match[0]}>
        <Text style={styles.link}>{match[0]}</Text>
      </Link>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add any remaining text after the last URL
  if (lastIndex < text.length) {
    result.push(
      <Text key={`text-${lastIndex}`}>
        {text.slice(lastIndex)}
      </Text>
    );
  }

  return result;
};

const processImageSrc = (imageData: string) => {
  try {
    // If it's already a base64 string without data URI prefix
    if (!imageData.includes('data:')) {
      return imageData;
    }
    
    // If it's a data URI, extract the base64 part
    const matches = imageData.match(/^data:image\/(png|jpeg|jpg|gif);base64,(.+)$/);
    if (matches) {
      return matches[2];
    }
    
    return imageData;
  } catch (error) {
    console.error('Error processing image:', error);
    return null;
  }
};

const QAReportPDF = ({ report }: { report: QAReport }) => (
  <Document>
    {/* First Page - Checklist */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>3D Asset QA Report</Text>
        <Text style={styles.subtitle}>{report.testerName} - {report.packName}</Text>
        <Text style={styles.metadata}>
          Report ID: {report.reportId}{'\n'}
          Generated: {new Date(report.timestamp).toLocaleString()}
        </Text>
      </View>

      {/* Checklist Sections */}
      {Object.entries(checklistItems).map(([category, items]) => (
        <View key={category} style={styles.section}>
          <Text style={styles.sectionTitle}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
          {items.map(item => {
            const status = report.checklistStatus[category][item];
            return (
              <View key={item} style={styles.checklistItem}>
				{/* eslint-disable-next-line jsx-a11y/alt-text */}
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
    </Page>

    {/* Second Page - Issues */}
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Issues Found</Text>
		
		{/* Severity Legend */}
		<View style={styles.severityLegend}>
		<Text style={styles.legendTitle}>Severity Levels:</Text>
		{Object.entries(severityColors).map(([severity, color]) => (
		  <View key={severity} style={styles.legendItem}>
			<View style={[styles.legendColor, { backgroundColor: color }]} />
			<Text style={styles.legendText}>
			  {severity.charAt(0).toUpperCase() + severity.slice(1)}
			</Text>
		  </View>
		))}
		</View>
	
        {report.issues.map((issue, index) => (
          <View 
            key={index} 
            style={[
              styles.issue, 
              { backgroundColor: severityColors[issue.severity] }
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

            <Text style={styles.issueDescription}>{parseTextWithUrls(issue.description)}</Text>

            {issue.tags.length > 0 && (
              <View style={styles.tags}>
                {issue.tags.map(tag => (
                  <Text key={tag} style={styles.tag}>{tag}</Text>
                ))}
              </View>
            )}

            {issue.notes && (
              <View>
                <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Additional Notes:</Text>
                <Text style={styles.notes}>{parseTextWithUrls(issue.notes)}</Text>
              </View>
            )}

            {issue.images && issue.images.length > 0 && (
              <View>
                <Text style={{ fontSize: 12, fontWeight: 'bold', marginTop: 10, marginBottom: 5 }}>
                  Attached Images:
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {issue.images.map((imageData, idx) => {
                    const base64Data = processImageSrc(imageData);
                    if (!base64Data) return null;
                    
                    return (
                      <View key={idx} style={{ width: 200, height: 200, marginBottom: 10 }}>
                        <Image
                          src={`data:image/jpeg;base64,${base64Data}`}
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
    </Page>
  </Document>
);

export default QAReportPDF;