import { useMemo, useState } from 'react';
import { useCases } from '@/hooks/useCases';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
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
  Bone,
  Check,
  X,
  Clock,
  Download,
  Zap,
  AlertTriangle,
  Timer,
  Stethoscope,
} from 'lucide-react';
import {
  SCAN_TYPE_CONFIG,
  STATUS_COLORS,
  STATUS_LABELS,
  type ScanType,
  type CaseStatus,
  type ScanCase,
  type Radiologist,
} from '@/types';
import { cn } from '@/lib/utils';
import { downloadReportPdf } from '@/lib/reportPdf';

const SCAN_ICONS: Record<ScanType, React.ElementType> = {
  xray: Bone,
  ct: Scan,
  mri: Brain,
  ultrasound: Activity,
};

type SortKey = 'newest' | 'oldest' | 'urgency' | 'sla';

const URGENCY_RANK: Record<ScanCase['urgency'], number> = {
  stat: 0,
  urgent: 1,
  routine: 2,
};

interface CaseListProps {
  onViewCase?: (caseId: string) => void;
  onReportCase?: (caseId: string) => void;
}

function draftExists(caseId: string): boolean {
  try {
    return !!localStorage.getItem(`report-draft-${caseId}`);
  } catch {
    return false;
  }
}

function formatEta(due: Date): { label: string; overdue: boolean; soon: boolean } {
  const diff = due.getTime() - Date.now();
  const overdue = diff < 0;
  const absMs = Math.abs(diff);
  const minutes = Math.floor(absMs / 60_000);
  const hours = Math.floor(minutes / 60);
  let label: string;
  if (minutes < 60) label = `${minutes}m`;
  else if (hours < 24) label = `${hours}h ${minutes % 60}m`;
  else label = `${Math.floor(hours / 24)}d`;
  return {
    label: overdue ? `Overdue by ${label}` : `Due in ${label}`,
    overdue,
    soon: !overdue && diff < 30 * 60_000,
  };
}

