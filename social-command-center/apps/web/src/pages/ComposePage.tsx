import { useState, useRef, useMemo, useEffect } from 'react';
import type { PlatformConfig, PlatformId } from '@scc/shared';
import { PLATFORMS, SCHEDULE_OPTIONS } from '@scc/shared';
import { useCreatePost } from '../hooks/usePosts';
import { useMediaUpload } from '../hooks/useMediaUpload';
import { useEnhanceContent, useBrainstorm, useGeneratePlatformPosts } from '../hooks/useAI';
import { useConnections } from '../hooks/useConnections';
import { toast } from 'sonner';
import Header from '../components/layout/Header';

// Animated background particles
function ParticleField() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {Array.from({ length: 20 }).map((_, i) => {
        const width = Math.random() * 3 + 1;
        const hue = Math.random() * 360;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const duration = 8 + Math.random() * 12;
        const delay = Math.random() * -10;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: `${width}px`,
              height: `${width}px`,
              background: `hsl(${hue}, 70%, 60%)`,
              borderRadius: '50%',
              left: `${left}%`,
              top: `${top}%`,
              opacity: 0.15,
              animation: `float-particle ${duration}s ease-in-out infinite`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}

function PlatformToggle({
  platform,
  active,
  connected,
  onClick,
}: {
  platform: PlatformConfig;
  active: boolean;
  connected: boolean;
  onClick: () => void;
}) {
  const accent = platform.accent || platform.color;
  const disabled = !connected;
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 18px',
        background: disabled
          ? 'var(--bg-tertiary)'
          : active
            ? platform.bg
            : 'var(--bg-tertiary)',
        border: `1.5px solid ${disabled ? 'var(--bg-tertiary)' : active ? accent : 'var(--border-color)'}`,
        borderRadius: '14px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        transform: active && connected ? 'scale(1.02)' : 'scale(1)',
        boxShadow: active && connected
          ? `0 0 20px ${accent}22, 0 4px 12px rgba(0,0,0,0.15)`
          : '0 2px 8px rgba(0,0,0,0.08)',
        opacity: disabled ? 0.3 : active ? 1 : 0.5,
      }}
    >
      <span
        style={{
          fontSize: '18px',
          fontWeight: 800,
          fontFamily: "'Sora', sans-serif",
          color: disabled ? 'var(--text-disabled)' : active ? accent : 'var(--text-tertiary)',
          width: '28px',
          textAlign: 'center',
          filter: active && connected ? `drop-shadow(0 0 6px ${accent}55)` : 'none',
        }}
      >
        {platform.icon}
      </span>
      <div style={{ textAlign: 'left' }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: disabled ? 'var(--text-disabled)' : active ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontFamily: "'Sora', sans-serif",
            letterSpacing: '0.02em',
          }}
        >
          {platform.name}
        </div>
        <div
          style={{
            fontSize: '10px',
            color: disabled ? 'var(--text-disabled)' : 'var(--text-muted)',
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          {disabled ? 'Not connected' : platform.label}
        </div>
      </div>
      <div
        style={{
          marginLeft: 'auto',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: disabled ? 'transparent' : active ? accent : 'transparent',
          border: `2px solid ${disabled ? 'var(--border-subtle)' : active ? accent : 'var(--border-color)'}`,
          boxShadow: active && connected ? `0 0 8px ${accent}88` : 'none',
          transition: 'all 0.3s ease',
        }}
      />
    </button>
  );
}

