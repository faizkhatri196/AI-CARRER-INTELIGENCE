import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../utils/api';
import { 
  UploadCloud, FileText, CheckCircle, AlertCircle, Loader2, 
  Sparkles, Compass, Map, Layers, Target, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import AssessmentScorecard from './AssessmentScorecard';
import CapabilityExplorer from './CapabilityExplorer';
import RoleDiscoveryView from './RoleDiscoveryView';
import JobMatchAnalyzer from './JobMatchAnalyzer';
import LearningRoadmapView from './LearningRoadmapView';
import ResumeStudioView from './ResumeStudioView';
import LinkedInInspectorView from './LinkedInInspectorView';
import CareerChatbotDrawer from './CareerChatbotDrawer';

export default function CandidateDashboard({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('scorecard');

  useEffect(() => {
    if (user && user.user_id) {
      fetchLatestProfile();
    }
  }, [user]);

  const fetchLatestProfile = async () => {
    try {
      const res = await axios.get(getApiUrl(`/api/candidates/profile/${user.user_id}`));
      setProfile(res.data);
    } catch (err) {
      console.log("No existing profile found:", err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a resume file (.pdf, .docx, or .txt).');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', user.user_id);

    try {
      const res = await axios.post(getApiUrl('/api/candidates/upload'), formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(res.data.profile);
      setActiveTab('scorecard');
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during resume ingestion.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'scorecard', label: '360° Scorecard', icon: Target },
    { id: 'capabilities', label: 'Hidden & Transferable Skills', icon: Sparkles },
    { id: 'roles', label: 'Role Discovery', icon: Compass },
    { id: 'match', label: 'Job Description Match', icon: Layers },
    { id: 'roadmap', label: 'Skill Roadmap', icon: Map },
    { id: 'studio', label: 'Resume Studio', icon: FileText },
    { id: 'linkedin', label: 'LinkedIn Inspector', icon: Compass },
    { id: 'chat', label: 'Career AI Chat', icon: MessageSquare }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Upload Banner */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-blue-900/30 via-[#0f172a] to-indigo-900/20 border border-gray-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
              Candidate Career Intelligence
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-2 break-words">
              {profile ? `Welcome Back, ${profile.name || user.name}` : `Welcome, ${user.name}`}
            </h2>
            <p className="text-xs text-gray-400 mt-1 max-w-xl">
              Upload your resume in PDF, DOCX, or TXT format. Our NLP & capability inference engine extracts verified skills, maps transferable capabilities, and predicts market alignment.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label className="w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-700 bg-gray-900/60 hover:bg-gray-800 hover:border-blue-500 text-xs font-semibold text-gray-300 transition-all min-h-[44px]">
              <UploadCloud className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span className="truncate max-w-[200px]">{file ? file.name : 'Select Resume (PDF, DOCX, TXT)'}</span>
              <input type="file" accept=".pdf,.docx,.doc,.txt" onChange={handleFileChange} className="hidden" />
            </label>

            <button
              onClick={handleUpload}
              disabled={loading || !file}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[44px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extracting Intelligence...</span>
                </>
              ) : (
                <span>Analyze Resume</span>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}
      </div>

      {profile ? (
        <div className="space-y-6">
          {/* Navigation Tabs (Smooth horizontally scrollable on mobile) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-800 scrollbar-none max-w-full">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[40px] flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab View with Fade In */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'scorecard' && <AssessmentScorecard profile={profile} />}
              {activeTab === 'capabilities' && <CapabilityExplorer profile={profile} />}
              {activeTab === 'roles' && <RoleDiscoveryView profile={profile} />}
              {activeTab === 'match' && <JobMatchAnalyzer profile={profile} />}
              {activeTab === 'roadmap' && <LearningRoadmapView profile={profile} />}
              {activeTab === 'studio' && <ResumeStudioView profile={profile} />}
              {activeTab === 'linkedin' && <LinkedInInspectorView profile={profile} />}
              {activeTab === 'chat' && <CareerChatbotDrawer profile={profile} />}
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        <div className="p-8 sm:p-16 text-center rounded-3xl bg-[#0f172a] border border-gray-800">
          <UploadCloud className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-bold text-white">No Resume Uploaded Yet</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto mt-1 mb-6">
            Upload your resume above to get your full 8-dimension career assessment, hidden talent recognition, and tailored ATS redesign studio.
          </p>
        </div>
      )}
    </div>
  );
}
