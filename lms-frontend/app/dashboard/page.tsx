'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/apiClient';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Plus, BookOpen, Users, Eye, EyeOff, Loader2, LayoutDashboard, Trash2, ArrowRight, Zap, Target, CheckCircle } from 'lucide-react';
import { OrbBackground } from '../components/Design';

interface Subject {
  id: number; title: string; slug: string; price: string;
  isPublished: boolean; thumbnail: string;
  instructor: { name: string };
  _count: { enrollments: number };
  totalVideos: number;
}

function CreateCourseModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', price: '0', thumbnail: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await api.post('/api/subjects', { ...form, slug, price: parseFloat(form.price) || 0 });
      toast.success('Course created!');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create course');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
      <div className="glass p-8 w-full max-w-xl shadow-2xl rounded-3xl border border-white/10 animate-fadeUp">
        <h2 className="text-2xl font-bold text-[var(--text)] mb-8 font-heading flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--accent)] rounded-xl flex items-center justify-center">
            <Plus className="w-5 h-5 text-white" />
          </div>
          Create New Course
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text3)] uppercase tracking-widest pl-1">Course Title</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="input !h-12" placeholder="e.g. Advanced System Design" required />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text3)] uppercase tracking-widest pl-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="input !h-32 pt-3 resize-none" placeholder="Explain the course outcomes..." required />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text3)] uppercase tracking-widest pl-1">Price (USD)</label>
              <input type="number" step="0.01" min="0" value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className="input !h-12" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text3)] uppercase tracking-widest pl-1">Thumbnail</label>
              <input value={form.thumbnail} onChange={e => setForm({ ...form, thumbnail: e.target.value })}
                className="input !h-12" placeholder="https://..." />
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary !py-4 flex-1 font-bold">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary !py-4 flex-1 flex items-center justify-center gap-2 font-bold group">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddVideoModal({ subjectId, onClose, onAdded }: { subjectId: number; onClose: () => void; onAdded: () => void }) {
  const [sections, setSections] = useState<any[]>([]);
  const [form, setForm] = useState({ sectionId: '', title: '', youtubeUrl: '', orderIndex: '0', durationSeconds: '', isFree: false });
  const [newSection, setNewSection] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/api/subjects/${subjectId}/tree`)
      .then(r => setSections(r.data.sections || []))
      .catch(() => {});
  }, [subjectId]);

  const handleAddSection = async () => {
    if (!newSection.trim()) return;
    try {
      const { data } = await api.post(`/api/subjects/${subjectId}/sections`, {
        title: newSection, orderIndex: sections.length,
      });
      setSections([...sections, data.section]);
      setNewSection('');
      toast.success('Section added!');
    } catch { toast.error('Failed to add section'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sectionId) { toast.error('Select a section'); return; }
    setLoading(true);
    try {
      const match = form.youtubeUrl.match(/^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      const videoId = match ? match[1] : form.youtubeUrl;
      const formattedUrl = `https://www.youtube.com/embed/${videoId}`;

      await api.post(`/api/subjects/${subjectId}/sections/${form.sectionId}/videos`, {
        title: form.title,
        youtubeUrl: formattedUrl,
        isFree: form.isFree,
        orderIndex: form.orderIndex ? parseInt(form.orderIndex) : undefined,
        durationSeconds: form.durationSeconds ? parseInt(form.durationSeconds) : undefined,
      });
      toast.success('Video added!');
      onAdded();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add video');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl my-4">
        <h2 className="text-xl font-extrabold text-gray-900 mb-6">Add Content</h2>

        {/* Add section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm font-bold text-gray-700 mb-2">Add New Section</p>
          <div className="flex gap-2">
            <input value={newSection} onChange={e => setNewSection(e.target.value)}
              className="input flex-1 py-2" placeholder="Section title" />
            <button onClick={handleAddSection} className="btn-primary py-2 px-4 text-sm">Add</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Section</label>
            <select value={form.sectionId} onChange={e => setForm({ ...form, sectionId: e.target.value })}
              className="input" required>
              <option value="">Select section...</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Video Title</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="input" placeholder="Introduction to Variables" required />
          </div>
          <div>
            <label className="label">YouTube URL or Video ID</label>
            <input value={form.youtubeUrl} onChange={e => setForm({ ...form, youtubeUrl: e.target.value })}
              className="input" placeholder="https://youtube.com/watch?v=... or video ID" required />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="label">Order Index</label>
              <input type="number" value={form.orderIndex} onChange={e => setForm({ ...form, orderIndex: e.target.value })}
                className="input" min="0" />
            </div>
            <div className="flex-1">
              <label className="label">Duration (seconds)</label>
              <input type="number" value={form.durationSeconds} onChange={e => setForm({ ...form, durationSeconds: e.target.value })}
                className="input" placeholder="e.g. 600" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isFree} onChange={e => setForm({ ...form, isFree: e.target.checked })}
              className="w-4 h-4 accent-amber-500" />
            <span className="text-sm font-medium text-gray-700">Free preview video</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Add Video
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [courses, setCourses] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [addVideoFor, setAddVideoFor] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    if (user?.role === 'STUDENT') { router.push('/'); return; }
    fetchCourses();
  }, [isAuthenticated, user]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/subjects', { params: { pageSize: 100, includeDrafts: true } });
      setCourses(data.subjects.filter((s: any) =>
        user?.role === 'ADMIN' || s.instructorId === user?.id
      ));
    } catch {} finally { setLoading(false); }
  };

  const togglePublish = async (id: number, current: boolean) => {
    try {
      await api.patch(`/api/subjects/${id}/publish`, { isPublished: !current });
      toast.success(current ? 'Course unpublished' : 'Course published!');
      fetchCourses();
    } catch { toast.error('Failed to update'); }
  };

  const totalStudents = courses.reduce((a, c) => a + (c._count?.enrollments || 0), 0);

  return (
    <div className="relative z-10 min-h-screen">
      <OrbBackground />
      {showCreate && <CreateCourseModal onClose={() => setShowCreate(false)} onCreated={fetchCourses} />}
      {addVideoFor && <AddVideoModal subjectId={addVideoFor} onClose={() => setAddVideoFor(null)} onAdded={fetchCourses} />}

      <div className="max-w-6xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center border border-amber-500/20">
                 <LayoutDashboard className="w-5 h-5" />
               </div>
               <h1 className="text-3xl font-extrabold text-[var(--text)] font-heading">Instructor Hub</h1>
            </div>
            <p className="text-[var(--text3)] text-sm font-medium">Create and manage your educational content</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary !py-4 px-8 font-bold flex items-center gap-2 group">
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> 
            <span>Build New Course</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { label: 'Active Courses', val: courses.length, icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
            { label: 'Total Students', val: totalStudents, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
            { label: 'Published Units', val: courses.filter(c => c.isPublished).length, icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
          ].map((s, i) => (
             <div key={i} className="glass p-6 rounded-3xl border border-white/5 group hover:border-white/10 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--text3)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
                <div className="text-3xl font-extrabold text-[var(--text)] font-heading mb-1">{s.val}</div>
                <div className="text-[10px] text-[var(--text3)] font-bold uppercase tracking-widest">{s.label}</div>
             </div>
          ))}
        </div>

        {/* Content Section */}
        <div className="mb-8 flex items-center gap-4">
           <h2 className="text-xl font-bold font-heading text-[var(--text)]">Your Curriculum</h2>
           <div className="h-px bg-[var(--border)] flex-1" />
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="glass p-20 text-center rounded-[2rem] border border-white/5">
            <div className="w-20 h-20 bg-[var(--surface2)] rounded-full flex items-center justify-center mx-auto mb-6">
               <BookOpen className="w-8 h-8 text-[var(--text3)]" />
            </div>
            <p className="text-lg font-bold text-[var(--text2)] mb-2">No courses started yet</p>
            <p className="text-[var(--text3)] text-sm mb-8">Ready to share your knowledge with the world?</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary px-8">Launch Course Creator</button>
          </div>
        ) : (
          <div className="grid gap-4">
            {courses.map(course => (
              <div key={course.id} className="glass group overflow-hidden border border-white/5 hover:border-white/10 transition-all p-4 flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-lg relative">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-[var(--text3)]" />
                    </div>
                  )}
                  {!course.isPublished && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">Draft</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center md:text-left min-w-0">
                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-[var(--text)] font-heading truncate max-w-sm">{course.title}</h3>
                    {course.isPublished && <CheckCircle className="w-4 h-4 text-[var(--green)]" />}
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-[11px] font-bold text-[var(--text3)] uppercase tracking-wide">
                    <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" />{course.totalVideos} Videos</span>
                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{course._count?.enrollments} Students</span>
                    <span className={`px-2 py-0.5 rounded ${Number(course.price) === 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {Number(course.price) === 0 ? 'Free' : `$${Number(course.price)}`}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2 shrink-0 pr-4">
                  <button onClick={() => setAddVideoFor(course.id)}
                    className="btn-ghost !text-[11px] !py-2 !px-4 flex items-center gap-2 hover:bg-[var(--surface2)]">
                    <Plus className="w-3.5 h-3.5" /> Add Content
                  </button>
                  <button onClick={() => togglePublish(course.id, course.isPublished)}
                    className="btn-ghost !text-[11px] !py-2 !px-4 flex items-center gap-2 hover:bg-[var(--surface2)]">
                    {course.isPublished ? (
                       <><EyeOff className="w-3.5 h-3.5 text-red-400" /> <span className="text-red-400">Unpublish</span></>
                    ) : (
                       <><Eye className="w-3.5 h-3.5 text-emerald-400" /> <span className="text-emerald-400">Publish Now</span></>
                    )}
                  </button>
                  <Link href={`/subjects/${course.id}`}
                    className="btn-secondary !text-[11px] !py-2 !px-4 flex items-center gap-2 font-bold group">
                    <Eye className="w-3.5 h-3.5" /> Preview
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
