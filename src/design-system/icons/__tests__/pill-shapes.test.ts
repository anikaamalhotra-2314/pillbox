import { PILL_COLORS, PILL_SHAPES } from '@/domain/pill-icon';
import { pillColors } from '@/design-system/tokens';
import { GRID, pillBitmaps } from '../pill-shapes';

// The art is data, so its integrity can be checked without drawing anything.
describe('pill shape art', () => {
  for (const { id } of PILL_SHAPES) {
    describe(id, () => {
      const rows = pillBitmaps[id];
      it(`is a ${GRID}x${GRID} grid of known symbols`, () => {
        expect(rows).toHaveLength(GRID);
        for (const row of rows) {
          expect(row).toHaveLength(GRID);
          expect(row).toMatch(/^[.#odhx]+$/);
        }
      });
      it('has a closed outline: no colored pixel touches empty space or the edge', () => {
        rows.forEach((row, r) =>
          [...row].forEach((ch, c) => {
            if (!'odhx'.includes(ch)) return;
            for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
              const n = rows[r + dr]?.[c + dc];
              expect(n && n !== '.').toBe(true);
            }
          }),
        );
      });
      it('has a body of at least 40 filled pixels and an outline', () => {
        const flat = rows.join('');
        expect([...flat].filter((ch) => 'odhx'.includes(ch)).length).toBeGreaterThanOrEqual(40);
        expect(flat).toContain('#');
      });
    });
  }
  it('every shape looks different', () => {
    expect(new Set(PILL_SHAPES.map((s) => pillBitmaps[s.id].join('|'))).size).toBe(PILL_SHAPES.length);
  });
  it('the scored tablet has a score line the plain round one lacks', () => {
    const inner = (rows: string[]) => rows.slice(4, 12).join('').replace(/^[.#]+|[.#]+$/g, '');
    expect(pillBitmaps.scored.join('')).not.toBe(pillBitmaps.round.join(''));
    expect(inner(pillBitmaps.scored)).toContain('#');
  });
});

describe('pill colors', () => {
  it('has a fill and a shade for exactly the catalog colors', () => {
    expect(Object.keys(pillColors).sort()).toEqual(PILL_COLORS.map((c) => c.id).sort());
  });
  it('gives every color its own fill and a shade different from it', () => {
    const fills = PILL_COLORS.map((c) => pillColors[c.id].fill);
    expect(new Set(fills).size).toBe(fills.length);
    for (const c of PILL_COLORS) expect(pillColors[c.id].shade).not.toBe(pillColors[c.id].fill);
  });
});
