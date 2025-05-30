import React, { useEffect, useRef } from 'react';
import { ReactP5Wrapper } from 'react-p5-wrapper';
import { gsap } from 'gsap';

// Real-time waveform visualization using p5.js
function waveformSketch(p) {
  let y = 0;
  let t = 0;
  p.setup = () => {
    p.createCanvas(400, 100);
    p.background(30);
  };
  p.draw = () => {
    p.background(30);
    p.stroke(0, 255, 128);
    p.strokeWeight(2);
    p.noFill();
    p.beginShape();
    for (let x = 0; x < p.width; x += 4) {
      // Simulate waveform with noise (replace with real audio data for production)
      y = p.height / 2 + p.noise(x * 0.01, t) * 40 - 20;
      p.vertex(x, y);
    }
    p.endShape();
    t += 0.01;
  };
}

// p5.js sketch for animated background
function backgroundSketch(p) {
  let t = 0;
  p.setup = () => {
    p.createCanvas(window.innerWidth, window.innerHeight);
    p.noStroke();
  };
  p.draw = () => {
    p.clear();
    for (let i = 0; i < 20; i++) {
      p.fill(0, 255, 128, 30);
      let x = p.width / 2 + Math.sin(t + i) * (200 + 40 * Math.sin(t + i * 2));
      let y = p.height / 2 + Math.cos(t + i) * (120 + 30 * Math.cos(t + i * 2));
      p.ellipse(x, y, 80 + 20 * Math.sin(t + i), 80 + 20 * Math.cos(t + i));
    }
    t += 0.01;
  };
  p.windowResized = () => {
    p.resizeCanvas(window.innerWidth, window.innerHeight);
  };
}

export default function AudioWaveform() {
  const containerRef = useRef();
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1, ease: 'elastic.out(1, 0.5)' }
      );
    }
  }, []);
  return (
    <div ref={containerRef} style={{ margin: '1rem 0', position: 'relative', zIndex: 1 }}>
      {/* Animated p5.js background for the entire UI */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <ReactP5Wrapper sketch={backgroundSketch} />
      </div>
      <div style={{ position: 'relative', zIndex: 2 }}>
        <h4 style={{ fontSize: '2rem', fontWeight: 700, color: '#0fa' }}>
          Live Audio Waveform (p5.js + GSAP)
        </h4>
        <ReactP5Wrapper sketch={waveformSketch} />
        {/* Example animated chat UI with GSAP */}
        <div
          id="chat-ui"
          style={{
            margin: '2rem auto',
            maxWidth: 500,
            background: 'rgba(0,0,0,0.7)',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 4px 32px #0fa4',
          }}
        >
          <AnimatedChat />
        </div>
      </div>
    </div>
  );
}

// Animated chat UI using GSAP for message transitions
function AnimatedChat() {
  const [messages, setMessages] = React.useState([
    { role: 'user', text: 'Hello, team!' },
    { role: 'ai', text: 'Welcome to the AI meeting co-pilot.' },
    { role: 'user', text: 'Show me the latest action items.' },
    { role: 'ai', text: '1. Review Q2 roadmap\n2. Update CRM\n3. Schedule follow-up' },
  ]);
  const chatRef = useRef();
  useEffect(() => {
    if (chatRef.current) {
      gsap.fromTo(
        chatRef.current.children,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.15, duration: 0.7, ease: 'power3.out' }
      );
    }
  }, [messages]);
  return (
    <div ref={chatRef}>
      {messages.map((msg, i) => (
        <div
          key={i}
          style={{
            background: msg.role === 'ai' ? 'rgba(0,255,128,0.12)' : 'rgba(255,255,255,0.08)',
            color: msg.role === 'ai' ? '#0fa' : '#fff',
            borderRadius: 12,
            padding: '10px 16px',
            margin: '8px 0',
            fontWeight: 500,
            fontFamily: 'monospace',
            fontSize: 18,
            boxShadow: msg.role === 'ai' ? '0 2px 12px #0fa2' : 'none',
          }}
        >
          <b>{msg.role === 'ai' ? 'AI' : 'User'}:</b> {msg.text}
        </div>
      ))}
    </div>
  );
}
