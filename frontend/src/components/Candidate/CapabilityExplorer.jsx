import React, { useState } from 'react';
import { 
  Zap, ArrowRight, ShieldCheck, HelpCircle, 
  Layers, CheckCircle2, Quote, Sparkles
} from 'lucide-react';

export default function CapabilityExplorer({ profile }) {
  if (!profile) return null;

  const [activeFilter, setActiveFilter] = useState('all');

  const explicit = profile.skills || [];
  const inferred = profile.inferred_skills || [];
  const transferable = profile.transferable_skills || [];

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-gray-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-white">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Hidden & Transferable Talent Engine</h3>
            <p className="text-xs text-gray-400">
              Unlike traditional keyword-match ATS filters, this engine identifies verified engineering capabilities from project implementation evidence.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-800/80">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            All Capabilities ({explicit.length + inferred.length + transferable.length})
          </button>
          <button
            onClick={() => setActiveFilter('explicit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'explicit'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            Explicit Mentions ({explicit.length})
          </button>
          <button
            onClick={() => setActiveFilter('inferred')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'inferred'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            Inferred with Evidence ({inferred.length})
          </button>
          <button
            onClick={() => setActiveFilter('transferable')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'transferable'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            Transferable Skills ({transferable.length})
          </button>
        </div>
      </div>

      {/* Inferred Hidden Skills Section */}
      {(activeFilter === 'all' || activeFilter === 'inferred') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Inferred Engineering Capabilities (Grounded in Resume Evidence)</span>
            </h4>
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Verified Evidence
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inferred.length > 0 ? (
              inferred.map((inf, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#0f172a] border border-gray-800 hover:border-emerald-500/40 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-white">{inf.skill}</span>
                      <span className="text-[10px] text-gray-400 block capitalize">{inf.category || 'Architecture'}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {Math.round((inf.confidence || 0.9) * 100)}% Conf
                    </span>
                  </div>

                  {inf.evidence && (
                    <div className="mt-3 p-2.5 rounded-lg bg-gray-900/80 border border-gray-800 text-[11px] text-gray-300 italic flex items-start gap-2">
                      <Quote className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
                      <span>"{inf.evidence}"</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 col-span-2 p-4 bg-[#0f172a] rounded-xl border border-gray-800">
                No indirect capabilities inferred yet. Provide rich project outcome bullets to surface inferred engineering competencies.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Transferable Skills Section */}
      {(activeFilter === 'all' || activeFilter === 'transferable') && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Transferable Domain & Architecture Skills</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {transferable.length > 0 ? (
              transferable.map((trans, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#0f172a] border border-gray-800 hover:border-indigo-500/40 transition-colors">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-white">{trans.skill}</span>
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                      Transferable
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {trans.evidence || "Candidate's existing framework foundation transfers directly to this technology with minimal onboarding curve."}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 col-span-2 p-4 bg-[#0f172a] rounded-xl border border-gray-800">
                Candidate explicitly covers primary technologies without requiring transfer mappings.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Explicit Skills Pill Cloud */}
      {(activeFilter === 'all' || activeFilter === 'explicit') && (
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-gray-800">
          <h4 className="text-sm font-bold text-white mb-3">Directly Mentioned Technical Skills ({explicit.length})</h4>
          <div className="flex flex-wrap gap-2">
            {explicit.map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-xl text-xs font-medium bg-gray-900 border border-gray-700/80 text-gray-200 hover:border-blue-500/50 transition-colors"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

