'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import ArwesProvider from './components/ArwesProvider';
import CircuitBackground from './components/CircuitBackground';
import { useSound } from './context/SoundContext';
import { GlitchText } from './components/Animated';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('AWAITING AUTHENTICATION...');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [bootSequence, setBootSequence] = useState<string[]>([]);
  const [bootComplete, setBootComplete] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { playSound } = useSound();

  const bootMessages = [
    'INITIALIZING SYSTEM...',
    'LOADING NEURAL INTERFACE...',
    'CONNECTING TO SATELLITES...',
    'ESTABLISHING SECURE CHANNELS...',
    'LOADING AI CORE MODULES...',
    'EUPHORIA SYSTEM ONLINE',
    '',
    'VOICE INTERFACE: DISABLED',
    'BIOMETRIC SCANNER: OFFLINE',
    'MANUAL AUTHENTICATION REQUIRED',
  ];

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check if already authenticated
    const isAuth = sessionStorage.getItem('euphoria_auth');
    if (isAuth === 'true') {
      router.push('/dashboard');
      return;
    }

    // Play power up sound when page loads
    playSound('powerUp');

    // Boot sequence animation with sounds
    let index = 0;
    const interval = setInterval(() => {
      if (index < bootMessages.length) {
        setBootSequence((prev) => [...prev, bootMessages[index]]);

        // Play different sounds based on message content
        if (bootMessages[index].includes('ONLINE')) {
          playSound('success');
        } else if (bootMessages[index] !== '') {
          playSound('typing');
        }

        index++;
      } else {
        clearInterval(interval);
        playSound('notification');
        setTimeout(() => {
          setBootComplete(true);
          setShowInput(true);
          playSound('scan');
          setTimeout(() => inputRef.current?.focus(), 500);
        }, 500);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [router, playSound]);

  const handleAuth = async () => {
    if (!password.trim()) return;

    setIsAuthenticating(true);
    setStatus('AUTHENTICATING...');
    playSound('scan');

    // Simulate authentication delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // For demo purposes, accept any password
    if (password.length >= 4) {
      setStatus('ACCESS GRANTED');
      playSound('success');
      sessionStorage.setItem('euphoria_auth', 'true');

      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push('/dashboard');
    } else {
      setStatus('ACCESS DENIED - INVALID CREDENTIALS');
      playSound('error');
      setIsAuthenticating(false);
      setPassword('');

      setTimeout(() => {
        setStatus('AWAITING AUTHENTICATION...');
      }, 2000);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAuth();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (e.target.value.length > password.length) {
      playSound('typing');
    }
  };

  const handleButtonHover = () => {
    playSound('hover');
  };

  return (
    <ArwesProvider>
      <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <CircuitBackground />

        {/* Scanlines overlay */}
        <div className="fixed inset-0 scanlines pointer-events-none z-50" />

        {/* Main content */}
        <div className="relative z-10 w-full max-w-2xl px-8">
          {/* Logo/Title */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold tracking-wider glow mb-4" style={{ color: 'var(--primary)' }}>
              <GlitchText text="EUPHORIA" />
            </h1>
            <div className="text-sm tracking-widest opacity-60 flicker">
              TECH INTELLIGENCE SYSTEM v2.0.1
            </div>
          </div>

          {/* Boot sequence terminal */}
          <div
            className="glow-box p-6 mb-8 relative overflow-hidden"
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid var(--border)',
            }}
          >
            {/* Scan line effect */}
            <div className="absolute inset-0 scan-line pointer-events-none" />

            <div className="font-mono text-sm leading-relaxed relative z-10">
              {bootSequence.map((msg, i) => {
                const message = msg || '';
                return (
                  <div
                    key={i}
                    className={`${message === '' ? 'h-4' : ''} ${i === bootSequence.length - 1 ? 'slide-in-left' : ''}`}
                    style={{
                      color: message.includes('ONLINE') ? 'var(--accent)' : 'var(--primary)',
                      opacity: message.includes('OFFLINE') || message.includes('DISABLED') ? 0.5 : 1,
                      animationDuration: '0.3s',
                    }}
                  >
                    {message && (
                      <>
                        <span style={{ color: 'var(--secondary)' }}>&gt;</span> {message}
                      </>
                    )}
                  </div>
                );
              })}
              {bootComplete && (
                <div
                  className="mt-4"
                  style={{
                    color: status.includes('GRANTED') ? 'var(--accent)' :
                           status.includes('DENIED') ? 'var(--error)' : 'var(--primary)'
                  }}
                >
                  <span style={{ color: 'var(--secondary)' }}>&gt;</span> {status}
                  <span className="cursor-blink">_</span>
                </div>
              )}
            </div>
          </div>

          {/* Password input */}
          {showInput && (
            <div
              className="glow-box p-6 slide-in-bottom"
              style={{
                background: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid var(--border)',
                animationDuration: '0.5s',
              }}
            >
              <label className="block text-xs tracking-widest mb-3 opacity-60">
                ENTER ACCESS CODE
              </label>
              <div className="flex gap-4">
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  disabled={isAuthenticating}
                  className="flex-1 bg-transparent border px-4 py-3 text-lg tracking-widest focus:outline-none transition-all focus:border-[var(--primary)] focus:shadow-[0_0_15px_rgba(0,212,255,0.3)]"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--primary)',
                  }}
                  placeholder="••••••••"
                  autoComplete="off"
                />
                <button
                  onClick={handleAuth}
                  onMouseEnter={handleButtonHover}
                  disabled={isAuthenticating || !password.trim()}
                  className="px-8 py-3 font-bold tracking-wider transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 interactive-hover"
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--background)',
                    boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)'
                  }}
                >
                  {isAuthenticating ? (
                    <span className="inline-block spinner">⟳</span>
                  ) : (
                    'AUTHENTICATE'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Decorative elements */}
          <div className="mt-12 flex justify-center gap-8 text-xs tracking-widest opacity-40">
            <span className="flicker" style={{ animationDelay: '0s' }}>◆ SECURE CONNECTION</span>
            <span className="flicker" style={{ animationDelay: '1s' }}>◆ ENCRYPTED CHANNEL</span>
            <span className="flicker" style={{ animationDelay: '2s' }}>◆ QUANTUM SHIELD ACTIVE</span>
          </div>
        </div>

        {/* Corner decorations with pulse */}
        <div className="fixed top-4 left-4 w-20 h-20 border-l-2 border-t-2 hud-corner border-glow" style={{ borderColor: 'var(--border)' }} />
        <div className="fixed top-4 right-4 w-20 h-20 border-r-2 border-t-2 hud-corner border-glow" style={{ borderColor: 'var(--border)', animationDelay: '0.5s' }} />
        <div className="fixed bottom-4 left-4 w-20 h-20 border-l-2 border-b-2 hud-corner border-glow" style={{ borderColor: 'var(--border)', animationDelay: '1s' }} />
        <div className="fixed bottom-4 right-4 w-20 h-20 border-r-2 border-b-2 hud-corner border-glow" style={{ borderColor: 'var(--border)', animationDelay: '1.5s' }} />

        {/* Status bar */}
        <div
          className="fixed bottom-0 left-0 right-0 py-2 px-4 flex justify-between text-xs tracking-widest"
          style={{
            background: 'rgba(0, 0, 0, 0.9)',
            borderTop: '1px solid var(--border)'
          }}
        >
          <span>
            SYSTEM STATUS: <span style={{ color: 'var(--accent)' }}>OPERATIONAL</span>
          </span>
          <span style={{ color: 'var(--primary)' }}>{currentTime}</span>
          <span>ENCRYPTION: <span style={{ color: 'var(--accent)' }}>AES-256</span></span>
        </div>
      </main>
    </ArwesProvider>
  );
}
