import { useState } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { CasesProvider } from '@/hooks/useCases';
import { Login } from '@/sections/Login';
import { Layout } from '@/sections/Layout';
import { Dashboard } from '@/sections/Dashboard';
import { DicomUpload } from '@/sections/DicomUpload';
import { DicomViewer } from '@/sections/DicomViewer';
import { CaseList } from '@/sections/CaseList';
import { ReportForm } from '@/sections/ReportForm';
import { Toaster } from '@/components/ui/sonner';

/**
 * Local TypeScript stubs to satisfy JSX typings when @types/react or the
 * automatic JSX runtime types aren't available in the environment.
 *
 * NOTE: These are convenient shims for development; prefer installing
 * `@types/react` and `@types/react-dom` (and ensuring tsconfig "jsx")
 * for proper typings in production.
 */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react/jsx-runtime' {
  export function jsx(type: any, props?: any, key?: any): any;
  export function jsxs(type: any, props?: any, key?: any): any;
  export function jsxDEV(type: any, props?: any, key?: any): any;
}

// Admin components
function CentersManagement() {
  return (
    <div className="text-center py-16">
      <h3 className="text-lg font-medium text-slate-700">Diagnostic Centers Management</h3>
      <p className="text-slate-500 mt-2">Feature coming in Phase 2</p>
    </div>
  );
}

function RadiologistsManagement() {
  return (
    <div className="text-center py-16">
      <h3 className="text-lg font-medium text-slate-700">Radiologists Management</h3>
      <p className="text-slate-500 mt-2">Feature coming in Phase 2</p>
    </div>
  );
}

function Settings() {
  return (
    <div className="text-center py-16">
      <h3 className="text-lg font-medium text-slate-700">System Settings</h3>
      <p className="text-slate-500 mt-2">Feature coming in Phase 2</p>
    </div>
  );
}

// Main App Content
function AppContent() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  if (!user) {
    return <Login />;
  }

  // Handle case selection for viewing/reporting
  const handleViewCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentView('viewer');
  };

  const handleReportCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentView('report');
  };

  const handleBackToCases = () => {
    setSelectedCaseId(null);
    setCurrentView('cases');
  };

  // Render content based on current view and user role
  const renderContent = () => {
    // Diagnostic Center Views
    if (user.role === 'diagnostic_center') {
      switch (currentView) {
        case 'dashboard':
          return <Dashboard onViewChange={setCurrentView} />;
        case 'upload':
          return <DicomUpload onSuccess={() => setCurrentView('cases')} />;
        case 'cases':
        case 'reports':
          return (
            <CaseList 
              onViewCase={handleViewCase} 
              onReportCase={handleReportCase}
            />
          );
        case 'viewer':
          return selectedCaseId ? (
            <DicomViewer caseId={selectedCaseId} />
          ) : (
            <CaseList onViewCase={handleViewCase} onReportCase={handleReportCase} />
          );
        case 'report':
          return selectedCaseId ? (
            <ReportForm 
              caseId={selectedCaseId} 
              onBack={handleBackToCases}
              onSuccess={handleBackToCases}
            />
          ) : (
            <CaseList onViewCase={handleViewCase} onReportCase={handleReportCase} />
          );
        default:
          return <Dashboard onViewChange={setCurrentView} />;
      }
    }

    // Radiologist Views
    if (user.role === 'radiologist') {
      switch (currentView) {
        case 'dashboard':
          return <Dashboard onViewChange={setCurrentView} />;
        case 'cases':
        case 'history':
          return (
            <CaseList 
              onViewCase={handleViewCase} 
              onReportCase={handleReportCase}
            />
          );
        case 'viewer':
          return selectedCaseId ? (
            <DicomViewer caseId={selectedCaseId} />
          ) : (
            <CaseList onViewCase={handleViewCase} onReportCase={handleReportCase} />
          );
        case 'report':
          return selectedCaseId ? (
            <ReportForm 
              caseId={selectedCaseId} 
              onBack={handleBackToCases}
              onSuccess={handleBackToCases}
            />
          ) : (
            <CaseList onViewCase={handleViewCase} onReportCase={handleReportCase} />
          );
        default:
          return <Dashboard onViewChange={setCurrentView} />;
      }
    }

    // Admin Views
    if (user.role === 'admin') {
      switch (currentView) {
        case 'dashboard':
          return <Dashboard onViewChange={setCurrentView} />;
        case 'centers':
          return <CentersManagement />;
        case 'radiologists':
          return <RadiologistsManagement />;
        case 'cases':
          return (
            <CaseList 
              onViewCase={handleViewCase} 
              onReportCase={handleReportCase}
            />
          );
        case 'settings':
          return <Settings />;
        case 'viewer':
          return selectedCaseId ? (
            <DicomViewer caseId={selectedCaseId} />
          ) : (
            <CaseList onViewCase={handleViewCase} onReportCase={handleReportCase} />
          );
        case 'report':
          return selectedCaseId ? (
            <ReportForm 
              caseId={selectedCaseId} 
              onBack={handleBackToCases}
              onSuccess={handleBackToCases}
            />
          ) : (
            <CaseList onViewCase={handleViewCase} onReportCase={handleReportCase} />
          );
        default:
          return <Dashboard onViewChange={setCurrentView} />;
      }
    }

    return <Dashboard onViewChange={setCurrentView} />;
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderContent()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <CasesProvider>
        <AppContent />
        <Toaster position="top-right" />
      </CasesProvider>
    </AuthProvider>
  );
}

export default App;
