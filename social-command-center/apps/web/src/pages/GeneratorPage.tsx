import { useState } from 'react';
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
} from '../hooks/useGenerator';
import { useComposeStore } from '../store/compose-store';
import type { SlidePlan } from '../services/api';

const CONTENT_TYPES: { id: ContentType; label: string; desc: string; icon: typeof Layout }[] = [
  { id: 'carousel', label: 'Carousel', desc: 'Text overlay slides with styled backgrounds', icon: Layout },
  { id: 'quote-card', label: 'Quote Cards', desc: 'Beautiful quote images with author attribution', icon: Quote },
  { id: 'mixed-media', label: 'Mixed Media', desc: 'Photos + text slides for visual variety', icon: Image },
  { id: 'educational', label: 'Educational', desc: 'Numbered tips, steps, or facts', icon: BookOpen },
];

const TONES = [
  'professional',
  'casual',
  'inspirational',
  'humorous',
  'storytelling',
  'emperor-mode',
];

export default function GeneratorPage() {
  const navigate = useNavigate();
  const store = useGeneratorStore();
  const { data: capabilities } = useGeneratorCapabilities();
  const planMutation = useGeneratePlan();
  const slidesMutation = useGenerateSlides();
  const regenerateMutation = useRegenerateSlide();
  const quoteCardMutation = useGenerateQuoteCard();
  const composeStore = useComposeStore();

  // Quote card specific state
  const [quoteText, setQuoteText] = useState('');
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const [quoteResult, setQuoteResult] = useState<{ imageUrl: string; imageDataUrl: string } | null>(null);

  // Editing slide plan
  const [editingSlide, setEditingSlide] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editPrompt, setEditPrompt] = useState('');

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
      toast.success('Carousel generated!');
    } catch {
      toast.error('Failed to generate images');
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
      toast.success(`Slide ${slideNum} regenerated`);
    } catch {
      toast.error('Failed to regenerate slide');
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
      toast.success('Quote card generated!');
    } catch {
      toast.error('Failed to generate quote card');
    } finally {
      store.setIsGenerating(false);
    }
  };

  const handleLoadIntoComposer = () => {
    const caption = store.caption || quoteText;
    composeStore.setContent(caption + (store.hashtags.length ? '\n\n' + store.hashtags.map((h) => `#${h}`).join(' ') : ''));
    composeStore.setAllPlatforms(['instagram']);
    navigate('/');
    toast.success('Loaded into composer');
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
                if (store.step === 'preview') store.setStep('review');
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
          {(['configure', 'review', 'preview'] as const).map((s, i) => (
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

            {/* Quote Card mode */}
            {store.contentType === 'quote-card' ? (
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
                    onChange={(e) => store.setTopic(e.target.value)}
                    placeholder="What's your carousel about? e.g. '5 tips for building a personal brand on Instagram'"
                    rows={3}
                    style={inputStyle}
                  />
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
                        disabled={store.slideCount >= 10}
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

        {/* ═══════════ STEP 2: REVIEW PLAN ═══════════ */}
        {store.step === 'review' && store.plan && (
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
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#8b5cf6',
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}
                    >
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
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        style={{ ...inputStyle, fontSize: '13px', fontWeight: 700 }}
                        placeholder="Title"
                      />
                      <textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={2}
                        style={{ ...inputStyle, fontSize: '12px' }}
                        placeholder="Body text"
                      />
                      <textarea
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        rows={2}
                        style={{ ...inputStyle, fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace" }}
                        placeholder="Image prompt"
                      />
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          background: slide.backgroundColor,
                          color: slide.textColor,
                          marginBottom: '8px',
                          minHeight: '60px',
                        }}
                      >
                        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>{slide.title}</div>
                        {slide.body && <div style={{ fontSize: '11px', opacity: 0.85 }}>{slide.body}</div>}
                      </div>
                      <div
                        style={{
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          fontFamily: "'IBM Plex Mono', monospace",
                          lineHeight: 1.4,
                        }}
                      >
                        {slide.imagePrompt.length > 80
                          ? slide.imagePrompt.slice(0, 80) + '...'
                          : slide.imagePrompt}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleGenerateSlides}
              disabled={store.isGenerating}
              style={{
                ...primaryButtonStyle,
                opacity: store.isGenerating ? 0.5 : 1,
                padding: '14px 28px',
                fontSize: '14px',
              }}
            >
              {store.isGenerating ? (
                <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Generating {store.plan.slides.length} slides...</>
              ) : (
                <><Sparkles size={18} /> Generate Images</>
              )}
            </button>
          </div>
        )}

        {/* ═══════════ STEP 3: PREVIEW ═══════════ */}
        {store.step === 'preview' && store.slides && (
          <div style={{ display: 'grid', gap: '24px' }}>
            {/* Carousel Preview */}
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
              {/* Main slide view */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    position: 'relative',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <img
                    src={store.slides[store.currentSlide]?.imageDataUrl}
                    alt={`Slide ${store.currentSlide + 1}`}
                    style={{ width: '100%', display: 'block', borderRadius: '16px' }}
                  />

                  {/* Regenerate overlay */}
                  {store.regeneratingSlide === store.slides[store.currentSlide]?.slideNumber && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '16px',
                      }}
                    >
                      <Loader2 size={32} style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />
                    </div>
                  )}

                  {/* Navigation arrows */}
                  {store.slides.length > 1 && (
                    <>
                      <button
                        onClick={() => store.setCurrentSlide(Math.max(0, store.currentSlide - 1))}
                        disabled={store.currentSlide === 0}
                        style={{
                          ...navArrowStyle,
                          left: '12px',
                          opacity: store.currentSlide === 0 ? 0.3 : 1,
                        }}
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={() => store.setCurrentSlide(Math.min(store.slides!.length - 1, store.currentSlide + 1))}
                        disabled={store.currentSlide === store.slides.length - 1}
                        style={{
                          ...navArrowStyle,
                          right: '12px',
                          opacity: store.currentSlide === store.slides.length - 1 ? 0.3 : 1,
                        }}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}

                  {/* Dots */}
                  <div style={{ position: 'absolute', bottom: '12px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '6px' }}>
                    {store.slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => store.setCurrentSlide(i)}
                        style={{
                          width: i === store.currentSlide ? '20px' : '8px',
                          height: '8px',
                          borderRadius: '4px',
                          background: i === store.currentSlide ? '#fff' : 'rgba(255,255,255,0.4)',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          padding: 0,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Slide actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'center' }}>
                  <button
                    onClick={() => handleRegenerateSlide(store.slides![store.currentSlide].slideNumber)}
                    disabled={store.regeneratingSlide !== null}
                    style={secondaryButtonStyle}
                  >
                    <RotateCcw size={14} /> Regenerate
                  </button>
                </div>
              </div>

              {/* Slide thumbnails */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '120px', flexShrink: 0 }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  SLIDES
                </div>
                {store.slides.map((slide, i) => (
                  <button
                    key={slide.slideNumber}
                    onClick={() => store.setCurrentSlide(i)}
                    style={{
                      padding: 0,
                      border: `2px solid ${i === store.currentSlide ? '#8b5cf6' : 'var(--border-color)'}`,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: 'transparent',
                      opacity: i === store.currentSlide ? 1 : 0.6,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <img
                      src={slide.imageDataUrl}
                      alt={`Slide ${slide.slideNumber}`}
                      style={{ width: '100%', display: 'block' }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Caption & Hashtags */}
            <div style={cardStyle}>
              <label style={labelStyle}>Caption</label>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {store.caption}
              </div>
              {store.hashtags.length > 0 && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#8b5cf6' }}>
                  {store.hashtags.map((h) => `#${h}`).join(' ')}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleDownloadAll} style={secondaryButtonStyle}>
                <Download size={14} /> Download All
              </button>
              <button onClick={handleLoadIntoComposer} style={primaryButtonStyle}>
                <Send size={14} /> Load into Composer
              </button>
              <button
                onClick={() => {
                  store.reset();
                  setQuoteResult(null);
                }}
                style={secondaryButtonStyle}
              >
                <RotateCcw size={14} /> Start Over
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Spin animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Shared Styles ───────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'var(--text-muted)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontFamily: "'IBM Plex Mono', monospace",
  marginBottom: '8px',
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--bg-input)',
  border: '1px solid var(--border-color)',
  borderRadius: '10px',
  color: 'var(--text-primary)',
  fontSize: '13px',
  fontFamily: "'Sora', sans-serif",
  outline: 'none',
  resize: 'vertical',
  boxSizing: 'border-box',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-color)',
  borderRadius: '14px',
  padding: '20px',
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 24px',
  background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
  border: 'none',
  borderRadius: '10px',
  color: '#fff',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Sora', sans-serif",
  transition: 'all 0.2s ease',
};

const secondaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 16px',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-color)',
  borderRadius: '10px',
  color: 'var(--text-secondary)',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: "'Sora', sans-serif",
  textDecoration: 'none',
  transition: 'all 0.2s ease',
};

const counterButtonStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  fontSize: '16px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const iconBtnStyle: React.CSSProperties = {
  padding: '4px',
  borderRadius: '6px',
  background: 'transparent',
  border: '1px solid var(--border-color)',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const navArrowStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  background: 'rgba(0,0,0,0.5)',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'opacity 0.2s ease',
  padding: 0,
};
