import React, { useState } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../utils/api';
import { 
  FileText, Download, Sparkles, RefreshCw, Copy, Check, 
  Layers, Eye, Edit3, Columns, ArrowLeftRight, Loader2, Award
} from 'lucide-react';

const TEMPLATES = [
  { id: 'Modern Professional', name: 'Modern Professional', desc: 'Clean dual-accent layout favored by tech scaleups' },
  { id: 'FAANG Minimal', name: 'FAANG Minimal', desc: 'Ultra-dense, single-column ATS format for Big Tech' },
  { id: 'Technical Engineer', name: 'Technical Engineer', desc: 'Emphasizes stack breadth, architecture, & systems' },
  { id: 'Executive', name: 'Executive', desc: 'Traditional serif typography with business leadership focus' },
  { id: 'Fresh Graduate', name: 'Fresh Graduate', desc: 'Projects & academic coursework highlighted upfront' },
  { id: 'Research / Academic', name: 'Research / Academic', desc: 'Publications, algorithms, and deep technical research' }
];

export default function ResumeStudioView({ profile }) {
  const [selectedTemplate, setSelectedTemplate] = useState('Modern Professional');
  const [targetRole, setTargetRole] = useState(profile?.recommended_role || 'Backend Engineer');
  const [rewrittenMarkdown, setRewrittenMarkdown] = useState('');
  const [loadingRewrite, setLoadingRewrite] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // 'split', 'editor', 'preview'

  const handleGenerateRewrite = async () => {
    if (!profile) return;
    setLoadingRewrite(true);
    try {
      const res = await axios.post(getApiUrl('/api/resume/rewrite'), {
        user_id: profile.user_id,
        target_role: targetRole,
        template_name: selectedTemplate
      });
      setRewrittenMarkdown(res.data.rewritten_markdown || '');
    } catch (err) {
      console.error("Rewrite error:", err);
    } finally {
      setLoadingRewrite(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!rewrittenMarkdown) return;
    setDownloadingPdf(true);
    try {
      const response = await axios.post(
        getApiUrl('/api/resume/download/pdf'),
        {
          markdown: rewrittenMarkdown,
          template_name: selectedTemplate,
          filename: `${profile?.name ? profile.name.replace(/\s+/g, '_') : 'Resume'}_Optimized`
        },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${profile?.name ? profile.name.replace(/\s+/g, '_') : 'Resume'}_Optimized.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!rewrittenMarkdown) return;
    setDownloadingDocx(true);
    try {
      const response = await axios.post(
        getApiUrl('/api/resume/download/docx'),
        {
          markdown: rewrittenMarkdown,
          template_name: selectedTemplate,
          filename: `${profile?.name ? profile.name.replace(/\s+/g, '_') : 'Resume'}_Optimized`
        },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${profile?.name ? profile.name.replace(/\s+/g, '_') : 'Resume'}_Optimized.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("DOCX download failed:", err);
    } finally {
      setDownloadingDocx(false);
    }
  };

  const handleCopy = () => {
    if (!rewrittenMarkdown) return;
    navigator.clipboard.writeText(rewrittenMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Studio Header & Template Picker */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Resume Redesign Studio</h3>
              <p className="text-xs text-gray-400">
                Rewrites existing bullet points using Google's X-Y-Z formula without inventing fake credentials.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Target Role (e.g. Backend Lead)"
              className="px-3.5 py-1.5 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-48"
            />
            <button
              onClick={handleGenerateRewrite}
              disabled={loadingRewrite}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {loadingRewrite ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>{rewrittenMarkdown ? 'Regenerate' : 'Optimize Resume'}</span>
            </button>
          </div>
        </div>

        {/* 6 ATS Templates */}
        <div className="pt-4 border-t border-gray-800">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-2">
            Choose Verified ATS Template:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl.id)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  selectedTemplate === tpl.id
                    ? 'border-blue-500 bg-blue-500/10 text-white shadow-sm'
                    : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                }`}
              >
                <span className="text-xs font-bold block">{tpl.name}</span>
                <span className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{tpl.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor & Side-by-Side Comparison Container */}
      {rewrittenMarkdown ? (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-gray-900/90 border border-gray-800">
            <div className="flex items-center gap-1.5 bg-gray-950 p-1 rounded-lg border border-gray-800">
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'split' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Side-by-Side</span>
              </button>
              <button
                onClick={() => setViewMode('editor')}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'editor' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editor</span>
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'preview' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700 text-xs text-gray-200 flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>

              <button
                onClick={handleDownloadDocx}
                disabled={downloadingDocx}
                className="px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700 text-xs text-gray-200 flex items-center gap-1.5 transition-colors"
              >
                {downloadingDocx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-blue-400" />}
                <span>Export DOCX</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
              >
                {downloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* View Modes */}
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left: Original Resume */}
              <div className="p-5 rounded-2xl bg-[#0f172a] border border-gray-800 flex flex-col">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-800">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Original Uploaded Text</span>
                  <span className="text-[10px] text-gray-500 font-mono">Source Resume</span>
                </div>
                <div className="flex-1 bg-gray-950 p-4 rounded-xl border border-gray-800/80 font-mono text-xs text-gray-400 whitespace-pre-wrap overflow-y-auto max-h-[550px]">
                  {profile?.resume_text || 'No resume uploaded.'}
                </div>
              </div>

              {/* Right: Redesigned Editable Resume */}
              <div className="p-5 rounded-2xl bg-[#0f172a] border border-gray-800 flex flex-col">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Optimized & Redesigned</span>
                    <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      {selectedTemplate}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">Click to edit directly</span>
                </div>
                <textarea
                  value={rewrittenMarkdown}
                  onChange={(e) => setRewrittenMarkdown(e.target.value)}
                  rows={22}
                  className="w-full flex-1 bg-gray-950 p-4 rounded-xl border border-gray-800 text-xs text-gray-200 font-mono focus:outline-none focus:border-blue-500 leading-relaxed resize-none"
                />
              </div>
            </div>
          )}

          {viewMode === 'editor' && (
            <div className="p-5 rounded-2xl bg-[#0f172a] border border-gray-800">
              <span className="text-xs font-bold text-gray-300 block mb-2">Markdown Content Editor</span>
              <textarea
                value={rewrittenMarkdown}
                onChange={(e) => setRewrittenMarkdown(e.target.value)}
                rows={24}
                className="w-full bg-gray-950 p-4 rounded-xl border border-gray-800 text-xs text-gray-200 font-mono focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>
          )}

          {viewMode === 'preview' && (
            <div className="max-w-3xl mx-auto p-8 rounded-2xl bg-white text-gray-900 shadow-2xl font-sans text-xs leading-relaxed space-y-4">
              <div className="whitespace-pre-wrap font-sans text-gray-800">
                {rewrittenMarkdown}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-[#0f172a] border border-dashed border-gray-800">
          <FileText className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-white">Resume Studio Ready</h4>
          <p className="text-xs text-gray-400 max-w-md mx-auto mt-1 mb-4">
            Click "Optimize Resume" above to synthesize an ATS-ready version with Google X-Y-Z bullet points tailored to your target role.
          </p>
          <button
            onClick={handleGenerateRewrite}
            disabled={loadingRewrite}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 inline-flex items-center gap-2"
          >
            {loadingRewrite ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Optimize for {targetRole}</span>
          </button>
        </div>
      )}
    </div>
  );
}

