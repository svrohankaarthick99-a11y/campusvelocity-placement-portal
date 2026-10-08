import { Router, Response } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.ts';
import { Company } from '../models/Company.ts';
import { Job } from '../models/Job.ts';
import { Application, ApplicationStatus } from '../models/Application.ts';
import { StudentProfile } from '../models/StudentProfile.ts';
import { User } from '../models/User.ts';

const router = Router();

// Apply recruiter role authentication
router.use(authenticate);
router.use(requireRole('RECRUITER'));

// Helper to get or verify recruiter's company
async function getRecruiterCompany(userId: any) {
  return Company.findOne({ recruiterId: userId });
}

// GET /api/recruiter/dashboard-summary
router.get('/dashboard-summary', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const company = await getRecruiterCompany(user._id);

    const jobs = await Job.find({ recruiterId: user._id }).sort({ createdAt: -1 });
    const jobIds = jobs.map((j) => j._id);

    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate('studentId', 'name email')
      .populate('jobId', 'title')
      .sort({ updatedAt: -1 });

    const totalApplicants = applications.length;
    const shortlistedCount = applications.filter((a) => a.status === 'SHORTLISTED').length;
    const interviewCount = applications.filter((a) => a.status === 'INTERVIEW').length;
    const selectedCount = applications.filter((a) => a.status === 'SELECTED').length;
    const pendingJobsCount = jobs.filter((j) => j.approvalStatus === 'PENDING').length;
    const activeJobsCount = jobs.filter((j) => j.approvalStatus === 'APPROVED').length;

    res.json({
      success: true,
      summary: {
        company,
        activeJobsCount,
        pendingJobsCount,
        totalApplicants,
        shortlistedCount,
        interviewCount,
        selectedCount,
        recentApplications: applications.slice(0, 6),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load recruiter summary.' });
  }
});

// GET /api/recruiter/company
router.get('/company', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let company = await getRecruiterCompany(user._id);

    if (!company) {
      company = await Company.create({
        recruiterId: user._id,
        companyName: `${user.name}'s Organization`,
        approvalStatus: 'PENDING',
      });
    }

    res.json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve company profile.' });
  }
});

// PUT /api/recruiter/company
router.put('/company', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const {
      companyName,
      logo,
      description,
      website,
      industry,
      location,
      contactPerson,
      contactEmail,
      contactPhone,
    } = req.body;

    let company = await getRecruiterCompany(user._id);
    if (!company) {
      company = new Company({ recruiterId: user._id });
    }

    if (companyName) company.companyName = companyName.trim();
    if (logo !== undefined) company.logo = logo.trim();
    if (description !== undefined) company.description = description.trim();
    if (website !== undefined) company.website = website.trim();
    if (industry) company.industry = industry.trim();
    if (location) company.location = location.trim();
    if (contactPerson) company.contactPerson = contactPerson.trim();
    if (contactEmail) company.contactEmail = contactEmail.trim();
    if (contactPhone) company.contactPhone = contactPhone.trim();

    // Preserve existing approval status - recruiters cannot self-approve!
    await company.save();

    res.json({
      success: true,
      message: 'Company profile updated.',
      company,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update company profile.' });
  }
});

// GET /api/recruiter/jobs
router.get('/jobs', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const jobs = await Job.find({ recruiterId: user._id })
      .populate('companyId')
      .sort({ createdAt: -1 });

    const jobIds = jobs.map((j) => j._id);
    const applications = await Application.find({ jobId: { $in: jobIds } });

    const jobsWithStats = jobs.map((job) => {
      const jobApps = applications.filter((a) => a.jobId.toString() === job._id.toString());
      return {
        ...job.toObject(),
        applicantCount: jobApps.length,
        shortlistedCount: jobApps.filter((a) => a.status === 'SHORTLISTED').length,
        interviewCount: jobApps.filter((a) => a.status === 'INTERVIEW').length,
        selectedCount: jobApps.filter((a) => a.status === 'SELECTED').length,
      };
    });

    res.json({ success: true, count: jobsWithStats.length, jobs: jobsWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch recruiter jobs.' });
  }
});

