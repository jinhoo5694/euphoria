'use client';

import { useState, useEffect, createElement } from 'react';

interface JarvisTextProps {
  children: string;
  as?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'span';
  className?: string;
  typeSpeed?: number;
}

// Custom typewriter text effect without Arwes
export default function JarvisText({
  children,
  as = 'p',
  className = '',
  typeSpeed = 30
}: JarvisTextProps) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayText('');
    setIsComplete(false);

    let index = 0;
    const interval = setInterval(() => {
      if (index < children.length) {
        setDisplayText(children.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
      }
    }, typeSpeed);

    return () => clearInterval(interval);
  }, [children, typeSpeed]);

  return createElement(
    as,
    { className: `${className} ${!isComplete ? 'cursor-blink' : ''}` },
    displayText
  );
}
