import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  maybeSingle: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('@/lib/supabase.js', () => ({
  supabase: {
    rpc: mocks.rpc,
    from: mocks.from,
    auth: {
      updateUser: mocks.updateUser,
    },
  },
}));

import { checkUsernameAvailability, updateUsernameForUser } from './usernameService.js';

describe('usernameService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    mocks.from.mockReturnValue({ update: mocks.update });
    mocks.update.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockReturnValue({ select: mocks.select });
    mocks.select.mockReturnValue({ maybeSingle: mocks.maybeSingle });
    mocks.maybeSingle.mockResolvedValue({ data: { id: 'profile-1' }, error: null });
    mocks.updateUser.mockResolvedValue({ data: { user: { id: 'profile-1' } }, error: null });
  });

  it('checks availability using a trimmed username', async () => {
    await expect(checkUsernameAvailability('  alberto_1  ')).resolves.toBe(true);

    expect(mocks.rpc).toHaveBeenCalledWith('is_username_available', {
      p_username: 'alberto_1',
      p_profile_id: null,
    });
  });

  it('updates the profile and auth metadata after availability succeeds', async () => {
    await expect(updateUsernameForUser('  alberto_1  ', 'profile-1')).resolves.toBe('alberto_1');

    expect(mocks.rpc).toHaveBeenCalledWith('is_username_available', {
      p_username: 'alberto_1',
      p_profile_id: 'profile-1',
    });
    expect(mocks.from).toHaveBeenCalledWith('profiles');
    expect(mocks.update).toHaveBeenCalledWith({ username: 'alberto_1' });
    expect(mocks.eq).toHaveBeenCalledWith('id', 'profile-1');
    expect(mocks.updateUser).toHaveBeenCalledWith({
      data: { username: 'alberto_1' },
    });
  });

  it('rejects an unavailable username before updating the profile', async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });

    await expect(updateUsernameForUser('alberto_1', 'profile-1')).rejects.toMatchObject({
      code: 'USERNAME_TAKEN',
    });

    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('propagates a database unique violation from the profile update', async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: null,
      error: {
        code: '23505',
        message: 'duplicate key violates profiles_username_ci_unique',
      },
    });

    await expect(updateUsernameForUser('alberto_1', 'profile-1')).rejects.toMatchObject({
      code: '23505',
    });
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
});
