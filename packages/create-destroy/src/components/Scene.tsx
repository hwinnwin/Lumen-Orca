/**
 * Scene - Main 3D scene component for CREATE → DESTROY
 *
 * Uses React Three Fiber for rendering the physics sandbox.
 */

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { BuildPiece, PieceState, Vector3, GameMode, FailurePoint } from '../core/types';

// ============================================================================
// Piece Component
// ============================================================================

interface PieceProps {
  piece: BuildPiece;
  isSelected: boolean;
  playbackState?: PieceState;
  onClick?: () => void;
  mode: GameMode;
}

const Piece: React.FC<PieceProps> = ({ piece, isSelected, playbackState, onClick, mode }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Use playback state if available, otherwise use piece transform
  const position = useMemo(() => {
    const p = playbackState?.position ?? piece.transform.position;
    return new THREE.Vector3(p.x, p.y, p.z);
  }, [playbackState, piece.transform.position]);

  const rotation = useMemo(() => {
    const r = playbackState?.rotation ?? piece.transform.rotation;
    return new THREE.Quaternion(r.x, r.y, r.z, r.w);
  }, [playbackState, piece.transform.rotation]);

  const scale = useMemo(() => {
    const s = piece.transform.scale;
    return new THREE.Vector3(s.x, s.y, s.z);
  }, [piece.transform.scale]);

  // Animate selection highlight
  useFrame(() => {
    if (meshRef.current && isSelected) {
      const time = Date.now() * 0.003;
      const pulse = Math.sin(time) * 0.1 + 1;
      meshRef.current.scale.setScalar(pulse);
    }
  });

  const color = useMemo(() => {
    if (isSelected) return '#FFD700';
    if (piece.isAnchored) return '#2F4F4F';
    return piece.color;
  }, [isSelected, piece.isAnchored, piece.color]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      quaternion={rotation}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        if (mode === 'build' && onClick) {
          onClick();
        }
      }}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={color}
        roughness={0.7}
        metalness={0.1}
        emissive={isSelected ? '#FFD700' : '#000000'}
        emissiveIntensity={isSelected ? 0.2 : 0}
      />
    </mesh>
  );
};

// ============================================================================
// Ground Component
// ============================================================================

const Ground: React.FC = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#1a1a2e" roughness={0.9} />
    </mesh>
  );
};

// ============================================================================
// Build Placement Preview
// ============================================================================

interface PlacementPreviewProps {
  position: Vector3;
  pieceType: string;
}

const PlacementPreview: React.FC<PlacementPreviewProps> = ({ position }) => {
  return (
    <mesh position={[position.x, position.y, position.z]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#00FF00"
        transparent
        opacity={0.3}
        wireframe
      />
    </mesh>
  );
};

// ============================================================================
// Failure Point Marker
// ============================================================================

interface FailureMarkerProps {
  failure: FailurePoint;
}

const FailureMarker: React.FC<FailureMarkerProps> = ({ failure }) => {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.02;
    }
  });

  return (
    <group position={[failure.position.x, failure.position.y + 2, failure.position.z]}>
      {/* Marker */}
      <mesh ref={ref}>
        <octahedronGeometry args={[0.3]} />
        <meshStandardMaterial color="#FF4444" emissive="#FF0000" emissiveIntensity={0.5} />
      </mesh>
      {/* Line to piece */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, 0, 0, -2, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#FF4444" linewidth={2} />
      </line>
    </group>
  );
};

// ============================================================================
// Camera Controller
// ============================================================================

const CameraController: React.FC<{ mode: GameMode }> = ({ mode }) => {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  // Different camera behavior per mode
  React.useEffect(() => {
    if (mode === 'build') {
      camera.position.set(15, 15, 15);
    }
  }, [mode, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={5}
      maxDistance={50}
      maxPolarAngle={Math.PI / 2 - 0.1}
    />
  );
};

// ============================================================================
// Main Scene Content
// ============================================================================

interface SceneContentProps {
  pieces: Map<string, BuildPiece>;
  selectedPieceId: string | null;
  mode: GameMode;
  playbackStates: Map<string, PieceState> | null;
  firstFailure: FailurePoint | null;
  onPieceClick: (id: string) => void;
  onGroundClick: (position: Vector3) => void;
  previewPosition: Vector3 | null;
}

const SceneContent: React.FC<SceneContentProps> = ({
  pieces,
  selectedPieceId,
  mode,
  playbackStates,
  firstFailure,
  onPieceClick,
  onGroundClick,
  previewPosition,
}) => {
  const { raycaster, camera, pointer } = useThree();

  const handleGroundClick = (event: any) => {
    if (mode !== 'build') return;

    event.stopPropagation();

    // Get intersection point
    const point = event.point;
    onGroundClick({
      x: point.x,
      y: point.y + 0.5, // Offset above ground
      z: point.z,
    });
  };

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* Environment */}
      <Sky sunPosition={[100, 20, 100]} />

      {/* Ground */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onClick={handleGroundClick}
      >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.9} />
      </mesh>

      {/* Grid (only in build mode) */}
      {mode === 'build' && (
        <Grid
          args={[100, 100]}
          position={[0, 0.01, 0]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#333366"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#4444aa"
          fadeDistance={50}
          fadeStrength={1}
          followCamera={false}
        />
      )}

      {/* Pieces */}
      {Array.from(pieces.values()).map((piece) => (
        <Piece
          key={piece.id}
          piece={piece}
          isSelected={piece.id === selectedPieceId}
          playbackState={playbackStates?.get(piece.id)}
          onClick={() => onPieceClick(piece.id)}
          mode={mode}
        />
      ))}

      {/* Placement preview */}
      {mode === 'build' && previewPosition && (
        <PlacementPreview position={previewPosition} pieceType="block" />
      )}

      {/* Failure marker */}
      {firstFailure && mode === 'replay' && (
        <FailureMarker failure={firstFailure} />
      )}

      {/* Camera controls */}
      <CameraController mode={mode} />
    </>
  );
};

// ============================================================================
// Main Scene Component
// ============================================================================

export interface SceneProps {
  pieces: Map<string, BuildPiece>;
  selectedPieceId: string | null;
  mode: GameMode;
  playbackStates: Map<string, PieceState> | null;
  firstFailure: FailurePoint | null;
  onPieceClick: (id: string) => void;
  onGroundClick: (position: Vector3) => void;
}

export const Scene: React.FC<SceneProps> = ({
  pieces,
  selectedPieceId,
  mode,
  playbackStates,
  firstFailure,
  onPieceClick,
  onGroundClick,
}) => {
  const [previewPosition, setPreviewPosition] = React.useState<Vector3 | null>(null);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a1a' }}>
      <Canvas
        shadows
        camera={{ position: [15, 15, 15], fov: 50 }}
        gl={{ antialias: true }}
        onPointerMissed={() => {
          // Deselect when clicking empty space
          if (mode === 'build') {
            onPieceClick('');
          }
        }}
      >
        <SceneContent
          pieces={pieces}
          selectedPieceId={selectedPieceId}
          mode={mode}
          playbackStates={playbackStates}
          firstFailure={firstFailure}
          onPieceClick={onPieceClick}
          onGroundClick={onGroundClick}
          previewPosition={previewPosition}
        />
      </Canvas>
    </div>
  );
};
