import { useEffect, useRef, useState } from 'react';

import { Person } from './art/characters';
import { distance, planWalk, type Spot } from './walk';

/** Walking pace, in scene units per second. */
const SPEED = 55;
/** How often the feet swap, in scene units travelled. */
const STRIDE = 6;
/** Standing still this long (ms, randomised up to double) before wandering a little. */
const IDLE_MS = 5000;

type Props = {
  /** Where to go. A new object (even to the same spot) starts a new walk. */
  target: Spot | null;
  /** False under reduce motion or while the screen is hidden: the person then appears at the destination. */
  animate: boolean;
  floorLine: (level: number) => number;
  floorHeight: number;
  /** Where they may wander from a spot on their own, if anywhere. */
  wanderSpan: (spot: Spot) => [number, number] | undefined;
  start: Spot;
};

/**
 * The person, walking. Positions advance on animation frames rather than the scene's stepped clock, so walking
 * is smooth; only this component re-renders while it happens.
 */
export function Walker({ target, animate, floorLine, floorHeight, wanderSpan, start }: Props) {
  const [pos, setPos] = useState<Spot>(start);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [walking, setWalking] = useState(false);
  const [stride, setStride] = useState<0 | 1>(0);
  const path = useRef<Spot[]>([]);
  const travelled = useRef(0);
  const posRef = useRef(pos);

  const moveTo = (p: Spot) => {
    posRef.current = p;
    setPos(p);
  };

  const go = (to: Spot) => {
    const plan = planWalk(posRef.current, to);
    if (!plan.length) return;
    if (!animate) {
      // Reduce motion: no walk, just be there.
      path.current = [];
      moveTo(plan[plan.length - 1]);
      return;
    }
    path.current = plan;
    setWalking(true);
  };

  useEffect(() => {
    if (target) go(target);
    // `go` reads the latest position through a ref; only a new target should start a walk.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  // Step along the path on each frame.
  useEffect(() => {
    if (!walking) return;
    let frame = 0;
    let last = Date.now();
    const tick = () => {
      const now = Date.now();
      let budget = (SPEED * Math.min(now - last, 100)) / 1000;
      last = now;
      let p = posRef.current;
      while (budget > 0 && path.current.length) {
        const next = path.current[0];
        const d = distance(p, next, floorHeight);
        if (next.x !== p.x) setFacing(next.x > p.x ? 1 : -1);
        if (d <= budget) {
          budget -= d;
          travelled.current += d;
          p = next;
          path.current.shift();
        } else {
          const t = budget / d;
          p = { x: p.x + (next.x - p.x) * t, level: p.level + (next.level - p.level) * t };
          travelled.current += budget;
          budget = 0;
        }
      }
      moveTo(p);
      setStride((Math.floor(travelled.current / STRIDE) % 2) as 0 | 1);
      if (path.current.length) frame = requestAnimationFrame(tick);
      else setWalking(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [walking, floorHeight]);

  // If animation stops mid-walk (reduce motion turned on, or the tab hidden), finish the walk at once.
  useEffect(() => {
    if (animate || !path.current.length) return;
    const end = path.current[path.current.length - 1];
    path.current = [];
    moveTo(end);
    setWalking(false);
  }, [animate]);

  // Wander a little when left alone.
  useEffect(() => {
    if (!animate || walking) return;
    const id = setTimeout(() => {
      const span = wanderSpan(posRef.current);
      if (!span) return;
      const x = Math.round(span[0] + Math.random() * (span[1] - span[0]));
      go({ x, level: posRef.current.level });
    }, IDLE_MS * (1 + Math.random()));
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, walking]);

  return <Person x={pos.x} feetY={floorLine(pos.level)} facing={facing} walking={walking} stride={stride} />;
}
