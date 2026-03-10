import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Rocket,
  ArrowLeft,
  Loader2,
  Check,
  Trash2,
  RefreshCw,
  Calendar,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  AlertTriangle,
} from 'lucide-react';
import Header from '../components/layout/Header';
import TierGate from '../components/ui/TierGate';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useCampaignStore } from '../store/campaign-store';
import type { CampaignStep } from '../store/campaign-store';
import { useCampaignPlan, useCampaignBatch, useBulkCreatePosts } from '../hooks/useCampaign';
import { useCreditBalance, useInvalidateCredits } from '../hooks/useCredits';

const PLATFORMS = [
  { id: 'x', label: 'X (Twitter)' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
];

const TONES = ['professional', 'casual', 'inspirational', 'humorous', 'storytelling', 'emperor-mode'];

const PLATFORM_CHAR_LIMITS: Record<string, number> = {
  x: 280,
  instagram: 2200,
  linkedin: 3000,
  facebook: 63206,
  tiktok: 2200,
  youtube: 5000,
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  'text-post': 'Text Post',
  'carousel-concept': 'Carousel',
  'quote-card-idea': 'Quote Card',
  'video-hook': 'Video Hook',
  thread: 'Thread',
};

const STEPS: { key: CampaignStep; label: string }[] = [
  { key: 'configure', label: 'Configure' },
  { key: 'review-plan', label: 'Review Plan' },
  { key: 'edit-posts', label: 'Edit Posts' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'success', label: 'Done' },
];

const BATCH_SIZE = 3;

export default function CampaignPage() {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const store = useCampaignStore();
  const planMutation = useCampaignPlan();
  const batchMutation = useCampaignBatch();
  const bulkCreateMutation = useBulkCreatePosts();
  const { data: creditData } = useCreditBalance();
  const invalidateCredits = useInvalidateCredits();

  const [editingOutline, setEditingOutline] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [expandedPost, setExpandedPost] = useState<number | null>(null);

  // ─── Styles ────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: isMobile ? '16px' : '24px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    fontFamily: "'Sora', sans-serif",
  };

  const btnPrimary: React.CSSProperties = {
    padding: '12px 24px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
    color: '#fff',
    border: 'none',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: "'Sora', sans-serif",
  };

  const btnSecondary: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: '10px',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    fontWeight: 500,
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: "'Sora', sans-serif",
  };

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: '20px',
    border: active ? '2px solid #8b5cf6' : '1px solid var(--border-color)',
    background: active ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-tertiary)',
    color: active ? '#8b5cf6' : 'var(--text-secondary)',
    fontWeight: active ? 600 : 400,
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: "'Sora', sans-serif",
  });

  // ─── Handlers ──────────────────────────────────────────

  const handleGeneratePlan = useCallback(async () => {
    if (!store.topic.trim()) { toast.error('Enter a topic'); return; }
    if (!store.platforms.length) { toast.error('Select at least one platform'); return; }

    store.setIsPlanning(true);
    try {
      const result = await planMutation.mutateAsync({
        topic: store.topic,
        platforms: store.platforms,
        tone: store.tone,
        audience: store.audience || undefined,
        brandGuidance: store.brandGuidance || undefined,
        postCount: store.postCount,
      });
      store.setPlanResult(result);
      invalidateCredits();
      toast.success(`Campaign planned: "${result.campaignTheme}"`);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to generate plan';
      if (err?.response?.status === 402) {
        toast.error(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      store.setIsPlanning(false);
    }
  }, [store, planMutation, invalidateCredits]);

  const handleGenerateAllContent = useCallback(async () => {
    const outlines = store.outlines;
    if (!outlines.length) return;

    const totalBatches = Math.ceil(outlines.length / BATCH_SIZE);
    store.setIsGenerating(true);
    store.setGenerationProgress({ completed: 0, total: totalBatches });
    store.clearFailedBatches();
    store.setStep('edit-posts');

    for (let i = 0; i < totalBatches; i++) {
      // Wait 3s between batches to avoid Anthropic rate limits (skip first)
      if (i > 0) await new Promise((r) => setTimeout(r, 3000));

      const batch = outlines.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
      try {
        const result = await batchMutation.mutateAsync({
          topic: store.topic,
          tone: store.tone,
          audience: store.audience || undefined,
          brandGuidance: store.brandGuidance || undefined,
          outlines: batch,
        });
        store.addGeneratedPosts(result.posts);
        store.setGenerationProgress({ completed: i + 1, total: totalBatches });
        invalidateCredits();
      } catch (err: any) {
        const detail = err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Unknown error';
        const code = err?.response?.data?.code || 'UNKNOWN';
        const status = err?.response?.status || 0;
        console.error(`[Campaign] Batch ${i + 1}/${totalBatches} FAILED: status=${status} code=${code} detail=${detail}`);
        toast.error(`Batch ${i + 1} failed: ${code}`);
        store.addFailedBatch(i);
        store.setGenerationProgress({ completed: i + 1, total: totalBatches });
        // Wait longer on rate limit or overload
        if (status === 429 || status === 503 || status === 529) {
          await new Promise((r) => setTimeout(r, 10000));
        }
      }
    }

    store.setIsGenerating(false);
  }, [store, batchMutation, invalidateCredits]);

  const handleRetryFailed = useCallback(async () => {
    const outlines = store.outlines;
    const failed = store.failedBatches;
    if (!failed.length) return;

    store.setIsGenerating(true);
    const newFailed: number[] = [];

    for (let j = 0; j < failed.length; j++) {
      // Wait 3s between retries (skip first)
      if (j > 0) await new Promise((r) => setTimeout(r, 3000));

      const batchIndex = failed[j];
      const batch = outlines.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE);
      try {
        const result = await batchMutation.mutateAsync({
          topic: store.topic,
          tone: store.tone,
          audience: store.audience || undefined,
          brandGuidance: store.brandGuidance || undefined,
          outlines: batch,
        });
        store.addGeneratedPosts(result.posts);
        invalidateCredits();
      } catch {
        newFailed.push(batchIndex);
      }
    }

    store.clearFailedBatches();
    newFailed.forEach((i) => store.addFailedBatch(i));
    store.setIsGenerating(false);
  }, [store, batchMutation, invalidateCredits]);

  const handleSendToQueue = useCallback(async () => {
    const selectedPosts = store.generatedPosts.filter((p) =>
      store.selectedPostNumbers.has(p.postNumber),
    );
    if (!selectedPosts.length) { toast.error('Select at least one post'); return; }

    const now = new Date();
    const startDate = store.scheduleStartDate ? new Date(store.scheduleStartDate) : now;

    const posts = selectedPosts.map((p, i) => {
      let scheduledAt: string | undefined;
      let scheduleType = 'DRAFT';

      if (store.scheduleMode === 'immediate') {
        scheduleType = 'IMMEDIATE';
      } else if (store.scheduleMode === 'even-spacing') {
        scheduleType = 'SCHEDULED';
        const offset = i * store.scheduleIntervalHours * 60 * 60 * 1000;
        scheduledAt = new Date(startDate.getTime() + offset).toISOString();
      }

      return {
        content: p.content,
        platforms: [p.platform],
        scheduleType,
        scheduledAt,
        tags: ['campaign', store.campaignTheme],
      };
    });

    try {
      const result = await bulkCreateMutation.mutateAsync({
        requestId: store.requestId,
        posts,
      });
      store.setQueuedPostCount(result.meta.succeeded);
      store.setStep('success');
      invalidateCredits();
      toast.success(`${result.meta.succeeded} posts sent to queue!`);
    } catch (err: any) {
      const code = err?.response?.data?.code;
      if (code === 'DUPLICATE_REQUEST') {
        toast.error('These posts have already been created.');
      } else {
        toast.error(err?.response?.data?.error || 'Failed to create posts');
      }
    }
  }, [store, bulkCreateMutation, invalidateCredits]);

  // ─── Step indicator ────────────────────────────────────
  const stepIndex = STEPS.findIndex((s) => s.key === store.step);

  const renderStepIndicator = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '4px' : '8px',
      marginBottom: '24px',
      flexWrap: 'wrap',
    }}>
      {STEPS.map((s, i) => {
        const isActive = i === stepIndex;
        const isDone = i < stepIndex;
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 600,
              background: isDone ? '#22c55e' : isActive ? '#8b5cf6' : 'var(--bg-tertiary)',
              color: isDone || isActive ? '#fff' : 'var(--text-muted)',
              border: isActive ? '2px solid #8b5cf6' : '1px solid var(--border-color)',
            }}>
              {isDone ? <Check size={14} /> : i + 1}
            </div>
            {!isMobile && (
              <span style={{
                fontSize: '12px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              }}>
                {s.label}
              </span>
            )}
            {i < STEPS.length - 1 && (
              <div style={{
                width: isMobile ? '12px' : '24px',
                height: '2px',
                background: isDone ? '#22c55e' : 'var(--border-color)',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );

  // ─── Step 1: Configure ─────────────────────────────────
  const renderConfigure = () => (
    <div style={{ ...cardStyle, maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>Topic / Idea</label>
        <textarea
          value={store.topic}
          onChange={(e) => store.setTopic(e.target.value)}
          placeholder="e.g. AI automation for dentists, productivity tips for remote workers..."
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>Platforms</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {PLATFORMS.map((p) => {
            const active = store.platforms.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => {
                  if (active) store.setPlatforms(store.platforms.filter((x) => x !== p.id));
                  else store.setPlatforms([...store.platforms, p.id]);
                }}
                style={pillStyle(active)}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div>
          <label style={labelStyle}>Tone</label>
          <select
            value={store.tone}
            onChange={(e) => store.setTone(e.target.value)}
            style={inputStyle}
          >
            {TONES.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Post Count ({store.postCount})</label>
          <input
            type="range"
            min={5}
            max={30}
            value={store.postCount}
            onChange={(e) => store.setPostCount(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#8b5cf6', marginTop: '8px' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>5</span>
            <span>30</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>Target Audience (optional)</label>
        <input
          value={store.audience}
          onChange={(e) => store.setAudience(e.target.value)}
          placeholder="e.g. SaaS founders, dental practice owners..."
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>Brand Voice Guidance (optional)</label>
        <textarea
          value={store.brandGuidance}
          onChange={(e) => store.setBrandGuidance(e.target.value)}
          placeholder="e.g. Speak as a thought leader, use first person, avoid jargon..."
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {creditData && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Campaign cost: ~{15 + Math.ceil(store.postCount / BATCH_SIZE) * 10} credits
          {' '}({creditData.balance} available)
        </div>
      )}

      <button
        onClick={handleGeneratePlan}
        disabled={store.isPlanning || !store.topic.trim() || !store.platforms.length}
        style={{ ...btnPrimary, opacity: store.isPlanning ? 0.7 : 1, width: '100%', justifyContent: 'center' }}
      >
        {store.isPlanning ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
        {store.isPlanning ? 'Planning Campaign...' : 'Generate Campaign Plan'}
      </button>
    </div>
  );

  // ─── Step 2: Review Plan ───────────────────────────────
  const renderReviewPlan = () => (
    <div>
      {/* Campaign summary */}
      <div style={{ ...cardStyle, marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{store.campaignTheme}</h3>
          <span style={{
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 600,
            background: 'rgba(139, 92, 246, 0.1)',
            color: '#8b5cf6',
          }}>
            {store.outlines.length} posts
          </span>
        </div>

        {store.contentPillars.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Content Pillars: </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {store.contentPillars.join(' · ')}
            </span>
          </div>
        )}

        {Object.keys(store.platformMix).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(store.platformMix).map(([platform, count]) => (
              <span key={platform} style={{
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
              }}>
                {platform}: {count}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Outline grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '12px',
        marginBottom: '24px',
      }}>
        {store.outlines.map((outline) => (
          <div key={outline.postNumber} style={{
            ...cardStyle,
            padding: '16px',
            position: 'relative',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'rgba(139, 92, 246, 0.1)',
                  color: '#8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {outline.postNumber}
                </span>
                {editingOutline === outline.postNumber ? (
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => {
                      store.updateOutlineTitle(outline.postNumber, editTitle);
                      setEditingOutline(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        store.updateOutlineTitle(outline.postNumber, editTitle);
                        setEditingOutline(null);
                      }
                    }}
                    autoFocus
                    style={{ ...inputStyle, padding: '4px 8px', fontSize: '13px' }}
                  />
                ) : (
                  <span
                    style={{ fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => { setEditingOutline(outline.postNumber); setEditTitle(outline.title); }}
                  >
                    {outline.title}
                  </span>
                )}
              </div>
              <button
                onClick={() => store.removeOutline(outline.postNumber)}
                style={{ ...btnSecondary, padding: '4px', border: 'none', background: 'none' }}
                title="Remove"
              >
                <Trash2 size={14} color="var(--accent-red)" />
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              <span style={{
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: 600,
                background: 'rgba(6, 182, 212, 0.1)',
                color: '#06b6d4',
              }}>
                {outline.targetPlatform}
              </span>
              <span style={{
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-muted)',
              }}>
                {CONTENT_TYPE_LABELS[outline.contentType] || outline.contentType}
              </span>
              <span style={{
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-muted)',
              }}>
                {outline.angle}
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.4 }}>
              {outline.briefDescription}
            </p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button onClick={() => store.setStep('configure')} style={btnSecondary}>
          <ArrowLeft size={14} /> Back
        </button>
        <button
          onClick={handleGenerateAllContent}
          disabled={!store.outlines.length}
          style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }}
        >
          <Sparkles size={16} /> Generate All Content ({store.outlines.length} posts)
        </button>
      </div>
    </div>
  );

  // ─── Step 3: Edit Posts ────────────────────────────────
  const renderEditPosts = () => {
    const { completed, total } = store.generationProgress;
    const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
      <div>
        {/* Progress bar */}
        {store.isGenerating && (
          <div style={{ ...cardStyle, marginBottom: '20px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Loader2 size={16} className="animate-spin" style={{ color: '#8b5cf6' }} />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>
                Generating content... batch {completed}/{total}
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: 'var(--bg-tertiary)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${progressPct}%`,
                height: '100%',
                borderRadius: '3px',
                background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        {/* Failed batch retry */}
        {!store.isGenerating && store.failedBatches.length > 0 && (
          <div style={{
            ...cardStyle,
            marginBottom: '20px',
            padding: '16px',
            borderColor: 'rgba(245, 158, 11, 0.3)',
            background: 'rgba(245, 158, 11, 0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                  {store.failedBatches.length} batch{store.failedBatches.length > 1 ? 'es' : ''} failed
                </span>
              </div>
              <button onClick={handleRetryFailed} style={btnSecondary}>
                <RefreshCw size={14} /> Retry Failed
              </button>
            </div>
          </div>
        )}

        {/* Selection controls */}
        {store.generatedPosts.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {store.selectedPostNumbers.size} of {store.generatedPosts.length} selected
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => store.selectAllPosts()} style={{ ...btnSecondary, padding: '6px 12px' }}>
                <CheckSquare size={14} /> All
              </button>
              <button onClick={() => store.deselectAllPosts()} style={{ ...btnSecondary, padding: '6px 12px' }}>
                <Square size={14} /> None
              </button>
            </div>
          </div>
        )}

        {/* Post list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {store.generatedPosts.map((post) => {
            const isSelected = store.selectedPostNumbers.has(post.postNumber);
            const limit = PLATFORM_CHAR_LIMITS[post.platform.toLowerCase()] || 3000;
            const charPct = post.charCount / limit;
            const isExpanded = expandedPost === post.postNumber;

            return (
              <div key={post.postNumber} style={{
                ...cardStyle,
                padding: '16px',
                borderColor: isSelected ? 'rgba(139, 92, 246, 0.3)' : 'var(--border-color)',
                opacity: isSelected ? 1 : 0.6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <button
                    onClick={() => store.togglePostSelection(post.postNumber)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    {isSelected
                      ? <CheckSquare size={18} style={{ color: '#8b5cf6' }} />
                      : <Square size={18} style={{ color: 'var(--text-muted)' }} />
                    }
                  </button>
                  <span style={{ fontSize: '13px', fontWeight: 600, flex: 1 }}>
                    #{post.postNumber} · {post.platform}
                  </span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-muted)',
                  }}>
                    {post.angle}
                  </span>
                  {/* Char count */}
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: charPct > 1 ? '#ef4444' : charPct > 0.8 ? '#f59e0b' : 'var(--text-muted)',
                  }}>
                    {post.charCount}/{limit}
                  </span>
                  <button
                    onClick={() => setExpandedPost(isExpanded ? null : post.postNumber)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {isExpanded ? (
                  <div>
                    <textarea
                      value={post.content}
                      onChange={(e) => store.updatePostContent(post.postNumber, e.target.value)}
                      rows={8}
                      style={{ ...inputStyle, resize: 'vertical', fontSize: '13px', lineHeight: 1.5 }}
                    />
                    {post.hashtags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                        {post.hashtags.map((tag) => (
                          <span key={tag} style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            background: 'rgba(139, 92, 246, 0.08)',
                            color: '#8b5cf6',
                          }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {post.tip && (
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
                        Tip: {post.tip}
                      </p>
                    )}
                  </div>
                ) : (
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    margin: 0,
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {post.content}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        {!store.isGenerating && store.generatedPosts.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => store.setStep('review-plan')} style={btnSecondary}>
              <ArrowLeft size={14} /> Back to Plan
            </button>
            <button
              onClick={() => store.setStep('schedule')}
              disabled={store.selectedPostNumbers.size === 0}
              style={{ ...btnPrimary, flex: 1, justifyContent: 'center', opacity: store.selectedPostNumbers.size === 0 ? 0.5 : 1 }}
            >
              <Calendar size={16} /> Schedule {store.selectedPostNumbers.size} Posts
            </button>
          </div>
        )}
      </div>
    );
  };

  // ─── Step 4: Schedule ──────────────────────────────────
  const renderSchedule = () => {
    const selectedCount = store.selectedPostNumbers.size;

    return (
      <div style={{ ...cardStyle, maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700 }}>
          Schedule {selectedCount} Posts
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {([
            { mode: 'all-drafts', label: 'Save as Drafts', desc: 'Review and publish manually later' },
            { mode: 'even-spacing', label: 'Even Spacing', desc: 'Auto-schedule at regular intervals' },
            { mode: 'immediate', label: 'Publish Immediately', desc: 'Send all posts to queue now' },
          ] as const).map(({ mode, label, desc }) => (
            <button
              key={mode}
              onClick={() => store.setScheduleMode(mode)}
              style={{
                ...cardStyle,
                padding: '16px',
                textAlign: 'left',
                cursor: 'pointer',
                borderColor: store.scheduleMode === mode ? '#8b5cf6' : 'var(--border-color)',
                background: store.scheduleMode === mode ? 'rgba(139, 92, 246, 0.05)' : 'var(--bg-secondary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: store.scheduleMode === mode ? '5px solid #8b5cf6' : '2px solid var(--border-color)',
                  flexShrink: 0,
                }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Even spacing options */}
        {store.scheduleMode === 'even-spacing' && (
          <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '10px', marginBottom: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Start Date & Time</label>
              <input
                type="datetime-local"
                value={store.scheduleStartDate}
                onChange={(e) => store.setScheduleStartDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Interval</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { hours: 12, label: '2x/day' },
                  { hours: 24, label: '1x/day' },
                  { hours: 48, label: 'Every 2 days' },
                ].map(({ hours, label }) => (
                  <button
                    key={hours}
                    onClick={() => store.setScheduleIntervalHours(hours)}
                    style={pillStyle(store.scheduleIntervalHours === hours)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {store.scheduleStartDate && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
                Last post will be scheduled for{' '}
                {new Date(
                  new Date(store.scheduleStartDate).getTime() +
                  (selectedCount - 1) * store.scheduleIntervalHours * 3600000,
                ).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={() => store.setStep('edit-posts')} style={btnSecondary}>
            <ArrowLeft size={14} /> Back
          </button>
          <button
            onClick={handleSendToQueue}
            disabled={bulkCreateMutation.isPending || (store.scheduleMode === 'even-spacing' && !store.scheduleStartDate)}
            style={{ ...btnPrimary, flex: 1, justifyContent: 'center', opacity: bulkCreateMutation.isPending ? 0.7 : 1 }}
          >
            {bulkCreateMutation.isPending
              ? <Loader2 size={16} className="animate-spin" />
              : <Send size={16} />
            }
            {bulkCreateMutation.isPending ? 'Sending...' : `Send ${selectedCount} Posts to Queue`}
          </button>
        </div>
      </div>
    );
  };

  // ─── Step 5: Success ───────────────────────────────────
  const renderSuccess = () => (
    <div style={{
      ...cardStyle,
      maxWidth: '500px',
      margin: '0 auto',
      textAlign: 'center',
      padding: isMobile ? '32px 16px' : '48px 32px',
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'rgba(34, 197, 94, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <Check size={32} style={{ color: '#22c55e' }} />
      </div>

      <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 700 }}>
        Campaign Queued!
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 8px' }}>
        {store.queuedPostCount} posts sent to your queue
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 24px' }}>
        Campaign: "{store.campaignTheme}"
      </p>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/queue')} style={btnSecondary}>
          View Queue
        </button>
        <button onClick={() => store.reset()} style={btnPrimary}>
          <Rocket size={16} /> Start New Campaign
        </button>
      </div>
    </div>
  );

  // ─── Render ────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: "'Sora', sans-serif",
    }}>
      <Header />

      <TierGate requiredTier="PRO">
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '16px' : '32px' }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          {store.step !== 'configure' && store.step !== 'success' && (
            <button
              onClick={() => {
                const prev: Record<string, CampaignStep> = {
                  'review-plan': 'configure',
                  'edit-posts': 'review-plan',
                  schedule: 'edit-posts',
                };
                const target = prev[store.step];
                if (target) store.setStep(target);
              }}
              style={{
                padding: '8px',
                borderRadius: '10px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <Rocket size={24} style={{ color: '#8b5cf6' }} />
          <h1 style={{ margin: 0, fontSize: isMobile ? '18px' : '22px', fontWeight: 700 }}>
            Campaign Generator
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 24px' }}>
          Turn one idea into a month of content
        </p>

        {renderStepIndicator()}

        {store.step === 'configure' && renderConfigure()}
        {store.step === 'review-plan' && renderReviewPlan()}
        {store.step === 'edit-posts' && renderEditPosts()}
        {store.step === 'schedule' && renderSchedule()}
        {store.step === 'success' && renderSuccess()}
      </div>
      </TierGate>
    </div>
  );
}
