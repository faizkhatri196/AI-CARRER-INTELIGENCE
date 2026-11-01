import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../utils/api';
import { 
  UploadCloud, FileText, CheckCircle2, AlertTriangle, 
  Copy, X, Loader2, ArrowRight
} from 'lucide-react';

export default function BatchUploadModal({ isOpen, job, onClose, onBatchCompleted }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [batchId, setBatchId] = useState(null);
  const [batchStatus, setBatchStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let interval = null;
    if (batchId && batchStatus?.status === 'processing') {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(getApiUrl(`/api/screening/batch/${batchId}`));
          setBatchStatus(res.data);
          if (res.data.status === 'completed' || res.data.status === 'partially_completed' || res.data.status === 'failed') {
            clearInterval(interval);
            onBatchCompleted && onBatchCompleted();
          }
        } catch (err) {
          console.error("Batch polling error:", err);
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [batchId, batchStatus]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files) {
      const validFiles = Array.from(e.target.files).filter(f => {
        const name = f.name.toLowerCase();
        return name.endsWith('.pdf') || name.endsWith('.docx') || name.endsWith('.doc') || name.endsWith('.txt');
      });
      setSelectedFiles(validFiles);
    }
  };

  const handleStartIngestion = async () => {
    if (!selectedFiles.length || !job) return;
    setUploading(true);
    setError('');

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });
    formData.append('job_id', job.id);

    try {
      const res = await axios.post(getApiUrl('/api/screening/upload-batch'), formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setBatchId(res.data.batch_id);
      setBatchStatus({
        status: 'processing',
        total_files: res.data.total_files,
        received: res.data.total_files,
        parsed: 0,
        duplicates: 0,
        failed: 0
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to initialize batch upload.');
    } finally {
      setUploading(false);
    }
  };

  const progressPercent = batchStatus && batchStatus.total_files > 0
    ? Math.round(((batchStatus.parsed + batchStatus.duplicates + batchStatus.failed) / batchStatus.total_files) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-[#0f172a] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Bulk Resume Ingestion Pipeline</h3>
            <p className="text-xs text-gray-400">
              Role: <strong className="text-white">{job?.title}</strong>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!batchId ? (
          <div className="space-y-4">
            {/* Drag & Drop Box */}
            <label className="border-2 border-dashed border-gray-700 hover:border-indigo-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-gray-900/40 hover:bg-gray-900/80 transition-all text-center">
              <UploadCloud className="w-10 h-10 text-indigo-400 mb-2" />
              <span className="text-xs font-bold text-white block">
                {selectedFiles.length > 0 ? `${selectedFiles.length} files selected` : 'Drag and drop multiple resumes or click to browse'}
              </span>
              <span className="text-[11px] text-gray-400 mt-1">
                Supported: PDF, DOCX, TXT • Up to 250 files per batch
              </span>
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {selectedFiles.length > 0 && (
              <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-gray-900 rounded-xl border border-gray-800 text-xs text-gray-300">
                {selectedFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between py-1 px-2">
                    <span className="truncate max-w-[80%] font-mono text-[11px]">{f.name}</span>
                    <span className="text-[10px] text-gray-500">{(f.size / 1024).toFixed(0)} KB</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleStartIngestion}
              disabled={uploading || !selectedFiles.length}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Batch to Queue...</span>
                </>
              ) : (
                <span>Start Batch Ingestion ({selectedFiles.length} Resumes)</span>
              )}
            </button>
          </div>
        ) : (
          /* Live Batch Progress Panel */
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-gray-300">
                  Processing Queue ({batchStatus?.status === 'processing' ? 'Active Worker' : 'Finished'})
                </span>
                <span className="font-bold text-indigo-400">{progressPercent}%</span>
              </div>
              <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Real stats breakdown */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Received</span>
                <span className="text-lg font-bold text-white">{batchStatus?.received || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <span className="text-[10px] text-emerald-400 font-bold uppercase block">Parsed</span>
                <span className="text-lg font-bold text-emerald-400">{batchStatus?.parsed || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <span className="text-[10px] text-amber-400 font-bold uppercase block">Duplicates</span>
                <span className="text-lg font-bold text-amber-400">{batchStatus?.duplicates || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                <span className="text-[10px] text-rose-400 font-bold uppercase block">Failed</span>
                <span className="text-lg font-bold text-rose-400">{batchStatus?.failed || 0}</span>
              </div>
            </div>

            {batchStatus?.status !== 'processing' && (
              <div className="text-center pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
                >
                  View Ranked Candidate Pool
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