export function CaseList({ onViewCase, onReportCase }: CaseListProps) {
  const { user } = useAuth();
  const {
    cases,
    isLoading,
    radiologists,
    assignCase,
    autoAssignCase,
    bulkAutoAssign,
  } = useCases();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all');
  const [scanTypeFilter, setScanTypeFilter] = useState<ScanType | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredCases = useMemo(() => {
    const list = cases.filter((caseItem) => {
      if (user?.role === 'diagnostic_center' && caseItem.diagnosticCenterId !== user.id) {
        return false;
      }
      if (user?.role === 'radiologist' && caseItem.assignedRadiologistId !== user.id) {
        return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          caseItem.caseNumber.toLowerCase().includes(query) ||
          caseItem.patient.name.toLowerCase().includes(query) ||
          caseItem.patient.patientId.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      if (statusFilter !== 'all' && caseItem.status !== statusFilter) return false;
      if (scanTypeFilter !== 'all' && caseItem.scanType !== scanTypeFilter) return false;
      return true;
    });

    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sortKey) {
        case 'newest':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'oldest':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'urgency':
          if (URGENCY_RANK[a.urgency] !== URGENCY_RANK[b.urgency]) {
            return URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
          }
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'sla': {
          const ad = a.slaDueAt?.getTime() ?? Infinity;
          const bd = b.slaDueAt?.getTime() ?? Infinity;
          return ad - bd;
        }
      }
    });
    return sorted;
  }, [cases, user, searchQuery, statusFilter, scanTypeFilter, sortKey]);

  const pendingVisible = useMemo(
    () => filteredCases.filter(c => c.status === 'pending'),
    [filteredCases],
  );

  const handleToggleSelect = (caseId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(caseId)) next.delete(caseId);
      else next.add(caseId);
      return next;
    });
  };

  const handleSelectAllPending = () => {
    if (selectedIds.size === pendingVisible.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingVisible.map(c => c.id)));
    }
  };

  const handleBulkAutoAssign = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const result = bulkAutoAssign(ids);
    setSelectedIds(new Set());
    if (result.assigned > 0) {
      toast.success(`Auto-assigned ${result.assigned} case${result.assigned !== 1 ? 's' : ''}`);
    }
    if (result.skipped > 0) {
      toast.warning(`Skipped ${result.skipped} (no matching radiologist available)`);
    }
  };

  const handleAutoAssignOne = (caseId: string) => {
    const result = autoAssignCase(caseId);
    if (result.ok) {
      toast.success(`Assigned to ${result.radiologistName}`);
    } else {
      toast.error(result.reason || 'Could not auto-assign');
    }
  };

  const handleAssign = (caseId: string, radiologistId: string) => {
    assignCase(caseId, radiologistId);
    toast.success('Case assigned');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const showAdminBulkBar = user?.role === 'admin' && pendingVisible.length > 0;

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
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="w-[160px]">
                <Clock className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="urgency">Urgency (STAT first)</SelectItem>
                <SelectItem value="sla">SLA (due soonest)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Admin bulk action bar */}
      {showAdminBulkBar && (
        <Card className="bg-blue-50/40 border-blue-100">
          <CardContent className="p-3 flex flex-wrap items-center gap-3">
            <Checkbox
              checked={selectedIds.size > 0 && selectedIds.size === pendingVisible.length}
              onCheckedChange={handleSelectAllPending}
              aria-label="Select all pending cases"
            />
            <span className="text-sm text-slate-700">
              {selectedIds.size > 0
                ? `${selectedIds.size} pending selected`
                : `${pendingVisible.length} pending cases`}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={selectedIds.size === 0}
                onClick={handleBulkAutoAssign}
              >
                <Zap className="w-4 h-4 mr-1" />
                Auto-assign selected
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={selectedIds.size === 0}
                onClick={() => setSelectedIds(new Set())}
              >
                Clear selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Case List */}
      <div className="space-y-4">
        {filteredCases.map((caseItem) => (
          <CaseCard
            key={caseItem.id}
            caseItem={caseItem}
            userRole={user?.role || 'diagnostic_center'}
            radiologists={radiologists}
            isSelected={selectedIds.has(caseItem.id)}
            onToggleSelect={() => handleToggleSelect(caseItem.id)}
            onAssign={handleAssign}
            onAutoAssign={() => handleAutoAssignOne(caseItem.id)}
            onView={() => onViewCase?.(caseItem.id)}
            onReport={() => onReportCase?.(caseItem.id)}
            userId={user?.id || ''}
            userName={user?.name || ''}
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
  userId: string;
  userName: string;
  radiologists: Radiologist[];
  isSelected: boolean;
  onToggleSelect: () => void;
  onAssign: (caseId: string, radiologistId: string) => void;
  onAutoAssign: () => void;
  onView: () => void;
  onReport: () => void;
}

function CaseCard({
  caseItem,
  userRole,
  userId,
  userName,
  radiologists,
  isSelected,
  onToggleSelect,
  onAssign,
  onAutoAssign,
  onView,
  onReport,
}: CaseCardProps) {
  const { acceptCase, declineCase, deferCase } = useCases();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedRadiologist, setSelectedRadiologist] = useState('');
  const [confirmingDecline, setConfirmingDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const ScanIcon = SCAN_ICONS[caseItem.scanType];
  const isPending = caseItem.status === 'pending';
  const isAssigned = caseItem.status === 'assigned';
  const isInProgress = caseItem.status === 'in_progress';
  const isCompleted = caseItem.status === 'completed';

  const canAssign = userRole === 'admin' && isPending;
  const canSelect = userRole === 'admin' && isPending;
  const canBulkRow = canSelect;

  const radioOwnsCase =
    userRole === 'radiologist' &&
    caseItem.assignedRadiologistId === userId;
  const awaitingResponse =
    radioOwnsCase && isAssigned && caseItem.radiologistResponse !== 'accepted';

  const hasDraft = !isCompleted && draftExists(caseItem.id);

  const canReport =
    (radioOwnsCase && (isAssigned || isInProgress) && caseItem.radiologistResponse !== 'declined') ||
    (userRole === 'admin' && !isPending);

  const slaInfo = caseItem.slaDueAt && !isCompleted ? formatEta(caseItem.slaDueAt) : null;

  const handleDecline = () => {
    declineCase(caseItem.id, declineReason || undefined);
    setConfirmingDecline(false);
    setDeclineReason('');
    toast.success('Case declined and returned to admin queue');
  };

  const handleDownloadReport = () => {
    if (!caseItem.report) return;
    downloadReportPdf({
      caseItem,
      findings: caseItem.report.findings,
      impression: caseItem.report.impression,
      recommendations: caseItem.report.recommendations,
      radiologistName: caseItem.report.radiologistName,
      aiConfidence: caseItem.report.aiConfidence ?? undefined,
      reportDate: caseItem.report.createdAt,
    });
    toast.success('Report downloaded');
  };

  // Suppress unused warning for userName — kept for future signing flows
  void userName;

  return (
    <Card className={cn(
      'overflow-hidden transition-all',
      isExpanded && 'ring-2 ring-blue-500',
      isSelected && 'ring-2 ring-blue-400 bg-blue-50/30',
      slaInfo?.overdue && 'border-red-200',
    )}>
      <div className="p-4">
        <div className="flex items-start gap-4">
          {canBulkRow && (
            <div className="pt-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={onToggleSelect}
                aria-label={`Select case ${caseItem.caseNumber}`}
              />
            </div>
          )}

          <div className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
            caseItem.scanType === 'xray' && 'bg-slate-100',
            caseItem.scanType === 'ct' && 'bg-blue-50',
            caseItem.scanType === 'mri' && 'bg-purple-50',
            caseItem.scanType === 'ultrasound' && 'bg-green-50',
          )}>
            <ScanIcon className={cn(
              'w-6 h-6',
              caseItem.scanType === 'xray' && 'text-slate-600',
              caseItem.scanType === 'ct' && 'text-blue-600',
              caseItem.scanType === 'mri' && 'text-purple-600',
              caseItem.scanType === 'ultrasound' && 'text-green-600',
            )} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-slate-900">{caseItem.caseNumber}</h3>
                  <Badge variant="outline" className={cn('text-xs', STATUS_COLORS[caseItem.status])}>
                    {STATUS_LABELS[caseItem.status]}
                  </Badge>
                  {caseItem.urgency !== 'routine' && (
                    <Badge variant="outline" className={cn(
                      'text-xs',
                      caseItem.urgency === 'stat'
                        ? 'bg-red-100 text-red-700 border-red-200'
                        : 'bg-amber-100 text-amber-700 border-amber-200',
                    )}>
                      {caseItem.urgency.toUpperCase()}
                    </Badge>
                  )}
                  {awaitingResponse && (
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                      Awaiting your response
                    </Badge>
                  )}
                  {hasDraft && (
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                      Draft saved
                    </Badge>
                  )}
                  {slaInfo && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        slaInfo.overdue && 'bg-red-100 text-red-700 border-red-200',
                        !slaInfo.overdue && slaInfo.soon && 'bg-amber-50 text-amber-700 border-amber-200',
                        !slaInfo.overdue && !slaInfo.soon && 'bg-slate-50 text-slate-600 border-slate-200',
                      )}
                    >
                      {slaInfo.overdue ? <AlertTriangle className="w-3 h-3 mr-1 inline" /> : <Timer className="w-3 h-3 mr-1 inline" />}
                      {slaInfo.label}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {caseItem.patient.name}, {caseItem.patient.age}y
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {caseItem.diagnosticCenterName}
                  </span>
                  {caseItem.assignedRadiologistName && (
                    <span className="flex items-center gap-1">
                      <Stethoscope className="w-3 h-3" />
                      {caseItem.assignedRadiologistName}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {radioOwnsCase && awaitingResponse && (
                  <>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        acceptCase(caseItem.id);
                        toast.success('Case accepted');
                      }}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deferCase(caseItem.id)}>
                      <Clock className="w-4 h-4 mr-1" />
                      Defer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-700 border-red-200 hover:bg-red-50"
                      onClick={() => setConfirmingDecline(v => !v)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </>
                )}

                <Button variant="outline" size="sm" onClick={onView}>
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>

                {canReport && !isCompleted && (
                  <Button size="sm" onClick={onReport}>
                    <FileText className="w-4 h-4 mr-1" />
                    Report
                  </Button>
                )}

                {isCompleted && (
                  <>
                    <Button variant="outline" size="sm" onClick={onReport}>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      View Report
                    </Button>
                    {caseItem.report && (
                      <Button size="sm" variant="outline" onClick={handleDownloadReport}>
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                    )}
                  </>
                )}

                {canAssign && (
                  <Button size="sm" variant="outline" onClick={onAutoAssign}>
                    <Zap className="w-4 h-4 mr-1" />
                    Auto-assign
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  <ArrowRight className={cn(
                    'w-4 h-4 transition-transform',
                    isExpanded && 'rotate-90',
                  )} />
                </Button>
              </div>
            </div>

            {confirmingDecline && (
              <div className="mt-3 p-3 border border-red-200 bg-red-50 rounded-lg space-y-2">
                <p className="text-sm font-medium text-red-900">
                  Decline this case? It will be returned to admin for reassignment.
                </p>
                <Input
                  placeholder="Reason (optional)"
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setConfirmingDecline(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleDecline}>
                    Confirm decline
                  </Button>
                </div>
              </div>
            )}

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
                      {caseItem.assignedAt && (
                        <p><span className="text-slate-400">Assigned:</span> {caseItem.assignedAt.toLocaleString()}</p>
                      )}
                      {caseItem.readingStartedAt && (
                        <p><span className="text-slate-400">Reading started:</span> {caseItem.readingStartedAt.toLocaleString()}</p>
                      )}
                      {caseItem.slaDueAt && (
                        <p><span className="text-slate-400">SLA target:</span> {caseItem.slaDueAt.toLocaleString()}</p>
                      )}
                      {caseItem.assignedRadiologistName && (
                        <p><span className="text-slate-400">Radiologist:</span> {caseItem.assignedRadiologistName}</p>
                      )}
                      {caseItem.turnaroundHours && (
                        <p><span className="text-slate-400">Turnaround:</span> {caseItem.turnaroundHours} hours</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-slate-500 mb-2">Clinical History</h4>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                    {caseItem.clinicalHistory}
                  </p>
                </div>

                {canAssign && (
                  <div className="mt-4 flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-slate-500">Manual assign to:</span>
                    <Select value={selectedRadiologist} onValueChange={setSelectedRadiologist}>
                      <SelectTrigger className="w-[260px]">
                        <SelectValue placeholder="Select radiologist" />
                      </SelectTrigger>
                      <SelectContent>
                        {radiologists.map((radio) => {
                          const matches = radio.specialization.includes(caseItem.scanType);
                          const atCapacity = radio.currentCaseCount >= radio.maxCasesPerDay;
                          return (
                            <SelectItem key={radio.id} value={radio.id} disabled={atCapacity}>
                              {radio.name} ({radio.currentCaseCount}/{radio.maxCasesPerDay})
                              {!matches && ' · off-specialty'}
                              {atCapacity && ' · full'}
                            </SelectItem>
                          );
                        })}
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
                      <div className="pt-2 border-t border-green-200 flex items-center justify-between flex-wrap gap-2">
                        <p className="text-xs text-green-600">
                          Reported by {caseItem.report.radiologistName} on {caseItem.report.createdAt.toLocaleString()}
                          {typeof caseItem.report.aiConfidence === 'number' && (
                            <> · AI confidence {Math.round(caseItem.report.aiConfidence * 100)}%</>
                          )}
                        </p>
                        <Button size="sm" variant="outline" onClick={handleDownloadReport}>
                          <Download className="w-4 h-4 mr-1" />
                          Download PDF
                        </Button>
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

