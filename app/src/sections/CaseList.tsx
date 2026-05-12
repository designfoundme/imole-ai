import { useState } from 'react';
import { useCases } from '@/hooks/useCases';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Eye, 
  FileText, 
  CheckCircle,
  Scan,
  Brain,
  Activity,
  User,
  Building2,
  ArrowRight,
  Bone
} from 'lucide-react';
import { SCAN_TYPE_CONFIG, STATUS_COLORS, STATUS_LABELS, type ScanType, type CaseStatus, type ScanCase } from '@/types';
import { cn } from '@/lib/utils';

const SCAN_ICONS: Record<ScanType, React.ElementType> = {
  xray: Bone,
  ct: Scan,
  mri: Brain,
  ultrasound: Activity,
};

interface CaseListProps {
  onViewCase?: (caseId: string) => void;
  onReportCase?: (caseId: string) => void;
}

export function CaseList({ onViewCase, onReportCase }: CaseListProps) {
  const { user } = useAuth();
  const { cases, isLoading, radiologists, assignCase } = useCases();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all');
  const [scanTypeFilter, setScanTypeFilter] = useState<ScanType | 'all'>('all');
  // Selected case state for future expansion
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, _setSelectedCase] = useState<string | null>(null);

  // Filter cases based on user role and filters
  const filteredCases = cases.filter((caseItem) => {
    // Role-based filtering
    if (user?.role === 'diagnostic_center' && caseItem.diagnosticCenterId !== user.id) {
      return false;
    }
    if (user?.role === 'radiologist' && caseItem.assignedRadiologistId !== user.id) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        caseItem.caseNumber.toLowerCase().includes(query) ||
        caseItem.patient.name.toLowerCase().includes(query) ||
        caseItem.patient.patientId.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && caseItem.status !== statusFilter) {
      return false;
    }

    // Scan type filter
    if (scanTypeFilter !== 'all' && caseItem.scanType !== scanTypeFilter) {
      return false;
    }

    return true;
  });

  const handleAssign = (caseId: string, radiologistId: string) => {
    assignCase(caseId, radiologistId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by case #, patient name, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as CaseStatus | 'all')}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={scanTypeFilter} onValueChange={(v) => setScanTypeFilter(v as ScanType | 'all')}>
              <SelectTrigger className="w-[140px]">
                <Activity className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Scan Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="xray">X-Ray</SelectItem>
                <SelectItem value="ct">CT Scan</SelectItem>
                <SelectItem value="mri">MRI</SelectItem>
                <SelectItem value="ultrasound">Ultrasound</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Case List */}
      <div className="space-y-4">
        {filteredCases.map((caseItem) => (
          <CaseCard
            key={caseItem.id}
            caseItem={caseItem}
            userRole={user?.role || 'diagnostic_center'}
            radiologists={radiologists}
            onAssign={handleAssign}
            onView={() => onViewCase?.(caseItem.id)}
            onReport={() => onReportCase?.(caseItem.id)}
          />
        ))}

        {filteredCases.length === 0 && (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">No cases found</h3>
            <p className="text-slate-500">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface CaseCardProps {
  caseItem: ScanCase;
  userRole: string;
  radiologists: any[];
  onAssign: (caseId: string, radiologistId: string) => void;
  onView: () => void;
  onReport: () => void;
}

function CaseCard({ caseItem, userRole, radiologists, onAssign, onView, onReport }: CaseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedRadiologist, setSelectedRadiologist] = useState('');

  const ScanIcon = SCAN_ICONS[caseItem.scanType];
  const isPending = caseItem.status === 'pending';
  const isAssigned = caseItem.status === 'assigned';
  const isInProgress = caseItem.status === 'in_progress';
  const isCompleted = caseItem.status === 'completed';

  const canAssign = userRole === 'admin' && isPending;
  const canReport = (userRole === 'radiologist' && (isAssigned || isInProgress)) ||
                    (userRole === 'admin' && !isPending);
  const canView = true;

  return (
    <Card className={cn(
      'overflow-hidden transition-all',
      isExpanded && 'ring-2 ring-blue-500'
    )}>
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Scan Type Icon */}
          <div className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
            caseItem.scanType === 'xray' && 'bg-slate-100',
            caseItem.scanType === 'ct' && 'bg-blue-50',
            caseItem.scanType === 'mri' && 'bg-purple-50',
            caseItem.scanType === 'ultrasound' && 'bg-green-50'
          )}>
            <ScanIcon className={cn(
              'w-6 h-6',
              caseItem.scanType === 'xray' && 'text-slate-600',
              caseItem.scanType === 'ct' && 'text-blue-600',
              caseItem.scanType === 'mri' && 'text-purple-600',
              caseItem.scanType === 'ultrasound' && 'text-green-600'
            )} />
          </div>

          {/* Case Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900">{caseItem.caseNumber}</h3>
                  <Badge variant="outline" className={cn('text-xs', STATUS_COLORS[caseItem.status])}>
                    {STATUS_LABELS[caseItem.status]}
                  </Badge>
                  {caseItem.urgency !== 'routine' && (
                    <Badge variant="outline" className={cn(
                      'text-xs',
                      caseItem.urgency === 'stat' 
                        ? 'bg-red-100 text-red-700 border-red-200' 
                        : 'bg-amber-100 text-amber-700 border-amber-200'
                    )}>
                      {caseItem.urgency.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {caseItem.patient.name}, {caseItem.patient.age}y
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {caseItem.diagnosticCenterName}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {canView && (
                  <Button variant="outline" size="sm" onClick={onView}>
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                )}
                {canReport && !isCompleted && (
                  <Button size="sm" onClick={onReport}>
                    <FileText className="w-4 h-4 mr-1" />
                    Report
                  </Button>
                )}
                {isCompleted && (
                  <Button variant="outline" size="sm" onClick={onReport}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    View Report
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <ArrowRight className={cn(
                    'w-4 h-4 transition-transform',
                    isExpanded && 'rotate-90'
                  )} />
                </Button>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-2">Patient Details</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-slate-400">Name:</span> {caseItem.patient.name}</p>
                      <p><span className="text-slate-400">Age:</span> {caseItem.patient.age} years</p>
                      <p><span className="text-slate-400">Gender:</span> {caseItem.patient.gender}</p>
                      <p><span className="text-slate-400">Patient ID:</span> {caseItem.patient.patientId}</p>
                      {caseItem.patient.referringPhysician && (
                        <p><span className="text-slate-400">Referring:</span> {caseItem.patient.referringPhysician}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-2">Case Details</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-slate-400">Scan Type:</span> {SCAN_TYPE_CONFIG[caseItem.scanType].label}</p>
                      <p><span className="text-slate-400">Body Part:</span> {caseItem.bodyPart}</p>
                      <p><span className="text-slate-400">Urgency:</span> {caseItem.urgency}</p>
                      <p><span className="text-slate-400">Submitted:</span> {caseItem.createdAt.toLocaleString()}</p>
                      {caseItem.assignedRadiologistName && (
                        <p><span className="text-slate-400">Radiologist:</span> {caseItem.assignedRadiologistName}</p>
                      )}
                      {caseItem.turnaroundHours && (
                        <p><span className="text-slate-400">Turnaround:</span> {caseItem.turnaroundHours} hours</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Clinical History */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-slate-500 mb-2">Clinical History</h4>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                    {caseItem.clinicalHistory}
                  </p>
                </div>

                {/* Assignment (Admin only) */}
                {canAssign && (
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-sm text-slate-500">Assign to:</span>
                    <Select value={selectedRadiologist} onValueChange={setSelectedRadiologist}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select radiologist" />
                      </SelectTrigger>
                      <SelectContent>
                        {radiologists.map((radio) => (
                          <SelectItem key={radio.id} value={radio.id}>
                            {radio.name} ({radio.currentCaseCount}/{radio.maxCasesPerDay})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      disabled={!selectedRadiologist}
                      onClick={() => onAssign(caseItem.id, selectedRadiologist)}
                    >
                      Assign
                    </Button>
                  </div>
                )}

                {/* Report Preview (if completed) */}
                {isCompleted && caseItem.report && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-slate-500 mb-2">Report</h4>
                    <div className="bg-green-50 border border-green-100 rounded-lg p-4 space-y-3">
                      <div>
                        <p className="text-xs font-medium text-green-700 uppercase">Findings</p>
                        <p className="text-sm text-slate-700 mt-1">{caseItem.report.findings}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-green-700 uppercase">Impression</p>
                        <p className="text-sm text-slate-700 mt-1">{caseItem.report.impression}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-green-700 uppercase">Recommendations</p>
                        <p className="text-sm text-slate-700 mt-1">{caseItem.report.recommendations}</p>
                      </div>
                      <div className="pt-2 border-t border-green-200">
                        <p className="text-xs text-green-600">
                          Reported by {caseItem.report.radiologistName} on {caseItem.report.createdAt.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
