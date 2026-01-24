/**
 * CREATE → DESTROY (L2P) Page
 *
 * A minimalist sandbox where players build structures specifically
 * to watch them collapse, because destruction is a natural continuation
 * of creation.
 *
 * No winning. No punishment. No grind.
 */

import React, { Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Info, X } from 'lucide-react';

// Lazy load the CreateDestroy component for code splitting
const CreateDestroyComponent = React.lazy(() =>
  import('@lumen/create-destroy').then((module) => ({
    default: module.CreateDestroy,
  }))
);

// Loading component
const LoadingScreen: React.FC = () => (
  <div
    style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a1a',
      color: '#ffffff',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}
  >
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '32px', fontWeight: 600, marginBottom: '16px' }}>
        CREATE → DESTROY
      </div>
      <div style={{ opacity: 0.6, marginBottom: '24px' }}>
        Loading physics engine...
      </div>
      <div
        style={{
          width: '200px',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '50%',
            height: '100%',
            background: '#4A90D9',
            borderRadius: '2px',
            animation: 'loading 1.5s ease-in-out infinite',
          }}
        />
      </div>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  </div>
);

// Help overlay
const HelpOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#ffffff',
    }}
    onClick={onClose}
  >
    <div
      style={{
        background: 'rgba(20, 20, 40, 0.95)',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '500px',
        margin: '24px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>How to Play</h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            padding: '8px',
          }}
        >
          <X size={24} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Section title="Create" color="#4A90D9">
          <ul style={{ margin: 0, paddingLeft: '20px', opacity: 0.9 }}>
            <li>Click on the ground to place pieces</li>
            <li>Use <Kbd>1</Kbd> <Kbd>2</Kbd> <Kbd>3</Kbd> to switch piece types</li>
            <li>Press <Kbd>R</Kbd> to rotate selected piece</li>
            <li>Press <Kbd>D</Kbd> to duplicate selected piece</li>
            <li>Press <Kbd>G</Kbd> to toggle grid snap</li>
            <li><Kbd>Ctrl+Z</Kbd> / <Kbd>Ctrl+Y</Kbd> to undo/redo</li>
          </ul>
        </Section>

        <Section title="Destroy" color="#D94A4A">
          <ul style={{ margin: 0, paddingLeft: '20px', opacity: 0.9 }}>
            <li><strong>Explode</strong> - Radial impulse from center</li>
            <li><strong>Stress</strong> - Earthquake oscillation</li>
            <li><strong>Entropy</strong> - Progressive decay</li>
          </ul>
        </Section>

        <Section title="Replay" color="#9B59B6">
          <ul style={{ margin: 0, paddingLeft: '20px', opacity: 0.9 }}>
            <li>Watch the destruction in slow motion</li>
            <li>Scrub timeline to any moment</li>
            <li>See where failure first occurred</li>
            <li>Press <Kbd>Space</Kbd> to play/pause</li>
          </ul>
        </Section>

        <Section title="Reset" color="#4AD98A">
          <p style={{ margin: 0, opacity: 0.9 }}>
            Press <Kbd>Escape</Kbd> or click Reset to start fresh.
            <br />
            <em style={{ opacity: 0.7 }}>Nothing here is meant to last.</em>
          </p>
        </Section>
      </div>
    </div>
  </div>
);

const Section: React.FC<{ title: string; color: string; children: React.ReactNode }> = ({
  title,
  color,
  children,
}) => (
  <div>
    <h3
      style={{
        fontSize: '14px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color,
        marginBottom: '8px',
      }}
    >
      {title}
    </h3>
    <div style={{ fontSize: '14px', lineHeight: 1.6 }}>{children}</div>
  </div>
);

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd
    style={{
      display: 'inline-block',
      padding: '2px 6px',
      fontSize: '12px',
      fontFamily: 'monospace',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '4px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    }}
  >
    {children}
  </kbd>
);

const CreateDestroy: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);
  const [isReady, setIsReady] = useState(false);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Navigation header */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          padding: '16px 24px',
          zIndex: 100,
          pointerEvents: 'none',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            padding: '8px 16px',
            borderRadius: '8px',
            color: '#ffffff',
            textDecoration: 'none',
            fontSize: '14px',
            pointerEvents: 'auto',
          }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        {isReady && (
          <button
            onClick={() => setShowHelp(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)',
              padding: '8px 16px',
              borderRadius: '8px',
              color: '#ffffff',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              pointerEvents: 'auto',
            }}
          >
            <Info size={16} />
            Help
          </button>
        )}
      </div>

      {/* Main sandbox */}
      <Suspense fallback={<LoadingScreen />}>
        <CreateDestroyComponent onReady={() => setIsReady(true)} />
      </Suspense>

      {/* Help overlay */}
      {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}
    </div>
  );
};

export default CreateDestroy;
