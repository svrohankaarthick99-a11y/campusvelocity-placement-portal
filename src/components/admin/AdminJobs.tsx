import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { JobData } from '../../types.ts';

export const AdminJobs: React.FC = () => {
  const { showToast } = useAuth();
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('ALL');

  const [rejectModalJob, setRejectModalJob] = useState<JobData | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchJobs = async () => {
    try {
      const res = await api.admin.getJobs(filter === 'ALL' ? undefined : filter);
      if (res.jobs) {
        setJobs(res.jobs);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error loading jobs',
        message: err.message || 'Failed to fetch job postings.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filter]);

  const handleApprove = async (job: JobData) => {
    try {
      await api.admin.approveJob(job._id, 'Eligibility criteria and curriculum alignment approved.');
      showToast({
        type: 'success',
        title: 'Job Approved',
        message: `"${job.title}" is now open and visible to eligible students.`,
      });
      await fetchJobs();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Approval Error',
        message: err.message || 'Failed to approve job.',
      });
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModalJob) return;
    if (!rejectionReason.trim()) {
      showToast({
        type: 'error',
        title: 'Reason Required',
        message: 'Rejection reason is required for administrative audit.',
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.admin.rejectJob(rejectModalJob._id, rejectionReason.trim());
      showToast({
        type: 'info',
        title: 'Job Rejected',
        message: `"${rejectModalJob.title}" rejected and stored in audit logs.`,
      });
      setRejectModalJob(null);
      setRejectionReason('');
      await fetchJobs();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Rejection Error',
        message: err.message || 'Failed to reject job.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[1536px] mx-auto px-6 py-6 gap-6">
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl">rule</span>
            <h1 className="font-headline-lg text-2xl font-bold text-on-surface">
              Job Posting Approvals &amp; Eligibility Audit
            </h1>
          </div>
          <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
            Authorize campus recruitment drives and ensure rigorous enforcement of cutoff rules.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-outline-variant/30 text-xs">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                filter === st
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
      ) : jobs.length === 0 ? (
        <div className="p-12 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/50 text-xs text-on-surface-variant">
          No job postings match the selected filter.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {jobs.map((job) => {
            const company = job.companyId as any;
            const isApproved = job.approvalStatus === 'APPROVED';
            const isPending = job.approvalStatus === 'PENDING';

            return (
              <div
                key={job._id}
                className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded border text-[11px] font-bold uppercase tracking-wider ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : isPending
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-error-container text-on-error-container border-error'
                      }`}
                    >
                      {job.approvalStatus}
                    </span>
                    <span className="font-label-compact text-xs text-secondary font-semibold uppercase">
                      {job.tier}
                    </span>
                    <span className="text-outline-variant">•</span>
                    <span className="font-bold text-xs text-on-surface">
                      {company?.companyName || 'Corporate Partner'}
                    </span>
                  </div>

                  <h2 className="font-headline-sm text-lg font-bold text-on-surface">{job.title}</h2>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/30 text-xs">
                    <div>
                      <span className="text-on-surface-variant block">Compensation:</span>
                      <span className="font-bold font-code-tabular text-on-surface">
                        {job.stipendOrCTC}
                      </span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block">Cutoff CGPA:</span>
                      <span className="font-bold font-code-tabular text-on-surface">
                        ≥ {job.minimumCGPA.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block">Branches:</span>
                      <span className="font-medium text-on-surface">
                        {job.allowedDepartments?.join(', ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block">Batches:</span>
                      <span className="font-medium text-on-surface">
                        {job.allowedGraduationYears?.join(', ')}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-on-surface-variant line-clamp-2">
                    {job.description}
                  </p>

                  {job.rejectionReason && (
                    <div className="text-error text-xs p-2 bg-error-container rounded">
                      <strong>Rejection Reason:</strong> {job.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 text-xs">
                  {isPending && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(job)}
                        className="px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-semibold transition-colors"
                      >
                        Approve Posting
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectModalJob(job)}
                        className="px-4 py-2 rounded bg-error-container hover:bg-red-200 text-on-error-container font-semibold transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {isApproved && (
                    <span className="text-emerald-800 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">verified</span>
                      Active On-Campus
                    </span>
                  )}
                  {job.approvalStatus === 'REJECTED' && (
                    <button
                      type="button"
                      onClick={() => handleApprove(job)}
                      className="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold"
                    >
                      Re-audit &amp; Approve
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalJob && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-outline-variant flex flex-col gap-4 text-xs">
            <h3 className="font-headline-md text-base font-bold text-on-surface">
              Reject Job Posting: {rejectModalJob.title}
            </h3>
            <p className="text-on-surface-variant">
              Provide an administrative reason for declining this position. This entry will be permanently
              logged in the audit records.
            </p>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-on-surface">Mandatory Reason *</label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Compensation below institutional dream-tier norms, or branch scope misaligned with university curriculum."
                className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded text-on-surface focus:outline-none"
              ></textarea>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setRejectModalJob(null)}
                className="px-4 py-2 rounded bg-surface-container font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleRejectSubmit}
                className="px-4 py-2 rounded bg-error text-white font-semibold hover:bg-red-700"
              >
                {submitting ? 'Auditing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
