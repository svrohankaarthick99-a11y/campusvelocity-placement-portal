import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../models/User.ts';
import { StudentProfile } from '../models/StudentProfile.ts';
import { Company } from '../models/Company.ts';
import { Job } from '../models/Job.ts';
import { Application } from '../models/Application.ts';
import { authenticate, AuthRequest, generateToken } from '../middleware/auth.ts';

const router = Router();

// Track most recently active student profile in memory
let latestActiveStudentEmail: string = '';

// POST /api/auth/register
router.post('/register', async (req, res): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      role,
      registrationNumber,
      branch,
      cgpa,
      graduationYear,
      resumeLink,
      skills,
      phone,
      avatarUrl,
      companyName,
      website,
      designation,
      department,
    } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ success: false, message: 'Name, email, password, and role are required.' });
      return;
    }

    if (!['STUDENT', 'RECRUITER', 'ADMIN'].includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role. Must be STUDENT, RECRUITER, or ADMIN.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      return;
    }

    if (password.length < 4) {
      res.status(400).json({ success: false, message: 'Password must be at least 4 characters long.' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      if (role === 'STUDENT') {
        // If student exists with this email, update their profile details
        existingUser.name = name.trim();
        if (password) existingUser.passwordHash = await bcrypt.hash(password, 10);
        await existingUser.save();

        let profile = await StudentProfile.findOne({ userId: existingUser._id });
        if (!profile) {
          profile = new StudentProfile({ userId: existingUser._id });
        }
        if (registrationNumber) profile.registrationNumber = registrationNumber.trim();
        if (branch) profile.branch = branch;
        if (cgpa !== undefined) profile.cgpa = typeof cgpa === 'number' ? cgpa : parseFloat(cgpa) || 8.2;
        if (graduationYear) profile.graduationYear = parseInt(graduationYear.toString(), 10);
        if (resumeLink) profile.resumeLink = resumeLink;
        if (phone) profile.phone = phone;
        if (skills) profile.skills = Array.isArray(skills) ? skills : skills.split(',').map((s: string) => s.trim()).filter(Boolean);
        await profile.save();

        // Safely reassign applications belonging to template student (Rohan Sharma) without index conflicts
        const templateStudent = await User.findOne({ email: 'rohan.sharma@nit.ac.in' });
        if (templateStudent && templateStudent._id.toString() !== existingUser._id.toString()) {
          const templateApps = await Application.find({ studentId: templateStudent._id });
          for (const app of templateApps) {
            const alreadyExists = await Application.findOne({ studentId: existingUser._id, jobId: app.jobId });
            if (!alreadyExists) {
              app.studentId = existingUser._id;
              await app.save();
            }
          }
          await StudentProfile.deleteOne({ userId: templateStudent._id });
          await User.deleteOne({ _id: templateStudent._id });
        }

        latestActiveStudentEmail = existingUser.email;

        const token = generateToken(existingUser);
        res.status(200).json({
          success: true,
          message: 'Student profile updated successfully.',
          token,
          user: {
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
            profile,
          },
        });
        return;
      }

      if (role === 'RECRUITER') {
        existingUser.name = name.trim();
        if (password) existingUser.passwordHash = await bcrypt.hash(password, 10);
        await existingUser.save();

        let comp = await Company.findOne({ recruiterId: existingUser._id });
        if (!comp) {
          comp = await Company.create({
            recruiterId: existingUser._id,
            companyName: companyName?.trim() || `${name.trim()}'s Organization`,
            website: website || '',
            industry: req.body.industry || 'Technology & Software',
            location: req.body.location || 'Bangalore / Pan-India',
            contactPerson: name.trim(),
            contactEmail: email.toLowerCase().trim(),
            approvalStatus: 'APPROVED',
          });
        } else {
          if (companyName) comp.companyName = companyName.trim();
          if (website) comp.website = website.trim();
          await comp.save();
        }

        const token = generateToken(existingUser);
        res.status(200).json({
          success: true,
          message: 'Recruiter profile updated successfully.',
          token,
          user: {
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
            company: comp,
          },
        });
        return;
      }

      if (role === 'ADMIN') {
        existingUser.name = name.trim();
        if (password) existingUser.passwordHash = await bcrypt.hash(password, 10);
        await existingUser.save();

        const token = generateToken(existingUser);
        res.status(200).json({
          success: true,
          message: 'Admin profile updated successfully.',
          token,
          user: {
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
          },
        });
        return;
      }

      res.status(409).json({ success: false, message: 'An account with this email address already exists. Please log in.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role as UserRole,
    });

    let profile: any = null;
    let company: any = null;

    if (role === 'STUDENT') {
      const skillsArray = Array.isArray(skills)
        ? skills
        : typeof skills === 'string'
        ? skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        : ['Full-Stack', 'Data Structures', 'Python'];

      profile = await StudentProfile.create({
        userId: user._id,
        registrationNumber: registrationNumber?.trim() || `REG${Date.now().toString().slice(-6)}`,
        branch: branch || 'CSE',
        cgpa: typeof cgpa === 'number' ? cgpa : parseFloat(cgpa) || 8.2,
        graduationYear: graduationYear ? parseInt(graduationYear.toString(), 10) : 2026,
        resumeLink: resumeLink || '',
        phone: phone || '',
        skills: skillsArray.length > 0 ? skillsArray : ['Data Structures', 'Web Development'],
        hasActiveBacklogs: false,
      });

      // Safely transfer seed applications from template student (Rohan Sharma) to this student without duplicate key error
      const templateStudent = await User.findOne({ email: 'rohan.sharma@nit.ac.in' });
      if (templateStudent && templateStudent._id.toString() !== user._id.toString()) {
        const templateApps = await Application.find({ studentId: templateStudent._id });
        for (const app of templateApps) {
          const alreadyExists = await Application.findOne({ studentId: user._id, jobId: app.jobId });
          if (!alreadyExists) {
            app.studentId = user._id;
            await app.save();
          }
        }
        // Remove Rohan Sharma template user and profile so they never appear again
        await StudentProfile.deleteOne({ userId: templateStudent._id });
        await User.deleteOne({ _id: templateStudent._id });
      }

      latestActiveStudentEmail = user.email;
    } else if (role === 'RECRUITER') {
      company = await Company.create({
        recruiterId: user._id,
        companyName: companyName?.trim() || `${name.trim()}'s Organization`,
        website: website || '',
        industry: req.body.industry || 'Technology & Software',
        location: req.body.location || 'Bangalore / Pan-India',
        contactPerson: name.trim(),
        contactEmail: email.toLowerCase().trim(),
        approvalStatus: 'APPROVED', // auto-approved for recruiter entrance convenience
      });

      // Create an initial job for this new company so recruiter immediately has an active hiring opening
      try {
        const initialJob = await Job.create({
          companyId: company._id,
          recruiterId: user._id,
          title: 'Software Development Engineer / Analyst',
          jobType: 'Full Time',
          tier: 'Dream Tier',
          stipendOrCTC: '₹18.0 LPA',
          description: `Direct on-campus placement opportunity at ${company.companyName}.`,
          responsibilities: [
            'Design and develop high-throughput components and microservices.',
            'Collaborate with product and operations teams to deliver features.',
          ],
          location: company.location || 'Bangalore (Hybrid)',
          minimumCGPA: 7.5,
          allowedDepartments: ['CSE', 'IT', 'ECE'],
          allowedGraduationYears: [2026],
          requiredSkills: ['Problem Solving', 'Data Structures', 'Web Architecture'],
          openings: 5,
          applicationDeadline: new Date('2026-11-30T23:59:59.000Z'),
          assessmentDetails: 'Technical Evaluation + Managerial Interview',
          driveType: 'On-Campus Direct',
          approvalStatus: 'APPROVED',
        });

        // Link the active single student to this job with status SHORTLISTED
        const activeStudent = await User.findOne({ role: 'STUDENT' });
        if (activeStudent) {
          await Application.create({
            studentId: activeStudent._id,
            jobId: initialJob._id,
            companyId: company._id,
            status: 'SHORTLISTED',
            appliedAt: new Date(),
            statusHistory: [
              {
                status: 'APPLIED',
                remarks: 'Application submitted for campus drive.',
                changedAt: new Date(),
                changedBy: 'Candidate',
              },
              {
                status: 'SHORTLISTED',
                remarks: `Profile reviewed by ${name.trim()} and shortlisted for technical interview rounds.`,
                changedAt: new Date(),
                changedBy: `${name.trim()} (Recruiter)`,
              },
            ],
          });
        }
      } catch (e) {
        console.warn('Initial job creation for new recruiter skipped:', e);
      }
    }

    const token = generateToken(user);
    res.status(201).json({
      success: true,
      message: `${role} account registered successfully.`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile,
        company,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: `Server error during registration: ${error?.message || 'Please try again.'}` });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user);

    let profile = null;
    let company = null;

    if (user.role === 'STUDENT') {
      profile = await StudentProfile.findOne({ userId: user._id });
    } else if (user.role === 'RECRUITER') {
      company = await Company.findOne({ recruiterId: user._id });
    }

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile,
        company,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login. Please try again.' });
  }
});

