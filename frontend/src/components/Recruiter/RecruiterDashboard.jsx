import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../utils/api';
import { 
  Briefcase, UploadCloud, Users, BarChart3, Cpu, 
  Layers, Download, Plus, Sparkles, Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import JobOpeningsManager from './JobOpeningsManager';
import BatchUploadModal from './BatchUploadModal';
import CandidateRankingTable from './CandidateRankingTable';
import CandidateDetailModal from './CandidateDetailModal';
import CandidateCompareModal from './CandidateCompareModal';
import RecruiterAnalyticsView from './RecruiterAnalyticsView';
import MLEvaluationView from './MLEvaluationView';

export default function RecruiterDashboard({ user }) {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [anonymize, setAnonymize] = useState(false);
  const [activeTab, setActiveTab] = useState('ranking');

  // Modals
  const [isBatchUploadOpen, setIsBatchUploadOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedCompareIds, setSelectedCompareIds] = useState([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareCandidatesList, setCompareCandidatesList] = useState([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJob?.id) {
      fetchCandidates(selectedJob.id, anonymize);
    }
  }, [selectedJob, anonymize]);

  const fetchJobs = async () => {
    try {
      const res = await axios.get(getApiUrl('/api/jobs'));
      const jobList = res.data || [];
      setJobs(jobList);
      if (jobList.length > 0 && !selectedJob) {
        setSelectedJob(jobList[0]);
      }
    } catch (err) {
      console.error("Failed to load jobs:", err);
    }
  };

  const fetchCandidates = async (jobId, isAnonymized) => {
    setLoadingCandidates(true);
    try {
      const res = await axios.get(getApiUrl(`/api/screening/jobs/${jobId}/candidates?anonymize=${isAnonymized}`));
      setCandidates(res.data.candidates || []);
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleToggleShortlist = async (candidateId) => {
    try {
      const res = await axios.post(getApiUrl(`/api/screening/candidates/${candidateId}/shortlist`));
      setCandidates(prev => prev.map(c => 
        c.candidate_id === candidateId ? { ...c, shortlisted: res.data.shortlisted } : c
      ));
    } catch (err) {
      console.error("Shortlist toggle failed:", err);
    }
  };

  const handleToggleCompareSelect = (candidateId) => {
    setSelectedCompareIds(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId);
      }
      if (prev.length >= 4) return prev; // max 4
      return [...prev, candidateId];
    });
  };

  const handleOpenCompare = async () => {
    if (selectedCompareIds.length < 2) return;
    try {
      const res = await axios.post(getApiUrl('/api/screening/compare'), {
        candidate_ids: selectedCompareIds
      });
      setCompareCandidatesList(res.data.candidates || []);
      setIsCompareOpen(true);
    } catch (err) {
      console.error("Compare error:", err);
    }
  };

  const handleExportCsv = () => {
    if (!selectedJob) return;
    window.open(getApiUrl(`/api/screening/jobs/${selectedJob.id}/export/csv`), '_blank');
  };

  const handleExportPdf = () => {
    if (!selectedJob) return;
    window.open(getApiUrl(`/api/screening/jobs/${selectedJob.id}/export/pdf`), '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Job Openings Manager */}
      <JobOpeningsManager
        jobs={jobs}
        selectedJob={selectedJob}
        onSelectJob={(j) => { setSelectedJob(j); setSelectedCompareIds([]); }}
        onRefreshJobs={fetchJobs}
      />

      {selectedJob ? (
        <div className="space-y-6">
          {/* Action Row for Selected Job */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-[#0f172a] to-blue-950/20 border border-gray-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-white break-words">{selectedJob.title}</h2>
                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 flex-shrink-0">
                  {selectedJob.seniority}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 max-w-2xl line-clamp-2">
                {selectedJob.description || 'Job requisition active.'}
              </p>
            </div>

            <button
              onClick={() => setIsBatchUploadOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 whitespace-nowrap transition-all min-h-[44px]"
            >
              <UploadCloud className="w-4 h-4 flex-shrink-0" />
              <span>Bulk Ingest Resumes</span>
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-800 pb-2 overflow-x-auto scrollbar-none max-w-full">
            <button
              onClick={() => setActiveTab('ranking')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[40px] flex-shrink-0 ${
                activeTab === 'ranking'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Candidate Pool ({candidates.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[40px] flex-shrink-0 ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Recruitment Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('ml')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[40px] flex-shrink-0 ${
                activeTab === 'ml'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 flex-shrink-0" />
              <span>ML Pipeline & Metrics</span>
            </button>
          </div>

          {/* Tab Views with Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'ranking' && (
                loadingCandidates ? (
                  <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                    <span className="text-sm">Ranking candidates against job rubric...</span>
                  </div>
                ) : (
                  <CandidateRankingTable
                    candidates={candidates}
                    jobId={selectedJob.id}
                    anonymize={anonymize}
                    onToggleAnonymize={() => setAnonymize(!anonymize)}
                    onSelectCandidate={(c) => setSelectedCandidate(c)}
                    onToggleShortlist={handleToggleShortlist}
                    selectedCompareIds={selectedCompareIds}
                    onToggleCompareSelect={handleToggleCompareSelect}
                    onOpenCompare={handleOpenCompare}
                    onExportCsv={handleExportCsv}
                    onExportPdf={handleExportPdf}
                  />
                )
              )}

              {activeTab === 'analytics' && <RecruiterAnalyticsView jobId={selectedJob.id} />}
              {activeTab === 'ml' && <MLEvaluationView />}
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        <div className="p-8 sm:p-16 text-center rounded-3xl bg-[#0f172a] border border-gray-800">
          <Briefcase className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-bold text-white">No Job Requisition Selected</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto mt-1 mb-6">
            Create or select a job opening above to ingest candidate batches, evaluate rank ordering, and filter profiles.
          </p>
        </div>
      )}

      {/* Bulk Upload Modal */}
      <BatchUploadModal
        isOpen={isBatchUploadOpen}
        job={selectedJob}
        onClose={() => setIsBatchUploadOpen(false)}
        onBatchCompleted={() => {
          fetchJobs();
          if (selectedJob?.id) fetchCandidates(selectedJob.id, anonymize);
        }}
      />

      {/* Candidate Deep Detail Modal */}
      <CandidateDetailModal
        candidate={selectedCandidate}
        jobId={selectedJob?.id}
        onClose={() => setSelectedCandidate(null)}
        onCandidateUpdated={() => {
          if (selectedJob?.id) fetchCandidates(selectedJob.id, anonymize);
        }}
      />

      {/* Multi-Candidate Compare Modal */}
      {isCompareOpen && (
        <CandidateCompareModal
          candidates={compareCandidatesList}
          onClose={() => setIsCompareOpen(false)}
        />
      )}
    </div>
  );
}
