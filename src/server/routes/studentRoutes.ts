import { Router, Response } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.ts';
import { StudentProfile } from '../models/StudentProfile.ts';
import { User } from '../models/User.ts';
import { Job } from '../models/Job.ts';
import { Company } from '../models/Company.ts';
import { Application } from '../models/Application.ts';
import { checkStudentEligibility } from '../utils/eligibility.ts';

const router = Router();

// Apply student role authentication to all student routes
router.use(authenticate);
router.use(requireRole('STUDENT'));

// GET /api/students/profile
router.get('/profile', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let profile = await StudentProfile.findOne({ userId: user._id });

    if (!profile) {
      profile = await StudentProfile.create({
        userId: user._id,
        registrationNumber: `REG-${Date.now().toString().slice(-4)}`,
        branch: 'CSE',
        cgpa: 8.0,
        graduationYear: 2026,
        skills: [],
      });
    }

    res.json({
      success: true,
      profile: {
        ...profile.toObject(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve student profile.' });
  }
});

// PUT /api/students/profile
router.put('/profile', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const {
      name,
      registrationNumber,
      branch,
      cgpa,
      graduationYear,
      resumeLink,
      phone,
      skills,
      portfolioLink,
      githubLink,
      linkedinLink,
    } = req.body;

    if (cgpa !== undefined) {
      const numCgpa = Number(cgpa);
      if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
        res.status(400).json({ success: false, message: 'CGPA must be a valid number between 0.00 and 10.00.' });
        return;
      }
    }

    if (graduationYear !== undefined) {
      const numYear = Number(graduationYear);
      if (isNaN(numYear) || numYear < 2020 || numYear > 2035) {
        res.status(400).json({ success: false, message: 'Please provide a valid graduation year.' });
        return;
      }
    }

    if (name && name.trim()) {
      user.name = name.trim();
      await user.save();
    }

    let profile = await StudentProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new StudentProfile({ userId: user._id });
    }

    if (registrationNumber) profile.registrationNumber = registrationNumber.trim();
    if (branch) profile.branch = branch.trim();
    if (cgpa !== undefined) profile.cgpa = Number(cgpa);
    if (graduationYear !== undefined) profile.graduationYear = Number(graduationYear);
    if (resumeLink !== undefined) profile.resumeLink = resumeLink.trim();
    if (phone !== undefined) profile.phone = phone.trim();
    if (Array.isArray(skills)) profile.skills = skills;
    if (portfolioLink !== undefined) profile.portfolioLink = portfolioLink.trim();
    if (githubLink !== undefined) profile.githubLink = githubLink.trim();
    if (linkedinLink !== undefined) profile.linkedinLink = linkedinLink.trim();

    // Re-evaluate tier status
    if (profile.cgpa >= 8.5) {
      profile.placementTierStatus = 'Tier-1 Super Dream Eligible (No Active Backlogs)';
    } else if (profile.cgpa >= 7.5) {
      profile.placementTierStatus = 'Tier-1 Dream Eligible (No Active Backlogs)';
    } else {
      profile.placementTierStatus = 'Standard Placement Eligible';
    }

    await profile.save();

    res.json({
      success: true,
      message: 'Student profile updated successfully.',
      profile: {
        ...profile.toObject(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update student profile.' });
  }
});

// GET /api/students/dashboard-summary
router.get('/dashboard-summary', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const profile = await StudentProfile.findOne({ userId: user._id });

    // Approved companies only
    const approvedCompanies = await Company.find({ approvalStatus: 'APPROVED' }).select('_id');
    const approvedCompanyIds = approvedCompanies.map((c) => c._id);

    // Active approved jobs
    const activeJobs = await Job.find({
      approvalStatus: 'APPROVED',
      companyId: { $in: approvedCompanyIds },
    }).populate('companyId');

    // Applications submitted by this student
    const applications = await Application.find({ studentId: user._id })
      .populate('jobId')
      .populate('companyId')
      .sort({ updatedAt: -1 });

    const totalApplications = applications.length;
    const shortlistedCount = applications.filter((a) => a.status === 'SHORTLISTED').length;
    const interviewCount = applications.filter((a) => a.status === 'INTERVIEW').length;
    const selectedCount = applications.filter((a) => a.status === 'SELECTED').length;

    // Calculate eligible jobs count
    let eligibleJobsCount = 0;
    const jobSummaries = [];

    for (const job of activeJobs) {
      const company = job.companyId as any;
      const eligibility = await checkStudentEligibility(profile, job, company, user._id.toString());
      if (eligibility.isEligible) {
        eligibleJobsCount++;
      }

      const existingApp = applications.find(
        (a) => a.jobId && (a.jobId as any)._id?.toString() === job._id.toString()
      );

      jobSummaries.push({
        job: job.toObject(),
        eligibility,
        applied: !!existingApp,
        applicationStatus: existingApp ? existingApp.status : null,
        applicationId: existingApp ? existingApp._id : null,
        offerLetterRef: existingApp ? existingApp.offerLetterRef : null,
      });
    }

    // Profile readiness score calculation
    let readinessScore = 50;
    if (profile?.resumeLink) readinessScore += 20;
    if (profile?.skills && profile.skills.length > 2) readinessScore += 10;
    if (profile?.githubLink || profile?.linkedinLink) readinessScore += 5;
    if (!profile?.hasActiveBacklogs) readinessScore += 15;
    if (readinessScore > 100) readinessScore = 100;

    res.json({
      success: true,
      summary: {
        eligibleJobsCount,
        applicationsCount: totalApplications,
        shortlistedCount,
        interviewCount,
        selectedCount,
        readinessScore,
        profile,
        student: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        recentApplications: applications.slice(0, 5),
        recommendedJobs: jobSummaries.slice(0, 8),
      },
    });
  } catch (error) {
    console.error('Student dashboard summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to load dashboard summary.' });
  }
});

