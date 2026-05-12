import { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { useCases } from '@/hooks/useCases';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Send, 
  Download,
  CheckCircle,
  Stethoscope,
  ArrowLeft,
  Activity,
  Scan,
  Brain,
  Bone,
  Printer,
  Sparkles
} from 'lucide-react';
import { SCAN_TYPE_CONFIG, type ScanType } from '@/types';
import { cn } from '@/lib/utils';

const SCAN_ICONS: Record<ScanType, React.ElementType> = {
  xray: Bone,
  ct: Scan,
  mri: Brain,
  ultrasound: Activity,
};

const REPORT_TEMPLATES = {
  normal: {
    findings: 'No acute abnormality is identified. The visualized structures appear unremarkable.',
    impression: 'Normal study.',
    recommendations: 'Clinical correlation recommended. No further imaging indicated at this time.',
  },
  chest_ct: {
    findings: 'The lungs are clear without focal consolidation, pleural effusion, or pneumothorax. The cardiomediastinal silhouette is within normal limits. No significant lymphadenopathy.',
    impression: 'No acute cardiopulmonary process.',
    recommendations: 'Clinical correlation recommended.',
  },
  brain_mri: {
    findings: 'The brain parenchyma demonstrates normal signal intensity. No mass effect, midline shift, or acute infarct. Ventricles and sulci are within normal limits for age.',
    impression: 'Normal brain MRI.',
    recommendations: 'Clinical correlation recommended.',
  },
  clear: {
    findings: '',
    impression: '',
    recommendations: '',
  },
};

interface ReportFormProps {
  caseId: string;
  onBack?: () => void;
  onSuccess?: () => void;
}

