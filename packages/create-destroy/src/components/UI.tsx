/**
 * UI Components for CREATE → DESTROY
 *
 * Minimal, clean interface following the L2P design philosophy.
 * "No FAIL states. Destruction is framed as a natural end."
 */

import React from 'react';
import {
  GameMode,
  PieceType,
  DestructionMethod,
  FailurePoint,
} from '../core/types';
import { PlaybackSpeed } from '../systems/ReplaySystem';

// ============================================================================
// Styles (inline for portability)
// ============================================================================

const styles = {
  container: {
    position: 'absolute' as const,
    inset: 0,
    pointerEvents: 'none' as const,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: '#ffffff',
  },
  topBar: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px 24px',
  },
  modeIndicator: {
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(10px)',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  stats: {
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(10px)',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '12px',
    display: 'flex',
    gap: '16px',
  },
  bottomBar: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
  },
  toolGroup: {
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(10px)',
    padding: '8px',
    borderRadius: '12px',
    display: 'flex',
    gap: '4px',
    pointerEvents: 'auto' as const,
  },
  button: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  buttonActive: {
    background: 'rgba(74, 144, 217, 0.8)',
  },
  buttonDestroy: {
    background: 'rgba(217, 74, 74, 0.8)',
  },
  buttonReset: {
    background: 'rgba(74, 217, 144, 0.3)',
  },
  divider: {
    width: '1px',
    background: 'rgba(255, 255, 255, 0.2)',
    margin: '4px 8px',
  },
  replayControls: {
    position: 'absolute' as const,
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(10px)',
    padding: '12px 20px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    minWidth: '300px',
    pointerEvents: 'auto' as const,
  },
  timeline: {
    width: '100%',
    height: '4px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '2px',
    cursor: 'pointer',
    position: 'relative' as const,
  },
  timelineProgress: {
    height: '100%',
    background: '#4A90D9',
    borderRadius: '2px',
    transition: 'width 0.05s linear',
  },
  timelineMarker: {
    position: 'absolute' as const,
    top: '-4px',
    width: '2px',
    height: '12px',
    background: '#FF4444',
    transform: 'translateX(-50%)',
  },
  playbackButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
  },
  l2pBadge: {
    position: 'absolute' as const,
    bottom: '16px',
    right: '24px',
    background: 'rgba(0, 0, 0, 0.4)',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '11px',
    opacity: 0.7,
    pointerEvents: 'auto' as const,
  },
  failureInfo: {
    background: 'rgba(255, 68, 68, 0.2)',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '11px',
    textAlign: 'center' as const,
  },
};

// ============================================================================
// Mode Indicator
// ============================================================================

interface ModeIndicatorProps {
  mode: GameMode;
  destructionProgress?: number;
}

const modeColors: Record<GameMode, string> = {
  build: '#4A90D9',
  simulate: '#D94A4A',
  replay: '#9B59B6',
};

const modeLabels: Record<GameMode, string> = {
  build: 'Create',
  simulate: 'Destroy',
  replay: 'Replay',
};

export const ModeIndicator: React.FC<ModeIndicatorProps> = ({ mode, destructionProgress }) => {
  return (
    <div
      style={{
        ...styles.modeIndicator,
        borderLeft: `3px solid ${modeColors[mode]}`,
      }}
    >
      {modeLabels[mode]}
      {mode === 'simulate' && destructionProgress !== undefined && (
        <span style={{ marginLeft: '8px', opacity: 0.7 }}>
          {Math.round(destructionProgress * 100)}%
        </span>
      )}
    </div>
  );
};

// ============================================================================
// Stats Display
// ============================================================================

interface StatsProps {
  pieceCount: number;
  fps: number;
  showFps?: boolean;
}

export const Stats: React.FC<StatsProps> = ({ pieceCount, fps, showFps = true }) => {
  return (
    <div style={styles.stats}>
      <span>Objects: {pieceCount}</span>
      {showFps && <span>FPS: {fps}</span>}
    </div>
  );
};

// ============================================================================
// Build Toolbar
// ============================================================================

interface BuildToolbarProps {
  selectedPieceType: PieceType;
  onSelectPieceType: (type: PieceType) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isGridSnapEnabled: boolean;
  onToggleGridSnap: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  hasSelection: boolean;
}

const pieceIcons: Record<PieceType, string> = {
  block: '[ ]',
  beam: '===',
  anchor: '[#]',
};

export const BuildToolbar: React.FC<BuildToolbarProps> = ({
  selectedPieceType,
  onSelectPieceType,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isGridSnapEnabled,
  onToggleGridSnap,
  onDelete,
  onDuplicate,
  hasSelection,
}) => {
  return (
    <div style={styles.toolGroup}>
      {/* Piece types */}
      {(['block', 'beam', 'anchor'] as PieceType[]).map((type) => (
        <button
          key={type}
          style={{
            ...styles.button,
            ...(selectedPieceType === type ? styles.buttonActive : {}),
          }}
          onClick={() => onSelectPieceType(type)}
          title={type.charAt(0).toUpperCase() + type.slice(1)}
        >
          <span style={{ fontFamily: 'monospace' }}>{pieceIcons[type]}</span>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </button>
      ))}

      <div style={styles.divider} />

      {/* Selection tools */}
      <button
        style={{
          ...styles.button,
          opacity: hasSelection ? 1 : 0.5,
        }}
        onClick={onDelete}
        disabled={!hasSelection}
        title="Delete selected"
      >
        Delete
      </button>
      <button
        style={{
          ...styles.button,
          opacity: hasSelection ? 1 : 0.5,
        }}
        onClick={onDuplicate}
        disabled={!hasSelection}
        title="Duplicate selected"
      >
        Copy
      </button>

      <div style={styles.divider} />

      {/* Undo/Redo */}
      <button
        style={{
          ...styles.button,
          opacity: canUndo ? 1 : 0.5,
        }}
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
      >
        Undo
      </button>
      <button
        style={{
          ...styles.button,
          opacity: canRedo ? 1 : 0.5,
        }}
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
      >
        Redo
      </button>

      <div style={styles.divider} />

      {/* Grid snap */}
      <button
        style={{
          ...styles.button,
          ...(isGridSnapEnabled ? styles.buttonActive : {}),
        }}
        onClick={onToggleGridSnap}
        title="Toggle grid snap"
      >
        Grid
      </button>
    </div>
  );
};

