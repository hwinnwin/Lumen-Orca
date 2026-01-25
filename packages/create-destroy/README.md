# @lumen/create-destroy

**CREATE → DESTROY (L2P)** - A minimalist physics sandbox where building structures and watching them collapse is the entire experience.

> "Destruction is a natural continuation of creation."

## Installation

```bash
npm install @lumen/create-destroy
# or
pnpm add @lumen/create-destroy
```

## Quick Start

```tsx
import { CreateDestroy } from '@lumen/create-destroy';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <CreateDestroy />
    </div>
  );
}
```

## Core Loop

1. **Create** - Build structures with blocks, beams, and anchors
2. **Destroy** - Trigger destruction (Explode, Stress Test, or Entropy)
3. **Replay** - Watch the collapse in slow-motion with free camera
4. **Reset** - Start fresh in under 10 seconds

No winning. No punishment. No grind.

## Features

### Building System
- **Block** - Standard cube building block
- **Beam** - Rectangular prism for structural elements
- **Anchor** - Fixed point attached to ground
- Grid snap toggle (default on)
- 90° rotation increments
- Duplicate and delete tools
- Full undo/redo support

### Destruction Methods

| Method | Description |
|--------|-------------|
| **Explode** | Radial impulse from center with particle effects |
| **Stress Test** | Earthquake oscillation forces over time |
| **Entropy** | Progressive weakening - friction decay, gravity increase |

### Replay System
- Records transforms at 50fps (30 second buffer)
- Play/pause and timeline scrubbing
- 0.25x / 0.5x / 1x playback speeds
- Free camera orbit during replay
- First failure point detection and visualization

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1` `2` `3` | Select piece type (block/beam/anchor) |
| `R` | Rotate selected piece |
| `D` | Duplicate selected piece |
| `G` | Toggle grid snap |
| `Delete` | Delete selected piece |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Space` | Play/pause replay |
| `Escape` | Reset |

## API

### CreateDestroy Component

```tsx
import { CreateDestroy } from '@lumen/create-destroy';

<CreateDestroy
  settings={{
    gridSnapEnabled: true,
    gridSize: 1.0,
    maxPieces: 300,
    replayDuration: 30,
    replayFps: 50,
  }}
  onReady={() => console.log('Physics initialized')}
/>
```

### useCreateDestroy Hook

For custom UI implementations:

```tsx
import { useCreateDestroy } from '@lumen/create-destroy/hooks';

function CustomSandbox() {
  const {
    mode,
    pieces,
    addPiece,
    startDestruction,
    reset,
    // ... more
  } = useCreateDestroy();

  return (/* your custom UI */);
}
```

### Core Types

```tsx
import type {
  GameMode,        // 'build' | 'simulate' | 'replay'
  BuildPiece,      // Piece data structure
  PieceType,       // 'block' | 'beam' | 'anchor'
  DestructionMethod, // 'explode' | 'stress' | 'entropy'
} from '@lumen/create-destroy';
```

## Tech Stack

- **Physics**: [Rapier.js](https://rapier.rs/) (WASM-based)
- **Rendering**: [Three.js](https://threejs.org/) + [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- **State**: Custom GameStateManager with undo/redo

## Philosophy

This sandbox embraces the L2P (Learn to Play) philosophy:

- **No fail states** - Destruction is framed as a natural end, not a mistake
- **Immediate feedback** - Build fast, destroy fast, replay fast
- **Poetic physics** - Clean aesthetics, satisfying collapses

> "Nothing here is meant to last."

## License

MIT
