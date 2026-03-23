'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { OrbBackground } from '../../components/Design';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(t); router.push('/profile'); }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 overflow-hidden">
      <OrbBackground />
      
      <div className="relative z-10 w-full max-w-md animate-fadeUp">
        <div className="glass p-12 rounded-[3rem] border border-white/10 shadow-3xl text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--green)] to-[var(--cyan)]" />
          
          <div className="w-24 h-24 bg-[var(--green)]/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-[var(--green)]/30 shadow-2xl shadow-emerald-500/10 animate-bounce">
            <ShieldCheck className="w-12 h-12 text-[var(--green)]" />
          </div>
          
          <h1 className="text-3xl font-extrabold text-white font-heading tracking-tight mb-4">Payment Verified! 🎉</h1>
          <p className="text-[var(--text2)] text-base font-medium mb-10 leading-relaxed px-4">
             Unlock complete. You're now officially enrolled in the course. 
             Time to start your journey to mastery!
          </p>
          
          <div className="space-y-4">
            <Link href="/profile" className="btn-primary w-full !py-4 font-bold tracking-tight rounded-2xl flex items-center justify-center gap-2 group/btn">
              Go to My Learning <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-all" />
            </Link>
            
            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-[var(--text3)] uppercase tracking-[0.2em] pt-4">
               <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
               Redirecting in {countdown}s
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
