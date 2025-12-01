'use client';

import { ReactNode } from 'react';

interface ArwesProviderProps {
  children: ReactNode;
}

// Simplified provider - Arwes has compatibility issues with React 19
// This is now just a pass-through wrapper
export default function ArwesProvider({ children }: ArwesProviderProps) {
  return <>{children}</>;
}
