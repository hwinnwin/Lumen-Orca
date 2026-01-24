/**
 * PhysicsSystem - Rapier.js integration for CREATE → DESTROY
 *
 * Handles physics simulation, body management, and state synchronization.
 */

import type RAPIER from '@dimforge/rapier3d-compat';
import {
  BuildPiece,
  Vector3,
  Quaternion,
  PieceState,
  PhysicsConfig,
  DEFAULT_PHYSICS_CONFIG,
  PIECE_DEFINITIONS,
} from '../core/types';

export interface PhysicsSystemConfig extends PhysicsConfig {
  settleDuration: number; // Time to let physics settle after enabling
  settleDamping: number;
}

export const DEFAULT_PHYSICS_SYSTEM_CONFIG: PhysicsSystemConfig = {
  ...DEFAULT_PHYSICS_CONFIG,
  settleDuration: 0.5,
  settleDamping: 0.8,
};

export class PhysicsSystem {
  private RAPIER: typeof RAPIER | null = null;
  private world: RAPIER.World | null = null;
  private bodies: Map<string, RAPIER.RigidBody> = new Map();
  private colliders: Map<string, RAPIER.Collider> = new Map();
  private config: PhysicsSystemConfig;
  private isInitialized = false;
  private settleTimer = 0;
  private isSettling = false;

  constructor(config: Partial<PhysicsSystemConfig> = {}) {
    this.config = { ...DEFAULT_PHYSICS_SYSTEM_CONFIG, ...config };
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Dynamic import for WASM module
    const rapier = await import('@dimforge/rapier3d-compat');
    await rapier.init();
    this.RAPIER = rapier;

    this.createWorld();
    this.isInitialized = true;
  }

  private createWorld(): void {
    if (!this.RAPIER) throw new Error('RAPIER not initialized');

    const gravity = new this.RAPIER.Vector3(
      this.config.gravity.x,
      this.config.gravity.y,
      this.config.gravity.z
    );
    this.world = new this.RAPIER.World(gravity);
  }

  isReady(): boolean {
    return this.isInitialized && this.world !== null;
  }

  // ============================================================================
  // Body Management
  // ============================================================================

  addBody(piece: BuildPiece): void {
    if (!this.RAPIER || !this.world) return;

    const definition = PIECE_DEFINITIONS[piece.type];
    const { position, rotation, scale } = piece.transform;

    // Create rigid body description
    const bodyDesc = piece.isAnchored
      ? this.RAPIER.RigidBodyDesc.fixed()
      : this.RAPIER.RigidBodyDesc.dynamic();

    bodyDesc
      .setTranslation(position.x, position.y, position.z)
      .setRotation({ x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w });

    // Apply settling damping if active
    if (this.isSettling) {
      bodyDesc.setLinearDamping(this.config.settleDamping);
      bodyDesc.setAngularDamping(this.config.settleDamping);
    }

    const body = this.world.createRigidBody(bodyDesc);

    // Create collider based on piece type
    const colliderDesc = this.createColliderDesc(piece.type, scale);
    colliderDesc.setFriction(definition.friction);
    colliderDesc.setRestitution(definition.restitution);

    if (!piece.isAnchored) {
      colliderDesc.setMass(definition.mass);
    }

    const collider = this.world.createCollider(colliderDesc, body);

    this.bodies.set(piece.id, body);
    this.colliders.set(piece.id, collider);
  }

  private createColliderDesc(type: string, scale: Vector3): RAPIER.ColliderDesc {
    if (!this.RAPIER) throw new Error('RAPIER not initialized');

    // All pieces are cuboids with different proportions
    const halfExtents = {
      x: scale.x / 2,
      y: scale.y / 2,
      z: scale.z / 2,
    };

    return this.RAPIER.ColliderDesc.cuboid(halfExtents.x, halfExtents.y, halfExtents.z);
  }

  removeBody(pieceId: string): void {
    if (!this.world) return;

    const body = this.bodies.get(pieceId);
    if (body) {
      this.world.removeRigidBody(body);
      this.bodies.delete(pieceId);
      this.colliders.delete(pieceId);
    }
  }

  clearBodies(): void {
    if (!this.world) return;

    for (const [id] of this.bodies) {
      this.removeBody(id);
    }
  }

  // ============================================================================
  // Simulation
  // ============================================================================

  step(deltaTime: number): void {
    if (!this.world) return;

    // Handle settling period
    if (this.isSettling) {
      this.settleTimer += deltaTime;
      if (this.settleTimer >= this.config.settleDuration) {
        this.endSettle();
      }
    }

    this.world.step();
  }

  startSettle(): void {
    this.isSettling = true;
    this.settleTimer = 0;

    // Apply damping to all bodies
    for (const body of this.bodies.values()) {
      body.setLinearDamping(this.config.settleDamping);
      body.setAngularDamping(this.config.settleDamping);
    }
  }

  private endSettle(): void {
    this.isSettling = false;

    // Remove extra damping
    for (const body of this.bodies.values()) {
      body.setLinearDamping(0.1);
      body.setAngularDamping(0.1);
    }
  }

  // ============================================================================
  // State Sync
  // ============================================================================

