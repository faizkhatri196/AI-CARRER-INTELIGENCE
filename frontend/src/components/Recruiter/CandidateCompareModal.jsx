import React from 'react';
import { X, Layers, CheckCircle, AlertTriangle, Star } from 'lucide-react';

export default function CandidateCompareModal({ candidates, onClose }) {
  if (!candidates || candidates.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-5xl bg-[#0f172a] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-4 mb-6 border-b border-gray-800">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Multi-Candidate Side-by-Side Comparison</h3>
            <p className="text-xs text-gray-400">Comparing {candidates.length} candidate profiles across multidimensional criteria</p>
          </div>
        </div>

        {/* Comparison Matrix Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {candidates.map((c, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-gray-900 border border-gray-800 flex flex-col justify-between space-y-4">
              <div>
                <div className="pb-3 border-b border-gray-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">Candidate {idx + 1}</span>
                  <h4 className="text-sm font-bold text-white truncate mt-0.5">{c.name}</h4>
                  <span className="text-[11px] text-gray-400 block">{c.experience_years} years experience</span>
                </div>

                {/* Score */}
                <div className="mt-4 p-3 rounded-xl bg-gray-950 border border-gray-800 text-center">
                  <span className="text-2xl font-extrabold text-white block">{c.overall_fit_score}/100</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">{c.recommendation}</span>
                </div>

                {/* Sub-scores */}
                <div className="mt-3 space-y-1.5 text-xs text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-400">ATS Formatting:</span>
                    <span className="font-semibold text-white">{c.ats_score}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Required Skills:</span>
                    <span className="font-semibold text-white">{c.category_scores?.required_skills || 0}/25</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Project Proof:</span>
                    <span className="font-semibold text-white">{c.category_scores?.projects || 0}/15</span>
                  </div>
                </div>

                {/* Skills */}
                <div className="mt-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">Key Verified Skills:</span>
                  <div className="flex flex-wrap gap-1">
                    {c.skills && c.skills.slice(0, 4).map((s, sI) => (
                      <span key={sI} className="bg-gray-800 text-gray-300 text-[10px] px-2 py-0.5 rounded font-mono">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Skills */}
                {c.missing_skills && c.missing_skills.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 block mb-1">Missing Gaps:</span>
                    <div className="flex flex-wrap gap-1">
                      {c.missing_skills.slice(0, 3).map((m, mI) => (
                        <span key={mI} className="bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] px-1.5 py-0.5 rounded">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {c.shortlisted && (
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center text-amber-400 text-xs font-bold flex items-center justify-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>Shortlisted</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

