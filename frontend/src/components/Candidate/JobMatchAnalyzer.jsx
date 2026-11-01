import React, { useState } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../utils/api';
import { Target, CheckCircle, AlertTriangle, Loader2, Sparkles, ArrowRight } from 'lucide-react';

export default function JobMatchAnalyzer({ profile }) {
  const [jobTitle, setJobTitle] = useState('Senior Backend Engineer');
  const [jobDesc, setJobDesc] = useState(
    'We are seeking a Backend Engineer with strong expertise in Python, FastAPI, PostgreSQL, Docker, AWS, and REST APIs. Experience building scalable microservices and automated testing with Pytest is required.'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(getApiUrl('/api/candidates/analyze-job-match'), {
        user_id: profile.user_id,
        job_title: jobTitle,
        job_description: jobDesc
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze job match.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-6 rounded-2xl bg-[#0f172a] border border-gray-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Specific Job Match Analyzer</h3>
            <p className="text-xs text-gray-400">
              Paste any target job description to evaluate your exact multidimensional fit and discover missing skills.
            </p>
          </div>
        </div>

        <form onSubmit={handleAnalyze} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Target Job Title</label>
            <input
              type="text"
              required
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white focus:outline-none focus:border-purple-500 min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Target Job Description & Requirements</label>
            <textarea
              rows={4}
              required
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[44px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Evaluating Against Rubric...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Calculate Job Fit Match</span>
              </>
            )}
          </button>
        </form>
      </div>

      {result && (
        <div className="p-4 sm:p-6 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-800 gap-3">
            <div>
              <span className="text-xs font-semibold text-gray-400">Target Match Result</span>
              <h4 className="text-lg sm:text-xl font-bold text-white mt-0.5 break-words">{jobTitle}</h4>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                {result.recommendation}
              </span>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">{result.overall_fit_score}</span>
                <span className="text-xs text-gray-400">/ 100</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
              <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" /> Verified Strengths for This Role
              </h5>
              <ul className="space-y-1.5 text-xs text-gray-300">
                {result.strengths && result.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 flex-shrink-0">•</span>
                    <span className="break-words">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <h5 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> Missing Mandatory Requirements
              </h5>
              <ul className="space-y-1.5 text-xs text-gray-300">
                {result.missing_requirements && result.missing_requirements.length > 0 ? (
                  result.missing_requirements.map((m, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-400 flex-shrink-0">•</span>
                      <span className="break-words">{m}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400">All primary technical requirements are covered.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