function CharCounter({
  current,
  max,
  color,
}: {
  current: number;
  max: number;
  color: string;
}) {
  const pct = Math.min((current / max) * 100, 100);
  const warn = pct > 80;
  const over = current > max;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div
        style={{
          width: '60px',
          height: '4px',
          borderRadius: '2px',
          background: 'var(--border-color)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: '2px',
            width: `${Math.min(pct, 100)}%`,
            background: over ? '#ff4444' : warn ? '#ffaa00' : color,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <span
        style={{
          fontSize: '11px',
          fontFamily: "'IBM Plex Mono', monospace",
          color: over ? '#ff4444' : warn ? '#ffaa00' : 'var(--text-muted)',
        }}
      >
        {current}/{max}
      </span>
    </div>
  );
}

interface UploadedFile {
  id?: string;
  name: string;
  type: 'video' | 'image';
  file: File;
}

function MediaUploadZone({
  files,
  onAdd,
  onRemove,
}: {
  files: UploadedFile[];
  onAdd: (files: UploadedFile[]) => void;
  onRemove: (idx: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: files.length ? '12px' : 0,
        }}
      >
        {files.map((f, i) => (
          <div
            key={i}
            style={{
              position: 'relative',
              width: '72px',
              height: '72px',
              borderRadius: '12px',
              background: 'var(--bg-hover)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <span style={{ fontSize: '24px' }}>
              {f.type === 'video' ? '\u{1F3AC}' : '\u{1F5BC}\uFE0F'}
            </span>
            <button
              onClick={() => onRemove(i)}
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'rgba(255,0,0,0.7)',
                border: 'none',
                color: '#fff',
                fontSize: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              \u00D7
            </button>
            <div
              style={{
                position: 'absolute',
                bottom: '2px',
                left: '4px',
                right: '4px',
                fontSize: '8px',
                color: 'var(--text-tertiary)',
                fontFamily: "'IBM Plex Mono', monospace",
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {f.name}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => inputRef.current?.click()}
        style={{
          width: '100%',
          padding: '14px',
          background: 'var(--bg-tertiary)',
          border: '1.5px dashed var(--border-color)',
          borderRadius: '14px',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          fontSize: '13px',
          fontFamily: "'Sora', sans-serif",
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          const target = e.target as HTMLElement;
          target.style.borderColor = 'var(--border-color)';
          target.style.color = 'var(--text-tertiary)';
        }}
        onMouseLeave={(e) => {
          const target = e.target as HTMLElement;
          target.style.borderColor = 'var(--border-color)';
          target.style.color = 'var(--text-muted)';
        }}
      >
        + Add Media (Images, Video, Documents)
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          const newFiles = Array.from(e.target.files || []).map((f) => ({
            name: f.name,
            type: (f.type.startsWith('video') ? 'video' : 'image') as 'video' | 'image',
            file: f,
          }));
          onAdd(newFiles);
        }}
      />
    </div>
  );
}

function AIEnhancePanel({
  content,
  onApply,
}: {
  content: string;
  onApply: (text: string) => void;
}) {
  const [enhancing, setEnhancing] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [tone, setTone] = useState('professional');

  const tones = [
    'professional',
    'casual',
    'inspirational',
    'humorous',
    'storytelling',
    'emperor-mode \u{1F451}',
  ];

  const enhanceMutation = useEnhanceContent();

  const enhance = async () => {
    setEnhancing(true);
    try {
      const result = await enhanceMutation.mutateAsync({
        content,
        tone: tone.replace(' \u{1F451}', ''),
        platforms: [],
      });
      setSuggestion(result.enhanced || content);
    } catch (error) {
      toast.error('Enhancement failed. Please try again.');
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <span style={{ fontSize: '16px' }}>{'\u{1F9E0}'}</span>
        <span
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            fontFamily: "'Sora', sans-serif",
          }}
        >
          Lumen AI Enhance
        </span>
        <span
          style={{
            fontSize: '9px',
            padding: '2px 8px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            color: '#fff',
            fontWeight: 600,
          }}
        >
          ORCA
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          marginBottom: '12px',
        }}
      >
        {tones.map((t) => (
          <button
            key={t}
            onClick={() => setTone(t)}
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              background:
                tone === t ? 'rgba(139,92,246,0.15)' : 'transparent',
              border: `1px solid ${tone === t ? 'rgba(139,92,246,0.4)' : 'var(--border-color)'}`,
              color: tone === t ? '#a78bfa' : 'var(--text-tertiary)',
              fontSize: '11px',
              cursor: 'pointer',
              fontFamily: "'Sora', sans-serif",
              fontWeight: 600,
              textTransform: 'capitalize',
              transition: 'all 0.2s ease',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <button
        onClick={enhance}
        disabled={enhancing || !content}
        style={{
          width: '100%',
          padding: '10px',
          background: enhancing
            ? 'rgba(139,92,246,0.1)'
            : 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.15))',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: '10px',
          cursor: enhancing ? 'wait' : 'pointer',
          color: '#a78bfa',
          fontSize: '12px',
          fontWeight: 700,
          fontFamily: "'Sora', sans-serif",
          transition: 'all 0.3s ease',
          opacity: !content ? 0.3 : 1,
        }}
      >
        {enhancing ? '\u26A1 Enhancing...' : '\u2728 Enhance with Lumen AI'}
      </button>

      {suggestion && (
        <div style={{ marginTop: '12px' }}>
          <div
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(139,92,246,0.05)',
              border: '1px solid rgba(139,92,246,0.15)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              fontFamily: "'IBM Plex Mono', monospace",
              whiteSpace: 'pre-wrap',
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            {suggestion}
          </div>
          <button
            onClick={() => {
              onApply(suggestion);
              setSuggestion('');
            }}
            style={{
              marginTop: '8px',
              padding: '8px 16px',
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#22c55e',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: "'Sora', sans-serif",
            }}
          >
            {'\u2713'} Apply Enhancement
          </button>
        </div>
      )}
    </div>
  );
}

const CONTENT_CATEGORIES = [
  { label: 'Motivational', icon: '\u{1F525}', keywords: ['motivation', 'mindset', 'growth', 'success'] },
  { label: 'Behind the Scenes', icon: '\u{1F3AC}', keywords: ['behind the scenes', 'process', 'building', 'journey'] },
  { label: 'Industry Take', icon: '\u{1F4CA}', keywords: ['industry trends', 'innovation', 'future', 'technology'] },
  { label: 'Community', icon: '\u{1F91D}', keywords: ['community', 'collaboration', 'together', 'support'] },
  { label: 'Product Launch', icon: '\u{1F680}', keywords: ['launch', 'announcement', 'new release', 'update'] },
  { label: 'Personal Story', icon: '\u{1F4DD}', keywords: ['personal story', 'lesson learned', 'experience', 'reflection'] },
  { label: 'Education', icon: '\u{1F4DA}', keywords: ['how to', 'tips', 'tutorial', 'guide'] },
  { label: 'Consciousness', icon: '\u{1F30A}', keywords: ['consciousness', 'frequency', 'awareness', 'awakening'] },
];

function BrainstormPanel({
  activePlatforms,
  connectedPlatforms,
  onUsePost,
  onLoadAllPosts,
}: {
  activePlatforms: PlatformId[];
  connectedPlatforms: Set<PlatformId>;
  onUsePost: (content: string, platform?: PlatformId) => void;
  onLoadAllPosts: (mainContent: string, overrides: Partial<Record<PlatformId, string>>, platforms: PlatformId[]) => void;
}) {
  const [step, setStep] = useState<'pick' | 'refine' | 'results' | 'generated'>('pick');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [tone, setTone] = useState('professional');
  const [results, setResults] = useState<
    Array<{ content: string; platform: string; hook: string; hashtags: string[] }>
  >([]);
  const [generatedPosts, setGeneratedPosts] = useState<
    Array<{ platform: string; content: string; hashtags: string[]; charCount: number; tip: string }>
  >([]);
  const [selectedIdea, setSelectedIdea] = useState('');
  const brainstormMutation = useBrainstorm();
  const generateMutation = useGeneratePlatformPosts();

  const tones = [
    { id: 'professional', label: 'Professional' },
    { id: 'casual', label: 'Casual' },
    { id: 'inspirational', label: 'Inspirational' },
    { id: 'humorous', label: 'Funny' },
    { id: 'storytelling', label: 'Story' },
    { id: 'emperor-mode', label: 'Emperor \u{1F451}' },
  ];

  const handleCategoryPick = (cat: typeof CONTENT_CATEGORIES[number]) => {
    setSelectedCategory(cat.label);
    setCustomInput(cat.keywords.join(', '));
    setStep('refine');
  };

  const handleGenerate = async () => {
    const keywordList = customInput
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    if (!keywordList.length) {
      toast.error('Add at least one topic');
      return;
    }
    try {
      const connectedList = Array.from(connectedPlatforms);
      const result = await brainstormMutation.mutateAsync({
        keywords: keywordList,
        platforms: activePlatforms.length ? activePlatforms : connectedList.length ? connectedList : ['x', 'instagram', 'linkedin'],
        tone,
        count: 4,
      });
      setResults(result.posts || []);
      setStep('results');
    } catch {
      toast.error('Brainstorm failed. Try again.');
    }
  };

  const platformInfo = (id: string) => {
    const p = PLATFORMS.find((pl) => pl.id === id);
    return p || null;
  };

  const resetFlow = () => {
    setStep('pick');
    setSelectedCategory('');
    setCustomInput('');
    setResults([]);
  };

  return (
    <div
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '16px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px',
        }}
      >
        <span style={{ fontSize: '16px' }}>{'\u{1F4A1}'}</span>
        <span
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            fontFamily: "'Sora', sans-serif",
          }}
        >
          What should you post?
        </span>
        <span
          style={{
            fontSize: '9px',
            padding: '2px 8px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            color: '#fff',
            fontWeight: 600,
          }}
        >
          AI
        </span>
        {step !== 'pick' && (
          <button
            onClick={resetFlow}
            style={{
              marginLeft: 'auto',
              padding: '2px 8px',
              borderRadius: '20px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              fontSize: '9px',
              cursor: 'pointer',
              fontFamily: "'Sora', sans-serif",
            }}
          >
            Start Over
          </button>
        )}
      </div>

      <div
        style={{
          fontSize: '11px',
          color: 'var(--text-disabled)',
          marginBottom: '12px',
          lineHeight: 1.5,
        }}
      >
        {step === 'pick' && 'Pick a topic or describe what\'s on your mind. AI does the rest.'}
        {step === 'refine' && 'Tweak the topics and pick your vibe. Hit generate when ready.'}
        {step === 'results' && 'Pick an idea. AI will tailor it for each of your platforms.'}
        {step === 'generated' && 'Posts generated for each platform. Load them all or pick one.'}
      </div>

      {/* STEP 1: Pick a category or free-type */}
      {step === 'pick' && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '6px',
              marginBottom: '10px',
            }}
          >
            {CONTENT_CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => handleCategoryPick(cat)}
                style={{
                  padding: '10px 8px',
                  borderRadius: '10px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: "'Sora', sans-serif",
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '14px' }}>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            <span style={{ fontSize: '10px', color: 'var(--text-disabled)', fontFamily: "'IBM Plex Mono', monospace" }}>
              or type your own
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customInput.trim()) {
                  setSelectedCategory('Custom');
                  setStep('refine');
                }
              }}
              placeholder="What's on your mind?"
              style={{
                flex: 1,
                padding: '10px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontFamily: "'Sora', sans-serif",
              }}
            />
            <button
              onClick={() => {
                if (customInput.trim()) {
                  setSelectedCategory('Custom');
                  setStep('refine');
                }
              }}
              disabled={!customInput.trim()}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: customInput.trim()
                  ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                  : 'var(--bg-tertiary)',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: customInput.trim() ? 'pointer' : 'default',
                opacity: customInput.trim() ? 1 : 0.3,
                fontFamily: "'Sora', sans-serif",
              }}
            >
              Go
            </button>
          </div>
        </>
      )}

      {/* STEP 2: Refine keywords + pick tone */}
      {step === 'refine' && (
        <>
          <div
            style={{
              fontSize: '10px',
              color: '#f59e0b',
              fontWeight: 600,
              marginBottom: '6px',
              fontFamily: "'IBM Plex Mono', monospace",
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {CONTENT_CATEGORIES.find((c) => c.label === selectedCategory)?.icon || '\u{270F}\u{FE0F}'}{' '}
            {selectedCategory}
          </div>

          <textarea
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Add or edit topics (comma separated)"
            style={{
              width: '100%',
              height: '48px',
              resize: 'none',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '10px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontFamily: "'IBM Plex Mono', monospace",
              marginBottom: '10px',
            }}
          />

          <div
            style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              fontWeight: 600,
              marginBottom: '6px',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            VIBE
          </div>
          <div
            style={{
              display: 'flex',
              gap: '4px',
              flexWrap: 'wrap',
              marginBottom: '12px',
            }}
          >
            {tones.map((t) => (
              <button
                key={t.id}
                onClick={() => setTone(t.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background:
                    tone === t.id
                      ? 'linear-gradient(135deg, #f59e0b22, #ef444422)'
                      : 'var(--bg-tertiary)',
                  border: `1px solid ${tone === t.id ? '#f59e0b' : 'var(--border-color)'}`,
                  color: tone === t.id ? '#f59e0b' : 'var(--text-muted)',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: "'Sora', sans-serif",
                  transition: 'all 0.15s ease',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={brainstormMutation.isPending}
            style={{
              width: '100%',
              padding: '12px',
              background: brainstormMutation.isPending
                ? 'rgba(245,158,11,0.15)'
                : 'linear-gradient(135deg, #f59e0b, #ef4444)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: brainstormMutation.isPending ? 'wait' : 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: "'Sora', sans-serif",
              boxShadow: brainstormMutation.isPending ? 'none' : '0 4px 16px rgba(245,158,11,0.25)',
            }}
          >
            {brainstormMutation.isPending ? '\u{2728} AI is thinking...' : '\u{1F4A1} Generate Post Ideas'}
          </button>
        </>
      )}

      {/* STEP 3: Results */}
      {/* STEP 3: Brainstorm results — pick an idea */}
      {step === 'results' && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {results.map((post, i) => {
            const pInfo = platformInfo(post.platform);
            return (
              <button
                key={i}
                onClick={async () => {
                  const ideaText = post.hashtags.length
                    ? `${post.content}\n\n${post.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}`
                    : post.content;
                  setSelectedIdea(ideaText);
                  // Generate tailored posts for all connected platforms
                  const connectedList = Array.from(connectedPlatforms);
                  if (connectedList.length === 0) {
                    // No connections — just load the idea directly
                    onUsePost(ideaText, pInfo?.id);
                    toast.success('Post loaded into composer');
                    return;
                  }
                  try {
                    const result = await generateMutation.mutateAsync({
                      topic: post.content,
                      platforms: connectedList,
                      tone,
                      context: post.hook,
                    });
                    setGeneratedPosts(result.posts || []);
                    setStep('generated');
                  } catch {
                    // Fallback: just load idea
                    onUsePost(ideaText, pInfo?.id);
                    toast.error('Generation failed — loaded original idea instead');
                  }
                }}
                disabled={generateMutation.isPending}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '12px',
                  cursor: generateMutation.isPending ? 'wait' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  opacity: generateMutation.isPending ? 0.6 : 1,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '6px',
                  }}
                >
                  <span style={{ fontSize: '12px' }}>{pInfo?.icon || ''}</span>
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '2px 6px',
                      borderRadius: '20px',
                      background: 'rgba(245,158,11,0.12)',
                      color: '#f59e0b',
                      fontWeight: 600,
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    {post.hook}
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      color: '#8b5cf6',
                      fontFamily: "'IBM Plex Mono', monospace",
                      marginLeft: 'auto',
                    }}
                  >
                    {'\u26A1'} Select & Generate
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    fontFamily: "'IBM Plex Mono', monospace",
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {post.content.length > 120 ? post.content.substring(0, 120) + '...' : post.content}
                </div>
              </button>
            );
          })}

          {generateMutation.isPending && (
            <div
              style={{
                textAlign: 'center',
                padding: '16px',
                fontSize: '12px',
                color: '#f59e0b',
                fontWeight: 600,
                fontFamily: "'Sora', sans-serif",
              }}
            >
              {'\u{2728}'} Generating tailored posts for {Array.from(connectedPlatforms).length} platforms...
            </div>
          )}

          <button
            onClick={() => setStep('refine')}
            disabled={generateMutation.isPending}
            style={{
              width: '100%',
              padding: '8px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Sora', sans-serif",
            }}
          >
            {'\u{1F504}'} Try different topics
          </button>
        </div>
      )}

      {/* STEP 4: Generated platform-specific posts */}
      {step === 'generated' && generatedPosts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Load All button */}
          <button
            onClick={() => {
              const connectedList = Array.from(connectedPlatforms);
              const first = generatedPosts[0];
              const mainContent = first
                ? (first.hashtags.length
                  ? `${first.content}\n\n${first.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}`
                  : first.content)
                : selectedIdea;
              const overrides: Partial<Record<PlatformId, string>> = {};
              for (const gp of generatedPosts.slice(1)) {
                const pid = gp.platform.toLowerCase() as PlatformId;
                if (connectedList.includes(pid)) {
                  const fullText = gp.hashtags.length
                    ? `${gp.content}\n\n${gp.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}`
                    : gp.content;
                  overrides[pid] = fullText;
                }
              }
              const platformIds = generatedPosts
                .map((gp) => gp.platform.toLowerCase() as PlatformId)
                .filter((pid) => connectedList.includes(pid));
              onLoadAllPosts(mainContent, overrides, platformIds);
              toast.success(`Loaded ${generatedPosts.length} tailored posts into composer`);
            }}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'Sora', sans-serif",
              boxShadow: '0 4px 16px rgba(139,92,246,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {'\u26A1'} Load All {generatedPosts.length} Posts into Composer
          </button>

          {generatedPosts.map((gp, i) => {
            const pInfo = platformInfo(gp.platform);
            const maxChars = pInfo ? pInfo.maxChars : 5000;
            const isOverLimit = gp.content.length > maxChars;
            return (
              <div
                key={i}
                style={{
                  background: 'var(--bg-secondary)',
                  border: `1px solid ${pInfo ? (pInfo.accent || pInfo.color) + '44' : 'var(--border-subtle)'}`,
                  borderRadius: '10px',
                  padding: '12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{pInfo?.icon || ''}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: pInfo?.accent || pInfo?.color || 'var(--text-secondary)',
                      fontFamily: "'Sora', sans-serif",
                    }}
                  >
                    {pInfo?.name || gp.platform}
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      color: isOverLimit ? '#ef4444' : 'var(--text-disabled)',
                      fontFamily: "'IBM Plex Mono', monospace",
                      marginLeft: 'auto',
                    }}
                  >
                    {gp.content.length}/{maxChars}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    fontFamily: "'IBM Plex Mono', monospace",
                    whiteSpace: 'pre-wrap',
                    marginBottom: '6px',
                    maxHeight: '120px',
                    overflowY: 'auto',
                  }}
                >
                  {gp.content}
                </div>

                {gp.hashtags.length > 0 && (
                  <div
                    style={{
                      fontSize: '10px',
                      color: pInfo?.accent || '#8b5cf6',
                      marginBottom: '6px',
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    {gp.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}
                  </div>
                )}

                <div
                  style={{
                    fontSize: '9px',
                    color: 'var(--text-disabled)',
                    fontStyle: 'italic',
                    marginBottom: '8px',
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  {gp.tip}
                </div>

                <button
                  onClick={() => {
                    const fullContent = gp.hashtags.length
                      ? `${gp.content}\n\n${gp.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}`
                      : gp.content;
                    onUsePost(fullContent, pInfo?.id);
                    toast.success(`${pInfo?.name || gp.platform} post loaded`);
                  }}
                  style={{
                    width: '100%',
                    padding: '6px',
                    background: `linear-gradient(135deg, ${(pInfo?.accent || pInfo?.color || '#8b5cf6')}22, ${(pInfo?.accent || pInfo?.color || '#8b5cf6')}11)`,
                    border: `1px solid ${(pInfo?.accent || pInfo?.color || '#8b5cf6')}44`,
                    borderRadius: '8px',
                    color: pInfo?.accent || pInfo?.color || '#8b5cf6',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: "'Sora', sans-serif",
                    transition: 'all 0.15s ease',
                  }}
                >
                  Use just this post
                </button>
              </div>
            );
          })}

          <button
            onClick={() => setStep('results')}
            style={{
              width: '100%',
              padding: '8px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Sora', sans-serif",
            }}
          >
            {'\u{2190}'} Back to ideas
          </button>
        </div>
      )}
    </div>
  );
}

