/**
 * CreateDestroy - Main component for the CREATE → DESTROY sandbox
 *
 * "A minimalist sandbox where players build structures specifically
 * to watch them collapse, because destruction is a natural continuation
 * of creation."
 */

import React, { useState, useCallback } from 'react';
import { Scene } from './Scene';
import {
  UIContainer,
  BuildToolbar,
  DestroyToolbar,
  ActionButtons,
  ReplayControlsUI,
  L2PBadge,
} from './UI';
import { useCreateDestroy } from '../hooks/useCreateDestroy';
import { PieceType, DestructionMethod, GameSettings } from '../core/types';
import { PlaybackSpeed } from '../systems/ReplaySystem';

export interface CreateDestroyProps {
  settings?: Partial<GameSettings>;
  onReady?: () => void;
}

export const CreateDestroy: React.FC<CreateDestroyProps> = ({
  settings,
  onReady,
}) => {
  const {
    // State
    mode,
    pieces,
    pieceCount,
    selectedPiece,
    isPhysicsReady,
    destructionProgress,
    replayProgress,
    replayDuration,
    isPlaying,
    playbackSpeed,
    firstFailure,
    fps,
    l2pMessage,

    // Build actions
    addPiece,
    deletePiece,
    duplicatePiece,
    rotatePiece,
    selectPiece,
    undo,
    redo,
    canUndo,
    canRedo,

    // Mode transitions
    startDestruction,
    startReplay,
    reset,

    // Replay controls
    togglePlayback,
    setPlaybackSpeed,
    seekReplay,

    // Settings
    toggleGridSnap,
    isGridSnapEnabled,

    // Playback state
    playbackStates,
  } = useCreateDestroy(settings);

  const [selectedPieceType, setSelectedPieceType] = useState<PieceType>('block');

  // Notify when physics is ready
  React.useEffect(() => {
    if (isPhysicsReady && onReady) {
      onReady();
    }
  }, [isPhysicsReady, onReady]);

  // Handle ground click (place piece)
  const handleGroundClick = useCallback((position: { x: number; y: number; z: number }) => {
    if (mode === 'build') {
      addPiece(selectedPieceType, position);
    }
  }, [mode, selectedPieceType, addPiece]);

  // Handle piece click (select)
  const handlePieceClick = useCallback((id: string) => {
    if (mode === 'build') {
      selectPiece(id === selectedPiece?.id ? null : id);
    }
  }, [mode, selectPiece, selectedPiece]);

  // Handle delete selected
  const handleDelete = useCallback(() => {
    if (selectedPiece) {
      deletePiece(selectedPiece.id);
      selectPiece(null);
    }
  }, [selectedPiece, deletePiece, selectPiece]);

  // Handle duplicate selected
  const handleDuplicate = useCallback(() => {
    if (selectedPiece) {
      duplicatePiece(selectedPiece.id);
    }
  }, [selectedPiece, duplicatePiece]);

  // Handle destruction
  const handleDestroy = useCallback((method: DestructionMethod) => {
    if (pieceCount > 0) {
      startDestruction(method);
    }
  }, [pieceCount, startDestruction]);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + Z = Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y = Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }

      // Delete/Backspace = Delete selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPiece) {
        e.preventDefault();
        handleDelete();
      }

      // D = Duplicate
      if (e.key === 'd' && selectedPiece && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleDuplicate();
      }

      // R = Rotate (Y axis)
      if (e.key === 'r' && selectedPiece && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        rotatePiece(selectedPiece.id, 'y');
      }

      // 1, 2, 3 = Select piece type
      if (e.key === '1') setSelectedPieceType('block');
      if (e.key === '2') setSelectedPieceType('beam');
      if (e.key === '3') setSelectedPieceType('anchor');

      // G = Toggle grid snap
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleGridSnap();
      }

      // Space = Toggle replay playback
      if (e.key === ' ' && mode === 'replay') {
        e.preventDefault();
        togglePlayback();
      }

      // Escape = Reset
      if (e.key === 'Escape') {
        e.preventDefault();
        reset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedPiece, handleDelete, handleDuplicate, rotatePiece, toggleGridSnap, mode, togglePlayback, reset]);

  // Loading state
  if (!isPhysicsReady) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a1a',
        color: '#ffffff',
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>
            CREATE → DESTROY
          </div>
          <div style={{ opacity: 0.7 }}>
            Initializing physics...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* 3D Scene */}
      <Scene
        pieces={pieces}
        selectedPieceId={selectedPiece?.id ?? null}
        mode={mode}
        playbackStates={playbackStates}
        firstFailure={firstFailure}
        onPieceClick={handlePieceClick}
        onGroundClick={handleGroundClick}
      />

      {/* UI Overlay */}
      <UIContainer
        mode={mode}
        pieceCount={pieceCount}
        fps={fps}
        destructionProgress={destructionProgress}
      >
        {/* Build mode toolbar */}
        {mode === 'build' && (
          <>
            <BuildToolbar
              selectedPieceType={selectedPieceType}
              onSelectPieceType={setSelectedPieceType}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              isGridSnapEnabled={isGridSnapEnabled}
              onToggleGridSnap={toggleGridSnap}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              hasSelection={selectedPiece !== null}
            />
            <DestroyToolbar
              onDestroy={handleDestroy}
              disabled={pieceCount === 0}
            />
          </>
        )}

        {/* Simulate/Replay mode buttons */}
        {mode !== 'build' && (
          <ActionButtons
            mode={mode}
            hasRecording={replayDuration > 0}
            onStartReplay={startReplay}
            onReset={reset}
          />
        )}
      </UIContainer>

      {/* Replay controls (shown above bottom bar) */}
      {mode === 'replay' && (
        <ReplayControlsUI
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          progress={replayProgress}
          duration={replayDuration}
          failurePoint={firstFailure}
          onTogglePlay={togglePlayback}
          onSpeedChange={setPlaybackSpeed as (speed: PlaybackSpeed) => void}
          onSeek={seekReplay}
          onReset={reset}
        />
      )}

      {/* L2P Badge */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '24px',
        background: 'rgba(0, 0, 0, 0.4)',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '11px',
        opacity: 0.7,
        color: '#ffffff',
        fontFamily: "'Inter', sans-serif",
      }}>
        {l2pMessage}
      </div>
    </div>
  );
};

export default CreateDestroy;
