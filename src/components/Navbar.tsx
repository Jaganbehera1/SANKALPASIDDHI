import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Lock, LogOut, Menu, X } from 'lucide-react';

interface NavbarProps {
  isAdminLoggedIn: boolean;
  onAdminLogout: () => void;
}

export default function Navbar({ isAdminLoggedIn, onAdminLogout }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Mock Test', to: '/mock-test' },
  ];

  const isActive = (to: string) => location.pathname === to;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F172A]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-white font-bold text-sm tracking-wide">Sankalpasiddhi</span>
              <span className="text-[#6366F1] text-[10px] font-medium tracking-widest">संकल्पसिद्धि</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.to)
                    ? 'bg-[#6366F1]/20 text-[#6366F1]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAdminLoggedIn && (
              <Link
                to="/admin-dashboard"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive('/admin-dashboard')
                    ? 'bg-[#6366F1]/20 text-[#6366F1]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {isAdminLoggedIn ? (
              <button
                onClick={() => { onAdminLogout(); navigate('/'); }}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            ) : (
              <button
                onClick={() => navigate('/admin-dashboard')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
                title="Admin Login"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}
            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#1E293B] border-t border-white/10">
          <div className="px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.to)
                    ? 'bg-[#6366F1]/20 text-[#6366F1]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAdminLoggedIn && (
              <>
                <Link
                  to="/admin-dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => { onAdminLogout(); navigate('/'); setMenuOpen(false); }}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 text-left transition-all"
                >
                  Logout
                </button>
              </>
            )}
            {!isAdminLoggedIn && (
              <button
                onClick={() => { navigate('/admin-dashboard'); setMenuOpen(false); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
              >
                <Lock className="w-4 h-4" /> Admin Login
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
