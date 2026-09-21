// The pill icon library: a shape and a color, chosen per medication. The art lives in the design system;
// this file is just the catalog of valid choices, so storage and forms can check them without any UI code.

export const PILL_SHAPES = [
  { id: 'scored', name: 'Scored tablet' },
  { id: 'round', name: 'Round tablet' },
  { id: 'oval', name: 'Oval tablet' },
  { id: 'capsule', name: 'Capsule' },
  { id: 'softgel', name: 'Softgel' },
  { id: 'square', name: 'Square tablet' },
] as const;

export const PILL_COLORS = [
  { id: 'periwinkle', name: 'Periwinkle' },
  { id: 'peach', name: 'Peach' },
  { id: 'yellow', name: 'Yellow' },
  { id: 'mint', name: 'Mint' },
  { id: 'lilac', name: 'Lilac' },
  { id: 'rose', name: 'Rose' },
] as const;

export type PillShape = (typeof PILL_SHAPES)[number]['id'];
export type PillColor = (typeof PILL_COLORS)[number]['id'];

export interface PillIcon {
  shape: PillShape;
  color: PillColor;
}

/** The icon in the Figma: a scored periwinkle tablet. Used for new medications and for older saved ones. */
export const DEFAULT_PILL_ICON: PillIcon = { shape: 'scored', color: 'periwinkle' };

export function isPillIcon(v: unknown): v is PillIcon {
  if (typeof v !== 'object' || v === null) return false;
  const { shape, color } = v as Record<string, unknown>;
  return PILL_SHAPES.some((s) => s.id === shape) && PILL_COLORS.some((c) => c.id === color);
}

/** A medication's icon, falling back to the default for ones saved before icons existed. */
export function pillIconOf(m: { icon?: PillIcon }): PillIcon {
  return m.icon ?? DEFAULT_PILL_ICON;
}

/** "Mint capsule", for labels. */
export function pillIconName(icon: PillIcon): string {
  const color = PILL_COLORS.find((c) => c.id === icon.color)!.name;
  const shape = PILL_SHAPES.find((s) => s.id === icon.shape)!.name.toLowerCase();
  return `${color} ${shape}`;
}
