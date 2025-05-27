import { useEffect, useState } from 'react';

/**
 * Hook to safely handle hydration mismatch issues
 * Returns true only after the component has hydrated on the client
 */
export function useIsomorphicLayoutEffect() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}

/**
 * Hook to safely access client-side only features
 * Prevents hydration mismatches by ensuring code only runs after hydration
 */
export function useClientOnly() {
  return useIsomorphicLayoutEffect();
} 