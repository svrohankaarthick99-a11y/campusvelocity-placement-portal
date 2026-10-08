import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';

export const StudentNotifications: React.FC = () => {
  const { setActiveTab } = useAuth();

  const notifications = [
    {
      id: '1',
      type: 'urgent',
      title: 'Mandatory Pre-Placement Talk: Goldman Sachs',
      time: 'Tomorrow, 16:00 IST • Audi-1',
      desc: 'Attendance biometric tracking is active. Western formal attire compulsory for all registered circuit branch candidates.',
      tag: 'Urgent Circular',
      icon: 'priority_high',
    },
    {
      id: '2',
      type: 'interview',
      title: 'Interview Scheduled: Google India Software Engineer Intern',
      time: 'Oct 24, 2026 • 10:00 AM IST',
      desc: 'Technical Round 1 & 2 on Google Meet. Please ensure webcam and mic testing in advance.',
      tag: 'Interview Alert',
      icon: 'video_camera_front',
      action: 'View Applications',
      target: 'my-applications',
    },
    {
      id: '3',
      type: 'offer',
      title: 'Offer Verified: Deloitte USI Technology Consulting',
      time: 'Oct 02, 2026 • Reference DEL-USI-2026-CAMPUS-7719',
      desc: 'Your formal offer letter has been attested and registered by the Head Placement Office.',
      tag: 'Offer Released',
      icon: 'workspace_premium',
      action: 'View Offer Letter',
      target: 'my-applications',
    },
    {
      id: '4',
      type: 'info',
      title: 'Resume Physical Verification Window: Hall 4',
      time: 'Today: 2:00 PM – 5:30 PM • Room 402',
      desc: 'Final physical verification window for Batch 2026 resumes. Bring 2 printed hard copies of all semester grade cards.',
      tag: 'TPO Notice',
      icon: 'assignment_turned_in',
    },
  ];

  return (
    <div className="flex flex-col w-full max-w-[1536px] mx-auto px-6 py-6 gap-6">
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/50 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-2xl">notifications</span>
          <h1 className="font-headline-lg text-2xl font-bold text-on-surface">
            Placement Cell Notices &amp; Circulars
          </h1>
        </div>
        <p className="font-body-sm text-xs text-on-surface-variant">
          Official communications from the Career Development &amp; Placement Cell
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
              n.type === 'urgent'
                ? 'bg-error-container text-on-error-container border-error'
                : n.type === 'offer'
                ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                : 'bg-surface-container-lowest text-on-surface border-outline-variant/50'
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`material-symbols-outlined text-2xl mt-0.5 ${
                  n.type === 'urgent'
                    ? 'text-error'
                    : n.type === 'offer'
                    ? 'text-emerald-700'
                    : 'text-secondary'
                }`}
              >
                {n.icon}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-label-prominent text-sm font-bold">{n.title}</span>
                  <span className="font-code-tabular text-[11px] font-semibold opacity-80">
                    {n.time}
                  </span>
                </div>
                <p className="font-body-sm text-xs mt-1 leading-relaxed opacity-90">{n.desc}</p>
              </div>
            </div>

            {n.action && (
              <button
                type="button"
                onClick={() => setActiveTab(n.target || 'dashboard')}
                className="self-start sm:self-center px-3 py-1.5 rounded bg-secondary text-white text-xs font-semibold hover:bg-secondary-container transition-colors shrink-0"
              >
                {n.action}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
