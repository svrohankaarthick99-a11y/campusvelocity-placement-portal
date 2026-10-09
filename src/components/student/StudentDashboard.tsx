import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { JobData, ApplicationData } from '../../types.ts';
import { VirtualInterviewRoom } from './VirtualInterviewRoom.tsx';

interface StudentDashboardProps {
  onSelectJob?: (jobId: string) => void;
  onOpenOfferModal?: (letterRef: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onSelectJob,
  onOpenOfferModal,
}) => {
  const { user, setActiveTab, showToast } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [activeInterviewApp, setActiveInterviewApp] = useState<any | null>(null);

  const fetchSummary = async () => {
    try {
      const res = await api.student.getDashboardSummary();
      if (res.summary) {
        setSummaryData(res.summary);
      }
    } catch (err) {
      console.error('Failed to load dashboard summary', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    // Real-time polling every 10 seconds for live updates
    const interval = setInterval(fetchSummary, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleApply = async (jobId: string) => {
    setApplyingJobId(jobId);
    try {
      const res = await api.student.apply(jobId);
      showToast({
        type: 'success',
        title: 'Application Submitted',
        message: res.message || 'Your application was accepted by the placement portal.',
      });
      await fetchSummary();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Application Blocked',
        message: err.message || 'Server eligibility check rejected this submission.',
        reasons: err.reasons,
      });
    } finally {
      setApplyingJobId(null);
    }
  };

  const profile = summaryData?.profile || user?.profile;
  const studentName = user?.name || 'Student Candidate';
  const cgpa = profile?.cgpa || 8.42;
  const branch = profile?.branch || 'CSE';
  const rollNo = profile?.registrationNumber || '2024CSB1001';
  const gradYear = profile?.graduationYear || 2026;
  const readiness = summaryData?.readinessScore || 85;

  const eligibleJobs = summaryData?.eligibleJobsCount ?? 28;
  const applicationsCount = summaryData?.applicationsCount ?? 12;
  const shortlistedCount = summaryData?.shortlistedCount ?? 4;
  const interviewCount = summaryData?.interviewCount ?? 2;
  const offersCount = summaryData?.selectedCount ?? 1;

  const recommendedJobs = summaryData?.recommendedJobs || [];

  const filteredJobs = recommendedJobs.filter((item: any) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'high-ctc') {
      const ctc = item.job.stipendOrCTC || '';
      return ctc.includes('28') || ctc.includes('22') || ctc.includes('18');
    }
    if (activeFilter === 'internships') {
      return (
        item.job.jobType?.toLowerCase().includes('intern') ||
        item.job.title?.toLowerCase().includes('intern')
      );
    }
    if (activeFilter === 'core') {
      return (
        item.job.allowedDepartments?.includes('CSE') ||
        item.job.allowedDepartments?.includes('IT')
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col w-full">
      <div className="px-4 sm:px-6 py-6 flex flex-col gap-6 max-w-[1536px] w-full mx-auto">
        {/* Top Identity & Profile Status Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Greeting and Academic Credential Panel */}
          <div className="lg:col-span-7 bg-surface-container-lowest p-6 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden border border-outline-variant/60">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 rounded-full bg-secondary-fixed opacity-30 pointer-events-none"></div>
            <div className="relative z-10 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-secondary font-label-compact text-xs uppercase tracking-wider font-semibold">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                Academic Terminal Verified
              </div>
              <h1 className="font-display-hero text-3xl lg:text-4xl text-on-surface tracking-tight mt-1 font-bold">
                Good morning, {studentName.split(' ')[0]}
              </h1>
              <p className="font-body-base text-sm text-on-surface-variant flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                <span className="font-medium text-on-surface">
                  B.Tech {branch === 'CSE' ? 'Computer Science & Engineering' : branch}
                </span>
                <span className="text-outline-variant">•</span>
                <span className="font-code-tabular text-on-surface-variant">Roll No: {rollNo}</span>
                <span className="text-outline-variant">•</span>
                <span className="inline-flex items-center gap-1 font-semibold text-secondary bg-surface-container px-2 py-0.5 rounded text-xs">
                  CGPA: {Number(cgpa).toFixed(2)}
                </span>
              </p>
            </div>
            <div className="mt-6 pt-3 bg-surface-container-low p-3 rounded-lg flex items-center justify-between border border-outline-variant/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-secondary shadow-sm">
                  <span className="material-symbols-outlined text-xl">school</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-compact text-xs text-on-surface-variant uppercase tracking-wider">
                    Placement Tier Status
                  </span>
                  <span className="font-label-prominent text-sm font-semibold text-on-surface">
                    {profile?.placementTierStatus || 'Tier-1 Dream Eligible (No Active Backlogs)'}
                  </span>
                </div>
              </div>
              <span className="font-code-tabular text-xs text-secondary font-semibold bg-surface-container px-2.5 py-1 rounded">
                BATCH {gradYear - 4}-{gradYear}
              </span>
            </div>
          </div>

          {/* Profile Completion Card */}
          <div className="lg:col-span-5 bg-surface-container-lowest p-6 rounded-2xl shadow-sm flex flex-col justify-between border border-outline-variant/60">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-lg">
                    verified_user
                  </span>
                  <span className="font-label-prominent text-sm font-semibold text-on-surface">
                    Profile Readiness
                  </span>
                </div>
                <span className="font-headline-sm text-base text-secondary font-bold font-code-tabular">
                  {readiness}%
                </span>
              </div>
              {/* Progress track */}
              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                <div
                  className="bg-secondary h-full rounded-full transition-all duration-500"
                  style={{ width: `${readiness}%` }}
                ></div>
              </div>
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex items-start gap-1.5 text-on-surface-variant">
                  <span
                    className="material-symbols-outlined text-sm text-secondary mt-0.5"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  <span className="font-body-sm text-xs text-on-surface-variant leading-tight">
                    Resume v2.4 verified by TPO Office
                  </span>
                </div>
                <div className="flex items-start gap-1.5 text-error">
                  <span className="material-symbols-outlined text-sm mt-0.5">error_outline</span>
                  <span className="font-body-sm text-xs text-error font-medium leading-tight">
                    Missing: Semester 6 Grade Transcript
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-2 flex items-center justify-between border-t border-outline-variant/30">
              <span className="font-label-compact text-xs text-on-surface-variant">
                Requires immediate attention
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-prominent text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
              >
                <span>Complete Profile</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* ACTIVE TECHNICAL INTERVIEW CALLOUT BANNER */}
        {interviewCount > 0 && (
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white p-5 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-700/60">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-inner">
                <span className="material-symbols-outlined text-2xl">video_camera_front</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-base">You are selected for Technical Interview!</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse">
                    Panel Active
                  </span>
                </div>
                <p className="text-xs text-blue-200 mt-1 leading-relaxed">
                  Campus recruitment drive for <strong>Google India (SWE Intern)</strong> has scheduled your live assessment. Click below to enter your virtual interview room and complete your evaluation.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const app = summaryData?.recentApplications?.find((a: any) => a.status === 'INTERVIEW') || {
                  _id: 'app_google_live_67001',
                  status: 'INTERVIEW',
                  jobId: { title: 'Software Engineering Intern' },
                  companyId: { companyName: 'Google India' },
                  interviewFormat: 'Google Meet Panel & Code Evaluation',
                };
                setActiveInterviewApp(app);
              }}
              className="px-5 py-2.5 bg-white text-secondary hover:bg-blue-50 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 self-start md:self-auto"
            >
              <span className="material-symbols-outlined text-base">meeting_room</span>
              <span>Attend Interview (Enter Room)</span>
            </button>
          </div>
        )}

        {/* Placement KPI Summary Grid (5 Metrics) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Metric 1: Eligible Jobs */}
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col justify-between border border-outline-variant/50">
            <div className="flex items-center justify-between">
              <span className="font-label-compact text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                Eligible Jobs
              </span>
              <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-base">business_center</span>
              </div>
            </div>
            <div className="mt-3 flex flex-col">
              <span className="font-headline-lg font-code-tabular text-on-surface text-3xl font-bold">
                {eligibleJobs}
              </span>
              <div className="mt-1 inline-flex items-center gap-1 self-start px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-code-tabular text-xs font-semibold">
                <span className="material-symbols-outlined text-xs">trending_up</span>
                +4 this week
              </div>
            </div>
          </div>

          {/* Metric 2: Applications Submitted */}
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col justify-between border border-outline-variant/50">
            <div className="flex items-center justify-between">
              <span className="font-label-compact text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                Applications
              </span>
              <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
                <span className="material-symbols-outlined text-base">outgoing_mail</span>
              </div>
            </div>
            <div className="mt-3 flex flex-col">
              <span className="font-headline-lg font-code-tabular text-on-surface text-3xl font-bold">
                {applicationsCount}
              </span>
              <span className="mt-1 font-body-sm text-xs text-on-surface-variant font-medium">
                Submitted Total
              </span>
            </div>
          </div>

          {/* Metric 3: Shortlisted */}
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col justify-between border border-outline-variant/50">
            <div className="flex items-center justify-between">
              <span className="font-label-compact text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                Shortlisted
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                <span className="material-symbols-outlined text-base">stars</span>
              </div>
            </div>
            <div className="mt-3 flex flex-col">
              <span className="font-headline-lg font-code-tabular text-on-surface text-3xl font-bold">
                {shortlistedCount}
              </span>
              <div className="mt-1 inline-flex items-center gap-1 self-start px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 font-label-compact text-xs font-semibold">
                Under Review
              </div>
            </div>
          </div>

          {/* Metric 4: Interviews */}
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col justify-between border border-outline-variant/50">
            <div className="flex items-center justify-between">
              <span className="font-label-compact text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                Interviews
              </span>
              <div className="w-7 h-7 rounded-lg bg-secondary-fixed flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-base">video_camera_front</span>
              </div>
            </div>
            <div className="mt-3 flex flex-col">
              <span className="font-headline-lg font-code-tabular text-secondary text-3xl font-bold">
                {interviewCount}
              </span>
              <span className="mt-1 font-body-sm text-xs text-on-surface-variant font-medium">
                Next: Oct 24
              </span>
            </div>
          </div>

          {/* Metric 5: Selected / Offers */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1 bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col justify-between border border-outline-variant/50">
            <div className="flex items-center justify-between">
              <span className="font-label-compact text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                Offers Released
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                <span className="material-symbols-outlined text-base">workspace_premium</span>
              </div>
            </div>
            <div className="mt-3 flex flex-col">
              <span className="font-headline-lg font-code-tabular text-emerald-800 font-bold text-3xl">
                {offersCount}
              </span>
              <div className="mt-1 inline-flex items-center gap-1 self-start px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 font-label-compact text-xs font-bold">
                Deloitte USI
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid (8 Columns Main : 4 Columns Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* COLUMN 1: Recommended & Eligible Opportunities (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Header and Navigation Tabs */}
            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-outline-variant/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-surface-container text-secondary">
                  <span className="material-symbols-outlined text-xl">recommend</span>
                </div>
                <div>
                  <h2 className="font-headline-md text-base font-bold text-on-surface">
                    Recommended &amp; Active Drives
                  </h2>
                  <p className="font-body-sm text-xs text-on-surface-variant">
                    Targeted campus recruiting cycles matched to your credential tier
                  </p>
                </div>
              </div>
              {/* Filter Navigation Tabs */}
              <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded overflow-x-auto border border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeFilter === 'all'
                      ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  All Eligible ({eligibleJobs})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('high-ctc')}
                  className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeFilter === 'high-ctc'
                      ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  High CTC (&gt;18 LPA)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('internships')}
                  className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeFilter === 'internships'
                      ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Internships
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('core')}
                  className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeFilter === 'core'
                      ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Core Tech
                </button>
              </div>
            </div>

            {/* Job Cards Stack */}
            <div className="flex flex-col gap-3">
              {filteredJobs.length === 0 ? (
                <div className="p-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/50">
                  <p className="text-sm text-on-surface-variant">
                    No active postings match the selected filter.
                  </p>
                </div>
              ) : (
                filteredJobs.map((item: any) => {
                  const job = item.job;
                  const company = job.companyId;
                  const isDeloitteOffer = job.title?.includes('Analyst - Technology Consulting');
                  const isEligible = item.eligibility?.isEligible;
                  const applied = item.applied;
                  const appStatus = item.applicationStatus;
                  const companyName = company?.companyName || 'Campus Partner';

                  return (
                    <div
                      key={job._id}
                      className={`bg-surface-container-lowest p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4 border border-outline-variant/50 relative overflow-hidden ${
                        isDeloitteOffer ? 'border-l-4 border-l-emerald-600' : ''
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center font-headline-md font-bold text-lg ${
                              isDeloitteOffer
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-surface-container text-secondary'
                            }`}
                          >
                            {companyName.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-label-prominent text-xs font-semibold text-on-surface-variant">
                                {companyName}
                              </span>
                              <span className="text-outline-variant">•</span>
                              <span
                                className={`font-label-compact text-xs font-semibold uppercase tracking-wider ${
                                  isDeloitteOffer ? 'text-emerald-800' : 'text-secondary'
                                }`}
                              >
                                {isDeloitteOffer ? 'Campus Selected' : job.tier || 'Dream Tier'}
                              </span>
                            </div>
                            <h3 className="font-headline-sm text-lg font-bold text-on-surface mt-0.5">
                              {job.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-on-surface-variant font-body-sm text-xs">
                              <span className="flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-sm">location_on</span>
                                {job.location}
                              </span>
                              <span>•</span>
                              <span
                                className={`flex items-center gap-0.5 font-code-tabular font-medium ${
                                  isDeloitteOffer
                                    ? 'font-semibold text-emerald-800'
                                    : 'text-on-surface'
                                }`}
                              >
                                {isDeloitteOffer ? `Offer: ${job.stipendOrCTC}` : `CTC/Stipend: ${job.stipendOrCTC}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {isDeloitteOffer ? (
                          <div className="self-start sm:self-auto px-3 py-1 rounded bg-emerald-50 text-emerald-800 font-label-compact text-xs font-bold uppercase tracking-wider flex items-center gap-1 border border-emerald-200">
                            <span className="material-symbols-outlined text-sm">verified</span>
                            Offer Accepted
                          </div>
                        ) : applied ? (
                          <div className="self-start sm:self-auto px-2.5 py-1 rounded bg-surface-container text-secondary font-code-tabular text-xs font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">
                              check_circle
                            </span>
                            Status: {appStatus}
                          </div>
                        ) : (
                          <div className="self-start sm:self-auto px-2.5 py-1 rounded bg-surface-container text-secondary font-code-tabular text-xs font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            Apply by{' '}
                            {new Date(job.applicationDeadline).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        )}
                      </div>

                      {/* Qualification Metrics Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-surface-container-low p-3 rounded-lg text-xs border border-outline-variant/30">
                        <div className="flex flex-col">
                          <span className="font-label-compact text-on-surface-variant">Min CGPA</span>
                          <span className="font-code-tabular font-bold text-on-surface mt-0.5">
                            {job.minimumCGPA.toFixed(2)}{' '}
                            <span className="text-[11px] text-secondary font-normal">
                              (Yours: {Number(cgpa).toFixed(2)})
                            </span>
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-compact text-on-surface-variant">Branches</span>
                          <span className="font-body-sm font-medium text-on-surface mt-0.5 truncate">
                            {job.allowedDepartments?.join(' / ') || 'All'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-compact text-on-surface-variant">Target Batch</span>
                          <span className="font-code-tabular font-medium text-on-surface mt-0.5">
                            Grad: {job.allowedGraduationYears?.join(', ') || '2026'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-compact text-on-surface-variant">
                            {isDeloitteOffer ? 'Verification' : 'Drive Type'}
                          </span>
                          <span className="font-body-sm font-medium text-on-surface mt-0.5 truncate">
                            {isDeloitteOffer ? 'TPO Office Confirmed' : job.driveType || 'On-Campus Direct'}
                          </span>
                        </div>
                      </div>

                      {/* Letter Ref box if Deloitte */}
                      {isDeloitteOffer && (
                        <div className="bg-surface-container-low p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-1 border border-outline-variant/30">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-label-compact text-on-surface-variant">
                              Letter Reference:
                            </span>
                            <span className="font-code-tabular text-on-surface font-semibold">
                              DEL-USI-2026-CAMPUS-7719
                            </span>
                          </div>
                          <span className="font-body-sm text-xs text-on-surface-variant">
                            Verified by Head Placement Office
                          </span>
                        </div>
                      )}

                      {/* Card Actions */}
                      <div className="flex items-center justify-between pt-1">
                        {isDeloitteOffer ? (
                          <>
                            <span className="font-body-sm text-xs text-on-surface-variant">
                              Formal onboarding initiates July 2026
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenOfferModal) {
                                  onOpenOfferModal('DEL-USI-2026-CAMPUS-7719');
                                } else {
                                  showToast({
                                    type: 'success',
                                    title: 'Offer Letter DEL-USI-2026-CAMPUS-7719',
                                    message: 'Deloitte USI Technology Consulting offer valid & verified.',
                                  });
                                }
                              }}
                              className="px-4 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-label-prominent text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <span className="material-symbols-outlined text-sm">download</span>
                              <span>View Offer Letter</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 text-secondary font-label-compact text-xs font-semibold">
                              {isEligible ? (
                                <>
                                  <span className="material-symbols-outlined text-base text-emerald-600">
                                    check_circle
                                  </span>
                                  <span className="text-emerald-700">
                                    All criteria verified against academic record
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-base text-error">
                                    cancel
                                  </span>
                                  <span className="text-error">
                                    Ineligible ({item.eligibility?.reasons?.[0] || 'Criteria unmet'})
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectJob) onSelectJob(job._id);
                                  else setActiveTab('browse-jobs');
                                }}
                                className="px-3 py-1.5 rounded bg-surface-container text-on-surface hover:bg-surface-container-high font-label-prominent text-xs font-medium transition-colors"
                              >
                                View JD
                              </button>
                              {applied ? (
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('my-applications')}
                                  className="px-3 py-1.5 rounded bg-surface-container text-secondary font-label-prominent text-xs font-semibold flex items-center gap-1"
                                >
                                  <span>Track Stage</span>
                                  <span className="material-symbols-outlined text-sm">
                                    arrow_forward
                                  </span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={!isEligible || applyingJobId === job._id}
                                  onClick={() => handleApply(job._id)}
                                  className={`px-3 py-1.5 rounded font-label-prominent text-xs font-semibold transition-colors flex items-center gap-1 ${
                                    isEligible
                                      ? 'bg-secondary text-white hover:bg-secondary-container'
                                      : 'bg-outline-variant text-on-surface-variant/50 cursor-not-allowed'
                                  }`}
                                >
                                  <span>
                                    {applyingJobId === job._id
                                      ? 'Verifying...'
                                      : isEligible
                                      ? 'Apply Now'
                                      : 'Ineligible'}
                                  </span>
                                  <span className="material-symbols-outlined text-sm">
                                    arrow_forward
                                  </span>
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Drive Preparation & Analytics Bento Strip */}
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 border border-outline-variant/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-xl">analytics</span>
                </div>
                <div>
                  <span className="font-headline-sm text-sm font-bold text-on-surface">
                    Campus Placement Probability Score
                  </span>
                  <p className="font-body-sm text-xs text-on-surface-variant">
                    Based on {Number(cgpa).toFixed(2)} CGPA, coding assessment results, and verified branch record
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col text-right">
                  <span className="font-headline-md text-base text-secondary font-code-tabular font-bold">
                    Top 8%
                  </span>
                  <span className="font-label-compact text-xs text-on-surface-variant">
                    Cohort Percentile
                  </span>
                </div>
                {/* Progress SVG arc */}
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                  <circle
                    className="text-surface-container"
                    cx="18"
                    cy="18"
                    fill="none"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="3"
                  ></circle>
                  <circle
                    className="text-secondary"
                    cx="18"
                    cy="18"
                    fill="none"
                    r="14"
                    stroke="currentColor"
                    strokeDasharray="88, 100"
                    strokeWidth="3"
                  ></circle>
                </svg>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Sidebar Widgets (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Widget 1: Recent Applications & Pipeline Status */}
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col gap-4 border border-outline-variant/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-lg">
                    history_toggle_off
                  </span>
                  <h2 className="font-headline-sm text-sm font-bold text-on-surface">
                    Application Pipeline
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('my-applications')}
                  className="font-label-compact text-xs text-secondary hover:underline font-semibold"
                >
                  View All ({applicationsCount})
                </button>
              </div>

              {/* Application Status List */}
              <div className="flex flex-col gap-3">
                {/* Item 1: Google SWE Intern */}
                <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1.5 border border-outline-variant/30">
                  <div className="flex items-center justify-between">
                    <span className="font-label-prominent text-xs text-on-surface font-bold">
                      Google India
                    </span>
                    <span className="font-code-tabular text-xs text-on-surface-variant">
                      SWE Intern
                    </span>
                  </div>
                  <div className="px-2 py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-body-sm text-xs font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">event_available</span>
                      Interview: Oct 24, 10:00 AM
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const app = summaryData?.recentApplications?.find((a: any) => a.status === 'INTERVIEW') || {
                          _id: 'app_google_live_67001',
                          status: 'INTERVIEW',
                          jobId: { title: 'Software Engineering Intern' },
                          companyId: { companyName: 'Google India' },
                          interviewFormat: 'Google Meet Panel & Code Evaluation',
                        };
                        setActiveInterviewApp(app);
                      }}
                      className="px-2 py-0.5 rounded bg-secondary text-white text-[11px] font-bold hover:bg-secondary-container transition-all"
                    >
                      Attend
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-on-surface-variant mt-0.5">
                    <span>Format: Google Meet (Technical)</span>
                    <button
                      type="button"
                      onClick={() => {
                        const app = summaryData?.recentApplications?.find((a: any) => a.status === 'INTERVIEW') || {
                          _id: 'app_google_live_67001',
                          status: 'INTERVIEW',
                          jobId: { title: 'Software Engineering Intern' },
                          companyId: { companyName: 'Google India' },
                          interviewFormat: 'Google Meet Panel & Code Evaluation',
                        };
                        setActiveInterviewApp(app);
                      }}
                      className="text-secondary hover:underline font-label-compact font-bold"
                    >
                      Enter Room ➔
                    </button>
                  </div>
                </div>

                {/* Item 2: Microsoft Corporation */}
                <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1.5 border border-outline-variant/30">
                  <div className="flex items-center justify-between">
                    <span className="font-label-prominent text-xs text-on-surface font-bold">
                      Microsoft Corporation
                    </span>
                    <span className="font-code-tabular text-xs text-on-surface-variant">
                      Graduate SWE
                    </span>
                  </div>
                  <div className="px-2 py-1 rounded bg-amber-50 text-amber-900 font-body-sm text-xs font-medium flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">star_half</span>
                    Shortlisted for Round 2 (System Design)
                  </div>
                  <div className="flex items-center justify-between text-xs text-on-surface-variant mt-0.5">
                    <span>Result cleared: Oct 14</span>
                    <span className="font-label-compact text-on-surface-variant">Waiting slot</span>
                  </div>
                </div>

                {/* Item 3: Deloitte USI */}
                <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1.5 border border-outline-variant/30">
                  <div className="flex items-center justify-between">
                    <span className="font-label-prominent text-xs text-on-surface font-bold">
                      Deloitte USI
                    </span>
                    <span className="font-code-tabular text-xs text-on-surface-variant">
                      Analyst
                    </span>
                  </div>
                  <div className="px-2 py-1 rounded bg-emerald-50 text-emerald-800 font-body-sm text-xs font-semibold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    Selected • Offer ₹12.5 LPA
                  </div>
                  <div className="flex items-center justify-between text-xs text-on-surface-variant mt-0.5">
                    <span>DEL-USI-2026-CAMPUS-7719</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Widget 2: Upcoming Drive Deadlines & Notices */}
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col gap-4 border border-outline-variant/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-lg">campaign</span>
                  <h2 className="font-headline-sm text-sm font-bold text-on-surface">
                    TPO Circulars &amp; Notices
                  </h2>
                </div>
                <span className="font-label-compact text-[11px] uppercase tracking-wider text-error font-bold px-1.5 py-0.5 rounded bg-error-container">
                  Urgent
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {/* Notice 1: Goldman Sachs PPT */}
                <div className="p-3 rounded-lg bg-error-container text-on-error-container flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-error">
                      priority_high
                    </span>
                    <span className="font-label-prominent text-xs font-bold text-on-surface">
                      Mandatory Pre-Placement Talk
                    </span>
                  </div>
                  <p className="font-body-sm text-xs text-on-surface-variant leading-snug">
                    Goldman Sachs PPT tomorrow at{' '}
                    <strong className="text-on-surface">4:00 PM in Audi-1</strong>. Attendance
                    biometric tracking active. Formal Western dress code compulsory.
                  </p>
                  <span className="font-label-compact text-[11px] text-error font-semibold mt-1">
                    Tomorrow • 16:00 IST
                  </span>
                </div>

                {/* Notice 2: Resume verification */}
                <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1 border border-outline-variant/30">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-secondary">
                      assignment_turned_in
                    </span>
                    <span className="font-label-prominent text-xs font-semibold text-on-surface">
                      Resume Verification Clinic
                    </span>
                  </div>
                  <p className="font-body-sm text-xs text-on-surface-variant leading-snug">
                    Final physical verification window for Batch 2026 resumes. Hall 4, Main Admin
                    Block. Bring 2 hard copies of Grade Cards.
                  </p>
                  <div className="flex items-center justify-between text-xs text-on-surface-variant mt-1 font-code-tabular">
                    <span>Today: 2:00 PM – 5:30 PM</span>
                    <span className="text-secondary font-medium">Room 402</span>
                  </div>
                </div>

                {/* Notice 3: Mock Interview Registration */}
                <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1 border border-outline-variant/30">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-on-surface-variant">
                      co_present
                    </span>
                    <span className="font-label-prominent text-xs font-semibold text-on-surface">
                      Alumni Mock Interviews
                    </span>
                  </div>
                  <p className="font-body-sm text-xs text-on-surface-variant leading-snug">
                    1:1 45-minute slots with alumni working at Meta, Uber, and Microsoft. Registration
                    closes tonight at 23:59.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      showToast({
                        type: 'info',
                        title: 'Alumni Mock Interview Slot',
                        message: 'Redirecting to booking portal for Microsoft Alumni session.',
                      })
                    }
                    className="font-label-compact text-xs text-secondary font-semibold hover:underline mt-1 text-left"
                  >
                    Book 45-min Slot →
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Resources Card */}
            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col gap-2 border border-outline-variant/50">
              <span className="font-label-compact text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                Institutional Downloads
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    showToast({
                      type: 'info',
                      title: 'NOC Downloaded',
                      message: 'Academic No-Objection Certificate template saved to downloads.',
                    })
                  }
                  className="p-3 rounded bg-surface-container hover:bg-surface-container-high transition-colors flex items-center gap-2 text-on-surface text-left"
                >
                  <span className="material-symbols-outlined text-base text-secondary">
                    file_download
                  </span>
                  <span className="font-label-compact text-xs font-medium">NOC Template</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    showToast({
                      type: 'info',
                      title: 'Placement Bylaws',
                      message: 'Academic Session 2026-27 placement guidelines PDF downloaded.',
                    })
                  }
                  className="p-3 rounded bg-surface-container hover:bg-surface-container-high transition-colors flex items-center gap-2 text-on-surface text-left"
                >
                  <span className="material-symbols-outlined text-base text-secondary">gavel</span>
                  <span className="font-label-compact text-xs font-medium">Placement Bylaws</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Virtual Interview Room Modal */}
      {activeInterviewApp && (
        <VirtualInterviewRoom
          application={activeInterviewApp}
          onClose={() => setActiveInterviewApp(null)}
          onAttendanceCompleted={() => {
            fetchSummary();
          }}
        />
      )}
    </div>
  );
};
