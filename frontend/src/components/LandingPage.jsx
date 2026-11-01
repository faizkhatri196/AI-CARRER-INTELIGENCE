import React from 'react';
import { 
  Sparkles, CheckCircle2, ArrowRight, ShieldCheck, 
  Users, Briefcase, FileText, Cpu, BarChart3, Search, 
  Zap, Award, RefreshCw, Compass
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage({ onSelectExperience }) {
  return (
    <div className="min-h-screen bg-[#070b14] text-gray-100 flex flex-col overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-28 px-4 sm:px-6 lg:px-8">
        {/* Subtle grid background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[700px] h-[300px] sm:h-[400px] bg-gradient-to-tr from-blue-600/15 via-indigo-600/15 to-emerald-500/10 blur-[100px] sm:blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6 max-w-full truncate"
          >
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Next-Gen Career & Recruitment Intelligence</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.2] sm:leading-[1.15]"
          >
            Talent Discovery Beyond Keywords. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
              Explainable AI for Both Sides of Hiring.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-5 sm:mt-6 text-sm sm:text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto font-normal leading-relaxed"
          >
            Eliminate keyword-only ATS rejections. Discover hidden engineering capability, 
            evaluate candidates across 8 explainable dimensions, and optimize resumes with verifiable evidence.
          </motion.p>

          {/* Dual Action Gateway Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 sm:mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto text-left"
          >
            {/* Candidate Card */}
            <div 
              onClick={() => onSelectExperience('candidate')}
              className="group cursor-pointer p-5 sm:p-7 rounded-2xl bg-[#0f172a]/90 border border-gray-800 hover:border-blue-500/60 transition-all hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 relative"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                For Individuals
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-3 group-hover:text-blue-300 transition-colors">
                Candidate Career Intelligence
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-2 leading-relaxed">
                Upload your resume to discover suitable roles, uncover hidden transferable skills, 
                and redesign your resume into 6 ATS-optimized formats.
              </p>
              <div className="mt-5 flex items-center text-xs font-semibold text-blue-400 group-hover:translate-x-1 transition-transform min-h-[36px]">
                <span>Enter Candidate Experience</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </div>
            </div>

            {/* Recruiter Card */}
            <div 
              onClick={() => onSelectExperience('recruiter')}
              className="group cursor-pointer p-5 sm:p-7 rounded-2xl bg-[#0f172a]/90 border border-gray-800 hover:border-indigo-500/60 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 relative"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                For HR & Talent Teams
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-3 group-hover:text-indigo-300 transition-colors">
                Recruitment Intelligence
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-2 leading-relaxed">
                Upload 250+ resumes simultaneously. Rank candidates with configurable 8-dimension weights, 
                anonymized fair screening, and side-by-side comparisons.
              </p>
              <div className="mt-5 flex items-center text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform min-h-[36px]">
                <span>Launch Recruiter Workspace</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-12 sm:py-16 border-t border-gray-800/80 bg-[#090e1a]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <h2 className="text-xl sm:text-3xl font-extrabold text-white">
              Engineered with Integrity. Driven by Evidence.
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              Every score is explainable, deterministic, and grounded in actual resume text.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-5 sm:p-6 rounded-2xl bg-gray-900/60 border border-gray-800">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-white">Hidden & Transferable Skills</h4>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Identifies demonstrated engineering execution even when keywords differ (e.g. FastAPI & AWS implies API Architecture & Cloud Deployment).
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-gray-900/60 border border-gray-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-white">Responsible Fair Screening</h4>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Zero weight on names, gender, age, or photos. Features an Anonymized Screening View to eliminate unconscious bias in screening.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-gray-900/60 border border-gray-800">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-white">Configurable 8-Dimension Scoring</h4>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Separate ATS scores, technical skills coverage, experience duration, practical project evidence, and quantifiable business outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-800 py-6 text-center text-xs text-gray-500 px-4">
        <p>AI Career & Recruitment Intelligence 2.0 • Production Ready Architecture</p>
      </footer>
    </div>
  );
}
