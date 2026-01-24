/**
 * useCreateDestroy - Main hook for the CREATE → DESTROY game loop
 *
 * Orchestrates the game state, physics, destruction, and replay systems.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { GameStateManager } from '../core/GameStateManager';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { DestructionSystem } from '../systems/DestructionSystem';
import { ReplaySystem, PlaybackSpeed } from '../systems/ReplaySystem';
import {
  GameMode,
  BuildPiece,
  PieceType,
  DestructionMethod,
  Vector3,
  PieceState,
  FailurePoint,
  GameSettings,
  L2P_MESSAGES,
} from '../core/types';

export interface UseCreateDestroyReturn {
  // State
  mode: GameMode;
  pieces: Map<string, BuildPiece>;
  pieceCount: number;
  selectedPiece: BuildPiece | null;
  isPhysicsReady: boolean;
  destructionProgress: number;
  replayProgress: number;
  replayDuration: number;
  isPlaying: boolean;
  playbackSpeed: number;
  firstFailure: FailurePoint | null;
  fps: number;
  l2pMessage: string;

  // Build actions
  addPiece: (type: PieceType, position: Vector3) => BuildPiece | null;
  deletePiece: (id: string) => void;
  duplicatePiece: (id: string) => void;
  rotatePiece: (id: string, axis: 'x' | 'y' | 'z') => void;
  selectPiece: (id: string | null) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Mode transitions
  startDestruction: (method: DestructionMethod) => void;
  startReplay: () => void;
  reset: () => void;

  // Replay controls
  togglePlayback: () => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  seekReplay: (progress: number) => void;

  // Settings
  toggleGridSnap: () => void;
  isGridSnapEnabled: boolean;

  // Playback state for rendering
  playbackStates: Map<string, PieceState> | null;
}

export function useCreateDestroy(
  settings?: Partial<GameSettings>
): UseCreateDestroyReturn {
  // System refs
  const gameStateRef = useRef<GameStateManager | null>(null);
  const physicsRef = useRef<PhysicsSystem | null>(null);
  const destructionRef = useRef<DestructionSystem | null>(null);
  const replayRef = useRef<ReplaySystem | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const fpsCounterRef = useRef<{ frames: number; lastTime: number }>({ frames: 0, lastTime: 0 });

  // State
  const [isPhysicsReady, setIsPhysicsReady] = useState(false);
  const [mode, setMode] = useState<GameMode>('build');
  const [pieces, setPieces] = useState<Map<string, BuildPiece>>(new Map());
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [destructionProgress, setDestructionProgress] = useState(0);
  const [replayProgress, setReplayProgress] = useState(0);
  const [replayDuration, setReplayDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeedState] = useState(1);
  const [firstFailure, setFirstFailure] = useState<FailurePoint | null>(null);
  const [fps, setFps] = useState(60);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isGridSnapEnabled, setIsGridSnapEnabled] = useState(true);
  const [playbackStates, setPlaybackStates] = useState<Map<string, PieceState> | null>(null);
  const [l2pMessage] = useState(() =>
    L2P_MESSAGES[Math.floor(Math.random() * L2P_MESSAGES.length)]
  );

  // Initialize systems
  useEffect(() => {
    const initSystems = async () => {
      // Create game state manager
      const gameState = new GameStateManager(settings);
      gameStateRef.current = gameState;

      // Create physics system
      const physics = new PhysicsSystem();
      await physics.initialize();
      physics.addGroundPlane();
      physicsRef.current = physics;

      // Create destruction system
      const destruction = new DestructionSystem(physics);
      destructionRef.current = destruction;

      // Create replay system
      const replay = new ReplaySystem(physics);
      replayRef.current = replay;

      // Subscribe to game state events
      gameState.subscribe((event) => {
        if (event.type === 'mode_change') {
          setMode(event.mode);
        }
        if (event.type === 'piece_placed' || event.type === 'piece_deleted' || event.type === 'piece_modified') {
          setPieces(new Map(gameState.getPieces()));
        }
        if (event.type === 'reset') {
          setPieces(new Map());
          setSelectedPieceId(null);
          setFirstFailure(null);
          setDestructionProgress(0);
          setReplayProgress(0);
        }
      });

      // Subscribe to destruction events
      destruction.subscribe((event) => {
        if (event.type === 'failure_detected') {
          setFirstFailure(event.failure);
          replay.setFirstFailure(event.failure);
        }
      });

      // Subscribe to replay events
      replay.subscribe((event) => {
        if (event.type === 'replay_started') {
          setIsPlaying(true);
        }
        if (event.type === 'replay_stopped') {
          setIsPlaying(false);
        }
      });

      setIsPhysicsReady(true);
      setIsGridSnapEnabled(gameState.getSettings().gridSnapEnabled);
    };

    initSystems();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      physicsRef.current?.dispose();
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (!isPhysicsReady) return;

    const gameLoop = (currentTime: number) => {
      const deltaTime = lastTimeRef.current ? (currentTime - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = currentTime;

      // FPS counter
      fpsCounterRef.current.frames++;
      if (currentTime - fpsCounterRef.current.lastTime >= 1000) {
        setFps(fpsCounterRef.current.frames);
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastTime = currentTime;
      }

      const gameState = gameStateRef.current;
      const physics = physicsRef.current;
      const destruction = destructionRef.current;
      const replay = replayRef.current;

      if (!gameState || !physics || !destruction || !replay) {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const currentMode = gameState.getMode();

      if (currentMode === 'simulate') {
        // Step physics
        physics.step(deltaTime);

        // Update destruction
        destruction.update(deltaTime);
        setDestructionProgress(destruction.getProgress());

        // Record replay
        replay.updateRecording(deltaTime);

        // Check if destruction is complete
        if (destruction.getPhase() === 'complete') {
          // Auto-transition to replay after a short delay
          replay.stopRecording();
          setReplayDuration(replay.getDuration());
        }
      } else if (currentMode === 'replay') {
        // Update playback
        const states = replay.updatePlayback(deltaTime);
        if (states) {
          setPlaybackStates(states);
        }
        setReplayProgress(replay.getProgress());
        setPlaybackSpeedState(replay.getControls().playbackSpeed);
      }

      // Update undo/redo state
      setCanUndo(gameState.canUndo());
      setCanRedo(gameState.canRedo());

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPhysicsReady]);

  // Build actions
  const addPiece = useCallback((type: PieceType, position: Vector3) => {
    return gameStateRef.current?.addPiece(type, position) ?? null;
  }, []);

  const deletePiece = useCallback((id: string) => {
    gameStateRef.current?.deletePiece(id);
  }, []);

  const duplicatePiece = useCallback((id: string) => {
    gameStateRef.current?.duplicatePiece(id);
  }, []);

  const rotatePiece = useCallback((id: string, axis: 'x' | 'y' | 'z') => {
    gameStateRef.current?.rotatePiece(id, axis);
  }, []);

  const selectPiece = useCallback((id: string | null) => {
    gameStateRef.current?.selectPiece(id);
    setSelectedPieceId(id);
  }, []);

  const undo = useCallback(() => {
    gameStateRef.current?.undo();
  }, []);

  const redo = useCallback(() => {
    gameStateRef.current?.redo();
  }, []);

  // Mode transitions
  const startDestruction = useCallback((method: DestructionMethod) => {
    const gameState = gameStateRef.current;
    const physics = physicsRef.current;
    const destruction = destructionRef.current;
    const replay = replayRef.current;

    if (!gameState || !physics || !destruction || !replay) return;

    // Sync physics bodies from pieces
    physics.syncFromPieces(gameState.getPieces());
    physics.startSettle();

    // Reset systems
    destruction.reset();
    replay.reset();

    // Switch to simulate mode
    gameState.setMode('simulate');

    // Start recording
    replay.startRecording();

    // Start destruction after settle period
    setTimeout(() => {
      const preset = DestructionSystem.getPreset(method, 'medium');
      destruction.startDestruction(method, preset);
    }, 500);

    setFirstFailure(null);
    setDestructionProgress(0);
  }, []);

  const startReplay = useCallback(() => {
    const gameState = gameStateRef.current;
    const replay = replayRef.current;

    if (!gameState || !replay || !replay.hasRecording()) return;

    gameState.setMode('replay');
    replay.startPlayback();
  }, []);

  const reset = useCallback(() => {
    const gameState = gameStateRef.current;
    const physics = physicsRef.current;
    const destruction = destructionRef.current;
    const replay = replayRef.current;

    if (!gameState || !physics || !destruction || !replay) return;

    // Reset all systems
    destruction.reset();
    replay.reset();
    physics.clearBodies();
    gameState.reset();

    setPlaybackStates(null);
    setFirstFailure(null);
    setDestructionProgress(0);
    setReplayProgress(0);
    setReplayDuration(0);
    setIsPlaying(false);
  }, []);

  // Replay controls
  const togglePlayback = useCallback(() => {
    replayRef.current?.togglePlayback();
  }, []);

  const setPlaybackSpeed = useCallback((speed: PlaybackSpeed) => {
    replayRef.current?.setPlaybackSpeed(speed);
    setPlaybackSpeedState(speed);
  }, []);

  const seekReplay = useCallback((progress: number) => {
    replayRef.current?.seekToProgress(progress);
    setReplayProgress(progress);
  }, []);

  // Settings
  const toggleGridSnap = useCallback(() => {
    gameStateRef.current?.toggleGridSnap();
    setIsGridSnapEnabled(prev => !prev);
  }, []);

  // Get selected piece
  const selectedPiece = selectedPieceId ? pieces.get(selectedPieceId) ?? null : null;

  return {
    // State
    mode,
    pieces,
    pieceCount: pieces.size,
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
  };
}
