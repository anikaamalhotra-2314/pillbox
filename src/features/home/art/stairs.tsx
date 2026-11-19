import { Fragment, type ReactElement } from 'react';
import { Rect } from 'react-native-svg';

import { scene } from '@/design-system/tokens';
import { FLOOR_HEIGHT } from '../layout';
import { stairAngle } from '../walk';
import { PixelPost } from './frame';

const t = scene.timber;

/** Height between treads, and how far a tread reaches from the pole, in scene units. */
const RISE = 10;
const REACH = 21;
const POLE = 4;
const BALUSTER = 14;

type Tread = { y: number; x0: number; x1: number; front: boolean; endX: number };

/**
 * A spiral staircase seen from the side, in the owner's pixel style: a timber pole with wedge treads winding round
 * it from `footY` up to `topY`. Treads behind the pole are darker and drawn first; those in front are lit and
 * drawn over it. Balusters stand at each tread's outer end, joined by a handrail. It turns the same way as the
 * person climbing it (see `stairAngle`), and nothing is drawn above `topY`.
 */
export function SpiralStairs({ cx, footY, topY }: { cx: number; footY: number; topY: number }) {
  const count = Math.floor((footY - topY) / RISE);
  const treads: Tread[] = Array.from({ length: count }, (_, i) => {
    const angle = stairAngle(((i + 0.5) * RISE) / FLOOR_HEIGHT);
    const reach = Math.max(4, Math.round(Math.abs(Math.sin(angle)) * REACH));
    const right = Math.sin(angle) >= 0;
    const x0 = right ? cx + POLE / 2 : cx - POLE / 2 - reach;
    const x1 = x0 + reach;
    return { y: footY - (i + 1) * RISE, x0, x1, front: Math.cos(angle) > 0, endX: right ? x1 - 1 : x0 };
  });

  const tread = ({ y, x0, x1, front }: Tread, key: string) => {
    const w = x1 - x0;
    const rows = front ? [t.outline, t.light, t.body, t.outline] : [t.outline, t.body, t.dark, t.outline];
    return (
      <Fragment key={key}>
        {rows.map((fill, r) => <Rect key={`r${r}`} x={x0} y={y + r} width={w} height={1} fill={fill} />)}
        <Rect x={x0} y={y} width={1} height={4} fill={t.outline} />
        <Rect x={x1 - 1} y={y} width={1} height={4} fill={t.outline} />
      </Fragment>
    );
  };

  // A stepped one-pixel line from one baluster top to the next, so the rail stays crisp.
  const rail = (a: Tread, b: Tread, front: boolean, key: string) => {
    const [ax, ay, bx, by] = [a.endX, a.y - BALUSTER, b.endX, b.y - BALUSTER];
    const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay), 1);
    const out: ReactElement[] = [];
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(ax + ((bx - ax) * s) / steps);
      const y = Math.round(ay + ((by - ay) * s) / steps);
      if (y - 1 < topY) continue;
      out.push(<Rect key={`${key}${s}`} x={x} y={y} width={1} height={1} fill={front ? t.dark : t.seam} />);
      if (front) out.push(<Rect key={`${key}${s}h`} x={x} y={y - 1} width={1} height={1} fill={t.light} />);
    }
    return out;
  };

  const layer = (front: boolean) => (
    <>
      {treads.map((tr, i) => tr.front === front && (
        <Rect key={`b${i}`} x={tr.endX} y={Math.max(topY, tr.y - BALUSTER)} width={1} height={tr.y - Math.max(topY, tr.y - BALUSTER)} fill={front ? t.dark : t.seam} />
      ))}
      {treads.slice(1).map((tr, i) => {
        const prev = treads[i];
        return prev.front === front || tr.front === front ? <Fragment key={`h${i}`}>{rail(prev, tr, front && prev.front && tr.front, `h${i}`)}</Fragment> : null;
      })}
      {treads.map((tr, i) => tr.front === front && tread(tr, `t${i}`))}
    </>
  );

  return (
    <>
      {layer(false)}
      <PixelPost x={cx - POLE / 2} y={topY} w={POLE} h={footY - topY} />
      {layer(true)}
    </>
  );
}
