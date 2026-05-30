import { useEffect, useMemo, useRef, useState } from 'react';
import { useCases } from '@/hooks/useCases';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
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
  Sparkles,
  Zap,
  Save,
  Trash2,
  Plus,
} from 'lucide-react';
import { SCAN_TYPE_CONFIG, type ScanType } from '@/types';
import { cn } from '@/lib/utils';
import { getScanData, generateAIReportWithScanAnalysis } from '@/lib/mockApi';
import { downloadReportPdf } from '@/lib/reportPdf';

const SCAN_ICONS: Record<ScanType, React.ElementType> = {
  xray: Bone,
  ct: Scan,
  mri: Brain,
  ultrasound: Activity,
};

const REPORT_TEMPLATES = {
  normal: {
    name: 'Normal',
    findings: 'No acute abnormality is identified. The visualized structures appear unremarkable.',
    impression: 'Normal study.',
    recommendations: 'Clinical correlation recommended. No further imaging indicated at this time.',
  },
  chest_ct: {
    name: 'Chest CT',
    findings: 'The lungs are clear without focal consolidation, pleural effusion, or pneumothorax. The cardiomediastinal silhouette is within normal limits. No significant lymphadenopathy.',
    impression: 'No acute cardiopulmonary process.',
    recommendations: 'Clinical correlation recommended.',
  },
  brain_mri: {
    name: 'Brain MRI',
    findings: 'The brain parenchyma demonstrates normal signal intensity. No mass effect, midline shift, or acute infarct. Ventricles and sulci are within normal limits for age.',
    impression: 'Normal brain MRI.',
    recommendations: 'Clinical correlation recommended.',
  },
  clear: {
    name: 'Clear',
    findings: '',
    impression: '',
    recommendations: '',
  },
} as const;

const QUICK_INSERTS: { label: string; text: string; target: 'findings' | 'impression' | 'recommendations' }[] = [
  { label: 'Normal lungs', text: 'Lungs are clear without focal consolidation or pleural effusion.', target: 'findings' },
  { label: 'No acute finding', text: 'No acute abnormality is identified.', target: 'findings' },
  { label: 'Normal heart size', text: 'Cardiomediastinal silhouette is within normal limits.', target: 'findings' },
  { label: 'No bony abnormality', text: 'No fracture, dislocation, or aggressive osseous lesion identified.', target: 'findings' },
  { label: 'Clinical correlation', text: 'Clinical correlation is recommended.', target: 'recommendations' },
  { label: 'Follow-up not required', text: 'No further imaging follow-up required at this time.', target: 'recommendations' },
];

interface CustomTemplate {
  id: string;
  name: string;
  findings: string;
  impression: string;
  recommendations: string;
}

interface DraftPayload {
  findings: string;
  impression: string;
  recommendations: string;
  aiConfidence: number | null;
  savedAt: string;
}

const DRAFT_KEY = (caseId: string) => `report-draft-${caseId}`;
const TEMPLATES_KEY = (userId: string) => `report-templates-${userId}`;

function readDraft(caseId: string): DraftPayload | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY(caseId));
    return raw ? JSON.parse(raw) as DraftPayload : null;
  } catch {
    return null;
  }
}

function writeDraft(caseId: string, payload: DraftPayload) {
  try {
    localStorage.setItem(DRAFT_KEY(caseId), JSON.stringify(payload));
  } catch {
    // ignore quota / privacy errors
  }
}

function clearDraft(caseId: string) {
  try {
    localStorage.removeItem(DRAFT_KEY(caseId));
  } catch {
    // ignore
  }
}

function readCustomTemplates(userId: string): CustomTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY(userId));
    return raw ? JSON.parse(raw) as CustomTemplate[] : [];
  } catch {
    return [];
  }
}

