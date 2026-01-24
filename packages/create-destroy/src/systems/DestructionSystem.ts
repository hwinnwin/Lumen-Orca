/**
 * DestructionSystem - Destruction methods for CREATE → DESTROY
 *
 * "Destruction is a natural continuation of creation"
 *
 * Implements three destruction methods:
 * 1. Explode - Radial impulse with particles and sound
 * 2. Stress Test - Earthquake/oscillation forces over time
 * 3. Entropy - Progressive weakening and decay
 */

import { PhysicsSystem } from './PhysicsSystem';
import {
  DestructionMethod,
  DestructionConfig,
  ExplodeConfig,
  StressConfig,
  EntropyConfig,
  Vector3,
  GameEventListener,
  GameEvent,
  FailurePoint,
} from '../core/types';

export interface DestructionSystemConfig {
  velocityThreshold: number; // Velocity at which we consider a piece "failed"
  defaultExplodeForce: number;
  defaultExplodeRadius: number;
  defaultStressDuration: number;
  defaultStressFrequency: number;
  defaultStressAmplitude: number;
  defaultEntropyDuration: number;
  defaultEntropyDecayRate: number;
}

export const DEFAULT_DESTRUCTION_CONFIG: DestructionSystemConfig = {
  velocityThreshold: 10.0,
  defaultExplodeForce: 50.0,
  defaultExplodeRadius: 20.0,
  defaultStressDuration: 5.0,
  defaultStressFrequency: 2.0,
  defaultStressAmplitude: 5.0,
  defaultEntropyDuration: 8.0,
  defaultEntropyDecayRate: 0.02,
};

export type DestructionPhase = 'idle' | 'active' | 'complete';

export class DestructionSystem {
  private physics: PhysicsSystem;
  private config: DestructionSystemConfig;
  private listeners: Set<GameEventListener> = new Set();

  private phase: DestructionPhase = 'idle';
  private currentMethod: DestructionMethod | null = null;
  private elapsedTime = 0;
  private duration = 0;
  private firstFailure: FailurePoint | null = null;

  // Method-specific state
  private stressFrequency = 0;
  private stressAmplitude = 0;
  private entropyDecayRate = 0;
  private epicenter: Vector3 = { x: 0, y: 0, z: 0 };

  constructor(physics: PhysicsSystem, config: Partial<DestructionSystemConfig> = {}) {
    this.physics = physics;
    this.config = { ...DEFAULT_DESTRUCTION_CONFIG, ...config };
  }

  // ============================================================================
  // Destruction Triggers
  // ============================================================================

  startDestruction(method: DestructionMethod, options: Partial<DestructionConfig> = {}): void {
    if (this.phase !== 'idle') return;

    this.phase = 'active';
    this.currentMethod = method;
    this.elapsedTime = 0;
    this.firstFailure = null;

    switch (method) {
      case 'explode':
        this.initExplode(options as Partial<ExplodeConfig>);
        break;
      case 'stress':
        this.initStress(options as Partial<StressConfig>);
        break;
      case 'entropy':
        this.initEntropy(options as Partial<EntropyConfig>);
        break;
    }

    this.emit({
      type: 'destruction_started',
      config: { method, intensity: options.intensity ?? 1.0 },
    });
  }

  private initExplode(options: Partial<ExplodeConfig>): void {
    const force = options.force ?? this.config.defaultExplodeForce;
    const radius = options.radius ?? this.config.defaultExplodeRadius;
    this.epicenter = options.epicenter ?? { x: 0, y: 0, z: 0 };
    this.duration = 0.5; // Explosion is instant but we track for a short time

    // Apply explosion force immediately
    this.physics.applyExplosionForce(this.epicenter, radius, force);
  }

  private initStress(options: Partial<StressConfig>): void {
    this.duration = options.duration ?? this.config.defaultStressDuration;
    this.stressFrequency = options.frequency ?? this.config.defaultStressFrequency;
    this.stressAmplitude = options.amplitude ?? this.config.defaultStressAmplitude;
  }

