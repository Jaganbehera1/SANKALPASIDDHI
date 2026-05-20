import { useEffect, useState } from 'react';
import { 
  Key, BookOpen, FileText, Download, ExternalLink, 
  Eye, CheckCircle, XCircle, AlertCircle, Shield,
  Search, Filter, Grid3x3, List, Clock, File,
  Video, Music, FileArchive, Image as ImageIcon, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ref, get, update, push, set } from 'firebase/database';
import { db } from '../lib/firebase';

interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: 'pdf' | 'doc' | 'ppt' | 'video' | 'audio' | 'image' | 'other';
  subject: string;
  size: string;
  created_at: string;
  downloads: number;
}

interface MaterialAccess {
  id: string;
  code: string;
  student_name: string;
  accessed_at: string;
  materials_viewed: string[];
}

type Stage = 'code-entry' | 'materials';

export default function StudyMaterials() {
  const [stage, setStage] = useState<Stage>('code-entry');
  const [codeInput, setCodeInput] = useState('');
  const [studentName, setStudentName] = useState('');
  const [accessCode, setAccessCode] = useState<any>(null);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [subjects, setSubjects] = useState<string[]>([]);

  useEffect(() => {
    if (stage === 'materials') {
      fetchMaterials();
    }
  }, [stage]);

  async function fetchMaterials() {
    setLoading(true);
    try {
      const materialsRef = ref(db, 'study_materials');
      const snapshot = await get(materialsRef);
      
      if (snapshot.exists()) {
        const materialsData = snapshot.val();
        const materialsList = Object.entries(materialsData)
          .map(([id, data]: [string, any]) => ({
            id,
            ...data
          }))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setMaterials(materialsList);
        
        // Extract unique subjects for filter
        const uniqueSubjects = [...new Set(materialsList.map(m => m.subject).filter(Boolean))];
        setSubjects(uniqueSubjects);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to load study materials');
    } finally {
      setLoading(false);
    }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = codeInput.trim().toUpperCase();

    if (!studentName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setLoading(true);

    try {
      const codesRef = ref(db, 'material_access_codes');
      const snapshot = await get(codesRef);
      
      let foundCode: any = null;
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
        toast.error('Invalid access code. Please check and try again.');
        setLoading(false);
        return;
      }
      
      if (foundCode.used) {
        toast.error('This code has already been used.');
        setLoading(false);
        return;
      }

      // Mark code as used
      const codeRef = ref(db, `material_access_codes/${foundCode.id}`);
      await update(codeRef, { 
        used: true, 
        used_at: new Date().toISOString(),
        student_name: studentName.trim()
      });

      // Record access
      const accessRef = ref(db, 'material_access_logs');
      await push(accessRef, {
        code: code,
        student_name: studentName.trim(),
        accessed_at: new Date().toISOString()
      });

      setAccessCode(foundCode);
      setStage('materials');
      toast.success(`✨ Access granted! Welcome, ${studentName}`);
    } catch (error) {
      toast.error('Failed to verify code');
    } finally {
      setLoading(false);
    }
  }

  function handleDownload(material: StudyMaterial) {
    // Track download
    const materialRef = ref(db, `study_materials/${material.id}`);
    update(materialRef, { downloads: (material.downloads || 0) + 1 });
    
    // Open file in new tab
    window.open(material.file_url, '_blank');
    toast.success(`Opening ${material.title}`);
  }

  function getFileIcon(fileType: string) {
    switch (fileType) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-400" />;
      case 'doc':
        return <FileText className="w-5 h-5 text-blue-400" />;
      case 'ppt':
        return <FileText className="w-5 h-5 text-orange-400" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-green-400" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-pink-400" />;
      default:
        return <File className="w-5 h-5 text-slate-400" />;
    }
  }

  function getFileColor(fileType: string) {
    switch (fileType) {
      case 'pdf': return 'from-red-500/20 to-red-600/10 border-red-500/30';
      case 'doc': return 'from-blue-500/20 to-blue-600/10 border-blue-500/30';
      case 'ppt': return 'from-orange-500/20 to-orange-600/10 border-orange-500/30';
      case 'video': return 'from-purple-500/20 to-purple-600/10 border-purple-500/30';
      case 'audio': return 'from-green-500/20 to-green-600/10 border-green-500/30';
      case 'image': return 'from-pink-500/20 to-pink-600/10 border-pink-500/30';
      default: return 'from-slate-500/20 to-slate-600/10 border-slate-500/30';
    }
  }

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          material.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || material.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  // CODE ENTRY SCREEN
  if (stage === 'code-entry') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] flex items-center justify-center px-4 pt-16">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070')] opacity-5 bg-cover bg-center pointer-events-none"></div>
        
        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-8 animate-fadeIn">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-teal-500/30 animate-bounce-slow">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-2">
              Study Materials
            </h1>
            <p className="text-slate-500 text-sm">Enter your access code to view and download study materials</p>
          </div>

          <form onSubmit={handleCodeSubmit} className="bg-[#1E293B]/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
            <label className="block text-slate-300 text-sm font-medium mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Your Name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all mb-4"
              required
            />

            <label className="block text-slate-300 text-sm font-medium mb-2 flex items-center gap-2">
              <Key className="w-4 h-4" />
              Access Code
            </label>
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="e.g., STUDY001"
              className="w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-mono tracking-wider uppercase"
              autoComplete="off"
              spellCheck={false}
              required
            />
            
            <button
              type="submit"
              disabled={loading || !codeInput.trim() || !studentName.trim()}
              className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-teal-500/30 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Verify & Access Materials
                </>
              )}
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

  // MATERIALS DISPLAY SCREEN
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] pt-24 pb-12 px-4">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070')] opacity-5 bg-cover bg-center pointer-events-none"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-medium mb-4">
            <CheckCircle className="w-3 h-3" />
            Access Granted
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Study Materials
          </h1>
          <p className="text-slate-400">
            Welcome, <span className="text-teal-400 font-medium">{studentName}</span>! Browse and download your study materials.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search materials by title or description..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#1E293B] border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
            />
          </div>
          
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-[#1E293B] border border-white/10 text-white text-sm focus:outline-none focus:border-teal-500 transition-all"
          >
            <option value="all">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>

          <div className="flex gap-1 bg-[#1E293B] rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-teal-500 text-white' : 'text-slate-500 hover:text-white'}`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-teal-500 text-white' : 'text-slate-500 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Materials Count */}
        <div className="mb-4 text-sm text-slate-500">
          {filteredMaterials.length} {filteredMaterials.length === 1 ? 'material' : 'materials'} available
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Materials Grid/List View */}
        {!loading && filteredMaterials.length === 0 && (
          <div className="text-center py-12 bg-[#1E293B]/50 rounded-2xl border border-white/10">
            <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Materials Found</h3>
            <p className="text-slate-400">No study materials available at the moment. Check back later!</p>
          </div>
        )}

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((material) => (
              <div
                key={material.id}
                className={`group bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl border overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${getFileColor(material.file_type)}`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                      {getFileIcon(material.file_type)}
                    </div>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(material.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="text-white font-semibold text-lg mb-1 line-clamp-1">
                    {material.title}
                  </h3>
                  
                  {material.subject && (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 text-xs font-medium mb-2">
                      {material.subject}
                    </span>
                  )}
                  
                  {material.description && (
                    <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                      {material.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <File className="w-3 h-3" />
                      <span>{material.file_type.toUpperCase()}</span>
                      <span>•</span>
                      <span>{material.size || 'N/A'}</span>
                    </div>
                    
                    <button
                      onClick={() => handleDownload(material)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-400 text-xs font-medium hover:bg-teal-500/30 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Open
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMaterials.map((material) => (
              <div
                key={material.id}
                className={`group bg-[#1E293B]/80 backdrop-blur-sm rounded-xl border p-4 transition-all duration-300 hover:bg-[#1E293B] ${getFileColor(material.file_type)}`}
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center flex-shrink-0">
                      {getFileIcon(material.file_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-base truncate">
                        {material.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        {material.subject && (
                          <span className="text-teal-400">{material.subject}</span>
                        )}
                        <span>{material.file_type.toUpperCase()}</span>
                        <span>{material.size || 'N/A'}</span>
                        <span>{new Date(material.created_at).toLocaleDateString()}</span>
                      </div>
                      {material.description && (
                        <p className="text-slate-400 text-xs mt-1 line-clamp-1">
                          {material.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDownload(material)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-500/20 text-teal-400 text-sm font-medium hover:bg-teal-500/30 transition-colors flex-shrink-0"
                  >
                    <Eye className="w-4 h-4" />
                    View Material
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-8 text-center text-xs text-slate-600">
          <p>These materials are for educational purposes only. Please do not share or distribute.</p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
      `}</style>
    </div>
  );
}
