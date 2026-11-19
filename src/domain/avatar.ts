// How the person in the little home looks: skin, hair, top and bottoms, each chosen from a short list.
// Only ids live here; the colors are the design system's (scene.avatar).

export const SKIN_TONES = [
  { id: 'fair', name: 'Fair' },
  { id: 'light', name: 'Light' },
  { id: 'medium', name: 'Medium' },
  { id: 'tan', name: 'Tan' },
  { id: 'brown', name: 'Brown' },
  { id: 'deep', name: 'Deep' },
] as const;
export const HAIR_COLORS = [
  { id: 'auburn', name: 'Auburn' },
  { id: 'brown', name: 'Brown' },
  { id: 'black', name: 'Black' },
  { id: 'blonde', name: 'Blonde' },
  { id: 'ginger', name: 'Ginger' },
  { id: 'grey', name: 'Grey' },
] as const;
export const TOP_COLORS = [
  { id: 'rust', name: 'Rust' },
  { id: 'cornflower', name: 'Cornflower' },
  { id: 'mustard', name: 'Mustard' },
  { id: 'sage', name: 'Sage' },
  { id: 'maroon', name: 'Maroon' },
  { id: 'cream', name: 'Cream' },
] as const;
export const BOTTOM_COLORS = [
  { id: 'denim', name: 'Denim' },
  { id: 'charcoal', name: 'Charcoal' },
  { id: 'khaki', name: 'Khaki' },
  { id: 'brown', name: 'Brown' },
  { id: 'olive', name: 'Olive' },
] as const;

export type SkinTone = (typeof SKIN_TONES)[number]['id'];
export type HairColor = (typeof HAIR_COLORS)[number]['id'];
export type TopColor = (typeof TOP_COLORS)[number]['id'];
export type BottomColor = (typeof BOTTOM_COLORS)[number]['id'];

export interface Avatar {
  skin: SkinTone;
  hair: HairColor;
  top: TopColor;
  bottom: BottomColor;
}

export const DEFAULT_AVATAR: Avatar = { skin: 'fair', hair: 'auburn', top: 'rust', bottom: 'denim' };

const OPTIONS = { skin: SKIN_TONES, hair: HAIR_COLORS, top: TOP_COLORS, bottom: BOTTOM_COLORS } as const;

/** Whether `value` is one of the choices for `part`. */
export function isAvatarChoice(part: keyof Avatar, value: unknown): boolean {
  return (OPTIONS[part] as readonly { id: string }[]).some((o) => o.id === value);
}

/** The person as chosen, with anything not chosen (or no longer offered) as it comes. */
export function avatarOf(saved: Partial<Avatar> | undefined): Avatar {
  const out = { ...DEFAULT_AVATAR };
  for (const part of Object.keys(OPTIONS) as (keyof Avatar)[]) {
    const v = saved?.[part];
    if (isAvatarChoice(part, v)) (out as Record<keyof Avatar, string>)[part] = v as string;
  }
  return out;
}

/** Only what differs from how the person comes is kept, like the rest of the decor. */
export function withAvatar(saved: Partial<Avatar> | undefined, change: Partial<Avatar>): Partial<Avatar> | undefined {
  const next = { ...saved, ...change } as Partial<Avatar>;
  for (const part of Object.keys(next) as (keyof Avatar)[]) if (!isAvatarChoice(part, next[part]) || next[part] === DEFAULT_AVATAR[part]) delete next[part];
  return Object.keys(next).length ? next : undefined;
}
