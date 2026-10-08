/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { Header } from './components/layout/Header.tsx';
import { ToastContainer } from './components/common/ToastContainer.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';

// Student Views
import { StudentDashboard } from './components/student/StudentDashboard.tsx';
import { BrowseJobs } from './components/student/BrowseJobs.tsx';
import { MyApplications } from './components/student/MyApplications.tsx';
import { StudentProfile } from './components/student/StudentProfile.tsx';
import { StudentNotifications } from './components/student/StudentNotifications.tsx';

// Recruiter Views
import { RecruiterDashboard } from './components/recruiter/RecruiterDashboard.tsx';
import { CompanyProfileView } from './components/recruiter/CompanyProfileView.tsx';
import { RecruiterJobs } from './components/recruiter/RecruiterJobs.tsx';
import { RecruiterApplicants } from './components/recruiter/RecruiterApplicants.tsx';

// Admin Views
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { AdminCompanies } from './components/admin/AdminCompanies.tsx';
import { AdminJobs } from './components/admin/AdminJobs.tsx';
import { AdminStudents } from './components/admin/AdminStudents.tsx';
import { AdminApplications } from './components/admin/AdminApplications.tsx';
import { AdminAuditLogs } from './components/admin/AdminAuditLogs.tsx';

const AppContent: React.FC = () => {
  const { user, activeTab, setActiveTab, loading } = useAuth();
  const [selectedJobForRecruiter, setSelectedJobForRecruiter] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined text-4xl text-secondary animate-spin">
          progress_activity
        </span>
        <span className="font-headline-sm text-sm font-semibold text-on-surface">
          Initializing CampusVelocity Placement Portal...
        </span>
      </div>
    );
  }

  const role = user?.role || 'STUDENT';

  const renderContent = () => {
    // 1. Student Portal Views
    if (role === 'STUDENT') {
      switch (activeTab) {
        case 'dashboard':
          return <StudentDashboard />;
        case 'browse-jobs':
          return <BrowseJobs />;
        case 'my-applications':
          return <MyApplications />;
        case 'profile':
          return <StudentProfile />;
        case 'notifications':
          return <StudentNotifications />;
        default:
          return <StudentDashboard />;
      }
    }

    // 2. Recruiter Portal Views
    if (role === 'RECRUITER') {
      switch (activeTab) {
        case 'dashboard':
          return <RecruiterDashboard />;
        case 'company':
          return <CompanyProfileView />;
        case 'jobs':
          return (
            <RecruiterJobs
              onSelectJobForApplicants={(jobId) => {
                setSelectedJobForRecruiter(jobId);
                setActiveTab('applicants');
              }}
            />
          );
        case 'applicants':
          return <RecruiterApplicants initialJobId={selectedJobForRecruiter} />;
        default:
          return <RecruiterDashboard />;
      }
    }

    // 3. Admin Portal Views
    if (role === 'ADMIN') {
      switch (activeTab) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'companies':
          return <AdminCompanies />;
        case 'jobs':
          return <AdminJobs />;
        case 'students':
          return <AdminStudents />;
        case 'applications':
          return <AdminApplications />;
        case 'audit-logs':
          return <AdminAuditLogs />;
        default:
          return <AdminDashboard />;
      }
    }

    return <StudentDashboard />;
  };

  return (
    <div className="min-h-screen bg-background font-body-base text-on-surface antialiased text-base">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main layout container with responsive sidebar margin */}
      <div className="lg:pl-64">
        <Header />
        <main className="relative pt-16 w-full min-h-screen bg-background">
          {renderContent()}
        </main>
      </div>

      {/* Toast notifications */}
      <ToastContainer />

      {/* Auth modal */}
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
