import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { ScanCase, CaseStatus, Report, Radiologist, ScanType } from '@/types';
import { SCAN_TYPE_CONFIG } from '@/types';
import { useNotifications } from '@/hooks/useNotifications';

interface AssignmentResult {
  ok: boolean;
  radiologistId?: string;
  radiologistName?: string;
  reason?: string;
}

interface CasesContextType {
  cases: ScanCase[];
  isLoading: boolean;
  radiologists: Radiologist[];
  createCase: (caseData: Omit<ScanCase, 'id' | 'caseNumber' | 'status' | 'createdAt'>) => ScanCase;
  assignCase: (caseId: string, radiologistId: string) => void;
  autoAssignCase: (caseId: string) => AssignmentResult;
  bulkAutoAssign: (caseIds: string[]) => { assigned: number; skipped: number };
  acceptCase: (caseId: string) => void;
  declineCase: (caseId: string, reason?: string) => void;
  deferCase: (caseId: string) => void;
  startReading: (caseId: string) => void;
  submitReport: (caseId: string, report: Omit<Report, 'id' | 'caseId' | 'createdAt'>) => void;
  getCaseById: (caseId: string) => ScanCase | undefined;
  getCasesByStatus: (status: CaseStatus) => ScanCase[];
  getCasesByDiagnosticCenter: (centerId: string) => ScanCase[];
  getCasesByRadiologist: (radiologistId: string) => ScanCase[];
  getAvailableRadiologists: (scanType?: string) => Radiologist[];
  getDashboardMetrics: () => {
    totalCases: number;
    pendingCases: number;
    inProgressCases: number;
    completedCases: number;
    averageTurnaroundHours: number;
    todayCases: number;
    revenueThisMonth: number;
  };
}

const CasesContext = createContext<CasesContextType | undefined>(undefined);

const MOCK_RADIOLOGISTS: Radiologist[] = [
  {
    id: 'radio-1',
    userId: 'radio-001',
    name: 'Dr. Adebayo Johnson',
    email: 'radio@imole.ai',
    phone: '+234 802 345 6789',
    specialization: ['xray', 'ct', 'ultrasound'],
    isSenior: false,
    isAvailable: true,
    maxCasesPerDay: 10,
    currentCaseCount: 3,
  },
  {
    id: 'radio-2',
    userId: 'radio-2',
    name: 'Dr. Ngozi Okonkwo',
    email: 'senior@imole.ai',
    phone: '+234 803 456 7890',
    specialization: ['ct', 'mri'],
    isSenior: true,
    isAvailable: true,
    maxCasesPerDay: 8,
    currentCaseCount: 2,
  },
  {
    id: 'radio-3',
    userId: 'user-3',
    name: 'Dr. Emeka Okafor',
    email: 'emeka@imole.ai',
    phone: '+234 804 567 8901',
    specialization: ['xray', 'mri'],
    isSenior: false,
    isAvailable: true,
    maxCasesPerDay: 12,
    currentCaseCount: 5,
  },
];

