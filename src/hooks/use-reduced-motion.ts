import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Whether the user asked the system to reduce motion (iOS setting, or prefers-reduced-motion on web). */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled().then((on) => live && setReduced(on)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      live = false;
      sub.remove();
    };
  }, []);
  return reduced;
}
