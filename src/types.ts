export type UserRole = 'STUDENT' | 'RECRUITER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profile?: StudentProfileData | null;
  company?: CompanyData | null;
}

export interface StudentProfileData {
  _id?: string;
  userId: string;
  registrationNumber: string;
  branch: string;
  cgpa: number;
  graduationYear: number;
  resumeLink?: string;
  phone?: string;
  skills: string[];
  portfolioLink?: string;
  githubLink?: string;
  linkedinLink?: string;
  avatarUrl?: string;
  placementTierStatus?: string;
  hasActiveBacklogs: boolean;
  name?: string;
  email?: string;
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type JobApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED';

export interface CompanyData {
  _id: string;
  recruiterId: string | { _id: string; name: string; email: string };
  companyName: string;
  logo: string;
  description: string;
  website: string;
  industry: string;
  location: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  approvalStatus: ApprovalStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface JobData {
  _id: string;
  companyId: CompanyData | string;
  recruiterId: string | { _id: string; name: string; email: string };
  title: string;
  jobType: string;
  tier: string;
  stipendOrCTC: string;
  description: string;
  responsibilities: string[];
  location: string;
  minimumCGPA: number;
  allowedDepartments: string[];
  allowedGraduationYears: number[];
  requiredSkills: string[];
  openings: number;
  applicationDeadline: string;
  assessmentDetails?: string;
  driveType?: string;
  approvalStatus: JobApprovalStatus;
  rejectionReason?: string;
  createdAt: string;
  applicantCount?: number;
  shortlistedCount?: number;
  interviewCount?: number;
  selectedCount?: number;
  eligibility?: {
    isEligible: boolean;
    reasons: string[];
    alreadyApplied: boolean;
  };
  applied?: boolean;
  applicationStatus?: ApplicationStatus | null;
  applicationId?: string | null;
  offerLetterRef?: string | null;
}

export type ApplicationStatus =
  | 'APPLIED'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'SELECTED'
  | 'REJECTED';

export interface StatusHistoryItem {
  status: ApplicationStatus;
  remarks?: string;
  changedAt: string;
  changedBy?: string;
}

export interface ApplicationData {
  _id: string;
  studentId: { _id: string; name: string; email: string } | string;
  jobId: JobData | string;
  companyId: CompanyData | string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  statusHistory: StatusHistoryItem[];
  offerLetterRef?: string;
  interviewDate?: string;
  interviewFormat?: string;
  interviewAttended?: boolean;
  attendedAt?: string;
  interviewNotes?: string;
  interviewCodeSubmission?: string;
}

export interface AuditLogData {
  _id: string;
  adminId: string;
  adminName: string;
  action: string;
  entityType: 'Company' | 'Job' | 'Application' | 'Student';
  entityId: string;
  entityTitle: string;
  remarks: string;
  timestamp: string;
}
