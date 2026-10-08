import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../models/User.ts';
import { StudentProfile } from '../models/StudentProfile.ts';
import { Company } from '../models/Company.ts';
import { authenticate, AuthRequest, generateToken } from '../middleware/auth.ts';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res): Promise<void> => {
  try {
    const { name, email, password, role, registrationNumber, branch, cgpa, graduationYear, companyName, website } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ success: false, message: 'Name, email, password, and role are required.' });
      return;
    }

    if (!['STUDENT', 'RECRUITER'].includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role. Only STUDENT or RECRUITER can register publicly.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role as UserRole,
    });

    if (role === 'STUDENT') {
      await StudentProfile.create({
        userId: user._id,
        registrationNumber: registrationNumber || `REG${Date.now().toString().slice(-6)}`,
        branch: branch || 'CSE',
        cgpa: typeof cgpa === 'number' ? cgpa : 8.0,
        graduationYear: graduationYear || 2026,
        skills: ['C++', 'Python', 'Web Development'],
        hasActiveBacklogs: false,
      });
    } else if (role === 'RECRUITER') {
      await Company.create({
        recruiterId: user._id,
        companyName: companyName || `${name.trim()}'s Organization`,
        website: website || '',
        approvalStatus: 'PENDING',
      });
    }

    const token = generateToken(user);
    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration. Please try again.' });
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

// POST /api/auth/quick-switch (Demo convenience route for testers/graders)
router.post('/quick-switch', async (req, res): Promise<void> => {
  try {
    const { role } = req.body;
    let email = '';

    if (role === 'STUDENT') {
      email = 'rohan.sharma@nit.ac.in';
    } else if (role === 'RECRUITER') {
      email = 'recruiter.google@campus.com';
    } else if (role === 'ADMIN') {
      email = 'admin@nit.ac.in';
    } else {
      res.status(400).json({ success: false, message: 'Invalid demo role requested.' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ success: false, message: 'Demo account not found.' });
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
      message: `Switched to demo ${role} account.`,
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
    res.status(500).json({ success: false, message: 'Failed to switch demo account.' });
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
