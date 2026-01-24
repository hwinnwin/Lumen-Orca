/**
 * ReplaySystem - Transform recording and playback for CREATE → DESTROY
 *
 * Records rigidbody transforms at fixed timestep using a ring buffer
 * to efficiently capture the destruction sequence for replay.
 */

import { PhysicsSystem } from './PhysicsSystem';
import {
  ReplayFrame,
  PieceState,
  ReplayControls,
  FailurePoint,
  Vector3,
  Quaternion,
  GameEventListener,
  GameEvent,
} from '../core/types';

export interface ReplaySystemConfig {
  maxDuration: number; // Maximum replay duration in seconds
  recordingFps: number; // Recording framerate
  defaultPlaybackSpeed: number;
}

export const DEFAULT_REPLAY_CONFIG: ReplaySystemConfig = {
  maxDuration: 30,
  recordingFps: 50,
  defaultPlaybackSpeed: 1.0,
};

export type PlaybackSpeed = 0.25 | 0.5 | 1.0;

export class ReplaySystem {
  private physics: PhysicsSystem;
  private config: ReplaySystemConfig;
  private listeners: Set<GameEventListener> = new Set();

  // Ring buffer for frames
  private frames: ReplayFrame[] = [];
  private maxFrames: number;
  private writeIndex = 0;
  private frameCount = 0;

  // Recording state
  private isRecording = false;
  private recordingTime = 0;
  private frameInterval: number;
  private timeSinceLastFrame = 0;

  // Playback state
  private controls: ReplayControls = {
    isPlaying: false,
    playbackSpeed: 1.0,
    currentTime: 0,
    duration: 0,
  };

  // Detected failure point for overlay
  private firstFailure: FailurePoint | null = null;

  constructor(physics: PhysicsSystem, config: Partial<ReplaySystemConfig> = {}) {
    this.physics = physics;
    this.config = { ...DEFAULT_REPLAY_CONFIG, ...config };
    this.maxFrames = this.config.maxDuration * this.config.recordingFps;
    this.frameInterval = 1 / this.config.recordingFps;

    // Pre-allocate ring buffer
    this.frames = new Array(this.maxFrames);
  }

  // ============================================================================
  // Recording
  // ============================================================================

  startRecording(): void {
    if (this.isRecording) return;

    this.isRecording = true;
    this.recordingTime = 0;
    this.writeIndex = 0;
    this.frameCount = 0;
    this.timeSinceLastFrame = 0;
    this.firstFailure = null;
  }

  stopRecording(): void {
    this.isRecording = false;
    this.controls.duration = this.frameCount / this.config.recordingFps;
  }

  updateRecording(deltaTime: number): void {
    if (!this.isRecording) return;

    this.timeSinceLastFrame += deltaTime;
    this.recordingTime += deltaTime;

    // Record frame at fixed interval
    if (this.timeSinceLastFrame >= this.frameInterval) {
      this.recordFrame();
      this.timeSinceLastFrame -= this.frameInterval;
    }
  }

  private recordFrame(): void {
    const pieceStates = this.physics.getAllBodyStates();

    // Create frame with minimal data (using ring buffer)
    const frame: ReplayFrame = {
      timestamp: this.recordingTime,
      pieceStates: new Map(pieceStates),
    };

    // Write to ring buffer
    this.frames[this.writeIndex] = frame;
    this.writeIndex = (this.writeIndex + 1) % this.maxFrames;

    if (this.frameCount < this.maxFrames) {
      this.frameCount++;
    }
  }

  setFirstFailure(failure: FailurePoint): void {
    if (!this.firstFailure) {
      this.firstFailure = failure;
    }
  }

  // ============================================================================
  // Playback
  // ============================================================================

  startPlayback(): void {
    if (this.frameCount === 0) return;

    this.controls.isPlaying = true;
    this.controls.currentTime = 0;
    this.controls.duration = this.frameCount / this.config.recordingFps;

    this.emit({ type: 'replay_started' });
  }

