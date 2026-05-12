import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { ScanCase, CaseStatus, Report, Radiologist } from '@/types';

interface CasesContextType {
  cases: ScanCase[];
  isLoading: boolean;
  radiologists: Radiologist[];
  createCase: (caseData: Omit<ScanCase, 'id' | 'caseNumber' | 'status' | 'createdAt'>) => ScanCase;
  assignCase: (caseId: string, radiologistId: string) => void;
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

// Mock radiologists
const MOCK_RADIOLOGISTS: Radiologist[] = [
  {
    id: 'radio-1',
    userId: 'user-1',
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
    userId: 'user-2',
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

// Generate mock case number
const generateCaseNumber = () => {
  const prefix = 'TR';
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${date}-${random}`;
};

// Mock initial cases
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
      diagnosticCenterId: 'center-1',
      diagnosticCenterName: 'Lagos Diagnostic Center',
      scanType,
      bodyPart: ['Chest', 'Brain/Head', 'Abdomen', 'Spine - Lumbar'][i % 4],
      clinicalHistory: 'Patient presents with symptoms requiring imaging evaluation. Relevant clinical history provided.',
      urgency: i % 3 === 0 ? 'urgent' : 'routine',
      status,
      assignedRadiologistId: status !== 'pending' ? MOCK_RADIOLOGISTS[i % 3].id : undefined,
      assignedRadiologistName: status !== 'pending' ? MOCK_RADIOLOGISTS[i % 3].name : undefined,
      dicomFiles: [],
      createdAt,
      assignedAt: status !== 'pending' ? new Date(createdAt.getTime() + 30 * 60 * 1000) : undefined,
      completedAt: status === 'completed' ? new Date(createdAt.getTime() + 3 * 60 * 60 * 1000) : undefined,
      turnaroundHours: status === 'completed' ? 2 + Math.random() * 4 : undefined,
    });
  }
  
  return cases;
};

export function CasesProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<ScanCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [radiologists] = useState<Radiologist[]>(MOCK_RADIOLOGISTS);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setCases(generateMockCases());
      setIsLoading(false);
    }, 500);
  }, []);

  const createCase = useCallback((caseData: Omit<ScanCase, 'id' | 'caseNumber' | 'status' | 'createdAt'>) => {
    const newCase: ScanCase = {
      ...caseData,
      id: `case-${Date.now()}`,
      caseNumber: generateCaseNumber(),
      status: 'pending',
      createdAt: new Date(),
    };
    setCases(prev => [newCase, ...prev]);
    return newCase;
  }, []);

  const assignCase = useCallback((caseId: string, radiologistId: string) => {
    const radiologist = radiologists.find(r => r.id === radiologistId);
    if (!radiologist) return;

    setCases(prev => prev.map(c => {
      if (c.id === caseId) {
        return {
          ...c,
          status: 'assigned',
          assignedRadiologistId: radiologistId,
          assignedRadiologistName: radiologist.name,
          assignedAt: new Date(),
        };
      }
      return c;
    }));
  }, [radiologists]);

  const startReading = useCallback((caseId: string) => {
    setCases(prev => prev.map(c => {
      if (c.id === caseId) {
        return { ...c, status: 'in_progress' };
      }
      return c;
    }));
  }, []);

  const submitReport = useCallback((caseId: string, report: Omit<Report, 'id' | 'caseId' | 'createdAt'>) => {
    const newReport: Report = {
      ...report,
      id: `report-${Date.now()}`,
      caseId,
      createdAt: new Date(),
    };

    setCases(prev => prev.map(c => {
      if (c.id === caseId) {
        const completedAt = new Date();
        const turnaroundHours = (completedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60);
        return {
          ...c,
          status: 'completed',
          report: newReport,
          completedAt,
          turnaroundHours: Math.round(turnaroundHours * 10) / 10,
        };
      }
      return c;
    }));
  }, []);

  const getCaseById = useCallback((caseId: string) => {
    return cases.find(c => c.id === caseId);
  }, [cases]);

  const getCasesByStatus = useCallback((status: CaseStatus) => {
    return cases.filter(c => c.status === status);
  }, [cases]);

  const getCasesByDiagnosticCenter = useCallback((centerId: string) => {
    return cases.filter(c => c.diagnosticCenterId === centerId);
  }, [cases]);

  const getCasesByRadiologist = useCallback((radiologistId: string) => {
    return cases.filter(c => c.assignedRadiologistId === radiologistId);
  }, [cases]);

  const getAvailableRadiologists = useCallback((scanType?: string) => {
    return radiologists.filter(r => 
      r.isAvailable && 
      r.currentCaseCount < r.maxCasesPerDay &&
      (!scanType || r.specialization.includes(scanType as any))
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
    
    // Calculate revenue based on scan types
    const revenueThisMonth = cases
      .filter(c => c.createdAt.getMonth() === now.getMonth() && c.createdAt.getFullYear() === now.getFullYear())
      .reduce((sum, c) => {
        const prices = { xray: 5000, ct: 15000, mri: 25000, ultrasound: 8000 };
        return sum + prices[c.scanType];
      }, 0);

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
