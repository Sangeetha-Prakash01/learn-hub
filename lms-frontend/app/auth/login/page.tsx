'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/apiClient';
import { useAuthStore } from '../../../store/authStore';
import toast from 'react-hot-toast';
import { GraduationCap, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, Mail, Lock, User } from 'lucide-react';
import { OrbBackground } from '../../components/Design';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', form);
      login(data.user, data.accessToken);
      toast.success(`Welcome back, ${data.user.name}!`);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 overflow-hidden">
      <OrbBackground />
      
      <div className="w-full max-w-md relative z-10 animate-fadeUp">
        <div className="glass p-10 rounded-[2.5rem] border border-white/10 shadow-3xl">
          <div className="text-center mb-10">
            <div className="w-14 h-14 bg-[var(--accent)] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-[var(--text)] font-heading tracking-tight mb-2">Welcome Back</h1>
            <p className="text-[var(--text3)] text-sm font-medium">Continue your learning journey today</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm mb-8 flex items-center gap-3 animate-shake">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 group">
              <label className="text-[11px] font-bold text-[var(--text3)] uppercase tracking-widest pl-1">Email Address</label>
              <div className="relative">
                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text3)] group-focus-within:text-[var(--accent2)] transition-colors" />
                 <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="input !pl-11" placeholder="name@company.com" required />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="text-[11px] font-bold text-[var(--text3)] uppercase tracking-widest pl-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text3)] group-focus-within:text-[var(--accent2)] transition-colors" />
                <input type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input !pl-11 !pr-11" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)] transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full !py-4 flex items-center justify-center gap-2 font-bold tracking-tight mt-4 group">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enter LearnHub'}
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-[var(--text3)] font-medium">
              New to our platform?{' '}
              <Link href="/auth/register" className="text-[var(--accent2)] font-bold hover:underline">Create Account</Link>
            </p>
          </div>

          {/* Demo Table */}
          <div className="mt-10 pt-8 border-t border-white/5">
            <p className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-[0.2em] mb-4 text-center">Testing Credentials</p>
            <div className="grid gap-2 text-[10px] font-bold">
               {[
                 { role: 'Student', email: 'student@lms.com' },
                 { role: 'Instructor', email: 'instructor@lms.com' },
                 { role: 'Admin', email: 'admin@lms.com' }
               ].map((c) => (
                 <div key={c.role} className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[var(--text2)]">{c.role}</span>
                    <span className="text-[var(--accent3)] opacity-80">{c.email}</span>
                 </div>
               ))}
               <div className="text-center mt-2 text-[var(--text3)] italic font-medium">Password: <span className="text-white">student123</span> / <span className="text-white">admin123</span> etc</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
