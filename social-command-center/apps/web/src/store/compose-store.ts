import { create } from 'zustand';
import type { PlatformId } from '@scc/shared';

interface UploadedFile {
  id?: string;       // mediaAsset ID from API (set after upload)
  name: string;
  type: 'video' | 'image';
  file: File;
  progress: number;  // 0-100
  status: 'pending' | 'uploading' | 'processing' | 'ready' | 'error';
  error?: string;
}

interface ComposeState {
  activePlatforms: PlatformId[];
  content: string;
  schedule: string;
  customScheduleDate: string;
  mediaFiles: UploadedFile[];
  platformOverrides: Partial<Record<PlatformId, string>>;
  posting: boolean;
  showSuccess: boolean;

  // Actions
  togglePlatform: (id: PlatformId) => void;
  setAllPlatforms: (ids: PlatformId[]) => void;
  clearPlatforms: () => void;
  setContent: (content: string) => void;
  setSchedule: (schedule: string) => void;
  setCustomScheduleDate: (date: string) => void;
  addMediaFiles: (files: UploadedFile[]) => void;
  removeMediaFile: (index: number) => void;
  updateMediaFile: (index: number, updates: Partial<UploadedFile>) => void;
  setPlatformOverride: (platform: PlatformId, value: string) => void;
  setPosting: (posting: boolean) => void;
  setShowSuccess: (show: boolean) => void;
  reset: () => void;
}

const initialState = {
  activePlatforms: ['facebook', 'instagram', 'linkedin'] as PlatformId[],
  content: '',
  schedule: 'Now',
  customScheduleDate: '',
  mediaFiles: [] as UploadedFile[],
  platformOverrides: {} as Partial<Record<PlatformId, string>>,
  posting: false,
  showSuccess: false,
};

export const useComposeStore = create<ComposeState>((set) => ({
  ...initialState,

  togglePlatform: (id) =>
    set((state) => ({
      activePlatforms: state.activePlatforms.includes(id)
        ? state.activePlatforms.filter((p) => p !== id)
        : [...state.activePlatforms, id],
    })),

  setAllPlatforms: (ids) => set({ activePlatforms: ids }),
  clearPlatforms: () => set({ activePlatforms: [] }),
  setContent: (content) => set({ content }),
  setSchedule: (schedule) => set({ schedule }),
  setCustomScheduleDate: (date) => set({ customScheduleDate: date }),

  addMediaFiles: (files) =>
    set((state) => ({
      mediaFiles: [...state.mediaFiles, ...files],
    })),

  removeMediaFile: (index) =>
    set((state) => ({
      mediaFiles: state.mediaFiles.filter((_, i) => i !== index),
    })),

  updateMediaFile: (index, updates) =>
    set((state) => ({
      mediaFiles: state.mediaFiles.map((f, i) =>
        i === index ? { ...f, ...updates } : f,
      ),
    })),

  setPlatformOverride: (platform, value) =>
    set((state) => ({
      platformOverrides: { ...state.platformOverrides, [platform]: value },
    })),

  setPosting: (posting) => set({ posting }),
  setShowSuccess: (show) => set({ showSuccess: show }),

  reset: () =>
    set({
      content: '',
      mediaFiles: [],
      platformOverrides: {},
      posting: false,
      showSuccess: false,
    }),
}));

export type { UploadedFile };
