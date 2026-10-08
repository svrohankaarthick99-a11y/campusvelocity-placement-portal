import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';

export const AdminDashboard: React.FC = () => {
  const { setActiveTab, showToast } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);

  // Approval action states
  const [actionModal, setActionModal] = useState<{
    type: 'company' | 'job';
    action: 'approve' | 'reject';
    item: any;
  } | null>(null);
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.admin.getDashboard();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load admin dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleConfirmAction = async () => {
    if (!actionModal) return;
    setSubmitting(true);
    const { type, action, item } = actionModal;

    try {
      if (type === 'company') {
        if (action === 'approve') {
          await api.admin.approveCompany(item._id, reason || 'Verified by Head Placement Office');
          showToast({
            type: 'success',
            title: 'Company Approved',
            message: `"${item.companyName}" is now an authorized campus recruiting partner.`,
          });
        } else {
          if (!reason.trim()) {
            showToast({
              type: 'error',
              title: 'Reason Required',
              message: 'Rejection reason is mandatory for administrative auditing.',
            });
            setSubmitting(false);
            return;
          }
          await api.admin.rejectCompany(item._id, reason);
          showToast({
            type: 'info',
            title: 'Company Rejected',
            message: `"${item.companyName}" has been declined and audit logged.`,
          });
        }
      } else if (type === 'job') {
        if (action === 'approve') {
          await api.admin.approveJob(item._id, reason || 'Eligibility parameters verified.');
          showToast({
            type: 'success',
            title: 'Job Approved',
            message: `"${item.title}" is now active and accessible to eligible students.`,
          });
        } else {
          if (!reason.trim()) {
            showToast({
              type: 'error',
              title: 'Reason Required',
              message: 'Rejection reason is mandatory for administrative auditing.',
            });
            setSubmitting(false);
            return;
          }
          await api.admin.rejectJob(item._id, reason);
          showToast({
            type: 'info',
            title: 'Job Posting Rejected',
            message: `"${item.title}" rejected and recorded in audit logs.`,
          });
        }
      }

      setActionModal(null);
      setReason('');
      await fetchDashboard();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: err.message || 'Administrative operation could not be completed.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const stats = data?.stats;
  const pendingCompanies = data?.pendingQueue?.companies || [];
  const pendingJobs = data?.pendingQueue?.jobs || [];
  const auditLogs = data?.recentAuditLogs || [];

  return (
    <div className="flex flex-col w-full max-w-[1536px] mx-auto px-6 py-6 gap-6">
      {/* Top Banner */}
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-secondary">
            <span className="material-symbols-outlined text-sm">security</span>
            Placement Administration Command Center
          </div>
          <h1 className="font-headline-lg text-2xl font-bold text-on-surface mt-1">
            Directorate of Placement &amp; Training
          </h1>
          <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
            National Institute of Technology • Academic Drive Oversight 2026-2027
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('companies')}
            className="px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs transition-colors"
          >
            Manage Companies
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit-logs')}
            className="px-3.5 py-2 rounded-lg bg-secondary text-white font-semibold text-xs hover:bg-secondary-container transition-colors"
          >
            Audit Logs
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/50">
          <span className="font-label-compact text-xs text-on-surface-variant font-semibold uppercase">
            Total Students
          </span>
          <div className="mt-2 text-2xl font-bold font-code-tabular text-on-surface">
            {stats?.totalStudents ?? 0}
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/50">
          <span className="font-label-compact text-xs text-on-surface-variant font-semibold uppercase">
            Companies
          </span>
          <div className="mt-2 text-2xl font-bold font-code-tabular text-on-surface">
            {stats?.approvedCompanies ?? 0}{' '}
            <span className="text-xs text-amber-700 font-normal">
              ({stats?.pendingCompanies ?? 0} pend)
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/50">
          <span className="font-label-compact text-xs text-on-surface-variant font-semibold uppercase">
            Total Jobs
          </span>
          <div className="mt-2 text-2xl font-bold font-code-tabular text-on-surface">
            {stats?.approvedJobs ?? 0}{' '}
            <span className="text-xs text-amber-700 font-normal">
              ({stats?.pendingJobs ?? 0} pend)
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/50">
          <span className="font-label-compact text-xs text-on-surface-variant font-semibold uppercase">
            Pending Queue
          </span>
          <div className="mt-2 text-2xl font-bold font-code-tabular text-amber-700">
            {(stats?.pendingCompanies ?? 0) + (stats?.pendingJobs ?? 0)}
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/50">
          <span className="font-label-compact text-xs text-on-surface-variant font-semibold uppercase">
            Applications
          </span>
          <div className="mt-2 text-2xl font-bold font-code-tabular text-secondary">
            {stats?.totalApplications ?? 0}
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/50">
          <span className="font-label-compact text-xs text-on-surface-variant font-semibold uppercase">
            Offers Issued
          </span>
          <div className="mt-2 text-2xl font-bold font-code-tabular text-emerald-700">
            {stats?.selectedApplications ?? 0}
          </div>
        </div>
      </div>

      {/* Main Section: Pending Verification Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Companies Queue */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/50 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-700 text-xl">domain</span>
              <h2 className="font-headline-sm text-sm font-bold text-on-surface">
                Pending Company Approvals ({pendingCompanies.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('companies')}
              className="text-xs text-secondary hover:underline font-semibold"
            >
              View All
            </button>
          </div>

          {pendingCompanies.length === 0 ? (
            <div className="p-8 text-center text-xs text-on-surface-variant">
              No companies currently awaiting approval. All entities verified.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingCompanies.map((c: any) => (
                <div
                  key={c._id}
                  className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-sm text-on-surface block">
                      {c.companyName}
                    </span>
                    <span className="text-on-surface-variant block mt-0.5">
                      {c.industry} • {c.location}
                    </span>
                    <span className="text-on-surface-variant text-[11px] block mt-0.5">
                      Recruiter: {c.recruiterId?.name} ({c.recruiterId?.email})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setActionModal({ type: 'company', action: 'approve', item: c })
                      }
                      className="px-3 py-1.5 rounded bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors text-xs"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActionModal({ type: 'company', action: 'reject', item: c })
                      }
                      className="px-3 py-1.5 rounded bg-error-container text-on-error-container font-semibold hover:bg-red-200 transition-colors text-xs"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Job Postings Queue */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/50 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-700 text-xl">rule</span>
              <h2 className="font-headline-sm text-sm font-bold text-on-surface">
                Pending Job Approvals ({pendingJobs.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('jobs')}
              className="text-xs text-secondary hover:underline font-semibold"
            >
              View All
            </button>
          </div>

          {pendingJobs.length === 0 ? (
            <div className="p-8 text-center text-xs text-on-surface-variant">
              No job postings awaiting approval. All active jobs verified.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingJobs.map((j: any) => (
                <div
                  key={j._id}
                  className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-sm text-on-surface block">{j.title}</span>
                    <span className="text-secondary font-semibold block mt-0.5">
                      {j.companyId?.companyName || 'Company'} • {j.stipendOrCTC}
                    </span>
                    <span className="text-on-surface-variant text-[11px] block mt-0.5">
                      Min CGPA: ≥ {j.minimumCGPA.toFixed(2)} | Branches:{' '}
                      {j.allowedDepartments?.join(', ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActionModal({ type: 'job', action: 'approve', item: j })}
                      className="px-3 py-1.5 rounded bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors text-xs"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionModal({ type: 'job', action: 'reject', item: j })}
                      className="px-3 py-1.5 rounded bg-error-container text-on-error-container font-semibold hover:bg-red-200 transition-colors text-xs"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Administrative Audit Trail */}
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/50 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-xl">policy</span>
            <h2 className="font-headline-sm text-sm font-bold text-on-surface">
              Recent Placement Cell Audit Trail
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('audit-logs')}
            className="text-xs text-secondary hover:underline font-semibold"
          >
            Complete Audit Log →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant font-label-compact uppercase">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Reviewer</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Audit Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {auditLogs.map((log: any) => (
                <tr key={log._id} className="hover:bg-surface-container-low/40">
                  <td className="p-3 font-code-tabular text-on-surface-variant">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3 font-semibold text-on-surface">{log.adminName}</td>
                  <td className="p-3">
                    <span
                      className={`font-bold font-code-tabular px-2 py-0.5 rounded text-[11px] ${
                        log.action.includes('APPROVED')
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-error-container text-on-error-container'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-on-surface">
                    {log.entityTitle || log.entityId}
                  </td>
                  <td className="p-3 text-on-surface-variant font-body-sm">{log.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval / Rejection Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-outline-variant flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
              <h3 className="font-headline-md text-base font-bold text-on-surface">
                Confirm {actionModal.action.toUpperCase()}
              </h3>
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="p-1 rounded-full text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface leading-relaxed">
              Are you sure you want to <strong>{actionModal.action}</strong>{' '}
              {actionModal.type === 'company'
                ? `company "${actionModal.item.companyName}"`
                : `job posting "${actionModal.item.title}"`}
              ?
            </p>

            <div className="text-xs flex flex-col gap-1">
              <label className="font-semibold text-on-surface">
                {actionModal.action === 'reject'
                  ? 'Mandatory Rejection Reason *'
                  : 'Administrative Remarks / Notes:'}
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  actionModal.action === 'reject'
                    ? 'State reasons for audit log and recruiter feedback...'
                    : 'e.g. Verified against university placement guidelines.'
                }
                className="w-full p-2 bg-surface-container-low border border-outline-variant rounded text-on-surface focus:outline-none"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 rounded bg-surface-container text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmAction}
                className={`px-4 py-2 rounded text-xs font-semibold text-white ${
                  actionModal.action === 'approve'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-error hover:bg-red-700'
                }`}
              >
                {submitting
                  ? 'Recording in Audit...'
                  : `Confirm ${actionModal.action.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
