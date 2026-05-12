import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
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
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

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

export function Layout({ children, currentView, onViewChange }: LayoutProps) {
  const { user, logout } = useAuth();

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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
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
              <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
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
