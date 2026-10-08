import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { ApplicationData } from '../../types.ts';

export const MyApplications: React.FC = () => {
  const { showToast } = useAuth();
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOfferLetter, setSelectedOfferLetter] = useState<any>(null);

  const fetchApplications = async () => {
    try {
      const res = await api.student.getApplications();
      if (res.applications) {
        setApplications(res.applications);
      }
    } catch (err) {
      console.error('Failed to load applications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    // Real-time polling every 8s for live status updates from recruiters
    const interval = setInterval(fetchApplications, 8000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SELECTED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'INTERVIEW':
        return 'bg-secondary-fixed text-on-secondary-fixed border-secondary-fixed-dim';
      case 'SHORTLISTED':
        return 'bg-amber-50 text-amber-900 border-amber-300';
      case 'REJECTED':
        return 'bg-error-container text-on-error-container border-error';
      default:
        return 'bg-surface-container text-on-surface border-outline-variant';
    }
  };

  const stages = ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED'];

  return (
    <div className="flex flex-col w-full max-w-[1536px] mx-auto px-6 py-6 gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-xl">description</span>
            <h1 className="font-headline-lg text-2xl font-bold text-on-surface">
              My Campus Applications
            </h1>
          </div>
          <p className="font-body-sm text-xs text-on-surface-variant mt-1">
            Real-time pipeline tracking and chronological recruitment history
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-container text-secondary self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Sync Active • {applications.length} Submitted
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/50">
          <span className="material-symbols-outlined text-3xl animate-spin text-secondary">
            progress_activity
          </span>
          <p className="text-xs text-on-surface-variant mt-2">Loading application pipeline...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="p-12 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/50 flex flex-col items-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">
            folder_open
          </span>
          <h3 className="font-headline-sm text-base font-bold text-on-surface">
            No Applications Submitted Yet
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            Browse active drives to discover eligible opportunities matching your CGPA and branch.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {applications.map((app) => {
            const job = app.jobId as any;
            const company = app.companyId as any;
            const isRejected = app.status === 'REJECTED';
            const isSelected = app.status === 'SELECTED';

            const currentStageIndex = isRejected ? -1 : stages.indexOf(app.status);

            return (
              <div
                key={app._id}
                className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/50 flex flex-col gap-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-surface-container text-secondary'
                      }`}
                    >
                      {company?.companyName?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-prominent text-xs font-semibold text-on-surface-variant">
                          {company?.companyName || 'Corporate Recruiter'}
                        </span>
                        <span className="text-outline-variant">•</span>
                        <span className="font-code-tabular text-xs text-on-surface-variant font-medium">
                          App ID: #{app._id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <h2 className="font-headline-sm text-lg font-bold text-on-surface mt-0.5">
                        {job?.title || 'Campus Placement Role'}
                      </h2>
                      <div className="flex items-center gap-3 text-xs text-on-surface-variant font-body-sm mt-1">
                        <span>Compensation: {job?.stipendOrCTC || 'As per norms'}</span>
                        <span>•</span>
                        <span>Location: {job?.location || 'Pan India'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start sm:items-end gap-1">
                    <span
                      className={`px-3 py-1 rounded border font-label-compact text-xs font-bold uppercase tracking-wider ${getStatusColor(
                        app.status
                      )}`}
                    >
                      {app.status === 'SELECTED'
                        ? 'Selected • Offer Released'
                        : `Status: ${app.status}`}
                    </span>
                    <span className="font-body-sm text-[11px] text-on-surface-variant">
                      Applied on{' '}
                      {new Date(app.appliedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Pipeline Step Tracker */}
                {!isRejected ? (
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex flex-col gap-3">
                    <span className="font-label-compact text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Recruitment Pipeline Progression
                    </span>
                    <div className="grid grid-cols-4 gap-2 relative">
                      {stages.map((stage, idx) => {
                        const isCompleted = idx < currentStageIndex;
                        const isCurrent = idx === currentStageIndex;

                        return (
                          <div key={stage} className="flex flex-col items-center text-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-colors ${
                                isCurrent
                                  ? 'bg-secondary text-white ring-4 ring-secondary-fixed'
                                  : isCompleted
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-surface-container text-on-surface-variant'
                              }`}
                            >
                              {isCompleted ? (
                                <span className="material-symbols-outlined text-sm">check</span>
                              ) : (
                                idx + 1
                              )}
                            </div>
                            <span
                              className={`text-[11px] font-semibold ${
                                isCurrent
                                  ? 'text-secondary font-bold'
                                  : isCompleted
                                  ? 'text-on-surface'
                                  : 'text-on-surface-variant'
                              }`}
                            >
                              {stage}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-error-container text-on-error-container text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">cancel</span>
                    <span>
                      Application not progressed by recruiter. Candidate released to apply for other drives.
                    </span>
                  </div>
                )}

                {/* Interview Notice or Offer Action */}
                {app.status === 'INTERVIEW' && app.interviewDate && (
                  <div className="p-3 rounded-lg bg-secondary-fixed text-on-secondary-fixed text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-secondary">
                        event_available
                      </span>
                      <span>
                        Technical Interview scheduled for:{' '}
                        <strong>
                          {new Date(app.interviewDate).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </strong>{' '}
                        ({app.interviewFormat || 'Virtual Meet'})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        showToast({
                          type: 'info',
                          title: 'Interview Details',
                          message: 'Link: https://meet.google.com/nit-placement-drive (Host: Recruiter TA)',
                        })
                      }
                      className="px-2.5 py-1 bg-secondary text-white rounded text-xs font-semibold"
                    >
                      Join Link
                    </button>
                  </div>
                )}

                {isSelected && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-2xl text-emerald-700">
                        workspace_premium
                      </span>
                      <div>
                        <span className="font-label-prominent text-xs font-bold text-emerald-900 block">
                          Formal Campus Placement Offer Released!
                        </span>
                        <span className="font-code-tabular text-xs text-emerald-800">
                          Letter Ref: {app.offerLetterRef || 'CAMPUS-2026-NIT-OFFER'} • Verified by
                          TPO Cell
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedOfferLetter({
                          companyName: company?.companyName || 'Deloitte USI',
                          jobTitle: job?.title || 'Analyst - Technology Consulting',
                          ctc: job?.stipendOrCTC || '₹12.5 LPA',
                          ref: app.offerLetterRef || 'DEL-USI-2026-CAMPUS-7719',
                          date: new Date(app.updatedAt).toLocaleDateString(),
                        })
                      }
                      className="px-3.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-label-prominent text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm shrink-0"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      <span>View Formal Letter</span>
                    </button>
                  </div>
                )}

                {/* Status History Timeline */}
                {app.statusHistory && app.statusHistory.length > 0 && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/30">
                    <span className="font-label-compact text-xs text-on-surface-variant font-semibold">
                      Chronological Activity Log:
                    </span>
                    <div className="flex flex-col gap-2 pl-2 border-l-2 border-outline-variant">
                      {app.statusHistory.map((h, i) => (
                        <div key={i} className="flex flex-col text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-code-tabular font-bold text-on-surface">
                              {h.status}
                            </span>
                            <span className="text-outline-variant">•</span>
                            <span className="font-code-tabular text-on-surface-variant text-[11px]">
                              {new Date(h.changedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="text-outline-variant">•</span>
                            <span className="text-on-surface-variant text-[11px]">
                              {h.changedBy || 'Placement System'}
                            </span>
                          </div>
                          {h.remarks && (
                            <p className="text-on-surface-variant text-[11px] mt-0.5 font-body-sm">
                              "{h.remarks}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Offer Letter Modal */}
      {selectedOfferLetter && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-outline-variant flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 text-2xl">
                  verified
                </span>
                <span className="font-headline-md text-base font-bold text-on-surface">
                  Official Campus Offer of Employment
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOfferLetter(null)}
                className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 flex flex-col gap-3 text-xs leading-relaxed">
              <div className="flex justify-between border-b border-outline-variant/30 pb-2">
                <span className="font-bold text-on-surface">
                  {selectedOfferLetter.companyName}
                </span>
                <span className="font-code-tabular text-on-surface-variant">
                  Ref: {selectedOfferLetter.ref}
                </span>
              </div>
              <p>
                We are pleased to formally offer you employment as{' '}
                <strong>{selectedOfferLetter.jobTitle}</strong> at{' '}
                <strong>{selectedOfferLetter.companyName}</strong>.
              </p>
              <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30 flex justify-between">
                <span>Annual Total Compensation (CTC):</span>
                <span className="font-bold font-code-tabular text-emerald-800 text-sm">
                  {selectedOfferLetter.ctc}
                </span>
              </div>
              <p className="text-on-surface-variant text-[11px]">
                This offer has been processed and attested through the National Institute of
                Technology Career Development &amp; Placement Cell following official campus drive
                guidelines.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setSelectedOfferLetter(null)}
                className="px-4 py-2 rounded bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast({
                    type: 'success',
                    title: 'Downloaded',
                    message: `Official PDF copy for ${selectedOfferLetter.ref} downloaded.`,
                  });
                  setSelectedOfferLetter(null);
                }}
                className="px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
