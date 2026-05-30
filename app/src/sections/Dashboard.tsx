import { useMemo } from 'react';
import { useCases } from '@/hooks/useCases';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Clock,
  FileText,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Timer,
  Scan,
  Brain,
  Bone,
} from 'lucide-react';
import { SCAN_TYPE_CONFIG, type ScanType, type CaseStatus, type ScanCase } from '@/types';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<CaseStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  assigned: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
};

const STATUS_LABELS: Record<CaseStatus, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const SCAN_ICONS: Record<ScanType, React.ElementType> = {
  xray: Bone,
  ct: Scan,
  mri: Brain,
  ultrasound: Activity,
};

interface DashboardProps {
  onViewChange: (view: string) => void;
}

function startOfToday(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function Dashboard({ onViewChange }: DashboardProps) {
  const { user } = useAuth();
  const { getDashboardMetrics, cases, isLoading } = useCases();

  const metrics = getDashboardMetrics();

  const visibleCases: ScanCase[] = useMemo(() => {
    return cases.filter(c => {
      if (user?.role === 'diagnostic_center') return c.diagnosticCenterId === user.id;
      if (user?.role === 'radiologist') return c.assignedRadiologistId === user.id;
      return true;
    });
  }, [cases, user]);

  const recentCases = visibleCases.slice(0, 5);

  const personalStats = useMemo(() => {
    if (user?.role !== 'radiologist') return null;
    const today = startOfToday();
    const mine = visibleCases;
    const completedAll = mine.filter(c => c.status === 'completed' && typeof c.turnaroundHours === 'number');
    const todays = mine.filter(c => c.createdAt >= today);
    const completedToday = todays.filter(c => c.status === 'completed');
    const inProgress = mine.filter(c => c.status === 'in_progress').length;
    const awaiting = mine.filter(c => c.status === 'assigned' && c.radiologistResponse !== 'accepted').length;

    const avgTurnaround =
      completedAll.length > 0
        ? completedAll.reduce((sum, c) => sum + (c.turnaroundHours || 0), 0) / completedAll.length
        : 0;

    const byScanType: Record<ScanType, number> = { xray: 0, ct: 0, mri: 0, ultrasound: 0 };
    mine.forEach(c => {
      byScanType[c.scanType] += 1;
    });

    return {
      todayCount: todays.length,
      completedTodayCount: completedToday.length,
      inProgress,
      awaiting,
      avgTurnaroundHours: Math.round(avgTurnaround * 10) / 10,
      byScanType,
      totalAssignedToMe: mine.length,
    };
  }, [user, visibleCases]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const showPersonalStats = user?.role === 'radiologist' && personalStats;

  return (
    <div className="space-y-6">
      {/* Personal radiologist stats */}
      {showPersonalStats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Today's Cases"
              value={personalStats.todayCount}
              icon={Activity}
              subtitle={`${personalStats.completedTodayCount} completed today`}
            />
            <MetricCard
              title="Awaiting Response"
              value={personalStats.awaiting}
              icon={AlertCircle}
              subtitle="Accept or decline"
              variant="warning"
            />
            <MetricCard
              title="In Progress"
              value={personalStats.inProgress}
              icon={Timer}
              subtitle="Currently reading"
              variant="info"
            />
            <MetricCard
              title="Avg Turnaround"
              value={personalStats.avgTurnaroundHours}
              icon={CheckCircle}
              subtitle="Hours per case"
              variant="success"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Volume by Scan Type</CardTitle>
            </CardHeader>
            <CardContent>
              {personalStats.totalAssignedToMe === 0 ? (
                <p className="text-sm text-slate-500">No cases assigned to you yet.</p>
              ) : (
                <div className="space-y-3">
                  {(Object.keys(personalStats.byScanType) as ScanType[]).map(type => {
                    const Icon = SCAN_ICONS[type];
                    const count = personalStats.byScanType[type];
                    const pct =
                      personalStats.totalAssignedToMe > 0
                        ? Math.round((count / personalStats.totalAssignedToMe) * 100)
                        : 0;
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="flex items-center gap-2 text-slate-700">
                            <Icon className="w-4 h-4 text-slate-400" />
                            {SCAN_TYPE_CONFIG[type].label}
                          </span>
                          <span className="text-slate-500">{count} · {pct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className={cn(
                              'h-2 rounded-full',
                              type === 'xray' && 'bg-slate-400',
                              type === 'ct' && 'bg-blue-500',
                              type === 'mri' && 'bg-purple-500',
                              type === 'ultrasound' && 'bg-green-500',
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Standard metrics for admin & center */}
      {!showPersonalStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Cases"
            value={metrics.totalCases}
            icon={FileText}
            trend={`+${metrics.todayCases} today`}
            trendUp={true}
          />
          <MetricCard
            title="Pending Cases"
            value={metrics.pendingCases}
            icon={AlertCircle}
            subtitle="Awaiting assignment"
            variant="warning"
          />
          <MetricCard
            title="In Progress"
            value={metrics.inProgressCases}
            icon={Timer}
            subtitle="Currently reading"
            variant="info"
          />
          <MetricCard
            title="Completed"
            value={metrics.completedCases}
            icon={CheckCircle}
            subtitle={`Avg ${metrics.averageTurnaroundHours}h turnaround`}
            variant="success"
          />
        </div>
      )}

      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {formatCurrency(metrics.revenueThisMonth)}
                </span>
                <span className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12%
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Based on cases this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Average Turnaround</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {metrics.averageTurnaroundHours}h
                </span>
                <span className="text-sm text-slate-500">target: 6h</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-3">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((metrics.averageTurnaroundHours / 6) * 100, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {user?.role === 'diagnostic_center' && (
          <Button onClick={() => onViewChange('upload')}>
            <Activity className="w-4 h-4 mr-2" />
            Upload New Scan
          </Button>
        )}
        {user?.role === 'radiologist' && (
          <Button onClick={() => onViewChange('cases')}>
            <FileText className="w-4 h-4 mr-2" />
            View Assigned Cases
          </Button>
        )}
        <Button variant="outline" onClick={() => onViewChange('cases')}>
          <Clock className="w-4 h-4 mr-2" />
          View All Cases
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Cases</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onViewChange('cases')}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Case #</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Patient</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Scan Type</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentCases.map((caseItem) => {
                  const ScanIcon = SCAN_ICONS[caseItem.scanType];
                  return (
                    <tr key={caseItem.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">
                        {caseItem.caseNumber}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        <div>
                          <p className="font-medium">{caseItem.patient.name}</p>
                          <p className="text-xs text-slate-400">{caseItem.bodyPart}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <ScanIcon className="w-4 h-4 text-slate-400" />
                          {SCAN_TYPE_CONFIG[caseItem.scanType].label}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={cn('text-xs', STATUS_COLORS[caseItem.status])}>
                          {STATUS_LABELS[caseItem.status]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">
                        {caseItem.createdAt.toLocaleDateString('en-NG', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {recentCases.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No cases found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  variant?: 'default' | 'warning' | 'info' | 'success';
}

function MetricCard({ title, value, icon: Icon, trend, trendUp, subtitle, variant = 'default' }: MetricCardProps) {
  const variantStyles = {
    default: 'bg-white',
    warning: 'bg-amber-50/50 border-amber-100',
    info: 'bg-blue-50/50 border-blue-100',
    success: 'bg-green-50/50 border-green-100',
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
            {trend && (
              <p className={cn(
                'text-xs mt-1 flex items-center',
                trendUp ? 'text-green-600' : 'text-slate-500',
              )}>
                <TrendingUp className="w-3 h-3 mr-1" />
                {trend}
              </p>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            variant === 'warning' && 'bg-amber-100',
            variant === 'info' && 'bg-blue-100',
            variant === 'success' && 'bg-green-100',
            variant === 'default' && 'bg-slate-100',
          )}>
            <Icon className={cn(
              'w-5 h-5',
              variant === 'warning' && 'text-amber-600',
              variant === 'info' && 'text-blue-600',
              variant === 'success' && 'text-green-600',
              variant === 'default' && 'text-slate-600',
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
