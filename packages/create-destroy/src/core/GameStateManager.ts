/**
 * GameStateManager - Central state management for CREATE → DESTROY
 *
 * Manages game modes, pieces, and coordinates between systems.
 */

import {
  GameState,
  GameMode,
  BuildPiece,
  BuildTool,
  DestructionMethod,
  GameEvent,
  GameEventListener,
  GameSettings,
  DEFAULT_SETTINGS,
  ReplayBuffer,
  BuildAction,
  PieceType,
  PIECE_DEFINITIONS,
  Transform,
  Vector3,
} from './types';

export class GameStateManager {
  private state: GameState;
  private listeners: Set<GameEventListener> = new Set();
  private undoStack: BuildAction[] = [];
  private redoStack: BuildAction[] = [];
  private pieceIdCounter = 0;

  constructor(settings: Partial<GameSettings> = {}) {
    this.state = {
      mode: 'build',
      pieces: new Map(),
      selectedPieceId: null,
      selectedTool: 'place',
      destructionMethod: 'explode',
      replayBuffer: this.createEmptyReplayBuffer(settings.replayDuration ?? DEFAULT_SETTINGS.replayDuration),
      settings: { ...DEFAULT_SETTINGS, ...settings },
    };
  }

  // ============================================================================
  // State Access
  // ============================================================================

  getState(): Readonly<GameState> {
    return this.state;
  }

  getMode(): GameMode {
    return this.state.mode;
  }

  getPieces(): ReadonlyMap<string, BuildPiece> {
    return this.state.pieces;
  }

  getPiece(id: string): BuildPiece | undefined {
    return this.state.pieces.get(id);
  }

  getPieceCount(): number {
    return this.state.pieces.size;
  }

  getSettings(): Readonly<GameSettings> {
    return this.state.settings;
  }

  // ============================================================================
  // Mode Management
  // ============================================================================

  setMode(mode: GameMode): void {
    if (this.state.mode === mode) return;

    const previousMode = this.state.mode;
    this.state.mode = mode;

    // Clear selection when leaving build mode
    if (previousMode === 'build' && mode !== 'build') {
      this.state.selectedPieceId = null;
    }

    // Start recording when entering simulate mode
    if (mode === 'simulate') {
      this.state.replayBuffer = this.createEmptyReplayBuffer(this.state.settings.replayDuration);
      this.state.replayBuffer.isRecording = true;
    }

    // Stop recording when leaving simulate mode
    if (previousMode === 'simulate') {
      this.state.replayBuffer.isRecording = false;
    }

    this.emit({ type: 'mode_change', mode });
  }

  // ============================================================================
  // Tool Management
  // ============================================================================

  setTool(tool: BuildTool): void {
    this.state.selectedTool = tool;
  }

  getTool(): BuildTool {
    return this.state.selectedTool;
  }

  setDestructionMethod(method: DestructionMethod): void {
    this.state.destructionMethod = method;
  }

  getDestructionMethod(): DestructionMethod {
    return this.state.destructionMethod;
  }

  // ============================================================================
  // Piece Management
  // ============================================================================

  addPiece(type: PieceType, position: Vector3, rotation?: { x: number; y: number; z: number; w: number }): BuildPiece | null {
    if (this.state.mode !== 'build') return null;
    if (this.state.pieces.size >= this.state.settings.maxPieces) return null;

    const definition = PIECE_DEFINITIONS[type];
    const id = this.generatePieceId();

    const piece: BuildPiece = {
      id,
      type,
      transform: {
        position: this.snapToGrid(position),
        rotation: rotation ?? { x: 0, y: 0, z: 0, w: 1 },
        scale: { ...definition.defaultScale },
      },
      color: definition.defaultColor,
      isAnchored: type === 'anchor',
    };

    this.state.pieces.set(id, piece);

    // Record action for undo
    this.recordAction({
      type: 'place',
      pieceId: id,
      newState: { ...piece },
    });

    this.emit({ type: 'piece_placed', piece });
    return piece;
  }

  deletePiece(id: string): boolean {
    if (this.state.mode !== 'build') return false;

    const piece = this.state.pieces.get(id);
    if (!piece) return false;

    // Record action for undo
    this.recordAction({
      type: 'delete',
      pieceId: id,
      previousState: { ...piece },
    });

    this.state.pieces.delete(id);

    if (this.state.selectedPieceId === id) {
      this.state.selectedPieceId = null;
    }

    this.emit({ type: 'piece_deleted', pieceId: id });
    return true;
  }

  duplicatePiece(id: string): BuildPiece | null {
    if (this.state.mode !== 'build') return null;

    const original = this.state.pieces.get(id);
    if (!original) return null;

    // Offset the duplicate slightly
    const offset = this.state.settings.gridSize;
    return this.addPiece(
      original.type,
      {
        x: original.transform.position.x + offset,
        y: original.transform.position.y,
        z: original.transform.position.z + offset,
      },
      original.transform.rotation
    );
  }

  rotatePiece(id: string, axis: 'x' | 'y' | 'z'): boolean {
    if (this.state.mode !== 'build') return false;

    const piece = this.state.pieces.get(id);
    if (!piece) return false;

    const previousState = { ...piece.transform.rotation };

    // Rotate 90 degrees around the specified axis
    const angle = Math.PI / 2;
    const newRotation = this.rotateQuaternion(piece.transform.rotation, axis, angle);
    piece.transform.rotation = newRotation;

    this.recordAction({
      type: 'rotate',
      pieceId: id,
      previousState: { transform: { ...piece.transform, rotation: previousState } },
      newState: { transform: { ...piece.transform } },
    });

    this.emit({ type: 'piece_modified', piece });
    return true;
  }

