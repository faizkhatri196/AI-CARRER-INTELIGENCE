import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../utils/api';
import { 
  BarChart3, Users, Award, TrendingUp, CheckCircle, 
  AlertTriangle, Loader2, Sparkles
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell 
} from 'recharts';

export default function RecruiterAnalyticsView({ jobId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchAnalytics();
    }
  }, [jobId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get(getApiUrl(`/api/analytics/recruiter/${jobId}`));
      setAnalytics(res.data);
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        <span className="text-sm">Aggregating recruitment metrics...</span>
      </div>
    );
  }

  if (!analytics) return null;

  const scoreData = analytics.score_distribution || [];
  const expData = analytics.experience_distribution || [];

  return (
    <div className="space-y-6">
      {/* 5 KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-[#0f172a] border border-gray-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Total Ingested</span>
          <span className="text-2xl font-extrabold text-white">{analytics.total_applications}</span>
          <span className="text-[11px] text-gray-500 block mt-0.5">Resumes</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0f172a] border border-gray-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">Average Fit</span>
          <span className="text-2xl font-extrabold text-white">{analytics.average_fit_score}</span>
          <span className="text-[11px] text-gray-500 block mt-0.5">/ 100 benchmark</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0f172a] border border-gray-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">Strong Matches</span>
          <span className="text-2xl font-extrabold text-emerald-400">{analytics.strong_matches}</span>
          <span className="text-[11px] text-gray-500 block mt-0.5">Score ≥ 82</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0f172a] border border-gray-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">Shortlisted</span>
          <span className="text-2xl font-extrabold text-amber-400">{analytics.shortlisted_count}</span>
          <span className="text-[11px] text-gray-500 block mt-0.5">Approved candidates</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0f172a] border border-gray-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Duplicate Rate</span>
          <span className="text-2xl font-extrabold text-white">{analytics.duplicate_resumes}</span>
          <span className="text-[11px] text-gray-500 block mt-0.5">Deduplicated (SHA-256)</span>
        </div>
      </div>

      {/* Recharts Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">Candidate Score Distribution</h4>
            <span className="text-xs text-indigo-400 font-semibold">Normalized Histogram</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Experience Distribution */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">Experience Demographics</h4>
            <span className="text-xs text-emerald-400 font-semibold">Verified Durations</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Skills Cloud */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-gray-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">Top Capabilities in Applicant Pool</h4>
        <div className="flex flex-wrap gap-2">
          {analytics.top_skills_pool && analytics.top_skills_pool.map((s, idx) => (
            <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-200">
              <span className="font-semibold">{s.skill}</span>
              <span className="bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.2 rounded text-[10px]">
                {s.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

