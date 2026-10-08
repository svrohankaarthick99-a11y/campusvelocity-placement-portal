import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { CompanyData } from '../../types.ts';

export const CompanyProfileView: React.FC = () => {
  const { showToast, refreshUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [company, setCompany] = useState<CompanyData | null>(null);

  const [formData, setFormData] = useState({
    companyName: '',
    website: '',
    industry: '',
    location: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    description: '',
  });

  const fetchCompany = async () => {
    try {
      const res = await api.recruiter.getCompany();
      if (res.company) {
        setCompany(res.company);
        setFormData({
          companyName: res.company.companyName || '',
          website: res.company.website || '',
          industry: res.company.industry || '',
          location: res.company.location || '',
          contactPerson: res.company.contactPerson || '',
          contactEmail: res.company.contactEmail || '',
          contactPhone: res.company.contactPhone || '',
          description: res.company.description || '',
        });
      }
    } catch (err) {
      console.error('Failed to load company profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.recruiter.updateCompany(formData);
      showToast({
        type: 'success',
        title: 'Company Profile Saved',
        message: res.message || 'Corporate profile updated.',
      });
      setCompany(res.company);
      await refreshUser();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Unable to update company profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <span className="material-symbols-outlined text-3xl animate-spin text-secondary">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-[1536px] mx-auto px-6 py-6 gap-6">
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/50 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-2xl">domain</span>
          <h1 className="font-headline-lg text-2xl font-bold text-on-surface">
            Corporate Entity &amp; Partner Profile
          </h1>
        </div>
        <p className="font-body-sm text-xs text-on-surface-variant">
          Organization verification profile registered with National Institute of Technology TPO Cell.
        </p>
      </div>

      {/* Approval Status Card */}
      <div
        className={`p-4 rounded-xl border flex items-center justify-between gap-4 text-xs ${
          company?.approvalStatus === 'APPROVED'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : company?.approvalStatus === 'PENDING'
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-error-container border-error text-on-error-container'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl">
            {company?.approvalStatus === 'APPROVED'
              ? 'verified'
              : company?.approvalStatus === 'PENDING'
              ? 'pending'
              : 'error'}
          </span>
          <div>
            <strong className="block text-sm font-bold">
              Verification Status: {company?.approvalStatus || 'PENDING'}
            </strong>
            <span>
              {company?.approvalStatus === 'APPROVED'
                ? 'Your organization is an accredited campus hiring partner.'
                : company?.approvalStatus === 'PENDING'
                ? 'Your company profile is awaiting Placement Cell approval before jobs become visible to students.'
                : `Declined: ${company?.rejectionReason || 'Contact placement cell for clarification.'}`}
            </span>
          </div>
        </div>

        <span className="font-code-tabular font-bold uppercase px-3 py-1 rounded bg-surface-container-lowest shadow-sm shrink-0">
          {company?.approvalStatus}
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/50 flex flex-col gap-4"
      >
        <h2 className="font-headline-sm text-sm font-bold text-on-surface border-b border-outline-variant/30 pb-2">
          Organization Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-label-compact font-semibold text-on-surface block mb-1">
              Registered Company Name *
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-secondary"
            />
          </div>

          <div>
            <label className="font-label-compact font-semibold text-on-surface block mb-1">
              Official Corporate Website URL
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://company.com"
              className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-secondary"
            />
          </div>

          <div>
            <label className="font-label-compact font-semibold text-on-surface block mb-1">
              Industry Vertical *
            </label>
            <input
              type="text"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              placeholder="e.g. Enterprise Cloud, AI Research, FinTech"
              required
              className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-secondary"
            />
          </div>

          <div>
            <label className="font-label-compact font-semibold text-on-surface block mb-1">
              Primary Office Location / HQ
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Bangalore / Hyderabad"
              className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-secondary"
            />
          </div>

          <div>
            <label className="font-label-compact font-semibold text-on-surface block mb-1">
              Lead TA / Campus Recruiter Name
            </label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-secondary"
            />
          </div>

          <div>
            <label className="font-label-compact font-semibold text-on-surface block mb-1">
              Official Contact Email
            </label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-secondary"
            />
          </div>
        </div>

        <div className="text-xs">
          <label className="font-label-compact font-semibold text-on-surface block mb-1">
            Company Overview &amp; Placement Mission
          </label>
          <textarea
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your organization, engineering culture, and the career path offered to university graduates."
            className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-secondary"
          ></textarea>
        </div>

        <div className="flex justify-end pt-4 border-t border-outline-variant/30">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-secondary text-white rounded-lg text-xs font-semibold hover:bg-secondary-container transition-colors shadow-sm flex items-center gap-1.5"
          >
            {saving ? (
              <span>Saving Changes...</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">save</span>
                <span>Save Company Details</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
