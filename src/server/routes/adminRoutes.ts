import { Router, Response } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.ts';
import { Company } from '../models/Company.ts';
import { Job } from '../models/Job.ts';
import { Application } from '../models/Application.ts';
import { StudentProfile } from '../models/StudentProfile.ts';
import { User } from '../models/User.ts';
import { AuditLog } from '../models/AuditLog.ts';

const router = Router();

// Apply Admin role authentication
router.use(authenticate);
router.use(requireRole('ADMIN'));

// GET /api/admin/dashboard
router.get('/dashboard', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalStudents = await User.countDocuments({ role: 'STUDENT' });
    const totalRecruiters = await User.countDocuments({ role: 'RECRUITER' });

    const totalCompanies = await Company.countDocuments();
    const pendingCompanies = await Company.countDocuments({ approvalStatus: 'PENDING' });
    const approvedCompanies = await Company.countDocuments({ approvalStatus: 'APPROVED' });

    const totalJobs = await Job.countDocuments();
    const pendingJobs = await Job.countDocuments({ approvalStatus: 'PENDING' });
    const approvedJobs = await Job.countDocuments({ approvalStatus: 'APPROVED' });

    const totalApplications = await Application.countDocuments();
    const selectedApplications = await Application.countDocuments({ status: 'SELECTED' });

    const recentAuditLogs = await AuditLog.find().sort({ timestamp: -1 }).limit(8);

    const pendingCompaniesList = await Company.find({ approvalStatus: 'PENDING' }).populate('recruiterId', 'name email');
    const pendingJobsList = await Job.find({ approvalStatus: 'PENDING' }).populate('companyId').populate('recruiterId', 'name email');

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalRecruiters,
        totalCompanies,
        pendingCompanies,
        approvedCompanies,
        totalJobs,
        pendingJobs,
        approvedJobs,
        totalApplications,
        selectedApplications,
      },
      pendingQueue: {
        companies: pendingCompaniesList,
        jobs: pendingJobsList,
      },
      recentAuditLogs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin dashboard statistics.' });
  }
});

// GET /api/admin/companies
router.get('/companies', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status && status !== 'ALL') {
      filter.approvalStatus = status;
    }

    const companies = await Company.find(filter)
      .populate('recruiterId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: companies.length, companies });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve companies.' });
  }
});

// GET /api/admin/companies/pending
router.get('/companies/pending', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companies = await Company.find({ approvalStatus: 'PENDING' })
      .populate('recruiterId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: companies.length, companies });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve pending companies.' });
  }
});

// PATCH /api/admin/companies/:id/approve
router.patch('/companies/:id/approve', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const admin = req.user!;
    const { remarks } = req.body;

    const company = await Company.findById(req.params.id);
    if (!company) {
      res.status(404).json({ success: false, message: 'Company not found.' });
      return;
    }

    if (company.approvalStatus === 'APPROVED') {
      res.status(400).json({ success: false, message: 'This company is already approved.' });
      return;
    }

    company.approvalStatus = 'APPROVED';
    company.rejectionReason = '';
    await company.save();

    // Create Audit Log
    await AuditLog.create({
      adminId: admin._id,
      adminName: admin.name,
      action: 'COMPANY_APPROVED',
      entityType: 'Company',
      entityId: company._id.toString(),
      entityTitle: company.companyName,
      remarks: remarks || 'Corporate verification completed and approved by Placement Cell.',
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: `Company "${company.companyName}" approved successfully.`,
      company,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve company.' });
  }
});

// PATCH /api/admin/companies/:id/reject
router.patch('/companies/:id/reject', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const admin = req.user!;
    const { reason, remarks } = req.body;

    if (!reason || String(reason).trim() === '') {
      res.status(400).json({ success: false, message: 'A rejection reason is required for administrative audit.' });
      return;
    }

    const company = await Company.findById(req.params.id);
    if (!company) {
      res.status(404).json({ success: false, message: 'Company not found.' });
      return;
    }

    company.approvalStatus = 'REJECTED';
    company.rejectionReason = reason.trim();
    await company.save();

    // Create Audit Log
    await AuditLog.create({
      adminId: admin._id,
      adminName: admin.name,
      action: 'COMPANY_REJECTED',
      entityType: 'Company',
      entityId: company._id.toString(),
      entityTitle: company.companyName,
      remarks: remarks || `Rejected: ${reason.trim()}`,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: `Company "${company.companyName}" rejected.`,
      company,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject company.' });
  }
});

// GET /api/admin/jobs
router.get('/jobs', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status && status !== 'ALL') {
      filter.approvalStatus = status;
    }

    const jobs = await Job.find(filter)
      .populate('companyId')
      .populate('recruiterId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve jobs.' });
  }
});