  syncFromPieces(pieces: Map<string, BuildPiece>): void {
    // Remove bodies that no longer exist
    for (const id of this.bodies.keys()) {
      if (!pieces.has(id)) {
        this.removeBody(id);
      }
    }

    // Add or update bodies
    for (const [id, piece] of pieces) {
      if (!this.bodies.has(id)) {
        this.addBody(piece);
      } else {
        this.updateBodyTransform(id, piece.transform);
      }
    }
  }

  private updateBodyTransform(id: string, transform: { position: Vector3; rotation: Quaternion }): void {
    const body = this.bodies.get(id);
    if (!body || !this.RAPIER) return;

    body.setTranslation(
      new this.RAPIER.Vector3(transform.position.x, transform.position.y, transform.position.z),
      true
    );
    body.setRotation(
      { x: transform.rotation.x, y: transform.rotation.y, z: transform.rotation.z, w: transform.rotation.w },
      true
    );
  }

  getBodyState(pieceId: string): PieceState | null {
    const body = this.bodies.get(pieceId);
    if (!body) return null;

    const translation = body.translation();
    const rotation = body.rotation();
    const linvel = body.linvel();
    const angvel = body.angvel();

    return {
      position: { x: translation.x, y: translation.y, z: translation.z },
      rotation: { x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w },
      velocity: { x: linvel.x, y: linvel.y, z: linvel.z },
      angularVelocity: { x: angvel.x, y: angvel.y, z: angvel.z },
    };
  }

  getAllBodyStates(): Map<string, PieceState> {
    const states = new Map<string, PieceState>();

    for (const id of this.bodies.keys()) {
      const state = this.getBodyState(id);
      if (state) {
        states.set(id, state);
      }
    }

    return states;
  }

  // ============================================================================
  // Force Application
  // ============================================================================

  applyExplosionForce(epicenter: Vector3, radius: number, force: number): void {
    if (!this.RAPIER) return;

    for (const body of this.bodies.values()) {
      if (body.isFixed()) continue;

      const pos = body.translation();
      const dx = pos.x - epicenter.x;
      const dy = pos.y - epicenter.y;
      const dz = pos.z - epicenter.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance > radius || distance < 0.001) continue;

      // Force falls off with distance
      const falloff = 1 - distance / radius;
      const magnitude = force * falloff * falloff; // Quadratic falloff

      // Normalize direction and apply force
      const nx = dx / distance;
      const ny = dy / distance;
      const nz = dz / distance;

      body.applyImpulse(
        new this.RAPIER.Vector3(nx * magnitude, ny * magnitude + force * 0.3, nz * magnitude),
        true
      );

      // Add random torque for visual interest
      body.applyTorqueImpulse(
        new this.RAPIER.Vector3(
          (Math.random() - 0.5) * magnitude * 0.5,
          (Math.random() - 0.5) * magnitude * 0.5,
          (Math.random() - 0.5) * magnitude * 0.5
        ),
        true
      );
    }
  }

  applyGlobalForce(force: Vector3): void {
    if (!this.RAPIER) return;

    for (const body of this.bodies.values()) {
      if (body.isFixed()) continue;

      body.applyImpulse(new this.RAPIER.Vector3(force.x, force.y, force.z), true);
    }
  }

  applyOscillation(amplitude: number, frequency: number, time: number): void {
    if (!this.RAPIER) return;

    const oscillation = Math.sin(time * frequency * Math.PI * 2) * amplitude;
    const force = new this.RAPIER.Vector3(oscillation, 0, oscillation * 0.5);

    for (const body of this.bodies.values()) {
      if (body.isFixed()) continue;
      body.applyImpulse(force, true);
    }
  }

  reduceBodyIntegrity(decayFactor: number): void {
    if (!this.RAPIER || !this.world) return;

    // Reduce friction and increase gravity effect for entropy
    for (const collider of this.colliders.values()) {
      const currentFriction = collider.friction();
      collider.setFriction(currentFriction * (1 - decayFactor));
    }

    // Slightly increase gravity to simulate "weight gain"
    const currentGravity = this.world.gravity;
    this.world.gravity = new this.RAPIER.Vector3(
      currentGravity.x,
      currentGravity.y * (1 + decayFactor * 0.1),
      currentGravity.z
    );
  }

  // ============================================================================
  // Velocity Queries
  // ============================================================================

  getMaxVelocity(): { pieceId: string; velocity: number } | null {
    let maxVelocity = 0;
    let maxPieceId: string | null = null;

    for (const [id, body] of this.bodies) {
      if (body.isFixed()) continue;

      const vel = body.linvel();
      const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);

      if (speed > maxVelocity) {
        maxVelocity = speed;
        maxPieceId = id;
      }
    }

    return maxPieceId ? { pieceId: maxPieceId, velocity: maxVelocity } : null;
  }

  // ============================================================================
  // Ground Plane
  // ============================================================================

  addGroundPlane(size: number = 100): void {
    if (!this.RAPIER || !this.world) return;

    const groundBodyDesc = this.RAPIER.RigidBodyDesc.fixed()
      .setTranslation(0, -0.5, 0);

    const groundBody = this.world.createRigidBody(groundBodyDesc);

    const groundColliderDesc = this.RAPIER.ColliderDesc.cuboid(size, 0.5, size)
      .setFriction(0.8)
      .setRestitution(0.1);

    this.world.createCollider(groundColliderDesc, groundBody);
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  dispose(): void {
    if (this.world) {
      this.world.free();
      this.world = null;
    }
    this.bodies.clear();
    this.colliders.clear();
    this.isInitialized = false;
  }
}
