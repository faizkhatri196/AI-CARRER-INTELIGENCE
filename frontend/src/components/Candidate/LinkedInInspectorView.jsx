import React, { useState } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../utils/api';
import { ShieldAlert, CheckCircle2, AlertTriangle, Sparkles, Loader2, ArrowRight } from 'lucide-react';

export default function LinkedInInspectorView({ profile }) {
  const [linkedinText, setLinkedinText] = useState(
    "Headline: Senior Backend Engineer | Python • FastAPI • Distributed Systems\nAbout: 4+ years engineering scalable cloud services, event-driven pipelines, and relational database architectures.\nSkills: Python, FastAPI, Docker, PostgreSQL, Redis, AWS, Microservices"
  );
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInspect = async (e) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(getApiUrl('/api/linkedin/analyze'), {
        user_id: profile.user_id,
        linkedin_text: linkedinText
      });
      setAnalysis(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze LinkedIn profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-6 rounded-2xl bg-[#0f172a] border border-gray-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">LinkedIn Profile Intelligence</h3>
            <p className="text-xs text-gray-400">
              Cross-references your LinkedIn profile against your resume to eliminate inconsistencies and maximize recruiter search indexing.
            </p>
          </div>
        </div>

        <form onSubmit={handleInspect} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Paste LinkedIn Profile Details (Headline, About, Skills, Experience)
            </label>
            <textarea
              rows={4}
              required
              value={linkedinText}
              onChange={(e) => setLinkedinText(e.target.value)}
              placeholder="Paste LinkedIn exported text or summary..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[44px]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Compare LinkedIn with Resume</span>
          </button>
        </form>
      </div>

      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-in fade-in">
          {/* Consistency Score Card */}
          <div className="p-4 sm:p-6 rounded-2xl bg-[#0f172a] border border-gray-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Consistency Score</span>
                <span className="text-2xl font-extrabold text-white">{analysis.profile_consistency_score}/100</span>
              </div>

              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> Detected Inconsistencies & Gaps
              </h4>
              <ul className="space-y-2 text-xs text-gray-300">
                {analysis.discrepancies && analysis.discrepancies.length > 0 ? (
                  analysis.discrepancies.map((d, i) => (
                    <li key={i} className="flex items-start gap-1.5 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                      <span className="text-amber-400 flex-shrink-0">•</span>
                      <span className="break-words">{d}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-emerald-400">Your profile and resume are fully synchronized.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Positioning Recommendations */}
          <div className="p-4 sm:p-6 rounded-2xl bg-[#0f172a] border border-gray-800">
            <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1.5 mb-3">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Executive Positioning Recommendations
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-300">
              {analysis.positioning_recommendations && analysis.positioning_recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 bg-gray-900/60 p-2.5 rounded-xl border border-gray-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                  <span className="break-words">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
