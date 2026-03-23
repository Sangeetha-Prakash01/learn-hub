'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '../lib/apiClient';
import Link from 'next/link';
import { useAuthStore } from '../store/authStore';
import { Search, Star, Users, BookOpen, Clock, ArrowRight, Sparkles, EyeOff, Play, Zap } from 'lucide-react';
import { OrbBackground } from './components/Design';

interface Subject {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  price: string;
  isPublished: boolean;
  instructor: { name: string };
  totalVideos: number;
  _count: { enrollments: number };
}

function CourseCard({ course }: { course: Subject }) {
  const isFree = Number(course.price) === 0;
  
  return (
    <Link href={`/subjects/${course.id}`} className="course-card-custom group flex flex-col h-full relative">
      {/* Thumbnail */}
      <div className="relative h-44 overflow-hidden">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--accent)] to-[var(--purple)] flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-white/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {!course.isPublished && (
            <span className="badge badge-red !text-[10px] !py-0.5 !px-2">DRAFT</span>
          )}
        </div>
        
        <div className="absolute top-3 right-3">
          <span className={`badge ${isFree ? 'badge-green' : 'badge-amber'}`}>
            {isFree ? '● Free' : `$${Number(course.price).toFixed(0)}`}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-heading font-bold text-[var(--text)] text-sm leading-snug line-clamp-2 mb-1.5 group-hover:text-[var(--accent2)] transition-colors">
          {course.title}
        </h3>
        <p className="text-[11px] text-[var(--text3)] mb-3 font-medium">{course.instructor?.name}</p>
        <p className="text-[12px] text-[var(--text2)] line-clamp-2 mb-4 flex-1 h-8 opacity-80">{course.description}</p>

        <div className="flex items-center gap-3 text-[11px] text-[var(--text3)] pt-3 border-t border-[var(--border)]">
          <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />{course.totalVideos}</span>
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{course._count?.enrollments || 0}</span>
          <div className="ml-auto flex items-center gap-1 text-amber-500 font-bold font-heading">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>4.8</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="skeleton h-[320px] rounded-[2rem]" />
  );
}

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore();
  const [courses, setCourses] = useState<Subject[]>([]);
  const [enrolled, setEnrolled] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const includeDrafts = user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR';
      const [subjectsRes, enrolledRes] = await Promise.all([
        api.get('/api/subjects', { params: { pageSize: 24, q: query || undefined, includeDrafts } }),
        isAuthenticated ? api.get('/api/subjects', { params: { enrolledOnly: true } }) : Promise.resolve({ data: { subjects: [] } })
      ]);
      setCourses(subjectsRes.data.subjects);
      setEnrolled(enrolledRes.data.subjects);
    } catch { 
      setCourses([]); 
    } finally { 
      setLoading(false); 
    }
  }, [query, user, isAuthenticated]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(search);
  };

  return (
    <div className="relative z-10">
      <OrbBackground />

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 text-center">
        <div className="inline-flex items-center gap-2.5 badge badge-purple !py-2 !px-4 mb-8 pulse">
          <Zap className="w-3.5 h-3.5 text-[var(--accent2)]" /> 
          <span className="text-[13px] font-semibold">150+ courses updated this month</span>
        </div>
        
        <h1 className="text-4xl md:text-7xl font-extrabold mb-6 font-heading tracking-tight leading-[1.05] text-[var(--text)]">
          Learn Without <span className="grad">Limits</span>
        </h1>
        
        <p className="text-[var(--text2)] text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Expert-led courses with hands-on projects. Master skills that matter to your career growth.
        </p>

        <form onSubmit={handleSearch} className="max-w-lg mx-auto relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <Search className="w-5 h-5 text-[var(--text3)]" />
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search for skills, software, or topics..."
            className="input !pl-12 !h-14 !text-base !rounded-2xl transition-all group-focus-within:border-[var(--accent)] group-focus-within:ring-4 group-focus-within:ring-indigo-500/10 shadow-2xl"
          />
        </form>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-16 pb-12">
          {[
            ['50k+', 'Students'], 
            ['200+', 'Courses'], 
            ['4.9★', 'Rating'], 
            ['24/7', 'Access']
          ].map(([val, label]) => (
            <div key={label} className="text-center group">
              <div className="text-3xl font-extrabold text-[var(--text)] font-heading mb-1 group-hover:scale-110 transition-transform">{val}</div>
              <div className="text-[10px] text-[var(--text3)] uppercase tracking-[0.2em] font-bold">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Enrolled Courses */}
      {isAuthenticated && enrolled.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-12">
           <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--border)]">
            <h2 className="text-xl md:text-2xl font-bold font-heading text-[var(--text)]">My Learning</h2>
            <Link href="/profile" className="text-sm text-[var(--accent2)] font-semibold hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {enrolled.slice(0, 4).map(c => (
               <Link key={c.id} href={`/subjects/${c.id}`} className="course-card-custom group">
                  <div className="h-32 relative overflow-hidden">
                    <img src={c.thumbnail} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 bg-[var(--accent)] rounded-full flex items-center justify-center text-white scale-75 group-hover:scale-100 transition-transform">
                        <Play className="w-5 h-5 fill-current" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading font-bold text-[13px] text-[var(--text)] truncate mb-1">{c.title}</h3>
                    <div className="flex justify-between items-center text-[11px] text-[var(--text3)]">
                      <span>Progress</span>
                      <span className="text-[var(--accent2)] font-bold">48%</span>
                    </div>
                    <div className="w-full h-1 bg-[var(--surface3)] rounded-full mt-2">
                      <div className="h-full bg-indigo-500 rounded-full" style={{width: '48%'}} />
                    </div>
                  </div>
               </Link>
            ))}
          </div>
        </section>
      )}

      {/* Main Grid */}
      <section className="max-w-7xl mx-auto px-6 py-12 mb-20">
        <div className="flex items-center justify-between mb-10 pb-4 border-b border-[var(--border)]">
          <h2 className="text-xl md:text-2xl font-bold font-heading text-[var(--text)]">
            {query ? `Results for "${query}"` : 'Recommended Courses'}
          </h2>
          <span className="text-[12px] text-[var(--text3)] font-semibold bg-[var(--surface2)] py-1 px-3 rounded-full">{courses.length} courses</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-[320px] rounded-2xl" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 glass rounded-3xl">
            <BookOpen className="w-12 h-12 text-[var(--text3)] mx-auto mb-4 opacity-50" />
            <p className="text-[var(--text2)] text-lg font-medium">No courses found matching your search</p>
            <button onClick={() => { setQuery(''); setSearch(''); }} className="mt-4 text-[var(--accent2)] font-bold">Clear all search</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map(c => <CourseCard key={c.id} course={c} />)}
          </div>
        )}
      </section>
    </div>
  );
}
