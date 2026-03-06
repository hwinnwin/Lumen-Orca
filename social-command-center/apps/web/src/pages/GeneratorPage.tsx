import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Sparkles,
  Wand2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Download,
  Send,
  Loader2,
  Image,
  Layout,
  BookOpen,
  Quote,
  ArrowLeft,
  Pencil,
  Check,
  X,
  Video,
  Play,
  Mic,
  Film,
  ChevronUp,
  ChevronDown,
  Upload,
  Trash2,
  Volume2,
} from 'lucide-react';
import Header from '../components/layout/Header';
import { useGeneratorStore } from '../store/generator-store';
import type { ContentType } from '../store/generator-store';
import {
  useGeneratorCapabilities,
  useGeneratePlan,
  useGenerateSlides,
  useRegenerateSlide,
  useGenerateQuoteCard,
  useGenerateVideoPlan,
  useGenerateVideo,
  useAnimateSlide,
  useTestVoice,
  useGenerateSpeech,
  useExportVideo,
} from '../hooks/useGenerator';
import { useCreditBalance, useInvalidateCredits } from '../hooks/useCredits';
import { useComposeStore } from '../store/compose-store';
import type { SlidePlan, VideoPlatform } from '../services/api';
import { api } from '../services/api';

const CONTENT_TYPES: { id: ContentType; label: string; desc: string; icon: typeof Layout }[] = [
  { id: 'carousel', label: 'Carousel', desc: 'Text overlay slides with styled backgrounds', icon: Layout },
  { id: 'quote-card', label: 'Quote Cards', desc: 'Beautiful quote images with author attribution', icon: Quote },
  { id: 'mixed-media', label: 'Mixed Media', desc: 'Photos + text slides for visual variety', icon: Image },
  { id: 'educational', label: 'Educational', desc: 'Numbered tips, steps, or facts', icon: BookOpen },
  { id: 'video-clip', label: 'Video Clip', desc: 'AI-generated short video for Reels, TikTok, Shorts', icon: Video },
  { id: 'script-to-speech', label: 'Script to Speech', desc: 'Convert text into AI-narrated audio with natural voices', icon: Mic },
  { id: 'video-editor', label: 'Video Editor', desc: 'Combine your clips + audio into a finished video', icon: Film },
];

const TONES = [
  'professional',
  'casual',
  'inspirational',
  'humorous',
  'storytelling',
  'emperor-mode',
];

const VIDEO_PLATFORMS: { id: VideoPlatform; label: string }[] = [
  { id: 'reels', label: 'Instagram Reels' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'shorts', label: 'YouTube Shorts' },
];

const MUSIC_PRESETS = [
  { id: 'upbeat-electronic', label: 'Upbeat Electronic', prompt: 'Upbeat electronic dance music, energetic synths, driving beat, modern EDM' },
  { id: 'calm-ambient', label: 'Calm Ambient', prompt: 'Calm ambient piano, soft pads, peaceful atmosphere, gentle and soothing' },
  { id: 'cinematic-epic', label: 'Cinematic Epic', prompt: 'Cinematic orchestral music, epic strings, dramatic drums, inspiring and powerful' },
  { id: 'lo-fi-chill', label: 'Lo-Fi Chill', prompt: 'Lo-fi hip hop beats, chill jazzy piano, vinyl crackle, relaxing study music' },
  { id: 'corporate-uplifting', label: 'Corporate Uplifting', prompt: 'Corporate motivational music, uplifting acoustic guitar, light percussion, positive energy' },
  { id: 'funky-groove', label: 'Funky Groove', prompt: 'Funky groove with slap bass, wah guitar, tight drums, retro disco vibe' },
  { id: 'dramatic-tension', label: 'Dramatic Tension', prompt: 'Dark dramatic tension music, suspenseful strings, deep bass pulses, intense atmosphere' },
  { id: 'tropical-vibes', label: 'Tropical Vibes', prompt: 'Tropical house music, steel drums, marimba, sunny beach vibes, upbeat and happy' },
  { id: 'custom', label: 'Custom Style...', prompt: '' },
];

const VOICE_PRESETS = [
  { id: 'Deep_Voice_Man', label: 'Deep Male', gender: 'male' },
  { id: 'Casual_Guy', label: 'Casual Male', gender: 'male' },
  { id: 'Patient_Man', label: 'Patient Male', gender: 'male' },
  { id: 'Determined_Man', label: 'Determined Male', gender: 'male' },
  { id: 'Elegant_Man', label: 'Elegant Male', gender: 'male' },
  { id: 'Wise_Woman', label: 'Wise Female', gender: 'female' },
  { id: 'Calm_Woman', label: 'Calm Female', gender: 'female' },
  { id: 'Inspirational_girl', label: 'Inspirational Female', gender: 'female' },
  { id: 'Lively_Girl', label: 'Lively Female', gender: 'female' },
  { id: 'Friendly_Person', label: 'Friendly (Neutral)', gender: 'neutral' },
];

