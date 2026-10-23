import React from 'react';
import { Activity, ShieldCheck, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-base mb-3">
              <Activity className="w-5 h-5 text-primary-400" aria-hidden="true" />
              <span>CivicPulse AI</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              Intelligent civic complaint intelligence and municipal resolution platform. Built for
              the <em>Build Beyond AI: Engineer Secure, Intelligent and Autonomous Applications</em> competition.
            </p>
            <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                WCAG 2.2 AA Targeted
              </span>
              <span className="flex items-center gap-1">
                <Cpu className="w-4 h-4 text-primary-400" />
                Google Gemini Assisted
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Platform Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li>Citizen Reporting Portal</li>
              <li>Municipal Officer Triage Queue</li>
              <li>Chief Administrator Console</li>
              <li>City-wide Operational Analytics</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Judging Criteria
            </h4>
            <ul className="space-y-2 text-xs">
              <li>1. Code Quality & Modularity</li>
              <li>2. Security & Threat Modeling</li>
              <li>3. Computational Efficiency</li>
              <li>4. Automated Verification Suite</li>
              <li>5. Accessible & Inclusive Design</li>
              <li>6. Civic Problem Alignment</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>© 2026 CivicPulse AI. All civic complaint records securely governed.</div>
          <div className="flex gap-4">
            <span>Serverless Firebase Architecture</span>
            <span>•</span>
            <span>Deterministic Explainable Scoring</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
