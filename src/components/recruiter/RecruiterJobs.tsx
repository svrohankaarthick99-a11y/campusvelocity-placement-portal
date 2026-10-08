import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { JobData } from '../../types.ts';

interface RecruiterJobsProps {
  onSelectJobForApplicants?: (jobId: string) => void;
}

export const RecruiterJobs: React.FC<RecruiterJobsProps> = ({ onSelectJobForApplicants }) => {
  const { showToast, setActiveTab } = useAuth();
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // New Job Form State
  const [newJob, setNewJob] = useState({
    title: '',
    jobType: 'Full Time',
    tier: 'Dream Tier',
    stipendOrCTC: '',
    location: 'Bangalore / Hyderabad',
    description: '',
    responsibilities: '',
    minimumCGPA: '7.5',
    allowedDepartments: 'CSE, IT, ECE',
    allowedGraduationYears: '2026',
    requiredSkills: 'Data Structures, Algorithms, Problem Solving',
    openings: '5',
    applicationDeadline: '',
    assessmentDetails: 'Online Coding Test + 2 Technical Interviews',
  });

  const fetchJobs = async () => {
    try {
      const res = await api.recruiter.getJobs();
      if (res.jobs) {
        setJobs(res.jobs);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error loading jobs',
        message: err.message || 'Failed to retrieve job postings.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const deadline = new Date(newJob.applicationDeadline);
    if (isNaN(deadline.getTime())) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please choose a valid application deadline.',
      });
      setSubmitting(false);
      return;
    }

    const deptArray = newJob.allowedDepartments.split(',').map((d) => d.trim());
    const yearsArray = newJob.allowedGraduationYears.split(',').map((y) => parseInt(y.trim(), 10));
    const skillsArray = newJob.requiredSkills.split(',').map((s) => s.trim());
    const respArray = newJob.responsibilities
      .split('\n')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    try {
      const res = await api.recruiter.createJob({
        title: newJob.title,
        jobType: newJob.jobType,
        tier: newJob.tier,
        stipendOrCTC: newJob.stipendOrCTC,
        location: newJob.location,
        description: newJob.description,
        responsibilities: respArray,
        minimumCGPA: parseFloat(newJob.minimumCGPA),
        allowedDepartments: deptArray,
        allowedGraduationYears: yearsArray,
        requiredSkills: skillsArray,
        openings: parseInt(newJob.openings, 10),
        applicationDeadline: deadline.toISOString(),
        assessmentDetails: newJob.assessmentDetails,
      });

      showToast({
        type: 'success',
        title: 'Job Posting Submitted',
        message: res.message || 'The job has been created with PENDING status for placement cell audit.',
      });

      setShowCreateModal(false);
      await fetchJobs();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.message || 'Failed to submit job posting.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (statusFilter === 'ALL') return true;
    return j.approvalStatus === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'PENDING':
        return 'bg-amber-50 text-amber-900 border-amber-300';
      case 'REJECTED':
        return 'bg-error-container text-on-error-container border-error';
      default:
        return 'bg-surface-container text-on-surface border-outline-variant';
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[1536px] mx-auto px-6 py-6 gap-6">
      {/* Header bar */}
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl">work</span>
            <h1 className="font-headline-lg text-2xl font-bold text-on-surface">
              Manage Placement Postings
            </h1>
          </div>
          <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
            Admin review workflow guarantees compliance with campus eligibility ordinances.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg bg-secondary text-white text-xs font-semibold hover:bg-secondary-container transition-colors flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          <span>Post New Campus Job</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-outline-variant/30 text-xs w-fit">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CLOSED'].map((st) => (
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
            {st} ({st === 'ALL' ? jobs.length : jobs.filter((j) => j.approvalStatus === st).length})
          </button>
        ))}
      </div>

      {/* Jobs Table & List */}
      {loading ? (
        <div className="p-12 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/50">
          <span className="material-symbols-outlined text-3xl animate-spin text-secondary">
            progress_activity
          </span>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-12 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/50 flex flex-col items-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">
            work_outline
          </span>
          <h3 className="font-headline-sm text-base font-bold text-on-surface">
            No Job Postings in this Category
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            Click "Post New Campus Job" to submit an opening for Placement Cell approval.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredJobs.map((job) => (
            <div
              key={job._id}
              className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2.5 py-0.5 rounded border text-[11px] font-bold uppercase tracking-wider ${getStatusBadge(
                      job.approvalStatus
                    )}`}
                  >
                    {job.approvalStatus}
                  </span>
                  <span className="font-label-compact text-xs text-secondary font-semibold uppercase">
                    {job.tier}
                  </span>
                  <span className="text-outline-variant">•</span>
                  <span className="font-code-tabular text-xs text-on-surface-variant">
                    Deadline:{' '}
                    {new Date(job.applicationDeadline).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <h2 className="font-headline-sm text-lg font-bold text-on-surface">{job.title}</h2>

                <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
                  <span>
                    Compensation:{' '}
                    <strong className="text-on-surface font-code-tabular">
                      {job.stipendOrCTC}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>Min Cutoff: ≥ {job.minimumCGPA.toFixed(2)} CGPA</span>
                  <span>•</span>
                  <span>Branches: {job.allowedDepartments?.join(', ')}</span>
                  <span>•</span>
                  <span>Batches: {job.allowedGraduationYears?.join(', ')}</span>
                </div>

                {job.rejectionReason && (
                  <div className="mt-1 p-2 rounded bg-error-container text-on-error-container text-xs">
                    <strong>Admin Reason:</strong> {job.rejectionReason}
                  </div>
                )}
              </div>

              {/* Stats & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                <div className="bg-surface-container-low px-4 py-2 rounded-lg border border-outline-variant/30 flex items-center gap-4 text-xs">
                  <div className="flex flex-col text-center">
                    <span className="text-on-surface-variant text-[11px]">Applicants</span>
                    <span className="font-bold text-sm font-code-tabular text-on-surface">
                      {job.applicantCount || 0}
                    </span>
                  </div>
                  <div className="h-6 w-px bg-outline-variant"></div>
                  <div className="flex flex-col text-center">
                    <span className="text-on-surface-variant text-[11px]">Shortlisted</span>
                    <span className="font-bold text-sm font-code-tabular text-secondary">
                      {job.shortlistedCount || 0}
                    </span>
                  </div>
                  <div className="h-6 w-px bg-outline-variant"></div>
                  <div className="flex flex-col text-center">
                    <span className="text-on-surface-variant text-[11px]">Offers</span>
                    <span className="font-bold text-sm font-code-tabular text-emerald-700">
                      {job.selectedCount || 0}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onSelectJobForApplicants) {
                      onSelectJobForApplicants(job._id);
                    } else {
                      setActiveTab('applicants');
                    }
                  }}
                  className="px-4 py-2 rounded bg-secondary text-white text-xs font-semibold hover:bg-secondary-container transition-colors whitespace-nowrap"
                >
                  Manage Applicants
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Job Posting */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-outline-variant flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
              <div>
                <h2 className="font-headline-md text-lg font-bold text-on-surface">
                  Create Campus Job Opening
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Position will be submitted with PENDING status for Placement Cell verification.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    placeholder="e.g. Software Development Engineer (FTE)"
                    className="w-full p-2 bg-surface-container-low border border-outline-variant rounded"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Job Type *</label>
                  <select
                    value={newJob.jobType}
                    onChange={(e) => setNewJob({ ...newJob, jobType: e.target.value })}
                    className="w-full p-2 bg-surface-container-low border border-outline-variant rounded"
                  >
                    <option value="Full Time">Full Time (FTE)</option>
                    <option value="Internship">Internship</option>
                    <option value="FTE + 6M Intern">FTE + 6 Month Internship</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Placement Tier *</label>
                  <select
                    value={newJob.tier}
                    onChange={(e) => setNewJob({ ...newJob, tier: e.target.value })}
                    className="w-full p-2 bg-surface-container-low border border-outline-variant rounded"
                  >
                    <option value="Super Dream Tier">Super Dream Tier (&gt;20 LPA)</option>
                    <option value="Dream Tier">Dream Tier (10 – 20 LPA)</option>
                    <option value="Mass Hiring Drive">Mass Hiring Drive</option>
                    <option value="Standard">Standard Placement</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Compensation / CTC *</label>
                  <input
                    type="text"
                    required
                    value={newJob.stipendOrCTC}
                    onChange={(e) => setNewJob({ ...newJob, stipendOrCTC: e.target.value })}
                    placeholder="e.g. ₹24.0 LPA or ₹85,000 / mo"
                    className="w-full p-2 bg-surface-container-low border border-outline-variant rounded"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Cutoff Minimum CGPA *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    required
                    value={newJob.minimumCGPA}
                    onChange={(e) => setNewJob({ ...newJob, minimumCGPA: e.target.value })}
                    className="w-full p-2 bg-surface-container-low border border-outline-variant rounded"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Open Positions (Headcount)</label>
                  <input
                    type="number"
                    min="1"
                    value={newJob.openings}
                    onChange={(e) => setNewJob({ ...newJob, openings: e.target.value })}
                    className="w-full p-2 bg-surface-container-low border border-outline-variant rounded"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">
                    Allowed Branches (Comma separated) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newJob.allowedDepartments}
                    onChange={(e) => setNewJob({ ...newJob, allowedDepartments: e.target.value })}
                    placeholder="CSE, IT, ECE"
                    className="w-full p-2 bg-surface-container-low border border-outline-variant rounded"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">
                    Eligible Batches (Graduation Year) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newJob.allowedGraduationYears}
                    onChange={(e) =>
                      setNewJob({ ...newJob, allowedGraduationYears: e.target.value })
                    }
                    placeholder="2026, 2027"
                    className="w-full p-2 bg-surface-container-low border border-outline-variant rounded"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Location</label>
                  <input
                    type="text"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    placeholder="Bangalore / Hyderabad / Remote"
                    className="w-full p-2 bg-surface-container-low border border-outline-variant rounded"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Application Deadline *</label>
                  <input
                    type="date"
                    required
                    value={newJob.applicationDeadline}
                    onChange={(e) => setNewJob({ ...newJob, applicationDeadline: e.target.value })}
                    className="w-full p-2 bg-surface-container-low border border-outline-variant rounded"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Role Description *</label>
                <textarea
                  rows={3}
                  required
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  placeholder="Detail the job expectations, team description, and engineering challenge..."
                  className="w-full p-2 bg-surface-container-low border border-outline-variant rounded"
                ></textarea>
              </div>

              <div>
                <label className="font-semibold block mb-1">Key Responsibilities (1 per line)</label>
                <textarea
                  rows={2}
                  value={newJob.responsibilities}
                  onChange={(e) => setNewJob({ ...newJob, responsibilities: e.target.value })}
                  placeholder="Design scalable cloud APIs&#10;Write clean performant unit tests"
                  className="w-full p-2 bg-surface-container-low border border-outline-variant rounded"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded bg-surface-container font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded bg-secondary text-white font-semibold hover:bg-secondary-container"
                >
                  {submitting ? 'Submitting to TPO...' : 'Submit for Admin Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
