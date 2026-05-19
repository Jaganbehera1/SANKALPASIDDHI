import { useEffect, useRef, useState } from 'react';
import { Clock, ChevronLeft, ChevronRight, CheckCircle, XCircle, RotateCcw, Trophy, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';
import type { Question, UniqueCode } from '../types';

type Stage = 'code-entry' | 'ready' | 'in-progress' | 'completed';

interface Answer {
  questionId: string;
  selected: string;
}

export default function MockTest() {
  const [stage, setStage] = useState<Stage>('code-entry');
  const [codeInput, setCodeInput] = useState('');
  const [validCode, setValidCode] = useState<UniqueCode | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(300);
  const [showReview, setShowReview] = useState(false);
  const [score, setScore] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (stage === 'in-progress') {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            handleSubmit();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  async function fetchQuestions() {
    const { data } = await supabase.from('questions').select('*').order('sort_order', { ascending: true });
    setQuestions(data ?? []);
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = codeInput.trim().toUpperCase();

    const { data, error } = await supabase
      .from('unique_codes')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (error || !data) {
      toast.error('Invalid code. Please check and try again.');
      return;
    }
    if (data.used) {
      toast.error('This code has already been used.');
      return;
    }

    setValidCode(data);
    setStage('ready');
    toast.success(`Access granted! Welcome, ${data.student_name}`);
  }

  function startTest() {
    setStage('in-progress');
    setTimeLeft(300);
    setCurrentIdx(0);
    setAnswers([]);
  }

  function selectAnswer(questionId: string, option: string) {
    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === questionId);
      if (existing) return prev.map((a) => a.questionId === questionId ? { ...a, selected: option } : a);
      return [...prev, { questionId, selected: option }];
    });
  }

  async function handleSubmit() {
    if (timerRef.current) clearInterval(timerRef.current);

    const correct = questions.reduce((acc, q) => {
      const ans = answers.find((a) => a.questionId === q.id);
      return acc + (ans?.selected === q.correct_answer ? 1 : 0);
    }, 0);

    const pct = Math.round((correct / questions.length) * 100);
    setScore(correct);

    if (!validCode) return;

    // Mark code as used
    await supabase
      .from('unique_codes')
      .update({ used: true, used_on: new Date().toISOString(), test_score: correct })
      .eq('code', validCode.code);

    // Save result
    await supabase.from('test_results').insert({
      student_name: validCode.student_name,
      code: validCode.code,
      score: correct,
      total_questions: questions.length,
      percentage: pct,
      completed_on: new Date().toISOString(),
    });

    setStage('completed');
    toast.success('Test submitted successfully!');

    if (pct >= 80) {
      setTimeout(() => {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B'] });
      }, 300);
    }
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function getTimerColor() {
    if (timeLeft > 120) return 'text-emerald-400';
    if (timeLeft > 60) return 'text-amber-400';
    return 'text-red-400';
  }

  const currentQuestion = questions[currentIdx];
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion?.id)?.selected;

  // CODE ENTRY
  if (stage === 'code-entry') {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
              <span className="text-2xl">🔑</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Mock Test Access</h1>
            <p className="text-slate-400 text-sm">Enter your unique access code provided by your instructor to begin the test.</p>
          </div>

          <form onSubmit={handleCodeSubmit} className="bg-[#1E293B] rounded-2xl p-6 border border-white/10 shadow-xl">
            <label className="block text-slate-300 text-sm font-medium mb-2">Your Unique Access Code</label>
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="e.g. SANKALPA001"
              className="w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-colors font-mono tracking-wider uppercase"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={!codeInput.trim()}
              className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.01] transition-all duration-200"
            >
              Verify Code
            </button>
          </form>

          <p className="text-center text-slate-600 text-xs mt-4">Don't have a code? Contact your instructor.</p>
        </div>
      </div>
    );
  }

  // READY
  if (stage === 'ready' && validCode) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md text-center">
          <div className="bg-[#1E293B] rounded-2xl p-8 border border-white/10 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-slate-400 text-sm mb-1">Access Granted</p>
            <h2 className="text-2xl font-bold text-white mb-6">Welcome, {validCode.student_name}!</h2>

            <div className="bg-[#0F172A] rounded-xl p-4 mb-6 text-left space-y-3 border border-white/5">
              {[
                ['Test', 'संस्कृत ज्ञान परीक्षा'],
                ['Questions', `${questions.length} questions`],
                ['Time Limit', '5 minutes'],
                ['Passing Score', '60% or above'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-slate-200 font-medium">{v}</span>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6 text-left">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-amber-300/80 text-xs leading-relaxed">This code can only be used once. Once you start, the test timer begins immediately.</p>
            </div>

            <button
              onClick={startTest}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.01] transition-all duration-200"
            >
              Start Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  // IN PROGRESS
  if (stage === 'in-progress' && currentQuestion) {
    const optionLabels: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const optionValues = [currentQuestion.option_a, currentQuestion.option_b, currentQuestion.option_c, currentQuestion.option_d];
    const answered = answers.length;

    return (
      <div className="min-h-screen bg-[#0F172A] pt-20 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-slate-400 text-sm font-medium">
              Question <span className="text-white font-bold">{currentIdx + 1}</span> of {questions.length}
            </span>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1E293B] border border-white/10 font-mono font-bold text-lg ${getTimerColor()}`}>
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-[#1E293B] rounded-full mb-8 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-full transition-all duration-300"
              style={{ width: `${((currentIdx) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question card */}
          <div className="bg-[#1E293B] rounded-2xl p-6 border border-white/10 shadow-xl mb-5">
            <div className="text-xs text-slate-500 mb-3 uppercase tracking-widest">Question {currentIdx + 1}</div>
            <p className="text-white text-xl font-medium leading-relaxed mb-6" style={{ fontFamily: "'Noto Serif Devanagari', 'Noto Sans Devanagari', serif" }}>
              {currentQuestion.text}
            </p>

            <div className="grid grid-cols-1 gap-3">
              {optionLabels.map((label, i) => (
                <button
                  key={label}
                  onClick={() => selectAnswer(currentQuestion.id, label)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all duration-200 ${
                    currentAnswer === label
                      ? 'border-[#6366F1] bg-[#6366F1]/20 text-white'
                      : 'border-white/10 bg-[#0F172A]/50 text-slate-300 hover:border-[#6366F1]/50 hover:bg-[#6366F1]/10'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    currentAnswer === label ? 'bg-[#6366F1] text-white' : 'bg-[#1E293B] text-slate-400'
                  }`}>
                    {label}
                  </span>
                  <span className="text-sm font-medium" style={{ fontFamily: "'Noto Serif Devanagari', 'Noto Sans Devanagari', serif" }}>
                    {optionValues[i]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-medium hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <span className="text-slate-600 text-xs">{answered}/{questions.length} answered</span>

            {currentIdx < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIdx((i) => i + 1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6366F1] text-white text-sm font-medium hover:bg-[#4F46E5] transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-semibold hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
              >
                Submit Test
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // COMPLETED
  if (stage === 'completed' && validCode) {
    const pct = Math.round((score / questions.length) * 100);
    const passed = pct >= 60;

    return (
      <div className="min-h-screen bg-[#0F172A] pt-20 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {!showReview ? (
            <div className="text-center">
              {/* Result card */}
              <div className="bg-[#1E293B] rounded-2xl p-8 border border-white/10 shadow-2xl mb-5">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${passed ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                  {passed ? (
                    <Trophy className="w-10 h-10 text-emerald-400" />
                  ) : (
                    <XCircle className="w-10 h-10 text-red-400" />
                  )}
                </div>

                <h2 className="text-3xl font-bold text-white mb-1">
                  {score}/{questions.length}
                </h2>
                <p className="text-slate-400 text-sm mb-4">You scored {pct}%</p>

                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 ${
                  passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {passed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {passed ? 'Passed!' : 'Failed'}
                </div>

                {/* Score bar */}
                <div className="h-3 bg-[#0F172A] rounded-full mb-6 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${passed ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-red-600 to-red-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 text-center text-sm mb-6">
                  <div className="bg-[#0F172A] rounded-xl p-3 border border-white/5">
                    <div className="text-lg font-bold text-white">{score}</div>
                    <div className="text-slate-500 text-xs">Correct</div>
                  </div>
                  <div className="bg-[#0F172A] rounded-xl p-3 border border-white/5">
                    <div className="text-lg font-bold text-white">{questions.length - score}</div>
                    <div className="text-slate-500 text-xs">Incorrect</div>
                  </div>
                  <div className="bg-[#0F172A] rounded-xl p-3 border border-white/5">
                    <div className="text-lg font-bold text-white">{pct}%</div>
                    <div className="text-slate-500 text-xs">Percentage</div>
                  </div>
                </div>

                <p className="text-slate-500 text-sm mb-1">
                  {passed
                    ? pct === 100 ? 'Perfect score! Outstanding!' : 'Great job! Keep up the excellent work.'
                    : 'Keep practicing. You need 60% to pass.'}
                </p>
                <p className="text-slate-600 text-xs">{validCode.student_name} — {new Date().toLocaleDateString()}</p>
              </div>

              <button
                onClick={() => setShowReview(true)}
                className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/5 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Review Answers
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Answer Review</h2>
                <button
                  onClick={() => setShowReview(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-colors"
                >
                  Back to Results
                </button>
              </div>

              <div className="space-y-4">
                {questions.map((q, i) => {
                  const ans = answers.find((a) => a.questionId === q.id);
                  const isCorrect = ans?.selected === q.correct_answer;
                  const optionVals = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d };

                  return (
                    <div key={q.id} className={`bg-[#1E293B] rounded-2xl p-5 border ${isCorrect ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
                      <div className="flex items-start gap-3 mb-4">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isCorrect ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                          {isCorrect
                            ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                            : <XCircle className="w-4 h-4 text-red-400" />
                          }
                        </span>
                        <div>
                          <span className="text-slate-500 text-xs">Question {i + 1}</span>
                          <p className="text-white text-sm font-medium mt-0.5" style={{ fontFamily: "'Noto Serif Devanagari', 'Noto Sans Devanagari', serif" }}>{q.text}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2 ml-9">
                        {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                          <div
                            key={opt}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                              opt === q.correct_answer
                                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                                : ans?.selected === opt
                                ? 'bg-red-500/15 border border-red-500/30 text-red-300'
                                : 'bg-[#0F172A]/50 border border-white/5 text-slate-500'
                            }`}
                          >
                            <span className="font-bold w-4">{opt}.</span>
                            <span style={{ fontFamily: "'Noto Serif Devanagari', 'Noto Sans Devanagari', serif" }}>{optionVals[opt]}</span>
                            {opt === q.correct_answer && <CheckCircle className="w-3.5 h-3.5 ml-auto" />}
                            {ans?.selected === opt && opt !== q.correct_answer && <XCircle className="w-3.5 h-3.5 ml-auto" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