// POST /api/recruiter/jobs (ALWAYS STARTS AS PENDING)
router.post('/jobs', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const company = await getRecruiterCompany(user._id);

    if (!company) {
      res.status(400).json({ success: false, message: 'Please create your company profile before posting a job.' });
      return;
    }

    const {
      title,
      jobType,
      tier,
      stipendOrCTC,
      description,
      responsibilities,
      location,
      minimumCGPA,
      allowedDepartments,
      allowedGraduationYears,
      requiredSkills,
      openings,
      applicationDeadline,
      assessmentDetails,
    } = req.body;

    if (!title || !stipendOrCTC || !description || minimumCGPA === undefined || !applicationDeadline) {
      res.status(400).json({
        success: false,
        message: 'Title, compensation, description, minimum CGPA, and application deadline are required.',
      });
      return;
    }

    const deadlineDate = new Date(applicationDeadline);
    if (isNaN(deadlineDate.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid application deadline date format.' });
      return;
    }

    // Force PENDING status - cannot self-approve!
    const job = await Job.create({
      companyId: company._id,
      recruiterId: user._id,
      title: title.trim(),
      jobType: jobType || 'Full Time',
      tier: tier || 'Dream Tier',
      stipendOrCTC: stipendOrCTC.trim(),
      description: description.trim(),
      responsibilities: Array.isArray(responsibilities) ? responsibilities : [],
      location: location ? location.trim() : 'Pan India',
      minimumCGPA: Number(minimumCGPA),
      allowedDepartments: Array.isArray(allowedDepartments) && allowedDepartments.length > 0 ? allowedDepartments : ['CSE', 'IT', 'ECE'],
      allowedGraduationYears: Array.isArray(allowedGraduationYears) && allowedGraduationYears.length > 0 ? allowedGraduationYears.map(Number) : [2026],
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      openings: openings ? Number(openings) : 5,
      applicationDeadline: deadlineDate,
      assessmentDetails: assessmentDetails || 'Online Technical Assessment',
      approvalStatus: 'PENDING',
    });

    res.status(201).json({
      success: true,
      message: 'Job posting submitted. It is now awaiting Placement Cell approval before being visible to students.',
      job,
    });
  } catch (error) {
    console.error('Job creation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create job posting.' });
  }
});

// GET /api/recruiter/jobs/:id
router.get('/jobs/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const job = await Job.findOne({ _id: req.params.id, recruiterId: user._id }).populate('companyId');

    if (!job) {
      res.status(404).json({ success: false, message: 'Job posting not found or unauthorized.' });
      return;
    }

    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve job details.' });
  }
});

// PUT /api/recruiter/jobs/:id
router.put('/jobs/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const job = await Job.findOne({ _id: req.params.id, recruiterId: user._id });

    if (!job) {
      res.status(404).json({ success: false, message: 'Job posting not found or unauthorized.' });
      return;
    }

    const {
      title,
      jobType,
      tier,
      stipendOrCTC,
      description,
      responsibilities,
      location,
      minimumCGPA,
      allowedDepartments,
      allowedGraduationYears,
      requiredSkills,
      openings,
      applicationDeadline,
    } = req.body;

    if (title) job.title = title.trim();
    if (jobType) job.jobType = jobType.trim();
    if (tier) job.tier = tier.trim();
    if (stipendOrCTC) job.stipendOrCTC = stipendOrCTC.trim();
    if (description) job.description = description.trim();
    if (Array.isArray(responsibilities)) job.responsibilities = responsibilities;
    if (location) job.location = location.trim();
    if (minimumCGPA !== undefined) job.minimumCGPA = Number(minimumCGPA);
    if (Array.isArray(allowedDepartments)) job.allowedDepartments = allowedDepartments;
    if (Array.isArray(allowedGraduationYears)) job.allowedGraduationYears = allowedGraduationYears.map(Number);
    if (Array.isArray(requiredSkills)) job.requiredSkills = requiredSkills;
    if (openings !== undefined) job.openings = Number(openings);
    if (applicationDeadline) job.applicationDeadline = new Date(applicationDeadline);

    // If job was previously rejected, modifying it resets status to PENDING for re-review
    if (job.approvalStatus === 'REJECTED') {
      job.approvalStatus = 'PENDING';
      job.rejectionReason = '';
    }

    await job.save();

    res.json({ success: true, message: 'Job posting updated.', job });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update job posting.' });
  }
});

