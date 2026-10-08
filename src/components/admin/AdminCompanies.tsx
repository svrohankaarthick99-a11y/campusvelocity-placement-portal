import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { CompanyData } from '../../types.ts';

export const AdminCompanies: React.FC = () => {
  const { showToast } = useAuth();
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('ALL');

  const [rejectModalCompany, setRejectModalCompany] = useState<CompanyData | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchCompanies = async () => {
    try {
      const res = await api.admin.getCompanies(filter === 'ALL' ? undefined : filter);
      if (res.companies) {
        setCompanies(res.companies);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error loading companies',
        message: err.message || 'Failed to fetch companies.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [filter]);

  const handleApprove = async (company: CompanyData) => {
    try {
      await api.admin.approveCompany(company._id, 'Accredited by TPO Review Panel');
      showToast({
        type: 'success',
        title: 'Company Approved',
        message: `"${company.companyName}" approved and certified. Audit log entry recorded.`,
      });
      await fetchCompanies();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Approval Error',
        message: err.message || 'Failed to approve company.',
      });
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModalCompany) return;
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
      await api.admin.rejectCompany(rejectModalCompany._id, rejectionReason.trim());
      showToast({
        type: 'info',
        title: 'Company Rejected',
        message: `"${rejectModalCompany.companyName}" marked as rejected in audit records.`,
      });
      setRejectModalCompany(null);
      setRejectionReason('');
      await fetchCompanies();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Rejection Error',
        message: err.message || 'Failed to reject company.',
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
            <span className="material-symbols-outlined text-secondary text-2xl">verified_user</span>
            <h1 className="font-headline-lg text-2xl font-bold text-on-surface">
              Corporate Verification &amp; Accreditation
            </h1>
          </div>
          <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
            Admin oversight: Companies must be approved before their job postings can be scheduled for students.
          </p>
        </div>

        {/* Status Filters */}
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
      ) : companies.length === 0 ? (
        <div className="p-12 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/50 text-xs text-on-surface-variant">
          No companies match the current filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companies.map((company) => {
            const isApproved = company.approvalStatus === 'APPROVED';
            const isPending = company.approvalStatus === 'PENDING';
            const recruiter = company.recruiterId as any;

            return (
              <div
                key={company._id}
                className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/50 flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center font-bold text-lg text-secondary">
                        {company.companyName.charAt(0)}
                      </div>
                      <div>
                        <h2 className="font-headline-sm text-base font-bold text-on-surface">
                          {company.companyName}
                        </h2>
                        <span className="font-body-sm text-xs text-on-surface-variant">
                          {company.industry} • {company.location}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded border text-[11px] font-bold uppercase tracking-wider ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : isPending
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-error-container text-on-error-container border-error'
                      }`}
                    >
                      {company.approvalStatus}
                    </span>
                  </div>

                  <p className="text-xs text-on-surface-variant line-clamp-2 mt-1">
                    {company.description || 'No corporate description provided.'}
                  </p>

                  <div className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/30 text-xs flex flex-col gap-1 text-on-surface-variant">
                    <div>
                      <strong>Recruiter Contact:</strong> {company.contactPerson || recruiter?.name}{' '}
                      ({company.contactEmail || recruiter?.email})
                    </div>
                    {company.website && (
                      <div>
                        <strong>Website:</strong>{' '}
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-secondary hover:underline"
                        >
                          {company.website}
                        </a>
                      </div>
                    )}
                    {company.rejectionReason && (
                      <div className="text-error mt-1">
                        <strong>Rejection Reason:</strong> {company.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/30 text-xs">
                  {isPending && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(company)}
                        className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-semibold transition-colors"
                      >
                        Approve Organization
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectModalCompany(company)}
                        className="px-3 py-1.5 rounded bg-error-container hover:bg-red-200 text-on-error-container font-semibold transition-colors"
                      >
                        Reject with Reason
                      </button>
                    </>
                  )}
                  {isApproved && (
                    <span className="text-emerald-800 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">verified</span>
                      Accredited Partner
                    </span>
                  )}
                  {company.approvalStatus === 'REJECTED' && (
                    <button
                      type="button"
                      onClick={() => handleApprove(company)}
                      className="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold"
                    >
                      Reconsider &amp; Approve
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalCompany && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-outline-variant flex flex-col gap-4 text-xs">
            <h3 className="font-headline-md text-base font-bold text-on-surface">
              Reject Company: {rejectModalCompany.companyName}
            </h3>
            <p className="text-on-surface-variant">
              Please enter an explicit reason for declining this corporate entity. This reason will
              be stored in the permanent administrative audit log and communicated to the recruiter.
            </p>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-on-surface">Mandatory Reason *</label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Unverified legal domain, incomplete institutional MOU, or invalid registration."
                className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded text-on-surface focus:outline-none"
              ></textarea>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setRejectModalCompany(null)}
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