function writeCustomTemplates(userId: string, templates: CustomTemplate[]) {
  try {
    localStorage.setItem(TEMPLATES_KEY(userId), JSON.stringify(templates));
  } catch {
    // ignore
  }
}

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
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  const userId = user?.id || 'anon';

  // Load draft + custom templates on mount
  useEffect(() => {
    const draft = readDraft(caseId);
    if (draft) {
      setFindings(draft.findings);
      setImpression(draft.impression);
      setRecommendations(draft.recommendations);
      setAiConfidence(draft.aiConfidence);
      setLastSavedAt(new Date(draft.savedAt));
      setDraftRestored(true);
    }
    setCustomTemplates(readCustomTemplates(userId));
  }, [caseId, userId]);

  // Auto-save draft every 30s
  useEffect(() => {
    if (isSubmitted) return;
    const hasContent = findings || impression || recommendations;
    if (!hasContent) return;

    const interval = setInterval(() => {
      const savedAt = new Date();
      writeDraft(caseId, {
        findings,
        impression,
        recommendations,
        aiConfidence,
        savedAt: savedAt.toISOString(),
      });
      setLastSavedAt(savedAt);
    }, 30_000);

    return () => clearInterval(interval);
  }, [caseId, findings, impression, recommendations, aiConfidence, isSubmitted]);

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

  const applyBuiltinTemplate = (template: keyof typeof REPORT_TEMPLATES) => {
    const tpl = REPORT_TEMPLATES[template];
    setFindings(tpl.findings);
    setImpression(tpl.impression);
    setRecommendations(tpl.recommendations);
  };

  const applyCustomTemplate = (id: string) => {
    const tpl = customTemplates.find(t => t.id === id);
    if (!tpl) return;
    setFindings(tpl.findings);
    setImpression(tpl.impression);
    setRecommendations(tpl.recommendations);
    toast.success(`Applied "${tpl.name}"`);
  };

  const insertSnippet = (target: 'findings' | 'impression' | 'recommendations', text: string) => {
    const append = (prev: string) => (prev ? `${prev.trimEnd()} ${text}` : text);
    if (target === 'findings') setFindings(append);
    else if (target === 'impression') setImpression(append);
    else setRecommendations(append);
  };

  const saveAsTemplate = () => {
    const name = newTemplateName.trim();
    if (!name) {
      toast.error('Template name is required');
      return;
    }
    const next: CustomTemplate = {
      id: `tpl-${Date.now()}`,
      name,
      findings,
      impression,
      recommendations,
    };
    const updated = [...customTemplates, next];
    setCustomTemplates(updated);
    writeCustomTemplates(userId, updated);
    setNewTemplateName('');
    setShowSaveTemplate(false);
    toast.success(`Saved template "${name}"`);
  };

  const deleteTemplate = (id: string) => {
    const updated = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updated);
    writeCustomTemplates(userId, updated);
    toast.success('Template deleted');
  };

  const saveDraftNow = () => {
    const savedAt = new Date();
    writeDraft(caseId, {
      findings,
      impression,
      recommendations,
      aiConfidence,
      savedAt: savedAt.toISOString(),
    });
    setLastSavedAt(savedAt);
    toast.success('Draft saved');
  };

  const generateAIDraft = async () => {
    setIsGeneratingAI(true);
    try {
      const scanData = await getScanData(caseId);
      if (!scanData) throw new Error('Could not load scan data');

      const aiReport = await generateAIReportWithScanAnalysis(
        caseId,
        scanData,
        caseItem.clinicalHistory,
        import.meta.env.VITE_ANTHROPIC_API_KEY,
      );

      setFindings(aiReport.findings);
      setImpression(aiReport.impression);
      setRecommendations(aiReport.recommendations);
      setAiConfidence(aiReport.aiConfidence);
    } catch (err) {
      console.error('AI generation failed:', err);
      applyBuiltinTemplate('normal');
      setAiConfidence(null);
      toast.error('AI generation failed — applied normal template instead');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async () => {
    if (!findings || !impression) return;

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    submitReport(caseId, {
      radiologistId: user?.id || 'unknown',
      radiologistName: user?.name || 'Unknown Radiologist',
      findings,
      impression,
      recommendations,
      aiConfidence: aiConfidence ?? undefined,
    });

    clearDraft(caseId);
    setIsSubmitting(false);
    setIsSubmitted(true);

    if (onSuccess) {
      setTimeout(onSuccess, 2000);
    }
  };

  const handleDownloadPdf = () => {
    downloadReportPdf({
      caseItem,
      findings,
      impression,
      recommendations,
      radiologistName: user?.name || 'Unknown Radiologist',
      aiConfidence,
    });
  };

  const savedAgo = useMemo(() => {
    if (!lastSavedAt) return null;
    const seconds = Math.floor((Date.now() - lastSavedAt.getTime()) / 1000);
    if (seconds < 30) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return lastSavedAt.toLocaleTimeString();
  }, [lastSavedAt]);

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
          <Button onClick={handleDownloadPdf}>
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Write Report</h2>
              {(findings || impression || recommendations) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  Draft
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">
              {caseItem.caseNumber}
              {savedAgo && <> · Saved {savedAgo}</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={saveDraftNow}>
            <Save className="w-4 h-4 mr-2" />
            Save draft
          </Button>
          <Button variant="outline" onClick={handleDownloadPdf} disabled={!findings || !impression}>
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

      {draftRestored && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-900 flex items-center justify-between">
          <span>Resumed your previously saved draft.</span>
          <Button variant="ghost" size="sm" onClick={() => setDraftRestored(false)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Patient Info Card */}
      <Card className="bg-slate-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className={cn(
              'w-12 h-12 rounded-lg flex items-center justify-center',
              caseItem.scanType === 'xray' && 'bg-slate-200',
              caseItem.scanType === 'ct' && 'bg-blue-100',
              caseItem.scanType === 'mri' && 'bg-purple-100',
              caseItem.scanType === 'ultrasound' && 'bg-green-100',
            )}>
              <ScanIcon className={cn(
                'w-6 h-6',
                caseItem.scanType === 'xray' && 'text-slate-600',
                caseItem.scanType === 'ct' && 'text-blue-600',
                caseItem.scanType === 'mri' && 'text-purple-600',
                caseItem.scanType === 'ultrasound' && 'text-green-600',
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
            <span className="text-sm text-slate-500">Templates:</span>
            <Button variant="outline" size="sm" onClick={() => applyBuiltinTemplate('normal')}>
              Normal
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyBuiltinTemplate('chest_ct')}>
              Chest CT
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyBuiltinTemplate('brain_mri')}>
              Brain MRI
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyBuiltinTemplate('clear')}>
              Clear
            </Button>

            {customTemplates.length > 0 && (
              <>
                <span className="text-sm text-slate-400 mx-1">·</span>
                {customTemplates.map(tpl => (
                  <span key={tpl.id} className="inline-flex items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-r-none border-r-0"
                      onClick={() => applyCustomTemplate(tpl.id)}
                    >
                      {tpl.name}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-l-none px-2"
                      onClick={() => deleteTemplate(tpl.id)}
                      aria-label={`Delete ${tpl.name}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </span>
                ))}
              </>
            )}

            <Popover open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!findings && !impression && !recommendations}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Save current
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Save as template</p>
                    <p className="text-xs text-slate-500">Reuse this report's content later.</p>
                  </div>
                  <Input
                    placeholder="Template name"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveAsTemplate()}
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setShowSaveTemplate(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={saveAsTemplate}>
                      Save
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

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

          {/* AI Analysis Result */}
          {aiConfidence !== null && (
            <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-slate-900">AI Analysis Complete</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Confidence</p>
                      <p className="text-lg font-bold text-purple-600">{Math.round(aiConfidence * 100)}%</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  AI has generated findings based on scan analysis. Review and edit as needed — this is a draft for your review.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick inserts */}
          <Card className="border-dashed">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">Quick insert</span>
                {QUICK_INSERTS.map((snip, idx) => (
                  <Button
                    key={idx}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => insertSnippet(snip.target, snip.text)}
                  >
                    {snip.label}
                    <span className="ml-1 text-slate-400 text-[10px]">→ {snip.target.slice(0, 4)}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

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

              {typeof aiConfidence === 'number' && (
                <div className="mb-4 text-xs text-slate-500 italic">
                  AI-assisted draft confidence: {Math.round(aiConfidence * 100)}%
                </div>
              )}

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
