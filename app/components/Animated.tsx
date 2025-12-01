'use client';

import { useEffect, useState, useRef, type ReactNode, type CSSProperties } from 'react';
import { useSound } from '../context/SoundContext';

type AnimationType =
  | 'fadeIn'
  | 'fadeInUp'
  | 'fadeInDown'
  | 'fadeInLeft'
  | 'fadeInRight'
  | 'scaleIn'
  | 'glitch'
  | 'typewriter'
  | 'scanline'
  | 'flicker';

interface AnimatedProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  stagger?: number;
  index?: number;
  playSound?: boolean;
  soundType?: 'powerUp' | 'click' | 'notification' | 'scan';
  className?: string;
  style?: CSSProperties;
  onAnimationComplete?: () => void;
}

const animationKeyframes: Record<AnimationType, string> = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,
  fadeInUp: `
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
  fadeInDown: `
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
  fadeInLeft: `
    @keyframes fadeInLeft {
      from { opacity: 0; transform: translateX(-20px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `,
  fadeInRight: `
    @keyframes fadeInRight {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `,
  scaleIn: `
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
  `,
  glitch: `
    @keyframes glitch {
      0% { opacity: 0; transform: translateX(-5px); filter: hue-rotate(90deg); }
      20% { opacity: 0.5; transform: translateX(5px); }
      40% { opacity: 0.3; transform: translateX(-3px); filter: hue-rotate(180deg); }
      60% { opacity: 0.7; transform: translateX(3px); }
      80% { opacity: 0.9; transform: translateX(-1px); filter: hue-rotate(0deg); }
      100% { opacity: 1; transform: translateX(0); filter: hue-rotate(0deg); }
    }
  `,
  typewriter: `
    @keyframes typewriter {
      from { width: 0; }
      to { width: 100%; }
    }
  `,
  scanline: `
    @keyframes scanline {
      0% { clip-path: inset(100% 0 0 0); }
      100% { clip-path: inset(0 0 0 0); }
    }
  `,
  flicker: `
    @keyframes flicker {
      0% { opacity: 0; }
      10% { opacity: 0.8; }
      20% { opacity: 0.2; }
      30% { opacity: 0.9; }
      40% { opacity: 0.4; }
      50% { opacity: 1; }
      60% { opacity: 0.7; }
      70% { opacity: 1; }
      80% { opacity: 0.9; }
      90% { opacity: 1; }
      100% { opacity: 1; }
    }
  `,
};

export default function Animated({
  children,
  animation = 'fadeIn',
  delay = 0,
  duration = 0.4,
  stagger = 0,
  index = 0,
  playSound: shouldPlaySound = false,
  soundType = 'click',
  className = '',
  style = {},
  onAnimationComplete,
}: AnimatedProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const { playSound } = useSound();

  const totalDelay = delay + (stagger * index);

  useEffect(() => {
    // Inject keyframes if not already present
    const styleId = `animated-keyframes-${animation}`;
    if (!document.getElementById(styleId)) {
      const styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.textContent = animationKeyframes[animation];
      document.head.appendChild(styleElement);
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
      if (shouldPlaySound) {
        playSound(soundType);
      }
    }, totalDelay * 1000);

    return () => clearTimeout(timer);
  }, [animation, totalDelay, shouldPlaySound, soundType, playSound]);

  useEffect(() => {
    if (isVisible && !hasAnimated) {
      const timer = setTimeout(() => {
        setHasAnimated(true);
        onAnimationComplete?.();
      }, duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, hasAnimated, duration, onAnimationComplete]);

  const animationStyle: CSSProperties = isVisible
    ? {
        animation: `${animation} ${duration}s ease-out forwards`,
        ...style,
      }
    : {
        opacity: 0,
        ...style,
      };

  return (
    <div ref={elementRef} className={className} style={animationStyle}>
      {children}
    </div>
  );
}

// Stagger container for multiple animated children
interface StaggerContainerProps {
  children: ReactNode[];
  animation?: AnimationType;
  stagger?: number;
  baseDelay?: number;
  duration?: number;
  className?: string;
}

export function StaggerContainer({
  children,
  animation = 'fadeInUp',
  stagger = 0.1,
  baseDelay = 0,
  duration = 0.4,
  className = '',
}: StaggerContainerProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <Animated
          key={index}
          animation={animation}
          delay={baseDelay}
          stagger={stagger}
          index={index}
          duration={duration}
        >
          {child}
        </Animated>
      ))}
    </div>
  );
}

// Glitch text effect
interface GlitchTextProps {
  text: string;
  className?: string;
  style?: CSSProperties;
}

export function GlitchText({ text, className = '', style = {} }: GlitchTextProps) {
  return (
    <span
      className={`glitch-text ${className}`}
      style={style}
      data-text={text}
    >
      {text}
    </span>
  );
}

// Typewriter effect
interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
  playTypingSound?: boolean;
}

export function TypewriterText({
  text,
  speed = 50,
  delay = 0,
  className = '',
  onComplete,
  playTypingSound = true,
}: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const { playSound } = useSound();

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setIsStarted(true);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!isStarted) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayText(text.slice(0, currentIndex + 1));
        if (playTypingSound && text[currentIndex] !== ' ') {
          playSound('typing');
        }
        currentIndex++;
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [isStarted, text, speed, playSound, playTypingSound, onComplete]);

  return (
    <span className={className}>
      {displayText}
      <span className="cursor-blink">_</span>
    </span>
  );
}

// Number counter animation
interface CounterProps {
  end: number;
  start?: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function Counter({
  end,
  start = 0,
  duration = 1,
  delay = 0,
  prefix = '',
  suffix = '',
  className = '',
}: CounterProps) {
  const [count, setCount] = useState(start);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setIsStarted(true);
    }, delay * 1000);

    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!isStarted) return;

    const steps = 60;
    const increment = (end - start) / steps;
    let current = start;
    let step = 0;

    const interval = setInterval(() => {
      if (step < steps) {
        current += increment;
        setCount(Math.round(current));
        step++;
      } else {
        setCount(end);
        clearInterval(interval);
      }
    }, (duration * 1000) / steps);

    return () => clearInterval(interval);
  }, [isStarted, start, end, duration]);

  return (
    <span className={className}>
      {prefix}{count}{suffix}
    </span>
  );
}

// Pulse animation wrapper
interface PulseProps {
  children: ReactNode;
  color?: string;
  intensity?: number;
  className?: string;
}

export function Pulse({ children, color = 'var(--primary)', intensity = 20, className = '' }: PulseProps) {
  return (
    <div
      className={`animate-pulse-glow ${className}`}
      style={{
        '--pulse-color': color,
        '--pulse-intensity': `${intensity}px`,
      } as CSSProperties}
    >
      {children}
    </div>
  );
}