// GET /api/recruiter/jobs/:id/applicants
router.get('/jobs/:id/applicants', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const job = await Job.findOne({ _id: req.params.id, recruiterId: user._id });

    if (!job) {
      res.status(404).json({ success: false, message: 'Job not found or access restricted to owning recruiter.' });
      return;
    }

    const applications = await Application.find({ jobId: job._id })
      .populate('studentId', 'name email')
      .sort({ updatedAt: -1 });

    const enrichedApplicants = await Promise.all(
      applications.map(async (app) => {
        const student = app.studentId as any;
        const profile = await StudentProfile.findOne({ userId: student._id });
        return {
          applicationId: app._id,
          status: app.status,
          appliedAt: app.appliedAt,
          updatedAt: app.updatedAt,
          statusHistory: app.statusHistory,
          offerLetterRef: app.offerLetterRef,
          interviewDate: app.interviewDate,
          interviewFormat: app.interviewFormat,
          student: {
            id: student._id,
            name: student.name,
            email: student.email,
            registrationNumber: profile?.registrationNumber || 'N/A',
            branch: profile?.branch || 'N/A',
            cgpa: profile?.cgpa || 0,
            graduationYear: profile?.graduationYear || 2026,
            resumeLink: profile?.resumeLink || '',
            skills: profile?.skills || [],
            phone: profile?.phone || '',
            githubLink: profile?.githubLink || '',
            linkedinLink: profile?.linkedinLink || '',
            portfolioLink: profile?.portfolioLink || '',
          },
        };
      })
    );

    res.json({
      success: true,
      job: {
        id: job._id,
        title: job.title,
        approvalStatus: job.approvalStatus,
        minimumCGPA: job.minimumCGPA,
      },
      applicants: enrichedApplicants,
    });
  } catch (error) {
    console.error('Fetch applicants error:', error);
    res.status(500).json({ success: false, message: 'Failed to load applicants.' });
  }
});

// PATCH /api/recruiter/applications/:id/status (INDIVIDUAL APPLICANT UPDATE)
router.patch('/applications/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { status, remarks, interviewDate, interviewFormat, offerLetterRef } = req.body;

    const validStatuses: ApplicationStatus[] = ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const application = await Application.findById(req.params.id).populate('jobId');
    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    const job = application.jobId as any;
    if (job.recruiterId.toString() !== user._id.toString()) {
      res.status(403).json({ success: false, message: 'Forbidden: You cannot modify applicants for jobs you do not own.' });
      return;
    }

    application.status = status;
    if (interviewDate) application.interviewDate = new Date(interviewDate);
    if (interviewFormat) application.interviewFormat = interviewFormat;
    if (offerLetterRef) application.offerLetterRef = offerLetterRef;

    application.statusHistory.push({
      status,
      remarks: remarks || `Candidate moved to ${status} stage by ${user.name}.`,
      changedAt: new Date(),
      changedBy: `${user.name} (Recruiter)`,
    });

    await application.save();

    res.json({
      success: true,
      message: `Application status updated to ${status}.`,
      application,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update applicant status.' });
  }
});

// PATCH /api/recruiter/applications/batch-status (MULTI-SELECT BATCH UPDATES)
router.patch('/applications/batch-status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { applicationIds, status, remarks } = req.body;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      res.status(400).json({ success: false, message: 'applicationIds array is required.' });
      return;
    }

    const validStatuses: ApplicationStatus[] = ['SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: `Invalid status. Allowed batch transitions: ${validStatuses.join(', ')}` });
      return;
    }

    // Verify ownership of every application
    const applications = await Application.find({ _id: { $in: applicationIds } }).populate('jobId');

    let updatedCount = 0;
    const errors: string[] = [];

    for (const app of applications) {
      const job = app.jobId as any;
      if (job.recruiterId.toString() !== user._id.toString()) {
        errors.push(`Application ${app._id} skipped: unauthorized.`);
        continue;
      }

      app.status = status;
      app.statusHistory.push({
        status,
        remarks: remarks || `Batch status updated to ${status} by recruiter ${user.name}.`,
        changedAt: new Date(),
        changedBy: `${user.name} (Recruiter)`,
      });

      await app.save();
      updatedCount++;
    }

    res.json({
      success: true,
      updatedCount,
      totalRequested: applicationIds.length,
      message: `${updatedCount} application(s) updated successfully to ${status}.`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Batch status update error:', error);
    res.status(500).json({ success: false, message: 'Server error during batch status update.' });
  }
});

