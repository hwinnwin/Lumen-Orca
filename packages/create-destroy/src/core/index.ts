/**
 * Core exports for @lumen/create-destroy
 */

export { GameStateManager, getGameStateManager, resetGameStateManager } from './GameStateManager';

export type {
  // Game State
  GameMode,
  GameState,
  GameSettings,
  UIState,

  // Build Pieces
  PieceType,
  BuildPiece,
  PieceDefinition,
  Transform,
  Vector3,
  Quaternion,

  // Build Tools
  BuildTool,
  BuildAction,

  // Destruction
  DestructionMethod,
  DestructionConfig,
  ExplodeConfig,
  StressConfig,
  EntropyConfig,

  // Replay
  ReplayFrame,
  PieceState,
  ReplayBuffer,
  ReplayControls,
  FailurePoint,

  // Events
  GameEvent,
  GameEventListener,

  // Physics
  PhysicsWorld,
  PhysicsConfig,

  // L2P
  L2PMessage,
} from './types';

export {
  DEFAULT_SETTINGS,
  DEFAULT_PHYSICS_CONFIG,
  PIECE_DEFINITIONS,
  L2P_MESSAGES,
} from './types';