  private initEntropy(options: Partial<EntropyConfig>): void {
    this.duration = options.duration ?? this.config.defaultEntropyDuration;
    this.entropyDecayRate = options.decayRate ?? this.config.defaultEntropyDecayRate;
  }

  // ============================================================================
  // Update Loop
  // ============================================================================

  update(deltaTime: number): void {
    if (this.phase !== 'active') return;

    this.elapsedTime += deltaTime;

    // Check for first failure
    if (!this.firstFailure) {
      this.checkForFailure();
    }

    // Apply ongoing destruction effects
    switch (this.currentMethod) {
      case 'stress':
        this.updateStress();
        break;
      case 'entropy':
        this.updateEntropy();
        break;
    }

    // Check for completion
    if (this.elapsedTime >= this.duration) {
      this.complete();
    }
  }

  private updateStress(): void {
    // Apply oscillating force
    this.physics.applyOscillation(this.stressAmplitude, this.stressFrequency, this.elapsedTime);
  }

  private updateEntropy(): void {
    // Gradually reduce body integrity
    this.physics.reduceBodyIntegrity(this.entropyDecayRate);

    // Add small random perturbations
    if (Math.random() < 0.1) {
      const randomForce: Vector3 = {
        x: (Math.random() - 0.5) * 2,
        y: 0,
        z: (Math.random() - 0.5) * 2,
      };
      this.physics.applyGlobalForce(randomForce);
    }
  }

  private checkForFailure(): void {
    const maxVel = this.physics.getMaxVelocity();

    if (maxVel && maxVel.velocity > this.config.velocityThreshold) {
      const state = this.physics.getBodyState(maxVel.pieceId);
      if (state) {
        this.firstFailure = {
          pieceId: maxVel.pieceId,
          timestamp: this.elapsedTime,
          position: state.position,
          reason: 'velocity_threshold',
        };

        this.emit({ type: 'failure_detected', failure: this.firstFailure });
      }
    }
  }

  private complete(): void {
    this.phase = 'complete';
    this.emit({ type: 'destruction_complete' });
  }

  // ============================================================================
  // State Queries
  // ============================================================================

  getPhase(): DestructionPhase {
    return this.phase;
  }

  getCurrentMethod(): DestructionMethod | null {
    return this.currentMethod;
  }

  getProgress(): number {
    if (this.duration === 0) return 1;
    return Math.min(this.elapsedTime / this.duration, 1);
  }

  getFirstFailure(): FailurePoint | null {
    return this.firstFailure;
  }

  isActive(): boolean {
    return this.phase === 'active';
  }

  // ============================================================================
  // Reset
  // ============================================================================

  reset(): void {
    this.phase = 'idle';
    this.currentMethod = null;
    this.elapsedTime = 0;
    this.duration = 0;
    this.firstFailure = null;
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
  // Preset Configurations
  // ============================================================================

  static getPreset(
    method: DestructionMethod,
    intensity: 'low' | 'medium' | 'high'
  ): Partial<DestructionConfig> {
    const intensityMultiplier = intensity === 'low' ? 0.5 : intensity === 'high' ? 1.5 : 1.0;

    switch (method) {
      case 'explode':
        return {
          method: 'explode',
          intensity: intensityMultiplier,
          epicenter: { x: 0, y: 2, z: 0 },
          radius: 20 * intensityMultiplier,
          force: 50 * intensityMultiplier,
        } as ExplodeConfig;

      case 'stress':
        return {
          method: 'stress',
          intensity: intensityMultiplier,
          duration: 5 + intensityMultiplier * 3,
          frequency: 2 * intensityMultiplier,
          amplitude: 5 * intensityMultiplier,
        } as StressConfig;

      case 'entropy':
        return {
          method: 'entropy',
          intensity: intensityMultiplier,
          duration: 8 + intensityMultiplier * 4,
          decayRate: 0.02 * intensityMultiplier,
        } as EntropyConfig;
    }
  }
}
