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
  Bone
} from 'lucide-react';
import { SCAN_TYPE_CONFIG, type ScanType, type CaseStatus } from '@/types';
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

export function Dashboard({ onViewChange }: DashboardProps) {
  const { user } = useAuth();
  const { getDashboardMetrics, cases, isLoading } = useCases();

  const metrics = getDashboardMetrics();

  // Get recent cases based on user role
  const recentCases = cases
    .filter(c => {
      if (user?.role === 'diagnostic_center') {
        return c.diagnosticCenterId === user.id;
      }
      if (user?.role === 'radiologist') {
        return c.assignedRadiologistId === user.id;
      }
      return true;
    })
    .slice(0, 5);

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

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
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

      {/* Revenue & Performance */}
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
              <p className="text-xs text-slate-500 mt-1">Based on completed cases this month</p>
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
                <span className="text-sm text-slate-500">
                  target: 6h
                </span>
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

      {/* Quick Actions */}
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

      {/* Recent Cases */}
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
                trendUp ? 'text-green-600' : 'text-slate-500'
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
            variant === 'default' && 'bg-slate-100'
          )}>
            <Icon className={cn(
              'w-5 h-5',
              variant === 'warning' && 'text-amber-600',
              variant === 'info' && 'text-blue-600',
              variant === 'success' && 'text-green-600',
              variant === 'default' && 'text-slate-600'
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
