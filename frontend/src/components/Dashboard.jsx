import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  UploadCloud, CheckCircle, AlertCircle, Send, Loader2, TrendingUp, 
  BookOpen, BrainCircuit, Building2, Map, FileText, Clipboard, 
  Download, Sparkles, Award, RefreshCw, ChevronDown, ChevronUp, 
  UserCheck, ShieldCheck, HelpCircle, Briefcase, DollarSign, Target
} from 'lucide-react';

function CircularScore({ score, size = 120, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  
  let strokeColor = "stroke-red-500";
  if (score >= 80) strokeColor = "stroke-accent";
  else if (score >= 60) strokeColor = "stroke-primary";
  else if (score >= 40) strokeColor = "stroke-secondary";
  
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
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
          className={`${strokeColor} transition-all duration-700 ease-out`}
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
        <span className="text-3xl font-extrabold text-white">{score}</span>
        <span className="text-[10px] text-gray-500 block font-bold uppercase tracking-wider">Score</span>
      </div>
    </div>
  );
}

export default function Dashboard({ user }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  
  // Navigation
  const [activeTab, setActiveTab] = useState('overview');
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Roadmap State
  const [targetLevel, setTargetLevel] = useState('SDE1');
  const [updatingRoadmap, setUpdatingRoadmap] = useState(false);

  // Resume Improvements State
  const [improvements, setImprovements] = useState(null);
  const [improveLoading, setImproveLoading] = useState(false);
  const [improveRole, setImproveRole] = useState('');
  const [activeAccordion, setActiveAccordion] = useState('formatting');

  // Resume Rewrite State
  const [rewrittenResume, setRewrittenResume] = useState('');
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [rewriteRole, setRewriteRole] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setChatMessages([
      { role: 'assistant', content: `Hi ${user.name}! I am your AI Career Advisor. Upload your resume to get started, or ask me any career-related questions!` }
    ]);
  }, [user]);

  useEffect(() => {
    const fetchLatestProfile = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await axios.get(`${apiUrl}/api/profile/${user.user_id}`);
        const prof = response.data;
        setProfile(prof);
        setTargetLevel(prof.predicted_level);
        setImproveRole(prof.recommended_role || '');
        setRewriteRole(prof.recommended_role || '');
      } catch (err) {
        console.log("No profile found or failed to load profile:", err);
      }
    };
    
    if (user && user.user_id) {
      fetchLatestProfile();
    }
  }, [user]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file first.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', user.user_id);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const prof = response.data.profile;
      setProfile(prof);
      setTargetLevel(prof.predicted_level);
      setImproveRole(prof.recommended_role || '');
      setRewriteRole(prof.recommended_role || '');
      setChatMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: `I've analyzed your resume using our RAG intelligence engine! 
Your best-fit role is **${prof.recommended_role}** at a predicted level of **${prof.predicted_level}** with an estimated package of **${prof.predicted_salary} LPA** (Range: **${prof.salary_range_lpa} LPA**). 
I've populated recommendations, matching market postings, and a custom roadmap. How would you like to proceed?` 
        }
      ]);
      setActiveTab('overview');
      // Reset sub-tab states
      setImprovements(null);
      setRewrittenResume('');
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during upload.');
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setChatLoading(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/api/chat`, { 
        query: userMsg,
        user_id: user.user_id
      });
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting to the AI brain.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleUpdateRoadmap = async (level) => {
    setTargetLevel(level);
    setUpdatingRoadmap(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/api/roadmap/update`, {
        user_id: user.user_id,
        target_level: level
      });
      setProfile(prev => ({
        ...prev,
        missing_skills: response.data.missing_skills,
        match_percentage: response.data.match_percentage,
        suggested_companies: response.data.suggested_companies
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingRoadmap(false);
    }
  };

  // Fetch Resume Improvements
  const fetchImprovements = async (targetRole = improveRole) => {
    setImproveLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/api/resume/improve`, {
        user_id: user.user_id,
        target_role: targetRole
      });
      setImprovements(response.data.improvements);
    } catch (err) {
      console.error("Error fetching improvements:", err);
    } finally {
      setImproveLoading(false);
    }
  };

  // Fetch Rewritten Resume
  const handleRewriteResume = async () => {
    if (!rewriteRole.trim()) return;
    setRewriteLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/api/resume/rewrite`, {
        user_id: user.user_id,
        target_role: rewriteRole
      });
      setRewrittenResume(response.data.rewritten_markdown);
    } catch (err) {
      console.error("Error generating rewrite:", err);
    } finally {
      setRewriteLoading(false);
    }
  };

  // Copy to clipboard helper
  const handleCopyToClipboard = () => {
    if (!rewrittenResume) return;
    navigator.clipboard.writeText(rewrittenResume);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Markdown file helper
  const handleDownloadMarkdown = () => {
    if (!rewrittenResume) return;
    const element = document.createElement("a");
    const file = new Blob([rewrittenResume], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${rewriteRole.toLowerCase().replace(/\s+/g, "_")}_resume.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Download PDF file helper
  const handleDownloadPDF = async () => {
    if (!rewrittenResume) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const filename = `${rewriteRole.toLowerCase().replace(/\s+/g, "_")}_resume`;
      const response = await axios.post(`${apiUrl}/api/resume/download/pdf`, {
        markdown: rewrittenResume,
        filename: filename
      }, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      element.download = `${filename}.pdf`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      console.error("Error downloading PDF:", err);
    }
  };

  // Download DOCX file helper
  const handleDownloadDOCX = async () => {
    if (!rewrittenResume) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const filename = `${rewriteRole.toLowerCase().replace(/\s+/g, "_")}_resume`;
      const response = await axios.post(`${apiUrl}/api/resume/download/docx`, {
        markdown: rewrittenResume,
        filename: filename
      }, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      element.download = `${filename}.docx`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      console.error("Error downloading DOCX:", err);
    }
  };

  // Custom Markdown renderer
  const renderMarkdown = (mdText) => {
    if (!mdText) return null;
    const lines = mdText.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="text-sm font-bold text-white mt-4 mb-1.5 uppercase tracking-wider">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="text-base font-bold text-primary mt-5 mb-2.5 border-b border-gray-800 pb-1">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={idx} className="text-xl font-black text-white mt-6 mb-3 border-b border-primary/30 pb-1.5">{line.replace('# ', '')}</h2>;
      }
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const cleanLine = line.trim().substring(2);
        const parts = cleanLine.split('**');
        const renderedText = parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-white font-bold">{part}</strong> : part);
        return (
          <li key={idx} className="ml-5 list-disc text-xs text-gray-300 mb-1 leading-relaxed">
            {renderedText}
          </li>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-2"></div>;
      }
      const parts = line.split('**');
      const renderedText = parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-white font-bold">{part}</strong> : part);
      return <p key={idx} className="text-xs text-gray-300 leading-relaxed mb-1.5">{renderedText}</p>;
    });
  };

  // Trigger loading improvements if tab selected and none exist
  useEffect(() => {
    if (activeTab === 'improvements' && !improvements && profile) {
      fetchImprovements();
    }
  }, [activeTab, improvements, profile]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {!profile ? (
        <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
          <div className="glass-panel p-10 rounded-3xl max-w-2xl w-full text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-secondary to-accent"></div>
            
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20 animate-pulse">
              <UploadCloud className="w-10 h-10 text-primary" />
            </div>
            
            <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">AI Career Intelligence</h1>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">Upload your resume to retrieve matching jobs in the AI market, identify skill gaps, get suggestions, and rewrite your resume using LLM RAG.</p>
            
            <div className="border-2 border-dashed border-gray-700 rounded-2xl p-10 mb-6 hover:border-primary/50 transition-colors bg-gray-800/20 group cursor-pointer relative">
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileChange} 
                className="hidden" 
                id="resume-upload" 
              />
              <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center">
                <span className="text-gray-300 font-semibold mb-2 group-hover:text-primary transition-colors">
                  {file ? file.name : "Select or drag PDF resume here"}
                </span>
                <span className="text-xs text-gray-500">Supported formats: PDF (max 10MB)</span>
              </label>
            </div>
            
            {error && <div className="text-red-400 text-sm mb-4 flex items-center justify-center gap-2"><AlertCircle className="w-4.5 h-4.5"/> {error}</div>}
            
            <button 
              onClick={handleUpload}
              disabled={loading || !file}
              className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-95 disabled:opacity-40 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Retrieving Job Market RAG...</> : "Analyze Career Intelligence"}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Dashboard Panel */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Profile Info Header */}
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
              
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/20 text-accent text-xs font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> RAG Analytics Loaded
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{profile.filename}</span>
                </div>
                <h2 className="text-2xl font-black text-white">{profile.recommended_role} <span className="text-gray-500 font-medium text-lg">({profile.predicted_level})</span></h2>
                <p className="text-gray-400 text-sm mt-1">{profile.experience_years} Years Experience • Predicted Package: <span className="text-white font-bold">₹{profile.predicted_salary} LPA</span> ({profile.salary_range_lpa})</p>
              </div>
              
              <button 
                onClick={() => setProfile(null)} 
                className="px-4 py-2 bg-gray-800/80 hover:bg-gray-800 text-xs font-bold text-gray-400 hover:text-white rounded-xl border border-gray-700 transition-colors shrink-0"
              >
                Upload New Resume
              </button>
            </div>

            {/* Dashboard Tabs Navigation */}
            <div className="flex border-b border-gray-800 bg-surface/30 p-1 rounded-2xl border border-gray-800/50">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'overview' ? 'bg-primary text-white shadow-lg shadow-primary/10' : 'text-gray-400 hover:text-white'}`}
              >
                <Briefcase className="w-4 h-4" /> Overview & Market RAG
              </button>
              <button
                onClick={() => setActiveTab('improvements')}
                className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'improvements' ? 'bg-primary text-white shadow-lg shadow-primary/10' : 'text-gray-400 hover:text-white'}`}
              >
                <Award className="w-4 h-4" /> Improve Resume
              </button>
              <button
                onClick={() => setActiveTab('rewrite')}
                className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'rewrite' ? 'bg-primary text-white shadow-lg shadow-primary/10' : 'text-gray-400 hover:text-white'}`}
              >
                <Sparkles className="w-4 h-4" /> Rewrite Resume (crt)
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Score & Skills Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Score Card */}
                  <div className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-center text-center">
                    <CircularScore score={profile.resume_score || 75} size={130} />
                    <h4 className="text-sm font-bold text-white mt-4 mb-1">Resume Strength</h4>
                    <p className="text-xs text-gray-500">Based on market skills matching</p>
                  </div>

                  {/* Skills lists */}
                  <div className="glass-panel p-6 rounded-3xl md:col-span-2 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Technical Stack detected</h4>
                      <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto pr-2">
                        {profile.skills.map(s => (
                          <span key={s} className="px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-xs font-medium rounded-lg">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-4 border-t border-gray-800/80 pt-4">
                      <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">Skills Gaps (Next Level)</h4>
                      <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto pr-2">
                        {profile.missing_skills.map(s => (
                          <span key={s} className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Retrieved RAG Job Postings */}
                <div className="glass-panel p-6 rounded-3xl">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-accent" />
                    <div>
                      <h3 className="text-lg font-bold text-white">Retrieved Matching Market Postings</h3>
                      <p className="text-xs text-gray-500">Real-time jobs matched via TF-IDF semantic RAG from our AI job market dataset</p>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-800 text-gray-500 font-bold">
                          <th className="pb-3 pr-2">Job Title</th>
                          <th className="pb-3 px-2">Company</th>
                          <th className="pb-3 px-2">Industry</th>
                          <th className="pb-3 px-2 text-center">Exp Level</th>
                          <th className="pb-3 px-2 text-right">Salary (USD)</th>
                          <th className="pb-3 pl-2 text-right">Confidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-850">
                        {profile.matching_jobs && profile.matching_jobs.length > 0 ? (
                          profile.matching_jobs.map((job) => (
                            <tr key={job.job_id} className="hover:bg-gray-800/20 transition-colors">
                              <td className="py-3 pr-2 text-white font-semibold flex items-center gap-1.5">
                                {job.job_title}
                              </td>
                              <td className="py-3 px-2 text-gray-300 font-medium">{job.company_name}</td>
                              <td className="py-3 px-2 text-gray-400">{job.industry}</td>
                              <td className="py-3 px-2 text-center">
                                <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 text-[10px]">
                                  {job.experience_level}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-right text-accent font-bold">${parseFloat(job.salary_range_usd.split('-')[0]).toLocaleString()}+</td>
                              <td className="py-3 pl-2 text-right text-gray-500">{(job.similarity_score * 100).toFixed(1)}%</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center py-6 text-gray-500">No matching jobs found in dataset.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Custom AI Roadmap */}
                <div className="glass-panel p-6 rounded-3xl relative">
                  {updatingRoadmap && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-xs z-10 flex items-center justify-center rounded-3xl">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-gray-800/60 pb-4">
                    <div className="flex items-center gap-2">
                      <Map className="w-5 h-5 text-secondary" />
                      <div>
                        <h3 className="text-lg font-bold text-white">Interactive Skill Roadmap</h3>
                        <p className="text-xs text-gray-500">Tailored learning steps to match higher salary levels</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-gray-800/50 p-2 rounded-xl border border-gray-700/80">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Target Level:</span>
                      <select 
                        value={targetLevel}
                        onChange={(e) => handleUpdateRoadmap(e.target.value)}
                        className="bg-gray-900 border border-gray-750 text-white text-xs rounded-lg block p-1.5 outline-none font-bold cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <option value="Intern">Intern (3-5 LPA)</option>
                        <option value="Fresher">Fresher (5-8 LPA)</option>
                        <option value="SDE1">SDE1 (8-15 LPA)</option>
                        <option value="SDE2">SDE2 (15-30 LPA)</option>
                        <option value="Senior">Senior (30-45 LPA)</option>
                        <option value="Staff">Staff (60-75 LPA)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {profile.missing_skills.length > 0 ? (
                      profile.missing_skills.slice(0, 3).map((skill, index) => (
                        <div key={skill} className="flex gap-4 items-start">
                          <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-accent shrink-0 text-sm">
                            {index + 1}
                          </div>
                          <div className="bg-gray-850/40 border border-gray-800/80 rounded-xl p-4 flex-1">
                            <h4 className="font-bold text-white text-xs mb-1">Master {skill.toUpperCase()}</h4>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              Add {skill} to your portfolio. It is highly in demand for {targetLevel} positions and will increase your match rate.
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 text-accent text-xs flex items-center gap-3 font-semibold">
                        <CheckCircle className="w-5 h-5 shrink-0" /> You already possess the core skills required for this level! Focus on system scale, architectural details, and delivery.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'improvements' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Improvement Evaluator Input */}
                <div className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">Evaluate Resume Quality</h3>
                    <p className="text-xs text-gray-500">Get category suggestions on formatting, impact metrics, ATS parameters, and skills.</p>
                  </div>
                  <div className="flex gap-3">
                    <input 
                      type="text"
                      placeholder="e.g. Machine Learning Engineer"
                      value={improveRole}
                      onChange={(e) => setImproveRole(e.target.value)}
                      className="bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-2 text-xs outline-none focus:border-primary w-full sm:w-56"
                    />
                    <button
                      onClick={() => fetchImprovements(improveRole)}
                      disabled={improveLoading || !improveRole.trim()}
                      className="px-4 py-2 bg-primary hover:bg-primary/95 text-xs font-bold text-white rounded-xl transition-colors disabled:opacity-40 flex items-center gap-2 shrink-0"
                    >
                      {improveLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Evaluate
                    </button>
                  </div>
                </div>

                {improveLoading ? (
                  <div className="glass-panel p-16 rounded-3xl flex flex-col items-center justify-center text-center">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                    <h4 className="text-white font-bold text-sm">Evaluating Resume Structure...</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs">Scanning text sections, identifying passive phrasing, and evaluating keyword layout...</p>
                  </div>
                ) : improvements ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Scores Breakdown Sidebar */}
                    <div className="glass-panel p-6 rounded-3xl space-y-6 h-fit">
                      <div className="flex flex-col items-center text-center border-b border-gray-800 pb-5">
                        <CircularScore score={improvements.overall_score || 70} size={120} />
                        <h4 className="text-sm font-bold text-white mt-4">Average Quality Score</h4>
                        <p className="text-xs text-gray-500 mt-1">Based on candidate evaluation</p>
                      </div>

                      <div className="space-y-4">
                        <div 
                          onClick={() => setActiveAccordion('formatting')}
                          className={`p-3 rounded-xl cursor-pointer border transition-all ${activeAccordion === 'formatting' ? 'bg-primary/10 border-primary/45 text-white' : 'bg-transparent border-transparent text-gray-400 hover:text-gray-200'}`}
                        >
                          <div className="flex justify-between text-xs font-bold mb-1.5">
                            <span>Formatting & Layout</span>
                            <span className={improvements.formatting_score >= 80 ? "text-accent" : "text-primary"}>{improvements.formatting_score}%</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-1.5 rounded-full ${improvements.formatting_score >= 80 ? 'bg-accent' : 'bg-primary'}`} style={{ width: `${improvements.formatting_score}%` }}></div>
                          </div>
                        </div>

                        <div 
                          onClick={() => setActiveAccordion('impact')}
                          className={`p-3 rounded-xl cursor-pointer border transition-all ${activeAccordion === 'impact' ? 'bg-primary/10 border-primary/45 text-white' : 'bg-transparent border-transparent text-gray-400 hover:text-gray-200'}`}
                        >
                          <div className="flex justify-between text-xs font-bold mb-1.5">
                            <span>Impact & Metrics</span>
                            <span className={improvements.impact_score >= 80 ? "text-accent" : "text-primary"}>{improvements.impact_score}%</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-1.5 rounded-full ${improvements.impact_score >= 80 ? 'bg-accent' : 'bg-primary'}`} style={{ width: `${improvements.impact_score}%` }}></div>
                          </div>
                        </div>

                        <div 
                          onClick={() => setActiveAccordion('ats')}
                          className={`p-3 rounded-xl cursor-pointer border transition-all ${activeAccordion === 'ats' ? 'bg-primary/10 border-primary/45 text-white' : 'bg-transparent border-transparent text-gray-400 hover:text-gray-200'}`}
                        >
                          <div className="flex justify-between text-xs font-bold mb-1.5">
                            <span>ATS Compatibility</span>
                            <span className={improvements.ats_score >= 80 ? "text-accent" : "text-primary"}>{improvements.ats_score}%</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-1.5 rounded-full ${improvements.ats_score >= 80 ? 'bg-accent' : 'bg-primary'}`} style={{ width: `${improvements.ats_score}%` }}></div>
                          </div>
                        </div>

                        <div 
                          onClick={() => setActiveAccordion('skills')}
                          className={`p-3 rounded-xl cursor-pointer border transition-all ${activeAccordion === 'skills' ? 'bg-primary/10 border-primary/45 text-white' : 'bg-transparent border-transparent text-gray-400 hover:text-gray-200'}`}
                        >
                          <div className="flex justify-between text-xs font-bold mb-1.5">
                            <span>Skill Gaps</span>
                            <span className={improvements.skills_score >= 80 ? "text-accent" : "text-primary"}>{improvements.skills_score}%</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-1.5 rounded-full ${improvements.skills_score >= 80 ? 'bg-accent' : 'bg-primary'}`} style={{ width: `${improvements.skills_score}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Suggestions Details */}
                    <div className="glass-panel p-6 rounded-3xl md:col-span-2">
                      {activeAccordion === 'formatting' && (
                        <div>
                          <h4 className="text-base font-bold text-white mb-4 border-b border-gray-800 pb-2">Formatting & Structure Recommendations</h4>
                          <ul className="space-y-3.5">
                            {improvements.formatting_feedback.map((f, i) => (
                              <li key={i} className="flex gap-3 text-xs text-gray-300 leading-relaxed items-start">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {activeAccordion === 'impact' && (
                        <div>
                          <h4 className="text-base font-bold text-white mb-4 border-b border-gray-800 pb-2">Impact & Quantifiable Result Feedback</h4>
                          <ul className="space-y-3.5">
                            {improvements.impact_feedback.map((f, i) => (
                              <li key={i} className="flex gap-3 text-xs text-gray-300 leading-relaxed items-start">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {activeAccordion === 'ats' && (
                        <div>
                          <h4 className="text-base font-bold text-white mb-4 border-b border-gray-800 pb-2">ATS Scan Compatibility Suggestions</h4>
                          <ul className="space-y-3.5">
                            {improvements.ats_feedback.map((f, i) => (
                              <li key={i} className="flex gap-3 text-xs text-gray-300 leading-relaxed items-start">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {activeAccordion === 'skills' && (
                        <div>
                          <h4 className="text-base font-bold text-white mb-4 border-b border-gray-800 pb-2">Technical Skill Alignment Feedback</h4>
                          <ul className="space-y-3.5">
                            {improvements.skills_feedback.map((f, i) => (
                              <li key={i} className="flex gap-3 text-xs text-gray-300 leading-relaxed items-start">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="glass-panel p-16 rounded-3xl text-center flex flex-col items-center justify-center">
                    <Award className="w-12 h-12 text-primary/30 mb-4" />
                    <h4 className="text-white font-bold text-sm">Resume Evaluation Ready</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs mb-5">Click 'Evaluate' to run deep analysis based on the selected role profile.</p>
                    <button
                      onClick={() => fetchImprovements()}
                      className="px-5 py-2.5 bg-primary text-xs font-bold rounded-xl text-white hover:bg-primary/95 transition-colors"
                    >
                      Run Evaluation Now
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'rewrite' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Control bar */}
                <div className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">Rewrite Resume (crt Option)</h3>
                    <p className="text-xs text-gray-500">Generates a fully optimized professional Markdown resume based on target role parameters.</p>
                  </div>
                  <div className="flex gap-3">
                    <input 
                      type="text"
                      placeholder="e.g. Senior Machine Learning Engineer"
                      value={rewriteRole}
                      onChange={(e) => setRewriteRole(e.target.value)}
                      className="bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-2 text-xs outline-none focus:border-primary w-full sm:w-56"
                    />
                    <button
                      onClick={handleRewriteResume}
                      disabled={rewriteLoading || !rewriteRole.trim()}
                      className="px-5 py-2.5 bg-accent hover:bg-accent/95 text-xs font-bold text-white rounded-xl transition-all disabled:opacity-40 flex items-center gap-2 shrink-0 shadow-lg shadow-accent/15"
                    >
                      {rewriteLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Rewriting...</> : <><Sparkles className="w-3.5 h-3.5" /> Tailor Resume</>}
                    </button>
                  </div>
                </div>

                {rewriteLoading ? (
                  <div className="glass-panel p-20 rounded-3xl flex flex-col items-center justify-center text-center">
                    <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
                    <h4 className="text-white font-bold text-sm">Generating Tailored Resume...</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm">Applying Google X-Y-Z formula to bullet points, aligning tech stack terms, and matching job descriptions in RAG...</p>
                  </div>
                ) : rewrittenResume ? (
                  <div className="glass-panel rounded-3xl overflow-hidden border border-gray-800">
                    {/* Editor Toolbar */}
                    <div className="bg-gray-900/90 border-b border-gray-850 p-4 flex justify-between items-center">
                      <span className="text-xs font-bold text-accent flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> Customized Markdown Resume Generated
                      </span>
                      
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={handleCopyToClipboard}
                          className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-[10px] font-bold text-gray-300 hover:text-white rounded-lg flex items-center gap-1 border border-gray-700 transition-colors"
                        >
                          <Clipboard className="w-3.5 h-3.5" /> {copied ? "Copied!" : "Copy Raw"}
                        </button>
                        <button
                          onClick={handleDownloadMarkdown}
                          className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-[10px] font-bold text-gray-300 hover:text-white rounded-lg flex items-center gap-1 border border-gray-700 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> Markdown (.md)
                        </button>
                        <button
                          onClick={handleDownloadPDF}
                          className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-[10px] font-bold text-gray-300 hover:text-white rounded-lg flex items-center gap-1 border border-gray-700 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF (.pdf)
                        </button>
                        <button
                          onClick={handleDownloadDOCX}
                          className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-[10px] font-bold text-gray-300 hover:text-white rounded-lg flex items-center gap-1 border border-gray-700 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> Word (.docx)
                        </button>
                      </div>
                    </div>

                    {/* Paper Layout Document Preview */}
                    <div className="p-8 md:p-12 bg-gray-950/40 text-left font-serif overflow-y-auto max-h-[700px] border-t border-gray-900 select-text selection:bg-primary/20">
                      <div className="max-w-2xl mx-auto bg-gray-900 border border-gray-850 p-8 rounded-2xl shadow-xl">
                        {renderMarkdown(rewrittenResume)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="glass-panel p-16 text-center flex flex-col items-center justify-center">
                    <FileText className="w-12 h-12 text-primary/30 mb-4" />
                    <h4 className="text-white font-bold text-sm font-sans">No Tailored Resume Generated Yet</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mb-5 font-sans">Input your target career role above and click 'Tailor Resume' to generate a copy optimized with the Google X-Y-Z formula.</p>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Sticky Sidebar AI Career Copilot */}
          <div className="lg:col-span-1">
            <div className="glass-panel rounded-3xl flex flex-col h-[650px] border border-primary/10 shadow-2xl sticky top-24">
              
              <div className="p-4 border-b border-gray-800 flex items-center gap-3 bg-surface/20">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
                  <BrainCircuit className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">Career AI Copilot</h3>
                  <div className="text-[10px] text-accent flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span> Context Synced
                  </div>
                </div>
              </div>

              {/* Chat Message Box */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`max-w-[90%] p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-primary text-white rounded-br-none font-medium' 
                          : 'bg-gray-800/80 text-gray-200 rounded-bl-none border border-gray-800'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800 border border-gray-800 p-3 rounded-2xl rounded-bl-none text-xs text-gray-400 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> Thinking...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleChatSubmit} className="p-3 border-t border-gray-800 bg-gray-900/30 rounded-b-3xl">
                <div className="relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about salary, resume tips..."
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-3 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-primary transition-all placeholder:text-gray-500"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/95 disabled:opacity-40 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
              
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
