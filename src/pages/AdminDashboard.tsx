import { useEffect, useState } from 'react';
import {
  Lock, BarChart3, Users, TrendingUp, Award,
  Copy, Download, Plus, Trash2, Edit, Check, X,
  Search, Eye, EyeOff, ChevronDown, BookOpen, FileQuestion
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import type { TestResult, UniqueCode, Video, Question } from '../types';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'default';

type Tab = 'results' | 'codes' | 'videos' | 'questions';

interface AdminDashboardProps {
  onLoginSuccess: () => void;
  isLoggedIn: boolean;
}

export default function AdminDashboard({ onLoginSuccess, isLoggedIn }: AdminDashboardProps) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('results');

  // Data
  const [results, setResults] = useState<TestResult[]>([]);
  const [codes, setCodes] = useState<UniqueCode[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Search
  const [search, setSearch] = useState('');

  // New Code form
  const [newStudentName, setNewStudentName] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  // New Video form
  const [newVideo, setNewVideo] = useState({ topic: '', youtube_url: '', description: '', duration: '15 min' });
  const [editVideoId, setEditVideoId] = useState<string | null>(null);

  // New Question form
  const [newQ, setNewQ] = useState<{ text: string; option_a: string; option_b: string; option_c: string; option_d: string; correct_answer: 'A' | 'B' | 'C' | 'D'; sort_order: number }>({ text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', sort_order: 0 });
  const [editQId, setEditQId] = useState<string | null>(null);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
      fetchAll();
    }
  }, [isLoggedIn]);

  async function fetchAll() {
    const [r, c, v, q] = await Promise.all([
      supabase.from('test_results').select('*').order('completed_on', { ascending: false }),
      supabase.from('unique_codes').select('*').order('student_name'),
      supabase.from('videos').select('*').order('added_on'),
      supabase.from('questions').select('*').order('sort_order'),
    ]);
    setResults(r.data ?? []);
    setCodes(c.data ?? []);
    setVideos(v.data ?? []);
    setQuestions(q.data ?? []);
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onLoginSuccess();
      toast.success('Welcome, Admin!');
    } else {
      toast.error('Incorrect password.');
    }
  }

  // Stats
  const totalStudents = results.length;
  const avgScore = results.length ? Math.round(results.reduce((a, r) => a + r.percentage, 0) / results.length) : 0;
  const passRate = results.length ? Math.round(results.filter((r) => r.percentage >= 60).length / results.length * 100) : 0;
  const highest = results.length ? Math.max(...results.map((r) => r.percentage)) : 0;

  // CSV export
  function exportCSV() {
    const header = 'Student Name,Code,Score,Percentage,Date\n';
    const rows = results.map((r) =>
      `"${r.student_name}","${r.code}",${r.score}/${r.total_questions},${r.percentage}%,"${new Date(r.completed_on).toLocaleString()}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sankalpasiddhi_results.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded!');
  }

  // Generate code
  function generateCode() {
    if (!newStudentName.trim()) { toast.error('Enter student name first.'); return; }
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    setGeneratedCode(`SANKALPA_${suffix}`);
  }

  async function saveCode() {
    if (!generatedCode || !newStudentName.trim()) return;
    const { error } = await supabase.from('unique_codes').insert({ code: generatedCode, student_name: newStudentName.trim(), used: false });
    if (error) { toast.error('Code already exists, regenerate.'); return; }
    toast.success(`Code saved for ${newStudentName}`);
    setNewStudentName('');
    setGeneratedCode('');
    fetchAll();
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Code copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  }

  // Video CRUD
  async function saveVideo() {
    if (!newVideo.topic || !newVideo.youtube_url) {
      toast.error('Topic and URL are required.');
      return;
    }

    try {
      console.log('saveVideo called', { editVideoId, newVideo });

      if (editVideoId) {
        const { error } = await supabase.from('videos').update(newVideo).eq('id', editVideoId);
        console.log('saveVideo update result', { error });
        if (error) {
          toast.error(error.message || 'Failed to update video.');
          return;
        }
        toast.success('Video updated!');
        setEditVideoId(null);
      } else {
        const videoToInsert = { ...newVideo, added_on: new Date().toISOString() };
        const { error } = await supabase.from('videos').insert(videoToInsert);
        console.log('saveVideo insert result', { error });
        if (error) {
          toast.error(error.message || 'Failed to add video.');
          return;
        }
        toast.success('Video added!');
      }

      setNewVideo({ topic: '', youtube_url: '', description: '', duration: '15 min' });
      fetchAll();
    } catch (error: any) {
      console.error('Save video failed:', error);
      toast.error(error?.message || 'Failed to save video.');
    }
  }

  async function deleteVideo(id: string) {
    await supabase.from('videos').delete().eq('id', id);
    toast.success('Video deleted.');
    fetchAll();
  }

  function editVideo(v: Video) {
    setEditVideoId(v.id);
    setNewVideo({ topic: v.topic, youtube_url: v.youtube_url, description: v.description, duration: v.duration });
  }

  // Question CRUD
  async function saveQuestion() {
    if (!newQ.text || !newQ.option_a || !newQ.option_b || !newQ.option_c || !newQ.option_d) {
      toast.error('Fill all fields.'); return;
    }
    if (editQId) {
      await supabase.from('questions').update(newQ).eq('id', editQId);
      toast.success('Question updated!');
      setEditQId(null);
    } else {
      const maxOrder = questions.length ? Math.max(...questions.map((q) => q.sort_order)) + 1 : 1;
      await supabase.from('questions').insert({ ...newQ, sort_order: maxOrder });
      toast.success('Question added!');
    }
    setNewQ({ text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', sort_order: 0 });
    fetchAll();
  }

  async function deleteQuestion(id: string) {
    await supabase.from('questions').delete().eq('id', id);
    toast.success('Question deleted.');
    fetchAll();
  }

  function editQuestion(q: Question) {
    setEditQId(q.id);
    setNewQ({ text: q.text, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d, correct_answer: q.correct_answer as 'A' | 'B' | 'C' | 'D', sort_order: q.sort_order });
  }

  const filteredResults = results.filter((r) =>
    r.student_name.toLowerCase().includes(search.toLowerCase()) ||
    r.code.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'results', label: 'Results', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'codes', label: 'Codes', icon: <Lock className="w-4 h-4" /> },
    { id: 'videos', label: 'Videos', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'questions', label: 'Questions', icon: <FileQuestion className="w-4 h-4" /> },
  ];

  // LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4 pt-16">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Admin Dashboard</h1>
            <p className="text-slate-500 text-sm">Enter your password to continue</p>
          </div>
          <form onSubmit={handleLogin} className="bg-[#1E293B] rounded-2xl p-6 border border-white/10">
            <label className="block text-slate-300 text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 pr-10 rounded-xl bg-[#0F172A] border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="submit"
              className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-200"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // DASHBOARD
  return (
    <div className="min-h-screen bg-[#0F172A] pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Manage students, tests, videos and questions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Students', value: totalStudents, icon: <Users className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Average Score', value: `${avgScore}%`, icon: <BarChart3 className="w-5 h-5" />, color: 'text-[#6366F1]', bg: 'bg-[#6366F1]/10' },
            { label: 'Pass Rate', value: `${passRate}%`, icon: <TrendingUp className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Highest Score', value: `${highest}%`, icon: <Award className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          ].map((s) => (
            <div key={s.label} className="bg-[#1E293B] rounded-2xl p-5 border border-white/5">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3 ${s.color}`}>
                {s.icon}
              </div>
              <div className="text-2xl font-bold text-white mb-0.5">{s.value}</div>
              <div className="text-slate-500 text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1E293B] rounded-xl p-1 mb-6 w-fit border border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-[#6366F1] text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* RESULTS TAB */}
        {activeTab === 'results' && (
          <div>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or code..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#1E293B] border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#6366F1] transition-colors"
                />
              </div>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-600/30 transition-colors"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>

            <div className="bg-[#1E293B] rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['Student Name', 'Code', 'Score', 'Percentage', 'Date'].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.length === 0 ? (
                      <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-600">No results yet.</td></tr>
                    ) : filteredResults.map((r) => (
                      <tr key={r.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                        <td className="px-5 py-3.5 text-white font-medium">{r.student_name}</td>
                        <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">{r.code}</td>
                        <td className="px-5 py-3.5 text-white">{r.score}/{r.total_questions}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.percentage >= 60 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {r.percentage}%
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs">{new Date(r.completed_on).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CODES TAB */}
        {activeTab === 'codes' && (
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Generate code */}
            <div className="lg:col-span-2">
              <div className="bg-[#1E293B] rounded-2xl p-5 border border-white/10">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#6366F1]" /> Generate New Code
                </h3>
                <label className="block text-slate-400 text-xs mb-1.5">Student Name</label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#6366F1] transition-colors mb-3"
                />
                <button
                  onClick={generateCode}
                  className="w-full py-2.5 rounded-xl border border-[#6366F1]/50 text-[#6366F1] text-sm font-medium hover:bg-[#6366F1]/10 transition-colors mb-3"
                >
                  Generate Code
                </button>
                {generatedCode && (
                  <div className="flex items-center gap-2 p-3 bg-[#0F172A] rounded-xl border border-white/10 mb-3">
                    <span className="font-mono text-emerald-400 text-sm flex-1 tracking-wider">{generatedCode}</span>
                    <button onClick={() => copyCode(generatedCode)} className="text-slate-400 hover:text-white">
                      {copiedCode === generatedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}
                {generatedCode && (
                  <button
                    onClick={saveCode}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
                  >
                    Save Code
                  </button>
                )}
              </div>
            </div>

            {/* Code list */}
            <div className="lg:col-span-3">
              <div className="bg-[#1E293B] rounded-2xl border border-white/5 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-white/10">
                  <span className="text-white font-semibold text-sm">All Codes ({codes.length})</span>
                </div>
                <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
                  {codes.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium">{c.student_name}</div>
                        <div className="text-slate-500 font-mono text-xs mt-0.5">{c.code}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${c.used ? 'bg-slate-700 text-slate-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {c.used ? 'Used' : 'Unused'}
                      </span>
                      {c.test_score !== null && (
                        <span className="text-slate-400 text-xs">{c.test_score}/{questions.length}</span>
                      )}
                      <button onClick={() => copyCode(c.code)} className="text-slate-500 hover:text-white transition-colors">
                        {copiedCode === c.code ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIDEOS TAB */}
        {activeTab === 'videos' && (
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-[#1E293B] rounded-2xl p-5 border border-white/10">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#6366F1]" /> {editVideoId ? 'Edit Video' : 'Add New Video'}
                </h3>
                {(['topic', 'youtube_url', 'description', 'duration'] as const).map((field) => (
                  <div key={field} className="mb-3">
                    <label className="block text-slate-400 text-xs mb-1.5 capitalize">{field.replace('_', ' ')}</label>
                    <input
                      type="text"
                      value={newVideo[field]}
                      onChange={(e) => setNewVideo({ ...newVideo, [field]: e.target.value })}
                      placeholder={field === 'youtube_url' ? 'https://www.youtube.com/embed/...' : field === 'duration' ? '15 min' : ''}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#6366F1] transition-colors"
                    />
                  </div>
                ))}
                <div className="flex gap-2">
                  <button
                    onClick={saveVideo}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-sm font-semibold hover:shadow-lg transition-all"
                  >
                    {editVideoId ? 'Update' : 'Add Video'}
                  </button>
                  {editVideoId && (
                    <button
                      onClick={() => { setEditVideoId(null); setNewVideo({ topic: '', youtube_url: '', description: '', duration: '15 min' }); }}
                      className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="bg-[#1E293B] rounded-2xl border border-white/5 overflow-hidden">
                <div className="divide-y divide-white/5">
                  {videos.map((v) => (
                    <div key={v.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{v.topic}</div>
                        <div className="text-slate-500 text-xs mt-0.5 truncate">{v.youtube_url}</div>
                      </div>
                      <span className="text-slate-600 text-xs flex-shrink-0">{v.duration}</span>
                      <button onClick={() => editVideo(v)} className="text-slate-500 hover:text-[#6366F1] transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteVideo(v.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QUESTIONS TAB */}
        {activeTab === 'questions' && (
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-[#1E293B] rounded-2xl p-5 border border-white/10">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#6366F1]" /> {editQId ? 'Edit Question' : 'Add New Question'}
                </h3>
                <div className="mb-3">
                  <label className="block text-slate-400 text-xs mb-1.5">Question Text (Sanskrit)</label>
                  <textarea
                    value={newQ.text}
                    onChange={(e) => setNewQ({ ...newQ, text: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#6366F1] transition-colors resize-none"
                    style={{ fontFamily: "'Noto Serif Devanagari', serif" }}
                  />
                </div>
                {(['option_a', 'option_b', 'option_c', 'option_d'] as const).map((opt) => (
                  <div key={opt} className="mb-2">
                    <label className="block text-slate-400 text-xs mb-1 uppercase">{opt.replace('_', ' ')}</label>
                    <input
                      type="text"
                      value={newQ[opt]}
                      onChange={(e) => setNewQ({ ...newQ, [opt]: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0F172A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#6366F1] transition-colors"
                      style={{ fontFamily: "'Noto Serif Devanagari', serif" }}
                    />
                  </div>
                ))}
                <div className="mb-4">
                  <label className="block text-slate-400 text-xs mb-1.5">Correct Answer</label>
                  <div className="relative">
                    <select
                      value={newQ.correct_answer}
                      onChange={(e) => setNewQ({ ...newQ, correct_answer: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#6366F1] appearance-none transition-colors"
                    >
                      {['A', 'B', 'C', 'D'].map((o) => <option key={o} value={o}>Option {o}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveQuestion}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-sm font-semibold hover:shadow-lg transition-all"
                  >
                    {editQId ? 'Update' : 'Add Question'}
                  </button>
                  {editQId && (
                    <button
                      onClick={() => { setEditQId(null); setNewQ({ text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', sort_order: 0 }); }}
                      className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="bg-[#1E293B] rounded-2xl border border-white/5 overflow-hidden">
                <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                  {questions.map((q, i) => (
                    <div key={q.id} className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#6366F1]/20 text-[#6366F1] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm leading-relaxed line-clamp-2" style={{ fontFamily: "'Noto Serif Devanagari', serif" }}>{q.text}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Correct: {q.correct_answer}</span>
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button onClick={() => editQuestion(q)} className="text-slate-500 hover:text-[#6366F1] transition-colors p-1">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteQuestion(q.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