export function ReportForm({ caseId, onBack, onSuccess }: ReportFormProps) {
  const { user } = useAuth();
  const { getCaseById, submitReport } = useCases();
  const reportRef = useRef<HTMLDivElement>(null);

  const caseItem = getCaseById(caseId);
  
  const [findings, setFindings] = useState('');
  const [impression, setImpression] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  if (!caseItem) {
    return (
      <div className="text-center py-16">
        <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-medium text-slate-700">Case not found</h3>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cases
        </Button>
      </div>
    );
  }

  const ScanIcon = SCAN_ICONS[caseItem.scanType];

  const applyTemplate = (template: keyof typeof REPORT_TEMPLATES) => {
    const tpl = REPORT_TEMPLATES[template];
    setFindings(tpl.findings);
    setImpression(tpl.impression);
    setRecommendations(tpl.recommendations);
  };

  const generateAIDraft = async () => {
    setIsGeneratingAI(true);

    // This is the prompt — written with clinical knowledge to get a useful draft
    // It gives the AI all the context it needs: scan type, body part, patient info, clinical history
    const prompt = `You are an experienced radiologist assistant. Based on the following case details, generate a preliminary radiology report draft.

Case Details:
- Scan Type: ${SCAN_TYPE_CONFIG[caseItem.scanType].label}
- Body Part: ${caseItem.bodyPart}
- Patient: ${caseItem.patient.age} year old ${caseItem.patient.gender}
- Clinical History: ${caseItem.clinicalHistory}
- Urgency: ${caseItem.urgency}

Generate a structured report with three sections. Respond ONLY with a JSON object in this exact format, no extra text:
{
  "findings": "detailed radiological findings here",
  "impression": "concise diagnostic impression here",
  "recommendations": "clinical recommendations here"
}

Write in formal radiological language. Be thorough but concise. Note that this is a draft for a qualified radiologist to review and edit — do not make definitive diagnoses, use language like 'appears', 'suggests', 'is noted'.`;

    try {
      // This is the API call — we're sending our prompt to Claude and waiting for a response
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
  'Content-Type': 'application/json',
  'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
},
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await response.json();
      console.log('API response:', JSON.stringify(data));

      // data.content[0].text contains the AI's response — we parse it as JSON
      const text = data.content[0].text;
      const clean = text.replace(/```json|```/g, '').trim();
const parsed = JSON.parse(clean);

      // Drop the AI draft into the form fields
      setFindings(parsed.findings);
      setImpression(parsed.impression);
      setRecommendations(parsed.recommendations);
    } catch (err) {
      console.error('AI generation failed:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async () => {
    if (!findings || !impression) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    submitReport(caseId, {
      radiologistId: user?.id || 'unknown',
      radiologistName: user?.name || 'Unknown Radiologist',
      findings,
      impression,
      recommendations,
    });

    setIsSubmitting(false);
    setIsSubmitted(true);
    
    if (onSuccess) {
      setTimeout(onSuccess, 2000);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = margin;

    // Header
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

    // Report Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORT', margin, y);
    
    y += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const infoLines = [
      `Case Number: ${caseItem.caseNumber}`,
      `Date: ${new Date().toLocaleDateString('en-NG')}`,
      `Radiologist: ${user?.name || 'Unknown'}`,
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

    y += 10;

    // Findings
    doc.setFont('helvetica', 'bold');
    doc.text('FINDINGS', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    
    const findingsLines = doc.splitTextToSize(findings, pageWidth - 2 * margin);
    doc.text(findingsLines, margin, y);
    y += findingsLines.length * 6 + 10;

    // Impression
    doc.setFont('helvetica', 'bold');
    doc.text('IMPRESSION', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    
    const impressionLines = doc.splitTextToSize(impression, pageWidth - 2 * margin);
    doc.text(impressionLines, margin, y);
    y += impressionLines.length * 6 + 10;

    // Recommendations
    if (recommendations) {
      doc.setFont('helvetica', 'bold');
      doc.text('RECOMMENDATIONS', margin, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      
      const recLines = doc.splitTextToSize(recommendations, pageWidth - 2 * margin);
      doc.text(recLines, margin, y);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      'Imole AI by Health Intelligence Labs - AI-Assisted Diagnostic Report',
      margin,
      doc.internal.pageSize.getHeight() - 15
    );
    doc.text(
      'This report was generated electronically and is valid without signature.',
      margin,
      doc.internal.pageSize.getHeight() - 8
    );

    doc.save(`Report_${caseItem.caseNumber}.pdf`);
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Report Submitted!</h2>
        <p className="text-slate-500 text-center max-w-md mb-6">
          The diagnostic report has been successfully submitted and will be delivered to the referring center.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cases
          </Button>
          <Button onClick={generatePDF}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Write Report</h2>
            <p className="text-sm text-slate-500">{caseItem.caseNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={generatePDF} disabled={!findings || !impression}>
            <Printer className="w-4 h-4 mr-2" />
            Preview PDF
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!findings || !impression || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Activity className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Report
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Patient Info Card */}
      <Card className="bg-slate-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className={cn(
              'w-12 h-12 rounded-lg flex items-center justify-center',
              caseItem.scanType === 'xray' && 'bg-slate-200',
              caseItem.scanType === 'ct' && 'bg-blue-100',
              caseItem.scanType === 'mri' && 'bg-purple-100',
              caseItem.scanType === 'ultrasound' && 'bg-green-100'
            )}>
              <ScanIcon className={cn(
                'w-6 h-6',
                caseItem.scanType === 'xray' && 'text-slate-600',
                caseItem.scanType === 'ct' && 'text-blue-600',
                caseItem.scanType === 'mri' && 'text-purple-600',
                caseItem.scanType === 'ultrasound' && 'text-green-600'
              )} />
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase">Patient</p>
                <p className="font-medium text-slate-900">{caseItem.patient.name}</p>
                <p className="text-sm text-slate-500">{caseItem.patient.age}y, {caseItem.patient.gender}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Study</p>
                <p className="font-medium text-slate-900">{SCAN_TYPE_CONFIG[caseItem.scanType].label}</p>
                <p className="text-sm text-slate-500">{caseItem.bodyPart}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Clinical History</p>
                <p className="text-sm text-slate-600 line-clamp-2">{caseItem.clinicalHistory}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="edit">Edit Report</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-6">
          {/* Templates */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-500">Quick templates:</span>
            <Button variant="outline" size="sm" onClick={() => applyTemplate('normal')}>
              Normal
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyTemplate('chest_ct')}>
              Chest CT
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyTemplate('brain_mri')}>
              Brain MRI
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyTemplate('clear')}>
              Clear
            </Button>
            <div className="ml-auto">
              <Button
                size="sm"
                onClick={generateAIDraft}
                disabled={isGeneratingAI}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isGeneratingAI ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Assist
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Report Form */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Findings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  placeholder="Describe your findings in detail..."
                  rows={6}
                  className="resize-none"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Impression
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={impression}
                  onChange={(e) => setImpression(e.target.value)}
                  placeholder="Provide your diagnostic impression..."
                  rows={3}
                  className="resize-none"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-purple-600" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="Provide recommendations for follow-up or further investigations..."
                  rows={3}
                  className="resize-none"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card ref={reportRef} className="max-w-3xl mx-auto">
            <CardContent className="p-8">
              {/* Report Header */}
              <div className="border-b-2 border-blue-600 pb-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-blue-900">Imole AI</h1>
                    <p className="text-xs text-slate-400">by Health Intelligence Labs</p>
                    <p className="text-sm text-slate-500">AI-Powered Diagnostic Imaging Report</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{caseItem.caseNumber}</p>
                    <p className="text-sm text-slate-500">{new Date().toLocaleDateString('en-NG')}</p>
                  </div>
                </div>
              </div>

              {/* Patient Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <p className="text-slate-500">Patient</p>
                  <p className="font-medium">{caseItem.patient.name}</p>
                  <p>{caseItem.patient.age} years, {caseItem.patient.gender}</p>
                  <p>ID: {caseItem.patient.patientId}</p>
                </div>
                <div>
                  <p className="text-slate-500">Study Details</p>
                  <p className="font-medium">{SCAN_TYPE_CONFIG[caseItem.scanType].label}</p>
                  <p>{caseItem.bodyPart}</p>
                  <p>Ref: {caseItem.patient.referringPhysician || 'N/A'}</p>
                </div>
              </div>

              {/* Report Content */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">Findings</h3>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-slate-700 whitespace-pre-wrap">{findings || 'No findings entered yet.'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">Impression</h3>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <p className="text-slate-700 whitespace-pre-wrap">{impression || 'No impression entered yet.'}</p>
                  </div>
                </div>

                {recommendations && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">Recommendations</h3>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <p className="text-slate-700 whitespace-pre-wrap">{recommendations}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-slate-500">Reported by</p>
                    <p className="font-medium">{user?.name || 'Unknown Radiologist'}</p>
                    <p className="text-slate-500">Consultant Radiologist</p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p>This is an AI-assisted computer-generated report.</p>
                    <p>Imole AI by Health Intelligence Labs - Secure Medical Imaging Platform</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
