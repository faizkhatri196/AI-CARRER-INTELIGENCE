import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../utils/api';
import { Compass, TrendingUp, AlertCircle, Loader2, ArrowUpRight, DollarSign } from 'lucide-react';

export default function RoleDiscoveryView({ profile }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile && profile.user_id) {
      fetchRoles();
    }
  }, [profile]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await axios.get(getApiUrl(`/api/candidates/discover-roles/${profile.user_id}`));
      setRoles(res.data.recommended_roles || []);
    } catch (err) {
      console.error("Error discovering roles:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-6 rounded-2xl bg-[#0f172a] border border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Target Role Discovery Engine</h3>
            <p className="text-xs text-gray-400">
              Matched against 2,000 real-time tech job postings based on your verified engineering capabilities.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          <span className="text-sm">Analyzing job market distribution...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((r, i) => (
            <div key={i} className="p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-gray-800 hover:border-blue-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white break-words">{r.role_title}</h4>
                    <span className="text-xs text-gray-400">{r.industry} • Level: {r.experience_level}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xl font-extrabold text-blue-400">{r.match_score}</span>
                    <span className="text-xs text-gray-500 font-semibold block">/ 100</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-gray-300">
                  <span className="text-gray-400">Market Compensation:</span>
                  <span className="font-semibold text-emerald-400">${r.salary_range_usd} USD</span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="text-[11px]">
                    <span className="text-gray-400 font-medium">Verified Skills Present:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.skills_present && r.skills_present.map((s, idx) => (
                        <span key={idx} className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-medium font-mono">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {r.missing_skills && r.missing_skills.length > 0 && (
                    <div className="text-[11px]">
                      <span className="text-gray-400 font-medium">Target Skills to Bridge:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {r.missing_skills.map((s, idx) => (
                          <span key={idx} className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-medium font-mono">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  Transition Effort: <strong className="text-white">{r.transition_difficulty}</strong>
                </span>
                <span className="text-blue-400 font-semibold flex items-center gap-1 cursor-pointer hover:underline py-1">
                  View Roadmap <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