// ============================================================================
// Destroy Toolbar
// ============================================================================

interface DestroyToolbarProps {
  onDestroy: (method: DestructionMethod) => void;
  disabled?: boolean;
}

const destroyIcons: Record<DestructionMethod, string> = {
  explode: '*',
  stress: '~',
  entropy: '...',
};

export const DestroyToolbar: React.FC<DestroyToolbarProps> = ({ onDestroy, disabled }) => {
  return (
    <div style={styles.toolGroup}>
      {(['explode', 'stress', 'entropy'] as DestructionMethod[]).map((method) => (
        <button
          key={method}
          style={{
            ...styles.button,
            ...styles.buttonDestroy,
            opacity: disabled ? 0.5 : 1,
          }}
          onClick={() => onDestroy(method)}
          disabled={disabled}
          title={`Destroy: ${method}`}
        >
          <span style={{ fontFamily: 'monospace' }}>{destroyIcons[method]}</span>
          {method.charAt(0).toUpperCase() + method.slice(1)}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// Replay Controls
// ============================================================================

interface ReplayControlsProps {
  isPlaying: boolean;
  playbackSpeed: number;
  progress: number;
  duration: number;
  failurePoint?: FailurePoint | null;
  onTogglePlay: () => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  onSeek: (progress: number) => void;
  onReset: () => void;
}

const speedLabels: Record<PlaybackSpeed, string> = {
  0.25: '0.25x',
  0.5: '0.5x',
  1: '1x',
};

export const ReplayControlsUI: React.FC<ReplayControlsProps> = ({
  isPlaying,
  playbackSpeed,
  progress,
  duration,
  failurePoint,
  onTogglePlay,
  onSpeedChange,
  onSeek,
  onReset,
}) => {
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newProgress = x / rect.width;
    onSeek(Math.max(0, Math.min(1, newProgress)));
  };

  const failureProgress = failurePoint && duration > 0
    ? failurePoint.timestamp / duration
    : null;

  return (
    <div style={styles.replayControls}>
      {/* Timeline */}
      <div style={styles.timeline} onClick={handleTimelineClick}>
        <div
          style={{
            ...styles.timelineProgress,
            width: `${progress * 100}%`,
          }}
        />
        {failureProgress !== null && (
          <div
            style={{
              ...styles.timelineMarker,
              left: `${failureProgress * 100}%`,
            }}
            title="First failure point"
          />
        )}
      </div>

      {/* Time display */}
      <div style={{ textAlign: 'center', fontSize: '12px', opacity: 0.7 }}>
        {(progress * duration).toFixed(1)}s / {duration.toFixed(1)}s
      </div>

      {/* Buttons */}
      <div style={styles.playbackButtons}>
        <button style={styles.button} onClick={onTogglePlay}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        {([0.25, 0.5, 1] as PlaybackSpeed[]).map((speed) => (
          <button
            key={speed}
            style={{
              ...styles.button,
              ...(playbackSpeed === speed ? styles.buttonActive : {}),
            }}
            onClick={() => onSpeedChange(speed)}
          >
            {speedLabels[speed]}
          </button>
        ))}

        <button
          style={{ ...styles.button, ...styles.buttonReset }}
          onClick={onReset}
        >
          Reset
        </button>
      </div>

      {/* Failure info */}
      {failurePoint && (
        <div style={styles.failureInfo}>
          First failure at {failurePoint.timestamp.toFixed(2)}s
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Action Buttons (Destroy/Replay/Reset)
// ============================================================================

interface ActionButtonsProps {
  mode: GameMode;
  hasRecording: boolean;
  onStartReplay: () => void;
  onReset: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  mode,
  hasRecording,
  onStartReplay,
  onReset,
}) => {
  if (mode === 'build') return null;

  return (
    <div style={styles.toolGroup}>
      {mode === 'simulate' && hasRecording && (
        <button
          style={{ ...styles.button, background: 'rgba(155, 89, 182, 0.8)' }}
          onClick={onStartReplay}
        >
          Watch Replay
        </button>
      )}
      <button
        style={{ ...styles.button, ...styles.buttonReset }}
        onClick={onReset}
      >
        Reset
      </button>
    </div>
  );
};

// ============================================================================
// L2P Badge
// ============================================================================

interface L2PBadgeProps {
  message: string;
}

export const L2PBadge: React.FC<L2PBadgeProps> = ({ message }) => {
  return (
    <div style={styles.l2pBadge}>
      {message}
    </div>
  );
};

// ============================================================================
// Main UI Container
// ============================================================================

export interface UIContainerProps {
  mode: GameMode;
  pieceCount: number;
  fps: number;
  destructionProgress: number;
  children: React.ReactNode;
}

export const UIContainer: React.FC<UIContainerProps> = ({
  mode,
  pieceCount,
  fps,
  destructionProgress,
  children,
}) => {
  return (
    <div style={styles.container}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <ModeIndicator mode={mode} destructionProgress={destructionProgress} />
        <Stats pieceCount={pieceCount} fps={fps} />
      </div>

      {/* Bottom bar */}
      <div style={styles.bottomBar}>
        {children}
      </div>
    </div>
  );
};
