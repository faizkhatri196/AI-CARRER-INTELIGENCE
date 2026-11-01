import React, { useState } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../utils/api';
import { 
  Briefcase, Plus, Sparkles, Sliders, CheckCircle, 
  Trash2, Edit, ChevronRight, Loader2, X
} from 'lucide-react';

export default function JobOpeningsManager({ jobs, selectedJob, onSelectJob, onRefreshJobs }) {
  const [isCreating, setIsCreating] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [description, setDescription] = useState('');
  const [seniority, setSeniority] = useState('Mid-Level');
  const [minExp, setMinExp] = useState(2.0);
  const [reqSkills, setReqSkills] = useState('Python, FastAPI, SQL, REST APIs');
  const [prefSkills, setPrefSkills] = useState('Docker, AWS, Kubernetes');
  const [location, setLocation] = useState('Remote');

  // Weights
  const [showWeights, setShowWeights] = useState(false);
  const [weights, setWeights] = useState({
    required_skills: 25,
    semantic_relevance: 15,
    experience: 15,
    projects: 15,
    responsibilities: 10,
    domain_relevance: 10,
    preferred_skills: 5,
    achievements: 5
  });

  const handleAutoExtract = async () => {
    if (!description.trim()) return;
    setExtracting(true);
    try {
      const res = await axios.post(getApiUrl('/api/jobs/extract'), { description });
      const data = res.data;
      if (data.title && !title) setTitle(data.title);
      if (data.seniority) setSeniority(data.seniority);
      if (data.min_experience_years !== undefined) setMinExp(data.min_experience_years);
      if (data.required_skills) setReqSkills(data.required_skills.join(', '));
      if (data.preferred_skills) setPrefSkills(data.preferred_skills.join(', '));
    } catch (err) {
      console.error("Requirement extraction failed:", err);
    } finally {
      setExtracting(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title,
        department,
        description,
        seniority,
        min_experience_years: parseFloat(minExp),
        required_skills: reqSkills.split(',').map(s => s.strip ? s.strip() : s.trim()).filter(Boolean),
        preferred_skills: prefSkills.split(',').map(s => s.strip ? s.strip() : s.trim()).filter(Boolean),
        location,
        scoring_weights: weights
      };
      const res = await axios.post(getApiUrl('/api/jobs'), payload);
      onSelectJob(res.data);
      setIsCreating(false);
      onRefreshJobs();
    } catch (err) {
      console.error("Job creation failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0f172a] border border-gray-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
            Recruitment Intelligence Workspace
          </span>
          <h3 className="text-lg font-bold text-white mt-1">Active Job Requisitions</h3>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 self-start sm:self-auto transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Job Opening</span>
        </button>
      </div>

      {/* Horizontal Job Chips */}
      {jobs.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {jobs.map((j) => (
            <button
              key={j.id}
              onClick={() => onSelectJob(j)}
              className={`p-3 rounded-xl border text-left whitespace-nowrap transition-all flex items-center gap-3 ${
                selectedJob?.id === j.id
                  ? 'bg-indigo-600/15 border-indigo-500 text-white'
                  : 'bg-gray-900/80 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
              }`}
            >
              <Briefcase className={`w-4 h-4 ${selectedJob?.id === j.id ? 'text-indigo-400' : 'text-gray-500'}`} />
              <div>
                <span className="text-xs font-bold block">{j.title}</span>
                <span className="text-[10px] text-gray-500">
                  {j.candidate_count || 0} candidates • {j.shortlisted_count || 0} shortlisted
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create Job Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0f172a] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h4 className="text-base font-bold text-white">Create Job Requisition</h4>
              </div>
              <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-300">Job Description & Requirements</label>
                  <button
                    type="button"
                    onClick={handleAutoExtract}
                    disabled={extracting || !description.trim()}
                    className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 disabled:opacity-50"
                  >
                    {extracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>AI Auto-Extract Requirements</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Paste complete job specification..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Seniority</label>
                  <select
                    value={seniority}
                    onChange={(e) => setSeniority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Intern">Intern</option>
                    <option value="Entry-Level">Entry-Level</option>
                    <option value="Mid-Level">Mid-Level</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead / Architect">Lead / Architect</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Min Experience (Yrs)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={minExp}
                    onChange={(e) => setMinExp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Required Skills (Comma separated - high scoring weight)
                </label>
                <input
                  type="text"
                  value={reqSkills}
                  onChange={(e) => setReqSkills(e.target.value)}
                  placeholder="Python, FastAPI, SQL, Docker"
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Preferred / Nice-to-Have Skills
                </label>
                <input
                  type="text"
                  value={prefSkills}
                  onChange={(e) => setPrefSkills(e.target.value)}
                  placeholder="AWS, Kubernetes, Redis"
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Scoring Weights Panel Toggle */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowWeights(!showWeights)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{showWeights ? 'Hide Scoring Weight Configuration' : 'Customize 8-Dimension Scoring Weights'}</span>
                </button>

                {showWeights && (
                  <div className="mt-3 p-4 rounded-2xl bg-gray-900 border border-gray-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {Object.keys(weights).map((key) => (
                      <div key={key}>
                        <label className="block text-[10px] text-gray-400 capitalize mb-1">
                          {key.replace(/_/g, ' ')} ({weights[key]} pts)
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          value={weights[key]}
                          onChange={(e) => setWeights({ ...weights, [key]: parseInt(e.target.value) })}
                          className="w-full accent-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Creating Requisition...' : 'Create & Save Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

