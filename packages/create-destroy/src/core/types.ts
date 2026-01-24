/**
 * CREATE → DESTROY (L2P) Core Types
 *
 * "Creation + destruction is life" - A physics sandbox where
 * building structures and watching them collapse is the entire experience.
 */

import type { RigidBody, World } from '@dimforge/rapier3d-compat';

// ============================================================================
// Game State
// ============================================================================

export type GameMode = 'build' | 'simulate' | 'replay';

export interface GameState {
  mode: GameMode;
  pieces: Map<string, BuildPiece>;
  selectedPieceId: string | null;
  selectedTool: BuildTool;
  destructionMethod: DestructionMethod;
  replayBuffer: ReplayBuffer;
  settings: GameSettings;
}

export interface GameSettings {
  gridSnapEnabled: boolean;
  gridSize: number;
  maxPieces: number;
  replayDuration: number; // seconds
  replayFps: number;
}

export const DEFAULT_SETTINGS: GameSettings = {
  gridSnapEnabled: true,
  gridSize: 1.0,
  maxPieces: 300,
  replayDuration: 30,
  replayFps: 50,
};

// ============================================================================
// Build Pieces
// ============================================================================

export type PieceType = 'block' | 'beam' | 'anchor';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Transform {
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
}

export interface BuildPiece {
  id: string;
  type: PieceType;
  transform: Transform;
  color: string;
  isAnchored: boolean;
  // Runtime references (not serialized)
  rigidBodyHandle?: number;
}

export interface PieceDefinition {
  type: PieceType;
  defaultScale: Vector3;
  defaultColor: string;
  mass: number;
  friction: number;
  restitution: number;
}

export const PIECE_DEFINITIONS: Record<PieceType, PieceDefinition> = {
  block: {
    type: 'block',
    defaultScale: { x: 1, y: 1, z: 1 },
    defaultColor: '#4A90D9',
    mass: 1.0,
    friction: 0.5,
    restitution: 0.2,
  },
  beam: {
    type: 'beam',
    defaultScale: { x: 0.5, y: 0.5, z: 3 },
    defaultColor: '#7B68EE',
    mass: 1.5,
    friction: 0.5,
    restitution: 0.1,
  },
  anchor: {
    type: 'anchor',
    defaultScale: { x: 1, y: 0.5, z: 1 },
    defaultColor: '#2F4F4F',
    mass: 0, // Anchors are static
    friction: 0.8,
    restitution: 0.0,
  },
};

// ============================================================================
// Build Tools
// ============================================================================

export type BuildTool =
  | 'place'
  | 'select'
  | 'delete'
  | 'duplicate'
  | 'rotate';

export interface BuildAction {
  type: 'place' | 'delete' | 'move' | 'rotate' | 'duplicate';
  pieceId: string;
  previousState?: Partial<BuildPiece>;
  newState?: Partial<BuildPiece>;
}

// ============================================================================
// Destruction Methods
// ============================================================================

export type DestructionMethod = 'explode' | 'stress' | 'entropy';

export interface DestructionConfig {
  method: DestructionMethod;
  intensity: number; // 0-1 scale
  duration?: number; // for stress/entropy
}

export interface ExplodeConfig extends DestructionConfig {
  method: 'explode';
  epicenter: Vector3;
  radius: number;
  force: number;
}

export interface StressConfig extends DestructionConfig {
  method: 'stress';
  frequency: number; // oscillation frequency
  amplitude: number;
  duration: number;
}

export interface EntropyConfig extends DestructionConfig {
  method: 'entropy';
  decayRate: number;
  duration: number;
}

// ============================================================================
// Replay System
// ============================================================================

export interface ReplayFrame {
  timestamp: number;
  pieceStates: Map<string, PieceState>;
}

export interface PieceState {
  position: Vector3;
  rotation: Quaternion;
  velocity?: Vector3;
  angularVelocity?: Vector3;
}

export interface ReplayBuffer {
  frames: ReplayFrame[];
  startTime: number;
  maxFrames: number;
  currentIndex: number;
  isRecording: boolean;
}

export interface ReplayControls {
  isPlaying: boolean;
  playbackSpeed: number; // 0.25, 0.5, 1.0
  currentTime: number;
  duration: number;
}

export interface FailurePoint {
  pieceId: string;
  timestamp: number;
  position: Vector3;
  reason: 'velocity_threshold' | 'joint_break' | 'collision';
}

// ============================================================================
// Events
// ============================================================================

export type GameEvent =
  | { type: 'mode_change'; mode: GameMode }
  | { type: 'piece_placed'; piece: BuildPiece }
  | { type: 'piece_deleted'; pieceId: string }
  | { type: 'piece_modified'; piece: BuildPiece }
  | { type: 'destruction_started'; config: DestructionConfig }
  | { type: 'destruction_complete' }
  | { type: 'replay_started' }
  | { type: 'replay_stopped' }
  | { type: 'failure_detected'; failure: FailurePoint }
  | { type: 'reset' };

export type GameEventListener = (event: GameEvent) => void;

// ============================================================================
// Physics Integration
// ============================================================================

export interface PhysicsWorld {
  world: World;
  bodies: Map<string, RigidBody>;
}

export interface PhysicsConfig {
  gravity: Vector3;
  timestep: number;
  solverIterations: number;
}

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  gravity: { x: 0, y: -9.81, z: 0 },
  timestep: 1 / 60,
  solverIterations: 4,
};

// ============================================================================
// UI State
// ============================================================================

export interface UIState {
  showFPS: boolean;
  showObjectCount: boolean;
  selectedPieceType: PieceType;
  replayControls: ReplayControls;
}

// ============================================================================
// L2P Messages - "Nothing here is meant to last"
// ============================================================================

export const L2P_MESSAGES = [
  "Create. Release. Learn.",
  "Nothing here is meant to last.",
  "Destruction is part of the build.",
  "L2P: Learn to Play.",
  "Every end is a new beginning.",
  "Build to break. Break to learn.",
] as const;

export type L2PMessage = typeof L2P_MESSAGES[number];
