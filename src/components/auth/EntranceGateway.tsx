import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types.ts';

export const EntranceGateway: React.FC = () => {
  const { register, login, quickSwitchRole } = useAuth();

  // Mode: 'role-select' or 'sign-in'
  const [mode, setMode] = useState<'create-profile' | 'sign-in'>('create-profile');
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Common Profile Fields
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('Welcome@123');

  // Student Profile Fields
  const [registrationNumber, setRegistrationNumber] = useState<string>('2024CSB' + Math.floor(1000 + Math.random() * 9000));
  const [branch, setBranch] = useState<string>('CSE');
  const [cgpa, setCgpa] = useState<string>('8.65');
  const [graduationYear, setGraduationYear] = useState<string>('2026');
  const [resumeLink, setResumeLink] = useState<string>('https://drive.google.com/file/d/student-resume-portfolio/view');
  const [skills, setSkills] = useState<string>('React, TypeScript, Python, Data Structures');
  const [phone, setPhone] = useState<string>('+91 98765 43210');

  // Recruiter Profile Fields
  const [companyName, setCompanyName] = useState<string>('Atlassian India');
  const [designation, setDesignation] = useState<string>('Senior Technical Recruiter');
  const [website, setWebsite] = useState<string>('https://atlassian.com/careers');

  // Admin Profile Fields
  const [adminDesignation, setAdminDesignation] = useState<string>('Head of Training & Placement (TPO)');
  const [adminDepartment, setAdminDepartment] = useState<string>('Central Career Development Cell');
  const [adminPasscode, setAdminPasscode] = useState<string>('ADMIN2026');

  // Sign-in Fields
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage(null);

    // Provide friendly defaults tailored to the chosen role if name is empty
    if (!name || name === 'Demo Candidate' || name === 'Campus Recruiter' || name === 'Placement Officer') {
      if (role === 'STUDENT') {
        setName('Kavya Natarajan');
        setEmail('kavya.cs26@nit.ac.in');
      } else if (role === 'RECRUITER') {
        setName('Vikram Mehra');
        setEmail('v.mehra@atlassian.com');
      } else {
        setName('Dr. S. K. Narayanan');
        setEmail('tpo.head@nit.ac.in');
      }
    }
  };

  const handleCreateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      if (!name.trim()) {
        throw new Error('Please enter your full name.');
      }
      if (!email.trim()) {
        throw new Error('Please enter your email address.');
      }

      if (selectedRole === 'STUDENT') {
        const parsedCgpa = parseFloat(cgpa);
        if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10) {
          throw new Error('CGPA must be a valid number between 0.00 and 10.00');
        }

        await register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: 'STUDENT',
          registrationNumber: registrationNumber.trim(),
          branch,
          cgpa: parsedCgpa,
          graduationYear: parseInt(graduationYear, 10),
          resumeLink: resumeLink.trim(),
          skills,
          phone: phone.trim(),
        });
      } else if (selectedRole === 'RECRUITER') {
        if (!companyName.trim()) {
          throw new Error('Company name is required.');
        }

        await register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: 'RECRUITER',
          companyName: companyName.trim(),
          website: website.trim(),
          designation: designation.trim(),
        });
      } else if (selectedRole === 'ADMIN') {
        await register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: 'ADMIN',
          designation: adminDesignation.trim(),
          department: adminDepartment.trim(),
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not complete registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoPreset = async (role: UserRole, demoEmail?: string) => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await quickSwitchRole(role);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to switch demo account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f7fc] via-[#eef3fb] to-[#e6effc] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Banner */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between pb-6 border-b border-outline-variant/40">
        <div className="flex items-center gap-3">
          <img
            alt="Campus Velocity Logo"
            className="h-10 w-auto object-contain drop-shadow-xs"
            src="https://lh3.googleusercontent.com/aida/AEtjO1VDFf9TisWVpG538qJQuS8LX4FaeKIZbOzIZLH6tqal1C-l8ShkNHTEPY49UvKDy3cVZUEr-aLgxyNDrFJSNGdbLD2Wyn1hQE367wFS6LCLPPah54buTMCoh5yC2CJCz5SaxAXWDQZAO7bq2nCckVrFvICCRKpJIgcCw8cKswnsi5H9Qpja9Y2XvPgIZdESU1Ao7RGzIUg00RjR_ZnAvaAcLytijuYqTMP1H5upA3P9"
          />
          <div>
            <h1 className="font-headline-sm text-lg sm:text-xl font-bold text-on-surface tracking-tight leading-tight">
              CampusVelocity
            </h1>
            <p className="font-label-compact text-xs text-on-surface-variant font-medium">
              National Institute of Technology • Central Training &amp; Placement Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'create-profile' ? 'sign-in' : 'create-profile');
              setErrorMessage(null);
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-secondary hover:bg-secondary-fixed/50 transition-colors shadow-xs"
          >
            {mode === 'create-profile' ? 'Sign In with Existing Account' : '← Register New Profile'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full my-6 bg-surface-container-lowest rounded-3xl border border-outline-variant/70 shadow-xl p-6 sm:p-8 md:p-10 transition-all">
        {mode === 'create-profile' ? (
          <div>
            {/* Step 1 Title */}
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold tracking-wide uppercase mb-2">
                <span className="material-symbols-outlined text-sm">badge</span>
                Placement Portal Entry
              </span>
              <h2 className="font-headline-lg text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                Welcome! Choose Your Role to Enter
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed">
                Please select whether you are entering as a <strong>Student Candidate</strong>, <strong>Company Recruiter</strong>, or <strong>Placement Admin</strong>, then provide your profile details below to enter the portal.
              </p>
            </div>

            {/* Step 1: 3 Role Selector Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Student Role Card */}
              <button
                type="button"
                onClick={() => handleRoleSelect('STUDENT')}
                className={`relative text-left p-5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 ${
                  selectedRole === 'STUDENT'
                    ? 'border-secondary bg-blue-50/60 shadow-md ring-2 ring-secondary/20 scale-[1.02]'
                    : 'border-outline-variant/60 bg-surface-container-lowest hover:border-secondary/40 hover:bg-surface-container-low'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      selectedRole === 'STUDENT' ? 'bg-secondary text-white' : 'bg-surface-container text-secondary'
                    }`}>
                      <span className="material-symbols-outlined text-2xl">school</span>
                    </div>
                    {selectedRole === 'STUDENT' && (
                      <span className="material-symbols-outlined text-secondary text-xl">check_circle</span>
                    )}
                  </div>
                  <h3 className="font-headline-sm text-base font-bold text-on-surface">
                    Student Candidate
                  </h3>
                  <p className="text-[11px] text-on-surface-variant mt-1 leading-snug">
                    Browse campus drives, manage your single placement profile, apply with eligibility checks, and attend live interviews.
                  </p>
                </div>
                <div className="pt-2 border-t border-outline-variant/40 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-secondary">Aspirant Portal</span>
                  <span className="text-on-surface-variant">Profile &amp; Drives</span>
                </div>
              </button>

              {/* Recruiter Role Card */}
              <button
                type="button"
                onClick={() => handleRoleSelect('RECRUITER')}
                className={`relative text-left p-5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 ${
                  selectedRole === 'RECRUITER'
                    ? 'border-secondary bg-indigo-50/60 shadow-md ring-2 ring-secondary/20 scale-[1.02]'
                    : 'border-outline-variant/60 bg-surface-container-lowest hover:border-secondary/40 hover:bg-surface-container-low'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      selectedRole === 'RECRUITER' ? 'bg-secondary text-white' : 'bg-surface-container text-secondary'
                    }`}>
                      <span className="material-symbols-outlined text-2xl">business_center</span>
                    </div>
                    {selectedRole === 'RECRUITER' && (
                      <span className="material-symbols-outlined text-secondary text-xl">check_circle</span>
                    )}
                  </div>
                  <h3 className="font-headline-sm text-base font-bold text-on-surface">
                    Company Recruiter
                  </h3>
                  <p className="text-[11px] text-on-surface-variant mt-1 leading-snug">
                    Publish campus job drives, review applicants, evaluate resumes, conduct technical interviews, and release offers.
                  </p>
                </div>
                <div className="pt-2 border-t border-outline-variant/40 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-secondary">Corporate Portal</span>
                  <span className="text-on-surface-variant">Postings &amp; Hiring</span>
                </div>
              </button>

              {/* Admin Role Card */}
              <button
                type="button"
                onClick={() => handleRoleSelect('ADMIN')}
                className={`relative text-left p-5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 ${
                  selectedRole === 'ADMIN'
                    ? 'border-secondary bg-purple-50/60 shadow-md ring-2 ring-secondary/20 scale-[1.02]'
                    : 'border-outline-variant/60 bg-surface-container-lowest hover:border-secondary/40 hover:bg-surface-container-low'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      selectedRole === 'ADMIN' ? 'bg-secondary text-white' : 'bg-surface-container text-secondary'
                    }`}>
                      <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
                    </div>
                    {selectedRole === 'ADMIN' && (
                      <span className="material-symbols-outlined text-secondary text-xl">check_circle</span>
                    )}
                  </div>
                  <h3 className="font-headline-sm text-base font-bold text-on-surface">
                    Placement Cell Admin
                  </h3>
                  <p className="text-[11px] text-on-surface-variant mt-1 leading-snug">
                    Authorize corporate recruiters, approve campus job postings, view student directory, and monitor audit trails.
                  </p>
                </div>
                <div className="pt-2 border-t border-outline-variant/40 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-secondary">Placement Cell (TPO)</span>
                  <span className="text-on-surface-variant">Command &amp; Audit</span>
                </div>
              </button>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-6 p-3.5 rounded-xl bg-error-container/80 border border-error/30 text-on-error-container text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Step 2: Respective Profile Data Form */}
            <form onSubmit={handleCreateProfileSubmit} className="space-y-6">
              <div className="bg-surface-container-low/70 border border-outline-variant/50 rounded-2xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant/40">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">account_circle</span>
                    <h4 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface">
                      {selectedRole === 'STUDENT' && 'Student Profile Data'}
                      {selectedRole === 'RECRUITER' && 'Company Recruiter Profile Data'}
                      {selectedRole === 'ADMIN' && 'Placement Cell Administrator Profile'}
                    </h4>
                  </div>
                  <span className="text-[11px] text-on-surface-variant font-medium">
                    All fields marked * are required
                  </span>
                </div>

                {/* Common Basic Credentials */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={
                        selectedRole === 'STUDENT'
                          ? 'e.g. Kavya Natarajan'
                          : selectedRole === 'RECRUITER'
                          ? 'e.g. Vikram Mehra'
                          : 'e.g. Dr. S. K. Narayanan'
                      }
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      {selectedRole === 'STUDENT'
                        ? 'Student Email *'
                        : selectedRole === 'RECRUITER'
                        ? 'Work Email *'
                        : 'Institutional Email *'}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={
                        selectedRole === 'STUDENT'
                          ? 'kavya.cs26@nit.ac.in'
                          : selectedRole === 'RECRUITER'
                          ? 'v.mehra@atlassian.com'
                          : 'tpo.head@nit.ac.in'
                      }
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Portal Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a secure password"
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  />
                </div>

                {/* Specific Role Inputs */}
                {selectedRole === 'STUDENT' && (
                  <div className="space-y-4 pt-3 border-t border-outline-variant/40">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">
                          Roll / Reg Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={registrationNumber}
                          onChange={(e) => setRegistrationNumber(e.target.value)}
                          placeholder="2024CSB1042"
                          className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs font-code-tabular text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">
                          Branch / Department *
                        </label>
                        <select
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                        >
                          <option value="CSE">CSE (Computer Science)</option>
                          <option value="IT">IT (Information Tech)</option>
                          <option value="ECE">ECE (Electronics &amp; Comm)</option>
                          <option value="EEE">EEE (Electrical &amp; Electronics)</option>
                          <option value="MECH">MECH (Mechanical)</option>
                          <option value="CIVIL">CIVIL (Civil Engg)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">
                          Cumulative CGPA *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          required
                          value={cgpa}
                          onChange={(e) => setCgpa(e.target.value)}
                          placeholder="8.65"
                          className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs font-code-tabular text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                        />
                        <span className="text-[10px] text-on-surface-variant">Out of 10.00</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">
                          Graduation Year *
                        </label>
                        <select
                          value={graduationYear}
                          onChange={(e) => setGraduationYear(e.target.value)}
                          className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                        >
                          <option value="2026">2026 (Final Year)</option>
                          <option value="2027">2027 (Pre-Final Year)</option>
                          <option value="2025">2025 (Graduated)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">
                          Resume Link / Google Drive URL
                        </label>
                        <input
                          type="url"
                          value={resumeLink}
                          onChange={(e) => setResumeLink(e.target.value)}
                          placeholder="https://drive.google.com/..."
                          className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">
                          Contact Phone Number
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">
                        Technical Skills (comma separated)
                      </label>
                      <input
                        type="text"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        placeholder="React, TypeScript, Python, DSA, System Design"
                        className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                      />
                    </div>
                  </div>
                )}

                {selectedRole === 'RECRUITER' && (
                  <div className="space-y-4 pt-3 border-t border-outline-variant/40">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">
                          Company / Organization Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. Atlassian India, Uber, Adobe"
                          className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">
                          Recruiter Designation / Title
                        </label>
                        <input
                          type="text"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          placeholder="e.g. Lead Campus Recruiter"
                          className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">
                          Official Careers Website URL
                        </label>
                        <input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://atlassian.com/careers"
                          className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedRole === 'ADMIN' && (
                  <div className="space-y-4 pt-3 border-t border-outline-variant/40">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">
                          Placement Designation *
                        </label>
                        <input
                          type="text"
                          required
                          value={adminDesignation}
                          onChange={(e) => setAdminDesignation(e.target.value)}
                          placeholder="Head, Training & Placement"
                          className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">
                          Department / Wing
                        </label>
                        <input
                          type="text"
                          value={adminDepartment}
                          onChange={(e) => setAdminDepartment(e.target.value)}
                          placeholder="Career Development Cell"
                          className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">
                          TPO Verification Passcode
                        </label>
                        <input
                          type="text"
                          value={adminPasscode}
                          onChange={(e) => setAdminPasscode(e.target.value)}
                          placeholder="ADMIN2026"
                          className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs font-code-tabular text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-base">security</span>
                  <span>Session will be authenticated for <strong>{selectedRole}</strong> portal access</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-secondary text-white font-bold text-sm hover:bg-secondary-container transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                      <span>Configuring Profile &amp; Entering...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Placement Portal as {selectedRole}</span>
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Demo Evaluation Shortcuts */}
            <div className="mt-10 pt-6 border-t border-outline-variant/40">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                <span className="font-label-compact text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  ⚡ Or Test With Pre-Loaded Campus Profiles:
                </span>
                <span className="text-[11px] text-outline">
                  Instantly loads pre-populated mock drive data
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleDemoPreset('STUDENT')}
                  disabled={submitting}
                  className="p-3 rounded-xl bg-surface-container-low hover:bg-blue-50/80 border border-outline-variant/60 text-left transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-xs text-on-surface group-hover:text-secondary">
                      Student Candidate
                    </div>
                    <div className="text-[11px] text-on-surface-variant">
                      CSE • Verified CGPA • Active Pipeline
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-lg group-hover:translate-x-0.5 transition-transform">
                    login
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoPreset('RECRUITER')}
                  disabled={submitting}
                  className="p-3 rounded-xl bg-surface-container-low hover:bg-indigo-50/80 border border-outline-variant/60 text-left transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-xs text-on-surface group-hover:text-secondary">
                      Google Recruiter
                    </div>
                    <div className="text-[11px] text-on-surface-variant">
                      Tech Talent Lead • 4 Postings
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-lg group-hover:translate-x-0.5 transition-transform">
                    login
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoPreset('ADMIN')}
                  disabled={submitting}
                  className="p-3 rounded-xl bg-surface-container-low hover:bg-purple-50/80 border border-outline-variant/60 text-left transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-xs text-on-surface group-hover:text-secondary">
                      Placement Cell Admin
                    </div>
                    <div className="text-[11px] text-on-surface-variant">
                      TPO Head • Audit Logs &amp; Approvals
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-lg group-hover:translate-x-0.5 transition-transform">
                    login
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Sign In with Existing Account Form */
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold tracking-wide uppercase mb-2">
                <span className="material-symbols-outlined text-sm">lock</span>
                Account Sign In
              </span>
              <h2 className="font-headline-lg text-2xl font-extrabold text-on-surface">
                Sign In to CampusVelocity
              </h2>
              <p className="text-xs text-on-surface-variant mt-1.5">
                Enter your registered placement credentials to access your session.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="student@nit.ac.in or recruiter@campus.com"
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-secondary text-white font-bold text-xs hover:bg-secondary-container transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In &amp; Enter Portal</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-outline-variant/40 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('create-profile');
                  setErrorMessage(null);
                }}
                className="text-xs text-secondary font-bold hover:underline"
              >
                ← Back to Role Selection &amp; Profile Setup
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full pt-4 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between text-[11px] text-on-surface-variant gap-2">
        <p>© 2026 National Institute of Technology • Training &amp; Placement Secretariat</p>
        <div className="flex items-center gap-4">
          <span>Server-Side Eligibility Gating</span>
          <span>•</span>
          <span>Virtual Technical Interviews</span>
          <span>•</span>
          <span>Audit Trail Logging</span>
        </div>
      </footer>
    </div>
  );
};
