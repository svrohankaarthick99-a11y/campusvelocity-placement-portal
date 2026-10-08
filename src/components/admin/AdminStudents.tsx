import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';

export const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.admin.getStudents();
        if (res.students) {
          setStudents(res.students);
        }
      } catch (err) {
        console.error('Failed to load students', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const filtered = students.filter((s) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.registrationNumber?.toLowerCase().includes(term) ||
      s.branch?.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex flex-col w-full max-w-[1536px] mx-auto px-6 py-6 gap-6">
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl">school</span>
            <h1 className="font-headline-lg text-2xl font-bold text-on-surface">
              Enrolled Candidate Directory
            </h1>
          </div>
          <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
            Verified academic profiles, standing arrears audits, and placement offer status
          </p>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by name, roll no, or branch..."
          className="p-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs w-full sm:w-64 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="p-12 text-center bg-surface-container-lowest rounded-xl">
          <span className="material-symbols-outlined text-3xl animate-spin text-secondary">
            progress_activity
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/50 text-xs text-on-surface-variant">
          No students match the criteria.
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/50 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-label-compact uppercase">
              <tr>
                <th className="p-3">Student / Email</th>
                <th className="p-3">Roll Number</th>
                <th className="p-3">Branch</th>
                <th className="p-3">CGPA</th>
                <th className="p-3">Batch</th>
                <th className="p-3">Placement Tier</th>
                <th className="p-3">Backlogs</th>
                <th className="p-3">Submissions</th>
                <th className="p-3">Offers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-surface-container-low/40">
                  <td className="p-3 font-semibold text-on-surface">
                    <div className="flex flex-col">
                      <span>{s.name}</span>
                      <span className="text-on-surface-variant text-[11px] font-normal">
                        {s.email}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 font-code-tabular text-on-surface">
                    {s.registrationNumber}
                  </td>
                  <td className="p-3 font-medium text-on-surface">{s.branch}</td>
                  <td className="p-3 font-code-tabular font-bold text-secondary">
                    {s.cgpa?.toFixed(2) || 'N/A'}
                  </td>
                  <td className="p-3 font-code-tabular text-on-surface-variant">
                    {s.graduationYear}
                  </td>
                  <td className="p-3 text-[11px] font-semibold text-on-surface">
                    {s.placementTierStatus}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        s.hasActiveBacklogs
                          ? 'bg-error-container text-on-error-container'
                          : 'bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      {s.hasActiveBacklogs ? 'Standing Arrears' : 'Clear (0)'}
                    </span>
                  </td>
                  <td className="p-3 font-code-tabular text-on-surface">
                    {s.applicationsCount || 0}
                  </td>
                  <td className="p-3 font-code-tabular font-bold text-emerald-800">
                    {s.offersCount || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