// GET /api/students/jobs
router.get('/jobs', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const profile = await StudentProfile.findOne({ userId: user._id });

    const { search, department, minCGPA, jobType, gradYear, tier, sort } = req.query;

    const approvedCompanies = await Company.find({ approvalStatus: 'APPROVED' }).select('_id');
    const approvedCompanyIds = approvedCompanies.map((c) => c._id);

    const query: any = {
      approvalStatus: 'APPROVED',
      companyId: { $in: approvedCompanyIds },
    };

    if (jobType && jobType !== 'All') {
      query.jobType = new RegExp(String(jobType), 'i');
    }

    if (tier && tier !== 'All') {
      query.tier = new RegExp(String(tier), 'i');
    }

    if (department && department !== 'All') {
      query.allowedDepartments = { $in: [String(department)] };
    }

    if (gradYear && gradYear !== 'All') {
      query.allowedGraduationYears = { $in: [Number(gradYear)] };
    }

    if (minCGPA) {
      query.minimumCGPA = { $lte: Number(minCGPA) };
    }

    if (search && String(search).trim() !== '') {
      const s = String(search).trim();
      query.$or = [
        { title: new RegExp(s, 'i') },
        { location: new RegExp(s, 'i') },
        { description: new RegExp(s, 'i') },
        { requiredSkills: { $in: [new RegExp(s, 'i')] } },
      ];
    }

    let sortObj: any = { createdAt: -1 };
    if (sort === 'deadline') {
      sortObj = { applicationDeadline: 1 };
    } else if (sort === 'cgpa-asc') {
      sortObj = { minimumCGPA: 1 };
    } else if (sort === 'cgpa-desc') {
      sortObj = { minimumCGPA: -1 };
    }

    const jobs = await Job.find(query).populate('companyId').sort(sortObj);
    const myApplications = await Application.find({ studentId: user._id });

    const enrichedJobs = await Promise.all(
      jobs.map(async (job) => {
        const company = job.companyId as any;
        const eligibility = await checkStudentEligibility(profile, job, company, user._id.toString());
        const app = myApplications.find((a) => a.jobId.toString() === job._id.toString());

        return {
          ...job.toObject(),
          eligibility,
          applied: !!app,
          applicationStatus: app ? app.status : null,
          applicationId: app ? app._id : null,
        };
      })
    );

    res.json({
      success: true,
      count: enrichedJobs.length,
      jobs: enrichedJobs,
    });
  } catch (error) {
    console.error('Fetch student jobs error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve jobs.' });
  }
});

