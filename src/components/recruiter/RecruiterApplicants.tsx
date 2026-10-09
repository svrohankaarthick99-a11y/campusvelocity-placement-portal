import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { ApplicationStatus, JobData, CompanyData } from '../../types.ts';
import { VirtualInterviewRoom } from '../student/VirtualInterviewRoom.tsx';

interface RecruiterApplicantsProps {
  initialJobId?: string | null;
}

export const RecruiterApplicants: React.FC<RecruiterApplicantsProps> = ({ initialJobId }) => {
  const { user, showToast } = useAuth();
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('ALL');
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [applicants, setApplicants] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Multi-select state
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [batchStatus, setBatchStatus] = useState<ApplicationStatus>('SHORTLISTED');
  const [batchRemarks, setBatchRemarks] = useState<string>('');
  const [updatingBatch, setUpdatingBatch] = useState<boolean>(false);

  // Single candidate inspection modal
  const [activeCandidate, setActiveCandidate] = useState<any>(null);

  // Interview preview modal state
  const [interviewPreviewApp, setInterviewPreviewApp] = useState<any>(null);

  // "Add Profile & Approve" modal state
  const [showAddProfileModal, setShowAddProfileModal] = useState<boolean>(false);
  const [submittingProfile, setSubmittingProfile] = useState<boolean>(false);
  const [profileSourceMode, setProfileSourceMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [selectedExistingStudentId, setSelectedExistingStudentId] = useState<string>('');

  const [newCandidateForm, setNewCandidateForm] = useState({
    name: '',
    email: '',
    registrationNumber: '',
    branch: 'CSE',
    cgpa: '8.50',
    graduationYear: '2026',
    resumeLink: '',
    skills: 'React, Node.js, C++, Data Structures',
    companyId: '',
    jobId: '',
    status: 'SHORTLISTED' as ApplicationStatus,
    remarks: 'Candidate profile verified and approved for next evaluation round.',
  });

  // Fetch all companies, jobs, and students pool
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [compRes, jobsRes, stuRes] = await Promise.all([
          api.recruiter.getAllCompanies().catch(() => ({ companies: [] })),
          api.recruiter.getJobs({ allCompanies: true }),
          api.recruiter.getStudents().catch(() => ({ students: [] })),
        ]);

        if (compRes.companies) {
          setCompanies(compRes.companies);
        }

        if (stuRes.students) {
          setStudents(stuRes.students);
          if (stuRes.students.length > 0) {
            setSelectedExistingStudentId(stuRes.students[0].id);
          }
        }

        if (jobsRes.jobs && jobsRes.jobs.length > 0) {
          setJobs(jobsRes.jobs);
          const defaultJob =
            initialJobId && jobsRes.jobs.some((j: any) => j._id === initialJobId)
              ? initialJobId
              : jobsRes.jobs[0]._id;
          setSelectedJobId(defaultJob);

          const matchedJob = jobsRes.jobs.find((j: any) => j._id === defaultJob);
          const compId = matchedJob ? (matchedJob.companyId as any)?._id || matchedJob.companyId : '';

          setNewCandidateForm((prev) => ({
            ...prev,
            jobId: defaultJob,
            companyId: compId,
          }));
        }
      } catch (err) {
        console.error('Error fetching initial recruiter data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [initialJobId]);

  // When selected existing student changes in modal, auto-fill form
  useEffect(() => {
    if (selectedExistingStudentId && profileSourceMode === 'EXISTING') {
      const stu = students.find((s) => s.id === selectedExistingStudentId);
      if (stu) {
        setNewCandidateForm((prev) => ({
          ...prev,
          name: stu.name,
          email: stu.email,
          registrationNumber: stu.registrationNumber,
          branch: stu.branch,
          cgpa: String(stu.cgpa),
          graduationYear: String(stu.graduationYear),
          resumeLink: stu.resumeLink,
          skills: Array.isArray(stu.skills) ? stu.skills.join(', ') : stu.skills || '',
        }));
      }
    }
  }, [selectedExistingStudentId, profileSourceMode, students]);

  // Fetch applicants whenever selectedJobId changes
  const fetchApplicants = async (jobId: string) => {
    if (!jobId) return;
    setLoading(true);
    try {
      const res = await api.recruiter.getApplicants(jobId);
      if (res.applicants) {
        setApplicants(res.applicants);
        setSelectedAppIds([]);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error loading candidates',
        message: err.message || 'Failed to fetch applicants.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedJobId) {
      fetchApplicants(selectedJobId);
    }
  }, [selectedJobId]);

  // When company filter changes in UI, update available jobs list
  const filteredJobs = jobs.filter((j) => {
    if (selectedCompanyId === 'ALL') return true;
    const cId = (j.companyId as any)?._id || j.companyId;
    return cId === selectedCompanyId;
  });

  // When filteredJobs changes and current selectedJobId is not inside, update selectedJobId
  useEffect(() => {
    if (filteredJobs.length > 0 && !filteredJobs.some((j) => j._id === selectedJobId)) {
      setSelectedJobId(filteredJobs[0]._id);
    }
  }, [selectedCompanyId, jobs]);

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedAppIds(filteredApplicants.map((a) => a.applicationId));
    } else {
      setSelectedAppIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedAppIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Batch status update
  const handleBatchUpdate = async () => {
    if (selectedAppIds.length === 0) {
      showToast({
        type: 'error',
        title: 'Selection Required',
        message: 'Please check at least one candidate before updating status.',
      });
      return;
    }

    setUpdatingBatch(true);
    try {
      const res = await api.recruiter.batchUpdateApplicantStatus(
        selectedAppIds,
        batchStatus,
        batchRemarks || `Recruiter batch updated and approved at stage: ${batchStatus}.`
      );

      showToast({
        type: 'success',
        title: 'Batch Update Processed',
        message: res.message || `${res.updatedCount} applications updated successfully.`,
      });

      setSelectedAppIds([]);
      setBatchRemarks('');
      await fetchApplicants(selectedJobId);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Batch Update Failed',
        message: err.message || 'Error occurred while updating candidates.',
      });
    } finally {
      setUpdatingBatch(false);
    }
  };

  // Single status update
  const handleSingleStatusUpdate = async (
    applicationId: string,
    status: ApplicationStatus,
    remarks?: string
  ) => {
    try {
      const res = await api.recruiter.updateApplicantStatus(applicationId, status, remarks);
      showToast({
        type: 'success',
        title: 'Candidate Approved',
        message: res.message || `Application transitioned to stage: ${status}.`,
      });
      await fetchApplicants(selectedJobId);
      if (activeCandidate && activeCandidate.applicationId === applicationId) {
        setActiveCandidate({ ...activeCandidate, status });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Update Error',
        message: err.message || 'Failed to change status.',
      });
    }
  };

  // Handle Add Candidate Profile & Approve Submission
  const handleAddProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProfile(true);

    try {
      const targetJobId = newCandidateForm.jobId || selectedJobId;
      const res = await api.recruiter.addCandidateProfile({
        name: newCandidateForm.name,
        email: newCandidateForm.email,
        registrationNumber: newCandidateForm.registrationNumber,
        branch: newCandidateForm.branch,
        cgpa: parseFloat(newCandidateForm.cgpa) || 8.0,
        graduationYear: parseInt(newCandidateForm.graduationYear, 10) || 2026,
        resumeLink: newCandidateForm.resumeLink,
        skills: newCandidateForm.skills,
        jobId: targetJobId,
        status: newCandidateForm.status,
        remarks: newCandidateForm.remarks,
      });

      showToast({
        type: 'success',
        title: 'Candidate Profile Linked & Approved',
        message:
          res.message ||
          `Candidate ${newCandidateForm.name} profile linked and approved at stage: ${newCandidateForm.status}!`,
      });

      setShowAddProfileModal(false);

      // Refresh applicants queue
      await fetchApplicants(targetJobId);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Addition Failed',
        message: err.message || 'Failed to process candidate profile.',
      });
    } finally {
      setSubmittingProfile(false);
    }
  };

  const filteredApplicants = applicants.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const s = item.student;
      return (
        s.name.toLowerCase().includes(q) ||
        s.registrationNumber?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.branch?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const currentJob = jobs.find((j) => j._id === selectedJobId);
  const currentCompanyName = (currentJob?.companyId as any)?.companyName || 'Company';

  return (
    <div className="flex flex-col w-full max-w-[1536px] mx-auto px-4 sm:px-6 py-6 gap-6">
      {/* Top Header & Cross-Company Selector Bar */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">group</span>
            </div>
            <div>
              <h1 className="font-headline-lg text-2xl font-bold text-on-surface">
                Candidate Selection &amp; Review Pipeline
              </h1>
              <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                Multi-company drive management • Single student profile unified evaluation
              </p>
            </div>
          </div>
        </div>

        {/* Action: Add Profile Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAddProfileModal(true)}
            className="px-4 py-2.5 rounded-xl bg-secondary text-white text-xs font-bold hover:bg-secondary-container transition-all flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>+ Add Profile &amp; Approve</span>
          </button>
        </div>
      </div>

      {/* Cross-Company and Drive Filters Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Company Filter */}
          <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/40">
            <span className="font-bold text-on-surface-variant uppercase text-[11px] whitespace-nowrap">
              Company:
            </span>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="bg-transparent font-semibold text-on-surface focus:outline-none max-w-[190px] truncate"
            >
              <option value="ALL">All Companies ({jobs.length} Drives)</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Drive / Role Filter */}
          <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/40">
            <span className="font-bold text-on-surface-variant uppercase text-[11px] whitespace-nowrap">
              Drive Opening:
            </span>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="bg-transparent font-semibold text-on-surface focus:outline-none max-w-[240px] truncate"
            >
              {filteredJobs.map((j) => (
                <option key={j._id} value={j._id}>
                  {j.title} ({(j.companyId as any)?.companyName || 'Company'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-2 text-on-surface-variant text-base">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate, roll no, email..."
            className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-xs focus:outline-none focus:border-secondary transition-all"
          />
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-surface-container-lowest p-2 rounded-2xl shadow-sm border border-outline-variant/60 flex items-center justify-between text-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-xl border border-outline-variant/30">
          {['ALL', 'APPLIED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-surface-container-lowest text-secondary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {st} (
              {st === 'ALL' ? applicants.length : applicants.filter((a) => a.status === st).length})
            </button>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-2 px-3 text-on-surface-variant font-medium">
          <span className="material-symbols-outlined text-base text-secondary">verified</span>
          <span>Drive: {currentCompanyName} • {currentJob?.title}</span>
        </div>
      </div>

      {/* Batch Action Controller */}
      {filteredApplicants.length > 0 && (
        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-on-surface">
              {selectedAppIds.length} of {filteredApplicants.length} Candidates Selected
            </span>
            {selectedAppIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedAppIds([])}
                className="text-secondary hover:underline font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="font-semibold text-on-surface">Approve Stage:</label>
            <select
              value={batchStatus}
              onChange={(e) => setBatchStatus(e.target.value as ApplicationStatus)}
              className="p-1.5 bg-surface-container-lowest border border-outline-variant rounded-xl font-semibold focus:outline-none"
            >
              <option value="SHORTLISTED">SHORTLISTED (Assessment)</option>
              <option value="INTERVIEW">INTERVIEW (Technical Panel)</option>
              <option value="SELECTED">SELECTED (Release Offer)</option>
              <option value="REJECTED">REJECTED (Release Candidate)</option>
            </select>

            <button
              type="button"
              disabled={selectedAppIds.length === 0 || updatingBatch}
              onClick={handleBatchUpdate}
              className={`px-4 py-1.5 rounded-xl font-bold text-white transition-all shadow-xs flex items-center gap-1 ${
                selectedAppIds.length > 0 && !updatingBatch
                  ? 'bg-secondary hover:bg-secondary-container'
                  : 'bg-outline-variant cursor-not-allowed'
              }`}
            >
              {updatingBatch ? 'Updating...' : `Approve Selected (${selectedAppIds.length})`}
            </button>
          </div>
        </div>
      )}

      {/* Candidate Table */}
      {loading ? (
        <div className="p-12 text-center bg-surface-container-lowest rounded-2xl">
          <span className="material-symbols-outlined text-3xl animate-spin text-secondary">
            progress_activity
          </span>
          <p className="text-xs text-on-surface-variant mt-2">Loading candidate queue...</p>
        </div>
      ) : filteredApplicants.length === 0 ? (
        <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/50 flex flex-col items-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">
            person_search
          </span>
          <h3 className="font-headline-sm text-base font-bold text-on-surface">
            No Candidates in this Category
          </h3>
          <p className="text-xs text-on-surface-variant mt-1 max-w-md">
            Click <strong>"+ Add Profile &amp; Approve"</strong> above to select any university student profile and approve their application for this drive!
          </p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/60 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-label-compact uppercase">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedAppIds.length === filteredApplicants.length &&
                      filteredApplicants.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="p-3.5">Candidate / Single Profile</th>
                <th className="p-3.5">Branch</th>
                <th className="p-3.5">CGPA</th>
                <th className="p-3.5">Batch</th>
                <th className="p-3.5">Applied Date</th>
                <th className="p-3.5">Current Stage</th>
                <th className="p-3.5 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {filteredApplicants.map((item) => {
                const student = item.student;
                const isSelectedCheckbox = selectedAppIds.includes(item.applicationId);
                const isInterview = item.status === 'INTERVIEW';

                return (
                  <tr
                    key={item.applicationId}
                    className={`hover:bg-surface-container-low/50 transition-colors ${
                      isSelectedCheckbox ? 'bg-secondary-fixed/30' : ''
                    }`}
                  >
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelectedCheckbox}
                        onChange={() => handleToggleSelect(item.applicationId)}
                        className="rounded"
                      />
                    </td>
                    <td className="p-3.5 font-semibold text-on-surface">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center font-bold text-xs shrink-0">
                          {student.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-on-surface">{student.name}</span>
                          <span className="font-code-tabular text-[11px] text-on-surface-variant font-normal">
                            {student.registrationNumber} • {student.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-on-surface">{student.branch}</td>
                    <td className="p-3.5 font-code-tabular font-bold text-secondary text-sm">
                      {student.cgpa.toFixed(2)}
                    </td>
                    <td className="p-3.5 font-code-tabular text-on-surface-variant">
                      {student.graduationYear}
                    </td>
                    <td className="p-3.5 font-code-tabular text-on-surface-variant">
                      {new Date(item.appliedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] tracking-wider border ${
                          item.status === 'SELECTED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : item.status === 'INTERVIEW'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : item.status === 'SHORTLISTED'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : item.status === 'REJECTED'
                            ? 'bg-error-container text-on-error-container border-error'
                            : 'bg-surface-container text-on-surface border-outline-variant'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setActiveCandidate(item)}
                          className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-[11px]"
                        >
                          Dossier
                        </button>

                        {/* Fast Stage Stepper Buttons */}
                        {item.status === 'APPLIED' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleSingleStatusUpdate(
                                item.applicationId,
                                'SHORTLISTED',
                                'Candidate profile shortlisted for Round 2.'
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px]"
                          >
                            Approve Shortlist
                          </button>
                        )}

                        {item.status === 'SHORTLISTED' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleSingleStatusUpdate(
                                item.applicationId,
                                'INTERVIEW',
                                'Candidate invited to technical interview panel.'
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-secondary text-white hover:bg-secondary-container font-bold text-[11px]"
                          >
                            Approve Interview
                          </button>
                        )}

                        {isInterview && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setInterviewPreviewApp({
                                  ...item,
                                  _id: item.applicationId,
                                  jobId: { title: currentJob?.title || 'Drive Role' },
                                  companyId: { companyName: currentCompanyName },
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim font-bold text-[11px] flex items-center gap-1"
                              title="Enter / Preview Interview Room"
                            >
                              <span className="material-symbols-outlined text-xs">videocam</span>
                              <span>Interview Room</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleSingleStatusUpdate(
                                  item.applicationId,
                                  'SELECTED',
                                  'Selected following final interview round. Offer issued.'
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px]"
                            >
                              Approve Offer
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: ADD CANDIDATE PROFILE & DIRECT APPROVE APPLICATION */}
      {showAddProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-outline-variant flex flex-col gap-4 text-xs">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-2xl">person_add</span>
                <div>
                  <h2 className="font-headline-md text-base font-bold text-on-surface">
                    Add Candidate Profile &amp; Approve Application
                  </h2>
                  <p className="text-[11px] text-on-surface-variant">
                    Nominate candidates across company drives using single student profile architecture
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProfileModal(false)}
                className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleAddProfileSubmit} className="flex flex-col gap-3.5">
              {/* Target Drive & Company Selection */}
              <div>
                <label className="font-bold text-on-surface block mb-1">
                  Target Company Drive *
                </label>
                <select
                  required
                  value={newCandidateForm.jobId}
                  onChange={(e) =>
                    setNewCandidateForm({ ...newCandidateForm, jobId: e.target.value })
                  }
                  className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface font-semibold focus:outline-none"
                >
                  {jobs.map((j) => (
                    <option key={j._id} value={j._id}>
                      {j.title} ({(j.companyId as any)?.companyName || 'Company'}) — Min CGPA {j.minimumCGPA.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Mode Toggle: Existing Student vs New Candidate */}
              <div className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/40 flex flex-col gap-2">
                <label className="font-bold text-on-surface">Candidate Source:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProfileSourceMode('EXISTING')}
                    className={`py-2 rounded-lg font-bold text-center transition-all ${
                      profileSourceMode === 'EXISTING'
                        ? 'bg-secondary text-white shadow-xs'
                        : 'bg-surface-container-lowest text-on-surface border border-outline-variant/50'
                    }`}
                  >
                    Select Existing Student (Single Profile)
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileSourceMode('NEW')}
                    className={`py-2 rounded-lg font-bold text-center transition-all ${
                      profileSourceMode === 'NEW'
                        ? 'bg-secondary text-white shadow-xs'
                        : 'bg-surface-container-lowest text-on-surface border border-outline-variant/50'
                    }`}
                  >
                    Enter New Candidate Details
                  </button>
                </div>

                {profileSourceMode === 'EXISTING' && (
                  <div className="mt-1">
                    <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">
                      Choose from Registered University Students:
                    </label>
                    <select
                      value={selectedExistingStudentId}
                      onChange={(e) => setSelectedExistingStudentId(e.target.value)}
                      className="w-full p-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-semibold text-on-surface focus:outline-none"
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.registrationNumber}) • {s.branch} • CGPA {Number(s.cgpa).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Candidate Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Candidate Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newCandidateForm.name}
                    onChange={(e) =>
                      setNewCandidateForm({ ...newCandidateForm, name: e.target.value })
                    }
                    placeholder="e.g. Pooja Hegde"
                    className="w-full p-2 bg-surface-container-low border border-outline-variant rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Student University Email *</label>
                  <input
                    type="email"
                    required
                    value={newCandidateForm.email}
                    onChange={(e) =>
                      setNewCandidateForm({ ...newCandidateForm, email: e.target.value })
                    }
                    placeholder="e.g. pooja.hegde@nit.ac.in"
                    className="w-full p-2 bg-surface-container-low border border-outline-variant rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Roll / Registration Number</label>
                  <input
                    type="text"
                    value={newCandidateForm.registrationNumber}
                    onChange={(e) =>
                      setNewCandidateForm({
                        ...newCandidateForm,
                        registrationNumber: e.target.value,
                      })
                    }
                    placeholder="2022CSB1090"
                    className="w-full p-2 bg-surface-container-low border border-outline-variant rounded-lg font-code-tabular font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Department / Branch</label>
                  <select
                    value={newCandidateForm.branch}
                    onChange={(e) =>
                      setNewCandidateForm({ ...newCandidateForm, branch: e.target.value })
                    }
                    className="w-full p-2 bg-surface-container-low border border-outline-variant rounded-lg"
                  >
                    <option value="CSE">Computer Science (CSE)</option>
                    <option value="IT">Information Tech (IT)</option>
                    <option value="ECE">Electronics (ECE)</option>
                    <option value="EEE">Electrical (EEE)</option>
                    <option value="MECH">Mechanical (MECH)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Cumulative CGPA (0.00 – 10.00)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={newCandidateForm.cgpa}
                    onChange={(e) =>
                      setNewCandidateForm({ ...newCandidateForm, cgpa: e.target.value })
                    }
                    className="w-full p-2 bg-surface-container-low border border-outline-variant rounded-lg font-code-tabular font-bold text-secondary"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Graduation Batch</label>
                  <select
                    value={newCandidateForm.graduationYear}
                    onChange={(e) =>
                      setNewCandidateForm({ ...newCandidateForm, graduationYear: e.target.value })
                    }
                    className="w-full p-2 bg-surface-container-low border border-outline-variant rounded-lg font-code-tabular"
                  >
                    <option value="2026">Batch 2026</option>
                    <option value="2027">Batch 2027</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Technical Skills</label>
                <input
                  type="text"
                  value={newCandidateForm.skills}
                  onChange={(e) =>
                    setNewCandidateForm({ ...newCandidateForm, skills: e.target.value })
                  }
                  placeholder="e.g. C++, Python, React, Cloud"
                  className="w-full p-2 bg-surface-container-low border border-outline-variant rounded-lg"
                />
              </div>

              {/* Initial Approval Stage */}
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/40 flex flex-col gap-2">
                <label className="font-bold text-on-surface block">
                  Select Approval Stage for this Application:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setNewCandidateForm({ ...newCandidateForm, status: 'SHORTLISTED' })
                    }
                    className={`p-2 rounded-lg font-bold border text-center transition-all ${
                      newCandidateForm.status === 'SHORTLISTED'
                        ? 'bg-amber-100 text-amber-900 border-amber-400 shadow-xs'
                        : 'bg-surface-container-lowest text-on-surface border-outline-variant'
                    }`}
                  >
                    Shortlist
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNewCandidateForm({ ...newCandidateForm, status: 'INTERVIEW' })
                    }
                    className={`p-2 rounded-lg font-bold border text-center transition-all ${
                      newCandidateForm.status === 'INTERVIEW'
                        ? 'bg-secondary text-white border-secondary shadow-xs'
                        : 'bg-surface-container-lowest text-on-surface border-outline-variant'
                    }`}
                  >
                    Interview
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNewCandidateForm({ ...newCandidateForm, status: 'SELECTED' })
                    }
                    className={`p-2 rounded-lg font-bold border text-center transition-all ${
                      newCandidateForm.status === 'SELECTED'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-surface-container-lowest text-on-surface border-outline-variant'
                    }`}
                  >
                    Select (Offer)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Reviewer Remarks / Endorsement Note</label>
                <textarea
                  rows={2}
                  value={newCandidateForm.remarks}
                  onChange={(e) =>
                    setNewCandidateForm({ ...newCandidateForm, remarks: e.target.value })
                  }
                  className="w-full p-2 bg-surface-container-low border border-outline-variant rounded-lg"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setShowAddProfileModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProfile}
                  className="px-4 py-2 rounded-xl bg-secondary text-white font-bold hover:bg-secondary-container shadow-xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>
                    {submittingProfile ? 'Saving...' : 'Add Profile & Approve Application'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CANDIDATE DOSSIER INSPECTOR */}
      {activeCandidate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-outline-variant flex flex-col gap-4">
            <div className="flex items-start justify-between border-b border-outline-variant/40 pb-3">
              <div>
                <span className="font-label-compact text-xs text-secondary uppercase tracking-wider font-semibold">
                  Verified Candidate Profile
                </span>
                <h2 className="font-headline-md text-xl font-bold text-on-surface mt-0.5">
                  {activeCandidate.student.name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant font-code-tabular">
                  <span>Roll: {activeCandidate.student.registrationNumber}</span>
                  <span>•</span>
                  <span>Branch: {activeCandidate.student.branch}</span>
                  <span>•</span>
                  <span className="font-bold text-secondary">
                    CGPA: {activeCandidate.student.cgpa.toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveCandidate(null)}
                className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-3 rounded-lg border border-outline-variant/30">
                <div>
                  <span className="text-on-surface-variant block">Email:</span>
                  <span className="font-medium text-on-surface">
                    {activeCandidate.student.email}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">Graduation Batch:</span>
                  <span className="font-medium text-on-surface">
                    {activeCandidate.student.graduationYear}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">Current Status:</span>
                  <span className="font-bold uppercase text-secondary">
                    {activeCandidate.status}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">Resume:</span>
                  {activeCandidate.student.resumeLink ? (
                    <a
                      href={activeCandidate.student.resumeLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-secondary hover:underline font-semibold flex items-center gap-0.5"
                    >
                      <span>View PDF</span>
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  ) : (
                    <span className="text-on-surface-variant">On File with TPO</span>
                  )}
                </div>
              </div>

              {/* Skills list */}
              {activeCandidate.student.skills && activeCandidate.student.skills.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-on-surface">Skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeCandidate.student.skills.map((skill: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-surface-container text-on-surface"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Status transition controller */}
              <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2">
                <span className="font-semibold text-on-surface">
                  Advance Recruitment Pipeline:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleSingleStatusUpdate(
                        activeCandidate.applicationId,
                        'SHORTLISTED',
                        'Candidate shortlisted for assessment.'
                      )
                    }
                    className="p-2 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-center border border-amber-200"
                  >
                    Shortlist
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleSingleStatusUpdate(
                        activeCandidate.applicationId,
                        'INTERVIEW',
                        'Moved to technical interview rounds.'
                      )
                    }
                    className="p-2 rounded bg-secondary-fixed hover:bg-secondary-fixed-dim text-on-secondary-fixed font-semibold text-center border border-secondary-fixed-dim"
                  >
                    Interview
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleSingleStatusUpdate(
                        activeCandidate.applicationId,
                        'SELECTED',
                        'Candidate passed all rounds and selected for placement.'
                      )
                    }
                    className="p-2 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-semibold text-center border border-emerald-300"
                  >
                    Select
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleSingleStatusUpdate(
                        activeCandidate.applicationId,
                        'REJECTED',
                        'Candidate not selected in current drive.'
                      )
                    }
                    className="p-2 rounded bg-error-container hover:bg-red-200 text-on-error-container font-semibold text-center border border-error"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setActiveCandidate(null)}
                className="px-4 py-2 rounded bg-surface-container font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIRTUAL INTERVIEW ROOM PREVIEW MODAL */}
      {interviewPreviewApp && (
        <VirtualInterviewRoom
          application={interviewPreviewApp}
          onClose={() => setInterviewPreviewApp(null)}
          onAttendanceCompleted={() => {
            fetchApplicants(selectedJobId);
          }}
        />
      )}
    </div>
  );
};
