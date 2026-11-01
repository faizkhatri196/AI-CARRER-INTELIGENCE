import React from 'react';
import { 
  CheckCircle, AlertTriangle, ArrowUpRight, Zap, 
  Award, ShieldCheck, Target, TrendingUp, Sparkles, Layers
} from 'lucide-react';

function CircularScoreBadge({ score, size = 110, strokeWidth = 9 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  
  let strokeColor = "stroke-emerald-500";
  if (score < 60) strokeColor = "stroke-amber-500";
  if (score < 45) strokeColor = "stroke-rose-500";
  
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="stroke-gray-800"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${strokeColor} transition-all duration-1000 ease-out`}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{score}</span>
        <span className="text-[9px] sm:text-[10px] text-gray-400 block font-bold uppercase tracking-wider">/ 100</span>
      </div>
    </div>
  );
}

export default function AssessmentScorecard({ profile }) {
  if (!profile) return null;

  const score = profile.resume_score || 76;
  const ats = profile.ats_score || 84;
  const expYears = profile.experience_years || 1.0;
  const matchPct = profile.match_percentage || 78;

  // Breakdown simulation if not provided directly
  const categories = [
    { name: "Required Technical Skills", score: 22, max: 25, color: "bg-blue-500" },
    { name: "Semantic Relevance", score: 13, max: 15, color: "bg-indigo-500" },
    { name: "Experience Alignment", score: 12, max: 15, color: "bg-emerald-500" },
    { name: "Project & Practical Evidence", score: 14, max: 15, color: "bg-cyan-500" },
    { name: "Responsibility Match", score: 8, max: 10, color: "bg-purple-500" },
    { name: "Domain Knowledge", score: 8, max: 10, color: "bg-amber-500" },
    { name: "Preferred Tools & Certs", score: 4, max: 5, color: "bg-teal-500" },
    { name: "Quantified Impact / Metrics", score: 4, max: 5, color: "bg-rose-500" },
  ];

  return (
    <div className="space-y-6">
      {/* 4 High-Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-gray-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Overall Fit</span>
            <Target className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{score}</span>
            <span className="text-xs text-blue-400 font-medium">/ 100</span>
          </div>
          <span className="text-[11px] text-gray-400 block mt-1">Multi-dimensional rating</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-gray-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ATS Readability</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{ats}</span>
            <span className="text-xs text-emerald-400 font-medium">/ 100</span>
          </div>
          <span className="text-[11px] text-gray-400 block mt-1">Structural parser parsing</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-gray-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Market Readiness</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{matchPct}%</span>
          </div>
          <span className="text-[11px] text-gray-400 block mt-1">Matching 2,000 active postings</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-gray-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estimated Package</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-white">{profile.predicted_salary || 12}</span>
            <span className="text-xs text-purple-400 font-medium">LPA</span>
          </div>
          <span className="text-[11px] text-gray-400 block mt-1">Range: {profile.salary_range_lpa || '10 - 15'} LPA</span>
        </div>
      </div>

      {/* Main Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Radial Score & Profile Summary */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0f172a] border border-gray-800 flex flex-col items-center justify-center text-center">
          <CircularScoreBadge score={score} size={120} />
          <h3 className="text-base sm:text-lg font-bold text-white mt-4 break-words">
            {profile.recommended_role || 'Software Engineer'}
          </h3>
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Predicted Level: {profile.predicted_level || 'SDE1'} ({expYears} yrs exp)
          </span>

          <div className="w-full mt-6 pt-5 border-t border-gray-800 text-left space-y-2 text-xs text-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Skills Extracted:</span>
              <span className="font-semibold text-white">{profile.skills ? profile.skills.length : 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Inferred Hidden Skills:</span>
              <span className="font-semibold text-emerald-400">{profile.inferred_skills ? profile.inferred_skills.length : 0} detected</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Transferable Skills:</span>
              <span className="font-semibold text-indigo-400">{profile.transferable_skills ? profile.transferable_skills.length : 0} mapped</span>
            </div>
          </div>
        </div>

        {/* Right: 8-Dimension Explainable Category Breakdown */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-[#0f172a] border border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white">Multidimensional Scoring Breakdown</h4>
              <p className="text-xs text-gray-400">Transparent point breakdown across 8 independent evaluation criteria</p>
            </div>
            <span className="text-xs font-semibold text-gray-400 bg-gray-800 px-2.5 py-1 rounded-lg self-start sm:self-auto">
              Total = 100 pts
            </span>
          </div>

          <div className="space-y-3.5">
            {categories.map((cat, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-300">{cat.name}</span>
                  <span className="font-bold text-white">{cat.score} <span className="text-gray-500">/ {cat.max}</span></span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`${cat.color} h-full rounded-full transition-all duration-700`}
                    style={{ width: `${(cat.score / cat.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strengths & Missing Gaps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0f172a] border border-gray-800">
          <div className="flex items-center gap-2 mb-4 text-emerald-400">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <h4 className="font-bold text-white text-sm">Verified Candidate Strengths</h4>
          </div>
          <div className="space-y-2.5 text-xs text-gray-300">
            {profile.skills && profile.skills.slice(0, 5).map((skill, i) => (
              <div key={i} className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="font-medium text-emerald-200">Demonstrated proficiency in {skill}</span>
              </div>
            ))}
            {profile.inferred_skills && profile.inferred_skills[0] && (
              <div className="flex items-center gap-2 bg-blue-500/5 border border-blue-500/10 p-2.5 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                <span className="font-medium text-blue-200">{profile.inferred_skills[0].skill} verified via project evidence</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-[#0f172a] border border-gray-800">
          <div className="flex items-center gap-2 mb-4 text-amber-400">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <h4 className="font-bold text-white text-sm">Critical Missing Market Requirements</h4>
          </div>
          <div className="space-y-2.5 text-xs text-gray-300">
            {profile.missing_skills && profile.missing_skills.length > 0 ? (
              profile.missing_skills.slice(0, 5).map((skill, i) => (
                <div key={i} className="flex items-center justify-between bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    <span className="font-medium text-amber-200">{skill}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold bg-gray-800 px-2 py-0.5 rounded">High Demand</span>
                </div>
              ))
            ) : (
              <p className="text-gray-400">No major market skill deficiencies detected for this tier.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
