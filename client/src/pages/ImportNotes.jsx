import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, FileText, Sparkles, Sliders, 
  AlertCircle, ArrowRight, Loader2, BookOpen, Database, Folder
} from 'lucide-react';
import { sampleNotes } from '../utils/sampleNotes';
import { api } from '../services/api';
import AnimatedProgress from '../components/AnimatedProgress';

export default function ImportNotes({ onStudyKitGenerated }) {
  const [activeTab, setActiveTab] = useState('paste'); // 'paste', 'upload', 'saved'
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Computer Science');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [savedNotes, setSavedNotes] = useState([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'saved') {
      loadSavedNotes();
    }
  }, [activeTab]);

  const loadSavedNotes = async () => {
    setIsLoadingSaved(true);
    try {
      const res = await api.getNotes();
      setSavedNotes(res.notes || []);
    } catch (err) {
      console.error('Failed to load saved notes:', err);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handleLoadSample = (sampleId) => {
    const sample = sampleNotes.find(s => s.id === sampleId);
    if (sample) {
      setTitle(sample.title);
      setSubject(sample.subject);
      setDifficulty(sample.difficulty);
      setText(sample.text);
      setActiveTab('paste');
      setError('');
    }
  };

  const handleSelectSavedNote = (note) => {
    setTitle(note.title);
    setSubject(note.subject || 'General');
    setText(note.extractedText || note.rawText || '');
    setActiveTab('paste');
    setError('');
  };

  const handleStudySavedNoteDirectly = async (note) => {
    setTitle(note.title);
    setSubject(note.subject || 'General');
    setText(note.extractedText || note.rawText || '');
    
    setIsGenerating(true);
    setError('');

    try {
      const result = await api.generateStudyKit({
        text: note.extractedText || note.rawText || note.title,
        title: note.title,
        subject: note.subject || 'General',
        difficulty,
        questionCount
      });

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
        setActiveTab('paste');
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Animated generation modal */}
      <AnimatedProgress isGenerating={isGenerating} />

      {/* Header */}
      <div className="space-y-1.5 border-b border-[#e0e2e8] pb-6">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8e91a0]">
            Study Entry
          </span>
          <span className="w-1 h-1 rounded-full bg-[#8e91a0]"></span>
          <span className="badge-pill badge-yellow text-[10px]">
            Active Learning
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1c1c1e] tracking-tight">
          Create a New Study Kit
        </h1>
        <p className="text-sm text-[#555a6a]">
          Paste raw notes, upload documents, or choose saved materials. Pocket Mentor turns them into structured concepts, flashcards, and quizzes.
        </p>
      </div>

      {/* 1-Click Demo Samples Bar */}
      <div className="card-miro p-4 border-[#e0e2e8] bg-[#fafbfc] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-[#1c1c1e]">
          <Database className="w-4 h-4 text-[#ffd02f]" />
          <span>Quick Sample Notes:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {sampleNotes.map(sample => (
            <button
              key={sample.id}
              onClick={() => handleLoadSample(sample.id)}
              className="px-3 py-1.5 rounded-full bg-white border border-[#e0e2e8] text-xs font-medium text-[#555a6a] hover:text-[#1c1c1e] hover:border-[#1c1c1e] transition-all"
            >
              <span className="font-semibold text-[#1c1c1e]">{sample.subject}:</span> {sample.title.split(':')[1] || sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Form Container */}
      <div className="card-miro border-[#e0e2e8] bg-white p-6 sm:p-8 space-y-6">
        
        {/* Source Switcher Tabs */}
        <div className="flex border-b border-[#eef0f3] pb-3 gap-6">
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center space-x-2 pb-2 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'paste'
                ? 'border-[#1c1c1e] text-[#1c1c1e]'
                : 'border-transparent text-[#8e91a0] hover:text-[#1c1c1e]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Paste Text Notes</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center space-x-2 pb-2 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'upload'
                ? 'border-[#1c1c1e] text-[#1c1c1e]'
                : 'border-transparent text-[#8e91a0] hover:text-[#1c1c1e]'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center space-x-2 pb-2 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'saved'
                ? 'border-[#1c1c1e] text-[#1c1c1e]'
                : 'border-transparent text-[#8e91a0] hover:text-[#1c1c1e]'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>Saved Notes</span>
          </button>
        </div>

        {/* Tab 1: Upload Dropzone */}
        {activeTab === 'upload' && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#c7cad5] hover:border-[#1c1c1e] rounded-2xl p-10 text-center cursor-pointer transition-colors bg-[#fafbfc] group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#fff8e0] border border-[#ffd02f]/50 flex items-center justify-center text-[#1c1c1e]">
              {isExtracting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
            </div>
            <p className="text-sm font-bold text-[#1c1c1e] mb-1">
              {selectedFile ? selectedFile.name : 'Click to select or drop documents here'}
            </p>
            <p className="text-xs text-[#8e91a0]">
              Supports PDF, DOCX, and TXT files up to 10MB
            </p>
          </div>
        )}

        {/* Tab 2: Saved Notes List */}
        {activeTab === 'saved' && (
          <div className="space-y-3">
            {isLoadingSaved ? (
              <div className="p-8 text-center text-xs text-[#8e91a0] flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading saved materials…</span>
              </div>
            ) : savedNotes.length > 0 ? (
              <div className="space-y-2">
                {savedNotes.map((n) => (
                  <div
                    key={n._id}
                    className="p-4 rounded-xl border border-[#e0e2e8] bg-white hover:bg-[#fafbfc] flex items-center justify-between transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="badge-pill badge-neutral text-[10px]">
                          {n.subject || 'General'}
                        </span>
                        <span className="text-xs font-semibold text-[#1c1c1e]">
                          {n.title}
                        </span>
                      </div>
                      <p className="text-xs text-[#8e91a0] line-clamp-1">
                        {n.extractedText ? `${n.extractedText.slice(0, 80)}…` : 'Raw note content'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSelectSavedNote(n)}
                        className="btn-ghost text-xs px-3 py-1.5"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleStudySavedNoteDirectly(n)}
                        className="btn-primary text-xs px-3.5 py-1.5"
                      >
                        Study this
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[#8e91a0] rounded-xl bg-[#fafbfc] border border-dashed border-[#e0e2e8]">
                Your study workspace has no saved notes yet. Paste or upload notes above to begin.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Paste & Config Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2c2c34] mb-1.5">
                Topic or Lecture Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Operating Systems: Deadlock Handling"
                className="input-miro w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2c2c34] mb-1.5">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Computer Science, Neuroscience, Economics"
                className="input-miro w-full"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#2c2c34]">
                Note Content
              </label>
              <span className="text-xs text-[#8e91a0] font-mono">
                {text ? `${text.split(/\s+/).filter(Boolean).length} words` : '0 words'}
              </span>
            </div>
            <textarea
              rows={9}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your raw lecture notes, bullet points, textbook summaries, or formulas here..."
              className="input-miro w-full leading-relaxed resize-y font-sans"
            />
          </div>

          {/* AI Settings */}
          <div className="p-4 rounded-xl bg-[#f7f8fa] border border-[#eef0f3] space-y-3">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#8e91a0] uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-[#1c1c1e]" />
              <span>Study Kit Configuration</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#555a6a] mb-1.5">Depth / Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Easy', 'Medium', 'Hard'].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`py-1.5 rounded-full text-xs font-medium transition-all border ${
                        difficulty === d
                          ? 'bg-[#1c1c1e] text-white border-[#1c1c1e]'
                          : 'bg-white text-[#555a6a] border-[#e0e2e8] hover:text-[#1c1c1e]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#555a6a] mb-1.5">Quiz Length</label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 5, 8, 10].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setQuestionCount(c)}
                      className={`py-1.5 rounded-full text-xs font-mono font-medium transition-all border ${
                        questionCount === c
                          ? 'bg-[#1c1c1e] text-white border-[#1c1c1e]'
                          : 'bg-white text-[#555a6a] border-[#e0e2e8] hover:text-[#1c1c1e]'
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
            <div className="p-3.5 rounded-xl bg-[#ffc6c6]/40 border border-[#ff9999] text-[#600000] text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit CTA */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !text.trim()}
            className="btn-primary w-full py-3.5 text-sm font-semibold"
          >
            <Sparkles className="w-4 h-4 mr-2 text-[#ffd02f]" />
            <span>Generate Study Kit</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>

      </div>
    </div>
  );
}
