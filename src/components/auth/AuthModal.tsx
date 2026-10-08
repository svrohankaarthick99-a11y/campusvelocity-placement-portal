import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';

export const AuthModal: React.FC = () => {
  const { showAuthModal, setShowAuthModal, login, register, quickSwitchRole } = useAuth();
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [role, setRole] = useState<'STUDENT' | 'RECRUITER'>('STUDENT');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form fields
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [registrationNumber, setRegistrationNumber] = useState<string>('');
  const [branch, setBranch] = useState<string>('CSE');
  const [cgpa, setCgpa] = useState<string>('8.5');
  const [graduationYear, setGraduationYear] = useState<string>('2026');
  const [companyName, setCompanyName] = useState<string>('');
  const [website, setWebsite] = useState<string>('');

  if (!showAuthModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isRegister) {
        await register({
          name,
          email,
          password,
          role,
          registrationNumber,
          branch,
          cgpa: parseFloat(cgpa),
          graduationYear: parseInt(graduationYear, 10),
          companyName,
          website,
        });
      } else {
        await login(email, password);
      }
    } catch (err) {
      // toast shown in context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant flex flex-col gap-4 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
          <div className="flex items-center gap-2">
            <img
              alt="Logo"
              className="h-7 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida/AEtjO1VDFf9TisWVpG538qJQuS8LX4FaeKIZbOzIZLH6tqal1C-l8ShkNHTEPY49UvKDy3cVZUEr-aLgxyNDrFJSNGdbLD2Wyn1hQE367wFS6LCLPPah54buTMCoh5yC2CJCz5SaxAXWDQZAO7bq2nCckVrFvICCRKpJIgcCw8cKswnsi5H9Qpja9Y2XvPgIZdESU1Ao7RGzIUg00RjR_ZnAvaAcLytijuYqTMP1H5upA3P9"
            />
            <div>
              <h2 className="font-headline-md text-base font-bold text-on-surface">
                {isRegister ? 'Register Portal Account' : 'Sign In to CampusVelocity'}
              </h2>
              <span className="font-label-compact text-[11px] text-on-surface-variant">
                Career Development &amp; Placement Cell • NIT
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAuthModal(false)}
            className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Quick Demo Switcher Buttons */}
        <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2">
          <span className="font-label-compact text-[11px] font-semibold text-on-surface-variant uppercase">
            ⚡ Quick Demo Evaluation Logins:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={async () => {
                await quickSwitchRole('STUDENT');
                setShowAuthModal(false);
              }}
              className="p-2 rounded bg-surface-container-lowest hover:bg-secondary-fixed text-on-surface border border-outline-variant text-center font-semibold"
            >
              Demo Student
            </button>
            <button
              type="button"
              onClick={async () => {
                await quickSwitchRole('RECRUITER');
                setShowAuthModal(false);
              }}
              className="p-2 rounded bg-surface-container-lowest hover:bg-secondary-fixed text-on-surface border border-outline-variant text-center font-semibold"
            >
              Demo Recruiter
            </button>
            <button
              type="button"
              onClick={async () => {
                await quickSwitchRole('ADMIN');
                setShowAuthModal(false);
              }}
              className="p-2 rounded bg-surface-container-lowest hover:bg-secondary-fixed text-on-surface border border-outline-variant text-center font-semibold"
            >
              Demo Admin
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {isRegister && (
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-on-surface">Select Account Role *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('STUDENT')}
                  className={`p-2 rounded font-semibold border ${
                    role === 'STUDENT'
                      ? 'bg-secondary text-white border-secondary'
                      : 'bg-surface-container-low text-on-surface border-outline-variant'
                  }`}
                >
                  Student Aspirant
                </button>
                <button
                  type="button"
                  onClick={() => setRole('RECRUITER')}
                  className={`p-2 rounded font-semibold border ${
                    role === 'RECRUITER'
                      ? 'bg-secondary text-white border-secondary'
                      : 'bg-surface-container-low text-on-surface border-outline-variant'
                  }`}
                >
                  Company Recruiter
                </button>
              </div>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="font-semibold block mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Verma"
                className="w-full p-2 bg-surface-container-low border border-outline-variant rounded text-on-surface"
              />
            </div>
          )}

          <div>
            <label className="font-semibold block mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@nit.ac.in"
              className="w-full p-2 bg-surface-container-low border border-outline-variant rounded text-on-surface"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Password *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2 bg-surface-container-low border border-outline-variant rounded text-on-surface"
            />
          </div>

          {/* Registration specific fields */}
          {isRegister && role === 'STUDENT' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold block mb-1">Roll / Reg Number</label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="2022CSB1099"
                  className="w-full p-2 bg-surface-container-low border border-outline-variant rounded text-on-surface font-code-tabular"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Department</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full p-2 bg-surface-container-low border border-outline-variant rounded text-on-surface"
                >
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Cumulative CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  className="w-full p-2 bg-surface-container-low border border-outline-variant rounded text-on-surface font-code-tabular"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Graduation Batch</label>
                <input
                  type="number"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="w-full p-2 bg-surface-container-low border border-outline-variant rounded text-on-surface font-code-tabular"
                />
              </div>
            </div>
          )}

          {isRegister && role === 'RECRUITER' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold block mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Technologies"
                  className="w-full p-2 bg-surface-container-low border border-outline-variant rounded text-on-surface"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Official Website</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://acme.com"
                  className="w-full p-2 bg-surface-container-low border border-outline-variant rounded text-on-surface"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded bg-secondary text-white font-semibold hover:bg-secondary-container transition-colors mt-2"
          >
            {submitting ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-outline-variant/30">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-secondary hover:underline font-semibold"
          >
            {isRegister
              ? 'Already registered? Sign in with existing credentials'
              : 'New student or company? Register here'}
          </button>
        </div>
      </div>
    </div>
  );
};
