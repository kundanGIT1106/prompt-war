import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Upload,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileText,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { IssueCategory, IssueUrgency, CivicReport, AIAnalysisResult } from '../../types';
import { sanitizeComplaintText, validateImageUpload } from '../../lib/security';
import { requestAIReportAnalysis } from '../../lib/api';
import { storageService } from '../../lib/storageService';
import { useAuth } from '../../lib/authContext';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';

export const ReportForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('pothole');
  const [urgency, setUrgency] = useState<IssueUrgency>('medium');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AIAnalysisResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);

  // Handle image upload with security checks
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageUpload(file);
    if (!validation.valid) {
      setFormError(validation.error || 'Invalid file.');
      return;
    }

    setFormError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Pre-submission AI Assist: checks category and missing information
  const handlePreCheckWithAI = async () => {
    if (!title.trim() || !description.trim()) {
      setFormError('Please enter a title and description before requesting AI feedback.');
      return;
    }

    setFormError(null);
    setIsAnalyzing(true);
    try {
      const sanitized = sanitizeComplaintText(description);
      if (sanitized.hadSuspiciousPatterns) {
        setSecurityNotice(
          'Security Filter Active: Suspicious instruction patterns were neutralized in your input.'
        );
      }

      const result = await requestAIReportAnalysis({
        title,
        description: sanitized.cleanText,
        category,
        urgency,
        location: { address },
      });

      setAiSuggestions(result);
    } catch {
      setFormError('AI assistant is temporarily busy. You may proceed with standard submission.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setFormError('You must be signed in to submit a civic report.');
      return;
    }

    if (title.trim().length < 5) {
      setFormError('Issue title must be at least 5 characters.');
      return;
    }
    if (description.trim().length < 20) {
      setFormError('Please provide a detailed description of at least 20 characters.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      // 1. Sanitize text inputs against prompt injection and XSS
      const sanitizedDesc = sanitizeComplaintText(description);
      const sanitizedTitle = sanitizeComplaintText(title);

      // 2. Persist report
      const newReport = await storageService.createReport({
        citizenId: user.uid,
        citizenEmail: user.email,
        citizenName: user.displayName,
        title: sanitizedTitle.cleanText,
        description: sanitizedDesc.cleanText,
        category,
        urgency,
        location: {
          address: address.trim() || 'Central Municipal District',
          landmark: landmark.trim(),
        },
        imageUrl: imagePreview || undefined,
      });

      // 3. Attach AI analysis if available or trigger async background analysis
      if (aiSuggestions) {
        await storageService.attachAIAnalysis(newReport.id, aiSuggestions);
      } else {
        // Trigger server-side analysis
        try {
          const autoAnalysis = await requestAIReportAnalysis({
            title: newReport.title,
            description: newReport.description,
            category: newReport.category,
            urgency: newReport.urgency,
            location: newReport.location,
          });
          await storageService.attachAIAnalysis(newReport.id, autoAnalysis);
        } catch {
          // Non-blocking
        }
      }

      // 4. Redirect to newly created report detail page
      navigate(`/reports/${newReport.id}`);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to submit civic report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {formError && (
        <Alert type="error" title="Submission Error">
          {formError}
        </Alert>
      )}

      {securityNotice && (
        <Alert type="warning" title="Security Warning">
          {securityNotice}
        </Alert>
      )}

      {/* Title */}
      <div>
        <label htmlFor="issue-title" className="block text-sm font-semibold text-slate-900 dark:text-white mb-1">
          Issue Title <span className="text-rose-500">*</span>
        </label>
        <input
          id="issue-title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Hazardous pothole at Lincoln Ave crosswalk"
          maxLength={150}
          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus-visible:outline-primary-600"
        />
        <p className="mt-1 text-xs text-slate-500">Be concise and include specific physical identifier.</p>
      </div>

      {/* Category & Urgency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="issue-category" className="block text-sm font-semibold text-slate-900 dark:text-white mb-1">
            Category <span className="text-rose-500">*</span>
          </label>
          <select
            id="issue-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as IssueCategory)}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus-visible:outline-primary-600 cursor-pointer"
          >
            <option value="pothole">Pothole / Road Surface Damage</option>
            <option value="garbage">Garbage / Illegal Dumping</option>
            <option value="broken_streetlights">Broken Streetlights / Public Lighting</option>
            <option value="water_leakage">Water Main Leakage / Sewage Backup</option>
            <option value="damaged_infrastructure">Damaged Infrastructure / Sidewalks</option>
            <option value="other">Other Public Infrastructure Issue</option>
          </select>
        </div>

        <div>
          <label htmlFor="issue-urgency" className="block text-sm font-semibold text-slate-900 dark:text-white mb-1">
            Citizen Reported Severity <span className="text-rose-500">*</span>
          </label>
          <select
            id="issue-urgency"
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as IssueUrgency)}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus-visible:outline-primary-600 cursor-pointer"
          >
            <option value="low">Low (Cosmetic / routine)</option>
            <option value="medium">Medium (Moderate disruption)</option>
            <option value="high">High (Significant hazard)</option>
            <option value="critical">Critical (Immediate danger to safety)</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="issue-description" className="block text-sm font-semibold text-slate-900 dark:text-white">
            Detailed Description <span className="text-rose-500">*</span>
          </label>
          <span className="text-xs text-slate-400">{description.length} / 2500 chars</span>
        </div>
        <textarea
          id="issue-description"
          rows={4}
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue, estimated dimensions, hazards caused, and how long it has persisted..."
          maxLength={2500}
          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus-visible:outline-primary-600"
        />
      </div>

      {/* Location */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <MapPin className="w-4 h-4 text-primary-600" />
          <span>Location & Landmarks</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="issue-address" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Street Address or Intersection
            </label>
            <input
              id="issue-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 450 Lincoln Ave at 5th St"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
            />
          </div>

          <div>
            <label htmlFor="issue-landmark" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nearest Landmark
            </label>
            <input
              id="issue-landmark"
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. In front of Elementary School gate"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
            />
          </div>
        </div>
      </div>

      {/* Photographic Evidence */}
      <div>
        <label htmlFor="evidence-file" className="block text-sm font-semibold text-slate-900 dark:text-white mb-1">
          Photographic Evidence (Optional)
        </label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer">
            <Upload className="w-4 h-4 text-slate-400" />
            <span>Upload Photo (JPEG, PNG, WebP &le; 5MB)</span>
            <input
              id="evidence-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="sr-only"
            />
          </label>
          {imagePreview && (
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="text-xs text-rose-600 hover:underline cursor-pointer"
            >
              Remove Photo
            </button>
          )}
        </div>

        {imagePreview && (
          <div className="mt-3 w-32 h-32 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            <img src={imagePreview} alt="Preview of uploaded evidence" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Pre-Check with Gemini AI button */}
      <div className="p-4 rounded-xl border border-primary-200 dark:border-primary-900/60 bg-primary-50/50 dark:bg-primary-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <Sparkles className="w-4 h-4 text-primary-600" />
            <span>AI Quality & Completeness Assistant</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Let Gemini inspect your report for missing details before submission.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          isLoading={isAnalyzing}
          onClick={handlePreCheckWithAI}
          leftIcon={<Sparkles className="w-3.5 h-3.5 text-primary-600" />}
        >
          Inspect Report with AI
        </Button>
      </div>

      {/* AI Pre-Check Feedback */}
      {aiSuggestions && (
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-primary-300 dark:border-primary-800 space-y-2 text-xs">
          <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-primary-600">
              <CheckCircle2 className="w-4 h-4" />
              AI Assistant Feedback
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Model: {aiSuggestions.model}</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300">
            <strong>Suggested Category:</strong>{' '}
            <span className="capitalize">{aiSuggestions.suggestedCategory.replace('_', ' ')}</span>{' '}
            {aiSuggestions.suggestedCategory !== category && (
              <button
                type="button"
                onClick={() => setCategory(aiSuggestions.suggestedCategory)}
                className="ml-2 text-primary-600 font-bold hover:underline"
              >
                (Apply suggested category)
              </button>
            )}
          </p>
          {aiSuggestions.missingInformation.length > 0 && (
            <div className="text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded">
              <span className="font-semibold">Helpful info you could add:</span>
              <ul className="list-disc list-inside mt-1">
                {aiSuggestions.missingInformation.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          loadingText="Filing Complaint..."
        >
          Submit Civic Report
        </Button>
      </div>
    </form>
  );
};
