import { useEffect, useState } from 'react';
import {
  Lock, BarChart3, Users, TrendingUp, Award,
  Copy, Download, Plus, Trash2, Edit, Check, X,
  Search, Eye, EyeOff, ChevronDown, BookOpen, FileQuestion,
  Video, Calendar, Clock, Link as LinkIcon, FileText,
  Upload, Youtube, Monitor, Grid3x3, List, Sparkles,
  GraduationCap, Library, FolderOpen, ExternalLink, FolderPlus,
  Timer, Layers, Settings, PlayCircle, StopCircle, CheckCircle,
  UserPlus, Key, Shield, RefreshCw, Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ref, get, set, push, update, remove } from 'firebase/database';
import { db } from '../lib/firebase';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

type Tab = 'results' | 'codes' | 'videos' | 'questions' | 'materials' | 'live' | 'test-categories';

interface TestResult {
  id: string;
  student_name: string;
  code: string;
  score: number;
  total_questions: number;
  percentage: number;
  completed_on: string;
  category_id?: string;
  category_name?: string;
}

interface UniqueCode {
  id: string;
  code: string;
  student_name: string;
  used: boolean;
  test_score?: number;
  created_at: string;
  is_active: boolean;
}

interface MaterialAccessCode {
  id: string;
  code: string;
  used: boolean;
  created_at: string;
  used_at?: string;
  student_name?: string;
}

interface VideoType {
  id: string;
  topic: string;
  youtube_url: string;
  description: string;
  duration: string;
  thumbnail?: string;
  added_on: string;
}

interface Question {
  id: string;
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  sort_order: number;
  category_id?: string;
}

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

interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: 'pdf' | 'doc' | 'ppt' | 'video' | 'audio';
  subject: string;
  size: string;
  created_at: string;
  downloads: number;
}

interface LiveClass {
  id: string;
  title: string;
  youtube_stream_url: string;
  scheduled_at: string;
  duration: string;
  description: string;
  is_live: boolean;
  created_at: string;
  viewers: number;
}

interface AdminDashboardProps {
  onLoginSuccess: () => void;
  isLoggedIn: boolean;
}

