import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { ApplicationData } from '../../types.ts';

export const AdminApplications: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchApps = async () => {
      setLoading(true);
      try {
        const res = await api.admin.getApplications({
          status: statusFilter === 'ALL' ? undefined : statusFilter,
        });
        if (res.applications) {
          setApplications(res.applications);
        }
      } catch (err) {
        console.error('Failed to load applications', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, [statusFilter]);

  return (
    <div className="flex flex-col w-full max-w-[1536px] mx-auto px-6 py-6 gap-6">
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl">folder_shared</span>
            <h1 className="font-headline-lg text-2xl font-bold text-on-surface">
              University-Wide Application Ledger
            </h1>
          </div>
          <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
            Holistic view of student submissions, interview progress, and issued offer letters
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-outline-variant/30 text-xs">
          {['ALL', 'APPLIED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-surface-container-lowest rounded-xl">
          <span className="material-symbols-outlined text-3xl animate-spin text-secondary">
            progress_activity
          </span>
        </div>
      ) : applications.length === 0 ? (
        <div className="p-12 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/50 text-xs text-on-surface-variant">
          No applications match the current filter.
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/50 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-label-compact uppercase">
              <tr>
                <th className="p-3">App ID</th>
                <th className="p-3">Candidate</th>
                <th className="p-3">Company</th>
                <th className="p-3">Position</th>
                <th className="p-3">Applied Date</th>
                <th className="p-3">Current Stage</th>
                <th className="p-3">Offer Reference / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {applications.map((app) => {
                const student = app.studentId as any;
                const company = app.companyId as any;
                const job = app.jobId as any;

                return (
                  <tr key={app._id} className="hover:bg-surface-container-low/40">
                    <td className="p-3 font-code-tabular text-on-surface-variant font-medium">
                      #{app._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="p-3 font-semibold text-on-surface">
                      <div className="flex flex-col">
                        <span>{student?.name || 'Candidate'}</span>
                        <span className="text-[11px] text-on-surface-variant font-normal">
                          {student?.email}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 font-medium text-on-surface">
                      {company?.companyName || 'Corporate Partner'}
                    </td>
                    <td className="p-3 font-medium text-on-surface">
                      {job?.title || 'Job Opening'}
                    </td>
                    <td className="p-3 font-code-tabular text-on-surface-variant">
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold uppercase text-[11px] ${
                          app.status === 'SELECTED'
                            ? 'bg-emerald-50 text-emerald-800'
                            : app.status === 'INTERVIEW'
                            ? 'bg-secondary-fixed text-on-secondary-fixed'
                            : app.status === 'SHORTLISTED'
                            ? 'bg-amber-50 text-amber-900'
                            : app.status === 'REJECTED'
                            ? 'bg-error-container text-on-error-container'
                            : 'bg-surface-container text-on-surface'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="p-3 font-code-tabular text-on-surface">
                      {app.offerLetterRef ? (
                        <span className="font-bold text-emerald-800">
                          {app.offerLetterRef}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant text-[11px]">
                          {app.statusHistory?.[app.statusHistory.length - 1]?.remarks || 'In pipeline'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
