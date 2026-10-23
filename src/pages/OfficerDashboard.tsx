import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Search,
  Filter,
  Layers,
  ArrowUpDown,
  Building2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { CivicReport, ReportStatus, IssueCategory } from '../types';
import { storageService } from '../lib/storageService';
import { useAuth } from '../lib/authContext';
import { StatusBadge, UrgencyBadge, CategoryBadge } from '../components/common/Badge';
import { PriorityScoreBadge } from '../components/reports/PriorityScoreBadge';
import { Button } from '../components/common/Button';

export const OfficerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setLoading(true);
    storageService
      .getReports({
        status: statusFilter === 'all' ? undefined : (statusFilter as ReportStatus),
        category: categoryFilter === 'all' ? undefined : (categoryFilter as IssueCategory),
        department: departmentFilter === 'all' ? undefined : departmentFilter,
        search: searchQuery.trim() || undefined,
      })
      .then((data) => {
        setReports(data);
        setCurrentPage(1);
        setLoading(false);
      });
  }, [statusFilter, categoryFilter, departmentFilter, searchQuery]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(reports.length / itemsPerPage));
  const paginatedReports = reports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Municipal Officer Triage Station
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Authorized officer session: {user?.displayName} • {user?.department || 'Citywide Triage'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">
            Queue: <strong>{reports.length}</strong> complaints
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ID, title, address..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        {/* Status */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted (Needs Triage)</option>
            <option value="under_review">Under Review</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Categories</option>
            <option value="pothole">Potholes</option>
            <option value="water_leakage">Water Leakage</option>
            <option value="broken_streetlights">Broken Streetlights</option>
            <option value="garbage">Garbage / Dumping</option>
            <option value="damaged_infrastructure">Infrastructure</option>
          </select>
        </div>

        {/* Department */}
        <div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Assigned Departments</option>
            <option value="Department of Transportation">Department of Transportation</option>
            <option value="Water Supply & Public Utilities">Water Supply & Public Utilities</option>
            <option value="Electrical & Public Lighting Division">Electrical & Public Lighting</option>
            <option value="Department of Sanitation & Waste Management">Department of Sanitation</option>
          </select>
        </div>
      </div>

      {/* Triage Table */}
      {loading ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading municipal triage queue...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-xs text-slate-500">
          No civic complaints found matching the current filters.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-4 py-3.5">
                    Report ID
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Title & Location
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Priority Score
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Category
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Assigned Dept
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {report.id}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {report.title}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">
                        {report.location.address || 'Address unspecified'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <PriorityScoreBadge priorityScore={report.priorityScore} />
                    </td>
                    <td className="px-4 py-3">
                      <CategoryBadge category={report.category} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={report.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-600 dark:text-slate-300">
                      {report.assignedDepartment ? (
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {report.assignedDepartment}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/reports/${report.id}`}>
                        <Button size="sm" variant="outline">
                          Manage
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