// GET /api/admin/jobs/pending
router.get('/jobs/pending', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobs = await Job.find({ approvalStatus: 'PENDING' })
      .populate('companyId')
      .populate('recruiterId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve pending jobs.' });
  }
});

// PATCH /api/admin/jobs/:id/approve
router.patch('/jobs/:id/approve', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const admin = req.user!;
    const { remarks } = req.body;

    const job = await Job.findById(req.params.id).populate('companyId');
    if (!job) {
      res.status(404).json({ success: false, message: 'Job posting not found.' });
      return;
    }

    if (job.approvalStatus === 'APPROVED') {
      res.status(400).json({ success: false, message: 'This job posting is already approved.' });
      return;
    }

    job.approvalStatus = 'APPROVED';
    job.rejectionReason = '';
    await job.save();

    // Create Audit Log
    await AuditLog.create({
      adminId: admin._id,
      adminName: admin.name,
      action: 'JOB_APPROVED',
      entityType: 'Job',
      entityId: job._id.toString(),
      entityTitle: `${job.title} (${(job.companyId as any)?.companyName || 'Company'})`,
      remarks: remarks || 'Eligibility criteria and job description approved for campus drive.',
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: `Job posting "${job.title}" approved successfully. Now visible to eligible students.`,
      job,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve job posting.' });
  }
});

// PATCH /api/admin/jobs/:id/reject
router.patch('/jobs/:id/reject', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const admin = req.user!;
    const { reason, remarks } = req.body;

    if (!reason || String(reason).trim() === '') {
      res.status(400).json({ success: false, message: 'Rejection reason is required for administrative audit.' });
      return;
    }

    const job = await Job.findById(req.params.id).populate('companyId');
    if (!job) {
      res.status(404).json({ success: false, message: 'Job posting not found.' });
      return;
    }

    job.approvalStatus = 'REJECTED';
    job.rejectionReason = reason.trim();
    await job.save();

    // Create Audit Log
    await AuditLog.create({
      adminId: admin._id,
      adminName: admin.name,
      action: 'JOB_REJECTED',
      entityType: 'Job',
      entityId: job._id.toString(),
      entityTitle: `${job.title} (${(job.companyId as any)?.companyName || 'Company'})`,
      remarks: remarks || `Rejected: ${reason.trim()}`,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: `Job posting "${job.title}" rejected.`,
      job,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject job posting.' });
  }
});

// GET /api/admin/students
router.get('/students', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const students = await User.find({ role: 'STUDENT' }).sort({ createdAt: -1 });

    const studentList = await Promise.all(
      students.map(async (st) => {
        const profile = await StudentProfile.findOne({ userId: st._id });
        const appCount = await Application.countDocuments({ studentId: st._id });
        const offerCount = await Application.countDocuments({ studentId: st._id, status: 'SELECTED' });

        return {
          id: st._id,
          name: st.name,
          email: st.email,
          createdAt: st.createdAt,
          registrationNumber: profile?.registrationNumber || 'Pending',
          branch: profile?.branch || 'N/A',
          cgpa: profile?.cgpa || 0,
          graduationYear: profile?.graduationYear || 2026,
          placementTierStatus: profile?.placementTierStatus || 'Standard',
          hasActiveBacklogs: profile?.hasActiveBacklogs || false,
          resumeLink: profile?.resumeLink || '',
          skills: profile?.skills || [],
          phone: profile?.phone || '',
          applicationsCount: appCount,
          offersCount: offerCount,
        };
      })
    );

    res.json({ success: true, count: studentList.length, students: studentList });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve student directory.' });
  }
});

// GET /api/admin/applications
router.get('/applications', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, companyId } = req.query;
    const filter: any = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (companyId) {
      filter.companyId = companyId;
    }

    const applications = await Application.find(filter)
      .populate('studentId', 'name email')
      .populate('jobId', 'title minimumCGPA allowedDepartments allowedGraduationYears stipendOrCTC')
      .populate('companyId', 'companyName')
      .sort({ updatedAt: -1 });

    res.json({ success: true, count: applications.length, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve university applications.' });
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action, entityType, search } = req.query;
    const filter: any = {};

    if (action && action !== 'ALL') {
      filter.action = action;
    }
    if (entityType && entityType !== 'ALL') {
      filter.entityType = entityType;
    }
    if (search && String(search).trim() !== '') {
      const s = String(search).trim();
      filter.$or = [
        { adminName: new RegExp(s, 'i') },
        { entityTitle: new RegExp(s, 'i') },
        { remarks: new RegExp(s, 'i') },
        { entityId: new RegExp(s, 'i') },
      ];
    }

    const logs = await AuditLog.find(filter).sort({ timestamp: -1 });

    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
  }
});

export default router;
