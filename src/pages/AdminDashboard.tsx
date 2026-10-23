import React, { useEffect, useState } from 'react';
import {
  Users,
  ShieldCheck,
  FileText,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Building,
  Activity,
  UserPlus,
} from 'lucide-react';
import { storageService } from '../lib/storageService';
import { AggregateStats, AuditLogEntry, UserProfile, UserRole } from '../types';
import { useAuth } from '../lib/authContext';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';

export const AdminDashboard: React.FC = () => {
  const { user, allUsers, updateStaffRole } = useAuth();
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleMessage, setRoleMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [s, logs] = await Promise.all([
      storageService.getAggregateStats(),
      storageService.getAuditLogs(),
    ]);
    setStats(s);
    setAuditLogs(logs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = async (targetUid: string, newRole: UserRole) => {
    setRoleMessage(null);
    const res = await updateStaffRole(targetUid, newRole);
    if (res.success) {
      setRoleMessage({ type: 'success', text: `User role successfully updated to ${newRole}.` });
      loadData();
    } else {
      setRoleMessage({ type: 'error', text: res.error || 'Failed to update role.' });
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset all civic complaints to default demonstration seed?')) {
      storageService.resetAllData();
      loadData();
      setRoleMessage({ type: 'success', text: 'Demonstration records reset successfully.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Municipal Chief Administrator Console
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            System Administration • Role Governance • Immutable Audit Trails
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleResetData}
          leftIcon={<RotateCcw className="w-4 h-4 text-slate-500" />}
        >
          Reset Demo Data
        </Button>
      </div>

      {roleMessage && (
        <Alert type={roleMessage.type === 'success' ? 'success' : 'error'}>
          {roleMessage.text}
        </Alert>
      )}

      {/* Aggregate Statistics Overview */}
      <section aria-labelledby="stats-heading" className="space-y-3">
        <h2 id="stats-heading" className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Citywide Persisted Statistics
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-xs text-slate-500">Total Registered Reports</span>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {stats?.totalReports ?? 0}
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-xs text-slate-500">Pending Resolution</span>
            <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
              {stats?.openReports ?? 0}
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-xs text-slate-500">Successfully Resolved</span>
            <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
              {stats?.resolvedReports ?? 0}
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-xs text-slate-500">Avg Resolution Speed</span>
            <div className="text-2xl font-bold font-mono text-primary-600 mt-1">
              {stats?.avgResolutionTimeHours ?? 24} hrs
            </div>
          </div>
        </div>
      </section>

      {/* Staff Role Management (Privilege Escalation Defense) */}
      <section aria-labelledby="staff-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="staff-heading" className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Staff Role Delegation (Privilege Governance)
            </h2>
            <p className="text-xs text-slate-500">
              Protected administrative operation: Only administrators can assign officer roles.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 font-semibold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-4 py-3">
                  User Name
                </th>
                <th scope="col" className="px-4 py-3">
                  Email
                </th>
                <th scope="col" className="px-4 py-3">
                  Current Role
                </th>
                <th scope="col" className="px-4 py-3">
                  Department
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Alter Role
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {allUsers.map((u) => (
                <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {u.displayName}
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{u.email}</td>
                  <td className="px-4 py-3 capitalize font-bold text-primary-600">{u.role}</td>
                  <td className="px-4 py-3 text-slate-500">{u.department || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                      className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer"
                    >
                      <option value="citizen">Citizen</option>
                      <option value="officer">Officer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Audit Log Review */}
      <section aria-labelledby="audit-heading" className="space-y-4">
        <div>
          <h2 id="audit-heading" className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Immutable Security & Operational Audit Log
          </h2>
          <p className="text-xs text-slate-500">
            Append-only security log recording status transitions, department assignments, and merges
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">
                      {log.action}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Target: {log.targetId}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    By: {log.performedByName} ({log.performedByRole})
                  </div>
                </div>

                <time
                  dateTime={log.timestamp}
                  className="text-[11px] text-slate-400 font-mono shrink-0"
                >
                  {new Date(log.timestamp).toLocaleString()}
                </time>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