  stopPlayback(): void {
    this.controls.isPlaying = false;
    this.emit({ type: 'replay_stopped' });
  }

  togglePlayback(): void {
    if (this.controls.isPlaying) {
      this.stopPlayback();
    } else {
      this.startPlayback();
    }
  }

  updatePlayback(deltaTime: number): Map<string, PieceState> | null {
    if (!this.controls.isPlaying || this.frameCount === 0) {
      return null;
    }

    // Advance time based on playback speed
    this.controls.currentTime += deltaTime * this.controls.playbackSpeed;

    // Loop back to start when reaching end
    if (this.controls.currentTime >= this.controls.duration) {
      this.controls.currentTime = 0;
    }

    return this.getInterpolatedState(this.controls.currentTime);
  }

  // ============================================================================
  // State Interpolation
  // ============================================================================

  private getInterpolatedState(time: number): Map<string, PieceState> {
    const frameTime = time * this.config.recordingFps;
    const frameIndex = Math.floor(frameTime);
    const t = frameTime - frameIndex;

    const frame1 = this.getFrame(frameIndex);
    const frame2 = this.getFrame(frameIndex + 1);

    if (!frame1) {
      return new Map();
    }

    if (!frame2 || t === 0) {
      return frame1.pieceStates;
    }

    // Interpolate between frames
    const result = new Map<string, PieceState>();

    for (const [id, state1] of frame1.pieceStates) {
      const state2 = frame2.pieceStates.get(id);

      if (state2) {
        result.set(id, this.interpolateState(state1, state2, t));
      } else {
        result.set(id, state1);
      }
    }

    return result;
  }

  private getFrame(index: number): ReplayFrame | null {
    if (index < 0 || index >= this.frameCount) {
      return null;
    }

    // Calculate actual index in ring buffer
    const startIndex = this.frameCount === this.maxFrames
      ? this.writeIndex
      : 0;
    const actualIndex = (startIndex + index) % this.maxFrames;

    return this.frames[actualIndex];
  }

  private interpolateState(state1: PieceState, state2: PieceState, t: number): PieceState {
    return {
      position: this.lerpVector3(state1.position, state2.position, t),
      rotation: this.slerpQuaternion(state1.rotation, state2.rotation, t),
      velocity: state1.velocity && state2.velocity
        ? this.lerpVector3(state1.velocity, state2.velocity, t)
        : state1.velocity,
      angularVelocity: state1.angularVelocity && state2.angularVelocity
        ? this.lerpVector3(state1.angularVelocity, state2.angularVelocity, t)
        : state1.angularVelocity,
    };
  }

  private lerpVector3(v1: Vector3, v2: Vector3, t: number): Vector3 {
    return {
      x: v1.x + (v2.x - v1.x) * t,
      y: v1.y + (v2.y - v1.y) * t,
      z: v1.z + (v2.z - v1.z) * t,
    };
  }

  private slerpQuaternion(q1: Quaternion, q2: Quaternion, t: number): Quaternion {
    // Calculate dot product
    let dot = q1.x * q2.x + q1.y * q2.y + q1.z * q2.z + q1.w * q2.w;

    // Ensure shortest path
    let q2Adj = { ...q2 };
    if (dot < 0) {
      dot = -dot;
      q2Adj = { x: -q2.x, y: -q2.y, z: -q2.z, w: -q2.w };
    }

    // Use linear interpolation for very close quaternions
    if (dot > 0.9995) {
      const result = {
        x: q1.x + (q2Adj.x - q1.x) * t,
        y: q1.y + (q2Adj.y - q1.y) * t,
        z: q1.z + (q2Adj.z - q1.z) * t,
        w: q1.w + (q2Adj.w - q1.w) * t,
      };
      return this.normalizeQuaternion(result);
    }

    // Spherical interpolation
    const theta0 = Math.acos(dot);
    const theta = theta0 * t;
    const sinTheta = Math.sin(theta);
    const sinTheta0 = Math.sin(theta0);

    const s0 = Math.cos(theta) - dot * sinTheta / sinTheta0;
    const s1 = sinTheta / sinTheta0;

    return {
      x: q1.x * s0 + q2Adj.x * s1,
      y: q1.y * s0 + q2Adj.y * s1,
      z: q1.z * s0 + q2Adj.z * s1,
      w: q1.w * s0 + q2Adj.w * s1,
    };
  }

