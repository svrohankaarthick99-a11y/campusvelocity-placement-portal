import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { AuditLogData } from '../../types.ts';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getAuditLogs({
        action: actionFilter === 'ALL' ? undefined : actionFilter,
        entityType: entityFilter === 'ALL' ? undefined : entityFilter,
        search: search.trim() || undefined,
      });
      if (res.logs) {
        setLogs(res.logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="flex flex-col w-full max-w-[1536px] mx-auto px-6 py-6 gap-6">
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl">policy</span>
            <h1 className="font-headline-lg text-2xl font-bold text-on-surface">
              Administrative Audit Log Register
            </h1>
          </div>
          <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
            Cryptographically sealed and tamper-evident ledger of all administrative decisions, company accreditations, and drive approvals.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search remarks, IDs, or admin names..."
            className="p-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs w-64 focus:outline-none"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-secondary text-white rounded-lg text-xs font-semibold hover:bg-secondary-container"
          >
            Search
          </button>
        </form>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant/40 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-on-surface">Action Filter:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="p-1.5 bg-surface-container-lowest border border-outline-variant rounded"
          >
            <option value="ALL">All Actions</option>
            <option value="COMPANY_APPROVED">COMPANY_APPROVED</option>
            <option value="COMPANY_REJECTED">COMPANY_REJECTED</option>
            <option value="JOB_APPROVED">JOB_APPROVED</option>
            <option value="JOB_REJECTED">JOB_REJECTED</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-on-surface">Entity Type:</span>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="p-1.5 bg-surface-container-lowest border border-outline-variant rounded"
          >
            <option value="ALL">All Entities</option>
            <option value="Company">Company</option>
            <option value="Job">Job Posting</option>
            <option value="Application">Application</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <div className="p-12 text-center bg-surface-container-lowest rounded-xl">
          <span className="material-symbols-outlined text-3xl animate-spin text-secondary">
            progress_activity
          </span>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/50 text-xs text-on-surface-variant">
          No audit entries matching filter criteria.
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/50 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-label-compact uppercase">
              <tr>
                <th className="p-3">Timestamp (ISO)</th>
                <th className="p-3">Reviewer / Admin</th>
                <th className="p-3">Action Recorded</th>
                <th className="p-3">Entity Type</th>
                <th className="p-3">Entity Title / ID</th>
                <th className="p-3">Administrative Remarks &amp; Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {logs.map((log) => {
                const isApproved = log.action.includes('APPROVED');

                return (
                  <tr key={log._id} className="hover:bg-surface-container-low/40">
                    <td className="p-3 font-code-tabular text-on-surface-variant whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="p-3 font-bold text-on-surface">{log.adminName}</td>
                    <td className="p-3">
                      <span
                        className={`font-code-tabular font-bold px-2 py-0.5 rounded text-[11px] whitespace-nowrap ${
                          isApproved
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-error-container text-on-error-container'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-on-surface">{log.entityType}</td>
                    <td className="p-3 font-medium text-on-surface">
                      <div className="flex flex-col">
                        <span>{log.entityTitle}</span>
                        <span className="font-code-tabular text-[10px] text-on-surface-variant">
                          ID: {log.entityId}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-on-surface font-body-sm leading-relaxed max-w-md">
                      {log.remarks}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
