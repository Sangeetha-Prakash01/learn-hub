'use client';
import Link from 'next/link';
import { XCircle, ArrowLeft, RefreshCw, Undo2 } from 'lucide-react';
import { OrbBackground } from '../../components/Design';

export default function PaymentCancelPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 overflow-hidden">
      <OrbBackground />
      
      <div className="relative z-10 w-full max-w-md animate-fadeUp">
        <div className="glass p-12 rounded-[3rem] border border-white/10 shadow-3xl text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--red)] to-orange-500" />
          
          <div className="w-24 h-24 bg-[var(--red)]/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-[var(--red)]/30 shadow-2xl shadow-red-500/10">
            <XCircle className="w-12 h-12 text-[var(--red)]" />
          </div>
          
          <h1 className="text-3xl font-extrabold text-white font-heading tracking-tight mb-4">Payment Paused</h1>
          <p className="text-[var(--text2)] text-base font-medium mb-10 leading-relaxed px-4">
             Your transaction was cancelled and no charges were made. 
             Whenever you're ready, we'll be here to help you get started.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => history.back()} className="btn-primary !py-4 font-bold tracking-tight rounded-2xl flex items-center justify-center gap-2 group/btn">
              <RefreshCw className="w-4 h-4 group-hover/btn:rotate-180 transition-transform duration-500" />
              Try Again
            </button>
            <Link href="/" className="btn-secondary !py-4 font-bold tracking-tight rounded-2xl flex items-center justify-center gap-2 group/btn">
              <ArrowLeft className="w-4 h-4 group-hover/btn:-translate-x-1 transition-all" />
              Browse
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
