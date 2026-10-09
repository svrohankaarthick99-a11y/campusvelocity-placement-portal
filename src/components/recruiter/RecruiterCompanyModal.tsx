import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';

interface CompanyItem {
  id: string;
  _id: string;
  companyName: string;
  logo?: string;
  industry?: string;
  location?: string;
  website?: string;
  recruiterName?: string;
  recruiterEmail?: string;
  activeJobsCount?: number;
}

export const RecruiterCompanyModal: React.FC = () => {
  const { showRecruiterCompanyModal, setShowRecruiterCompanyModal, quickSwitchRole, register } = useAuth();
  const [activeTab, setActiveTab] = useState<'SELECT' | 'CREATE'>('SELECT');
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Company & Recruiter Form
  const [companyName, setCompanyName] = useState<string>('');
  const [recruiterName, setRecruiterName] = useState<string>('');
  const [recruiterEmail, setRecruiterEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('Welcome@123');
  const [designation, setDesignation] = useState<string>('Lead University Recruiter');
  const [website, setWebsite] = useState<string>('');
  const [industry, setIndustry] = useState<string>('Software & Cloud Services');
  const [location, setLocation] = useState<string>('Bangalore / Pan-India');

  useEffect(() => {
    if (showRecruiterCompanyModal) {
      loadCompanies();
      setErrorMessage(null);
    }
  }, [showRecruiterCompanyModal]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const res = await api.auth.getCompanies();
      if (res.companies) {
        setCompanies(res.companies);
      }
    } catch (err) {
      console.error('Failed to load companies list', err);
    } finally {
      setLoading(false);
    }
  };

  if (!showRecruiterCompanyModal) return null;

  const handleSelectCompany = async (comp: CompanyItem) => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await quickSwitchRole('RECRUITER', {
        companyId: comp._id || comp.id,
        email: comp.recruiterEmail,
      });
      setShowRecruiterCompanyModal(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to switch to selected company recruiter.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setErrorMessage('Please enter the hiring company name.');
      return;
    }
    if (!recruiterName.trim()) {
      setErrorMessage('Please enter the recruiter contact name.');
      return;
    }
    if (!recruiterEmail.trim()) {
      setErrorMessage('Please enter the recruiter email address.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await register({
        name: recruiterName.trim(),
        email: recruiterEmail.trim().toLowerCase(),
        password,
        role: 'RECRUITER',
        companyName: companyName.trim(),
        website: website.trim() || `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        industry: industry.trim(),
        location: location.trim(),
        designation: designation.trim(),
      });
      setShowRecruiterCompanyModal(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not create company recruiter profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCompanies = companies.filter((c) =>
    c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.industry && c.industry.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.recruiterName && c.recruiterName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-surface-container-lowest rounded-3xl max-w-2xl w-full shadow-2xl border border-outline-variant/60 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-outline-variant/50 bg-surface-container-low flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-secondary text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-2xl">domain</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-compact text-[11px] font-bold uppercase tracking-wider">
                  Recruiter Access Gateway
                </span>
              </div>
              <h2 className="font-headline-sm text-xl font-bold text-on-surface mt-1">
                From Which Company Are You Hiring?
              </h2>
              <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                Select an active campus partner company or enter a new company recruiter profile.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowRecruiterCompanyModal(false)}
            className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
            title="Close"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-outline-variant/40 bg-surface-container-lowest px-6 pt-3">
          <button
            type="button"
            onClick={() => {
              setActiveTab('SELECT');
              setErrorMessage(null);
            }}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'SELECT'
                ? 'border-secondary text-secondary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">corporate_fare</span>
            <span>Select Existing Company ({companies.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('CREATE');
              setErrorMessage(null);
            }}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'CREATE'
                ? 'border-secondary text-secondary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">add_business</span>
            <span>Enter New Company</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2 border border-error/20">
            <span className="material-symbols-outlined text-base text-error">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab 1: Select Existing Company */}
        {activeTab === 'SELECT' && (
          <div className="p-6 flex flex-col gap-4 overflow-y-auto">
            {/* Search Bar */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                search
              </span>
              <input
                type="text"
                placeholder="Search hiring company (e.g., Google, Microsoft, Deloitte)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-container border border-outline-variant/60 text-xs text-on-surface placeholder:text-outline focus:outline-hidden focus:border-secondary transition-colors"
              />
            </div>

            {loading ? (
              <div className="py-12 text-center text-on-surface-variant text-xs flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-2xl animate-spin text-secondary">
                  progress_activity
                </span>
                <span>Loading campus recruitment partners...</span>
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="py-10 text-center bg-surface-container-low rounded-2xl border border-outline-variant/40">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-1">
                  search_off
                </span>
                <p className="font-headline-sm text-xs font-bold text-on-surface">No company found</p>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Try another search query or switch to "Enter New Company" to register yours.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                {filteredCompanies.map((comp) => (
                  <div
                    key={comp._id || comp.id}
                    onClick={() => !submitting && handleSelectCompany(comp)}
                    className="p-4 rounded-2xl bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant/50 hover:border-secondary/60 cursor-pointer transition-all hover:shadow-md flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl bg-surface-container text-secondary flex items-center justify-center font-bold text-sm shrink-0 border border-outline-variant/30 group-hover:bg-secondary group-hover:text-white transition-colors">
                          {comp.companyName.charAt(0)}
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed text-[10px] font-bold">
                          {comp.activeJobsCount !== undefined ? `${comp.activeJobsCount} Active Jobs` : 'Active Partner'}
                        </span>
                      </div>

                      <h3 className="font-headline-sm text-sm font-bold text-on-surface mt-2.5 group-hover:text-secondary transition-colors">
                        {comp.companyName}
                      </h3>
                      <p className="text-[11px] text-on-surface-variant line-clamp-1">
                        {comp.industry || 'Technology & Digital Solutions'}
                      </p>

                      <div className="mt-2 text-[10px] text-on-surface-variant flex items-center gap-1.5 font-medium">
                        <span className="material-symbols-outlined text-xs text-outline">person</span>
                        <span>{comp.recruiterName || 'Campus Recruiter'}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-outline-variant/30 flex items-center justify-between text-xs font-bold text-secondary">
                      <span>Enter as Recruiter</span>
                      <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Enter New Company */}
        {activeTab === 'CREATE' && (
          <form onSubmit={handleCreateCompanySubmit} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[460px]">
            <div className="p-3.5 rounded-xl bg-secondary-fixed/40 border border-secondary-fixed-dim text-xs text-on-secondary-fixed flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg text-secondary">business_center</span>
              <span>
                Register your organization to instantly browse the applicant pool, review student profiles, and update candidate stages.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Company Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amazon India, Stripe, Uber"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/60 text-xs text-on-surface focus:outline-hidden focus:border-secondary transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Industry / Domain
                </label>
                <input
                  type="text"
                  placeholder="e.g. E-Commerce / Cloud / FinTech"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/60 text-xs text-on-surface focus:outline-hidden focus:border-secondary transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Recruiter Full Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Malhotra"
                  value={recruiterName}
                  onChange={(e) => setRecruiterName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/60 text-xs text-on-surface focus:outline-hidden focus:border-secondary transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Official Recruiter Email <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. v.malhotra@company.com"
                  value={recruiterEmail}
                  onChange={(e) => setRecruiterEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/60 text-xs text-on-surface focus:outline-hidden focus:border-secondary transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Recruiter Designation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lead Campus Recruiter"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/60 text-xs text-on-surface focus:outline-hidden focus:border-secondary transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Company Careers Website
                </label>
                <input
                  type="url"
                  placeholder="https://company.com/careers"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/60 text-xs text-on-surface focus:outline-hidden focus:border-secondary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Office / Hiring Locations
              </label>
              <input
                type="text"
                placeholder="e.g. Bangalore / Hyderabad / Hybrid"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/60 text-xs text-on-surface focus:outline-hidden focus:border-secondary transition-colors"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('SELECT')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                Back to Company List
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-secondary text-white text-xs font-bold hover:bg-secondary-container transition-all shadow-sm flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">
                      progress_activity
                    </span>
                    <span>Setting Up Company Portal...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">domain_add</span>
                    <span>Enter Recruiter Portal as {companyName || 'Recruiter'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