export default function GeneratorPage() {
  const navigate = useNavigate();
  const store = useGeneratorStore();
  const { data: capabilities } = useGeneratorCapabilities();
  const planMutation = useGeneratePlan();
  const slidesMutation = useGenerateSlides();
  const regenerateMutation = useRegenerateSlide();
  const quoteCardMutation = useGenerateQuoteCard();
  const videoPlanMutation = useGenerateVideoPlan();
  const videoGenMutation = useGenerateVideo();
  const animateSlideMutation = useAnimateSlide();
  const testVoiceMutation = useTestVoice();
  const speechMutation = useGenerateSpeech();
  const exportVideoMutation = useExportVideo();
  const composeStore = useComposeStore();
  const { data: creditData } = useCreditBalance();
  const invalidateCredits = useInvalidateCredits();

  // Quote card specific state
  const [quoteText, setQuoteText] = useState('');
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const [quoteResult, setQuoteResult] = useState<{ imageUrl: string; imageDataUrl: string } | null>(null);

  // Editing slide plan
  const [editingSlide, setEditingSlide] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editPrompt, setEditPrompt] = useState('');

  // Video prompt editing (in review step)
  const [editingVideoPrompt, setEditingVideoPrompt] = useState(false);
  const [videoPromptDraft, setVideoPromptDraft] = useState('');
  const [editingVoiceoverScript, setEditingVoiceoverScript] = useState(false);
  const [voiceoverScriptDraft, setVoiceoverScriptDraft] = useState('');

  // Elapsed time counter for video generation
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, []);

  // Stop elapsed timer when video result arrives via Socket.io or generation fails
  useEffect(() => {
    if (!store.isGeneratingVideo && elapsedRef.current) {
      stopElapsedTimer();
    }
  }, [store.isGeneratingVideo]);

  const startElapsedTimer = () => {
    setElapsed(0);
    elapsedRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };

  const stopElapsedTimer = () => {
    if (elapsedRef.current) {
      clearInterval(elapsedRef.current);
      elapsedRef.current = null;
    }
  };

  // ─── Carousel Handlers ───────────────────────────────

  const handleGeneratePlan = async () => {
    if (!store.topic.trim()) {
      toast.error('Enter a topic first');
      return;
    }
    store.setIsPlanning(true);
    try {
      const plan = await planMutation.mutateAsync({
        topic: store.topic,
        contentType: store.contentType,
        slideCount: store.slideCount,
        tone: store.tone,
      });
      store.setPlan(plan);
      toast.success(`Planned ${plan.slides.length} slides`);
    } catch {
      toast.error('Failed to generate plan');
    } finally {
      store.setIsPlanning(false);
    }
  };

  const handleGenerateSlides = async () => {
    if (!store.plan) return;
    store.setIsGenerating(true);
    try {
      const result = await slidesMutation.mutateAsync({ plan: store.plan });
      store.setSlides(result.slides, result.caption, result.hashtags);
      invalidateCredits();
      toast.success('Carousel generated!');
    } catch (err: unknown) {
      const axErr = err as { response?: { status?: number; data?: { error?: string } } };
      if (axErr?.response?.status === 402) {
        toast.error(axErr.response.data?.error || 'Insufficient credits');
      } else {
        toast.error('Failed to generate images');
      }
    } finally {
      store.setIsGenerating(false);
    }
  };

  const handleRegenerateSlide = async (slideNum: number) => {
    const slidePlan = store.plan?.slides.find((s) => s.slideNumber === slideNum);
    if (!slidePlan) return;
    store.setRegeneratingSlide(slideNum);
    try {
      const result = await regenerateMutation.mutateAsync({ slide: slidePlan });
      store.replaceSlide(slideNum, result);
      invalidateCredits();
      toast.success(`Slide ${slideNum} regenerated`);
    } catch (err: unknown) {
      const axErr = err as { response?: { status?: number; data?: { error?: string } } };
      if (axErr?.response?.status === 402) {
        toast.error(axErr.response.data?.error || 'Insufficient credits');
      } else {
        toast.error('Failed to regenerate slide');
      }
    } finally {
      store.setRegeneratingSlide(null);
    }
  };

  const handleGenerateQuoteCard = async () => {
    if (!quoteText.trim()) {
      toast.error('Enter a quote');
      return;
    }
    store.setIsGenerating(true);
    try {
      const result = await quoteCardMutation.mutateAsync({
        quote: quoteText,
        author: quoteAuthor || 'Unknown',
      });
      setQuoteResult(result);
      invalidateCredits();
      toast.success('Quote card generated!');
    } catch (err: unknown) {
      const axErr = err as { response?: { status?: number; data?: { error?: string } } };
      if (axErr?.response?.status === 402) {
        toast.error(axErr.response.data?.error || 'Insufficient credits');
      } else {
        toast.error('Failed to generate quote card');
      }
    } finally {
      store.setIsGenerating(false);
    }
  };

  // ─── Video Handlers ──────────────────────────────────

  const handleGenerateVideoPlan = async () => {
    if (!store.topic.trim()) {
      toast.error('Enter a topic first');
      return;
    }
    const isCustomScript = store.videoAudioVoiceover && store.videoCustomScriptMode && store.videoCustomScript.trim();
    if (store.videoAudioVoiceover && store.videoCustomScriptMode && !store.videoCustomScript.trim()) {
      toast.error('Enter a voiceover script or switch to auto-generate');
      return;
    }
    store.setIsPlanning(true);
    try {
      const plan = await videoPlanMutation.mutateAsync({
        topic: store.topic,
        platform: store.videoPlatform,
        tone: store.tone,
        totalDuration: store.videoTotalDuration,
        audioOptions: {
          music: store.videoAudioMusic,
          musicStyle: store.videoMusicStyle || undefined,
          voiceover: store.videoAudioVoiceover && !isCustomScript,
        },
      });
      // If custom script, inject it into the plan (Claude didn't generate one)
      if (isCustomScript) {
        plan.voiceoverScript = store.videoCustomScript.trim();
      }
      store.setVideoPlan(plan);
      setVideoPromptDraft(plan.prompt);
      toast.success('Video concept planned!');
    } catch {
      toast.error('Failed to generate video plan');
    } finally {
      store.setIsPlanning(false);
    }
  };

  const handleGenerateVideo = async () => {
    const plan = store.videoPlan;
    if (!plan) return;

    store.setIsGeneratingVideo(true);
    startElapsedTimer();
    try {
      const { jobId } = await videoGenMutation.mutateAsync({
        prompt: plan.prompt,
        sourceImageUrl: store.videoSourceMode === 'image' && store.videoSourceImageUrl ? store.videoSourceImageUrl : undefined,
        duration: store.videoDuration,
        aspectRatio: plan.aspectRatio as '9:16' | '1:1' | '16:9',
        segments: plan.segments,
        totalDuration: plan.totalDuration,
        voiceoverScript: plan.voiceoverScript,
        voiceoverVoice: plan.voiceoverScript ? store.videoVoiceId : undefined,
        musicStyle: plan.musicStyle,
        enableCaptions: plan.voiceoverScript && store.videoEnableCaptions ? true : undefined,
      });
      store.setVideoJobId(jobId);
      invalidateCredits();
      const segmentInfo = plan.segments && plan.segments.length > 1 ? ` (${plan.segments.length} segments)` : '';
      const audioInfo = [plan.musicStyle && 'music', plan.voiceoverScript && 'voiceover'].filter(Boolean).join(' + ');
      toast.info(`Video generation started${segmentInfo}${audioInfo ? ` with ${audioInfo}` : ''}`);
      // Result will arrive via Socket.io (video:generated event)
    } catch (err: unknown) {
      const axErr = err as { response?: { status?: number; data?: { error?: string } } };
      if (axErr?.response?.status === 402) {
        toast.error(axErr.response.data?.error || 'Insufficient credits');
      } else {
        toast.error('Failed to start video generation');
      }
      store.setIsGeneratingVideo(false);
      stopElapsedTimer();
    }
  };

  const handleAnimateSlide = async (slideImageUrl: string) => {
    store.setIsGeneratingVideo(true);
    startElapsedTimer();
    try {
      const { jobId } = await animateSlideMutation.mutateAsync({
        slideImageUrl,
        motionPrompt: 'Subtle cinematic motion, gentle zoom with soft parallax depth effect',
        duration: 6,
      });
      store.setVideoJobId(jobId);
      invalidateCredits();
      toast.info('Slide animation started — this takes 30–90 seconds');
      // Result will arrive via Socket.io (video:generated event)
    } catch (err: unknown) {
      const axErr = err as { response?: { status?: number; data?: { error?: string } } };
      if (axErr?.response?.status === 402) {
        toast.error(axErr.response.data?.error || 'Insufficient credits');
      } else {
        toast.error('Failed to start slide animation');
      }
      store.setIsGeneratingVideo(false);
      stopElapsedTimer();
    }
  };

  // ─── Speech Handler ─────────────────────────────────

  const handleGenerateSpeech = async () => {
    if (!store.speechScript.trim()) {
      toast.error('Enter a script first');
      return;
    }
    if (store.speechScript.length > 5000) {
      toast.error('Script must be 5,000 characters or less');
      return;
    }
    store.setIsGeneratingSpeech(true);
    try {
      const result = await speechMutation.mutateAsync({
        script: store.speechScript,
        voiceId: store.speechVoiceId,
      });
      store.setGeneratedSpeech(result);
      invalidateCredits();
      toast.success('Speech generated!');
    } catch (err: unknown) {
      const axErr = err as { response?: { status?: number; data?: { error?: string } } };
      if (axErr?.response?.status === 402) {
        toast.error(axErr.response.data?.error || 'Insufficient credits');
      } else {
        toast.error('Failed to generate speech');
      }
    } finally {
      store.setIsGeneratingSpeech(false);
    }
  };

  // ─── Video Editor Handlers ─────────────────────────────

  const handleEditorFileSelect = async (files: FileList | null) => {
    if (!files) return;
    const maxClips = 10;
    const currentCount = store.editorClips.length;
    const remaining = maxClips - currentCount;
    if (remaining <= 0) {
      toast.error('Maximum 10 clips');
      return;
    }

    const filesToAdd = Array.from(files).slice(0, remaining);
    for (const file of filesToAdd) {
      const clipId = crypto.randomUUID();
      // Add clip in uploading state
      store.addEditorClip({
        id: clipId,
        fileName: file.name,
        duration: 0,
        storageKey: null,
        startTime: 0,
        endTime: 0,
        status: 'uploading',
      });

      // Get duration from video element
      const video = document.createElement('video');
      video.preload = 'metadata';
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;
      video.onloadedmetadata = () => {
        const dur = Math.round(video.duration);
        store.updateEditorClip(clipId, { duration: dur, endTime: dur });
        URL.revokeObjectURL(objectUrl);
      };

      // Upload via media upload flow
      try {
        const contentType = file.type || 'video/mp4';
        const urlRes = await api.post<{ data: { mediaId: string; uploadUrl: string; key: string; local?: boolean } }>('/media/upload-url', {
          filename: file.name,
          contentType,
          fileSize: file.size,
        });
        const { mediaId, uploadUrl, key, local } = urlRes.data.data;

        if (local) {
          await api.put(uploadUrl, file, { headers: { 'Content-Type': contentType } });
        } else {
          await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': contentType } });
        }
        await api.post(`/media/${mediaId}/confirm`);
        store.updateEditorClip(clipId, { storageKey: key, status: 'ready' });
      } catch {
        store.updateEditorClip(clipId, { status: 'error' });
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  };

  const handleEditorAudioUpload = async (file: File) => {
    try {
      const contentType = file.type || 'audio/mpeg';
      const urlRes = await api.post<{ data: { mediaId: string; uploadUrl: string; key: string; local?: boolean } }>('/media/upload-url', {
        filename: file.name,
        contentType,
        fileSize: file.size,
      });
      const { mediaId, uploadUrl, key, local } = urlRes.data.data;

      if (local) {
        await api.put(uploadUrl, file, { headers: { 'Content-Type': contentType } });
      } else {
        await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': contentType } });
      }
      await api.post(`/media/${mediaId}/confirm`);
      store.setEditorAudioStorageKey(key);
      store.setEditorAudioFileName(file.name);
      toast.success('Audio uploaded');
    } catch {
      toast.error('Failed to upload audio');
    }
  };

  const handleExportVideo = async () => {
    const readyClips = store.editorClips.filter((c) => c.status === 'ready' && c.storageKey);
    if (readyClips.length === 0) {
      toast.error('Add at least one clip');
      return;
    }

    const totalDuration = readyClips.reduce((sum, c) => sum + (c.endTime - c.startTime), 0);
    if (totalDuration > 300) {
      toast.error('Total duration cannot exceed 5 minutes');
      return;
    }

    store.setIsExporting(true);
    startElapsedTimer();
    try {
      const { jobId } = await exportVideoMutation.mutateAsync({
        clips: readyClips.map((c) => ({
          storageKey: c.storageKey!,
          startTime: c.startTime > 0 ? c.startTime : undefined,
          endTime: c.endTime < c.duration ? c.endTime : undefined,
        })),
        audioStorageKey: store.editorAudioSource === 'speech'
          ? (store.editorAudioStorageKey || store.generatedSpeech?.storageKey || undefined)
          : store.editorAudioSource === 'upload'
          ? (store.editorAudioStorageKey ?? undefined)
          : undefined,
        audioVolume: store.editorAudioVolume,
      });
      store.setEditorExportJobId(jobId);
      invalidateCredits();
      toast.info('Video export started — this may take a minute');
    } catch (err: unknown) {
      const axErr = err as { response?: { status?: number; data?: { error?: string } } };
      if (axErr?.response?.status === 402) {
        toast.error(axErr.response.data?.error || 'Insufficient credits');
      } else {
        toast.error('Failed to start video export');
      }
      store.setIsExporting(false);
      stopElapsedTimer();
    }
  };

  // Stop elapsed timer when export result arrives
  useEffect(() => {
    if (!store.isExporting && store.editorExportedVideo && elapsedRef.current) {
      stopElapsedTimer();
    }
  }, [store.isExporting, store.editorExportedVideo]);

  // ─── Shared Handlers ─────────────────────────────────

  const handleLoadIntoComposer = async () => {
    // Video editor export
    if (store.editorExportedVideo) {
      composeStore.setContent('');
      try {
        const res = await fetch(store.editorExportedVideo.videoUrl);
        const blob = await res.blob();
        const file = new File([blob], 'edited-video.mp4', { type: 'video/mp4' });
        composeStore.addMediaFiles([{ name: file.name, type: 'video', file, progress: 100, status: 'ready' }]);
      } catch {
        toast.error('Failed to load video into composer');
        return;
      }
      navigate('/');
      toast.success('Video loaded into composer');
      return;
    }

    // Video content
    if (store.generatedVideo) {
      const videoPlan = store.videoPlan;
      const caption = videoPlan?.caption || store.caption || '';
      const hashtags = videoPlan?.hashtags || store.hashtags;
      composeStore.setContent(caption + (hashtags.length ? '\n\n' + hashtags.map((h) => `#${h}`).join(' ') : ''));

      const platformMap: Record<VideoPlatform, string> = {
        reels: 'instagram',
        tiktok: 'tiktok',
        shorts: 'youtube',
      };
      composeStore.setAllPlatforms([platformMap[store.videoPlatform]] as any[]);

      try {
        const res = await fetch(store.generatedVideo.videoUrl);
        const blob = await res.blob();
        const file = new File([blob], 'generated-video.mp4', { type: 'video/mp4' });
        composeStore.addMediaFiles([{
          name: file.name,
          type: 'video',
          file,
          progress: 100,
          status: 'ready',
        }]);
      } catch {
        toast.error('Failed to load video into composer');
        return;
      }

      navigate('/');
      toast.success('Video loaded into composer');
      return;
    }

    // Image carousel / quote card content
    const caption = store.caption || quoteText;
    composeStore.setContent(caption + (store.hashtags.length ? '\n\n' + store.hashtags.map((h) => `#${h}`).join(' ') : ''));
    composeStore.setAllPlatforms(['instagram'] as any[]);

    const slides = store.slides;
    const quoteImg = quoteResult;

    if (slides?.length) {
      const mediaFiles = await Promise.all(
        slides.map(async (slide) => {
          const res = await fetch(slide.imageDataUrl);
          const blob = await res.blob();
          const file = new File([blob], `slide-${slide.slideNumber}.png`, { type: 'image/png' });
          return {
            name: file.name,
            type: 'image' as const,
            file,
            progress: 100,
            status: 'ready' as const,
          };
        }),
      );
      composeStore.addMediaFiles(mediaFiles);
    } else if (quoteImg) {
      const res = await fetch(quoteImg.imageDataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'quote-card.png', { type: 'image/png' });
      composeStore.addMediaFiles([{
        name: file.name,
        type: 'image',
        file,
        progress: 100,
        status: 'ready',
      }]);
    }

    navigate('/');
    toast.success('Loaded into composer with images');
  };

  const startEditSlide = (slide: SlidePlan) => {
    setEditingSlide(slide.slideNumber);
    setEditTitle(slide.title);
    setEditBody(slide.body);
    setEditPrompt(slide.imagePrompt);
  };

  const saveEditSlide = () => {
    if (editingSlide !== null) {
      store.updateSlidePlan(editingSlide, {
        title: editTitle,
        body: editBody,
        imagePrompt: editPrompt,
      });
      setEditingSlide(null);
    }
  };

  const handleDownloadAll = () => {
    if (!store.slides) return;
    store.slides.forEach((slide) => {
      const a = document.createElement('a');
      a.href = slide.imageDataUrl;
      a.download = `slide-${slide.slideNumber}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  };

  const isVideoMode = store.contentType === 'video-clip';
  const isSpeechMode = store.contentType === 'script-to-speech';
  const isEditorMode = store.contentType === 'video-editor';
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: "'Sora', sans-serif",
      }}
    >
      <Header />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px' }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          {store.step !== 'configure' && (
            <button
              onClick={() => {
                if (store.step === 'preview' && (isSpeechMode || isEditorMode)) store.setStep('configure');
                else if (store.step === 'preview') store.setStep('review');
                else if (store.step === 'review') store.setStep('configure');
              }}
              style={{
                padding: '8px',
                borderRadius: '10px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              background: 'var(--gradient-text)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Content Generator
          </h1>
          {creditData && (
            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: creditData.balance > 0 ? 'rgba(139,92,246,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${creditData.balance > 0 ? 'rgba(139,92,246,0.25)' : 'rgba(239,68,68,0.25)'}`,
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                color: creditData.balance > 0 ? 'var(--accent-purple)' : '#ef4444',
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              <Sparkles size={14} />
              {creditData.balance} credits
            </div>
          )}
        </div>

        {/* Capabilities banner */}
        {capabilities && !capabilities.aiImages && (
          <div
            style={{
              padding: '10px 16px',
              background: 'rgba(255,170,0,0.1)',
              border: '1px solid rgba(255,170,0,0.2)',
              borderRadius: '10px',
              fontSize: '12px',
              color: '#ffaa00',
              marginBottom: '20px',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            {capabilities.message}
          </div>
        )}

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', alignItems: 'center' }}>
          {((isSpeechMode || isEditorMode) ? ['configure', 'preview'] as const : ['configure', 'review', 'preview'] as const).map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {i > 0 && (
                <div style={{ width: '24px', height: '1px', background: 'var(--border-color)' }} />
              )}
              <div
                style={{
                  padding: '4px 12px',
                  borderRadius: '8px',
                  background: store.step === s ? 'var(--bg-active)' : 'transparent',
                  border: `1px solid ${store.step === s ? 'var(--border-color)' : 'transparent'}`,
                  color: store.step === s ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                }}
              >
                {i + 1}. {s}
              </div>
            </div>
          ))}
        </div>

        {/* ═══════════ STEP 1: CONFIGURE ═══════════ */}
        {store.step === 'configure' && (
          <div style={{ display: 'grid', gap: '24px' }}>
            {/* Content Type Selector */}
            <div>
              <label style={labelStyle}>Content Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                {CONTENT_TYPES.map(({ id, label, desc, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => store.setContentType(id)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: store.contentType === id ? 'var(--bg-active)' : 'var(--bg-tertiary)',
                      border: `1px solid ${store.contentType === id ? '#8b5cf6' : 'var(--border-color)'}`,
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Icon size={16} style={{ color: store.contentType === id ? '#8b5cf6' : 'var(--text-muted)' }} />
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>{label}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Video Clip config ─── */}
            {isVideoMode ? (
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Topic / Prompt</label>
                  <textarea
                    value={store.topic}
                    onChange={(e) => store.setTopic(e.target.value)}
                    placeholder="What's your video about? e.g. 'Cinematic sunrise over a mountain lake, drone shot'"
                    rows={3}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Platform</label>
                    <select
                      value={store.videoPlatform}
                      onChange={(e) => store.setVideoPlatform(e.target.value as VideoPlatform)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      {VIDEO_PLATFORMS.map(({ id, label }) => (
                        <option key={id} value={id}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Tone</label>
                    <select
                      value={store.tone}
                      onChange={(e) => store.setTone(e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      {TONES.map((t) => (
                        <option key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Duration</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[6, 10, 15, 30, 60, 90].map((d) => (
                      <button
                        key={d}
                        onClick={() => store.setVideoTotalDuration(d)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '10px',
                          background: store.videoTotalDuration === d ? 'var(--bg-active)' : 'var(--bg-tertiary)',
                          border: `1px solid ${store.videoTotalDuration === d ? '#8b5cf6' : 'var(--border-color)'}`,
                          color: store.videoTotalDuration === d ? '#8b5cf6' : 'var(--text-secondary)',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {d}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audio Options */}
                <div>
                  <label style={labelStyle}>Audio</label>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={store.videoAudioMusic}
                        onChange={(e) => store.setVideoAudioMusic(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }}
                      />
                      <span style={{ fontWeight: 600 }}>Background Music</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AI-generated via MusicGen</span>
                    </label>
                    {store.videoAudioMusic && (
                      <div style={{ marginLeft: '26px', display: 'grid', gap: '8px' }}>
                        <select
                          value={MUSIC_PRESETS.find((p) => p.prompt === store.videoMusicStyle)?.id || 'custom'}
                          onChange={(e) => {
                            const preset = MUSIC_PRESETS.find((p) => p.id === e.target.value);
                            if (preset && preset.id !== 'custom') {
                              store.setVideoMusicStyle(preset.prompt);
                            } else {
                              store.setVideoMusicStyle('');
                            }
                          }}
                          style={inputStyle}
                        >
                          {MUSIC_PRESETS.map((p) => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                          ))}
                        </select>
                        {!MUSIC_PRESETS.some((p) => p.id !== 'custom' && p.prompt === store.videoMusicStyle) && (
                          <input
                            type="text"
                            value={store.videoMusicStyle}
                            onChange={(e) => store.setVideoMusicStyle(e.target.value)}
                            placeholder="Describe the music style you want..."
                            style={inputStyle}
                          />
                        )}
                      </div>
                    )}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={store.videoAudioVoiceover}
                        onChange={(e) => store.setVideoAudioVoiceover(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }}
                      />
                      <span style={{ fontWeight: 600 }}>AI Voiceover</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Script generated by Claude, narrated by AI</span>
                    </label>
                    {store.videoAudioVoiceover && (
                      <>
                        <div style={{ marginLeft: '26px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select
                            value={store.videoVoiceId}
                            onChange={(e) => store.setVideoVoiceId(e.target.value)}
                            style={{ ...inputStyle, flex: 1 }}
                          >
                            <optgroup label="Male Voices">
                              {VOICE_PRESETS.filter((v) => v.gender === 'male').map((v) => (
                                <option key={v.id} value={v.id}>{v.label}</option>
                              ))}
                            </optgroup>
                            <optgroup label="Female Voices">
                              {VOICE_PRESETS.filter((v) => v.gender === 'female').map((v) => (
                                <option key={v.id} value={v.id}>{v.label}</option>
                              ))}
                            </optgroup>
                            <optgroup label="Neutral">
                              {VOICE_PRESETS.filter((v) => v.gender === 'neutral').map((v) => (
                                <option key={v.id} value={v.id}>{v.label}</option>
                              ))}
                            </optgroup>
                          </select>
                          <button
                            onClick={async () => {
                              try {
                                const { audioDataUrl } = await testVoiceMutation.mutateAsync(store.videoVoiceId);
                                new Audio(audioDataUrl).play();
                              } catch {
                                toast.error('Failed to generate voice sample');
                              }
                            }}
                            disabled={testVoiceMutation.isPending}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '8px 12px',
                              background: 'rgba(139,92,246,0.15)',
                              border: '1px solid rgba(139,92,246,0.3)',
                              borderRadius: '8px',
                              color: '#8b5cf6',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: testVoiceMutation.isPending ? 'wait' : 'pointer',
                              whiteSpace: 'nowrap',
                              opacity: testVoiceMutation.isPending ? 0.6 : 1,
                            }}
                          >
                            {testVoiceMutation.isPending ? (
                              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <Play size={14} />
                            )}
                            {testVoiceMutation.isPending ? 'Testing...' : 'Test'}
                          </button>
                        </div>
                        <div style={{ marginLeft: '26px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <input
                              type="radio"
                              name="scriptMode"
                              checked={!store.videoCustomScriptMode}
                              onChange={() => store.setVideoCustomScriptMode(false)}
                              style={{ accentColor: '#8b5cf6' }}
                            />
                            <span style={{ fontWeight: 600 }}>Auto-generate script</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <input
                              type="radio"
                              name="scriptMode"
                              checked={store.videoCustomScriptMode}
                              onChange={() => store.setVideoCustomScriptMode(true)}
                              style={{ accentColor: '#8b5cf6' }}
                            />
                            <span style={{ fontWeight: 600 }}>Custom script</span>
                          </label>
                        </div>
                        {store.videoCustomScriptMode && (
                          <div style={{ marginLeft: '26px' }}>
                            <textarea
                              value={store.videoCustomScript}
                              onChange={(e) => store.setVideoCustomScript(e.target.value)}
                              placeholder="Type or paste your voiceover script here..."
                              rows={4}
                              maxLength={5000}
                              style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px' }}
                            />
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: "'IBM Plex Mono', monospace" }}>
                              {store.videoCustomScript.length} / 5000 chars
                              {store.videoCustomScript.trim() ? ` • ~${Math.ceil(store.videoCustomScript.split(/\s+/).filter(Boolean).length / 2.5)}s at natural pace` : ''}
                            </div>
                          </div>
                        )}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '26px' }}>
                          <input
                            type="checkbox"
                            checked={store.videoEnableCaptions}
                            onChange={(e) => store.setVideoEnableCaptions(e.target.checked)}
                            style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }}
                          />
                          <span style={{ fontWeight: 600 }}>Burned-in Captions</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Voiceover text displayed as subtitles</span>
                        </label>
                      </>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    padding: '10px 16px',
                    background: 'rgba(139,92,246,0.08)',
                    border: '1px solid rgba(139,92,246,0.2)',
                    borderRadius: '10px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    fontFamily: "'IBM Plex Mono', monospace",
                    lineHeight: 1.6,
                  }}
                >
                  {(() => {
                    const segments = Math.ceil(store.videoTotalDuration / 10);
                    const videoCost = segments * 100; // 100 credits per segment
                    const musicCost = store.videoAudioMusic ? 20 : 0;
                    const voiceCost = store.videoAudioVoiceover ? 20 : 0;
                    const total = videoCost + musicCost + voiceCost;
                    const genTime = segments <= 1 ? '30-90s' : `~${segments * 1.5} min`;
                    return `Cost: ${total} credits (${segments} clip${segments > 1 ? 's' : ''} @ 100${store.videoAudioMusic ? ' + music 20' : ''}${store.videoAudioVoiceover ? ' + voiceover 20' : ''}). Generation: ${genTime}.`;
                  })()}
                  {' '}Output is vertical (9:16) for {VIDEO_PLATFORMS.find((p) => p.id === store.videoPlatform)?.label}.
                </div>

                <button
                  onClick={handleGenerateVideoPlan}
                  disabled={store.isPlanning || !store.topic.trim()}
                  style={{
                    ...primaryButtonStyle,
                    opacity: store.isPlanning || !store.topic.trim() ? 0.5 : 1,
                  }}
                >
                  {store.isPlanning ? (
                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Planning video...</>
                  ) : (
                    <><Wand2 size={16} /> Generate Video Plan</>
                  )}
                </button>
              </div>
            ) : isSpeechMode ? (
              /* Script to Speech mode */
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Script</label>
                  <textarea
                    value={store.speechScript}
                    onChange={(e) => store.setSpeechScript(e.target.value)}
                    placeholder="Write or paste your script here... The AI will narrate this text with a natural-sounding voice."
                    rows={6}
                    style={inputStyle}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                      ~{Math.ceil(store.speechScript.trim().split(/\s+/).filter(Boolean).length / 150 * 60)}s estimated
                    </div>
                    <div style={{ fontSize: '11px', color: store.speechScript.length > 5000 ? '#ef4444' : 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                      {store.speechScript.length}/5,000
                    </div>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Voice</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '6px' }}>
                    {VOICE_PRESETS.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => store.setSpeechVoiceId(v.id)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: store.speechVoiceId === v.id ? 'var(--bg-active)' : 'var(--bg-tertiary)',
                          border: `1px solid ${store.speechVoiceId === v.id ? '#8b5cf6' : 'var(--border-color)'}`,
                          color: store.speechVoiceId === v.id ? '#8b5cf6' : 'var(--text-secondary)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => testVoiceMutation.mutate(store.speechVoiceId, {
                      onSuccess: (data) => {
                        const audio = new Audio(data.audioDataUrl);
                        audio.play();
                      },
                      onError: () => toast.error('Voice test failed'),
                    })}
                    disabled={testVoiceMutation.isPending}
                    style={{ ...secondaryButtonStyle, marginTop: '8px' }}
                  >
                    {testVoiceMutation.isPending ? (
                      <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Testing...</>
                    ) : (
                      <><Play size={14} /> Test Voice</>
                    )}
                  </button>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", padding: '8px 12px', background: 'rgba(139,92,246,0.05)', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.15)' }}>
                  Cost: 20 credits per generation
                </div>

                <button
                  onClick={handleGenerateSpeech}
                  disabled={store.isGeneratingSpeech || !store.speechScript.trim() || store.speechScript.length > 5000}
                  style={{
                    ...primaryButtonStyle,
                    opacity: store.isGeneratingSpeech || !store.speechScript.trim() || store.speechScript.length > 5000 ? 0.5 : 1,
                  }}
                >
                  {store.isGeneratingSpeech ? (
                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating speech...</>
                  ) : (
                    <><Mic size={16} /> Generate Speech</>
                  )}
                </button>
              </div>
            ) : isEditorMode ? (
              /* Video Editor mode */
              <div style={{ display: 'grid', gap: '16px' }}>
                {/* Clip Upload */}
                <div>
                  <label style={labelStyle}>Video Clips</label>
                  <div
                    style={{
                      padding: '24px',
                      borderRadius: '12px',
                      background: 'var(--bg-tertiary)',
                      border: '2px dashed var(--border-color)',
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => document.getElementById('editor-clip-input')?.click()}
                  >
                    <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Click to upload video clips
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      MP4, MOV, WebM — max 10 clips, 5 min total
                    </div>
                    <input
                      id="editor-clip-input"
                      type="file"
                      accept="video/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => handleEditorFileSelect(e.target.files)}
                    />
                  </div>
                </div>

                {/* Clip List */}
                {store.editorClips.length > 0 && (
                  <div>
                    <label style={labelStyle}>Clip Order</label>
                    <div style={{ display: 'grid', gap: '6px' }}>
                      {store.editorClips.map((clip, idx) => (
                        <div
                          key={clip.id}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'var(--bg-tertiary)',
                            border: `1px solid ${clip.status === 'error' ? '#ef4444' : 'var(--border-color)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                          }}
                        >
                          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", minWidth: '20px' }}>
                            {idx + 1}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {clip.fileName}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                              {clip.status === 'uploading' ? (
                                <span><Loader2 size={10} style={{ animation: 'spin 1s linear infinite', display: 'inline' }} /> uploading...</span>
                              ) : clip.status === 'error' ? (
                                <span style={{ color: '#ef4444' }}>upload failed</span>
                              ) : (
                                <>
                                  <span>{clip.duration}s</span>
                                  {clip.duration > 0 && (
                                    <>
                                      <span>trim:</span>
                                      <input
                                        type="number"
                                        min={0}
                                        max={clip.endTime}
                                        value={clip.startTime}
                                        onChange={(e) => store.updateEditorClip(clip.id, { startTime: Math.max(0, Number(e.target.value)) })}
                                        style={{ width: '48px', padding: '2px 4px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '11px', textAlign: 'center' }}
                                      />
                                      <span>-</span>
                                      <input
                                        type="number"
                                        min={clip.startTime}
                                        max={clip.duration}
                                        value={clip.endTime}
                                        onChange={(e) => store.updateEditorClip(clip.id, { endTime: Math.min(clip.duration, Number(e.target.value)) })}
                                        style={{ width: '48px', padding: '2px 4px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '11px', textAlign: 'center' }}
                                      />
                                      <span>s</span>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            <button
                              onClick={() => idx > 0 && store.reorderEditorClips(idx, idx - 1)}
                              disabled={idx === 0}
                              style={{ ...iconBtnStyle, opacity: idx === 0 ? 0.3 : 1 }}
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              onClick={() => idx < store.editorClips.length - 1 && store.reorderEditorClips(idx, idx + 1)}
                              disabled={idx === store.editorClips.length - 1}
                              style={{ ...iconBtnStyle, opacity: idx === store.editorClips.length - 1 ? 0.3 : 1 }}
                            >
                              <ChevronDown size={14} />
                            </button>
                            <button
                              onClick={() => store.removeEditorClip(clip.id)}
                              style={{ ...iconBtnStyle, color: '#ef4444' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                      Total: ~{store.editorClips.filter((c) => c.status === 'ready').reduce((sum, c) => sum + (c.endTime - c.startTime), 0)}s
                      {' / '}
                      {store.editorClips.length} clip{store.editorClips.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}

                {/* Audio Section */}
                <div>
                  <label style={labelStyle}>Audio Track</label>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {(['none', 'speech', 'upload'] as const).map((opt) => (
                      <label
                        key={opt}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: store.editorAudioSource === opt ? 'var(--bg-active)' : 'var(--bg-tertiary)',
                          border: `1px solid ${store.editorAudioSource === opt ? '#8b5cf6' : 'var(--border-color)'}`,
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <input
                          type="radio"
                          name="editor-audio"
                          checked={store.editorAudioSource === opt}
                          onChange={() => store.setEditorAudioSource(opt)}
                          style={{ accentColor: '#8b5cf6' }}
                        />
                        {opt === 'none' ? 'No Audio' : opt === 'speech' ? 'Use Generated Speech' : 'Upload Audio File'}
                      </label>
                    ))}
                  </div>

                  {store.editorAudioSource === 'speech' && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)', fontSize: '12px' }}>
                      {store.generatedSpeech ? (
                        <span style={{ color: '#8b5cf6' }}>Using generated speech ({store.generatedSpeech.duration}s)</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Generate speech first using Script to Speech mode</span>
                      )}
                    </div>
                  )}

                  {store.editorAudioSource === 'upload' && (
                    <div style={{ marginTop: '8px' }}>
                      {store.editorAudioFileName ? (
                        <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)', fontSize: '12px', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Volume2 size={14} /> {store.editorAudioFileName}
                          <button onClick={() => { store.setEditorAudioStorageKey(null); store.setEditorAudioFileName(null); }} style={{ marginLeft: 'auto', ...iconBtnStyle, color: '#ef4444' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => document.getElementById('editor-audio-input')?.click()}
                          style={secondaryButtonStyle}
                        >
                          <Upload size={14} /> Choose Audio File
                        </button>
                      )}
                      <input
                        id="editor-audio-input"
                        type="file"
                        accept="audio/*"
                        style={{ display: 'none' }}
                        onChange={(e) => e.target.files?.[0] && handleEditorAudioUpload(e.target.files[0])}
                      />
                    </div>
                  )}

                  {store.editorAudioSource !== 'none' && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Volume</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={store.editorAudioVolume}
                        onChange={(e) => store.setEditorAudioVolume(Number(e.target.value))}
                        style={{ flex: 1, accentColor: '#8b5cf6' }}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", minWidth: '32px' }}>
                        {store.editorAudioVolume}%
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", padding: '8px 12px', background: 'rgba(139,92,246,0.05)', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.15)' }}>
                  Cost: 50 credits per export
                </div>

                <button
                  onClick={handleExportVideo}
                  disabled={
                    store.isExporting ||
                    store.editorClips.filter((c) => c.status === 'ready').length === 0 ||
                    (store.editorAudioSource === 'speech' && !store.editorAudioStorageKey && !store.generatedSpeech) ||
                    (store.editorAudioSource === 'upload' && !store.editorAudioStorageKey)
                  }
                  style={{
                    ...primaryButtonStyle,
                    opacity:
                      store.isExporting ||
                      store.editorClips.filter((c) => c.status === 'ready').length === 0
                        ? 0.5 : 1,
                  }}
                >
                  {store.isExporting ? (
                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Exporting... {elapsed}s</>
                  ) : (
                    <><Film size={16} /> Export Video (50 credits)</>
                  )}
                </button>
              </div>
            ) : store.contentType === 'quote-card' ? (
              /* Quote Card mode */
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Quote</label>
                  <textarea
                    value={quoteText}
                    onChange={(e) => setQuoteText(e.target.value)}
                    placeholder="Enter your quote..."
                    rows={3}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Author</label>
                  <input
                    type="text"
                    value={quoteAuthor}
                    onChange={(e) => setQuoteAuthor(e.target.value)}
                    placeholder="Author name"
                    style={inputStyle}
                  />
                </div>
                <button
                  onClick={handleGenerateQuoteCard}
                  disabled={store.isGenerating || !quoteText.trim()}
                  style={{
                    ...primaryButtonStyle,
                    opacity: store.isGenerating || !quoteText.trim() ? 0.5 : 1,
                  }}
                >
                  {store.isGenerating ? (
                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
                  ) : (
                    <><Sparkles size={16} /> Generate Quote Card</>
                  )}
                </button>

                {quoteResult && (
                  <div style={cardStyle}>
                    <img
                      src={quoteResult.imageDataUrl}
                      alt="Quote card"
                      style={{ width: '100%', maxWidth: '400px', borderRadius: '12px', margin: '0 auto', display: 'block' }}
                    />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
                      <a
                        href={quoteResult.imageDataUrl}
                        download="quote-card.png"
                        style={secondaryButtonStyle}
                      >
                        <Download size={14} /> Download
                      </a>
                      <button onClick={handleLoadIntoComposer} style={primaryButtonStyle}>
                        <Send size={14} /> Load into Composer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Carousel / Mixed / Educational mode */
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Topic / Prompt</label>
                  <textarea
                    value={store.topic}
                    onChange={(e) => {
                      const val = e.target.value;
                      store.setTopic(val);
                      const match = val.match(/\b(\d+)\s+(things?|tips?|facts?|reasons?|ways?|steps?|rules?|habits?|mistakes?|secrets?|lessons?|signs?|hacks?|ideas?|myths?|truths?|principles?|strategies?|techniques?|examples?|benefits?)\b/i);
                      if (match) {
                        const num = parseInt(match[1], 10);
                        if (num >= 1 && num <= 15) {
                          const recommended = Math.min(num + 2, 20);
                          store.setSlideCount(recommended);
                        }
                      }
                    }}
                    placeholder="What's your carousel about? e.g. '5 tips for building a personal brand on Instagram'"
                    rows={3}
                    style={inputStyle}
                  />
                  {(() => {
                    const match = store.topic.match(/\b(\d+)\s+(things?|tips?|facts?|reasons?|ways?|steps?|rules?|habits?|mistakes?|secrets?|lessons?|signs?|hacks?|ideas?|myths?|truths?|principles?|strategies?|techniques?|examples?|benefits?)\b/i);
                    if (match) {
                      const num = parseInt(match[1], 10);
                      return (
                        <div style={{ fontSize: '11px', color: '#8b5cf6', marginTop: '4px', fontFamily: "'IBM Plex Mono', monospace" }}>
                          Detected {num} items — using {num} content slides + hook + CTA = {Math.min(num + 2, 20)} total
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Slides</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => store.setSlideCount(store.slideCount - 1)}
                        disabled={store.slideCount <= 2}
                        style={counterButtonStyle}
                      >
                        -
                      </button>
                      <span style={{ fontSize: '18px', fontWeight: 700, minWidth: '30px', textAlign: 'center' }}>
                        {store.slideCount}
                      </span>
                      <button
                        onClick={() => store.setSlideCount(store.slideCount + 1)}
                        disabled={store.slideCount >= 20}
                        style={counterButtonStyle}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Tone</label>
                    <select
                      value={store.tone}
                      onChange={(e) => store.setTone(e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      {TONES.map((t) => (
                        <option key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGeneratePlan}
                  disabled={store.isPlanning || !store.topic.trim()}
                  style={{
                    ...primaryButtonStyle,
                    opacity: store.isPlanning || !store.topic.trim() ? 0.5 : 1,
                  }}
                >
                  {store.isPlanning ? (
                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Planning slides...</>
                  ) : (
                    <><Wand2 size={16} /> Generate Plan</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ STEP 2: REVIEW — VIDEO ═══════════ */}
        {store.step === 'review' && isVideoMode && store.videoPlan && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
              Review the video concept. Edit prompts before generating.
            </p>

            {/* Video segments or single prompt */}
            {store.videoPlan.segments && store.videoPlan.segments.length > 1 ? (
              <div style={{ display: 'grid', gap: '10px' }}>
                <label style={labelStyle}>Video Segments ({store.videoPlan.segments.length})</label>
                {store.videoPlan.segments.map((seg) => (
                  <div key={seg.segmentNumber} style={{ ...cardStyle, padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#8b5cf6', fontFamily: "'IBM Plex Mono', monospace" }}>
                        SEGMENT {seg.segmentNumber} — {seg.duration}s
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, fontFamily: "'IBM Plex Mono', monospace" }}>
                      {seg.prompt}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Video Prompt</label>
                  {editingVideoPrompt ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => {
                          store.setVideoPlan({ ...store.videoPlan!, prompt: videoPromptDraft });
                          setEditingVideoPrompt(false);
                        }}
                        style={iconBtnStyle}
                        title="Save"
                      >
                        <Check size={14} style={{ color: '#22c55e' }} />
                      </button>
                      <button
                        onClick={() => {
                          setVideoPromptDraft(store.videoPlan!.prompt);
                          setEditingVideoPrompt(false);
                        }}
                        style={iconBtnStyle}
                        title="Cancel"
                      >
                        <X size={14} style={{ color: '#ff4444' }} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setEditingVideoPrompt(true)} style={iconBtnStyle} title="Edit">
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
                {editingVideoPrompt ? (
                  <textarea
                    value={videoPromptDraft}
                    onChange={(e) => setVideoPromptDraft(e.target.value)}
                    rows={4}
                    style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px' }}
                  />
                ) : (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, fontFamily: "'IBM Plex Mono', monospace" }}>
                    {store.videoPlan.prompt}
                  </div>
                )}
              </div>
            )}

            {/* Voiceover script (editable) */}
            {store.videoPlan.voiceoverScript && (
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Voiceover Script</label>
                  {editingVoiceoverScript ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => {
                          store.setVideoPlan({ ...store.videoPlan!, voiceoverScript: voiceoverScriptDraft });
                          setEditingVoiceoverScript(false);
                        }}
                        style={iconBtnStyle}
                        title="Save"
                      >
                        <Check size={14} style={{ color: '#22c55e' }} />
                      </button>
                      <button
                        onClick={() => {
                          setVoiceoverScriptDraft(store.videoPlan!.voiceoverScript!);
                          setEditingVoiceoverScript(false);
                        }}
                        style={iconBtnStyle}
                        title="Cancel"
                      >
                        <X size={14} style={{ color: '#ff4444' }} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setVoiceoverScriptDraft(store.videoPlan!.voiceoverScript!);
                        setEditingVoiceoverScript(true);
                      }}
                      style={iconBtnStyle}
                      title="Edit"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
                {editingVoiceoverScript ? (
                  <textarea
                    value={voiceoverScriptDraft}
                    onChange={(e) => setVoiceoverScriptDraft(e.target.value)}
                    rows={4}
                    style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px' }}
                  />
                ) : (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontStyle: 'italic' }}>
                    {store.videoPlan.voiceoverScript}
                  </div>
                )}
              </div>
            )}

            {/* Music style */}
            {store.videoPlan.musicStyle && (
              <div style={cardStyle}>
                <label style={labelStyle}>Background Music</label>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {store.videoPlan.musicStyle}
                </div>
              </div>
            )}

            {/* Caption + hashtags */}
            <div style={cardStyle}>
              <label style={labelStyle}>Caption</label>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {store.videoPlan.caption}
              </div>
              {store.videoPlan.hashtags.length > 0 && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#8b5cf6' }}>
                  {store.videoPlan.hashtags.map((h) => `#${h}`).join(' ')}
                </div>
              )}
            </div>

            {/* Video details */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ ...cardStyle, flex: 1, textAlign: 'center', minWidth: '80px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", marginBottom: '4px' }}>DURATION</div>
                <div style={{ fontSize: '20px', fontWeight: 700 }}>{store.videoPlan.totalDuration || store.videoPlan.duration}s</div>
              </div>
              {store.videoPlan.segments && store.videoPlan.segments.length > 1 && (
                <div style={{ ...cardStyle, flex: 1, textAlign: 'center', minWidth: '80px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", marginBottom: '4px' }}>SEGMENTS</div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>{store.videoPlan.segments.length}</div>
                </div>
              )}
              <div style={{ ...cardStyle, flex: 1, textAlign: 'center', minWidth: '80px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", marginBottom: '4px' }}>ASPECT RATIO</div>
                <div style={{ fontSize: '20px', fontWeight: 700 }}>{store.videoPlan.aspectRatio}</div>
              </div>
              <div style={{ ...cardStyle, flex: 1, textAlign: 'center', minWidth: '80px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", marginBottom: '4px' }}>PLATFORM</div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{VIDEO_PLATFORMS.find((p) => p.id === store.videoPlatform)?.label}</div>
              </div>
            </div>

            <button
              onClick={handleGenerateVideo}
              disabled={store.isGeneratingVideo}
              style={{
                ...primaryButtonStyle,
                opacity: store.isGeneratingVideo ? 0.5 : 1,
                padding: '14px 28px',
                fontSize: '14px',
              }}
            >
              {store.isGeneratingVideo ? (
                <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Generating video... {elapsed}s</>
              ) : (
                <><Video size={18} /> Generate Video</>
              )}
            </button>

            {store.isGeneratingVideo && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(139,92,246,0.08)',
                border: '1px solid rgba(139,92,246,0.15)',
                borderRadius: '10px',
                fontSize: '11px',
                color: 'var(--text-muted)',
                fontFamily: "'IBM Plex Mono', monospace",
                textAlign: 'center',
              }}>
                {store.videoPlan && store.videoPlan.segments && store.videoPlan.segments.length > 1
                  ? `Generating ${store.videoPlan.segments.length} video segments${store.videoPlan.musicStyle ? ' + music' : ''}${store.videoPlan.voiceoverScript ? ' + voiceover' : ''}. This may take several minutes.`
                  : 'This usually takes 30-90 seconds.'
                } Please don't close this page.
              </div>
            )}
          </div>
        )}

        {/* ═══════════ STEP 2: REVIEW — CAROUSEL ═══════════ */}
        {store.step === 'review' && !isVideoMode && store.plan && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
              Review and edit the slide plan. Click a slide to modify text or image prompts.
            </p>

            {/* Caption preview */}
            <div style={cardStyle}>
              <label style={labelStyle}>Instagram Caption</label>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {store.plan.caption}
              </div>
              {store.plan.hashtags.length > 0 && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#8b5cf6' }}>
                  {store.plan.hashtags.map((h) => `#${h}`).join(' ')}
                </div>
              )}
            </div>

            {/* Slide cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {store.plan.slides.map((slide) => (
                <div
                  key={slide.slideNumber}
                  style={{
                    ...cardStyle,
                    position: 'relative',
                    borderColor: editingSlide === slide.slideNumber ? '#8b5cf6' : 'var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#8b5cf6', fontFamily: "'IBM Plex Mono', monospace" }}>
                      SLIDE {slide.slideNumber}
                    </span>
                    {editingSlide === slide.slideNumber ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={saveEditSlide} style={iconBtnStyle} title="Save">
                          <Check size={14} style={{ color: '#22c55e' }} />
                        </button>
                        <button onClick={() => setEditingSlide(null)} style={iconBtnStyle} title="Cancel">
                          <X size={14} style={{ color: '#ff4444' }} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEditSlide(slide)} style={iconBtnStyle} title="Edit">
                        <Pencil size={12} />
                      </button>
                    )}
                  </div>

                  {editingSlide === slide.slideNumber ? (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ ...inputStyle, fontSize: '13px', fontWeight: 700 }} placeholder="Title" />
                      <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={2} style={{ ...inputStyle, fontSize: '12px' }} placeholder="Body text" />
                      <textarea value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} rows={2} style={{ ...inputStyle, fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace" }} placeholder="Image prompt" />
                    </div>
                  ) : (
                    <>
                      <div style={{ padding: '12px', borderRadius: '8px', background: slide.backgroundColor, color: slide.textColor, marginBottom: '8px', minHeight: '60px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>{slide.title}</div>
                        {slide.body && <div style={{ fontSize: '11px', opacity: 0.85 }}>{slide.body}</div>}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.4 }}>
                        {slide.imagePrompt.length > 80 ? slide.imagePrompt.slice(0, 80) + '...' : slide.imagePrompt}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleGenerateSlides}
              disabled={store.isGenerating}
              style={{ ...primaryButtonStyle, opacity: store.isGenerating ? 0.5 : 1, padding: '14px 28px', fontSize: '14px' }}
            >
              {store.isGenerating ? (
                <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Generating {store.plan.slides.length} slides...</>
              ) : (
                <><Sparkles size={18} /> Generate Images</>
              )}
            </button>
          </div>
        )}

        {/* ═══════════ STEP 3: PREVIEW — VIDEO ═══════════ */}
        {store.step === 'preview' && isVideoMode && store.generatedVideo && (
          <div style={{ display: 'grid', gap: '24px' }}>
            <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
              <div style={{ position: 'relative', background: '#000', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', aspectRatio: '9/16' }}>
                <video src={store.generatedVideo.videoUrl} controls autoPlay loop playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>{store.generatedVideo.duration}s</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>{store.videoPlan?.aspectRatio || '9:16'}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>{VIDEO_PLATFORMS.find((p) => p.id === store.videoPlatform)?.label}</div>
              </div>
            </div>

            {store.videoPlan && (
              <div style={cardStyle}>
                <label style={labelStyle}>Caption</label>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{store.videoPlan.caption}</div>
                {store.videoPlan.hashtags.length > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#8b5cf6' }}>{store.videoPlan.hashtags.map((h) => `#${h}`).join(' ')}</div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href={store.generatedVideo.videoUrl} download="generated-video.mp4" style={secondaryButtonStyle}>
                <Download size={14} /> Download
              </a>
              <button onClick={() => { store.setStep('review'); store.setIsGeneratingVideo(false); }} style={secondaryButtonStyle}>
                <RotateCcw size={14} /> Regenerate
              </button>
              <button onClick={handleLoadIntoComposer} style={primaryButtonStyle}>
                <Send size={14} /> Load into Composer
              </button>
              <button onClick={() => { store.reset(); setQuoteResult(null); }} style={secondaryButtonStyle}>
                <RotateCcw size={14} /> Start Over
              </button>
            </div>
          </div>
        )}

        {/* ═══════════ STEP 2: PREVIEW — SPEECH ═══════════ */}
        {store.step === 'preview' && isSpeechMode && store.generatedSpeech && (
          <div style={{ display: 'grid', gap: '24px' }}>
            <div style={{ maxWidth: '500px', margin: '0 auto', width: '100%' }}>
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Mic size={18} style={{ color: '#8b5cf6' }} />
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>Generated Audio</span>
                  <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                    ~{store.generatedSpeech.duration}s
                  </span>
                </div>
                <audio
                  controls
                  src={store.generatedSpeech.audioDataUrl}
                  style={{ width: '100%', borderRadius: '8px' }}
                />
              </div>

              <div style={{ ...cardStyle, marginTop: '16px' }}>
                <label style={labelStyle}>Script</label>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontStyle: 'italic' }}>
                  {store.speechScript}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href={store.generatedSpeech.audioDataUrl} download="speech.mp3" style={secondaryButtonStyle}>
                <Download size={14} /> Download MP3
              </a>
              <button onClick={() => { store.setGeneratedSpeech(null); store.setStep('configure'); }} style={secondaryButtonStyle}>
                <RotateCcw size={14} /> Regenerate
              </button>
              <button
                onClick={() => {
                  const speechKey = store.generatedSpeech?.storageKey || null;
                  store.setContentType('video-editor');
                  store.setStep('configure');
                  store.setEditorAudioSource('speech');
                  store.setEditorAudioStorageKey(speechKey);
                  store.setEditorAudioFileName('Generated Speech');
                }}
                style={primaryButtonStyle}
              >
                <Film size={14} /> Open in Video Editor
              </button>
              <button onClick={() => { store.reset(); setQuoteResult(null); }} style={secondaryButtonStyle}>
                <RotateCcw size={14} /> Start Over
              </button>
            </div>
          </div>
        )}

        {/* ═══════════ STEP 2: PREVIEW — VIDEO EDITOR ═══════════ */}
        {store.step === 'preview' && isEditorMode && store.editorExportedVideo && (
          <div style={{ display: 'grid', gap: '24px' }}>
            <div style={{ maxWidth: '500px', margin: '0 auto', width: '100%' }}>
              <div style={{ position: 'relative', background: '#000', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <video
                  src={store.editorExportedVideo.videoUrl}
                  controls
                  autoPlay
                  playsInline
                  style={{ width: '100%', display: 'block', borderRadius: '16px' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {store.editorExportedVideo.duration}s
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {store.editorClips.length} clips
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href={store.editorExportedVideo.videoUrl} download="edited-video.mp4" style={secondaryButtonStyle}>
                <Download size={14} /> Download MP4
              </a>
              <button onClick={handleLoadIntoComposer} style={primaryButtonStyle}>
                <Send size={14} /> Load into Composer
              </button>
              <button onClick={() => { store.reset(); setQuoteResult(null); }} style={secondaryButtonStyle}>
                <RotateCcw size={14} /> Start Over
              </button>
            </div>
          </div>
        )}

        {/* ═══════════ STEP 3: PREVIEW — CAROUSEL ═══════════ */}
        {store.step === 'preview' && !isVideoMode && !isSpeechMode && !isEditorMode && store.slides && (
          <div style={{ display: 'grid', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ position: 'relative', background: 'var(--bg-tertiary)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <img src={store.slides[store.currentSlide]?.imageDataUrl} alt={`Slide ${store.currentSlide + 1}`} style={{ width: '100%', display: 'block', borderRadius: '16px' }} />

                  {(store.regeneratingSlide === store.slides[store.currentSlide]?.slideNumber || store.isGeneratingVideo) && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', gap: '8px' }}>
                      <Loader2 size={32} style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />
                      {store.isGeneratingVideo && (
                        <div style={{ color: '#fff', fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace" }}>Animating... {elapsed}s</div>
                      )}
                    </div>
                  )}

                  {store.slides.length > 1 && (
                    <>
                      <button onClick={() => store.setCurrentSlide(Math.max(0, store.currentSlide - 1))} disabled={store.currentSlide === 0} style={{ ...navArrowStyle, left: '12px', opacity: store.currentSlide === 0 ? 0.3 : 1 }}>
                        <ChevronLeft size={20} />
                      </button>
                      <button onClick={() => store.setCurrentSlide(Math.min(store.slides!.length - 1, store.currentSlide + 1))} disabled={store.currentSlide === store.slides.length - 1} style={{ ...navArrowStyle, right: '12px', opacity: store.currentSlide === store.slides.length - 1 ? 0.3 : 1 }}>
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}

                  <div style={{ position: 'absolute', bottom: '12px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '6px' }}>
                    {store.slides.map((_, i) => (
                      <button key={i} onClick={() => store.setCurrentSlide(i)} style={{ width: i === store.currentSlide ? '20px' : '8px', height: '8px', borderRadius: '4px', background: i === store.currentSlide ? '#fff' : 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease', padding: 0 }} />
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'center' }}>
                  <button onClick={() => handleRegenerateSlide(store.slides![store.currentSlide].slideNumber)} disabled={store.regeneratingSlide !== null || store.isGeneratingVideo} style={secondaryButtonStyle}>
                    <RotateCcw size={14} /> Regenerate
                  </button>
                  {capabilities?.aiVideo && (
                    <button onClick={() => handleAnimateSlide(store.slides![store.currentSlide].imageUrl)} disabled={store.isGeneratingVideo || store.regeneratingSlide !== null} style={secondaryButtonStyle}>
                      <Play size={14} /> Animate
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '120px', flexShrink: 0 }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>SLIDES</div>
                {store.slides.map((slide, i) => (
                  <button key={slide.slideNumber} onClick={() => store.setCurrentSlide(i)} style={{ padding: 0, border: `2px solid ${i === store.currentSlide ? '#8b5cf6' : 'var(--border-color)'}`, borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', background: 'transparent', opacity: i === store.currentSlide ? 1 : 0.6, transition: 'all 0.2s ease' }}>
                    <img src={slide.imageDataUrl} alt={`Slide ${slide.slideNumber}`} style={{ width: '100%', display: 'block' }} />
                  </button>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <label style={labelStyle}>Caption</label>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{store.caption}</div>
              {store.hashtags.length > 0 && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#8b5cf6' }}>{store.hashtags.map((h) => `#${h}`).join(' ')}</div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleDownloadAll} style={secondaryButtonStyle}><Download size={14} /> Download All</button>
              <button onClick={handleLoadIntoComposer} style={primaryButtonStyle}><Send size={14} /> Load into Composer</button>
              <button onClick={() => { store.reset(); setQuoteResult(null); }} style={secondaryButtonStyle}><RotateCcw size={14} /> Start Over</button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Shared Styles ───────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace", marginBottom: '8px', display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '13px', fontFamily: "'Sora', sans-serif", outline: 'none', resize: 'vertical', boxSizing: 'border-box',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px',
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Sora', sans-serif", transition: 'all 0.2s ease',
};

const secondaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Sora', sans-serif", textDecoration: 'none', transition: 'all 0.2s ease',
};

const counterButtonStyle: React.CSSProperties = {
  width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '16px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const iconBtnStyle: React.CSSProperties = {
  padding: '4px', borderRadius: '6px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const navArrowStyle: React.CSSProperties = {
  position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s ease', padding: 0,
};
