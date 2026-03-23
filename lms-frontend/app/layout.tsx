'use client';
import './globals.css';
import Link from 'next/link';
import { useAuthStore } from '../store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import api from '../lib/apiClient';
import toast, { Toaster } from 'react-hot-toast';
import { BookOpen, LogOut, User, LayoutDashboard, GraduationCap, Zap, Layers, Menu, X, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { OrbBackground } from './components/Design';
import AIChat from './components/AIChat';

function AuthCheck({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, login } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      api.post('/api/auth/refresh')
        .then(r => login(r.data.user, r.data.accessToken))
        .catch(() => {})
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <GraduationCap className="w-12 h-12 text-amber-500 animate-bounce" />
        <div className="h-1 w-32 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 animate-[loading_1.5s_infinite]" />
        </div>
      </div>
      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );

  return <>{children}</>;
}

function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await api.post('/api/auth/logout').catch(() => {});
    logout();
    toast.success('Logged out');
    router.push('/');
  };

  const navItems = [
    { id: 'home', label: 'Courses', href: '/' },
    { id: 'profile', label: 'My Learning', href: '/profile', auth: true },
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', auth: true, roles: ['INSTRUCTOR', 'ADMIN'] },
  ];

  return (
    <nav className="nav-custom">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <span className="font-heading font-bold text-xl text-[var(--text)] tracking-tight">LearnHub</span>
      </Link>

      {/* Nav tabs */}
      <div className="flex gap-1 flex-1">
        {navItems.filter(item => !item.auth || (isAuthenticated && (!item.roles || item.roles.includes(user?.role || '')))).map(item => (
          <Link key={item.id} href={item.href}
            className={`tab-custom ${pathname === item.href ? 'active' : ''}`}>
            {item.label}
          </Link>
        ))}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {!isAuthenticated ? (
          <>
            <Link href="/auth/login" className="btn-ghost !text-xs !py-1.5 !px-4">Sign in</Link>
            <Link href="/auth/register" className="btn-primary !text-xs !py-1.5 !px-4">Get started</Link>
          </>
        ) : (
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2.5 bg-[var(--surface)] border border-[var(--border2)] rounded-xl py-1.5 pl-1.5 pr-4 transition-all hover:border-[var(--border3)]">
              <div className="avatar-custom">{user?.name?.[0]?.toUpperCase()}</div>
              <span className="hidden md:block text-xs font-semibold text-[var(--text2)] font-heading">{user?.name}</span>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-12 bg-[var(--bg2)] border border-[var(--border2)] rounded-xl p-2 w-56 z-50 shadow-2xl glass animate-fadeUp">
                  <Link href="/profile" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--text2)] hover:bg-[var(--surface2)] hover:text-[var(--text)] rounded-lg transition-colors">
                    <BookOpen className="w-4 h-4" /> My Profile
                  </Link>
                  {(user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN') && (
                    <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--text2)] hover:bg-[var(--surface2)] hover:text-[var(--text)] rounded-lg transition-colors">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                  )}
                  <div className="h-px bg-[var(--border)] my-1.5 mx-1" />
                  <button onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg w-full text-left transition-colors font-medium">
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>LearnHub – Learn Without Limits</title>
        <meta name="description" content="Master new skills with expert-led courses" />
      </head>
      <body className="noise overflow-x-hidden">
        <AuthCheck>
          <div className="relative min-h-screen">
             <Navbar />
             <main className="relative z-10">{children}</main>
             <AIChat />
          </div>
          <Toaster position="top-right" toastOptions={{
            style: { 
              fontFamily: 'var(--font-body)', 
              fontSize: '14px',
              background: 'var(--bg2)',
              color: 'var(--text)',
              border: '1px solid var(--border2)',
              backdropFilter: 'blur(10px)'
            },
          }} />
        </AuthCheck>
      </body>
    </html>
  );
}