export default function AdminDashboard({ onLoginSuccess, isLoggedIn }: AdminDashboardProps) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('results');
  const [loading, setLoading] = useState(false);

  // Data
  const [results, setResults] = useState<TestResult[]>([]);
  const [codes, setCodes] = useState<UniqueCode[]>([]);
  const [materialCodes, setMaterialCodes] = useState<MaterialAccessCode[]>([]);
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [testCategories, setTestCategories] = useState<TestCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Search
  const [search, setSearch] = useState('');

  // New Code form - ENHANCED
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [selectedCodeType, setSelectedCodeType] = useState<'test' | 'material'>('test');
  const [showCodeDetails, setShowCodeDetails] = useState<string | null>(null);

  // New Video form
  const [newVideo, setNewVideo] = useState({ topic: '', youtube_url: '', description: '', duration: '15 min', thumbnail: '' });
  const [editVideoId, setEditVideoId] = useState<string | null>(null);

  // New Question form
  const [newQ, setNewQ] = useState({
    text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A' as 'A' | 'B' | 'C' | 'D', sort_order: 0, category_id: ''
  });
  const [editQId, setEditQId] = useState<string | null>(null);

  // Test Category form
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    time_limit: 30,
    passing_score: 60,
    is_active: true,
    icon: '📚'
  });
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);

  // Study Material form
  const [newMaterial, setNewMaterial] = useState({ title: '', description: '', file_url: '', file_type: 'pdf', subject: '', size: '2.5 MB' });
  const [editMaterialId, setEditMaterialId] = useState<string | null>(null);

  // Live Class form
  const [newLiveClass, setNewLiveClass] = useState({ title: '', youtube_stream_url: '', scheduled_at: '', duration: '60', description: '', is_live: false });
  const [editLiveId, setEditLiveId] = useState<string | null>(null);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch all data from Firebase Realtime Database
  useEffect(() => {
    if (isLoggedIn) {
      fetchAllData();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  async function fetchMaterialCodes() {
    try {
      const codesRef = ref(db, 'material_access_codes');
      const snapshot = await get(codesRef);
      if (snapshot.exists()) {
        const codesData = snapshot.val();
        const codesList = Object.entries(codesData).map(([id, data]: [string, any]) => ({
          id,
          ...data
        })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setMaterialCodes(codesList);
      } else {
        setMaterialCodes([]);
      }
    } catch (error) {
      console.error('Error fetching material codes:', error);
    }
  }

  async function fetchAllData() {
    setLoading(true);
    try {
      // Fetch test results
      const resultsRef = ref(db, 'test_results');
      const resultsSnapshot = await get(resultsRef);
      if (resultsSnapshot.exists()) {
        const resultsData = resultsSnapshot.val();
        const resultsList = Object.entries(resultsData).map(([id, data]: [string, any]) => ({
          id,
          ...data
        })).sort((a, b) => new Date(b.completed_on).getTime() - new Date(a.completed_on).getTime());
        setResults(resultsList);
      } else {
        setResults([]);
      }

      // Fetch unique codes - ENHANCED with active status
      const codesRef = ref(db, 'unique_codes');
      const codesSnapshot = await get(codesRef);
      if (codesSnapshot.exists()) {
        const codesData = codesSnapshot.val();
        const codesList = Object.entries(codesData).map(([id, data]: [string, any]) => ({
          id,
          ...data,
          is_active: data.is_active !== false // default to true if not set
        })).sort((a, b) => a.student_name.localeCompare(b.student_name));
        setCodes(codesList);
      } else {
        setCodes([]);
      }

      // Fetch material access codes
      await fetchMaterialCodes();

      // Fetch videos
      const videosRef = ref(db, 'videos');
      const videosSnapshot = await get(videosRef);
      if (videosSnapshot.exists()) {
        const videosData = videosSnapshot.val();
        const videosList = Object.entries(videosData).map(([id, data]: [string, any]) => ({
          id,
          ...data
        })).sort((a, b) => new Date(b.added_on).getTime() - new Date(a.added_on).getTime());
        setVideos(videosList);
      } else {
        setVideos([]);
      }

      // Fetch questions
      const questionsRef = ref(db, 'questions');
      const questionsSnapshot = await get(questionsRef);
      if (questionsSnapshot.exists()) {
        const questionsData = questionsSnapshot.val();
        const questionsList = Object.entries(questionsData).map(([id, data]: [string, any]) => ({
          id,
          ...data
        })).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        setQuestions(questionsList);
      } else {
        setQuestions([]);
      }

      // Fetch test categories
      const categoriesRef = ref(db, 'test_categories');
      const categoriesSnapshot = await get(categoriesRef);
      if (categoriesSnapshot.exists()) {
        const categoriesData = categoriesSnapshot.val();
        const categoriesList = Object.entries(categoriesData).map(([id, data]: [string, any]) => ({
          id,
          ...data
        })).sort((a, b) => a.name.localeCompare(b.name));
        setTestCategories(categoriesList);
      } else {
        setTestCategories([]);
      }

      // Fetch study materials
      const materialsRef = ref(db, 'study_materials');
      const materialsSnapshot = await get(materialsRef);
      if (materialsSnapshot.exists()) {
        const materialsData = materialsSnapshot.val();
        const materialsList = Object.entries(materialsData).map(([id, data]: [string, any]) => ({
          id,
          ...data
        })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setMaterials(materialsList);
      } else {
        setMaterials([]);
      }

      // Fetch live classes
      const liveRef = ref(db, 'live_classes');
      const liveSnapshot = await get(liveRef);
      if (liveSnapshot.exists()) {
        const liveData = liveSnapshot.val();
        const liveList = Object.entries(liveData).map(([id, data]: [string, any]) => ({
          id,
          ...data
        })).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
        setLiveClasses(liveList);
      } else {
        setLiveClasses([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onLoginSuccess();
      toast.success('Welcome, Guruji! 🙏');
    } else {
      toast.error('Incorrect password.');
    }
  }

  // Stats
  const totalStudents = results.length;
  const avgScore = results.length ? Math.round(results.reduce((a, r) => a + r.percentage, 0) / results.length) : 0;
  const passRate = results.length ? Math.round(results.filter((r) => r.percentage >= 60).length / results.length * 100) : 0;
  const highest = results.length ? Math.max(...results.map((r) => r.percentage)) : 0;
  const totalMaterials = materials.length;
  const activeLiveClasses = liveClasses.filter(l => l.is_live || new Date(l.scheduled_at) > new Date()).length;
  const totalCategories = testCategories.length;
  const activeTestCodes = codes.filter(c => c.is_active !== false).length;

  // CSV export
  function exportCSV() {
    const header = 'Student Name,Code,Score,Percentage,Date,Test Category\n';
    const rows = results.map((r) =>
      `"${r.student_name}","${r.code}",${r.score}/${r.total_questions},${r.percentage}%,"${new Date(r.completed_on).toLocaleString()}","${r.category_name || 'General'}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sankalpasiddhi_results.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded!');
  }

  // ENHANCED: Generate unique code for tests with validation
  function generateCode() {
    if (!newStudentName.trim()) {
      toast.error('Enter student name first.');
      return;
    }

    // Check if student already has a code
    const existingCode = codes.find(c => c.student_name.toLowerCase() === newStudentName.trim().toLowerCase() && c.is_active !== false);
    if (existingCode) {
      toast.error(`${newStudentName} already has a code: ${existingCode.code}`);
      setGeneratedCode(existingCode.code);
      return;
    }

    // Generate a more readable code format
    const prefix = 'SKP';
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const suffix = Math.random().toString(36).substring(2, 4).toUpperCase();
    const newCode = `${prefix}_${random}_${suffix}`;
    setGeneratedCode(newCode);
    toast.success('✨ New code generated!');
  }

  // ENHANCED: Save code with more user details
  async function saveCode() {
    if (!generatedCode || !newStudentName.trim()) {
      toast.error('Generate a code first.');
      return;
    }

    try {
      const codesRef = ref(db, 'unique_codes');
      const snapshot = await get(codesRef);
      let codeExists = false;
      let existingCodeData = null;
      
      if (snapshot.exists()) {
        const codesData = snapshot.val();
        const found = Object.entries(codesData).find(([_, data]: [string, any]) => data.code === generatedCode);
        if (found) {
          codeExists = true;
          existingCodeData = found[1];
        }
      }

      if (codeExists && existingCodeData?.student_name !== newStudentName.trim()) {
        toast.error('Code already assigned to another student.');
        return;
      }

      // Check if student already has an active code
      const existingStudentCode = codes.find(c => 
        c.student_name.toLowerCase() === newStudentName.trim().toLowerCase() && 
        c.is_active !== false
      );

      if (existingStudentCode && existingStudentCode.code !== generatedCode) {
        // Deactivate old code
        const oldCodeRef = ref(db, `unique_codes/${existingStudentCode.id}`);
        await update(oldCodeRef, { is_active: false });
      }

      const newCodeRef = push(ref(db, 'unique_codes'));
      await set(newCodeRef, {
        code: generatedCode,
        student_name: newStudentName.trim(),
        student_email: newStudentEmail.trim() || '',
        student_phone: newStudentPhone.trim() || '',
        used: false,
        is_active: true,
        created_at: new Date().toISOString()
      });

      toast.success(`✅ Code saved for ${newStudentName}`);
      
      // Copy to clipboard
      navigator.clipboard.writeText(generatedCode);
      toast.success(`📋 Code copied to clipboard!`);
      
      setNewStudentName('');
      setNewStudentEmail('');
      setNewStudentPhone('');
      setGeneratedCode('');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to save code');
    }
  }

  // Generate material access code
  async function generateMaterialCode() {
    const prefix = 'MAT';
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const suffix = Math.random().toString(36).substring(2, 4).toUpperCase();
    const newCode = `${prefix}_${random}_${suffix}`;

    try {
      const codesRef = ref(db, 'material_access_codes');
      await push(codesRef, {
        code: newCode,
        used: false,
        created_at: new Date().toISOString()
      });

      toast.success(`Material code generated: ${newCode}`);
      
      await fetchMaterialCodes();
      
      navigator.clipboard.writeText(newCode);
      toast.success(`📋 Code copied to clipboard!`);
    } catch (error) {
      toast.error('Failed to generate code');
    }
  }

  async function deleteMaterialCode(id: string) {
    if (confirm('Delete this material access code?')) {
      const codeRef = ref(db, `material_access_codes/${id}`);
      await remove(codeRef);
      toast.success('Code deleted');
      await fetchMaterialCodes();
    }
  }

  // ENHANCED: Toggle code status
  async function toggleCodeStatus(id: string, currentStatus: boolean) {
    const codeRef = ref(db, `unique_codes/${id}`);
    await update(codeRef, { is_active: !currentStatus });
    toast.success(!currentStatus ? 'Code activated!' : 'Code deactivated.');
    fetchAllData();
  }

  // ENHANCED: Delete code with confirmation
  async function deleteCode(id: string, studentName: string) {
    if (confirm(`Delete code for ${studentName}? This action cannot be undone.`)) {
      const codeRef = ref(db, `unique_codes/${id}`);
      await remove(codeRef);
      toast.success('Code deleted.');
      fetchAllData();
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('📋 Code copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2000);
  }

  // Video CRUD
  async function saveVideo() {
    if (!newVideo.topic || !newVideo.youtube_url) {
      toast.error('Topic and URL are required.');
      return;
    }

    try {
      if (editVideoId) {
        const videoRef = ref(db, `videos/${editVideoId}`);
        await update(videoRef, newVideo);
        toast.success('Video updated!');
        setEditVideoId(null);
      } else {
        const newVideoRef = push(ref(db, 'videos'));
        await set(newVideoRef, {
          ...newVideo,
          added_on: new Date().toISOString()
        });
        toast.success('Video added to library!');
      }

      setNewVideo({ topic: '', youtube_url: '', description: '', duration: '15 min', thumbnail: '' });
      fetchAllData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save video.');
    }
  }

  async function deleteVideo(id: string) {
    const videoRef = ref(db, `videos/${id}`);
    await remove(videoRef);
    toast.success('Video deleted.');
    fetchAllData();
  }

  function editVideo(v: VideoType) {
    setEditVideoId(v.id);
    setNewVideo({
      topic: v.topic,
      youtube_url: v.youtube_url,
      description: v.description || '',
      duration: v.duration || '15 min',
      thumbnail: v.thumbnail || ''
    });
  }

  // Test Category CRUD
  async function saveCategory() {
    if (!newCategory.name) {
      toast.error('Category name is required.');
      return;
    }

    try {
      if (editCategoryId) {
        const categoryRef = ref(db, `test_categories/${editCategoryId}`);
        await update(categoryRef, newCategory);
        toast.success('Test category updated!');
        setEditCategoryId(null);
      } else {
        const newCategoryRef = push(ref(db, 'test_categories'));
        await set(newCategoryRef, {
          ...newCategory,
          total_questions: 0,
          created_at: new Date().toISOString()
        });
        toast.success('Test category created!');
      }

      setNewCategory({ name: '', description: '', time_limit: 30, passing_score: 60, is_active: true, icon: '📚' });
      fetchAllData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save category.');
    }
  }

  async function deleteCategory(id: string) {
    const questionsInCategory = questions.filter(q => q.category_id === id);
    if (questionsInCategory.length > 0) {
      toast.error(`Cannot delete category with ${questionsInCategory.length} questions. Move or delete questions first.`);
      return;
    }
    
    const categoryRef = ref(db, `test_categories/${id}`);
    await remove(categoryRef);
    toast.success('Test category deleted.');
    fetchAllData();
  }

  function editCategory(cat: TestCategory) {
    setEditCategoryId(cat.id);
    setNewCategory({
      name: cat.name,
      description: cat.description || '',
      time_limit: cat.time_limit,
      passing_score: cat.passing_score,
      is_active: cat.is_active,
      icon: cat.icon || '📚'
    });
  }

  async function toggleCategoryStatus(id: string, currentStatus: boolean) {
    const categoryRef = ref(db, `test_categories/${id}`);
    await update(categoryRef, { is_active: !currentStatus });
    toast.success(!currentStatus ? 'Category activated!' : 'Category deactivated.');
    fetchAllData();
  }

  // Question CRUD with category filter
  async function saveQuestion() {
    if (!newQ.text || !newQ.option_a || !newQ.option_b || !newQ.option_c || !newQ.option_d) {
      toast.error('Fill all fields.');
      return;
    }

    if (!newQ.category_id && testCategories.length > 0) {
      toast.error('Please select a test category for this question.');
      return;
    }

    try {
      if (editQId) {
        const questionRef = ref(db, `questions/${editQId}`);
        await update(questionRef, newQ);
        toast.success('Question updated!');
        setEditQId(null);
      } else {
        const categoryQuestions = questions.filter(q => q.category_id === newQ.category_id);
        const maxOrder = categoryQuestions.length ? Math.max(...categoryQuestions.map((q) => q.sort_order || 0)) + 1 : 1;
        const newQuestionRef = push(ref(db, 'questions'));
        await set(newQuestionRef, {
          ...newQ,
          sort_order: maxOrder
        });
        
        const categoryRef = ref(db, `test_categories/${newQ.category_id}`);
        const categorySnapshot = await get(categoryRef);
        if (categorySnapshot.exists()) {
          const categoryData = categorySnapshot.val();
          await update(categoryRef, { total_questions: (categoryData.total_questions || 0) + 1 });
        }
        
        toast.success('New question added to test!');
      }

      setNewQ({ text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', sort_order: 0, category_id: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to save question');
    }
  }

  async function deleteQuestion(id: string) {
    const question = questions.find(q => q.id === id);
    if (question?.category_id) {
      const categoryRef = ref(db, `test_categories/${question.category_id}`);
      const categorySnapshot = await get(categoryRef);
      if (categorySnapshot.exists()) {
        const categoryData = categorySnapshot.val();
        await update(categoryRef, { total_questions: Math.max(0, (categoryData.total_questions || 0) - 1) });
      }
    }
    
    const questionRef = ref(db, `questions/${id}`);
    await remove(questionRef);
    toast.success('Question deleted.');
    fetchAllData();
  }

  function editQuestion(q: Question) {
    setEditQId(q.id);
    setNewQ({
      text: q.text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      sort_order: q.sort_order || 0,
      category_id: q.category_id || ''
    });
  }

  // Study Material CRUD
  async function saveMaterial() {
    if (!newMaterial.title || !newMaterial.file_url) {
      toast.error('Title and file URL are required.');
      return;
    }

    try {
      if (editMaterialId) {
        const materialRef = ref(db, `study_materials/${editMaterialId}`);
        await update(materialRef, newMaterial);
        toast.success('Material updated!');
        setEditMaterialId(null);
      } else {
        const newMaterialRef = push(ref(db, 'study_materials'));
        await set(newMaterialRef, {
          ...newMaterial,
          created_at: new Date().toISOString(),
          downloads: 0
        });
        toast.success('Study material uploaded!');
      }

      setNewMaterial({ title: '', description: '', file_url: '', file_type: 'pdf', subject: '', size: '2.5 MB' });
      fetchAllData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save material.');
    }
  }

  async function deleteMaterial(id: string) {
    const materialRef = ref(db, `study_materials/${id}`);
    await remove(materialRef);
    toast.success('Material deleted.');
    fetchAllData();
  }

  function editMaterial(m: StudyMaterial) {
    setEditMaterialId(m.id);
    setNewMaterial({
      title: m.title,
      description: m.description || '',
      file_url: m.file_url,
      file_type: m.file_type,
      subject: m.subject || '',
      size: m.size || '2.5 MB'
    });
  }

  // Live Class CRUD
  async function saveLiveClass() {
    if (!newLiveClass.title || !newLiveClass.youtube_stream_url) {
      toast.error('Title and YouTube stream URL are required.');
      return;
    }

    try {
      if (editLiveId) {
        const liveRef = ref(db, `live_classes/${editLiveId}`);
        await update(liveRef, newLiveClass);
        toast.success('Live class updated!');
        setEditLiveId(null);
      } else {
        const newLiveRef = push(ref(db, 'live_classes'));
        await set(newLiveRef, {
          ...newLiveClass,
          created_at: new Date().toISOString(),
          viewers: 0
        });
        toast.success('Live class scheduled!');
      }

      setNewLiveClass({ title: '', youtube_stream_url: '', scheduled_at: '', duration: '60', description: '', is_live: false });
      fetchAllData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save live class.');
    }
  }

  async function deleteLiveClass(id: string) {
    const liveRef = ref(db, `live_classes/${id}`);
    await remove(liveRef);
    toast.success('Live class removed.');
    fetchAllData();
  }

  async function toggleLiveStatus(id: string, currentStatus: boolean) {
    try {
      const liveRef = ref(db, `live_classes/${id}`);
      await update(liveRef, { is_live: !currentStatus });
      toast.success(!currentStatus ? '🟢 Class is now LIVE!' : 'Class ended.');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to update live status.');
    }
  }

  function editLiveClass(l: LiveClass) {
    setEditLiveId(l.id);
    setNewLiveClass({
      title: l.title,
      youtube_stream_url: l.youtube_stream_url,
      scheduled_at: l.scheduled_at,
      duration: l.duration,
      description: l.description || '',
      is_live: l.is_live
    });
  }

  const filteredResults = results.filter((r) =>
    r.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.code?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredQuestions = selectedCategory 
    ? questions.filter(q => q.category_id === selectedCategory)
    : questions;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'results', label: 'Results', icon: <BarChart3 className="w-4 h-4" />, color: 'from-blue-500 to-cyan-500' },
    { id: 'codes', label: 'Codes', icon: <Lock className="w-4 h-4" />, color: 'from-purple-500 to-pink-500' },
    { id: 'test-categories', label: 'Test Folders', icon: <FolderOpen className="w-4 h-4" />, color: 'from-teal-500 to-emerald-500' },
    { id: 'questions', label: 'Question Bank', icon: <FileQuestion className="w-4 h-4" />, color: 'from-indigo-500 to-violet-500' },
    { id: 'videos', label: 'Video Library', icon: <Video className="w-4 h-4" />, color: 'from-red-500 to-orange-500' },
    { id: 'live', label: 'Live Classes', icon: <Monitor className="w-4 h-4" />, color: 'from-green-500 to-emerald-500' },
    { id: 'materials', label: 'Study Material', icon: <FolderOpen className="w-4 h-4" />, color: 'from-yellow-500 to-amber-500' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070')] opacity-5 bg-cover bg-center"></div>
        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-indigo-500/30">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-2">Sankalpasiddhi</h1>
            <p className="text-slate-500 text-sm">Admin Dashboard • Secure Access Only</p>
          </div>
          <form onSubmit={handleLogin} className="bg-[#1E293B]/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
            <label className="block text-slate-300 text-sm font-medium mb-2">Access Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your secret key..."
                className="w-full px-4 py-3 pr-10 rounded-xl bg-[#0F172A] border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 transition-all"
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
              className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold text-sm hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 transform hover:scale-[1.02]"
            >
              Enter Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] pt-20 pb-16 px-4">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070')] opacity-5 bg-cover bg-center pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Admin Dashboard</h1>
              <p className="text-slate-500 text-sm mt-1">Manage your entire Sanskrit learning platform</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <GraduationCap className="w-3 h-3 inline mr-1" />
                {totalStudents} Students
              </div>
              <div className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium">
                <Key className="w-3 h-3 inline mr-1" />
                {activeTestCodes} Active Codes
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-4 mb-8">
          {[
            { label: 'Total Students', value: totalStudents, icon: <Users className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/10', gradient: 'from-blue-500 to-cyan-500' },
            { label: 'Avg Score', value: `${avgScore}%`, icon: <BarChart3 className="w-5 h-5" />, color: 'text-[#6366F1]', bg: 'bg-[#6366F1]/10', gradient: 'from-indigo-500 to-purple-500' },
            { label: 'Pass Rate', value: `${passRate}%`, icon: <TrendingUp className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', gradient: 'from-emerald-500 to-teal-500' },
            { label: 'Highest', value: `${highest}%`, icon: <Award className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10', gradient: 'from-amber-500 to-orange-500' },
            { label: 'Test Folders', value: totalCategories, icon: <FolderOpen className="w-5 h-5" />, color: 'text-teal-400', bg: 'bg-teal-500/10', gradient: 'from-teal-500 to-emerald-500' },
            { label: 'Materials', value: totalMaterials, icon: <Library className="w-5 h-5" />, color: 'text-rose-400', bg: 'bg-rose-500/10', gradient: 'from-rose-500 to-pink-500' },
            { label: 'Live Classes', value: activeLiveClasses, icon: <Calendar className="w-5 h-5" />, color: 'text-violet-400', bg: 'bg-violet-500/10', gradient: 'from-violet-500 to-purple-500' },
          ].map((s) => (
            <div key={s.label} className="group relative bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3 ${s.color} group-hover:scale-110 transition-transform`}>
                {s.icon}
              </div>
              <div className="text-2xl font-bold text-white mb-0.5">{s.value}</div>
              <div className="text-slate-500 text-xs font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-[#1E293B]/50 backdrop-blur-sm rounded-xl p-1.5 mb-6 border border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedCategory(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-lg shadow-indigo-500/20`
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* RESULTS TAB */}
        {activeTab === 'results' && (
          <div className="animate-fadeIn">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by student name or code..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#1E293B] border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 transition-all"
                />
              </div>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:shadow-lg hover:shadow-emerald-500/10 transition-all"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
        
            <div className="bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      {['Student Name', 'Code', 'Test', 'Score', 'Percentage', 'Date'].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-slate-600">📭 No test results yet</td>
                      </tr>
                    ) : (
                      filteredResults.map((r) => (
                        <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-5 py-3.5 text-white font-medium">{r.student_name}</td>
                          <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">{r.code}</td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 text-xs font-medium">
                              {r.category_name || 'General'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-white font-semibold">{r.score}/{r.total_questions}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${r.percentage >= 60 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              {r.percentage}%
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 text-xs">{new Date(r.completed_on).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CODES TAB - ENHANCED with permanent code assignment */}
        {activeTab === 'codes' && (
          <div className="space-y-6 animate-fadeIn">
            {/* TEST ACCESS CODES SECTION */}
            <div className="grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
                        <UserPlus className="w-3.5 h-3.5 text-white" />
                      </div>
                      Generate Test Access Code
                    </h3>
                    <span className="text-xs text-slate-500">One code per student</span>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-slate-400 text-xs mb-1.5 font-medium">Student Name *</label>
                    <input
                      type="text"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      placeholder="e.g., Rahul Verma"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#6366F1] transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-slate-400 text-xs mb-1.5 font-medium">Email (optional)</label>
                      <input
                        type="email"
                        value={newStudentEmail}
                        onChange={(e) => setNewStudentEmail(e.target.value)}
                        placeholder="student@email.com"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#6366F1] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs mb-1.5 font-medium">Phone (optional)</label>
                      <input
                        type="text"
                        value={newStudentPhone}
                        onChange={(e) => setNewStudentPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#6366F1] transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={generateCode}
                      className="flex-1 py-2.5 rounded-xl border border-[#6366F1]/50 text-[#6366F1] text-sm font-medium hover:bg-[#6366F1]/10 transition-all"
                    >
                      <RefreshCw className="w-4 h-4 inline mr-1" /> Generate Code
                    </button>
                    <button
                      onClick={() => {
                        const existing = codes.find(c => c.student_name.toLowerCase() === newStudentName.trim().toLowerCase());
                        if (existing) {
                          setGeneratedCode(existing.code);
                          toast.info(`Code found: ${existing.code}`);
                        } else {
                          toast.error('No existing code found for this student');
                        }
                      }}
                      className="px-3 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-all"
                      title="Find existing code"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>

                  {generatedCode && (
                    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-[#6366F1]/10 to-[#8B5CF6]/10 rounded-xl border border-[#6366F1]/20 mb-3">
                      <Key className="w-4 h-4 text-[#6366F1]" />
                      <span className="font-mono text-emerald-400 text-sm flex-1 tracking-wider font-bold">{generatedCode}</span>
                      <button onClick={() => copyCode(generatedCode)} className="text-slate-400 hover:text-white transition-colors p-1">
                        {copiedCode === generatedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setGeneratedCode('')}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={saveCode}
                    disabled={!generatedCode || !newStudentName.trim()}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4 inline mr-1" /> Assign Code to Student
                  </button>

                  <div className="mt-3 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs text-blue-400 flex items-start gap-1.5">
                      <Shield className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      Each student gets one permanent code. If a new code is generated, the old one is deactivated.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-white/10 bg-white/5 flex justify-between items-center">
                    <span className="text-white font-semibold text-sm">📋 Registered Students & Codes ({codes.filter(c => c.is_active !== false).length} active)</span>
                    <span className="text-slate-500 text-xs">{codes.length} total</span>
                  </div>
                  <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
                    {codes.length === 0 ? (
                      <div className="px-5 py-8 text-center text-slate-500 text-sm">
                        No students registered yet. Generate a code to get started.
                      </div>
                    ) : (
                      codes.map((c) => {
                        const isActive = c.is_active !== false;
                        return (
                          <div key={c.id} className={`flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors ${!isActive ? 'opacity-50' : ''}`}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-white text-sm font-medium truncate">{c.student_name}</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                  {isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <div className="font-mono text-teal-400 text-xs font-bold tracking-wider">{c.code}</div>
                              {c.student_email && (
                                <div className="text-slate-500 text-xs truncate">{c.student_email}</div>
                              )}
                              <div className="text-slate-600 text-xs mt-0.5">
                                Created: {new Date(c.created_at).toLocaleDateString()}
                                {c.used && <span className="ml-2 text-slate-500">• Used ✓</span>}
                              </div>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => toggleCodeStatus(c.id, isActive)}
                                className={`p-1.5 rounded-lg transition-colors ${isActive ? 'text-red-400 hover:bg-red-500/20' : 'text-emerald-400 hover:bg-emerald-500/20'}`}
                                title={isActive ? 'Deactivate' : 'Activate'}
                              >
                                {isActive ? <StopCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => copyCode(c.code)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-teal-400 hover:bg-teal-500/10 transition-colors"
                                title="Copy code"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteCode(c.id, c.student_name)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Delete code"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* STUDY MATERIAL ACCESS CODES SECTION */}
            <div className="grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center">
                      <BookOpen className="w-3.5 h-3.5 text-white" />
                    </div>
                    Study Material Codes
                  </h3>
                  <p className="text-slate-400 text-xs mb-4">Generate single-use access codes for study materials. Each code can only be used once.</p>
                  <button
                    onClick={generateMaterialCode}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-teal-500/30 transition-all"
                  >
                    + Generate Material Code
                  </button>
                  <div className="mt-4 p-3 rounded-xl bg-teal-500/10 border border-teal-500/20">
                    <p className="text-xs text-teal-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Codes are single-use and tracked automatically
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-white/10 bg-white/5">
                    <span className="text-white font-semibold text-sm">🔑 Material Access Codes ({materialCodes.length})</span>
                  </div>
                  <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
                    {materialCodes.length === 0 ? (
                      <div className="px-5 py-8 text-center text-slate-500 text-sm">
                        No material codes generated yet. Click the button to create one.
                      </div>
                    ) : (
                      materialCodes.map((code) => (
                        <div key={code.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-teal-400 text-sm font-bold tracking-wider">
                                {code.code}
                              </span>
                              {code.used && (
                                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                                  Used
                                </span>
                              )}
                              {!code.used && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500 text-xs mt-1">
                              Created: {new Date(code.created_at).toLocaleString()}
                              {code.used_at && (
                                <> • Used: {new Date(code.used_at).toLocaleString()}</>
                              )}
                              {code.student_name && (
                                <> • By: {code.student_name}</>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => copyCode(code.code)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-teal-400 hover:bg-teal-500/10 transition-colors"
                              title="Copy code"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            {!code.used && (
                              <button
                                onClick={() => deleteMaterialCode(code.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Delete code"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TEST CATEGORIES TAB */}
        {activeTab === 'test-categories' && (
          <div className="grid lg:grid-cols-5 gap-6 animate-fadeIn">
            <div className="lg:col-span-2">
              <div className="bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center">
                    <FolderPlus className="w-3.5 h-3.5 text-white" />
                  </div>
                  {editCategoryId ? 'Edit Test Folder' : 'Create Test Folder'}
                </h3>
                <div className="mb-3">
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">Folder Name</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="e.g., Sanskrit Unit 1 Test"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#6366F1] transition-all"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">Description</label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    rows={2}
                    placeholder="Describe what this test covers..."
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#6366F1] transition-all resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-slate-400 text-xs mb-1.5 font-medium flex items-center gap-1">
                      <Timer className="w-3 h-3" /> Time Limit (minutes)
                    </label>
                    <input
                      type="number"
                      value={newCategory.time_limit}
                      onChange={(e) => setNewCategory({ ...newCategory, time_limit: parseInt(e.target.value) })}
                      min={1}
                      max={180}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#6366F1] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1.5 font-medium flex items-center gap-1">
                      <Award className="w-3 h-3" /> Passing Score (%)
                    </label>
                    <input
                      type="number"
                      value={newCategory.passing_score}
                      onChange={(e) => setNewCategory({ ...newCategory, passing_score: parseInt(e.target.value) })}
                      min={0}
                      max={100}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#6366F1] transition-all"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">Icon (emoji)</label>
                  <input
                    type="text"
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                    placeholder="📚"
                    maxLength={2}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#6366F1] transition-all"
                  />
                </div>
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCategory.is_active}
                      onChange={(e) => setNewCategory({ ...newCategory, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-white/10 bg-[#0F172A] text-[#6366F1] focus:ring-[#6366F1]"
                    />
                    <span className="text-slate-400 text-xs">Active (students can take this test)</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveCategory}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-teal-500/30 transition-all"
                  >
                    {editCategoryId ? 'Update Folder' : 'Create Folder'}
                  </button>
                  {editCategoryId && (
                    <button
                      onClick={() => { setEditCategoryId(null); setNewCategory({ name: '', description: '', time_limit: 30, passing_score: 60, is_active: true, icon: '📚' }); }}
                      className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-white/10 bg-white/5">
                  <span className="text-white font-semibold text-sm">📁 Test Folders ({testCategories.length})</span>
                </div>
                <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                  {testCategories.map((cat) => (
                    <div key={cat.id} className="px-5 py-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{cat.icon || '📚'}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-white font-semibold">{cat.name}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              {cat.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-slate-500 text-xs mt-1">{cat.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-slate-400 text-xs flex items-center gap-1">
                              <Timer className="w-3 h-3" /> {cat.time_limit} min
                            </span>
                            <span className="text-slate-400 text-xs flex items-center gap-1">
                              <FileQuestion className="w-3 h-3" /> {cat.total_questions || 0} questions
                            </span>
                            <span className="text-slate-400 text-xs flex items-center gap-1">
                              <Award className="w-3 h-3" /> Pass: {cat.passing_score}%
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => toggleCategoryStatus(cat.id, cat.is_active)}
                            className={`p-1.5 rounded-lg transition-colors ${cat.is_active ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}
                            title={cat.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {cat.is_active ? <StopCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                          </button>
                          <button onClick={() => editCategory(cat)} className="text-slate-500 hover:text-[#6366F1] transition-colors p-1">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteCategory(cat.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1">
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

        {/* QUESTIONS TAB */}
        {activeTab === 'questions' && (
          <div className="grid lg:grid-cols-5 gap-6 animate-fadeIn">
            <div className="lg:col-span-2">
              <div className="bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center">
                    <FileQuestion className="w-3.5 h-3.5 text-white" />
                  </div>
                  {editQId ? 'Edit Question' : 'Add Sanskrit Question'}
                </h3>
                
                <div className="mb-3">
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium flex items-center gap-1">
                    <FolderOpen className="w-3 h-3" /> Test Folder
                  </label>
                  <select
                    value={newQ.category_id}
                    onChange={(e) => setNewQ({ ...newQ, category_id: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#6366F1] transition-all"
                  >
                    <option value="">Select a test folder</option>
                    {testCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name} ({cat.time_limit} min)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-3">
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">Question Text (Sanskrit)</label>
                  <textarea
                    value={newQ.text}
                    onChange={(e) => setNewQ({ ...newQ, text: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#6366F1] transition-all resize-none"
                    style={{ fontFamily: "'Noto Serif Devanagari', 'Noto Sans Devanagari', serif" }}
                  />
                </div>
                {(['option_a', 'option_b', 'option_c', 'option_d'] as const).map((opt) => (
                  <div key={opt} className="mb-2">
                    <label className="block text-slate-400 text-xs mb-1 uppercase font-medium">{opt.replace('_', ' ')}</label>
                    <input
                      type="text"
                      value={newQ[opt]}
                      onChange={(e) => setNewQ({ ...newQ, [opt]: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0F172A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#6366F1] transition-all"
                      style={{ fontFamily: "'Noto Serif Devanagari', 'Noto Sans Devanagari', serif" }}
                    />
                  </div>
                ))}
                <div className="mb-4">
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">सत्यम् उत्तरम् (Correct Answer)</label>
                  <div className="relative">
                    <select
                      value={newQ.correct_answer}
                      onChange={(e) => setNewQ({ ...newQ, correct_answer: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#6366F1] appearance-none transition-all"
                    >
                      {['A', 'B', 'C', 'D'].map((o) => <option key={o} value={o}>Option {o}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveQuestion}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                  >
                    {editQId ? 'Update Question' : 'Add to Question Bank'}
                  </button>
                  {editQId && (
                    <button
                      onClick={() => { setEditQId(null); setNewQ({ text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', sort_order: 0, category_id: '' }); }}
                      className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="mb-4 flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!selectedCategory ? 'bg-[#6366F1] text-white' : 'bg-[#1E293B] text-slate-400 hover:bg-white/5'}`}
                >
                  All Questions
                </button>
                {testCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${selectedCategory === cat.id ? 'bg-[#6366F1] text-white' : 'bg-[#1E293B] text-slate-400 hover:bg-white/5'}`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
              
              <div className="bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-white/10 bg-white/5">
                  <span className="text-white font-semibold text-sm">📝 Question Bank ({filteredQuestions.length} questions)</span>
                  {selectedCategory && (
                    <span className="ml-2 text-xs text-teal-400">
                      {testCategories.find(c => c.id === selectedCategory)?.name}
                    </span>
                  )}
                </div>
                <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                  {filteredQuestions.map((q, i) => {
                    const category = testCategories.find(c => c.id === q.category_id);
                    return (
                      <div key={q.id} className="px-5 py-4 hover:bg-white/5 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {category && (
                                <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full">
                                  {category.icon} {category.name}
                                </span>
                              )}
                            </div>
                            <p className="text-white text-sm leading-relaxed" style={{ fontFamily: "'Noto Serif Devanagari', 'Noto Sans Devanagari', serif" }}>
                              {q.text}
                            </p>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div className="text-xs text-slate-400">A: {q.option_a}</div>
                              <div className="text-xs text-slate-400">B: {q.option_b}</div>
                              <div className="text-xs text-slate-400">C: {q.option_c}</div>
                              <div className="text-xs text-slate-400">D: {q.option_d}</div>
                            </div>
                            <div className="mt-2">
                              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">✓ Correct: {q.correct_answer}</span>
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
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIDEOS TAB */}
        {activeTab === 'videos' && (
          <div className="grid lg:grid-cols-5 gap-6 animate-fadeIn">
            <div className="lg:col-span-2">
              <div className="bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                    <Video className="w-3.5 h-3.5 text-white" />
                  </div>
                  {editVideoId ? 'Edit Video' : 'Add YouTube Video'}
                </h3>
                {(['topic', 'youtube_url', 'description', 'duration'] as const).map((field) => (
                  <div key={field} className="mb-3">
                    <label className="block text-slate-400 text-xs mb-1.5 font-medium capitalize">{field.replace('_', ' ')}</label>
                    <input
                      type="text"
                      value={newVideo[field]}
                      onChange={(e) => setNewVideo({ ...newVideo, [field]: e.target.value })}
                      placeholder={field === 'youtube_url' ? 'https://www.youtube.com/watch?v=...' : field === 'duration' ? '15 min' : ''}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#6366F1] transition-all"
                    />
                  </div>
                ))}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={saveVideo}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-red-500/30 transition-all"
                  >
                    {editVideoId ? 'Update Video' : 'Add to Library'}
                  </button>
                  {editVideoId && (
                    <button
                      onClick={() => { setEditVideoId(null); setNewVideo({ topic: '', youtube_url: '', description: '', duration: '15 min', thumbnail: '' }); }}
                      className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-white/10 bg-white/5">
                  <span className="text-white font-semibold text-sm">📹 Video Library ({videos.length})</span>
                </div>
                <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
                  {videos.map((v) => (
                    <div key={v.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{v.topic}</div>
                        <div className="text-slate-500 text-xs truncate mt-0.5">{v.youtube_url}</div>
                      </div>
                      <span className="text-slate-600 text-xs flex-shrink-0">{v.duration}</span>
                      <button onClick={() => editVideo(v)} className="text-slate-500 hover:text-[#6366F1] transition-colors p-1">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteVideo(v.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LIVE CLASSES TAB */}
        {activeTab === 'live' && (
          <div className="grid lg:grid-cols-5 gap-6 animate-fadeIn">
            <div className="lg:col-span-2">
              <div className="bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                    <Monitor className="w-3.5 h-3.5 text-white" />
                  </div>
                  {editLiveId ? 'Edit Live Class' : 'Schedule Live Class'}
                </h3>
                <div className="mb-3">
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">Class Title</label>
                  <input
                    type="text"
                    value={newLiveClass.title}
                    onChange={(e) => setNewLiveClass({ ...newLiveClass, title: e.target.value })}
                    placeholder="e.g., Advanced Sanskrit Grammar"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#6366F1] transition-all"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">YouTube Stream URL (Live or Premiere)</label>
                  <input
                    type="text"
                    value={newLiveClass.youtube_stream_url}
                    onChange={(e) => setNewLiveClass({ ...newLiveClass, youtube_stream_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#6366F1] transition-all"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    value={newLiveClass.scheduled_at}
                    onChange={(e) => setNewLiveClass({ ...newLiveClass, scheduled_at: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#6366F1] transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-slate-400 text-xs mb-1.5 font-medium">Duration (mins)</label>
                    <input
                      type="text"
                      value={newLiveClass.duration}
                      onChange={(e) => setNewLiveClass({ ...newLiveClass, duration: e.target.value })}
                      placeholder="60"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#6366F1] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1.5 font-medium">Status</label>
                    <button
                      onClick={() => setNewLiveClass({ ...newLiveClass, is_live: !newLiveClass.is_live })}
                      className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${newLiveClass.is_live ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}
                    >
                      {newLiveClass.is_live ? '🔴 LIVE NOW' : '⚪ Scheduled'}
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">Description</label>
                  <textarea
                    value={newLiveClass.description}
                    onChange={(e) => setNewLiveClass({ ...newLiveClass, description: e.target.value })}
                    rows={2}
                    placeholder="What will students learn?"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#6366F1] transition-all resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveLiveClass}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all"
                  >
                    {editLiveId ? 'Update Class' : 'Schedule Class'}
                  </button>
                  {editLiveId && (
                    <button
                      onClick={() => { setEditLiveId(null); setNewLiveClass({ title: '', youtube_stream_url: '', scheduled_at: '', duration: '60', description: '', is_live: false }); }}
                      className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-white/10 bg-white/5">
                  <span className="text-white font-semibold text-sm">📺 Live & Upcoming Classes ({liveClasses.length})</span>
                </div>
                <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                  {liveClasses.map((l) => (
                    <div key={l.id} className="px-5 py-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${l.is_live ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-white font-semibold">{l.title}</h4>
                            {l.is_live && (
                              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold animate-pulse">LIVE</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1.5">
                            <span className="text-slate-500 text-xs flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {new Date(l.scheduled_at).toLocaleString()}
                            </span>
                            <span className="text-slate-500 text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {l.duration} min
                            </span>
                          </div>
                          {l.description && (
                            <p className="text-slate-400 text-xs mt-1.5 line-clamp-1">{l.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          {!l.is_live && (
                            <button
                              onClick={() => toggleLiveStatus(l.id, l.is_live)}
                              className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-colors"
                            >
                              Start Live
                            </button>
                          )}
                          {l.is_live && (
                            <button
                              onClick={() => toggleLiveStatus(l.id, l.is_live)}
                              className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors"
                            >
                              End Class
                            </button>
                          )}
                          <button onClick={() => editLiveClass(l)} className="text-slate-500 hover:text-[#6366F1] transition-colors p-1">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteLiveClass(l.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1">
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

        {/* STUDY MATERIALS TAB */}
        {activeTab === 'materials' && (
          <div className="grid lg:grid-cols-5 gap-6 animate-fadeIn">
            <div className="lg:col-span-2">
              <div className="bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 flex items-center justify-center">
                    <Upload className="w-3.5 h-3.5 text-white" />
                  </div>
                  {editMaterialId ? 'Edit Material' : 'Upload Study Material'}
                </h3>
                <div className="mb-3">
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">Title</label>
                  <input
                    type="text"
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                    placeholder="e.g., Sanskrit Grammar PDF"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#6366F1] transition-all"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">Subject/Category</label>
                  <input
                    type="text"
                    value={newMaterial.subject}
                    onChange={(e) => setNewMaterial({ ...newMaterial, subject: e.target.value })}
                    placeholder="e.g., Grammar, Vocabulary, Literature"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#6366F1] transition-all"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">File URL (Google Drive / Direct Link)</label>
                  <input
                    type="text"
                    value={newMaterial.file_url}
                    onChange={(e) => setNewMaterial({ ...newMaterial, file_url: e.target.value })}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#6366F1] transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-slate-400 text-xs mb-1.5 font-medium">File Type</label>
                    <select
                      value={newMaterial.file_type}
                      onChange={(e) => setNewMaterial({ ...newMaterial, file_type: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#6366F1] transition-all"
                    >
                      <option value="pdf">PDF Document</option>
                      <option value="doc">Word Document</option>
                      <option value="ppt">PowerPoint</option>
                      <option value="video">Video File</option>
                      <option value="audio">Audio File</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1.5 font-medium">File Size</label>
                    <input
                      type="text"
                      value={newMaterial.size}
                      onChange={(e) => setNewMaterial({ ...newMaterial, size: e.target.value })}
                      placeholder="2.5 MB"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#6366F1] transition-all"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">Description</label>
                  <textarea
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                    rows={2}
                    placeholder="What's inside this material?"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#6366F1] transition-all resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveMaterial}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-yellow-500/30 transition-all"
                  >
                    {editMaterialId ? 'Update Material' : 'Upload Material'}
                  </button>
                  {editMaterialId && (
                    <button
                      onClick={() => { setEditMaterialId(null); setNewMaterial({ title: '', description: '', file_url: '', file_type: 'pdf', subject: '', size: '2.5 MB' }); }}
                      className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs text-blue-400 flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" />
                    Tip: Use Google Drive links with "anyone with link can view" permission
                  </p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-1 bg-[#1E293B] rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[#6366F1] text-white' : 'text-slate-500 hover:text-white'}`}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[#6366F1] text-white' : 'text-slate-500 hover:text-white'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-slate-500 text-xs">{materials.length} materials available</span>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {materials.map((m) => (
                    <div key={m.id} className="bg-[#1E293B]/80 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:scale-[1.02] transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold text-sm truncate">{m.title}</h4>
                          <p className="text-slate-500 text-xs mt-0.5">{m.subject || 'General'}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-slate-600 text-xs">{m.file_type.toUpperCase()}</span>
                            <span className="text-slate-600 text-xs">• {m.size || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => editMaterial(m)} className="text-slate-500 hover:text-[#6366F1] transition-colors p-1">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteMaterial(m.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {m.description && (
                        <p className="text-slate-400 text-xs mt-2 line-clamp-2">{m.description}</p>
                      )}
                      <a
                        href={m.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center justify-center gap-1 w-full py-1.5 rounded-lg bg-[#0F172A] text-slate-400 text-xs hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Preview Material
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                  <div className="divide-y divide-white/5">
                    {materials.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-medium truncate">{m.title}</div>
                          <div className="text-slate-500 text-xs truncate mt-0.5">{m.subject || 'General'} • {m.file_type.toUpperCase()} • {m.size}</div>
                        </div>
                        <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button onClick={() => editMaterial(m)} className="text-slate-500 hover:text-[#6366F1] transition-colors p-1">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteMaterial(m.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}