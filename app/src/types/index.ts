// Teleradiology MVP Types

export type UserRole = 'admin' | 'diagnostic_center' | 'radiologist';

export type ScanType = 'xray' | 'ct' | 'mri' | 'ultrasound';

export type CaseStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  organization?: string;
  createdAt: Date;
}

export interface DiagnosticCenter {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: 'lagos' | 'ibadan' | 'abuja' | 'other';
  equipment: ScanType[];
  contactPerson: string;
}

export interface Radiologist {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  specialization: ScanType[];
  isSenior: boolean;
  isAvailable: boolean;
  maxCasesPerDay: number;
  currentCaseCount: number;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  patientId: string;
  referringPhysician?: string;
}

export type RadiologistResponse = 'pending' | 'accepted' | 'declined' | 'deferred';

export interface ScanCase {
  id: string;
  caseNumber: string;
  patient: Patient;
  diagnosticCenterId: string;
  diagnosticCenterName: string;
  scanType: ScanType;
  bodyPart: string;
  clinicalHistory: string;
  urgency: 'routine' | 'urgent' | 'stat';
  status: CaseStatus;
  assignedRadiologistId?: string;
  assignedRadiologistName?: string;
  radiologistResponse?: RadiologistResponse;
  declineReason?: string;
  dicomFiles: DicomFile[];
  report?: Report;
  createdAt: Date;
  assignedAt?: Date;
  readingStartedAt?: Date;
  completedAt?: Date;
  turnaroundHours?: number;
  slaDueAt?: Date;
}

export interface DicomFile {
  id: string;
  fileName: string;
  fileSize: number;
  uploadProgress: number;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
  studyInstanceUid?: string;
  seriesInstanceUid?: string;
}

export interface Report {
  id: string;
  caseId: string;
  radiologistId: string;
  radiologistName: string;
  findings: string;
  impression: string;
  recommendations: string;
  pdfUrl?: string;
  aiConfidence?: number;
  createdAt: Date;
  signedAt?: Date;
}

export interface ReportTemplate {
  id: string;
  name: string;
  scanType: ScanType;
  bodyPart: string;
  templateFindings: string;
  templateImpression: string;
  templateRecommendations: string;
}

export type NotificationType =
  | 'case_assigned'
  | 'case_accepted'
  | 'case_declined'
  | 'reading_started'
  | 'report_ready'
  | 'urgent_case'
  | 'sla_breach';

export interface Notification {
  id: string;
  audience: { role: UserRole; userId?: string };
  type: NotificationType;
  title: string;
  message: string;
  caseId?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface DashboardMetrics {
  totalCases: number;
  pendingCases: number;
  inProgressCases: number;
  completedCases: number;
  averageTurnaroundHours: number;
  todayCases: number;
  revenueThisMonth: number;
}

// Scan type configuration
export const SCAN_TYPE_CONFIG: Record<ScanType, { label: string; turnaroundHours: number; price: number }> = {
  xray: { label: 'X-Ray', turnaroundHours: 1, price: 5000 },
  ct: { label: 'CT Scan', turnaroundHours: 3, price: 15000 },
  mri: { label: 'MRI', turnaroundHours: 6, price: 25000 },
  ultrasound: { label: 'Ultrasound', turnaroundHours: 2, price: 8000 },
};

// City options
export const CITIES = [
  { value: 'lagos', label: 'Lagos' },
  { value: 'ibadan', label: 'Ibadan' },
  { value: 'abuja', label: 'Abuja' },
  { value: 'other', label: 'Other' },
] as const;

// Body parts for dropdown
export const BODY_PARTS = [
  'Brain/Head',
  'Neck',
  'Chest',
  'Abdomen',
  'Pelvis',
  'Spine - Cervical',
  'Spine - Thoracic',
  'Spine - Lumbar',
  'Upper Extremity - Right',
  'Upper Extremity - Left',
  'Lower Extremity - Right',
  'Lower Extremity - Left',
  'Whole Body',
  'Other',
] as const;

// Status colors for badges
export const STATUS_COLORS: Record<CaseStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  assigned: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
};

// Status labels
export const STATUS_LABELS: Record<CaseStatus, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