const generateCaseNumber = () => {
  const prefix = 'TR';
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${date}-${random}`;
};

const slaDueDate = (createdAt: Date, scanType: ScanType): Date => {
  return new Date(createdAt.getTime() + SCAN_TYPE_CONFIG[scanType].turnaroundHours * 60 * 60 * 1000);
};

const generateMockCases = (): ScanCase[] => {
  const cases: ScanCase[] = [];
  const statuses: CaseStatus[] = ['pending', 'assigned', 'in_progress', 'completed'];
  const scanTypes = ['xray', 'ct', 'mri', 'ultrasound'] as const;

  for (let i = 0; i < 8; i++) {
    const status = statuses[i % 4];
    const scanType = scanTypes[i % 4];
    const createdAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);

    cases.push({
      id: `case-${i + 1}`,
      caseNumber: generateCaseNumber(),
      patient: {
        id: `patient-${i + 1}`,
        name: ['John Doe', 'Mary Johnson', 'James Brown', 'Sarah Wilson', 'Michael Davis', 'Emily Chen', 'David Kim', 'Lisa Anderson'][i],
        age: 25 + Math.floor(Math.random() * 50),
        gender: i % 2 === 0 ? 'male' : 'female',
        patientId: `PID-${1000 + i}`,
        referringPhysician: `Dr. Referrer ${i + 1}`,
      },
      diagnosticCenterId: 'center-001',
      diagnosticCenterName: 'Lagos Diagnostic Center',
      scanType,
      bodyPart: ['Chest', 'Brain/Head', 'Abdomen', 'Spine - Lumbar'][i % 4],
      clinicalHistory: 'Patient presents with symptoms requiring imaging evaluation. Relevant clinical history provided.',
      urgency: i % 3 === 0 ? 'urgent' : 'routine',
      status,
      assignedRadiologistId: status !== 'pending' ? MOCK_RADIOLOGISTS[i % 3].id : undefined,
      assignedRadiologistName: status !== 'pending' ? MOCK_RADIOLOGISTS[i % 3].name : undefined,
      radiologistResponse: status === 'in_progress' || status === 'completed' ? 'accepted' : status === 'assigned' ? 'pending' : undefined,
      dicomFiles: [],
      createdAt,
      assignedAt: status !== 'pending' ? new Date(createdAt.getTime() + 30 * 60 * 1000) : undefined,
      readingStartedAt: status === 'in_progress' || status === 'completed' ? new Date(createdAt.getTime() + 45 * 60 * 1000) : undefined,
      completedAt: status === 'completed' ? new Date(createdAt.getTime() + 3 * 60 * 60 * 1000) : undefined,
      turnaroundHours: status === 'completed' ? 2 + Math.random() * 4 : undefined,
      slaDueAt: slaDueDate(createdAt, scanType),
    });
  }

  return cases;
};

export function CasesProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<ScanCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [radiologists, setRadiologists] = useState<Radiologist[]>(MOCK_RADIOLOGISTS);
  const { notify } = useNotifications();

  useEffect(() => {
    setTimeout(() => {
      setCases(generateMockCases());
      setIsLoading(false);
    }, 500);
  }, []);

  const adjustRadiologistLoad = useCallback((radiologistId: string, delta: number) => {
    setRadiologists(prev => prev.map(r =>
      r.id === radiologistId
        ? { ...r, currentCaseCount: Math.max(0, r.currentCaseCount + delta) }
        : r,
    ));
  }, []);

  const createCase = useCallback((caseData: Omit<ScanCase, 'id' | 'caseNumber' | 'status' | 'createdAt'>) => {
    const createdAt = new Date();
    const newCase: ScanCase = {
      ...caseData,
      id: `case-${Date.now()}`,
      caseNumber: generateCaseNumber(),
      status: 'pending',
      createdAt,
      slaDueAt: slaDueDate(createdAt, caseData.scanType),
    };
    setCases(prev => [newCase, ...prev]);

    notify({
      audience: { role: 'admin' },
      type: caseData.urgency === 'stat' ? 'urgent_case' : 'case_assigned',
      title: caseData.urgency === 'stat' ? 'STAT case awaiting assignment' : 'New case awaiting assignment',
      message: `${newCase.caseNumber} · ${SCAN_TYPE_CONFIG[newCase.scanType].label} · ${newCase.bodyPart}`,
      caseId: newCase.id,
    });

    return newCase;
  }, [notify]);

  const assignCase = useCallback((caseId: string, radiologistId: string) => {
    const radiologist = radiologists.find(r => r.id === radiologistId);
    if (!radiologist) return;

    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      return {
        ...c,
        status: 'assigned',
        assignedRadiologistId: radiologistId,
        assignedRadiologistName: radiologist.name,
        radiologistResponse: 'pending',
        assignedAt: new Date(),
      };
    }));
    adjustRadiologistLoad(radiologistId, 1);

    const caseItem = cases.find(c => c.id === caseId);
    if (caseItem) {
      notify({
        audience: { role: 'radiologist', userId: radiologist.id },
        type: 'case_assigned',
        title: 'New case assigned to you',
        message: `${caseItem.caseNumber} · ${SCAN_TYPE_CONFIG[caseItem.scanType].label}${caseItem.urgency !== 'routine' ? ` · ${caseItem.urgency.toUpperCase()}` : ''}`,
        caseId,
      });
      notify({
        audience: { role: 'diagnostic_center', userId: caseItem.diagnosticCenterId },
        type: 'case_assigned',
        title: 'Case assigned to radiologist',
        message: `${caseItem.caseNumber} is now with ${radiologist.name}`,
        caseId,
      });
    }
  }, [radiologists, cases, adjustRadiologistLoad, notify]);

  const autoAssignCase = useCallback((caseId: string): AssignmentResult => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return { ok: false, reason: 'Case not found' };
    if (caseItem.status !== 'pending') return { ok: false, reason: 'Case is not pending' };

    const candidates = radiologists
      .filter(r => r.isAvailable && r.currentCaseCount < r.maxCasesPerDay)
      .filter(r => r.specialization.includes(caseItem.scanType))
      .sort((a, b) => {
        const aLoad = a.currentCaseCount / a.maxCasesPerDay;
        const bLoad = b.currentCaseCount / b.maxCasesPerDay;
        if (aLoad !== bLoad) return aLoad - bLoad;
        if (caseItem.urgency === 'stat' && a.isSenior !== b.isSenior) {
          return a.isSenior ? -1 : 1;
        }
        return 0;
      });

    if (candidates.length === 0) {
      return { ok: false, reason: 'No available radiologist matches this scan type' };
    }

    const pick = candidates[0];
    assignCase(caseId, pick.id);
    return { ok: true, radiologistId: pick.id, radiologistName: pick.name };
  }, [cases, radiologists, assignCase]);

  const bulkAutoAssign = useCallback((caseIds: string[]) => {
    let assigned = 0;
    let skipped = 0;
    caseIds.forEach(id => {
      const result = autoAssignCase(id);
      if (result.ok) assigned += 1;
      else skipped += 1;
    });
    return { assigned, skipped };
  }, [autoAssignCase]);

  const acceptCase = useCallback((caseId: string) => {
    setCases(prev => prev.map(c =>
      c.id === caseId ? { ...c, radiologistResponse: 'accepted' } : c,
    ));
    const caseItem = cases.find(c => c.id === caseId);
    if (caseItem) {
      notify({
        audience: { role: 'admin' },
        type: 'case_accepted',
        title: 'Case accepted',
        message: `${caseItem.assignedRadiologistName || 'Radiologist'} accepted ${caseItem.caseNumber}`,
        caseId,
      });
    }
  }, [cases, notify]);

  const declineCase = useCallback((caseId: string, reason?: string) => {
    const caseItem = cases.find(c => c.id === caseId);
    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      return {
        ...c,
        status: 'pending',
        assignedRadiologistId: undefined,
        assignedRadiologistName: undefined,
        radiologistResponse: undefined,
        declineReason: reason,
        assignedAt: undefined,
      };
    }));
    if (caseItem?.assignedRadiologistId) {
      adjustRadiologistLoad(caseItem.assignedRadiologistId, -1);
    }
    if (caseItem) {
      notify({
        audience: { role: 'admin' },
        type: 'case_declined',
        title: 'Case declined — needs reassignment',
        message: `${caseItem.assignedRadiologistName || 'Radiologist'} declined ${caseItem.caseNumber}${reason ? `: ${reason}` : ''}`,
        caseId,
      });
    }
  }, [cases, adjustRadiologistLoad, notify]);

  const deferCase = useCallback((caseId: string) => {
    setCases(prev => prev.map(c =>
      c.id === caseId ? { ...c, radiologistResponse: 'deferred' } : c,
    ));
  }, []);

  const startReading = useCallback((caseId: string) => {
    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      return {
        ...c,
        status: 'in_progress',
        readingStartedAt: c.readingStartedAt || new Date(),
        radiologistResponse: c.radiologistResponse === 'pending' ? 'accepted' : c.radiologistResponse,
      };
    }));
    const caseItem = cases.find(c => c.id === caseId);
    if (caseItem) {
      notify({
        audience: { role: 'diagnostic_center', userId: caseItem.diagnosticCenterId },
        type: 'reading_started',
        title: 'Reading started',
        message: `${caseItem.assignedRadiologistName || 'Your radiologist'} began reading ${caseItem.caseNumber}`,
        caseId,
      });
    }
  }, [cases, notify]);

  const submitReport = useCallback((caseId: string, report: Omit<Report, 'id' | 'caseId' | 'createdAt'>) => {
    const newReport: Report = {
      ...report,
      id: `report-${Date.now()}`,
      caseId,
      createdAt: new Date(),
    };

    let centerId: string | undefined;
    let caseNumber: string | undefined;
    let radiologistId: string | undefined;
    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      centerId = c.diagnosticCenterId;
      caseNumber = c.caseNumber;
      radiologistId = c.assignedRadiologistId;
      const completedAt = new Date();
      const turnaroundHours = (completedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60);
      return {
        ...c,
        status: 'completed',
        report: newReport,
        completedAt,
        turnaroundHours: Math.round(turnaroundHours * 10) / 10,
      };
    }));
    if (radiologistId) adjustRadiologistLoad(radiologistId, -1);
    if (centerId) {
      notify({
        audience: { role: 'diagnostic_center', userId: centerId },
        type: 'report_ready',
        title: 'Report ready',
        message: `Report for ${caseNumber} is ready to download`,
        caseId,
      });
    }
    notify({
      audience: { role: 'admin' },
      type: 'report_ready',
      title: 'Report completed',
      message: `${caseNumber} reported by ${report.radiologistName}`,
      caseId,
    });
  }, [adjustRadiologistLoad, notify]);

  const getCaseById = useCallback((caseId: string) => cases.find(c => c.id === caseId), [cases]);
  const getCasesByStatus = useCallback((status: CaseStatus) => cases.filter(c => c.status === status), [cases]);
  const getCasesByDiagnosticCenter = useCallback((centerId: string) => cases.filter(c => c.diagnosticCenterId === centerId), [cases]);
  const getCasesByRadiologist = useCallback((radiologistId: string) => cases.filter(c => c.assignedRadiologistId === radiologistId), [cases]);

  const getAvailableRadiologists = useCallback((scanType?: string) => {
    return radiologists.filter(r =>
      r.isAvailable &&
      r.currentCaseCount < r.maxCasesPerDay &&
      (!scanType || r.specialization.includes(scanType as ScanType))
    );
  }, [radiologists]);

  const getDashboardMetrics = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const totalCases = cases.length;
    const pendingCases = cases.filter(c => c.status === 'pending').length;
    const inProgressCases = cases.filter(c => c.status === 'in_progress').length;
    const completedCases = cases.filter(c => c.status === 'completed').length;

    const completedCasesList = cases.filter(c => c.status === 'completed' && c.turnaroundHours);
    const averageTurnaroundHours = completedCasesList.length > 0
      ? completedCasesList.reduce((sum, c) => sum + (c.turnaroundHours || 0), 0) / completedCasesList.length
      : 0;

    const todayCases = cases.filter(c => c.createdAt >= today).length;

    const revenueThisMonth = cases
      .filter(c => c.createdAt.getMonth() === now.getMonth() && c.createdAt.getFullYear() === now.getFullYear())
      .reduce((sum, c) => sum + SCAN_TYPE_CONFIG[c.scanType].price, 0);

    return {
      totalCases,
      pendingCases,
      inProgressCases,
      completedCases,
      averageTurnaroundHours: Math.round(averageTurnaroundHours * 10) / 10,
      todayCases,
      revenueThisMonth,
    };
  }, [cases]);

  return (
    <CasesContext.Provider value={{
      cases,
      isLoading,
      radiologists,
      createCase,
      assignCase,
      autoAssignCase,
      bulkAutoAssign,
      acceptCase,
      declineCase,
      deferCase,
      startReading,
      submitReport,
      getCaseById,
      getCasesByStatus,
      getCasesByDiagnosticCenter,
      getCasesByRadiologist,
      getAvailableRadiologists,
      getDashboardMetrics,
    }}>
      {children}
    </CasesContext.Provider>
  );
}

export function useCases() {
  const context = useContext(CasesContext);
  if (context === undefined) {
    throw new Error('useCases must be used within a CasesProvider');
  }
  return context;
}
