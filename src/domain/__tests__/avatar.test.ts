import { avatarOf, DEFAULT_AVATAR, withAvatar } from '../avatar';

describe('avatar', () => {
  it('comes as the default, and fills in anything not chosen', () => {
    expect(avatarOf(undefined)).toEqual(DEFAULT_AVATAR);
    expect(avatarOf({ hair: 'black' })).toEqual({ ...DEFAULT_AVATAR, hair: 'black' });
  });
  it('ignores choices that are not offered', () => {
    expect(avatarOf({ hair: 'green' as never })).toEqual(DEFAULT_AVATAR);
  });
  it('keeps only what differs from the default', () => {
    expect(withAvatar(undefined, { hair: 'black', skin: DEFAULT_AVATAR.skin })).toEqual({ hair: 'black' });
    expect(withAvatar({ hair: 'black' }, { hair: DEFAULT_AVATAR.hair })).toBeUndefined();
  });
});
