'use client';

import { useState } from 'react';
import { Sidebar } from '../../../components/ui/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  FileText, 
  BarChart2, 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  Loader2,
  XCircle,
  Database,
  PieChart,
  Activity,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from 'recharts';
import api from '../../../lib/api';

interface AnalysisResult {
  success: boolean;
  summary: {
    total_rows: number;
    total_columns: number;
    memory_usage_mb: number;
    missing_values_count: number;
    duplicate_rows: number;
  };
  columns: {
    name: string;
    type: string;
    missing: number;
    unique: number;
    mean?: number;
    min?: number;
    max?: number;
    std?: number;
  }[];
  anomalies: {
    row_index: number;
    data: any;
  }[];
  correlations: Record<string, number>;
  insights: {
    type: string;
    severity: string;
    message: string;
  }[];
  ai_summary?: string;
  error?: string;
}

export default function AnalyticsAgentPage() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    const validTypes = [
      'text/csv', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
      'application/vnd.ms-excel'
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.parquet')) {
      setError('Unsupported file format. Please upload CSV, Excel, JSON, or Parquet.');
      return;
    }
    if (file.size > 250 * 1024 * 1024) { // 250MB
        setError('File size exceeds 250MB limit.');
        return;
    }
    
    setFile(file);
    setError(null);
    setResult(null);
  };

  const startAnalysis = async () => {
    if (!file) return;
    
    setAnalyzing(true);
    setProgress(10);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
        // Simulate progress for UX
        const interval = setInterval(() => {
            setProgress(prev => Math.min(prev + 5, 90));
        }, 500);

        const response = await api.post('/api/analytics/analyze', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 300000 // 5 minutes
        });

        clearInterval(interval);
        setProgress(100);
        
        if (response.data.success) {
            setResult(response.data);
        } else {
            setError(response.data.error || 'Analysis failed');
        }
    } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.error || err.message || 'Failed to connect to analytics engine');
    } finally {
        setAnalyzing(false);
    }
  };

  const downloadReport = (format: 'pdf' | 'pptx') => {
      if (!result) return;
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-report.${format === 'pdf' ? 'json' : 'json'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-purple-900/10 to-pink-900/10 pointer-events-none" />
        
        <header className="mb-8 relative z-10">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center mb-2">
                    <div className="p-2 bg-indigo-500/20 rounded-lg mr-3">
                        <Zap className="text-indigo-400" size={24} />
                    </div>
                    <h1 className="text-3xl font-bold text-white">AI Analytics Agent</h1>
                </div>
                <p className="text-gray-400 max-w-2xl">
                    Upload your raw data files and let our AI agent perform comprehensive analysis, 
                    detect anomalies, and generate actionable insights in minutes.
                </p>
            </motion.div>
        </header>

        {/* File Upload Section */}
        {!result && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-3xl mx-auto mt-12 relative z-10"
            >
                <div 
                    className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
                        dragActive 
                        ? 'border-indigo-500 bg-indigo-500/10' 
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input 
                        type="file" 
                        id="file-upload" 
                        className="hidden" 
                        onChange={handleChange}
                        accept=".csv,.xlsx,.xls,.json,.parquet"
                    />
                    
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            {analyzing ? (
                                <Loader2 className="animate-spin text-white" size={40} />
                            ) : (
                                <UploadCloud className="text-white" size={40} />
                            )}
                        </div>
                        
                        {analyzing ? (
                            <div className="w-full max-w-xs">
                                <h3 className="text-xl font-bold text-white mb-2">Analyzing Dataset...</h3>
                                <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                                    <div 
                                        className="bg-indigo-500 h-2 rounded-full transition-all duration-500" 
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-sm text-gray-400">Processing rows and detecting patterns</p>
                            </div>
                        ) : file ? (
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">{file.name}</h3>
                                <p className="text-sm text-gray-400 mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                <div className="flex space-x-4 justify-center">
                                    <button 
                                        onClick={() => setFile(null)}
                                        className="px-6 py-2 rounded-xl text-gray-400 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={startAnalysis}
                                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all"
                                    >
                                        Start Analysis
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-xl font-bold text-white">
                                    Drag & Drop your dataset here
                                </h3>
                                <p className="text-gray-400">
                                    Supports CSV, Excel, JSON, Parquet (Max 250MB)
                                </p>
                                <label 
                                    htmlFor="file-upload" 
                                    className="mt-4 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium cursor-pointer transition-colors inline-block"
                                >
                                    Browse Files
                                </label>
                            </>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center text-red-400">
                        <AlertTriangle className="mr-3" size={20} />
                        {error}
                    </div>
                )}
            </motion.div>
        )}

        {/* Analysis Results */}
        {result && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 relative z-10"
            >
                {/* Actions Bar */}
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div className="flex items-center">
                        <FileText className="text-indigo-400 mr-3" size={24} />
                        <div>
                            <h2 className="font-bold text-white">Analysis Report: {file?.name}</h2>
                            <p className="text-xs text-gray-400">{new Date().toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        <button 
                            onClick={() => downloadReport('pdf')}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium flex items-center transition-colors"
                        >
                            <Download size={16} className="mr-2" />
                            PDF Report
                        </button>
                        <button 
                            onClick={() => downloadReport('pptx')}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium flex items-center shadow-lg shadow-indigo-500/20 transition-colors"
                        >
                            <Download size={16} className="mr-2" />
                            PowerPoint
                        </button>
                        <button 
                            onClick={() => setResult(null)}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <XCircle size={20} />
                        </button>
                    </div>
                </div>

                {/* Executive Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <p className="text-gray-400 text-xs uppercase mb-1">Data Volume</p>
                        <h3 className="text-2xl font-bold text-white">{result.summary.total_rows.toLocaleString()} <span className="text-sm font-normal text-gray-500">rows</span></h3>
                        <div className="mt-2 text-xs text-gray-400 flex items-center">
                            <Database size={12} className="mr-1" />
                            {result.summary.memory_usage_mb.toFixed(2)} MB Memory Usage
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <p className="text-gray-400 text-xs uppercase mb-1">Data Quality Score</p>
                        <div className="flex items-center">
                            <h3 className="text-2xl font-bold text-white">
                                {Math.max(0, 100 - (result.summary.missing_values_count / result.summary.total_rows * 100) - (result.summary.duplicate_rows / result.summary.total_rows * 100)).toFixed(0)}
                            </h3>
                            <span className="text-sm text-gray-500 ml-1">/ 100</span>
                        </div>
                        <div className="mt-2 text-xs text-gray-400 flex items-center">
                            <ShieldCheck size={12} className="mr-1 text-emerald-400" />
                            Based on missing & duplicates
                        </div>
                    </div>
                     <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <p className="text-gray-400 text-xs uppercase mb-1">Features</p>
                        <h3 className="text-2xl font-bold text-white">{result.summary.total_columns}</h3>
                        <div className="mt-2 text-xs text-gray-400">
                            {result.columns.filter(c => c.type.includes('float') || c.type.includes('int')).length} Numeric, {' '}
                            {result.columns.filter(c => c.type.includes('object') || c.type.includes('string')).length} Categorical
                        </div>
                    </div>
                     <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <p className="text-gray-400 text-xs uppercase mb-1">Anomalies Detected</p>
                        <h3 className="text-2xl font-bold text-white">{result.anomalies.length}</h3>
                        <div className="mt-2 text-xs text-gray-400 flex items-center">
                            <AlertTriangle size={12} className="mr-1 text-yellow-500" />
                            Requires attention
                        </div>
                    </div>
                </div>

                {/* AI Executive Summary */}
                {result.ai_summary && (
                    <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                            <Zap className="mr-2 text-indigo-400" size={20} />
                            AI Executive Summary
                            <span className="ml-2 text-xs font-normal bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full">MiniMax M2.5</span>
                        </h3>
                        <p className="text-gray-300 leading-relaxed">{result.ai_summary}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Insights Panel */}
                    <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                            <Activity className="mr-2 text-indigo-400" size={20} />
                            AI Insights
                        </h3>
                        <div className="space-y-4">
                            {result.insights.length === 0 ? (
                                <p className="text-gray-400 text-sm">No critical issues found. Data looks clean!</p>
                            ) : (
                                result.insights.map((insight, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl border ${
                                        insight.severity === 'High' 
                                        ? 'bg-red-500/10 border-red-500/20' 
                                        : insight.severity === 'Low'
                                        ? 'bg-blue-500/10 border-blue-500/20'
                                        : 'bg-yellow-500/10 border-yellow-500/20'
                                    }`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                insight.severity === 'High' ? 'bg-red-500 text-white' 
                                                : insight.severity === 'Low' ? 'bg-blue-500 text-white'
                                                : 'bg-yellow-500 text-black'
                                            }`}>
                                                {insight.type}
                                            </span>
                                            <span className="text-xs text-gray-400">{insight.severity} Severity</span>
                                        </div>
                                        <p className="text-sm text-gray-300 mt-2">{insight.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Numeric Distribution Chart */}
                    <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                            <BarChart2 className="mr-2 text-indigo-400" size={20} />
                            Feature Distributions (Top Numeric)
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={result.columns.filter(c => c.mean !== undefined).slice(0, 5)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="mean" name="Mean Value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Column Profiling Table */}
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h3 className="text-lg font-bold text-white">Data Dictionary & Profiling</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-black/20 text-gray-400 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Column Name</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Missing</th>
                                    <th className="px-6 py-4">Unique</th>
                                    <th className="px-6 py-4">Min</th>
                                    <th className="px-6 py-4">Max</th>
                                    <th className="px-6 py-4">Mean</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {result.columns.map((col, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{col.name}</td>
                                        <td className="px-6 py-4 text-gray-400 font-mono text-xs">{col.type}</td>
                                        <td className="px-6 py-4">
                                            {col.missing > 0 ? (
                                                <span className="text-red-400">{col.missing}</span>
                                            ) : (
                                                <span className="text-emerald-400 flex items-center"><CheckCircle size={12} className="mr-1"/> 0</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">{col.unique}</td>
                                        <td className="px-6 py-4 text-gray-400 text-xs">{col.min !== undefined ? col.min.toFixed(2) : '-'}</td>
                                        <td className="px-6 py-4 text-gray-400 text-xs">{col.max !== undefined ? col.max.toFixed(2) : '-'}</td>
                                        <td className="px-6 py-4 text-gray-400 text-xs">{col.mean !== undefined ? col.mean.toFixed(2) : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        )}
      </main>
    </div>
  );
}