// POST /api/auth/quick-switch (Seamless switching between Student, Recruiter companies, and Admin)
router.post('/quick-switch', async (req, res): Promise<void> => {
  try {
    const { role, email: customEmail, companyId } = req.body;
    let email = customEmail || '';

    if (!email) {
      if (role === 'STUDENT') {
        if (!email && latestActiveStudentEmail) {
          const latestUser = await User.findOne({ email: latestActiveStudentEmail, role: 'STUDENT' });
          if (latestUser) email = latestUser.email;
        }
        if (!email) {
          // Find the active student registered/stored in the system (avoiding old template Rohan Sharma)
          const student = await User.findOne({ role: 'STUDENT', email: { $ne: 'rohan.sharma@nit.ac.in' } }).sort({ updatedAt: -1, createdAt: -1 });
          if (student) {
            email = student.email;
          } else {
            const anyStudent = await User.findOne({ role: 'STUDENT' });
            if (anyStudent) email = anyStudent.email;
          }
        }
      } else if (role === 'RECRUITER') {
        if (companyId) {
          const comp = await Company.findById(companyId);
          if (comp && comp.recruiterId) {
            const recruiterUser = await User.findById(comp.recruiterId);
            if (recruiterUser) email = recruiterUser.email;
          }
        }
        if (!email) {
          // Default to first approved company recruiter
          const defaultRecruiter = await User.findOne({ role: 'RECRUITER' });
          email = defaultRecruiter ? defaultRecruiter.email : 'recruiter.google@campus.com';
        }
      } else if (role === 'ADMIN') {
        email = 'admin@nit.ac.in';
      } else {
        res.status(400).json({ success: false, message: 'Invalid role requested.' });
        return;
      }
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ success: false, message: `Account for ${email} not found.` });
      return;
    }

    const token = generateToken(user);
    let profile = null;
    let company = null;

    if (user.role === 'STUDENT') {
      profile = await StudentProfile.findOne({ userId: user._id });
    } else if (user.role === 'RECRUITER') {
      company = await Company.findOne({ recruiterId: user._id });
    }

    res.json({
      success: true,
      message: `Switched account: ${user.name} (${user.role}).`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile,
        company,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to switch account.' });
  }
});