// GET /api/students/jobs/:id
router.get('/jobs/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const profile = await StudentProfile.findOne({ userId: user._id });
    const job = await Job.findById(req.params.id).populate('companyId');

    if (!job) {
      res.status(404).json({ success: false, message: 'The requested job posting was not found.' });
      return;
    }

    const company = job.companyId as any;
    if (company.approvalStatus !== 'APPROVED' || job.approvalStatus !== 'APPROVED') {
      res.status(403).json({ success: false, message: 'This job posting is not currently open for campus applications.' });
      return;
    }

    const eligibility = await checkStudentEligibility(profile, job, company, user._id.toString());
    const existingApp = await Application.findOne({ studentId: user._id, jobId: job._id });

    res.json({
      success: true,
      job: {
        ...job.toObject(),
        eligibility,
        applied: !!existingApp,
        application: existingApp,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve job details.' });
  }
});

// GET /api/students/applications
router.get('/applications', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const applications = await Application.find({ studentId: user._id })
      .populate('jobId')
      .populate('companyId')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      applications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve applications.' });
  }
});

// GET /api/students/applications/:id
router.get('/applications/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const application = await Application.findOne({
      _id: req.params.id,
      studentId: user._id,
    })
      .populate('jobId')
      .populate('companyId');

    if (!application) {
      res.status(404).json({ success: false, message: 'Application record not found.' });
      return;
    }

    res.json({
      success: true,
      application,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch application details.' });
  }
});

// POST /api/students/applications (STRICT AUTHORITATIVE BACKEND ELIGIBILITY GATING)
router.post('/applications', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { jobId } = req.body;

    if (!jobId) {
      res.status(400).json({ success: false, message: 'Job ID is required.' });
      return;
    }

    const studentProfile = await StudentProfile.findOne({ userId: user._id });
    if (!studentProfile) {
      res.status(400).json({
        success: false,
        message: 'You must complete your student academic profile before submitting applications.',
        reasons: ['Academic profile (CGPA, Branch, Roll Number) missing.'],
      });
      return;
    }

    const job = await Job.findById(jobId).populate('companyId');
    if (!job) {
      res.status(404).json({ success: false, message: 'Job posting not found.' });
      return;
    }

    const company = job.companyId as any;

    // AUTHORITATIVE SERVER-SIDE CHECK
    const eligibility = await checkStudentEligibility(studentProfile, job, company, user._id.toString());

    if (eligibility.alreadyApplied) {
      res.status(409).json({
        success: false,
        message: 'You have already applied for this position.',
        reasons: ['Duplicate application prevented. A submission record already exists in the portal.'],
      });
      return;
    }

    if (!eligibility.isEligible) {
      res.status(422).json({
        success: false,
        message: 'You are not eligible for this position.',
        reasons: eligibility.reasons,
      });
      return;
    }

    // Atomic creation
    const newApplication = await Application.create({
      studentId: user._id,
      jobId: job._id,
      companyId: company._id,
      status: 'APPLIED',
      appliedAt: new Date(),
      statusHistory: [
        {
          status: 'APPLIED',
          remarks: `Application submitted by candidate with verified CGPA ${studentProfile.cgpa.toFixed(2)}.`,
          changedAt: new Date(),
          changedBy: `${user.name} (Candidate)`,
        },
      ],
    });

    const populated = await Application.findById(newApplication._id)
      .populate('jobId')
      .populate('companyId');

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully.',
      application: populated,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'You have already applied for this position.',
        reasons: ['Duplicate application prevented.'],
      });
      return;
    }
    console.error('Application submission error:', error);
    res.status(500).json({ success: false, message: 'Server failure during application submission.' });
  }
});

export default router;
