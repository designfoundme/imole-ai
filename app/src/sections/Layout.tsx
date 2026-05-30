import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Activity,
  LogOut,
  LayoutDashboard,
  Upload,
  FileText,
  Settings,
  Bell,
  Building2,
  Stethoscope,
  Shield,
  AlertTriangle,
  CheckCircle,
  Inbox,
  PlayCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';
import type { NotificationType, UserRole } from '@/types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

const NAV_ITEMS: Record<UserRole, { id: string; label: string; icon: React.ElementType }[]> = {
  diagnostic_center: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload Scan', icon: Upload },
    { id: 'cases', label: 'My Cases', icon: FileText },
    { id: 'reports', label: 'Reports', icon: FileText },
  ],
  radiologist: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cases', label: 'Assigned Cases', icon: FileText },
    { id: 'viewer', label: 'DICOM Viewer', icon: Activity },
    { id: 'history', label: 'Report History', icon: FileText },
  ],
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'centers', label: 'Diagnostic Centers', icon: Building2 },
    { id: 'radiologists', label: 'Radiologists', icon: Stethoscope },
    { id: 'cases', label: 'All Cases', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
};

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
  diagnostic_center: Building2,
  radiologist: Stethoscope,
  admin: Shield,
};

const ROLE_LABELS: Record<UserRole, string> = {
  diagnostic_center: 'Diagnostic Center',
  radiologist: 'Radiologist',
  admin: 'Administrator',
};

const NOTIFICATION_ICONS: Record<NotificationType, React.ElementType> = {
  case_assigned: Inbox,
  case_accepted: CheckCircle,
  case_declined: AlertTriangle,
  reading_started: PlayCircle,
  report_ready: FileText,
  urgent_case: AlertTriangle,
  sla_breach: AlertTriangle,
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  case_assigned: 'text-blue-600 bg-blue-50',
  case_accepted: 'text-green-600 bg-green-50',
  case_declined: 'text-amber-600 bg-amber-50',
  reading_started: 'text-purple-600 bg-purple-50',
  report_ready: 'text-green-600 bg-green-50',
  urgent_case: 'text-red-600 bg-red-50',
  sla_breach: 'text-red-600 bg-red-50',
};

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function Layout({ children, currentView, onViewChange }: LayoutProps) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();

  if (!user) return null;

  const navItems = NAV_ITEMS[user.role];
  const RoleIcon = ROLE_ICONS[user.role];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
            <div>
              <h1 className="font-bold text-slate-900 text-sm">Imole AI</h1>
              <p className="text-xs text-slate-500">by Health Intel Labs</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-blue-600' : 'text-slate-400')} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <RoleIcon className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            size="sm"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {navItems.find(i => i.id === currentView)?.label || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-96 p-0">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Notifications</p>
                      <p className="text-xs text-slate-500">
                        {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllRead}>
                          Mark all read
                        </Button>
                      )}
                      {notifications.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearAll}>
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map(n => {
                        const Icon = NOTIFICATION_ICONS[n.type];
                        return (
                          <button
                            key={n.id}
                            onClick={() => markRead(n.id)}
                            className={cn(
                              'w-full flex items-start gap-3 px-4 py-3 border-b border-slate-50 text-left hover:bg-slate-50 transition-colors',
                              !n.isRead && 'bg-blue-50/40',
                            )}
                          >
                            <div className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                              NOTIFICATION_COLORS[n.type],
                            )}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-slate-900">{n.title}</p>
                                {!n.isRead && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-slate-400 mt-1">{formatRelative(n.createdAt)}</p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
