import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';

export const Header: React.FC = () => {
  const { user, quickSwitchRole, toggleSidebar, setActiveTab, setShowAuthModal, logout } = useAuth();
  const role = user?.role || 'STUDENT';

  const defaultAvatar =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDEZOcJZDPlRhiGZPDEf1dzgKXV8XMIWMbN3aXvnhEPUIbLnlp2oCMD-WX4d4D8bcI0TqqaVJzvWR3pN1poA0qf8PtHh6nbyBgv8TPHoBpujmQKveIG2IdcakFurZH6XdjgxjQRRMIgD5sUIVtY39acPGA7xIJPq2XeQ9leU4FaBcwVGkUFoeiZITgwT00et59hTmfmcBNn6mX_qNLGWvZRuMi2gRIKFqLvcoZJ1QQ';

  const roleLabels: Record<string, { title: string; badge: string; color: string }> = {
    STUDENT: {
      title: "Candidate Aspirant (CS '26)",
      badge: 'Student Portal',
      color: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    RECRUITER: {
      title: 'Corporate Talent Acquisition',
      badge: 'Recruiter Portal',
      color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    },
    ADMIN: {
      title: 'Head, Placement & Training',
      badge: 'TPO Administration',
      color: 'bg-purple-50 text-purple-800 border-purple-200',
    },
  };

  const currentRoleInfo = roleLabels[role] || roleLabels.STUDENT;

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/60 z-40 px-4 sm:px-6 flex items-center justify-between transition-all">
      {/* Left: Mobile hamburger & Session Indicator */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          aria-label="Toggle navigation"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>

        {/* Academic Session badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/40 text-xs">
          <span className="material-symbols-outlined text-secondary text-sm">verified</span>
          <span className="font-semibold text-on-surface">
            Session 2026-2027 • Final Placement Drive
          </span>
        </div>

        {/* Active Role Tag */}
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${currentRoleInfo.color}`}
        >
          {currentRoleInfo.badge}
        </span>
      </div>

      {/* Center: Clean, Prominent Portal Role Switcher */}
      <div className="flex items-center bg-surface-container-low p-1 rounded-xl border border-outline-variant/40 shadow-xs">
        <span className="hidden xl:inline-block text-[11px] font-semibold text-on-surface-variant px-2 uppercase tracking-wider">
          Role:
        </span>
        <button
          type="button"
          onClick={() => quickSwitchRole('STUDENT')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            role === 'STUDENT'
              ? 'bg-secondary text-white shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
          title="Switch to Student Candidate View"
        >
          <span className="material-symbols-outlined text-base">school</span>
          <span className="hidden md:inline">Student</span>
        </button>

        <button
          type="button"
          onClick={() => quickSwitchRole('RECRUITER')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            role === 'RECRUITER'
              ? 'bg-secondary text-white shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
          title="Switch to Company Recruiter View"
        >
          <span className="material-symbols-outlined text-base">domain</span>
          <span className="hidden md:inline">Recruiter</span>
        </button>

        <button
          type="button"
          onClick={() => quickSwitchRole('ADMIN')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            role === 'ADMIN'
              ? 'bg-secondary text-white shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
          title="Switch to Placement Cell Admin View"
        >
          <span className="material-symbols-outlined text-base">admin_panel_settings</span>
          <span className="hidden md:inline">Admin</span>
        </button>
      </div>

      {/* Right: Notifications & User profile */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          title="Placement Notifications"
        >
          <span className="material-symbols-outlined text-xl">notifications</span>
          <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-error text-white font-code-tabular text-[10px] leading-none font-bold">
            3
          </span>
        </button>

        <div className="h-6 w-px bg-outline-variant/60 hidden sm:block"></div>

        {/* User Card */}
        {user ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (role === 'STUDENT') setActiveTab('profile');
                else if (role === 'RECRUITER') setActiveTab('company');
              }}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-surface-container transition-colors text-left"
            >
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border border-outline-variant shadow-xs shrink-0"
                src={user.profile?.avatarUrl || defaultAvatar}
              />
              <div className="hidden lg:flex flex-col">
                <span className="font-label-prominent text-xs font-bold text-on-surface leading-tight truncate max-w-[130px]">
                  {user.name}
                </span>
                <span className="font-label-compact text-[11px] text-on-surface-variant leading-tight truncate max-w-[130px]">
                  {currentRoleInfo.title}
                </span>
              </div>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-secondary text-white font-semibold text-xs hover:bg-secondary-container transition-colors shadow-xs"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
