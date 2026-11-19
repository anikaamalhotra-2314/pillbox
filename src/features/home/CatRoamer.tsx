import { useEffect, useRef, useState } from 'react';

import { SittingCat, SleepingCat, WalkingCat } from './art/characters';
import { distance, planWalk, stairX, type Spot } from './walk';

/** Padding pace, in scene units per second: slower than the person. */
const SPEED = 30;
const STRIDE = 4;
/** How far above the floor line the cat's paws are drawn, so it stands on the boards rather than their front edge. */
const ABOVE_FLOOR = 10;
const between = (min: number, max: number) => min + Math.random() * (max - min);

type Pose = 'sleep' | 'sit' | 'walk';

type Props = {
  /** False under reduce motion or while the screen is hidden: the cat stays asleep. */
  animate: boolean;
  start: Spot;
  floorLine: (level: number) => number;
  floorHeight: number;
  /** Somewhere new to pad off to, anywhere in the home. */
  wanderTo: () => Spot;
  /** The sofa's seat, if there is a sofa (on the ground floor): sometimes the cat hops up for a nap. */
  sofa?: { x: number; y: number };
};

/**
 * The cat, living its own life all over the home: it naps, wakes up and sits for a bit, pads off somewhere new
 * (up and down the stairs too), and now and then hops onto the sofa to sleep. Nobody places it.
 */
export function CatRoamer({ animate, start, floorLine, floorHeight, wanderTo, sofa }: Props) {
  const [pos, setPos] = useState<Spot>(() => (sofa ? { level: 0, x: sofa.x } : start));
  const [onSofa, setOnSofa] = useState(Boolean(sofa));
  const [pose, setPose] = useState<Pose>('sleep');
  const [facing, setFacing] = useState<1 | -1>(-1);
  const [stride, setStride] = useState<0 | 1>(0);
  const path = useRef<Spot[]>([]);
  const thenSofa = useRef(false);
  const posRef = useRef(pos);

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
      if (nap && !sofa) {
        setPose('sleep');
        return;
      }
      const from = onSofa && sofa ? { level: 0, x: sofa.x } : posRef.current;
      const to = nap && sofa && !onSofa ? { level: 0, x: sofa.x } : wanderTo();
      thenSofa.current = nap && Boolean(sofa) && !onSofa;
      posRef.current = from;
      setPos(from);
      setOnSofa(false);
      path.current = planWalk(from, to);
      if (!path.current.length) {
        setPose('sit');
        return;
      }
      setPose('walk');
    }, pose === 'sleep' ? between(8000, 16000) : between(3000, 7000));
    return () => clearTimeout(id);
  }, [animate, pose, sofa, onSofa, wanderTo]);

  // Pad along the path on animation frames, stairs and all.
  useEffect(() => {
    if (!animate || pose !== 'walk') return;
    let frame = 0;
    let last = Date.now();
    let travelled = 0;
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
          travelled += d;
          p = next;
          path.current.shift();
        } else {
          const t = budget / d;
          p = { x: p.x + (next.x - p.x) * t, level: p.level + (next.level - p.level) * t };
          travelled += budget;
          budget = 0;
        }
      }
      posRef.current = p;
      setPos(p);
      setStride((Math.floor(travelled / STRIDE) % 2) as 0 | 1);
      if (path.current.length) {
        frame = requestAnimationFrame(tick);
        return;
      }
      if (thenSofa.current) {
        setOnSofa(true);
        setPose('sleep');
      } else {
        setPose('sit');
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, pose, floorHeight]);

  // On the sofa, the cat is wherever the sofa is (it may have been moved since).
  const onStairs = !Number.isInteger(pos.level);
  const x = onSofa && sofa ? sofa.x : onStairs ? stairX(pos.level) : pos.x;
  const y = onSofa && sofa ? sofa.y : floorLine(pos.level) - ABOVE_FLOOR;
  // With animation off, the cat simply sleeps where it is.
  const shown: Pose = animate ? pose : 'sleep';
  if (shown === 'walk') return <WalkingCat x={x} y={y} facing={facing} stride={stride} />;
  if (shown === 'sit') return <SittingCat x={x} y={y} facing={facing} />;
  return <SleepingCat x={x} y={y} facing={facing} />;
}