// POST /api/recruiter/candidate-profile (ADD CANDIDATE PROFILE & APPROVE APPLICATION FOR COMPANY JOB)
router.post('/candidate-profile', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recruiter = req.user!;
    const {
      name,
      email,
      registrationNumber,
      branch,
      cgpa,
      graduationYear,
      resumeLink,
      skills,
      jobId,
      status = 'SHORTLISTED',
      remarks,
    } = req.body;

    if (!name || !email || !jobId) {
      res.status(400).json({ success: false, message: 'Candidate name, email, and target Job ID are required.' });
      return;
    }

    const job = await Job.findById(jobId).populate('companyId');
    if (!job) {
      res.status(404).json({ success: false, message: 'Target job opening not found.' });
      return;
    }

    // Find or create student user
    let studentUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!studentUser) {
      // Create student user with standard default hash
      const defaultHash = '$2a$10$wTqK0zO3kF9i3a5/3Xb4jOJcK3G6j2S3m7j.2e/fC0yE1kQ5o3z6m'; // bcrypt placeholder
      studentUser = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: defaultHash,
        role: 'STUDENT',
      });
    }

    // Find or create student profile
    let studentProfile = await StudentProfile.findOne({ userId: studentUser._id });
    if (!studentProfile) {
      studentProfile = await StudentProfile.create({
        userId: studentUser._id,
        registrationNumber: registrationNumber || `REG${Date.now().toString().slice(-5)}`,
        branch: branch || 'CSE',
        cgpa: typeof cgpa === 'number' ? cgpa : parseFloat(cgpa) || 8.0,
        graduationYear: graduationYear ? parseInt(graduationYear, 10) : 2026,
        resumeLink: resumeLink || '',
        skills: Array.isArray(skills) ? skills : typeof skills === 'string' ? skills.split(',').map((s: string) => s.trim()) : [],
        hasActiveBacklogs: false,
      });
    } else {
      // Update with any provided fresh details
      if (registrationNumber) studentProfile.registrationNumber = registrationNumber;
      if (branch) studentProfile.branch = branch;
      if (cgpa !== undefined) studentProfile.cgpa = typeof cgpa === 'number' ? cgpa : parseFloat(cgpa) || studentProfile.cgpa;
      if (graduationYear) studentProfile.graduationYear = parseInt(graduationYear, 10);
      if (resumeLink) studentProfile.resumeLink = resumeLink;
      if (skills) {
        studentProfile.skills = Array.isArray(skills) ? skills : typeof skills === 'string' ? skills.split(',').map((s: string) => s.trim()) : studentProfile.skills;
      }
      await studentProfile.save();
    }

    // Check if application already exists for this candidate & job
    let application = await Application.findOne({
      studentId: studentUser._id,
      jobId: job._id,
    });

    const targetStatus: ApplicationStatus = ['SHORTLISTED', 'INTERVIEW', 'SELECTED', 'APPLIED', 'REJECTED'].includes(status)
      ? status
      : 'SHORTLISTED';

    if (application) {
      application.status = targetStatus;
      application.statusHistory.push({
        status: targetStatus,
        remarks: remarks || `Profile updated and approved by Recruiter ${recruiter.name}.`,
        changedAt: new Date(),
        changedBy: `${recruiter.name} (Recruiter)`,
      });
      await application.save();
    } else {
      application = await Application.create({
        studentId: studentUser._id,
        jobId: job._id,
        companyId: job.companyId._id || job.companyId,
        status: targetStatus,
        appliedAt: new Date(),
        statusHistory: [
          {
            status: 'APPLIED',
            remarks: `Candidate profile registered by Recruiter ${recruiter.name}.`,
            changedAt: new Date(),
            changedBy: `${recruiter.name} (Recruiter)`,
          },
          {
            status: targetStatus,
            remarks: remarks || `Direct candidate endorsement approved at stage: ${targetStatus}.`,
            changedAt: new Date(),
            changedBy: `${recruiter.name} (Recruiter)`,
          },
        ],
      });
    }

    res.status(201).json({
      success: true,
      message: `Candidate profile for ${name} added & approved (${targetStatus}) for ${job.title}.`,
      application,
      student: {
        id: studentUser._id,
        name: studentUser.name,
        email: studentUser.email,
        registrationNumber: studentProfile.registrationNumber,
        branch: studentProfile.branch,
        cgpa: studentProfile.cgpa,
      },
    });
  } catch (error: any) {
    console.error('Candidate profile addition error:', error);
    res.status(500).json({ success: false, message: 'Failed to add and approve candidate profile.' });
  }
});

// GET /api/recruiter/all-companies (AVAILABLE COMPANIES FOR MULTI-COMPANY TALENT RECRUITERS)
router.get('/all-companies', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companies = await Company.find({ approvalStatus: 'APPROVED' }).sort({ companyName: 1 });
    res.json({ success: true, companies });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve company list.' });
  }
});

export default router;
