import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { ApplicationStatus, JobData } from '../../types.ts';

interface RecruiterApplicantsProps {
  initialJobId?: string | null;
}

export const RecruiterApplicants: React.FC<RecruiterApplicantsProps> = ({ initialJobId }) => {
  const { showToast } = useAuth();
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [applicants, setApplicants] = useState<any[]>([]);
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

  // "Add Profile" modal state
  const [showAddProfileModal, setShowAddProfileModal] = useState<boolean>(false);
  const [submittingProfile, setSubmittingProfile] = useState<boolean>(false);
  const [newCandidateForm, setNewCandidateForm] = useState({
    name: '',
    email: '',
    registrationNumber: '',
    branch: 'CSE',
    cgpa: '8.50',
    graduationYear: '2026',
    resumeLink: '',
    skills: 'React, Node.js, C++, Data Structures',
    jobId: '',
    status: 'SHORTLISTED' as ApplicationStatus,
    remarks: 'Candidate profile verified and approved for next evaluation round.',
  });

  // Fetch recruiter's jobs first
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.recruiter.getJobs();
        if (res.jobs && res.jobs.length > 0) {
          setJobs(res.jobs);
          const defaultJob =
            initialJobId && res.jobs.some((j: any) => j._id === initialJobId)
              ? initialJobId
              : res.jobs[0]._id;
          setSelectedJobId(defaultJob);
          setNewCandidateForm((prev) => ({ ...prev, jobId: defaultJob }));
        }
      } catch (err) {
        console.error('Error fetching jobs', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [initialJobId]);

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
        batchRemarks || `Recruiter batch updated to ${batchStatus}.`
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
        title: 'Status Updated',
        message: res.message || `Candidate moved to ${status}.`,
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

  // Handle Add Candidate Profile Submission
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
        title: 'Profile Added & Approved',
        message:
          res.message ||
          `Candidate ${newCandidateForm.name} profile added and application approved at stage: ${newCandidateForm.status}!`,
      });

      setShowAddProfileModal(false);
      // Reset form
      setNewCandidateForm({
        name: '',
        email: '',
        registrationNumber: '',
        branch: 'CSE',
        cgpa: '8.50',
        graduationYear: '2026',
        resumeLink: '',
        skills: 'React, Node.js, C++',
        jobId: selectedJobId,
        status: 'SHORTLISTED',
        remarks: 'Candidate profile verified and approved for next evaluation round.',
      });

      // Refresh applicants queue
      await fetchApplicants(targetJobId);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Addition Failed',
        message: err.message || 'Failed to register candidate profile.',
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

  return (
    <div className="flex flex-col w-full max-w-[1536px] mx-auto px-4 sm:px-6 py-6 gap-6">
      {/* Top Header & Job Selector */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl">group</span>
            <h1 className="font-headline-lg text-2xl font-bold text-on-surface">
              Candidate Selection &amp; Review Queue
            </h1>
          </div>
          <p className="font-body-sm text-xs text-on-surface-variant mt-1">
            Review candidate credentials, add/nominate new candidate profiles, and approve application stages.
          </p>
        </div>

        {/* Action Buttons: Add Profile & Drive Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* ADD PROFILE BUTTON */}
          <button
            type="button"
            onClick={() => setShowAddProfileModal(true)}
            className="px-4 py-2 rounded-xl bg-secondary text-white text-xs font-semibold hover:bg-secondary-container transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>+ Add Profile &amp; Approve</span>
          </button>

          {/* Job Dropdown */}
          <div className="flex items-center gap-2 text-xs bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/40">
            <span className="font-semibold text-on-surface whitespace-nowrap">Drive:</span>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="bg-transparent font-semibold text-on-surface focus:outline-none max-w-[220px] truncate"
            >
              {jobs.map((j) => (
                <option key={j._id} value={j._id}>
                  {j.title} ({j.approvalStatus})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-surface-container-low rounded-xl border border-outline-variant/30">
          {['ALL', 'APPLIED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {st} (
              {st === 'ALL' ? applicants.length : applicants.filter((a) => a.status === st).length})
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-2.5 top-2 text-on-surface-variant text-base">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate or roll no..."
            className="w-full pl-8 pr-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs focus:outline-none focus:border-secondary"
          />
        </div>
      </div>

      {/* Batch Actions Bar (when applicants exist) */}
      {filteredApplicants.length > 0 && (
        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-on-surface">
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
            <label className="font-semibold text-on-surface">Set Status:</label>
            <select
              value={batchStatus}
              onChange={(e) => setBatchStatus(e.target.value as ApplicationStatus)}
              className="p-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-semibold focus:outline-none"
            >
              <option value="SHORTLISTED">SHORTLISTED (Round 2)</option>
              <option value="INTERVIEW">INTERVIEW (Technical Panel)</option>
              <option value="SELECTED">SELECTED (Release Offer)</option>
              <option value="REJECTED">REJECTED (Release Candidate)</option>
            </select>

            <button
              type="button"
              disabled={selectedAppIds.length === 0 || updatingBatch}
              onClick={handleBatchUpdate}
              className={`px-4 py-1.5 rounded-lg font-semibold text-white transition-all shadow-xs flex items-center gap-1 ${
                selectedAppIds.length > 0 && !updatingBatch
                  ? 'bg-secondary hover:bg-secondary-container'
                  : 'bg-outline-variant cursor-not-allowed'
              }`}
            >
              {updatingBatch ? 'Updating...' : `Update Selected (${selectedAppIds.length})`}
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
            Click <strong>"+ Add Profile &amp; Approve"</strong> above to nominate/add a candidate profile directly and approve their application!
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
                <th className="p-3.5">Candidate / Roll No</th>
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
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{student.name}</span>
                        <span className="font-code-tabular text-[11px] text-on-surface-variant font-normal">
                          {student.registrationNumber} • {student.email}
                        </span>
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
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveCandidate(item)}
                          className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-[11px]"
                        >
                          Dossier
                        </button>

                        {/* Approval Stage Steppers */}
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
                            className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-[11px]"
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
                            className="px-2.5 py-1 rounded-lg bg-secondary text-white hover:bg-secondary-container font-semibold text-[11px]"
                          >
                            Approve Interview
                          </button>
                        )}
                        {item.status === 'INTERVIEW' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleSingleStatusUpdate(
                                item.applicationId,
                                'SELECTED',
                                'Selected following final interview round. Offer issued.'
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[11px]"
                          >
                            Approve Offer
                          </button>
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
                    Nominate and approve candidates directly for company placement drives
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

            <form onSubmit={handleAddProfileSubmit} className="flex flex-col gap-3">
              {/* Target Drive selection */}
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
                    className="w-full p-2 bg-surface-container-low border border-outline-variant rounded-lg font-code-tabular"
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
                    className="w-full p-2 bg-surface-container-low border border-outline-variant rounded-lg font-code-tabular font-bold"
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
                <label className="font-semibold block mb-1">Technical Skills &amp; Keywords</label>
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
                  Select Initial Approval Stage:
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
                    Selected (Offer)
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
                  className="px-4 py-2 rounded-xl bg-secondary text-white font-semibold hover:bg-secondary-container shadow-xs flex items-center gap-1.5"
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
    </div>
  );
};
