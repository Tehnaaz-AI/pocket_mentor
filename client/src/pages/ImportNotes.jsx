import React, { useState, useRef } from 'react';
import { 
  Upload, FileText, Sparkles, Sliders, CheckCircle2, 
  AlertCircle, ArrowRight, Loader2, BookOpen, Database 
} from 'lucide-react';
import { sampleNotes } from '../utils/sampleNotes';
import { api } from '../services/api';
import AnimatedProgress from '../components/AnimatedProgress';

export default function ImportNotes({ onStudyKitGenerated }) {
  const [activeTab, setActiveTab] = useState('paste'); // 'upload' or 'paste'
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Computer Science');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  // Quick loader for sample notes
  const handleLoadSample = (sampleId) => {
    const sample = sampleNotes.find(s => s.id === sampleId);
    if (sample) {
      setTitle(sample.title);
      setSubject(sample.subject);
      setDifficulty(sample.difficulty);
      setText(sample.text);
      setError('');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsExtracting(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name.replace(/\.[^/.]+$/, ''));
    formData.append('subject', subject);

    try {
      const res = await api.uploadNoteFile(formData);
      if (res.note) {
        setText(res.note.extractedText);
        if (!title) setTitle(res.note.title);
      }
    } catch (err) {
      setError(err.message || 'Failed to extract text from file.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerate = async () => {
    if (!text || text.trim().length < 20) {
      setError('Please provide at least 20 characters of lecture or revision notes.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const result = await api.generateStudyKit({
        text,
        title: title || `${subject} Revision Kit`,
        subject,
        difficulty,
        questionCount
      });

      // Small delay to allow the stage visualizer to complete
      setTimeout(() => {
        setIsGenerating(false);
        if (onStudyKitGenerated) {
          onStudyKitGenerated(result.sessionId);
        }
      }, 3500);

    } catch (err) {
      setIsGenerating(false);
      setError(err.message || 'Failed to generate study kit.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Visualizer modal while generating */}
      <AnimatedProgress isGenerating={isGenerating} />

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Step 1: Ingest & Configure</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Import Class Notes & Lecture Materials
        </h1>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Paste your rough notes or upload course documents. You will be able to preview and tweak before AI synthesizes your study kit.
        </p>
      </div>

      {/* Preloaded Sample Notes Bar (For Fast Reviewing!) */}
      <div className="card-glass p-4 rounded-2xl border border-brand-500/20 bg-brand-950/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-brand-300">
          <Database className="w-4 h-4 text-brand-400" />
          <span>1-Click Test Notes:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {sampleNotes.map(sample => (
            <button
              key={sample.id}
              onClick={() => handleLoadSample(sample.id)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-brand-500/30 text-slate-300 hover:text-white hover:border-brand-400 text-xs font-semibold transition-all flex items-center space-x-1.5"
            >
              <span>{sample.subject}:</span>
              <span className="text-brand-300">{sample.title.split(':')[1] || sample.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Mode Tabs: Upload File or Paste Notes */}
      <div className="card-glass rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6">
        <div className="flex border-b border-white/10 pb-4 gap-4">
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center space-x-2 pb-2 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'paste'
                ? 'border-brand-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Paste Notes Directly</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center space-x-2 pb-2 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'upload'
                ? 'border-brand-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document (PDF / DOCX / TXT)</span>
          </button>
        </div>

        {/* Upload Mode Area */}
        {activeTab === 'upload' && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/15 hover:border-brand-500/50 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-900/40 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400 group-hover:scale-110 transition-transform">
              {isExtracting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
            </div>
            <p className="text-sm font-bold text-white mb-1">
              {selectedFile ? selectedFile.name : 'Click to select or drag and drop files here'}
            </p>
            <p className="text-xs text-slate-400">
              Supports PDF, DOCX, and TXT up to 10MB
            </p>
          </div>
        )}

        {/* Metadata Configuration Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Note Topic / Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Operating Systems: Process Synchronization"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Academic Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Computer Science, Medicine, History"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
        </div>

        {/* Note Content Preview & Editor */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Extracted Notes Content (Editable Preview)
            </label>
            <span className="text-xs text-slate-500 font-mono">
              {text ? `${text.split(/\s+/).filter(Boolean).length} words` : '0 words'}
            </span>
          </div>
          <textarea
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your raw lecture notes, bullet points, study guides, or summaries here..."
            className="w-full p-4 rounded-2xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-sm font-sans focus:outline-none focus:border-brand-500 transition-colors leading-relaxed shadow-inner"
          />
        </div>

        {/* Study Kit Generation Parameters */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-brand-400" />
            <span>AI Generation Settings</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Difficulty */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Target Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {['Easy', 'Medium', 'Hard'].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      difficulty === d
                        ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-600/20'
                        : 'bg-slate-900 text-slate-400 border-white/5 hover:text-slate-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Quiz Question Count */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Quiz Question Count</label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 8, 10].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setQuestionCount(c)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      questionCount === c
                        ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-600/20'
                        : 'bg-slate-900 text-slate-400 border-white/5 hover:text-slate-200'
                    }`}
                  >
                    {c} Qs
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Generate Study Kit Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !text.trim()}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-40 text-white text-base font-bold shadow-xl shadow-brand-600/25 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01]"
        >
          <Sparkles className="w-5 h-5 text-amber-300" />
          <span>Generate Structured Study Kit</span>
          <ArrowRight className="w-5 h-5 ml-1" />
        </button>
      </div>
    </div>
  );
}
