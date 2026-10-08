import bcrypt from 'bcryptjs';
import { User } from './models/User.ts';
import { StudentProfile } from './models/StudentProfile.ts';
import { Company } from './models/Company.ts';
import { Job } from './models/Job.ts';
import { Application } from './models/Application.ts';
import { AuditLog } from './models/AuditLog.ts';

export async function seedDatabase(): Promise<void> {
  const existingAdmin = await User.findOne({ role: 'ADMIN' });
  if (existingAdmin) {
    console.log('Database already seeded. Skipping initial seeding.');
    return;
  }

  console.log('Seeding initial campus placement database...');

  // 1. Password Hashes
  const adminPasswordHash = await bcrypt.hash('Admin@2026!', 10);
  const studentPasswordHash = await bcrypt.hash('Student@2026!', 10);
  const recruiterPasswordHash = await bcrypt.hash('Recruiter@2026!', 10);

  // 2. Create Users
  const adminUser = await User.create({
    name: 'Dr. A. K. Sharma',
    email: 'admin@nit.ac.in',
    passwordHash: adminPasswordHash,
    role: 'ADMIN',
  });

  const studentUser1 = await User.create({
    name: 'Rohan Sharma',
    email: 'rohan.sharma@nit.ac.in',
    passwordHash: studentPasswordHash,
    role: 'STUDENT',
  });

  const studentUser2 = await User.create({
    name: 'Ananya Verma',
    email: 'ananya.verma@nit.ac.in',
    passwordHash: studentPasswordHash,
    role: 'STUDENT',
  });

  const studentUser3 = await User.create({
    name: 'Vikram Aditya',
    email: 'vikram.aditya@nit.ac.in',
    passwordHash: studentPasswordHash,
    role: 'STUDENT',
  });

  const recruiterGoogle = await User.create({
    name: 'Priya Nair (Google Campus TA)',
    email: 'recruiter.google@campus.com',
    passwordHash: recruiterPasswordHash,
    role: 'RECRUITER',
  });

  const recruiterMicrosoft = await User.create({
    name: 'Arun Mehta (Microsoft University Relations)',
    email: 'recruiter.ms@campus.com',
    passwordHash: recruiterPasswordHash,
    role: 'RECRUITER',
  });

  const recruiterTCS = await User.create({
    name: 'Suresh Iyer (TCS Early Careers)',
    email: 'recruiter.tcs@campus.com',
    passwordHash: recruiterPasswordHash,
    role: 'RECRUITER',
  });

  const recruiterDeloitte = await User.create({
    name: 'Sneha Kapoor (Deloitte USI Campus Lead)',
    email: 'recruiter.deloitte@campus.com',
    passwordHash: recruiterPasswordHash,
    role: 'RECRUITER',
  });

  const recruiterStartup = await User.create({
    name: 'Karan Gupta (NeuralByte Labs)',
    email: 'recruiter.startup@campus.com',
    passwordHash: recruiterPasswordHash,
    role: 'RECRUITER',
  });

  // 3. Create Student Profiles
  await StudentProfile.create({
    userId: studentUser1._id,
    registrationNumber: '2022CSB1048',
    branch: 'CSE',
    cgpa: 8.42,
    graduationYear: 2026,
    resumeLink: 'https://campus-drive.edu/resumes/2022CSB1048_Rohan_Sharma_v2.4.pdf',
    phone: '+91 98765 43210',
    skills: ['Data Structures', 'C++', 'Python', 'React', 'Node.js', 'Distributed Systems'],
    portfolioLink: 'https://rohansharma.dev',
    githubLink: 'https://github.com/rohan-sharma-cs',
    linkedinLink: 'https://linkedin.com/in/rohan-sharma-nit',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDEZOcJZDPlRhiGZPDEf1dzgKXV8XMIWMbN3aXvnhEPUIbLnlp2oCMD-WX4d4D8bcI0TqqaVJzvWR3pN1poA0qf8PtHh6nbyBgv8TPHoBpujmQKveIG2IdcakFurZH6XdjgxjQRRMIgD5sUIVtY39acPGA7xIJPq2XeQ9leU4FaBcwVGkUFoeiZITgwT00et59hTmfmcBNn6mX_qNLGWvZRuMi2gRIKFqLvcoZJ1QQ',
    placementTierStatus: 'Tier-1 Dream Eligible (No Active Backlogs)',
    hasActiveBacklogs: false,
  });

  await StudentProfile.create({
    userId: studentUser2._id,
    registrationNumber: '2022ITB1012',
    branch: 'IT',
    cgpa: 7.9,
    graduationYear: 2026,
    resumeLink: 'https://campus-drive.edu/resumes/2022ITB1012_Ananya_Verma.pdf',
    phone: '+91 98111 22334',
    skills: ['Java', 'Spring Boot', 'SQL', 'TypeScript', 'AWS'],
    portfolioLink: 'https://ananyaverma.io',
    githubLink: 'https://github.com/ananya-v',
    linkedinLink: 'https://linkedin.com/in/ananya-verma-it',
    placementTierStatus: 'Dream Tier Eligible',
    hasActiveBacklogs: false,
  });

  await StudentProfile.create({
    userId: studentUser3._id,
    registrationNumber: '2023ECB1033',
    branch: 'ECE',
    cgpa: 8.75,
    graduationYear: 2027,
    resumeLink: 'https://campus-drive.edu/resumes/2023ECB1033_Vikram_Aditya.pdf',
    phone: '+91 97234 56789',
    skills: ['Embedded C', 'Python', 'Digital Signal Processing', 'Algorithms', 'Verilog'],
    portfolioLink: 'https://vikramaditya.dev',
    githubLink: 'https://github.com/vikram-aditya',
    linkedinLink: 'https://linkedin.com/in/vikram-aditya-ece',
    placementTierStatus: 'Super Dream Eligible',
    hasActiveBacklogs: false,
  });

  // 4. Create Companies
  const companyGoogle = await Company.create({
    recruiterId: recruiterGoogle._id,
    companyName: 'Google India Private Limited',
    logo: 'https://lh3.googleusercontent.com/aida/AEtjO1VDFf9TisWVpG538qJQuS8LX4FaeKIZbOzIZLH6tqal1C-l8ShkNHTEPY49UvKDy3cVZUEr-aLgxyNDrFJSNGdbLD2Wyn1hQE367wFS6LCLPPah54buTMCoh5yC2CJCz5SaxAXWDQZAO7bq2nCckVrFvICCRKpJIgcCw8cKswnsi5H9Qpja9Y2XvPgIZdESU1Ao7RGzIUg00RjR_ZnAvaAcLytijuYqTMP1H5upA3P9',
    description:
      'Google is a global technology leader focused on building products that organize the world’s information and make it universally accessible and useful.',
    website: 'https://careers.google.com',
    industry: 'Internet / Cloud / AI',
    location: 'Bangalore / Hyderabad',
    contactPerson: 'Priya Nair',
    contactEmail: 'priya.nair@google.com',
    contactPhone: '+91 80 6721 8000',
    approvalStatus: 'APPROVED',
  });

  const companyMicrosoft = await Company.create({
    recruiterId: recruiterMicrosoft._id,
    companyName: 'Microsoft Corporation',
    logo: 'https://lh3.googleusercontent.com/aida/AEtjO1VDFf9TisWVpG538qJQuS8LX4FaeKIZbOzIZLH6tqal1C-l8ShkNHTEPY49UvKDy3cVZUEr-aLgxyNDrFJSNGdbLD2Wyn1hQE367wFS6LCLPPah54buTMCoh5yC2CJCz5SaxAXWDQZAO7bq2nCckVrFvICCRKpJIgcCw8cKswnsi5H9Qpja9Y2XvPgIZdESU1Ao7RGzIUg00RjR_ZnAvaAcLytijuYqTMP1H5upA3P9',
    description:
      'Microsoft empowers every person and every organization on the planet to achieve more across Cloud, Developer Platforms, and Productivity.',
    website: 'https://careers.microsoft.com',
    industry: 'Enterprise Software / Cloud',
    location: 'Hyderabad / Noida / Bangalore',
    contactPerson: 'Arun Mehta',
    contactEmail: 'arun.mehta@microsoft.com',
    contactPhone: '+91 40 6695 0000',
    approvalStatus: 'APPROVED',
  });

  const companyTCS = await Company.create({
    recruiterId: recruiterTCS._id,
    companyName: 'Tata Consultancy Services',
    logo: 'https://lh3.googleusercontent.com/aida/AEtjO1VDFf9TisWVpG538qJQuS8LX4FaeKIZbOzIZLH6tqal1C-l8ShkNHTEPY49UvKDy3cVZUEr-aLgxyNDrFJSNGdbLD2Wyn1hQE367wFS6LCLPPah54buTMCoh5yC2CJCz5SaxAXWDQZAO7bq2nCckVrFvICCRKpJIgcCw8cKswnsi5H9Qpja9Y2XvPgIZdESU1Ao7RGzIUg00RjR_ZnAvaAcLytijuYqTMP1H5upA3P9',
    description:
      'Tata Consultancy Services is an IT services, consulting and business solutions organization that has been partnering with many of the world’s largest businesses.',
    website: 'https://tcs.com/careers',
    industry: 'IT Services & Consulting',
    location: 'Pan India (Mumbai / Pune / Chennai / Delhi)',
    contactPerson: 'Suresh Iyer',
    contactEmail: 'suresh.iyer@tcs.com',
    contactPhone: '+91 22 6778 9999',
    approvalStatus: 'APPROVED',
  });

  const companyDeloitte = await Company.create({
    recruiterId: recruiterDeloitte._id,
    companyName: 'Deloitte USI',
    logo: 'https://lh3.googleusercontent.com/aida/AEtjO1VDFf9TisWVpG538qJQuS8LX4FaeKIZbOzIZLH6tqal1C-l8ShkNHTEPY49UvKDy3cVZUEr-aLgxyNDrFJSNGdbLD2Wyn1hQE367wFS6LCLPPah54buTMCoh5yC2CJCz5SaxAXWDQZAO7bq2nCckVrFvICCRKpJIgcCw8cKswnsi5H9Qpja9Y2XvPgIZdESU1Ao7RGzIUg00RjR_ZnAvaAcLytijuYqTMP1H5upA3P9',
    description:
      'Deloitte provides industry-leading audit, consulting, tax, and advisory services to many of the world’s most admired brands.',
    website: 'https://careers.deloitte.com',
    industry: 'Management & Technology Consulting',
    location: 'Gurgaon / Hyderabad / Bangalore',
    contactPerson: 'Sneha Kapoor',
    contactEmail: 'sneha.kapoor@deloitte.com',
    contactPhone: '+91 124 679 2000',
    approvalStatus: 'APPROVED',
  });

  const companyStartup = await Company.create({
    recruiterId: recruiterStartup._id,
    companyName: 'NeuralByte Labs',
    logo: '',
    description:
      'High-growth AI startup building autonomous multimodal reasoning engines for enterprise data pipelines.',
    website: 'https://neuralbyte.ai',
    industry: 'Artificial Intelligence',
    location: 'Bangalore (Hybrid)',
    contactPerson: 'Karan Gupta',
    contactEmail: 'karan@neuralbyte.ai',
    contactPhone: '+91 98888 77777',
    approvalStatus: 'PENDING',
  });

  // 5. Create Jobs
  const jobGoogle = await Job.create({
    companyId: companyGoogle._id,
    recruiterId: recruiterGoogle._id,
    title: 'Software Engineer Intern (Summer 2027)',
    jobType: 'Internship',
    tier: 'Dream Tier',
    stipendOrCTC: '₹1,10,000 / mo',
    description:
      'As a Software Engineering Intern at Google, you will work on core challenges in distributed systems, search infrastructure, machine intelligence, and web technologies alongside world-class engineering mentors.',
    responsibilities: [
      'Design, develop, test, deploy, and maintain software solutions.',
      'Manage individual project priorities, deadlines, and deliverables.',
      'Collaborate with multi-functional teams across engineering disciplines.',
    ],
    location: 'Bangalore',
    minimumCGPA: 8.0,
    allowedDepartments: ['CSE', 'IT', 'ECE'],
    allowedGraduationYears: [2026, 2027],
    requiredSkills: ['C++', 'Java', 'Python', 'Algorithms', 'Operating Systems'],
    openings: 8,
    applicationDeadline: new Date('2026-10-18T23:59:59.000Z'),
    assessmentDetails: 'Google Online Assessment + 2 Technical Virtual Rounds',
    driveType: 'On-Campus Direct',
    approvalStatus: 'APPROVED',
  });

  const jobMicrosoft = await Job.create({
    companyId: companyMicrosoft._id,
    recruiterId: recruiterMicrosoft._id,
    title: 'Graduate Software Developer (FTE)',
    jobType: 'Full Time',
    tier: 'Super Dream Tier',
    stipendOrCTC: '₹28.5 LPA',
    description:
      'Join Microsoft as a full-time Software Engineer to build scalable cloud architectures, developer tools, AI-infused operating system services, and enterprise security platforms.',
    responsibilities: [
      'Build end-to-end cloud services using Azure microservices architecture.',
      'Write robust, resilient, and performant code in modern languages.',
      'Participate in design reviews, threat modeling, and telemetry analysis.',
    ],
    location: 'Hyderabad / Noida',
    minimumCGPA: 7.5,
    allowedDepartments: ['CSE', 'IT', 'ECE', 'EEE'],
    allowedGraduationYears: [2026],
    requiredSkills: ['C#', 'C++', 'Azure', 'System Design', 'Data Structures'],
    openings: 12,
    applicationDeadline: new Date('2026-10-22T23:59:59.000Z'),
    assessmentDetails: 'Codility Online Test (3 Coding Tasks) + 3 Technical Interviews',
    driveType: 'On-Campus Direct',
    approvalStatus: 'APPROVED',
  });

  const jobTCS = await Job.create({
    companyId: companyTCS._id,
    recruiterId: recruiterTCS._id,
    title: 'Systems Engineer (Digital & Prime Cadre)',
    jobType: 'Full Time',
    tier: 'Mass Hiring Drive',
    stipendOrCTC: '₹7.0 - ₹9.0 LPA',
    description:
      'TCS Prime and Digital cadre offers challenging career opportunities in cutting-edge digital technologies including Cloud, IoT, Big Data, and AI engineering.',
    responsibilities: [
      'Develop client solutions adhering to enterprise architecture standards.',
      'Participate in agile sprints, automation scripting, and system integrations.',
    ],
    location: 'Pan India',
    minimumCGPA: 6.5,
    allowedDepartments: ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'],
    allowedGraduationYears: [2026],
    requiredSkills: ['Programming Fundamentals', 'Database Management', 'Problem Solving'],
    openings: 80,
    applicationDeadline: new Date('2026-10-30T23:59:59.000Z'),
    assessmentDetails: 'NQT National Test + Technical & HR Panel Interview',
    driveType: 'On-Campus Direct',
    approvalStatus: 'APPROVED',
  });

  const jobDeloitte = await Job.create({
    companyId: companyDeloitte._id,
    recruiterId: recruiterDeloitte._id,
    title: 'Analyst - Technology Consulting',
    jobType: 'Full Time',
    tier: 'Dream Tier',
    stipendOrCTC: '₹12.5 LPA',
    description:
      'Technology Consulting Analysts at Deloitte USI partner with global Fortune 500 enterprises to modernize their digital technology landscapes and cloud enterprise architectures.',
    responsibilities: [
      'Synthesize business requirements into technological specifications.',
      'Support cloud transformation implementations and technical quality assurance.',
    ],
    location: 'Gurgaon / Hyderabad',
    minimumCGPA: 7.0,
    allowedDepartments: ['CSE', 'IT', 'ECE'],
    allowedGraduationYears: [2026],
    requiredSkills: ['SQL', 'Cloud Fundamentals', 'Python / Java', 'Analytical Thinking'],
    openings: 25,
    applicationDeadline: new Date('2026-10-15T23:59:59.000Z'),
    assessmentDetails: 'Cognitive & Technical Assessment + Partner Interview',
    driveType: 'On-Campus Direct',
    approvalStatus: 'APPROVED',
  });

  // Pending Job for Admin approval demo
  await Job.create({
    companyId: companyStartup._id,
    recruiterId: recruiterStartup._id,
    title: 'Machine Learning Infrastructure Engineer',
    jobType: 'Full Time',
    tier: 'Dream Tier',
    stipendOrCTC: '₹22.0 LPA',
    description:
      'Work directly with founding team to scale distributed inference clusters and high-throughput GPU serving infrastructure.',
    responsibilities: [
      'Build low-latency model inference pipelines in PyTorch and Triton.',
      'Optimize distributed cache layer and Kubernetes GPU operator nodes.',
    ],
    location: 'Bangalore (Hybrid)',
    minimumCGPA: 8.0,
    allowedDepartments: ['CSE', 'IT'],
    allowedGraduationYears: [2026],
    requiredSkills: ['Python', 'PyTorch', 'Docker', 'Linux Internals', 'CUDA'],
    openings: 3,
    applicationDeadline: new Date('2026-11-15T23:59:59.000Z'),
    assessmentDetails: 'Take-home Systems Challenge + 2 Technical Deep Dives',
    driveType: 'Campus Fast-Track',
    approvalStatus: 'PENDING',
  });

  // 6. Create Applications (Matching the Stitch UI state!)
  // App 1: Rohan Sharma -> Deloitte USI (SELECTED / Offer Accepted)
  await Application.create({
    studentId: studentUser1._id,
    jobId: jobDeloitte._id,
    companyId: companyDeloitte._id,
    status: 'SELECTED',
    appliedAt: new Date('2026-09-12T10:00:00.000Z'),
    offerLetterRef: 'DEL-USI-2026-CAMPUS-7719',
    statusHistory: [
      {
        status: 'APPLIED',
        remarks: 'Application submitted with verified resume v2.4.',
        changedAt: new Date('2026-09-12T10:00:00.000Z'),
        changedBy: 'Candidate',
      },
      {
        status: 'SHORTLISTED',
        remarks: 'Cleared cognitive and technical assessment.',
        changedAt: new Date('2026-09-20T14:30:00.000Z'),
        changedBy: 'Sneha Kapoor (Deloitte TA)',
      },
      {
        status: 'INTERVIEW',
        remarks: 'Partner interview conducted successfully.',
        changedAt: new Date('2026-09-28T11:00:00.000Z'),
        changedBy: 'Sneha Kapoor (Deloitte TA)',
      },
      {
        status: 'SELECTED',
        remarks: 'Offer released and accepted. Reference DEL-USI-2026-CAMPUS-7719.',
        changedAt: new Date('2026-10-02T16:00:00.000Z'),
        changedBy: 'Deloitte Placement Lead',
      },
    ],
  });

  // App 2: Rohan Sharma -> Google SWE Intern (INTERVIEW stage)
  await Application.create({
    studentId: studentUser1._id,
    jobId: jobGoogle._id,
    companyId: companyGoogle._id,
    status: 'INTERVIEW',
    appliedAt: new Date('2026-10-05T09:30:00.000Z'),
    interviewDate: new Date('2026-10-24T10:00:00.000Z'),
    interviewFormat: 'Google Meet (Technical Round 1 & 2)',
    statusHistory: [
      {
        status: 'APPLIED',
        remarks: 'Application submitted. Verified CGPA 8.42.',
        changedAt: new Date('2026-10-05T09:30:00.000Z'),
        changedBy: 'Candidate',
      },
      {
        status: 'SHORTLISTED',
        remarks: 'Online Coding Assessment cleared with 100% test score.',
        changedAt: new Date('2026-10-10T11:00:00.000Z'),
        changedBy: 'Priya Nair (Google Campus TA)',
      },
      {
        status: 'INTERVIEW',
        remarks: 'Scheduled Technical Interview on Google Meet for Oct 24, 10:00 AM.',
        changedAt: new Date('2026-10-14T09:00:00.000Z'),
        changedBy: 'Priya Nair (Google Campus TA)',
      },
    ],
  });

  // App 3: Rohan Sharma -> Microsoft (SHORTLISTED)
  await Application.create({
    studentId: studentUser1._id,
    jobId: jobMicrosoft._id,
    companyId: companyMicrosoft._id,
    status: 'SHORTLISTED',
    appliedAt: new Date('2026-10-06T14:15:00.000Z'),
    statusHistory: [
      {
        status: 'APPLIED',
        remarks: 'Application submitted for Graduate SWE FTE.',
        changedAt: new Date('2026-10-06T14:15:00.000Z'),
        changedBy: 'Candidate',
      },
      {
        status: 'SHORTLISTED',
        remarks: 'Codility test score in 94th percentile. Shortlisted for Technical Interview rounds.',
        changedAt: new Date('2026-10-12T16:45:00.000Z'),
        changedBy: 'Arun Mehta (Microsoft TA)',
      },
    ],
  });

  // App 4: Rohan Sharma -> TCS (APPLIED)
  await Application.create({
    studentId: studentUser1._id,
    jobId: jobTCS._id,
    companyId: companyTCS._id,
    status: 'APPLIED',
    appliedAt: new Date('2026-10-08T11:20:00.000Z'),
    statusHistory: [
      {
        status: 'APPLIED',
        remarks: 'Registered for NQT National Test drive.',
        changedAt: new Date('2026-10-08T11:20:00.000Z'),
        changedBy: 'Candidate',
      },
    ],
  });

  // Apps from other students for recruiters
  await Application.create({
    studentId: studentUser2._id,
    jobId: jobMicrosoft._id,
    companyId: companyMicrosoft._id,
    status: 'APPLIED',
    appliedAt: new Date('2026-10-07T10:00:00.000Z'),
    statusHistory: [
      {
        status: 'APPLIED',
        remarks: 'Application submitted with IT credentials.',
        changedAt: new Date('2026-10-07T10:00:00.000Z'),
        changedBy: 'Candidate',
      },
    ],
  });

  await Application.create({
    studentId: studentUser3._id,
    jobId: jobGoogle._id,
    companyId: companyGoogle._id,
    status: 'SHORTLISTED',
    appliedAt: new Date('2026-10-04T12:00:00.000Z'),
    statusHistory: [
      {
        status: 'APPLIED',
        remarks: 'ECE Summer 2027 Intern application.',
        changedAt: new Date('2026-10-04T12:00:00.000Z'),
        changedBy: 'Candidate',
      },
      {
        status: 'SHORTLISTED',
        remarks: 'High score in algorithmic test.',
        changedAt: new Date('2026-10-11T15:00:00.000Z'),
        changedBy: 'Priya Nair (Google TA)',
      },
    ],
  });

  // 7. Audit Logs
  await AuditLog.create([
    {
      adminId: adminUser._id,
      adminName: 'Dr. A. K. Sharma',
      action: 'COMPANY_APPROVED',
      entityType: 'Company',
      entityId: companyGoogle._id.toString(),
      entityTitle: 'Google India Private Limited',
      remarks: 'Verified corporate credentials and university MOU.',
      timestamp: new Date('2026-09-01T10:30:00.000Z'),
    },
    {
      adminId: adminUser._id,
      adminName: 'Dr. A. K. Sharma',
      action: 'JOB_APPROVED',
      entityType: 'Job',
      entityId: jobGoogle._id.toString(),
      entityTitle: 'Software Engineer Intern (Summer 2027)',
      remarks: 'Eligibility criteria verified against academic ordinances.',
      timestamp: new Date('2026-09-02T14:15:00.000Z'),
    },
    {
      adminId: adminUser._id,
      adminName: 'Dr. A. K. Sharma',
      action: 'COMPANY_APPROVED',
      entityType: 'Company',
      entityId: companyMicrosoft._id.toString(),
      entityTitle: 'Microsoft Corporation',
      remarks: 'Approved Super Dream tier FTE recruitment drive.',
      timestamp: new Date('2026-09-05T11:00:00.000Z'),
    },
    {
      adminId: adminUser._id,
      adminName: 'Dr. A. K. Sharma',
      action: 'JOB_APPROVED',
      entityType: 'Job',
      entityId: jobMicrosoft._id.toString(),
      entityTitle: 'Graduate Software Developer (FTE)',
      remarks: 'Approved for Batch 2026 circuit branches.',
      timestamp: new Date('2026-09-06T16:20:00.000Z'),
    },
    {
      adminId: adminUser._id,
      adminName: 'Dr. A. K. Sharma',
      action: 'JOB_APPROVED',
      entityType: 'Job',
      entityId: jobDeloitte._id.toString(),
      entityTitle: 'Analyst - Technology Consulting',
      remarks: 'Approved on-campus consulting drive.',
      timestamp: new Date('2026-09-10T09:40:00.000Z'),
    },
  ]);

  console.log('Seeding completed successfully!');
}
