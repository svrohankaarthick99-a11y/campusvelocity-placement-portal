import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';

export const RecruiterDashboard: React.FC = () => {
  const { user, setActiveTab } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);

  const fetchSummary = async () => {
    try {
      const res = await api.recruiter.getDashboardSummary();
      if (res.summary) {
        setData(res.summary);
      }
    } catch (err) {
      console.error('Failed to load recruiter summary', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const company = data?.company || user?.company;
  const isApproved = company?.approvalStatus === 'APPROVED';
  const isPending = company?.approvalStatus === 'PENDING';
  const isRejected = company?.approvalStatus === 'REJECTED';

  return (
    <div className="flex flex-col w-full max-w-[1536px] mx-auto px-6 py-6 gap-6">
      {/* Top Welcome Card */}
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-secondary">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            Corporate Campus Recruitment Portal
          </div>
          <h1 className="font-headline-lg text-2xl font-bold text-on-surface mt-1">
            Welcome, {user?.name || 'Recruiting Partner'}
          </h1>
          <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
            Organization: <strong>{company?.companyName || 'Corporate Partner'}</strong> •{' '}
            {company?.location || 'India'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('applicants')}
            className="px-4 py-2 rounded-xl bg-secondary text-white text-xs font-semibold hover:bg-secondary-container transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>+ Add Profile &amp; Approve</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('jobs')}
            className="px-4 py-2 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Post New Drive</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('applicants')}
            className="px-4 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container transition-all"
          >
            Candidate Queue
          </button>
        </div>
      </div>

      {/* Company Verification Status Banner */}
      {isPending && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-700 text-xl mt-0.5">
            pending_actions
          </span>
          <div className="text-xs">
            <strong className="block font-semibold">
              Company Profile Awaiting Placement Cell Verification
            </strong>
            <span>
              Your company profile has been submitted and is currently being audited by the Placement
              Administration. New job postings will be reviewed in parallel before being displayed to
              eligible student candidates.
            </span>
          </div>
        </div>
      )}

      {isApproved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            <span className="material-symbols-outlined text-emerald-700 text-xl">verified</span>
            <div>
              <strong className="block font-semibold">Institutional Accreditation Active</strong>
              <span>
                Your company is certified to conduct on-campus hiring drives for the 2026-2027
                placement season.
              </span>
            </div>
          </div>
          <span className="font-label-compact text-xs font-bold text-emerald-800 uppercase px-2 py-1 bg-emerald-100 rounded">
            Verified Partner
          </span>
        </div>
      )}

      {isRejected && (
        <div className="p-4 rounded-xl bg-error-container border border-error text-on-error-container flex items-start gap-3">
          <span className="material-symbols-outlined text-error text-xl mt-0.5">error</span>
          <div className="text-xs">
            <strong className="block font-semibold">Company Profile Verification Declined</strong>
            <span>
              Reason: {company?.rejectionReason || 'Documentation insufficient.'} Please update your
              profile to request re-audit.
            </span>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/50">
          <span className="font-label-compact text-xs text-on-surface-variant font-semibold uppercase">
            Active Jobs
          </span>
          <div className="mt-2 text-2xl font-bold font-code-tabular text-on-surface">
            {data?.activeJobsCount ?? 0}
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/50">
          <span className="font-label-compact text-xs text-on-surface-variant font-semibold uppercase">
            Pending Review
          </span>
          <div className="mt-2 text-2xl font-bold font-code-tabular text-amber-700">
            {data?.pendingJobsCount ?? 0}
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/50">
          <span className="font-label-compact text-xs text-on-surface-variant font-semibold uppercase">
            Total Applicants
          </span>
          <div className="mt-2 text-2xl font-bold font-code-tabular text-on-surface">
            {data?.totalApplicants ?? 0}
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/50">
          <span className="font-label-compact text-xs text-on-surface-variant font-semibold uppercase">
            Shortlisted
          </span>
          <div className="mt-2 text-2xl font-bold font-code-tabular text-secondary">
            {data?.shortlistedCount ?? 0}
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/50">
          <span className="font-label-compact text-xs text-on-surface-variant font-semibold uppercase">
            Interviews
          </span>
          <div className="mt-2 text-2xl font-bold font-code-tabular text-secondary">
            {data?.interviewCount ?? 0}
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/50">
          <span className="font-label-compact text-xs text-on-surface-variant font-semibold uppercase">
            Offers Released
          </span>
          <div className="mt-2 text-2xl font-bold font-code-tabular text-emerald-700">
            {data?.selectedCount ?? 0}
          </div>
        </div>
      </div>

      {/* Recent Candidate Submissions */}
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/50 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg">group</span>
            <h2 className="font-headline-sm text-sm font-bold text-on-surface">
              Recent Candidate Applications
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('applicants')}
            className="text-xs text-secondary font-semibold hover:underline"
          >
            Open Multi-Select Candidate Board →
          </button>
        </div>

        {data?.recentApplications?.length === 0 ? (
          <p className="text-xs text-on-surface-variant py-4 text-center">
            No candidate submissions yet. When students apply to your approved jobs, they will appear
            here.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {data?.recentApplications?.map((app: any) => (
              <div
                key={app._id}
                className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <strong className="text-on-surface font-semibold">
                    {app.studentId?.name || 'Candidate'}
                  </strong>
                  <span className="text-on-surface-variant ml-2">
                    applied for {app.jobId?.title || 'Job Posting'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-code-tabular font-bold px-2 py-0.5 rounded bg-surface-container text-on-surface">
                    {app.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('applicants')}
                    className="text-secondary hover:underline font-semibold"
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
