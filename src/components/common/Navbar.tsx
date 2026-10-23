import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  Activity,
  PlusCircle,
  BarChart3,
  Users,
  LogOut,
  Menu,
  X,
  User,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { UserRole } from '../../types';

export const Navbar: React.FC = () => {
  const { user, logout, loginAsDemoUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleRoleSwitch = (role: UserRole) => {
    loginAsDemoUser(role);
    setRoleSwitcherOpen(false);
    if (role === 'citizen') navigate('/dashboard');
    else if (role === 'officer') navigate('/officer');
    else if (role === 'admin') navigate('/admin');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-lg tracking-tight hover:opacity-90"
              aria-label="CivicPulse AI Home"
            >
              <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-sm">
                <Activity className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="leading-tight flex items-center gap-1.5">
                  CivicPulse <span className="text-primary-600 text-xs px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-950/80 font-semibold border border-primary-200 dark:border-primary-800">AI</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                  Municipal Intelligence System
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
              {user?.role === 'citizen' && (
                <>
                  <Link
                    to="/dashboard"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/dashboard')
                        ? 'text-primary-600 bg-primary-50 dark:bg-primary-950/40 dark:text-primary-400 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    My Reports
                  </Link>
                  <Link
                    to="/reports/new"
                    className="inline-flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4" aria-hidden="true" />
                    <span>Report Issue</span>
                  </Link>
                </>
              )}

              {user?.role === 'officer' && (
                <>
                  <Link
                    to="/officer"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/officer')
                        ? 'text-primary-600 bg-primary-50 dark:bg-primary-950/40 dark:text-primary-400 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    Officer Dashboard
                  </Link>
                  <Link
                    to="/officer/reports"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/officer/reports')
                        ? 'text-primary-600 bg-primary-50 dark:bg-primary-950/40 dark:text-primary-400 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    Triage Queue
                  </Link>
                </>
              )}

              {user?.role === 'admin' && (
                <>
                  <Link
                    to="/admin"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/admin')
                        ? 'text-primary-600 bg-primary-50 dark:bg-primary-950/40 dark:text-primary-400 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    Admin Console
                  </Link>
                </>
              )}

              <Link
                to="/analytics"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/analytics')
                    ? 'text-primary-600 bg-primary-50 dark:bg-primary-950/40 dark:text-primary-400 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                Civic Analytics
              </Link>
            </nav>
          </div>

          {/* Right Controls */}
          <div className="hidden md:flex items-center gap-3">
            {/* Quick Demo Role Switcher for Judges & Reviewers */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
                aria-expanded={roleSwitcherOpen}
                aria-haspopup="true"
                aria-label="Switch User Demonstration Role"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary-500" aria-hidden="true" />
                <span className="capitalize">{user?.role || 'Guest'} Role</span>
              </button>

              {roleSwitcherOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50">
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Judging & Testing Roles
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch('citizen')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer ${
                      user?.role === 'citizen' ? 'font-bold text-primary-600' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span>Citizen (John Doe)</span>
                    {user?.role === 'citizen' && <span className="text-[10px] bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded">Active</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch('officer')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer ${
                      user?.role === 'officer' ? 'font-bold text-primary-600' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span>Officer (Sarah Connor)</span>
                    {user?.role === 'officer' && <span className="text-[10px] bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded">Active</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch('admin')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer ${
                      user?.role === 'admin' ? 'font-bold text-primary-600' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span>Administrator (Elizabeth Stone)</span>
                    {user?.role === 'admin' && <span className="text-[10px] bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded">Active</span>}
                  </button>
                </div>
              )}
            </div>

            {/* User status */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {user.displayName}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                    {user.role} {user.department ? `• ${user.department}` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  aria-label="Sign out"
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-300 cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 px-4 pt-2 pb-4 space-y-2 bg-white dark:bg-slate-900">
          <Link
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50"
          >
            My Reports
          </Link>
          <Link
            to="/reports/new"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm font-medium text-primary-600 font-semibold"
          >
            + Report Civic Issue
          </Link>
          <Link
            to="/officer"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Officer Portal
          </Link>
          <Link
            to="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Admin Console
          </Link>
          <Link
            to="/analytics"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Analytics
          </Link>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-500 mb-2">Switch Demo Persona:</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  handleRoleSwitch('citizen');
                  setMobileMenuOpen(false);
                }}
                className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800"
              >
                Citizen
              </button>
              <button
                type="button"
                onClick={() => {
                  handleRoleSwitch('officer');
                  setMobileMenuOpen(false);
                }}
                className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800"
              >
                Officer
              </button>
              <button
                type="button"
                onClick={() => {
                  handleRoleSwitch('admin');
                  setMobileMenuOpen(false);
                }}
                className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
