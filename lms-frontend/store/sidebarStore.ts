import { create } from 'zustand';

interface VideoItem {
  id: number;
  title: string;
  orderIndex: number;
  durationSeconds: number | null;
  isFree: boolean;
  isCompleted: boolean;
  locked: boolean;
  unlockReason?: string;
}

interface SectionItem {
  id: number;
  title: string;
  orderIndex: number;
  videos: VideoItem[];
}

interface SidebarState {
  subjectId: number | null;
  subjectTitle: string;
  sections: SectionItem[];
  loading: boolean;
  error: string | null;
  setTree: (subjectId: number, title: string, sections: SectionItem[]) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  markVideoCompleted: (videoId: number) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  subjectId: null,
  subjectTitle: '',
  sections: [],
  loading: false,
  error: null,

  setTree: (subjectId, subjectTitle, sections) =>
    set({ subjectId, subjectTitle, sections, loading: false, error: null }),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),

  markVideoCompleted: (videoId) =>
    set((state) => ({
      sections: state.sections.map((sec) => ({
        ...sec,
        videos: sec.videos.map((v) =>
          v.id === videoId ? { ...v, isCompleted: true } : v
        ),
      })),
    })),
}));
