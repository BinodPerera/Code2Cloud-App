import React from 'react';

/**
 * Preloader Component
 * A premium, glassmorphic, animated loading indicator for Code2Cloud.
 * 
 * Props:
 * - message: string (Primary message, e.g. "Analyzing repository...")
 * - submessage: string (Secondary detail, e.g. "Mapping dependencies and tech stack.")
 * - color: string (Primary highlight color, e.g. "#00E5FF")
 * - minHeight: string (CSS height for the preloader container)
 */
function Preloader({ 
  message = 'Analyzing dependencies...', 
  submessage = 'Inspecting codebase manifests and parsing libraries...', 
  color = '#00E5FF',
  minHeight = '240px'
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: minHeight,
      padding: '2.5rem',
      background: 'rgba(255, 255, 255, 0.01)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '24px',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
      textAlign: 'center',
      gap: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Injected style element for micro-animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes preloader-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes preloader-spin-reverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes preloader-pulse {
          0%, 100% { transform: scale(1); opacity: 0.25; }
          50% { transform: scale(1.15); opacity: 0.45; }
        }
        @keyframes preloader-breathing {
          0%, 100% { opacity: 0.7; filter: brightness(0.9); }
          50% { opacity: 1; filter: brightness(1.2); }
        }
        @keyframes preloader-glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 229, 255, 0.15); }
          50% { box-shadow: 0 0 35px rgba(0, 229, 255, 0.4); }
        }
        .preloader-glow-orb {
          animation: preloader-pulse 4s infinite ease-in-out;
        }
        .preloader-outer-ring {
          animation: preloader-spin 3s linear infinite;
        }
        .preloader-inner-ring {
          animation: preloader-spin-reverse 1.8s linear infinite;
        }
        .preloader-pulse-text {
          animation: preloader-breathing 2.5s infinite ease-in-out;
        }
        .preloader-core {
          animation: preloader-glow-pulse 2s infinite ease-in-out;
        }
      `}} />

      {/* Background neon soft ambient light orb */}
      <div 
        className="preloader-glow-orb"
        style={{
          position: 'absolute',
          width: '140px',
          height: '140px',
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          borderRadius: '50%',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

      {/* Visual Loader Graphics */}
      <div style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
        {/* Outer Orbit Dotted Ring */}
        <div 
          className="preloader-outer-ring"
          style={{
            position: 'absolute',
            width: '84px',
            height: '84px',
            border: '2px dotted rgba(255, 255, 255, 0.15)',
            borderRadius: '50%',
            boxSizing: 'border-box'
          }}
        />

        {/* Medium Rotating Spinner */}
        <div 
          className="preloader-inner-ring"
          style={{
            position: 'absolute',
            width: '68px',
            height: '68px',
            border: '3px solid transparent',
            borderTop: `3px solid ${color}`,
            borderBottom: `3px solid ${color}`,
            borderRadius: '50%',
            boxSizing: 'border-box',
            filter: `drop-shadow(0 0 6px ${color})`
          }}
        />

        {/* Glowing Center Core */}
        <div 
          className="preloader-core"
          style={{
            width: '32px',
            height: '32px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1.5px solid rgba(255, 255, 255, 0.15)`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box'
          }}
        >
          {/* Innermost Core Dot */}
          <div style={{
            width: '10px',
            height: '10px',
            backgroundColor: color,
            borderRadius: '50%',
            boxShadow: `0 0 10px ${color}`
          }} />
        </div>
      </div>

      {/* Messages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', zIndex: 1 }}>
        <h4 
          className="preloader-pulse-text"
          style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#fff',
            margin: 0,
            letterSpacing: '0.5px'
          }}
        >
          {message}
        </h4>
        {submessage && (
          <p style={{
            fontSize: '0.85rem',
            color: '#6e7191',
            margin: 0,
            maxWidth: '380px',
            lineHeight: '1.4'
          }}>
            {submessage}
          </p>
        )}
      </div>
    </div>
  );
}

export default Preloader;
