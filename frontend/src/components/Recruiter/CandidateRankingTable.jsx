import React, { useState } from 'react';
import { 
  Star, Search, Filter, ShieldCheck, Eye, 
  ArrowUpDown, Download, CheckSquare, Square, 
  Sparkles, Layers, Sliders, ChevronDown, Award
} from 'lucide-react';

export default function CandidateRankingTable({ 
  candidates, 
  jobId, 
  anonymize, 
  onToggleAnonymize, 
  onSelectCandidate, 
  onToggleShortlist, 
  onOpenCompare,
  selectedCompareIds = [],
  onToggleCompareSelect,
  onExportCsv,
  onExportPdf
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [recommendationFilter, setRecommendationFilter] = useState('all');
  const [shortlistOnly, setShortlistOnly] = useState(false);
  const [sortField, setSortField] = useState('overall_fit_score');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filtering
  const filtered = candidates.filter(c => {
    if (c.overall_fit_score < minScore) return false;
    if (shortlistOnly && !c.shortlisted) return false;
    if (recommendationFilter !== 'all' && c.recommendation !== recommendationFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const nameMatch = c.name?.toLowerCase().includes(term);
      const emailMatch = c.email?.toLowerCase().includes(term);
      const skillMatch = c.skills?.some(s => s.toLowerCase().includes(term));
      if (!nameMatch && !emailMatch && !skillMatch) return false;
    }
    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (sortField === 'name') {
      valA = (valA || '').toLowerCase();
      valB = (valB || '').toLowerCase();
    }
    if (sortOrder === 'asc') return valA > valB ? 1 : -1;
    return valA < valB ? 1 : -1;
  });

  const getScoreBadgeColor = (score) => {
    if (score >= 82) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (score >= 68) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (score >= 50) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  };

  return (
    <div className="space-y-4">
      {/* Control & Filter Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full lg:max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, skill, or keyword..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 min-h-[44px]"
            />
          </div>

          {/* Action Buttons: Anonymized Mode, Compare, Exports */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Anonymized Screening Toggle */}
            <button
              onClick={onToggleAnonymize}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all min-h-[40px] ${
                anonymize
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-sm'
                  : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white'
              }`}
              title="Masks candidate personal attributes to eliminate unconscious bias"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{anonymize ? 'Fair Mode Active' : 'Enable Fair Mode'}</span>
            </button>

            {/* Compare Trigger */}
            <button
              onClick={onOpenCompare}
              disabled={selectedCompareIds.length < 2}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-700 bg-gray-900 text-xs text-gray-300 hover:text-white hover:border-gray-600 disabled:opacity-40 transition-colors min-h-[40px]"
            >
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Compare ({selectedCompareIds.length})</span>
            </button>

            {/* Export Buttons */}
            <button
              onClick={onExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-700 bg-gray-900 text-xs text-gray-300 hover:text-white hover:border-gray-600 transition-colors min-h-[40px]"
            >
              <Download className="w-3.5 h-3.5 text-gray-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={onExportPdf}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-700 bg-gray-900 text-xs text-gray-300 hover:text-white hover:border-gray-600 transition-colors min-h-[40px]"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Report PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Sliders & Dropdowns */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-gray-800/80 text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Min Score:</span>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value))}
              className="accent-indigo-500 w-24"
            />
            <span className="font-bold text-white w-6">{minScore}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400">Tier:</span>
            <select
              value={recommendationFilter}
              onChange={(e) => setRecommendationFilter(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            >
              <option value="all">All Tiers</option>
              <option value="Strong Match">Strong Match</option>
              <option value="Potential Match">Potential Match</option>
              <option value="Partial Match">Partial Match</option>
              <option value="Low Evidence">Low Evidence</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={shortlistOnly}
              onChange={(e) => setShortlistOnly(e.target.checked)}
              className="rounded accent-indigo-500 w-4 h-4"
            />
            <span className="text-gray-300 font-medium">Shortlisted Only</span>
          </label>
        </div>
      </div>

      {/* MOBILE CARD VIEW (< 768px): Fully engineered responsive representation */}
      <div className="block md:hidden space-y-3">
        {filtered.length > 0 ? (
          filtered.map((c, idx) => {
            const isChecked = selectedCompareIds.includes(c.candidate_id);
            return (
              <div
                key={c.candidate_id || idx}
                onClick={() => onSelectCandidate(c)}
                className="p-4 rounded-2xl bg-[#0f172a] border border-gray-800 hover:border-indigo-500/40 transition-all cursor-pointer space-y-3"
              >
                {/* Header row: Rank, Name, Score, Star */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="text-xs font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{c.name}</h4>
                      <span className="text-[11px] text-gray-500 block truncate max-w-[180px]">{c.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${getScoreBadgeColor(c.overall_fit_score)}`}>
                      {c.overall_fit_score}/100
                    </span>
                    <button
                      onClick={() => onToggleShortlist(c.candidate_id)}
                      className={`p-2 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
                        c.shortlisted
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-gray-500 hover:text-amber-400 hover:bg-gray-800'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${c.shortlisted ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Sub details: Experience & Tier */}
                <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-800/60 pt-2">
                  <span>Experience: <strong className="text-white">{c.experience_years} yrs</strong></span>
                  <span className="text-indigo-300 font-semibold">{c.recommendation}</span>
                </div>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1">
                  {c.skills && c.skills.slice(0, 4).map((s, sIdx) => (
                    <span key={sIdx} className="bg-gray-900 border border-gray-800 text-gray-300 text-[10px] px-2 py-0.5 rounded font-mono">
                      {s}
                    </span>
                  ))}
                  {c.skills && c.skills.length > 4 && (
                    <span className="text-[10px] text-gray-500 self-center">+{c.skills.length - 4} more</span>
                  )}
                </div>

                {/* Actions bottom row: Compare checkbox + View button */}
                <div 
                  className="flex items-center justify-between pt-2 border-t border-gray-800/60"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onToggleCompareSelect(c.candidate_id)}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-400 py-1"
                  >
                    {isChecked ? <CheckSquare className="w-4 h-4 text-indigo-500" /> : <Square className="w-4 h-4" />}
                    <span>Select to Compare</span>
                  </button>

                  <button
                    onClick={() => onSelectCandidate(c)}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 py-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Dossier</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-gray-500 text-xs bg-[#0f172a] rounded-2xl border border-gray-800">
            No candidates match your current filter criteria.
          </div>
        )}
      </div>

      {/* DESKTOP / TABLET TABLE VIEW (>= 768px): Contained horizontal scroll */}
      <div className="hidden md:block rounded-2xl bg-[#0f172a] border border-gray-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-gray-900/90 border-b border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Compare</th>
                <th className="py-3 px-4 w-16 text-center">Rank</th>
                <th className="py-3 px-4">Candidate Identity</th>
                <th className="py-3 px-4 text-center cursor-pointer" onClick={() => { setSortField('overall_fit_score'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Overall Fit</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer" onClick={() => { setSortField('experience_years'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                  <div className="flex items-center gap-1">
                    <span>Exp</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Demonstrated Skills</th>
                <th className="py-3 px-4">Recommendation</th>
                <th className="py-3 px-4 text-center">Shortlist</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80">
              {filtered.length > 0 ? (
                filtered.map((c, idx) => {
                  const isChecked = selectedCompareIds.includes(c.candidate_id);
                  return (
                    <tr 
                      key={c.candidate_id || idx}
                      className="hover:bg-gray-900/60 transition-colors cursor-pointer"
                      onClick={() => onSelectCandidate(c)}
                    >
                      {/* Compare Checkbox */}
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onToggleCompareSelect(c.candidate_id)}
                          className="text-gray-400 hover:text-indigo-400"
                        >
                          {isChecked ? <CheckSquare className="w-4 h-4 text-indigo-500" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* Rank Index */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-extrabold text-gray-400">#{idx + 1}</span>
                      </td>

                      {/* Candidate Identity */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-white block">{c.name}</span>
                        <span className="text-[11px] text-gray-500 truncate block max-w-xs">{c.email}</span>
                      </td>

                      {/* Fit Score Badge */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-extrabold border ${getScoreBadgeColor(c.overall_fit_score)}`}>
                          {c.overall_fit_score}/100
                        </span>
                      </td>

                      {/* Experience */}
                      <td className="py-3 px-4 font-medium text-gray-300">
                        {c.experience_years} yrs
                      </td>

                      {/* Extracted Skills Pills */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {c.skills && c.skills.slice(0, 3).map((s, sIdx) => (
                            <span key={sIdx} className="bg-gray-800 text-gray-300 text-[10px] px-2 py-0.5 rounded font-mono">
                              {s}
                            </span>
                          ))}
                          {c.skills && c.skills.length > 3 && (
                            <span className="text-[10px] text-gray-500 self-center">+{c.skills.length - 3}</span>
                          )}
                        </div>
                      </td>

                      {/* Recommendation Tier */}
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-semibold text-gray-300">
                          {c.recommendation}
                        </span>
                      </td>

                      {/* Shortlist Star */}
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onToggleShortlist(c.candidate_id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            c.shortlisted
                              ? 'text-amber-400 bg-amber-500/10'
                              : 'text-gray-500 hover:text-amber-400 hover:bg-gray-800'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${c.shortlisted ? 'fill-amber-400' : ''}`} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500 text-xs">
                    No candidates match the specified criteria or no resumes ingested yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
