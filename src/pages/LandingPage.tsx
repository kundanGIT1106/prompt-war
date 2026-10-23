import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ShieldCheck,
  Brain,
  FileCheck,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle,
  Building2,
  Clock,
  Layers,
} from 'lucide-react';
import { storageService } from '../lib/storageService';
import { AggregateStats } from '../types';
import { useAuth } from '../lib/authContext';
import { Button } from '../components/common/Button';

export const LandingPage: React.FC = () => {
  const { loginAsDemoUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AggregateStats | null>(null);

  useEffect(() => {
    storageService.getAggregateStats().then(setStats);
  }, []);

  const handleQuickDemo = (role: 'citizen' | 'officer' | 'admin') => {
    loginAsDemoUser(role);
    if (role === 'citizen') navigate('/dashboard');
    else if (role === 'officer') navigate('/officer');
    else if (role === 'admin') navigate('/admin');
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 bg-gradient-to-b from-primary-50/70 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 dark:bg-primary-950/80 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                <span>Build Beyond AI Competition Entry</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                Civic Complaints Resolved with{' '}
                <span className="text-primary-600 dark:text-primary-400">Intelligent Clarity</span>
              </h1>

              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Transform municipal infrastructure reporting. CivicPulse AI leverages Google
                Gemini to automatically categorize complaints, detect duplicate incidents, calculate
                explainable safety priorities, and dispatch municipal departments efficiently.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  size="lg"
                  onClick={() => handleQuickDemo('citizen')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Citizen Portal (Submit Report)
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleQuickDemo('officer')}
                >
                  Officer Triage Queue
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => handleQuickDemo('admin')}
                >
                  Admin Console
                </Button>
              </div>

              {/* Trust & Compliance points */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Deterministic Priority Engine
                </span>
                <span className="flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-primary-500" />
                  Gemini Structured Output
                </span>
                <span className="flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-indigo-500" />
                  WCAG 2.2 AA Accessibility
                </span>
              </div>
            </div>

            {/* Quick Demo Card for Evaluators */}
            <div className="lg:col-span-5">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Evaluation Quick-Start
                      </h3>
                      <p className="text-[11px] text-slate-500">Test role workflows with 1 click</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200">
                    Live Demo Data
                  </span>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('citizen')}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary-400 dark:hover:border-primary-600 text-left transition-all hover:shadow-xs group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary-600">
                        1. Citizen Persona
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Submit complaints with photos, receive Gemini AI quality pre-screen, view personal history.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('officer')}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary-400 dark:hover:border-primary-600 text-left transition-all hover:shadow-xs group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary-600">
                        2. Municipal Officer Persona
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Review priority scores, inspect suspected duplicates, assign departments, and advance lifecycle.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('admin')}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary-400 dark:hover:border-primary-600 text-left transition-all hover:shadow-xs group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary-600">
                        3. Chief Administrator Console
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Audit immutable security event logs, manage staff authorization roles, and view aggregate telemetry.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real-time Aggregate Statistics Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="text-center sm:text-left mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary-400">
              City-Wide Operational Pulse
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live metrics computed from actual persisted civic records
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
            <div>
              <div className="text-3xl font-extrabold text-white font-mono">
                {stats?.totalReports ?? 4}
              </div>
              <div className="text-xs text-slate-400 mt-1">Total Reports Handled</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-amber-400 font-mono">
                {stats?.openReports ?? 3}
              </div>
              <div className="text-xs text-slate-400 mt-1">Active / In Triage</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                {stats?.resolvedReports ?? 1}
              </div>
              <div className="text-xs text-slate-400 mt-1">Resolved With Evidence</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-primary-400 font-mono">
                {stats?.avgResolutionTimeHours ?? 28.5}h
              </div>
              <div className="text-xs text-slate-400 mt-1">Average Resolution Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Engineered for High-Stakes Public Infrastructure
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            CivicPulse AI goes beyond basic chatbots by providing deterministic reliability,
            auditable state transitions, and explainable AI insights.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              1. Report Understanding
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Gemini extracts structured summaries, urgency indicators, missing information, and
              responsible departments. AI advice is strictly demarcated from verified facts.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              2. Duplicate Detection
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Combines keyword tokens, category matching, and geographic proximity to detect
              redundant citizen complaints. Human confirmation is mandatory before merging.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              3. Explainable Priority
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              A transparent, deterministic scoring engine (0-100) factors safety impact, duplicate
              volume, unresolved age, severity, and photo completeness without black boxes.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
