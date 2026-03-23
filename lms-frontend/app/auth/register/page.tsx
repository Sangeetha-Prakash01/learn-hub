'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/apiClient';
import { useAuthStore } from '../../../store/authStore';
import toast from 'react-hot-toast';
import { GraduationCap, Eye, EyeOff, Loader2, CheckCircle2, User, Mail, Lock, ShieldPlus, ArrowRight } from 'lucide-react';
import { OrbBackground } from '../../components/Design';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Min 6 chars', ok: password.length >= 6 },
    { label: 'Includes numbers', ok: /\d/.test(password) },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['bg-gray-200', 'bg-red-400', 'bg-yellow-400', 'bg-emerald-500'];
  const labels = ['', 'Weak', 'Fair', 'Strong'];

  if (!password) return null;
  return (
    <div className="mt-3 space-y-3">
      <div className="flex gap-1.5 px-0.5">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= score ? colors[score] : 'bg-white/10'}`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-y-1.5">
        {checks.map(c => (
          <div key={c.label} className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-tight ${c.ok ? 'text-[var(--green)]' : 'text-[var(--text3)]'}`}>
            <CheckCircle2 className={`w-3.5 h-3.5 ${c.ok ? 'text-[var(--green)]' : 'text-white/10'}`} />
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/register', {
        name: form.name, email: form.email, password: form.password,
      });
      login(data.user, data.accessToken);
      toast.success(`Welcome to LearnHub, ${data.user.name}!`);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 overflow-hidden">
      <OrbBackground />
      
      <div className="w-full max-w-md relative z-10 animate-fadeUp">
        <div className="glass p-10 rounded-[2.5rem] border border-white/10 shadow-3xl">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/20">
              <ShieldPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-[var(--text)] font-heading tracking-tight mb-2">Create Account</h1>
            <p className="text-[var(--text3)] text-sm font-medium">Join thousands of learners worldwide</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm mb-6 flex items-center gap-3 animate-shake">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5 group">
              <label className="text-[11px] font-bold text-[var(--text3)] uppercase tracking-widest pl-1">Full Name</label>
              <div className="relative">
                 <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text3)] group-focus-within:text-[var(--accent2)] transition-colors" />
                 <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input !pl-11" placeholder="John Doe" required />
              </div>
            </div>

            <div className="space-y-1.5 group">
              <label className="text-[11px] font-bold text-[var(--text3)] uppercase tracking-widest pl-1">Email Address</label>
              <div className="relative">
                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text3)] group-focus-within:text-[var(--accent2)] transition-colors" />
                 <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="input !pl-11" placeholder="john@example.com" required />
              </div>
            </div>

            <div className="space-y-1.5 group">
              <label className="text-[11px] font-bold text-[var(--text3)] uppercase tracking-widest pl-1">Choose Password</label>
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
              <PasswordStrength password={form.password} />
            </div>

            <div className="space-y-1.5 group">
              <label className="text-[11px] font-bold text-[var(--text3)] uppercase tracking-widest pl-1">Confirm Password</label>
              <input type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                className="input" placeholder="••••••••" required />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full !py-4 flex items-center justify-center gap-2 font-bold tracking-tight mt-4 group">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Learning Free'}
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--text3)] font-medium">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[var(--accent2)] font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
