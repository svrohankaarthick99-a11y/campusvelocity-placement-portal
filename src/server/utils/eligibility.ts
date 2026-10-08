import { IJob } from '../models/Job.ts';
import { IStudentProfile } from '../models/StudentProfile.ts';
import { ICompany } from '../models/Company.ts';
import { Application } from '../models/Application.ts';

export interface EligibilityResult {
  isEligible: boolean;
  reasons: string[];
  alreadyApplied: boolean;
}

export async function checkStudentEligibility(
  studentProfile: IStudentProfile | null,
  job: IJob,
  company: ICompany | null,
  userId: string
): Promise<EligibilityResult> {
  const reasons: string[] = [];

  // Check if profile exists
  if (!studentProfile) {
    return {
      isEligible: false,
      reasons: ['Complete your academic profile (CGPA, Branch, Roll Number) before applying.'],
      alreadyApplied: false,
    };
  }

  // Check duplicate application
  const existingApp = await Application.findOne({
    studentId: userId,
    jobId: job._id,
  });

  const alreadyApplied = !!existingApp;

  // Check company status
  if (!company || company.approvalStatus !== 'APPROVED') {
    reasons.push('The recruiting company is awaiting placement cell verification.');
  }

  // Check job status
  if (job.approvalStatus !== 'APPROVED') {
    reasons.push('This position has not been approved for student applications.');
  }

  // Check application deadline
  const now = new Date();
  if (new Date(job.applicationDeadline).getTime() < now.getTime()) {
    reasons.push(
      `The application deadline has expired on ${new Date(job.applicationDeadline).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}.`
    );
  }

  // Check CGPA
  if (studentProfile.cgpa < job.minimumCGPA) {
    reasons.push(
      `Minimum CGPA required is ${job.minimumCGPA.toFixed(2)}. Your verified CGPA is ${studentProfile.cgpa.toFixed(2)}.`
    );
  }

  // Check department/branch
  if (job.allowedDepartments && job.allowedDepartments.length > 0) {
    const studentBranchNorm = (studentProfile.branch || '').toUpperCase().trim();
    const isBranchAllowed = job.allowedDepartments.some((d) => {
      const allowedNorm = d.toUpperCase().trim();
      return studentBranchNorm === allowedNorm || studentBranchNorm.includes(allowedNorm) || allowedNorm.includes(studentBranchNorm);
    });

    if (!isBranchAllowed) {
      reasons.push(
        `Department restriction: Allowed branches are [${job.allowedDepartments.join(', ')}]. Your registered branch is ${studentProfile.branch}.`
      );
    }
  }

  // Check graduation year
  if (job.allowedGraduationYears && job.allowedGraduationYears.length > 0) {
    if (!job.allowedGraduationYears.includes(studentProfile.graduationYear)) {
      reasons.push(
        `Target batch restriction: Only graduating batch(es) [${job.allowedGraduationYears.join(', ')}] are eligible. Your graduation year is ${studentProfile.graduationYear}.`
      );
    }
  }

  // Check active backlogs if profile reports backlogs
  if (studentProfile.hasActiveBacklogs) {
    reasons.push('Candidate has active backlogs. Dream tier drives require zero standing arrears.');
  }

  return {
    isEligible: reasons.length === 0,
    reasons,
    alreadyApplied,
  };
}
