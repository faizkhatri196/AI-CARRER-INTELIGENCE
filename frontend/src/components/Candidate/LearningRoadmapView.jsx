import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../utils/api';
import { Map, Calendar, Target, CheckCircle2, BookOpen, Loader2 } from 'lucide-react';

export default function LearningRoadmapView({ profile }) {
  const [targetLevel, setTargetLevel] = useState(profile?.predicted_level || 'SDE1');
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile && profile.user_id) {
      fetchRoadmap(targetLevel);
    }
  }, [profile]);

  const fetchRoadmap = async (level) => {
    setLoading(true);
    try {
      const res = await axios.post(getApiUrl('/api/candidates/roadmap'), {
        user_id: profile.user_id,
        target_role: profile.recommended_role || 'Backend Engineer',
        target_level: level
      });
      setRoadmap(res.data);
    } catch (err) {
      console.error("Error loading roadmap:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLevelChange = (lvl) => {
    setTargetLevel(lvl);
    fetchRoadmap(lvl);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Map className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Personalized Skill Gap & Career Roadmap</h3>
            <p className="text-xs text-gray-400">
              Target Role: <strong className="text-white">{profile?.recommended_role || 'Software Engineer'}</strong>
            </p>
          </div>
        </div>

        {/* Level Switcher */}
        <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 p-1 rounded-xl">
          {['Intern', 'Fresher', 'SDE1', 'SDE2', 'Senior'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => handleLevelChange(lvl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                targetLevel === lvl
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          <span className="text-sm">Synthesizing personalized learning sequence...</span>
        </div>
      ) : roadmap && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roadmap.phases && roadmap.phases.map((phase, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-[#0f172a] border border-gray-800 flex flex-col justify-between hover:border-blue-500/40 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                    Phase {idx + 1}
                  </span>
                  <Calendar className="w-4 h-4 text-gray-500" />
                </div>

                <h4 className="text-base font-bold text-white">{phase.phase}</h4>
                <div className="mt-2 text-xs">
                  <span className="text-gray-400">Primary Focus:</span>
                  <strong className="text-emerald-400 block font-semibold">{phase.priority_skill}</strong>
                </div>

                <div className="mt-4 space-y-2">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Milestones:</span>
                  <ul className="space-y-1.5 text-xs text-gray-300">
                    {phase.learning_goals && phase.learning_goals.map((goal, gIdx) => (
                      <li key={gIdx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-800/80">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Hands-on Capstone:</span>
                <p className="text-xs text-gray-300 mt-1 font-medium bg-gray-900/60 p-2.5 rounded-xl border border-gray-800">
                  {phase.practical_project}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