  movePiece(id: string, position: Vector3): boolean {
    if (this.state.mode !== 'build') return false;

    const piece = this.state.pieces.get(id);
    if (!piece) return false;

    const previousPosition = { ...piece.transform.position };
    piece.transform.position = this.snapToGrid(position);

    this.recordAction({
      type: 'move',
      pieceId: id,
      previousState: { transform: { ...piece.transform, position: previousPosition } },
      newState: { transform: { ...piece.transform } },
    });

    this.emit({ type: 'piece_modified', piece });
    return true;
  }

  selectPiece(id: string | null): void {
    this.state.selectedPieceId = id;
  }

  getSelectedPiece(): BuildPiece | null {
    if (!this.state.selectedPieceId) return null;
    return this.state.pieces.get(this.state.selectedPieceId) ?? null;
  }

  // ============================================================================
  // Undo/Redo
  // ============================================================================

  undo(): boolean {
    const action = this.undoStack.pop();
    if (!action) return false;

    this.applyUndo(action);
    this.redoStack.push(action);
    return true;
  }

  redo(): boolean {
    const action = this.redoStack.pop();
    if (!action) return false;

    this.applyRedo(action);
    this.undoStack.push(action);
    return true;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  private recordAction(action: BuildAction): void {
    this.undoStack.push(action);
    this.redoStack = []; // Clear redo stack on new action
  }

  private applyUndo(action: BuildAction): void {
    switch (action.type) {
      case 'place':
        this.state.pieces.delete(action.pieceId);
        this.emit({ type: 'piece_deleted', pieceId: action.pieceId });
        break;

      case 'delete':
        if (action.previousState) {
          const piece = action.previousState as BuildPiece;
          this.state.pieces.set(action.pieceId, piece);
          this.emit({ type: 'piece_placed', piece });
        }
        break;

      case 'move':
      case 'rotate':
        const piece = this.state.pieces.get(action.pieceId);
        if (piece && action.previousState?.transform) {
          piece.transform = action.previousState.transform as Transform;
          this.emit({ type: 'piece_modified', piece });
        }
        break;
    }
  }

  private applyRedo(action: BuildAction): void {
    switch (action.type) {
      case 'place':
        if (action.newState) {
          const piece = action.newState as BuildPiece;
          this.state.pieces.set(action.pieceId, piece);
          this.emit({ type: 'piece_placed', piece });
        }
        break;

      case 'delete':
        this.state.pieces.delete(action.pieceId);
        this.emit({ type: 'piece_deleted', pieceId: action.pieceId });
        break;

      case 'move':
      case 'rotate':
        const piece = this.state.pieces.get(action.pieceId);
        if (piece && action.newState?.transform) {
          piece.transform = action.newState.transform as Transform;
          this.emit({ type: 'piece_modified', piece });
        }
        break;
    }
  }

  // ============================================================================
  // Reset
  // ============================================================================

  reset(): void {
    this.state.pieces.clear();
    this.state.selectedPieceId = null;
    this.state.mode = 'build';
    this.state.replayBuffer = this.createEmptyReplayBuffer(this.state.settings.replayDuration);
    this.undoStack = [];
    this.redoStack = [];
    this.pieceIdCounter = 0;

    this.emit({ type: 'reset' });
  }

  // ============================================================================
  // Replay Buffer
  // ============================================================================

  getReplayBuffer(): Readonly<ReplayBuffer> {
    return this.state.replayBuffer;
  }

  // ============================================================================
  // Events
  // ============================================================================

  subscribe(listener: GameEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: GameEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private generatePieceId(): string {
    return `piece_${++this.pieceIdCounter}`;
  }

  private snapToGrid(position: Vector3): Vector3 {
    if (!this.state.settings.gridSnapEnabled) return position;

    const gridSize = this.state.settings.gridSize;
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize,
      z: Math.round(position.z / gridSize) * gridSize,
    };
  }

  private createEmptyReplayBuffer(duration: number): ReplayBuffer {
    const maxFrames = duration * this.state.settings.replayFps;
    return {
      frames: [],
      startTime: 0,
      maxFrames,
      currentIndex: 0,
      isRecording: false,
    };
  }

  private rotateQuaternion(
    q: { x: number; y: number; z: number; w: number },
    axis: 'x' | 'y' | 'z',
    angle: number
  ): { x: number; y: number; z: number; w: number } {
    const halfAngle = angle / 2;
    const s = Math.sin(halfAngle);
    const c = Math.cos(halfAngle);

    // Create rotation quaternion for axis
    let rx = 0, ry = 0, rz = 0;
    if (axis === 'x') rx = s;
    else if (axis === 'y') ry = s;
    else rz = s;

    // Multiply quaternions: rotation * original
    return {
      w: c * q.w - rx * q.x - ry * q.y - rz * q.z,
      x: c * q.x + rx * q.w + ry * q.z - rz * q.y,
      y: c * q.y - rx * q.z + ry * q.w + rz * q.x,
      z: c * q.z + rx * q.y - ry * q.x + rz * q.w,
    };
  }

  // ============================================================================
  // Settings
  // ============================================================================

  updateSettings(settings: Partial<GameSettings>): void {
    this.state.settings = { ...this.state.settings, ...settings };
  }

  toggleGridSnap(): void {
    this.state.settings.gridSnapEnabled = !this.state.settings.gridSnapEnabled;
  }
}

// Singleton instance for global access
let instance: GameStateManager | null = null;

export function getGameStateManager(): GameStateManager {
  if (!instance) {
    instance = new GameStateManager();
  }
  return instance;
}

export function resetGameStateManager(): void {
  instance = null;
}
