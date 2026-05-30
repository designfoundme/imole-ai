import { jsPDF } from 'jspdf';
import { SCAN_TYPE_CONFIG, type ScanCase } from '@/types';

export interface ReportPdfInput {
  caseItem: ScanCase;
  findings: string;
  impression: string;
  recommendations: string;
  radiologistName: string;
  aiConfidence?: number | null;
  reportDate?: Date;
}

export function generateReportPdf(input: ReportPdfInput): jsPDF {
  const { caseItem, findings, impression, recommendations, radiologistName, aiConfidence, reportDate } = input;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Imole AI', margin, 22);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('by Health Intelligence Labs', margin, 28);

  doc.setFontSize(10);
  doc.text('AI-Powered Diagnostic Imaging Report', margin, 35);

  y = 50;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORT', margin, y);

  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const date = reportDate || new Date();
  const infoLines = [
    `Case Number: ${caseItem.caseNumber}`,
    `Date: ${date.toLocaleDateString('en-NG')}`,
    `Radiologist: ${radiologistName}`,
    '',
    `Patient: ${caseItem.patient.name}`,
    `Age: ${caseItem.patient.age} years`,
    `Gender: ${caseItem.patient.gender}`,
    `Patient ID: ${caseItem.patient.patientId}`,
    '',
    `Study: ${SCAN_TYPE_CONFIG[caseItem.scanType].label}`,
    `Body Part: ${caseItem.bodyPart}`,
    `Referring Physician: ${caseItem.patient.referringPhysician || 'N/A'}`,
  ];

  infoLines.forEach(line => {
    doc.text(line, margin, y);
    y += 6;
  });

  if (typeof aiConfidence === 'number') {
    y += 4;
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(96, 96, 96);
    doc.text(`AI-assisted draft confidence: ${Math.round(aiConfidence * 100)}%`, margin, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
  }

  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('FINDINGS', margin, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  const findingsLines = doc.splitTextToSize(findings || '—', pageWidth - 2 * margin);
  doc.text(findingsLines, margin, y);
  y += findingsLines.length * 6 + 10;

  doc.setFont('helvetica', 'bold');
  doc.text('IMPRESSION', margin, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  const impressionLines = doc.splitTextToSize(impression || '—', pageWidth - 2 * margin);
  doc.text(impressionLines, margin, y);
  y += impressionLines.length * 6 + 10;

  if (recommendations) {
    doc.setFont('helvetica', 'bold');
    doc.text('RECOMMENDATIONS', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    const recLines = doc.splitTextToSize(recommendations, pageWidth - 2 * margin);
    doc.text(recLines, margin, y);
  }

  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    'Imole AI by Health Intelligence Labs - AI-Assisted Diagnostic Report',
    margin,
    doc.internal.pageSize.getHeight() - 15,
  );
  doc.text(
    'This report was generated electronically and is valid without signature.',
    margin,
    doc.internal.pageSize.getHeight() - 8,
  );

  return doc;
}

export function downloadReportPdf(input: ReportPdfInput): void {
  const doc = generateReportPdf(input);
  doc.save(`Report_${input.caseItem.caseNumber}.pdf`);
}