  private normalizeQuaternion(q: Quaternion): Quaternion {
    const len = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w);
    if (len === 0) return { x: 0, y: 0, z: 0, w: 1 };
    return {
      x: q.x / len,
      y: q.y / len,
      z: q.z / len,
      w: q.w / len,
    };
  }

  // ============================================================================
  // Controls
  // ============================================================================

  setPlaybackSpeed(speed: PlaybackSpeed): void {
    this.controls.playbackSpeed = speed;
  }

  cyclePlaybackSpeed(): void {
    const speeds: PlaybackSpeed[] = [0.25, 0.5, 1.0];
    const currentIndex = speeds.indexOf(this.controls.playbackSpeed as PlaybackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    this.controls.playbackSpeed = speeds[nextIndex];
  }

  seekTo(time: number): void {
    this.controls.currentTime = Math.max(0, Math.min(time, this.controls.duration));
  }

  seekToProgress(progress: number): void {
    this.seekTo(progress * this.controls.duration);
  }

  getControls(): Readonly<ReplayControls> {
    return this.controls;
  }

  getProgress(): number {
    if (this.controls.duration === 0) return 0;
    return this.controls.currentTime / this.controls.duration;
  }

  // ============================================================================
  // Failure Point
  // ============================================================================

  getFirstFailure(): FailurePoint | null {
    return this.firstFailure;
  }

  getFailureFrameIndex(): number | null {
    if (!this.firstFailure) return null;
    return Math.floor(this.firstFailure.timestamp * this.config.recordingFps);
  }

  // ============================================================================
  // State Queries
  // ============================================================================

  isRecordingActive(): boolean {
    return this.isRecording;
  }

  isPlaybackActive(): boolean {
    return this.controls.isPlaying;
  }

  getFrameCount(): number {
    return this.frameCount;
  }

  getDuration(): number {
    return this.controls.duration;
  }

  getCurrentTime(): number {
    return this.controls.currentTime;
  }

  hasRecording(): boolean {
    return this.frameCount > 0;
  }

  // ============================================================================
  // Reset
  // ============================================================================

  reset(): void {
    this.frames = new Array(this.maxFrames);
    this.writeIndex = 0;
    this.frameCount = 0;
    this.isRecording = false;
    this.recordingTime = 0;
    this.timeSinceLastFrame = 0;
    this.firstFailure = null;
    this.controls = {
      isPlaying: false,
      playbackSpeed: this.config.defaultPlaybackSpeed,
      currentTime: 0,
      duration: 0,
    };
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
  // Memory Statistics
  // ============================================================================

  getMemoryStats(): { framesUsed: number; maxFrames: number; estimatedBytes: number } {
    // Rough estimate: each frame has ~20 bytes per piece (pos + rot)
    const piecesPerFrame = this.frameCount > 0 && this.frames[0]
      ? this.frames[0].pieceStates.size
      : 0;
    const bytesPerPiece = 7 * 4; // 7 floats (3 pos + 4 rot) * 4 bytes
    const bytesPerFrame = 8 + piecesPerFrame * bytesPerPiece; // timestamp + pieces
    const estimatedBytes = this.frameCount * bytesPerFrame;

    return {
      framesUsed: this.frameCount,
      maxFrames: this.maxFrames,
      estimatedBytes,
    };
  }
}
