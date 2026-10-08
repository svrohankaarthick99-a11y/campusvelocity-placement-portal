import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';

export const Sidebar: React.FC = () => {
  const { user, activeTab, setActiveTab, sidebarOpen, setSidebarOpen, logout, setShowAuthModal } =
    useAuth();
  const role = user?.role || 'STUDENT';

  const studentNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
    { id: 'browse-jobs', label: 'Browse Jobs', icon: 'business_center' },
    { id: 'my-applications', label: 'My Applications', icon: 'description' },
    { id: 'profile', label: 'My Profile', icon: 'person' },
    { id: 'notifications', label: 'Notices & Circulars', icon: 'notifications' },
  ];

  const recruiterNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
    { id: 'company', label: 'Company Profile', icon: 'domain' },
    { id: 'jobs', label: 'Campus Postings', icon: 'work' },
    { id: 'applicants', label: 'Candidate Queue & Approvals', icon: 'group' },
  ];

  const adminNavItems = [
    { id: 'dashboard', label: 'Command Overview', icon: 'dashboard' },
    { id: 'companies', label: 'Verify Companies', icon: 'verified_user' },
    { id: 'jobs', label: 'Job Approvals', icon: 'rule' },
    { id: 'students', label: 'Student Directory', icon: 'school' },
    { id: 'applications', label: 'All Applications', icon: 'folder_shared' },
    { id: 'audit-logs', label: 'Audit Trail', icon: 'policy' },
  ];

  const navItems =
    role === 'ADMIN'
      ? adminNavItems
      : role === 'RECRUITER'
      ? recruiterNavItems
      : studentNavItems;

  const sectionTitle =
    role === 'ADMIN'
      ? 'Administrative Controls'
      : role === 'RECRUITER'
      ? 'Recruiting & Approvals'
      : 'Student Candidate Hub';

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setSidebarOpen(false); // Close mobile drawer on navigation
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-surface-container-lowest border-r border-outline-variant/60 z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-outline-variant/60">
            <div className="flex items-center gap-2.5">
              <img
                alt="Campus Velocity Logo"
                className="h-8 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida/AEtjO1VDFf9TisWVpG538qJQuS8LX4FaeKIZbOzIZLH6tqal1C-l8ShkNHTEPY49UvKDy3cVZUEr-aLgxyNDrFJSNGdbLD2Wyn1hQE367wFS6LCLPPah54buTMCoh5yC2CJCz5SaxAXWDQZAO7bq2nCckVrFvICCRKpJIgcCw8cKswnsi5H9Qpja9Y2XvPgIZdESU1Ao7RGzIUg00RjR_ZnAvaAcLytijuYqTMP1H5upA3P9"
              />
              <div className="flex flex-col">
                <span className="font-headline-sm text-base text-on-surface tracking-tight leading-none font-bold">
                  CampusVelocity
                </span>
                <span className="font-label-compact text-[10px] text-on-surface-variant uppercase tracking-wider mt-1 font-semibold">
                  NIT Placement Portal
                </span>
              </div>
            </div>

            {/* Close button on mobile */}
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Section title */}
          <div className="px-5 pt-4 pb-2">
            <span className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant/80">
              {sectionTitle}
            </span>
          </div>

          {/* Navigation list */}
          <nav className="flex flex-col px-3 gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left w-full text-xs font-semibold ${
                    isActive
                      ? 'bg-secondary text-white shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className={`material-symbols-outlined text-lg ${isActive ? 'text-white' : 'text-secondary'}`}>
                    {item.icon}
                  </span>
                  <span className="font-label-prominent text-xs tracking-tight">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Navigation & University Affiliation */}
        <div className="flex flex-col border-t border-outline-variant/60 bg-surface-container-lowest">
          <div className="p-3">
            {user ? (
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors w-full text-left"
              >
                <span className="material-symbols-outlined text-lg text-error">logout</span>
                <span>Sign Out / Switch</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-secondary text-white text-xs font-semibold hover:bg-secondary-container transition-colors w-full text-left shadow-xs"
              >
                <span className="material-symbols-outlined text-lg">login</span>
                <span>Sign In / Register</span>
              </button>
            )}
          </div>

          <div className="px-5 py-3 bg-surface-container-low border-t border-outline-variant/40">
            <p className="font-body-sm text-[11px] text-on-surface-variant leading-snug font-semibold">
              Career Development &amp; Placement Cell
            </p>
            <p className="font-label-compact text-[10px] text-outline leading-tight mt-0.5">
              National Institute of Technology
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
