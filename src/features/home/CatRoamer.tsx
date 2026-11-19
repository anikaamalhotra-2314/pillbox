import { useEffect, useRef, useState } from 'react';

import { SittingCat, SleepingCat, WalkingCat } from './art/characters';

/** Padding pace, in scene units per second: slower than the person. */
const SPEED = 30;
const STRIDE = 4;
const between = (min: number, max: number) => min + Math.random() * (max - min);

type Pose = 'sleep' | 'sit' | 'walk';

type Props = {
  /** False under reduce motion or while the screen is hidden: the cat stays asleep. */
  animate: boolean;
  /** Where it can walk, in house units, and the y of the floor there. */
  span: [number, number];
  floorY: number;
  /** The sofa's seat, if there is a sofa: sometimes the cat hops up for a nap. */
  sofa?: { x: number; y: number };
};

/**
 * The cat, living its own life in the living room: it naps, wakes up and sits for a bit, pads somewhere new,
 * and now and then hops onto the sofa to sleep. Nobody places it.
 */
export function CatRoamer({ animate, span, floorY, sofa }: Props) {
  const [x, setX] = useState(() => sofa?.x ?? (span[0] + span[1]) / 2);
  const [onSofa, setOnSofa] = useState(Boolean(sofa));
  const [pose, setPose] = useState<Pose>('sleep');
  const [facing, setFacing] = useState<1 | -1>(-1);
  const [stride, setStride] = useState<0 | 1>(0);
  const goal = useRef<{ x: number; thenSofa: boolean } | null>(null);
  const xRef = useRef(x);

  // Decide what to do next after a rest.
  useEffect(() => {
    if (!animate || pose === 'walk') return;
    const id = setTimeout(() => {
      if (pose === 'sleep') {
        setPose('sit');
        return;
      }
      // Sitting: wander somewhere, or go for a nap (on the sofa if there is one, sometimes).
      const nap = Math.random() < 0.35;
      if (nap && sofa && !onSofa) {
        goal.current = { x: sofa.x, thenSofa: true };
      } else if (nap) {
        setPose('sleep');
        return;
      } else {
        goal.current = { x: Math.round(between(span[0], span[1])), thenSofa: false };
      }
      if (onSofa && sofa) {
        // Hop down from wherever the sofa is now.
        xRef.current = sofa.x;
        setX(sofa.x);
      }
      setOnSofa(false);
      setFacing(goal.current.x >= xRef.current ? 1 : -1);
      setPose('walk');
    }, pose === 'sleep' ? between(8000, 16000) : between(3000, 7000));
    return () => clearTimeout(id);
  }, [animate, pose, sofa, onSofa, span]);

  // Walk toward the goal on animation frames.
  useEffect(() => {
    if (!animate || pose !== 'walk') return;
    let frame = 0;
    let last = Date.now();
    let travelled = 0;
    const tick = () => {
      const now = Date.now();
      const step = (SPEED * Math.min(now - last, 100)) / 1000;
      last = now;
      const g = goal.current;
      if (!g) return;
      const remaining = g.x - xRef.current;
      const move = Math.sign(remaining) * Math.min(Math.abs(remaining), step);
      xRef.current += move;
      travelled += Math.abs(move);
      setX(xRef.current);
      setStride((Math.floor(travelled / STRIDE) % 2) as 0 | 1);
      if (Math.abs(g.x - xRef.current) < 0.5) {
        goal.current = null;
        if (g.thenSofa) {
          setOnSofa(true);
          setPose('sleep');
        } else {
          setPose('sit');
        }
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, pose]);

  // On the sofa, the cat is wherever the sofa is (it may have been moved since).
  const shownX = onSofa && sofa ? sofa.x : x;

  const y = onSofa && sofa ? sofa.y : floorY;
  // With animation off, the cat simply sleeps where it is.
  const shown: Pose = animate ? pose : 'sleep';
  if (shown === 'walk') return <WalkingCat x={shownX} y={y} facing={facing} stride={stride} />;
  if (shown === 'sit') return <SittingCat x={shownX} y={y} facing={facing} />;
  return <SleepingCat x={shownX} y={y} facing={facing} />;
}
