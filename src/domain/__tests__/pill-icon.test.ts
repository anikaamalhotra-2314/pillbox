import { DEFAULT_PILL_ICON, isPillIcon, PILL_COLORS, PILL_SHAPES, pillIconName, pillIconOf } from '../pill-icon';

describe('pill icon catalog', () => {
  it('accepts every shape and color combination', () => {
    for (const shape of PILL_SHAPES) for (const color of PILL_COLORS) expect(isPillIcon({ shape: shape.id, color: color.id })).toBe(true);
  });
  it('rejects anything else', () => {
    for (const bad of [null, undefined, 'capsule', 5, {}, { shape: 'capsule' }, { color: 'mint' }, { shape: 'star', color: 'mint' }, { shape: 'capsule', color: 'red' }]) {
      expect(isPillIcon(bad)).toBe(false);
    }
  });
  it('the default is the Figma icon: a scored periwinkle tablet', () => {
    expect(DEFAULT_PILL_ICON).toEqual({ shape: 'scored', color: 'periwinkle' });
    expect(isPillIcon(DEFAULT_PILL_ICON)).toBe(true);
  });
  it('falls back to the default for medications saved without an icon', () => {
    expect(pillIconOf({})).toEqual(DEFAULT_PILL_ICON);
    expect(pillIconOf({ icon: { shape: 'capsule', color: 'mint' } })).toEqual({ shape: 'capsule', color: 'mint' });
  });
  it('names an icon for screen readers', () => {
    expect(pillIconName({ shape: 'capsule', color: 'mint' })).toBe('Mint capsule');
    expect(pillIconName(DEFAULT_PILL_ICON)).toBe('Periwinkle scored tablet');
  });
  it('has unique ids and names, so every option is distinguishable without seeing it', () => {
    for (const list of [PILL_SHAPES, PILL_COLORS]) {
      expect(new Set(list.map((x) => x.id)).size).toBe(list.length);
      expect(new Set(list.map((x) => x.name)).size).toBe(list.length);
    }
  });
});
