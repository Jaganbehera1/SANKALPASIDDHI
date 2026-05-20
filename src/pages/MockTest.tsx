import { useEffect, useRef, useState } from 'react';
import { 
  Clock, ChevronLeft, ChevronRight, CheckCircle, XCircle, 
  RotateCcw, Trophy, AlertCircle, Shield, Star, Sparkles,
  Zap, Target, BookOpen, Award, TrendingUp, BarChart3,
  Flag, HelpCircle, ThumbsUp, Send, Loader2, Key,
  FolderOpen, Timer, Layers, GraduationCap, FileQuestion
} from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { ref, get, push, update } from 'firebase/database';
import { db } from '../lib/firebase';
import type { Question, UniqueCode } from '../types';

interface TestCategory {
  id: string;
  name: string;
  description: string;
  time_limit: number;
  total_questions: number;
  is_active: boolean;
  created_at: string;
  icon?: string;
  passing_score: number;
}

interface Answer {
  questionId: string;
  selected: string;
  timestamp: number;
}

type Stage = 'code-entry' | 'category-select' | 'ready' | 'in-progress' | 'completed';

export default function MockTest() {
  const [stage, setStage] = useState<Stage>('code-entry');
  const [codeInput, setCodeInput] = useState('');
  const [validCode, setValidCode] = useState<UniqueCode | null>(null);
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TestCategory | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(300);
  const [showReview, setShowReview] = useState(false);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (stage === 'in-progress' && selectedCategory) {
      const timerDuration = selectedCategory.time_limit * 60;
      setTimeLeft(timerDuration);
      
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
  }, [stage, selectedCategory]);

  async function fetchCategories() {
    setLoadingCategories(true);
    try {
      const categoriesRef = ref(db, 'test_categories');
      const snapshot = await get(categoriesRef);
      if (snapshot.exists()) {
        const categoriesData = snapshot.val();
        const categoriesList = Object.entries(categoriesData)
          .map(([id, data]: [string, any]) => ({
            id,
            ...data
          }))
          .filter(cat => cat.is_active && cat.total_questions > 0)
          .sort((a, b) => a.name.localeCompare(b.name));
        setCategories(categoriesList);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load test categories');
    } finally {
      setLoadingCategories(false);
    }
  }

  async function fetchQuestionsByCategory(categoryId: string) {
    try {
      const questionsRef = ref(db, 'questions');
      const snapshot = await get(questionsRef);
      if (snapshot.exists()) {
        const questionsData = snapshot.val();
        const questionsList = Object.entries(questionsData)
          .map(([id, data]: [string, any]) => ({
            id,
            ...data
          }))
          .filter(q => q.category_id === categoryId)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        setQuestions(questionsList);
        return questionsList.length;
      }
      return 0;
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
      return 0;
    }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = codeInput.trim().toUpperCase();

    try {
      const codesRef = ref(db, 'unique_codes');
      const snapshot = await get(codesRef);
      
      let foundCode: UniqueCode | null = null;
      if (snapshot.exists()) {
        const codesData = snapshot.val();
        for (const [id, data]: [string, any] of Object.entries(codesData)) {
          if (data.code === code) {
            foundCode = { id, ...data };
            break;
          }
        }
      }

      if (!foundCode) {
        toast.error('Invalid code. Please check and try again.');
        return;
      }
      
      if (foundCode.used) {
        toast.error('This code has already been used.');
        return;
      }

      setValidCode(foundCode);
      setStage('category-select');
      toast.success(`✨ Access granted! Welcome, ${foundCode.student_name}`);
    } catch (error) {
      toast.error('Failed to verify code');
    }
  }

  async function selectCategory(category: TestCategory) {
    if (!validCode) return;
    
    setLoadingCategories(true);
    const questionCount = await fetchQuestionsByCategory(category.id);
    
    if (questionCount === 0) {
      toast.error('No questions available in this test folder. Please contact instructor.');
      setLoadingCategories(false);
      return;
    }
    
    setSelectedCategory(category);
    setStage('ready');
    setLoadingCategories(false);
  }

  function startTest() {
    setStage('in-progress');
    setCurrentIdx(0);
    setAnswers([]);
    setMarkedForReview([]);
    toast.success(`Test started! Time limit: ${selectedCategory?.time_limit} minutes. Good luck! 🍀`);
  }

  function selectAnswer(questionId: string, option: string) {
    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === questionId);
      if (existing) {
        return prev.map((a) => 
          a.questionId === questionId 
            ? { ...a, selected: option, timestamp: Date.now() } 
            : a
        );
      }
      return [...prev, { questionId, selected: option, timestamp: Date.now() }];
    });
    
    if (currentIdx < questions.length - 1 && !isAutoAdvancing) {
      setIsAutoAdvancing(true);
      setTimeout(() => {
        setCurrentIdx(prev => prev + 1);
        setIsAutoAdvancing(false);
      }, 300);
    } else if (currentIdx === questions.length - 1) {
      toast.success('Last question answered! You can submit now.', { duration: 2000 });
    }
  }

  function toggleMarkForReview(questionId: string) {
    setMarkedForReview(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
    toast.success(prev.includes(questionId) ? 'Removed from review' : 'Marked for review', 
      { icon: '🏷️', duration: 1500 }
    );
  }

  async function handleSubmit() {
    if (timerRef.current) clearInterval(timerRef.current);
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const correct = questions.reduce((acc, q) => {
      const ans = answers.find((a) => a.questionId === q.id);
      return acc + (ans?.selected === q.correct_answer ? 1 : 0);
    }, 0);

    const pct = Math.round((correct / questions.length) * 100);
    setScore(correct);

    if (!validCode || !selectedCategory) {
      setIsSubmitting(false);
      return;
    }

    try {
      const codeRef = ref(db, `unique_codes/${validCode.id}`);
      await update(codeRef, { 
        used: true, 
        used_on: new Date().toISOString(), 
        test_score: correct 
      });

      const resultsRef = ref(db, 'test_results');
      await push(resultsRef, {
        student_name: validCode.student_name,
        code: validCode.code,
        score: correct,
        total_questions: questions.length,
        percentage: pct,
        completed_on: new Date().toISOString(),
        category_id: selectedCategory.id,
        category_name: selectedCategory.name,
        time_limit: selectedCategory.time_limit,
        passing_score: selectedCategory.passing_score
      });

      setStage('completed');
      toast.success('🎉 Test submitted successfully!');

      const passingScore = selectedCategory.passing_score || 60;
      if (pct >= 80) {
        setTimeout(() => {
          confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']
          });
        }, 300);
      } else if (pct >= passingScore) {
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10B981', '#34D399']
          });
        }, 300);
      }
    } catch (error) {
      toast.error('Failed to save results');
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function getTimerColor() {
    if (!selectedCategory) return 'text-emerald-400';
    const totalTime = selectedCategory.time_limit * 60;
    const timePercent = (timeLeft / totalTime) * 100;
    
    if (timePercent > 60) return 'text-emerald-400';
    if (timePercent > 30) return 'text-amber-400';
    if (timePercent > 15) return 'text-orange-400';
    return 'text-red-400 animate-pulse';
  }

  const currentQuestion = questions[currentIdx];
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion?.id)?.selected;
  const answeredCount = answers.length;
  const progress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;
  const isLastQuestion = currentIdx === questions.length - 1;

  // CODE ENTRY STAGE
  if (stage === 'code-entry') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] flex items-center justify-center px-4 pt-16">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070')] opacity-5 bg-cover bg-center pointer-events-none"></div>
        
        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-8 animate-fadeIn">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-indigo-500/30 animate-bounce-slow">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-2">
              Sanskrit Mock Test
            </h1>
            <p className="text-slate-500 text-sm">Enter your unique access code to begin your assessment</p>
          </div>

          <form onSubmit={handleCodeSubmit} className="bg-[#1E293B]/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
            <label className="block text-slate-300 text-sm font-medium mb-2 flex items-center gap-2">
              <Key className="w-4 h-4" />
              Access Code
            </label>
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="e.g., SANKALPA001"
              className="w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 transition-all font-mono tracking-wider uppercase"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={!codeInput.trim()}
              className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Verify & Continue
            </button>
          </form>

          <p className="text-center text-slate-600 text-xs mt-6 flex items-center justify-center gap-1">
            <HelpCircle className="w-3 h-3" />
            Don't have a code? Contact your instructor
          </p>
        </div>
      </div>
    );
  }

  // CATEGORY SELECTION STAGE
  if (stage === 'category-select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] pt-20 pb-12 px-4">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070')] opacity-5 bg-cover bg-center pointer-events-none"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-xl">
              <FolderOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Select Test Folder</h1>
            <p className="text-slate-400">
              Welcome, {validCode?.student_name}! Choose which test you want to take.
            </p>
          </div>

          {loadingCategories ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 bg-[#1E293B]/50 rounded-2xl border border-white/10">
              <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Tests Available</h3>
              <p className="text-slate-400">Please contact your instructor for available tests.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => selectCategory(category)}
                  className="group bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-teal-500/50 hover:shadow-2xl hover:shadow-teal-500/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
                >
                  <div className="text-4xl mb-4">{category.icon || '📚'}</div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-teal-400 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">{category.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs mb-4">
                    <div className="flex items-center gap-1 text-slate-500">
                      <FileQuestion className="w-3 h-3" />
                      <span>{category.total_questions || 0} Questions</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Timer className="w-3 h-3" />
                      <span>{category.time_limit} min</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Award className="w-3 h-3" />
                      <span>Pass: {category.passing_score || 60}%</span>
                    </div>
                  </div>

                  <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300">
                    Select Test →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // READY STAGE
  if (stage === 'ready' && validCode && selectedCategory) {
    const totalQuestions = questions.length;
    const passingScore = selectedCategory.passing_score || 60;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] flex items-center justify-center px-4 pt-16">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070')] opacity-5 bg-cover bg-center pointer-events-none"></div>
        
        <div className="relative z-10 w-full max-w-md animate-scaleIn">
          <div className="bg-[#1E293B]/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center mx-auto mb-5 border-2 border-emerald-500/30">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            
            <p className="text-slate-400 text-sm text-center mb-1">Ready to Begin</p>
            <h2 className="text-2xl font-bold text-white text-center mb-6">
              {selectedCategory.icon} {selectedCategory.name}
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gradient-to-br from-[#6366F1]/10 to-[#8B5CF6]/10 rounded-xl p-3 text-center border border-[#6366F1]/20">
                <BookOpen className="w-5 h-5 text-[#6366F1] mx-auto mb-1" />
                <div className="text-2xl font-bold text-white">{totalQuestions}</div>
                <div className="text-slate-500 text-xs">Questions</div>
              </div>
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-3 text-center border border-amber-500/20">
                <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <div className="text-2xl font-bold text-white">{selectedCategory.time_limit}</div>
                <div className="text-slate-500 text-xs">Minutes</div>
              </div>
            </div>

            <div className="bg-[#0F172A] rounded-xl p-4 mb-6 border border-white/5">
              <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-[#6366F1]" />
                Test Details
              </h3>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-2 text-slate-400">
                  <Sparkles className="w-3 h-3 text-[#6366F1]" />
                  Test Folder: {selectedCategory.name}
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Sparkles className="w-3 h-3 text-[#6366F1]" />
                  Total questions: {totalQuestions}
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Sparkles className="w-3 h-3 text-[#6366F1]" />
                  Time limit: {selectedCategory.time_limit} minutes
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Sparkles className="w-3 h-3 text-[#6366F1]" />
                  Passing score: {passingScore}%
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Sparkles className="w-3 h-3 text-[#6366F1]" />
                  Auto-advance after selection
                </li>
              </ul>
            </div>

            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-amber-300/80 text-xs leading-relaxed">
                ⚠️ This code can only be used once. Once you start, the {selectedCategory.time_limit}-minute timer begins immediately.
              </p>
            </div>

            <button
              onClick={startTest}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              <Zap className="w-4 h-4 group-hover:animate-pulse" />
              Start Test
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // IN PROGRESS STAGE
  if (stage === 'in-progress' && currentQuestion && selectedCategory) {
    const optionLabels: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const optionValues = [
      currentQuestion.option_a,
      currentQuestion.option_b,
      currentQuestion.option_c,
      currentQuestion.option_d
    ];
    const isMarked = markedForReview.includes(currentQuestion.id);

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] pt-20 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-[#1E293B]/50 backdrop-blur-sm rounded-xl px-4 py-2 text-center border border-white/5">
              <div className="text-xs text-slate-500">Questions</div>
              <div className="text-lg font-bold text-white">{currentIdx + 1}/{questions.length}</div>
            </div>
            <div className="bg-[#1E293B]/50 backdrop-blur-sm rounded-xl px-4 py-2 text-center border border-white/5">
              <div className="text-xs text-slate-500">Answered</div>
              <div className="text-lg font-bold text-emerald-400">{answeredCount}/{questions.length}</div>
            </div>
            <div className={`bg-[#1E293B]/50 backdrop-blur-sm rounded-xl px-4 py-2 text-center border border-white/5 ${getTimerColor()}`}>
              <div className="text-xs text-slate-500">Time Left</div>
              <div className="text-lg font-bold font-mono flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative mb-8">
            <div className="h-2 bg-[#1E293B] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="absolute -top-6 right-0 text-xs text-slate-500">
              {Math.round(progress)}% complete
            </div>
          </div>

          {/* Category Badge */}
          <div className="mb-3 flex justify-center">
            <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-400 text-xs font-medium flex items-center gap-1">
              {selectedCategory.icon} {selectedCategory.name}
            </span>
          </div>

          {/* Question Card */}
          <div className="bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-xl mb-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1]/20 to-[#8B5CF6]/20 flex items-center justify-center">
                  <span className="text-[#6366F1] font-bold text-sm">Q{currentIdx + 1}</span>
                </div>
                <span className="text-slate-500 text-xs uppercase tracking-wider">Sanskrit Question</span>
              </div>
              <button
                onClick={() => toggleMarkForReview(currentQuestion.id)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isMarked 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                    : 'bg-[#0F172A] text-slate-500 hover:text-amber-400 border border-white/10'
                }`}
                title="Mark for review"
              >
                <Flag className="w-4 h-4" />
              </button>
            </div>

            <p className="text-white text-xl font-medium leading-relaxed mb-6" style={{ fontFamily: "'Noto Serif Devanagari', 'Noto Sans Devanagari', serif" }}>
              {currentQuestion.text}
            </p>

            {/* Options Grid */}
            <div className="grid grid-cols-1 gap-3">
              {optionLabels.map((label, i) => (
                <button
                  key={label}
                  onClick={() => selectAnswer(currentQuestion.id, label)}
                  disabled={isAutoAdvancing}
                  className={`group relative flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-200 overflow-hidden ${
                    currentAnswer === label
                      ? 'border-[#6366F1] bg-gradient-to-r from-[#6366F1]/20 to-[#8B5CF6]/20 text-white shadow-lg shadow-[#6366F1]/20'
                      : 'border-white/10 bg-[#0F172A]/50 text-slate-300 hover:border-[#6366F1]/50 hover:bg-[#6366F1]/10 hover:scale-[1.01]'
                  } ${isAutoAdvancing ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
                    currentAnswer === label 
                      ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-lg' 
                      : 'bg-[#1E293B] text-slate-400 group-hover:bg-[#6366F1]/20'
                  }`}>
                    {label}
                  </div>
                  <span className="text-sm font-medium text-left flex-1" style={{ fontFamily: "'Noto Serif Devanagari', 'Noto Sans Devanagari', serif" }}>
                    {optionValues[i]}
                  </span>
                  {currentAnswer === label && (
                    <CheckCircle className="w-5 h-5 text-[#6366F1] animate-scaleIn" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-slate-400 text-sm font-medium hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {!isLastQuestion && (
              <button
                onClick={() => setCurrentIdx((i) => i + 1)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-semibold hover:shadow-xl hover:shadow-emerald-500/30 transition-all disabled:opacity-50 ml-auto"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit Test
            </button>
          </div>

          {/* Hints */}
          <div className="mt-4 text-center">
            <p className="text-xs text-[#6366F1]/70 flex items-center justify-center gap-1">
              <Zap className="w-3 h-3" />
              Click an option to auto-advance, or use Next/Previous buttons
            </p>
          </div>
          
          <div className="mt-2 text-center">
            <p className="text-xs text-emerald-400/70 flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3" />
              You can submit the test at any time using the Submit button
            </p>
          </div>

          {markedForReview.length > 0 && (
            <div className="mt-3 text-center">
              <p className="text-xs text-amber-400/70 flex items-center justify-center gap-1">
                <Flag className="w-3 h-3" />
                {markedForReview.length} question(s) marked for review
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // COMPLETED STAGE
  if (stage === 'completed' && validCode && selectedCategory) {
    const pct = Math.round((score / questions.length) * 100);
    const passingScore = selectedCategory.passing_score || 60;
    const passed = pct >= passingScore;
    const correctCount = score;
    const incorrectCount = questions.length - score;
    
    const totalTimeSeconds = selectedCategory.time_limit * 60;
    const timeTaken = totalTimeSeconds - timeLeft;
    const minutesTaken = Math.floor(timeTaken / 60);
    const secondsTaken = timeTaken % 60;

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] pt-20 pb-12 px-4">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070')] opacity-5 bg-cover bg-center pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto">
          {!showReview ? (
            <div className="animate-scaleIn">
              <div className="bg-[#1E293B]/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl mb-6">
                {/* Category Badge */}
                <div className="flex justify-center mb-4">
                  <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-400 text-xs font-medium flex items-center gap-1">
                    {selectedCategory.icon} {selectedCategory.name}
                  </span>
                </div>

                {/* Score Circle */}
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      className="text-slate-700"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="url(#scoreGradient)"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${pct * 3.64} 364`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold text-white">{pct}%</div>
                    <div className="text-xs text-slate-500">Score</div>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 ${
                    passed 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {passed ? (
                      <>
                        <Trophy className="w-4 h-4" />
                        Congratulations! You Passed!
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4" />
                        Keep Practicing! Try Again (Need {passingScore}% to pass)
                      </>
                    )}
                  </div>
                  
                  <div className="text-4xl font-bold text-white mb-2">
                    {correctCount}/{questions.length}
                  </div>
                  <p className="text-slate-400 text-sm">
                    You answered {correctCount} out of {questions.length} questions correctly
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="bg-[#0F172A] rounded-xl p-3 text-center border border-white/5">
                    <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                    <div className="text-xl font-bold text-white">{correctCount}</div>
                    <div className="text-slate-500 text-xs">Correct</div>
                  </div>
                  <div className="bg-[#0F172A] rounded-xl p-3 text-center border border-white/5">
                    <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
                    <div className="text-xl font-bold text-white">{incorrectCount}</div>
                    <div className="text-slate-500 text-xs">Incorrect</div>
                  </div>
                  <div className="bg-[#0F172A] rounded-xl p-3 text-center border border-white/5">
                    <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                    <div className="text-xl font-bold text-white">{minutesTaken}:{secondsTaken.toString().padStart(2, '0')}</div>
                    <div className="text-slate-500 text-xs">Time Taken</div>
                  </div>
                  <div className="bg-[#0F172A] rounded-xl p-3 text-center border border-white/5">
                    <Award className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                    <div className="text-xl font-bold text-white">{pct >= 80 ? 'A' : pct >= passingScore ? 'B' : 'C'}</div>
                    <div className="text-slate-500 text-xs">Grade</div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-[#6366F1]/10 to-[#8B5CF6]/10 rounded-xl p-4 text-center mb-6 border border-[#6366F1]/20">
                  <p className="text-white text-sm font-medium mb-1">
                    {pct === 100 ? '🎓 Perfect Score! Outstanding Achievement!' :
                     pct >= 80 ? '🌟 Excellent! You have a strong command of Sanskrit!' :
                     pct >= passingScore ? '📚 Good Job! You passed the test!' :
                     '💪 Don\'t give up! Review the answers and try again.'}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {validCode.student_name} • {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowReview(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/5 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Review Answers
                  </button>
                  <button
                    onClick={() => {
                      setStage('code-entry');
                      setCodeInput('');
                      setShowReview(false);
                      setSelectedCategory(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-sm font-medium hover:shadow-lg transition-all"
                  >
                    <BookOpen className="w-4 h-4" />
                    New Test
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-[#6366F1]" />
                  Answer Review - {selectedCategory.name}
                </h2>
                <button
                  onClick={() => setShowReview(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-all flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to Results
                </button>
              </div>

              <div className="space-y-4">
                {questions.map((q, i) => {
                  const ans = answers.find((a) => a.questionId === q.id);
                  const isCorrect = ans?.selected === q.correct_answer;
                  const optionVals = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d };
                  const isMarked = markedForReview.includes(q.id);

                  return (
                    <div 
                      key={q.id} 
                      className={`bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl p-5 border-2 transition-all duration-300 ${
                        isCorrect 
                          ? 'border-emerald-500/30 hover:border-emerald-500/50' 
                          : 'border-red-500/30 hover:border-red-500/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCorrect 
                              ? 'bg-emerald-500/20' 
                              : 'bg-red-500/20'
                          }`}>
                            {isCorrect
                              ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                              : <XCircle className="w-5 h-5 text-red-400" />
                            }
                          </div>
                          <div>
                            <span className="text-slate-500 text-xs">Question {i + 1}</span>
                            <p className="text-white font-medium mt-0.5" style={{ fontFamily: "'Noto Serif Devanagari', 'Noto Sans Devanagari', serif" }}>
                              {q.text}
                            </p>
                          </div>
                        </div>
                        {isMarked && (
                          <div className="px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30">
                            <Flag className="w-3 h-3 text-amber-400" />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-2 ml-11">
                        {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                          const isCorrectOpt = opt === q.correct_answer;
                          const isUserOpt = ans?.selected === opt;
                          
                          return (
                            <div
                              key={opt}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all ${
                                isCorrectOpt
                                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                                  : isUserOpt && !isCorrectOpt
                                  ? 'bg-red-500/15 border border-red-500/30 text-red-300'
                                  : 'bg-[#0F172A]/50 border border-white/5 text-slate-500'
                              }`}
                            >
                              <span className={`font-bold w-6 text-sm ${isCorrectOpt ? 'text-emerald-400' : isUserOpt ? 'text-red-400' : ''}`}>
                                {opt}.
                              </span>
                              <span className="flex-1" style={{ fontFamily: "'Noto Serif Devanagari', 'Noto Sans Devanagari', serif" }}>
                                {optionVals[opt]}
                              </span>
                              {isCorrectOpt && (
                                <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto" />
                              )}
                              {isUserOpt && !isCorrectOpt && (
                                <XCircle className="w-4 h-4 text-red-400 ml-auto" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {!isCorrect && ans?.selected && (
                        <div className="mt-3 ml-11 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <p className="text-blue-400 text-xs flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            Correct answer is option {q.correct_answer}: {optionVals[q.correct_answer]}
                          </p>
                        </div>
                      )}
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