import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { StudentProfileData } from '../../types.ts';

export const StudentProfile: React.FC = () => {
  const { user, refreshUser, showToast } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    name: '',
    registrationNumber: '',
    branch: 'CSE',
    cgpa: '8.42',
    graduationYear: '2026',
    resumeLink: '',
    phone: '',
    skills: '',
    portfolioLink: '',
    githubLink: '',
    linkedinLink: '',
    placementTierStatus: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.student.getProfile();
        if (res.profile) {
          const p = res.profile;
          setFormData({
            name: p.name || user?.name || '',
            registrationNumber: p.registrationNumber || '',
            branch: p.branch || 'CSE',
            cgpa: String(p.cgpa || '8.00'),
            graduationYear: String(p.graduationYear || '2026'),
            resumeLink: p.resumeLink || '',
            phone: p.phone || '',
            skills: Array.isArray(p.skills) ? p.skills.join(', ') : '',
            portfolioLink: p.portfolioLink || '',
            githubLink: p.githubLink || '',
            linkedinLink: p.linkedinLink || '',
            placementTierStatus: p.placementTierStatus || '',
          });
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const numCgpa = parseFloat(formData.cgpa);
    if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'CGPA must be a valid number between 0.00 and 10.00.',
      });
      setSaving(false);
      return;
    }

    const skillsArray = formData.skills
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      const res = await api.student.updateProfile({
        name: formData.name,
        registrationNumber: formData.registrationNumber,
        branch: formData.branch,
        cgpa: numCgpa,
        graduationYear: parseInt(formData.graduationYear, 10),
        resumeLink: formData.resumeLink,
        phone: formData.phone,
        skills: skillsArray,
        portfolioLink: formData.portfolioLink,
        githubLink: formData.githubLink,
        linkedinLink: formData.linkedinLink,
      });

      showToast({
        type: 'success',
        title: 'Profile Updated',
        message: res.message || 'Academic credentials saved to university placement records.',
      });

      await refreshUser();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Unable to update profile credentials.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <span className="material-symbols-outlined text-3xl animate-spin text-secondary">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-[1536px] mx-auto px-4 sm:px-6 py-6 gap-6">
      <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">badge</span>
            </div>
            <div>
              <h1 className="font-headline-lg text-2xl font-bold text-on-surface">
                Single Master Placement Profile
              </h1>
              <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                Official institutional student credentials • 1-to-1 mapped to your university roll number
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 self-start md:self-auto">
          <span className="material-symbols-outlined text-base">verified</span>
          <span>Single University Profile Active</span>
        </div>
      </div>

      {/* Info notice about single profile enforcement */}
      <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-start gap-3 text-xs leading-relaxed text-on-surface-variant">
        <span className="material-symbols-outlined text-secondary text-lg shrink-0 mt-0.5">info</span>
        <span>
          <strong>Single Candidate Profile Policy:</strong> In accordance with university placement rules, every student maintains exactly <strong>one authoritative master profile</strong>. When applying to various jobs across different recruiters and partner companies, recruiters review and evaluate this single profile.
        </span>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Academic & Personal Info */}
        <div className="lg:col-span-8 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/60 flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <h2 className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-base">school</span>
              <span>1. Institutional Academic Record</span>
            </h2>
            <span className="text-[11px] text-on-surface-variant font-code-tabular">
              Required for eligibility checks
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-label-compact font-semibold text-on-surface block mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-secondary transition-all"
              />
            </div>

            <div>
              <label className="font-label-compact font-semibold text-on-surface block mb-1">
                Roll Number / Reg No *
              </label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                required
                className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface font-code-tabular font-bold focus:outline-none focus:border-secondary transition-all"
              />
            </div>

            <div>
              <label className="font-label-compact font-semibold text-on-surface block mb-1">
                Academic Department / Branch *
              </label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                required
                className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface font-semibold focus:outline-none focus:border-secondary transition-all"
              >
                <option value="CSE">Computer Science &amp; Engineering (CSE)</option>
                <option value="IT">Information Technology (IT)</option>
                <option value="ECE">Electronics &amp; Communication (ECE)</option>
                <option value="EEE">Electrical &amp; Electronics (EEE)</option>
                <option value="MECH">Mechanical Engineering (MECH)</option>
                <option value="CIVIL">Civil Engineering (CIVIL)</option>
              </select>
            </div>

            <div>
              <label className="font-label-compact font-semibold text-on-surface block mb-1">
                Cumulative CGPA * (0.00 – 10.00)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                name="cgpa"
                value={formData.cgpa}
                onChange={handleChange}
                required
                className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-secondary font-code-tabular font-bold text-sm focus:outline-none focus:border-secondary transition-all"
              />
            </div>

            <div>
              <label className="font-label-compact font-semibold text-on-surface block mb-1">
                Graduation Year / Batch *
              </label>
              <select
                name="graduationYear"
                value={formData.graduationYear}
                onChange={handleChange}
                required
                className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface font-code-tabular font-semibold focus:outline-none focus:border-secondary transition-all"
              >
                <option value="2026">Batch 2026 (Final Year)</option>
                <option value="2027">Batch 2027 (Pre-Final Year)</option>
                <option value="2028">Batch 2028 (Sophomore)</option>
              </select>
            </div>

            <div>
              <label className="font-label-compact font-semibold text-on-surface block mb-1">
                Primary Contact Phone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface font-code-tabular focus:outline-none focus:border-secondary transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3 mt-3">
            <h2 className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-base">link</span>
              <span>2. Verified Resume &amp; Professional Links</span>
            </h2>
            <span className="text-[11px] text-on-surface-variant">Visible to verified recruiters</span>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <div>
              <label className="font-label-compact font-semibold text-on-surface block mb-1">
                Master Resume Link (PDF / Cloud Drive)
              </label>
              <input
                type="url"
                name="resumeLink"
                value={formData.resumeLink}
                onChange={handleChange}
                placeholder="https://drive.google.com/... or https://portfolio.com/resume.pdf"
                className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-secondary transition-all"
              />
              <span className="text-[11px] text-emerald-800 mt-1 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Current status: Verified by University TPO Office
              </span>
            </div>

            <div>
              <label className="font-label-compact font-semibold text-on-surface block mb-1">
                Technical Skills (Comma separated)
              </label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="Data Structures, C++, Python, React, Node.js, Distributed Systems"
                className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-secondary transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-label-compact font-semibold text-on-surface block mb-1">
                  GitHub Profile
                </label>
                <input
                  type="url"
                  name="githubLink"
                  value={formData.githubLink}
                  onChange={handleChange}
                  placeholder="https://github.com/username"
                  className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-secondary transition-all"
                />
              </div>

              <div>
                <label className="font-label-compact font-semibold text-on-surface block mb-1">
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  name="linkedinLink"
                  value={formData.linkedinLink}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-secondary transition-all"
                />
              </div>

              <div>
                <label className="font-label-compact font-semibold text-on-surface block mb-1">
                  Portfolio / Website
                </label>
                <input
                  type="url"
                  name="portfolioLink"
                  value={formData.portfolioLink}
                  onChange={handleChange}
                  placeholder="https://myportfolio.dev"
                  className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-secondary transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-outline-variant/30">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-secondary text-white rounded-xl text-xs font-semibold hover:bg-secondary-container transition-all shadow-sm flex items-center gap-2"
            >
              {saving ? (
                <span>Saving Credentials...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">save</span>
                  <span>Save Master Profile</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Sidebar: Placement Tier & Verification Checklist */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/60 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-xl">verified</span>
              <h3 className="font-headline-sm text-sm font-bold text-on-surface">
                Calculated Placement Tier
              </h3>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 flex flex-col gap-1.5">
              <span className="font-label-compact text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                Current Eligibility Tier
              </span>
              <span className="font-headline-sm text-sm font-bold text-secondary">
                {parseFloat(formData.cgpa) >= 8.5
                  ? 'Super Dream Tier (No Backlogs)'
                  : parseFloat(formData.cgpa) >= 7.5
                  ? 'Tier-1 Dream Eligible (No Backlogs)'
                  : 'Standard Placement Drive'}
              </span>
              <span className="text-xs text-on-surface-variant font-code-tabular mt-0.5">
                Cutoff Score: {formData.cgpa} / 10.00
              </span>
            </div>

            <div className="flex flex-col gap-2.5 pt-2 border-t border-outline-variant/30 text-xs">
              <span className="font-label-compact text-on-surface-variant font-semibold">
                TPO Verification Checklist:
              </span>
              <div className="flex items-center gap-2 text-emerald-800">
                <span className="material-symbols-outlined text-base text-emerald-600">
                  check_circle
                </span>
                <span>Branch accreditation active (NIT Board)</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800">
                <span className="material-symbols-outlined text-base text-emerald-600">
                  check_circle
                </span>
                <span>Zero standing backlogs verified</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800">
                <span className="material-symbols-outlined text-base text-emerald-600">
                  check_circle
                </span>
                <span>Roll number identity authenticated</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800">
                <span className="material-symbols-outlined text-base text-emerald-600">
                  check_circle
                </span>
                <span>Single master profile verified</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
