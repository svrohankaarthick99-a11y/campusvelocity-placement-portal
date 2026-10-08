import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { JobData } from '../../types.ts';

export const BrowseJobs: React.FC = () => {
  const { user, showToast, setActiveTab } = useAuth();
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [department, setDepartment] = useState<string>('All');
  const [jobType, setJobType] = useState<string>('All');
  const [minCGPA, setMinCGPA] = useState<string>('');
  const [gradYear, setGradYear] = useState<string>('All');
  const [sort, setSort] = useState<string>('newest');

  // Selected job for modal details
  const [selectedJob, setSelectedJob] = useState<JobData | null>(null);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.student.getJobs({
        search,
        department,
        jobType,
        minCGPA: minCGPA ? Number(minCGPA) : undefined,
        gradYear,
        sort,
      });
      if (res.jobs) {
        setJobs(res.jobs);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error loading jobs',
        message: err.message || 'Failed to retrieve active job openings.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [department, jobType, minCGPA, gradYear, sort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleApply = async (job: JobData) => {
    setApplyingJobId(job._id);
    try {
      const res = await api.student.apply(job._id);
      showToast({
        type: 'success',
        title: 'Application Accepted',
        message: res.message || 'Your application has been registered with the placement office.',
      });
      // Refresh jobs list
      await fetchJobs();
      if (selectedJob && selectedJob._id === job._id) {
        setSelectedJob(null);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Application Gated / Ineligible',
        message: err.message || 'You do not satisfy the criteria for this position.',
        reasons: err.reasons,
      });
    } finally {
      setApplyingJobId(null);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[1536px] mx-auto px-6 py-6 gap-6">
      {/* Title & Filter Header */}
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/50 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-headline-lg text-2xl font-bold text-on-surface">
              Explore Campus Opportunities
            </h1>
            <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
              Verified corporate recruiting cycles for National Institute of Technology
            </p>
          </div>
          <span className="font-code-tabular text-xs font-semibold px-2.5 py-1 rounded bg-surface-container text-secondary self-start sm:self-auto">
            {jobs.length} Active Positions
          </span>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job role, keywords (e.g. C++, Cloud, ML), or location..."
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:border-secondary"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-secondary text-white rounded-lg text-xs font-semibold hover:bg-secondary-container transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        {/* Filter controls */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-outline-variant/30 text-xs">
          <div>
            <label className="font-label-compact text-on-surface-variant block mb-1">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full p-2 bg-surface-container-low border border-outline-variant rounded text-on-surface focus:outline-none"
            >
              <option value="All">All Departments</option>
              <option value="CSE">Computer Science (CSE)</option>
              <option value="IT">Information Tech (IT)</option>
              <option value="ECE">Electronics (ECE)</option>
              <option value="EEE">Electrical (EEE)</option>
              <option value="MECH">Mechanical (MECH)</option>
              <option value="CIVIL">Civil (CIVIL)</option>
            </select>
          </div>

          <div>
            <label className="font-label-compact text-on-surface-variant block mb-1">Job Type</label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="w-full p-2 bg-surface-container-low border border-outline-variant rounded text-on-surface focus:outline-none"
            >
              <option value="All">All Types</option>
              <option value="Full Time">Full Time (FTE)</option>
              <option value="Internship">Internship</option>
            </select>
          </div>

          <div>
            <label className="font-label-compact text-on-surface-variant block mb-1">
              Batch (Grad Year)
            </label>
            <select
              value={gradYear}
              onChange={(e) => setGradYear(e.target.value)}
              className="w-full p-2 bg-surface-container-low border border-outline-variant rounded text-on-surface focus:outline-none"
            >
              <option value="All">All Batches</option>
              <option value="2026">Batch 2026</option>
              <option value="2027">Batch 2027</option>
            </select>
          </div>

          <div>
            <label className="font-label-compact text-on-surface-variant block mb-1">
              Max Min-CGPA
            </label>
            <select
              value={minCGPA}
              onChange={(e) => setMinCGPA(e.target.value)}
              className="w-full p-2 bg-surface-container-low border border-outline-variant rounded text-on-surface focus:outline-none"
            >
              <option value="">Any CGPA Cutoff</option>
              <option value="8.5">≤ 8.50 CGPA</option>
              <option value="8.0">≤ 8.00 CGPA</option>
              <option value="7.5">≤ 7.50 CGPA</option>
              <option value="7.0">≤ 7.00 CGPA</option>
            </select>
          </div>

          <div>
            <label className="font-label-compact text-on-surface-variant block mb-1">Sort By</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full p-2 bg-surface-container-low border border-outline-variant rounded text-on-surface focus:outline-none"
            >
              <option value="newest">Recently Posted</option>
              <option value="deadline">Closest Deadline</option>
              <option value="cgpa-asc">CGPA Cutoff (Low to High)</option>
              <option value="cgpa-desc">CGPA Cutoff (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="p-12 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/50">
          <span className="material-symbols-outlined text-3xl animate-spin text-secondary">
            progress_activity
          </span>
          <p className="text-xs text-on-surface-variant mt-2">Checking academic eligibility...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-12 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/50 flex flex-col items-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">
            search_off
          </span>
          <h3 className="font-headline-sm text-base font-bold text-on-surface">
            No Job Postings Found
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            Try adjusting your search query, department, or CGPA filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => {
            const company = job.companyId as any;
            const companyName = company?.companyName || 'Corporate Partner';
            const isEligible = job.eligibility?.isEligible;
            const applied = job.applied;
            const reasons = job.eligibility?.reasons || [];

            return (
              <div
                key={job._id}
                className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-outline-variant/50 flex flex-col justify-between hover:shadow-md transition-shadow gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center font-bold text-secondary text-base">
                      {companyName.charAt(0)}
                    </div>
                    <span className="font-label-compact text-[11px] font-semibold text-secondary uppercase bg-surface-container-low px-2 py-0.5 rounded">
                      {job.tier}
                    </span>
                  </div>

                  <div>
                    <span className="font-label-compact text-xs text-on-surface-variant font-medium">
                      {companyName}
                    </span>
                    <h3 className="font-headline-sm text-base font-bold text-on-surface line-clamp-1 mt-0.5">
                      {job.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-on-surface-variant font-body-sm">
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {job.location}
                    </span>
                    <span>•</span>
                    <span className="font-code-tabular font-semibold text-on-surface">
                      {job.stipendOrCTC}
                    </span>
                  </div>

                  <p className="font-body-sm text-xs text-on-surface-variant line-clamp-2 mt-1">
                    {job.description}
                  </p>

                  {/* Requirements summary */}
                  <div className="bg-surface-container-low p-2 rounded text-xs flex flex-col gap-1 border border-outline-variant/30">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Cutoff CGPA:</span>
                      <span className="font-code-tabular font-bold text-on-surface">
                        ≥ {job.minimumCGPA.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Branches:</span>
                      <span className="font-medium text-on-surface truncate max-w-[150px]">
                        {job.allowedDepartments?.join(', ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Batch:</span>
                      <span className="font-code-tabular font-medium text-on-surface">
                        {job.allowedGraduationYears?.join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Eligibility indicator */}
                  <div className="flex items-center gap-1.5 text-xs">
                    {applied ? (
                      <span className="text-secondary font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Applied ({job.applicationStatus})
                      </span>
                    ) : isEligible ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        Eligible to apply
                      </span>
                    ) : (
                      <span className="text-error font-medium flex items-center gap-1 text-[11px] truncate" title={reasons[0]}>
                        <span className="material-symbols-outlined text-sm shrink-0">cancel</span>
                        <span className="truncate">{reasons[0] || 'Criteria not met'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/30">
                  <button
                    type="button"
                    onClick={() => setSelectedJob(job)}
                    className="px-3 py-1.5 rounded bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-semibold"
                  >
                    Details &amp; JD
                  </button>

                  {applied ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab('my-applications')}
                      className="px-3 py-1.5 rounded bg-surface-container text-secondary text-xs font-semibold"
                    >
                      Track Application
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!isEligible || applyingJobId === job._id}
                      onClick={() => handleApply(job)}
                      className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                        isEligible
                          ? 'bg-secondary text-white hover:bg-secondary-container'
                          : 'bg-outline-variant text-on-surface-variant/50 cursor-not-allowed'
                      }`}
                    >
                      <span>
                        {applyingJobId === job._id
                          ? 'Applying...'
                          : isEligible
                          ? 'Apply'
                          : 'Ineligible'}
                      </span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-outline-variant flex flex-col gap-4">
            <div className="flex items-start justify-between border-b border-outline-variant/40 pb-3">
              <div>
                <span className="font-label-compact text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                  {(selectedJob.companyId as any)?.companyName || 'Corporate Partner'} • {selectedJob.tier}
                </span>
                <h2 className="font-headline-md text-xl font-bold text-on-surface mt-1">
                  {selectedJob.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-1">
                  <span>Location: {selectedJob.location}</span>
                  <span>•</span>
                  <span className="font-code-tabular font-bold text-secondary">
                    CTC / Stipend: {selectedJob.stipendOrCTC}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Eligibility Banner inside Modal */}
            <div
              className={`p-3 rounded-xl border text-xs flex flex-col gap-1 ${
                selectedJob.applied
                  ? 'bg-surface-container border-secondary text-secondary'
                  : selectedJob.eligibility?.isEligible
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-error-container border-error text-on-error-container'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-base">
                  {selectedJob.applied
                    ? 'check_circle'
                    : selectedJob.eligibility?.isEligible
                    ? 'verified'
                    : 'error'}
                </span>
                <span>
                  {selectedJob.applied
                    ? `Already Applied (Current Stage: ${selectedJob.applicationStatus})`
                    : selectedJob.eligibility?.isEligible
                    ? 'You are Eligible for this Position'
                    : 'You are NOT Eligible for this Position'}
                </span>
              </div>
              {selectedJob.eligibility?.reasons && selectedJob.eligibility.reasons.length > 0 && !selectedJob.applied && (
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {selectedJob.eligibility.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Job Description */}
            <div className="flex flex-col gap-2">
              <h3 className="font-headline-sm text-sm font-bold text-on-surface">Role Overview</h3>
              <p className="font-body-base text-xs text-on-surface-variant leading-relaxed whitespace-pre-line">
                {selectedJob.description}
              </p>
            </div>

            {/* Responsibilities */}
            {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="font-headline-sm text-sm font-bold text-on-surface">
                  Key Responsibilities
                </h3>
                <ul className="list-disc list-inside text-xs text-on-surface-variant space-y-1">
                  {selectedJob.responsibilities.map((resp, i) => (
                    <li key={i}>{resp}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Criteria Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-surface-container-low p-3 rounded-xl text-xs border border-outline-variant/30">
              <div>
                <span className="text-on-surface-variant block">Minimum CGPA</span>
                <span className="font-bold font-code-tabular text-on-surface">
                  {selectedJob.minimumCGPA.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Eligible Branches</span>
                <span className="font-medium text-on-surface">
                  {selectedJob.allowedDepartments?.join(', ')}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Target Batches</span>
                <span className="font-medium text-on-surface">
                  {selectedJob.allowedGraduationYears?.join(', ')}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Application Deadline</span>
                <span className="font-medium text-on-surface font-code-tabular">
                  {new Date(selectedJob.applicationDeadline).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Skills */}
            {selectedJob.requiredSkills && selectedJob.requiredSkills.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-on-surface">Required Skills:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.requiredSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-xs bg-surface-container text-on-surface-variant font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/40">
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 rounded text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high"
              >
                Close
              </button>

              {selectedJob.applied ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedJob(null);
                    setActiveTab('my-applications');
                  }}
                  className="px-4 py-2 rounded text-xs font-semibold bg-secondary text-white hover:bg-secondary-container"
                >
                  View My Application
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!selectedJob.eligibility?.isEligible || applyingJobId === selectedJob._id}
                  onClick={() => handleApply(selectedJob)}
                  className={`px-4 py-2 rounded text-xs font-semibold flex items-center gap-1 ${
                    selectedJob.eligibility?.isEligible
                      ? 'bg-secondary text-white hover:bg-secondary-container'
                      : 'bg-outline-variant text-on-surface-variant/50 cursor-not-allowed'
                  }`}
                >
                  <span>
                    {applyingJobId === selectedJob._id
                      ? 'Submitting...'
                      : selectedJob.eligibility?.isEligible
                      ? 'Submit Application'
                      : 'Ineligible to Apply'}
                  </span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
