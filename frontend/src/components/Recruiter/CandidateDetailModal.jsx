import React, { useState } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../utils/api';
import { 
  X, CheckCircle, AlertTriangle, Sparkles, Layers, 
  Quote, ShieldAlert, Star, Edit3, Loader2, Award
} from 'lucide-react';

export default function CandidateDetailModal({ candidate, jobId, onClose, onCandidateUpdated }) {
  if (!candidate) return null;

  const [overrideScore, setOverrideScore] = useState(candidate.overall_fit_score || 75);
  const [shortlistStatus, setShortlistStatus] = useState(candidate.shortlisted || false);
  const [reviewNotes, setReviewNotes] = useState(candidate.human_override?.review_notes || '');
  const [savingOverride, setSavingOverride] = useState(false);
  const [overrideSaved, setOverrideSaved] = useState(false);

  const cat = candidate.category_scores || {};

  const handleSaveOverride = async (e) => {
    e.preventDefault();
    setSavingOverride(true);
    try {
      await axios.post(getApiUrl('/api/screening/candidates/override'), {
        candidate_id: candidate.candidate_id,
        job_id: jobId,
        adjusted_score: parseInt(overrideScore),
        shortlist_status: shortlistStatus,
        review_notes: reviewNotes
      });
      setOverrideSaved(true);
      setTimeout(() => setOverrideSaved(false), 2000);
      onCandidateUpdated && onCandidateUpdated();
    } catch (err) {
      console.error("Override save failed:", err);
    } finally {
      setSavingOverride(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl bg-[#0f172a] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-800 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">{candidate.name}</h3>
              {candidate.shortlisted && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  Shortlisted
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{candidate.email} • {candidate.experience_years} years verified experience</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-3xl font-extrabold text-white">{candidate.overall_fit_score}</span>
              <span className="text-xs text-gray-400">/ 100</span>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {/* 8-Dimension Category Breakdown */}
          <div className="p-5 rounded-2xl bg-gray-900 border border-gray-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Multidimensional Evaluation</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-gray-950 border border-gray-800">
                <span className="text-[10px] text-gray-400 block">Required Skills</span>
                <span className="font-bold text-white text-sm">{cat.required_skills || 0} <span className="text-gray-500 text-xs">/ 25</span></span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-950 border border-gray-800">
                <span className="text-[10px] text-gray-400 block">Experience</span>
                <span className="font-bold text-white text-sm">{cat.experience || 0} <span className="text-gray-500 text-xs">/ 15</span></span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-950 border border-gray-800">
                <span className="text-[10px] text-gray-400 block">Project Evidence</span>
                <span className="font-bold text-white text-sm">{cat.projects || 0} <span className="text-gray-500 text-xs">/ 15</span></span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-950 border border-gray-800">
                <span className="text-[10px] text-gray-400 block">Semantic Match</span>
                <span className="font-bold text-white text-sm">{cat.semantic_relevance || 0} <span className="text-gray-500 text-xs">/ 15</span></span>
              </div>
            </div>
          </div>

          {/* Strengths and Missing Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
              <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                <CheckCircle className="w-4 h-4" /> Verified Strengths
              </h5>
              <ul className="space-y-1.5 text-xs text-gray-300">
                {candidate.strengths && candidate.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15">
              <h5 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-4 h-4" /> Missing Role Requirements
              </h5>
              <ul className="space-y-1.5 text-xs text-gray-300">
                {candidate.missing_skills && candidate.missing_skills.length > 0 ? (
                  candidate.missing_skills.map((m, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-400">•</span>
                      <span>{m}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400">All required skills are covered.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Inferred Hidden Skills with Evidence Quotes */}
          {candidate.inferred_skills && candidate.inferred_skills.length > 0 && (
            <div className="p-5 rounded-2xl bg-gray-900 border border-gray-800">
              <h5 className="text-xs font-bold text-white flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Inferred Capabilities Proven in Projects</span>
              </h5>
              <div className="space-y-2">
                {candidate.inferred_skills.slice(0, 3).map((inf, i) => (
                  <div key={i} className="p-3 rounded-xl bg-gray-950 border border-gray-800 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-emerald-300">{inf.skill}</span>
                      <span className="text-[10px] text-gray-500">{Math.round((inf.confidence || 0.9) * 100)}% Confidence</span>
                    </div>
                    {inf.evidence && (
                      <p className="text-gray-400 text-[11px] italic">"{inf.evidence}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Human Recruiter Override & Notes Form */}
          <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30">
            <h5 className="text-xs font-bold text-indigo-300 flex items-center gap-2 mb-3">
              <Edit3 className="w-4 h-4" />
              <span>Human Authority & Recruiter Override (Decision-Support Audit Trail)</span>
            </h5>
            <form onSubmit={handleSaveOverride} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-gray-300 mb-1">Adjust Overall Fit Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={overrideScore}
                    onChange={(e) => setOverrideScore(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-700 text-white font-bold"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="checkbox"
                      checked={shortlistStatus}
                      onChange={(e) => setShortlistStatus(e.target.checked)}
                      className="accent-indigo-500 w-4 h-4"
                    />
                    <span className="font-semibold">Shortlist Candidate</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-xs mb-1">Evaluation & Override Notes (Logged to Audit Trail)</label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Record justification for score override or technical interview feedback..."
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-[11px] text-emerald-400 font-semibold">
                  {overrideSaved && 'Override logged successfully!'}
                </span>
                <button
                  type="submit"
                  disabled={savingOverride}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  {savingOverride ? 'Logging Override...' : 'Save Recruiter Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