interface QueueItem {
  platforms: PlatformId[];
  content: string;
  status: 'sent' | 'scheduled';
  time: string;
}

function PostQueue({ queue }: { queue: QueueItem[] }) {
  if (!queue.length) return null;
  return (
    <div
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '16px',
      }}
    >
      <div
        style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--text-tertiary)',
          fontFamily: "'Sora', sans-serif",
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span>{'\u{1F4CB}'}</span> Queue ({queue.length})
      </div>
      {queue.map((item, i) => (
        <div
          key={i}
          style={{
            padding: '10px 14px',
            marginBottom: '8px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', gap: '4px' }}>
            {item.platforms.map((p) => {
              const platform = PLATFORMS.find((pl) => pl.id === p);
              return (
                <span
                  key={p}
                  style={{
                    fontSize: '11px',
                    color: platform?.color,
                  }}
                >
                  {platform?.icon}
                </span>
              );
            })}
          </div>
          <div
            style={{
              flex: 1,
              fontSize: '11px',
              color: 'var(--text-tertiary)',
              fontFamily: "'IBM Plex Mono', monospace",
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.content.substring(0, 60)}...
          </div>
          <span
            style={{
              fontSize: '9px',
              padding: '2px 8px',
              borderRadius: '20px',
              background:
                item.status === 'sent'
                  ? 'rgba(34,197,94,0.1)'
                  : 'rgba(255,170,0,0.1)',
              color: item.status === 'sent' ? '#22c55e' : '#ffaa00',
              fontWeight: 600,
            }}
          >
            {item.status === 'sent' ? '\u2713 Sent' : '\u23F3 Scheduled'}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SocialCommandCenter() {
  const [activePlatforms, setActivePlatforms] = useState<PlatformId[]>([]);
  const [content, setContent] = useState('');
  const [schedule, setSchedule] = useState<string>('Now');
  const [customScheduleDate, setCustomScheduleDate] = useState('');
  const [mediaFiles, setMediaFiles] = useState<UploadedFile[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [posting, setPosting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [platformOverrides, setPlatformOverrides] = useState<
    Partial<Record<PlatformId, string>>
  >({});

  const { data: connections } = useConnections();

  // Build a set of connected platform IDs for quick lookup
  const connectedPlatforms = useMemo<Set<PlatformId>>(() => {
    const set = new Set<PlatformId>();
    if (!connections) return set;
    const reverseMap: Record<string, PlatformId> = {
      FACEBOOK: 'facebook',
      INSTAGRAM: 'instagram',
      LINKEDIN: 'linkedin',
      X: 'x',
      TIKTOK: 'tiktok',
      YOUTUBE: 'youtube',
    };
    for (const c of connections) {
      if (c.isActive && reverseMap[c.platform]) {
        set.add(reverseMap[c.platform]);
      }
    }
    return set;
  }, [connections]);

  // Auto-select all connected platforms on first load
  useEffect(() => {
    if (connectedPlatforms.size > 0 && activePlatforms.length === 0) {
      setActivePlatforms(Array.from(connectedPlatforms));
    }
  }, [connectedPlatforms.size]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlatform = (id: PlatformId) => {
    if (!connectedPlatforms.has(id)) return; // Guard: can't toggle unconnected
    setActivePlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const createPost = useCreatePost();
  const mediaUpload = useMediaUpload();

  const PLATFORM_MAP: Record<PlatformId, string> = {
    facebook: 'FACEBOOK',
    instagram: 'INSTAGRAM',
    linkedin: 'LINKEDIN',
    x: 'X',
    tiktok: 'TIKTOK',
    youtube: 'YOUTUBE',
  };

  const handlePost = async () => {
    if (!content.trim() || !activePlatforms.length) return;

    // Check that all selected platforms are actually connected
    const unconnected = activePlatforms.filter((id) => !connectedPlatforms.has(id));
    if (unconnected.length > 0) {
      toast.error('Some selected platforms are not connected', {
        description: `Connect ${unconnected.join(', ')} in the Connections page first.`,
      });
      return;
    }

    if (connectedPlatforms.size === 0) {
      toast.error('No platforms connected', {
        description: 'Go to the Connections page to link your accounts.',
      });
      return;
    }

    // Instagram requires at least one image/video
    if (activePlatforms.includes('instagram') && mediaFiles.length === 0) {
      toast.error('Instagram requires an image or video', {
        description: 'Attach media or deselect Instagram for text-only posts.',
      });
      return;
    }

    setPosting(true);

    try {
      // Upload any pending media files first
      const mediaIds: string[] = [];
      for (let i = 0; i < mediaFiles.length; i++) {
        const f = mediaFiles[i];
        if (!f.id && f.file) {
          try {
            const id = await mediaUpload.mutateAsync({ file: f.file, index: i });
            mediaIds.push(id);
          } catch {
            // Continue even if upload fails
          }
        } else if (f.id) {
          mediaIds.push(f.id);
        }
      }

      // Map schedule option to schedule type
      const scheduleType = schedule === 'Now' ? 'IMMEDIATE' : 'SCHEDULED';
      let scheduledAt: string | undefined;
      if (schedule === 'Custom' && customScheduleDate) {
        scheduledAt = new Date(customScheduleDate).toISOString();
      } else if (schedule === 'Tomorrow 9AM') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        scheduledAt = tomorrow.toISOString();
      } else if (schedule !== 'Now') {
        const delayMap: Record<string, number> = {
          '1h': 60 * 60 * 1000,
          '3h': 3 * 60 * 60 * 1000,
          '6h': 6 * 60 * 60 * 1000,
          '12h': 12 * 60 * 60 * 1000,
        };
        const delay = delayMap[schedule];
        if (delay) {
          scheduledAt = new Date(Date.now() + delay).toISOString();
        }
      }

      // Build platform overrides (convert to uppercase keys)
      const overrides: Record<string, string> = {};
      for (const [key, val] of Object.entries(platformOverrides)) {
        if (val?.trim()) {
          overrides[PLATFORM_MAP[key as PlatformId] || key] = val;
        }
      }

      await createPost.mutateAsync({
        content: content.trim(),
        platforms: activePlatforms.map((id) => PLATFORM_MAP[id]),
        platformOverrides: Object.keys(overrides).length > 0 ? overrides : undefined,
        scheduleType,
        scheduledAt,
        mediaAssetIds: mediaIds.length > 0 ? mediaIds : undefined,
      });

      const newItem: QueueItem = {
        platforms: [...activePlatforms],
        content: content.trim(),
        status: schedule === 'Now' ? 'sent' : 'scheduled',
        time: new Date().toISOString(),
      };
      setQueue((prev) => [newItem, ...prev]);

      setPosting(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setContent('');
      setMediaFiles([]);
      setPlatformOverrides({});
      toast.success('Transmission sent!', {
        description: `Posted to ${activePlatforms.length} platforms`,
      });
    } catch (error) {
      setPosting(false);
      toast.error('Failed to create post', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: "'Sora', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-30px) translateX(15px); }
          50% { transform: translateY(-10px) translateX(-10px); }
          75% { transform: translateY(-40px) translateX(5px); }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }

        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes success-pop {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <ParticleField />

      {/* Success Toast */}
      {showSuccess && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 100,
            padding: '16px 24px',
            borderRadius: '14px',
            background: 'rgba(34,197,94,0.15)',
            border: '1px solid rgba(34,197,94,0.3)',
            backdropFilter: 'blur(20px)',
            animation: 'success-pop 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '20px' }}>{'\u26A1'}</span>
          <div>
            <div
              style={{ fontSize: '13px', fontWeight: 700, color: '#22c55e' }}
            >
              Transmission Sent!
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
              Posted to {activePlatforms.length} platforms
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <Header />

      {/* Main Grid */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: '280px 1fr 300px',
          gap: '0',
          minHeight: 'calc(100vh - 91px)',
        }}
      >
        {/* LEFT: Platform Selector */}
        <div
          style={{
            padding: '24px',
            borderRight: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '16px',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            Broadcast To
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {PLATFORMS.map((p) => (
              <PlatformToggle
                key={p.id}
                platform={p}
                active={activePlatforms.includes(p.id)}
                connected={connectedPlatforms.has(p.id)}
                onClick={() => togglePlatform(p.id)}
              />
            ))}
          </div>

          <button
            onClick={() => {
              const connected = PLATFORMS.filter((p) => connectedPlatforms.has(p.id)).map((p) => p.id);
              if (connected.length === 0) {
                toast.error('No platforms connected', {
                  description: 'Go to the Connections page to link your accounts.',
                });
                return;
              }
              setActivePlatforms(connected);
            }}
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '10px',
              background:
                connectedPlatforms.size > 0
                  ? 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.08))'
                  : 'var(--bg-tertiary)',
              border: `1px solid ${connectedPlatforms.size > 0 ? 'rgba(139,92,246,0.15)' : 'var(--bg-hover)'}`,
              borderRadius: '10px',
              cursor: connectedPlatforms.size > 0 ? 'pointer' : 'not-allowed',
              color: connectedPlatforms.size > 0 ? '#a78bfa' : 'var(--text-disabled)',
              fontSize: '11px',
              fontWeight: 700,
              transition: 'all 0.2s ease',
            }}
          >
            {'\u26A1'} Select All Connected ({connectedPlatforms.size})
          </button>

          <button
            onClick={() => setActivePlatforms([])}
            style={{
              width: '100%',
              marginTop: '6px',
              padding: '10px',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              cursor: 'pointer',
              color: 'var(--text-disabled)',
              fontSize: '11px',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
          >
            Clear Selection
          </button>
        </div>

        {/* CENTER: Compose Area */}
        <div
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Active Platform Tags */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              minHeight: '28px',
            }}
          >
            {activePlatforms.map((id) => {
              const p = PLATFORMS.find((pl) => pl.id === id)!;
              return (
                <span
                  key={id}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: p.bg,
                    border: `1px solid ${p.border}`,
                    fontSize: '11px',
                    fontWeight: 600,
                    color: p.accent || p.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {p.icon} {p.name}
                </span>
              );
            })}
            {!activePlatforms.length && (
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--text-disabled)',
                  fontStyle: 'italic',
                }}
              >
                {connectedPlatforms.size === 0
                  ? 'Connect accounts in the Connections page to start broadcasting'
                  : 'Select platforms to broadcast to \u2190'}
              </span>
            )}
          </div>

          {/* Main Text Editor */}
          <div
            style={{
              flex: 1,
              minHeight: '300px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What's the transmission? Drop your content here...\n\nWrite once \u2192 broadcast everywhere \u26A1`}
              style={{
                flex: 1,
                width: '100%',
                resize: 'none',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '15px',
                lineHeight: 1.7,
                fontFamily: "'Sora', sans-serif",
                fontWeight: 400,
                letterSpacing: '0.01em',
              }}
            />

            {/* Character counters per platform */}
            <div
              style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              {activePlatforms.map((id) => {
                const p = PLATFORMS.find((pl) => pl.id === id)!;
                return (
                  <div
                    key={id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        color: p.accent || p.color,
                      }}
                    >
                      {p.icon}
                    </span>
                    <CharCounter
                      current={content.length}
                      max={p.maxChars}
                      color={p.accent || p.color}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Media Upload */}
          <MediaUploadZone
            files={mediaFiles}
            onAdd={(newFiles) =>
              setMediaFiles((prev) => [...prev, ...newFiles])
            }
            onRemove={(idx) =>
              setMediaFiles((prev) => prev.filter((_, i) => i !== idx))
            }
          />

          {/* Schedule + Post */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '4px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '4px',
              }}
            >
              {SCHEDULE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSchedule(opt)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background:
                      schedule === opt
                        ? 'var(--bg-active)'
                        : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: schedule === opt ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>

            {schedule === 'Custom' && (
              <input
                type="datetime-local"
                value={customScheduleDate}
                onChange={(e) => setCustomScheduleDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontFamily: "'Sora', sans-serif",
                  outline: 'none',
                }}
              />
            )}

            <button
              onClick={handlePost}
              disabled={
                posting || !content.trim() || !activePlatforms.length
              }
              style={{
                marginLeft: 'auto',
                padding: '14px 32px',
                background: posting
                  ? 'rgba(139,92,246,0.15)'
                  : 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                border: 'none',
                borderRadius: '14px',
                cursor: posting ? 'wait' : 'pointer',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.02em',
                boxShadow: posting
                  ? 'none'
                  : '0 4px 20px rgba(139,92,246,0.3)',
                transition:
                  'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                transform: posting ? 'scale(0.98)' : 'scale(1)',
                opacity:
                  !content.trim() || !activePlatforms.length ? 0.3 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {posting ? (
                <>{'\u26A1'} Broadcasting...</>
              ) : (
                <>
                  {schedule === 'Now'
                    ? `\u26A1 Broadcast Now`
                    : `\u{1F4C5} Schedule ${schedule}`}
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT: AI + Queue */}
        <div
          style={{
            padding: '24px',
            borderLeft: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto',
          }}
        >
          <BrainstormPanel
            activePlatforms={activePlatforms}
            connectedPlatforms={connectedPlatforms}
            onUsePost={(text, platform) => {
              setContent(text);
              if (platform && connectedPlatforms.has(platform) && !activePlatforms.includes(platform)) {
                setActivePlatforms((prev) => [...prev, platform]);
              }
            }}
            onLoadAllPosts={(mainContent, overrides, platforms) => {
              setContent(mainContent);
              setPlatformOverrides(overrides);
              setActivePlatforms(platforms);
            }}
          />

          <AIEnhancePanel
            content={content}
            onApply={(text) => setContent(text)}
          />

          {/* Platform-specific overrides */}
          <div
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '16px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: '12px',
                fontFamily: "'IBM Plex Mono', monospace",
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>{'\u{1F3AF}'}</span> Platform Overrides
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-disabled)',
                lineHeight: 1.6,
              }}
            >
              Customize content per platform. Each platform will use the
              main content unless overridden.
            </div>
            {activePlatforms.map((id) => {
              const p = PLATFORMS.find((pl) => pl.id === id)!;
              return (
                <div key={id} style={{ marginTop: '10px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: p.accent || p.color,
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {p.icon} {p.name}
                  </div>
                  <textarea
                    placeholder={`Override for ${p.name}...`}
                    value={platformOverrides[id] || ''}
                    onChange={(e) =>
                      setPlatformOverrides((prev) => ({
                        ...prev,
                        [id]: e.target.value,
                      }))
                    }
                    style={{
                      width: '100%',
                      height: '50px',
                      resize: 'none',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '8px',
                      color: 'var(--text-secondary)',
                      fontSize: '11px',
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  />
                </div>
              );
            })}
          </div>

          <PostQueue queue={queue} />

          {/* Quick hashtag suggestions */}
          <div
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '16px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: '10px',
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              # Quick Tags
            </div>
            <div
              style={{
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap',
              }}
            >
              {[
                '#HwinNwin',
                '#Protocol69',
                '#TheAlliance',
                '#ConsciousTech',
                '#LumenSystems',
                '#VybeSystems',
                '#EmperorMode',
                '#Frequency',
                '#NeverTake',
              ].map((tag) => (
                <button
                  key={tag}
                  onClick={() =>
                    setContent((prev) => prev + ' ' + tag)
                  }
                  style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-tertiary)',
                    fontSize: '10px',
                    cursor: 'pointer',
                    fontFamily: "'IBM Plex Mono', monospace",
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.color = '#a78bfa';
                    target.style.borderColor = 'rgba(139,92,246,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.color = 'var(--text-tertiary)';
                    target.style.borderColor = 'var(--border-color)';
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
