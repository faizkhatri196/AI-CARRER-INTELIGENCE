import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { UploadCloud, CheckCircle, AlertCircle, Send, Loader2, TrendingUp, BookOpen, BrainCircuit, Building2, Map } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Dashboard({ user }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  
  const [chatMessages, setChatMessages] = useState([{ role: 'assistant', content: `Hi ${user.name}! I am your AI Career Advisor. Upload your resume to get started, or ask me any career-related questions!` }]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const [targetLevel, setTargetLevel] = useState('SDE1');
  const [updatingRoadmap, setUpdatingRoadmap] = useState(false);

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
      setProfile(response.data.profile);
      setTargetLevel(response.data.profile.predicted_level);
      setChatMessages(prev => [...prev, { role: 'assistant', content: `I've analyzed your resume! Your predicted job level is ${response.data.profile.predicted_level} with an estimated salary of ₹${response.data.profile.predicted_salary} LPA. Check out your roadmap and suggested companies! How can I help you improve?` }]);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {!profile ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
          <div className="glass-panel p-10 rounded-3xl max-w-2xl w-full text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-accent"></div>
            
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <UploadCloud className="w-10 h-10 text-primary" />
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2">Upload Your Resume</h1>
            <p className="text-gray-400 mb-8">Get instant AI-driven insights on your career level, salary prediction, and skill gaps.</p>
            
            <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 mb-6 hover:border-primary/50 transition-colors bg-gray-800/30">
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileChange} 
                className="hidden" 
                id="resume-upload" 
              />
              <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center">
                <span className="text-gray-300 font-medium mb-2">{file ? file.name : "Click to browse or drag PDF here"}</span>
                <span className="text-sm text-gray-500">Only PDF files supported</span>
              </label>
            </div>
            
            {error && <div className="text-red-400 text-sm mb-4 flex items-center justify-center gap-2"><AlertCircle className="w-4 h-4"/> {error}</div>}
            
            <button 
              onClick={handleUpload}
              disabled={loading || !file}
              className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-primary to-secondary hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Intelligence...</> : "Generate Insights"}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Header Card */}
            <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
              
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-1">
                    <CheckCircle className="text-accent w-6 h-6" /> Analysis Complete
                  </h2>
                  <p className="text-gray-400 text-sm">{profile.filename} • {profile.experience_years} Yrs Exp</p>
                </div>
                <button onClick={() => setProfile(null)} className="text-sm text-primary hover:text-white transition-colors">
                  Upload New
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-8">
                <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/50">
                  <div className="flex items-center gap-3 text-gray-400 mb-2">
                    <TrendingUp className="w-5 h-5 text-secondary" /> Predicted Level
                  </div>
                  <div className="text-3xl font-bold text-white">{profile.predicted_level}</div>
                </div>
                <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/50">
                  <div className="flex items-center gap-3 text-gray-400 mb-2">
                    <div className="w-5 h-5 text-accent font-bold text-xl flex items-center justify-center">₹</div> Estimated Package
                  </div>
                  <div className="text-3xl font-bold text-white">{profile.predicted_salary} <span className="text-lg font-medium text-gray-500">LPA</span></div>
                </div>
              </div>
            </div>

            {/* AI Career Analysis Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Skill Gap Analysis */}
              <div className="glass-panel p-6 rounded-3xl h-full">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" /> Skill Gap
                </h3>
                
                <div className="mb-6">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-400">Profile Match</span>
                    <span className="text-accent font-bold">{profile.match_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-accent to-primary h-2 rounded-full" style={{ width: `${profile.match_percentage}%` }}></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Current Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map(s => (
                        <span key={s} className="px-2 py-1 bg-primary/10 border border-primary/20 text-primary text-xs rounded-md">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">To Learn</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.missing_skills.map(s => (
                        <span key={s} className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-md">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Suggested Companies */}
              <div className="glass-panel p-6 rounded-3xl h-full flex flex-col">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-secondary" /> Target Companies
                </h3>
                <p className="text-sm text-gray-400 mb-4">Based on your {profile.predicted_level} profile, target these companies for optimal package:</p>
                <div className="flex flex-wrap gap-2">
                  {profile.suggested_companies?.map(company => (
                    <span key={company} className="px-3 py-1.5 bg-gray-800/80 border border-gray-700 text-gray-200 text-sm rounded-lg hover:border-secondary/50 transition-colors cursor-default">
                      {company}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Improvement Roadmap */}
            <div className="glass-panel p-8 rounded-3xl relative">
              {updatingRoadmap && (
                <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-3xl">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Map className="w-5 h-5 text-accent" /> Custom AI Roadmap
                </h3>
                
                <div className="flex items-center gap-3 bg-gray-800/80 p-2 rounded-xl border border-gray-700">
                  <span className="text-xs text-gray-400 font-medium">Target Level:</span>
                  <select 
                    value={targetLevel}
                    onChange={(e) => handleUpdateRoadmap(e.target.value)}
                    className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2 outline-none"
                  >
                    <option value="Intern">Intern (3-5 LPA)</option>
                    <option value="Fresher">Fresher (5-8 LPA)</option>
                    <option value="SDE1">SDE1 (8-15 LPA)</option>
                    <option value="SDE2">SDE2 (15-30 LPA)</option>
                    <option value="Senior">Senior (30+ LPA)</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-4">
                {profile.missing_skills.length > 0 ? (
                  profile.missing_skills.slice(0, 3).map((skill, index) => (
                    <div key={skill} className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-accent shrink-0">
                        {index + 1}
                      </div>
                      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 flex-1">
                        <h4 className="font-bold text-white mb-1">Master {skill.toUpperCase()}</h4>
                        <p className="text-sm text-gray-400">
                          Adding {skill} to your stack is a highly demanded skill for {profile.predicted_level} positions and will significantly increase your resume score.
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-green-400 flex items-center gap-3">
                    <CheckCircle className="w-6 h-6" /> You have all the core skills for your current target level! Focus on system design and scaling.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Sidebar Chatbot */}
          <div className="lg:col-span-1">
            <div className="glass-panel rounded-3xl flex flex-col h-[750px] border border-primary/20 shadow-xl shadow-primary/5 sticky top-20">
              
              <div className="p-5 border-b border-gray-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
                  <BrainCircuit className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Career AI Copilot</h3>
                  <div className="text-xs text-accent flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div> Online
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800 border border-gray-700 p-3 rounded-2xl rounded-bl-none text-sm text-gray-400 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleChatSubmit} className="p-4 border-t border-gray-800 bg-gray-900/50 rounded-b-3xl">
                <div className="relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask for roadmap, tips..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/80 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
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