// GET /api/auth/companies (PUBLIC: ALL REGISTERED CAMPUS COMPANIES FOR RECRUITER SWITCHING)
router.get('/companies', async (req, res): Promise<void> => {
  try {
    const companies = await Company.find({ approvalStatus: 'APPROVED' }).sort({ createdAt: -1 });
    const companiesWithDetails = await Promise.all(
      companies.map(async (c) => {
        const recruiter = await User.findById(c.recruiterId).select('name email');
        const activeJobsCount = await Job.countDocuments({
          companyId: c._id,
          approvalStatus: 'APPROVED',
        });
        return {
          id: c._id,
          _id: c._id,
          companyName: c.companyName,
          logo: c.logo || '',
          industry: c.industry || 'Technology & Services',
          location: c.location || 'Pan India',
          website: c.website || '',
          recruiterName: recruiter?.name || c.contactPerson || 'Campus Talent Partner',
          recruiterEmail: recruiter?.email || c.contactEmail || '',
          activeJobsCount,
        };
      })
    );

    res.json({ success: true, companies: companiesWithDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve companies.' });
  }
});

// GET /api/auth/recruiters (LIST ALL COMPANY RECRUITERS)
router.get('/recruiters', async (req, res): Promise<void> => {
  try {
    const recruiters = await User.find({ role: 'RECRUITER' });
    const result = await Promise.all(
      recruiters.map(async (r) => {
        const company = await Company.findOne({ recruiterId: r._id });
        return {
          id: r._id,
          name: r.name,
          email: r.email,
          companyName: company?.companyName || 'Corporate Partner',
          companyId: company?._id,
        };
      })
    );
    res.json({ success: true, recruiters: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to list recruiters.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let profile = null;
    let company = null;

    if (user.role === 'STUDENT') {
      profile = await StudentProfile.findOne({ userId: user._id });
    } else if (user.role === 'RECRUITER') {
      company = await Company.findOne({ recruiterId: user._id });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile,
        company,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch current user session.' });
  }
});

export default router;
