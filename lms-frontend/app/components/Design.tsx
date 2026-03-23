'use client';

export function OrbBackground() {
  return (
    <>
      <div className="orb" style={{ width: 600, height: 600, top: -200, left: -200, background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
      <div className="orb" style={{ width: 500, height: 500, top: '30%', right: -100, background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)' }} />
      <div className="orb" style={{ width: 400, height: 400, bottom: 0, left: '40%', background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)' }} />
    </>
  );
}
