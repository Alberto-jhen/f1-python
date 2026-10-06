import { beforeEach, describe, expect, it, vi } from 'vitest';

const { bucketMock, supabaseMock } = vi.hoisted(() => {
  const bucket = {
    getPublicUrl: vi.fn(),
    upload: vi.fn(),
    remove: vi.fn(),
  };

  return {
    bucketMock: bucket,
    supabaseMock: {
      storage: {
        from: vi.fn(() => bucket),
      },
    },
  };
});

vi.mock('@/lib/supabase', () => ({ supabase: supabaseMock }));

import {
  deleteProfileHeaderImageFromSupabase,
  getProfileHeaderImageUrl,
  uploadProfileHeaderImageToSupabase,
} from './supabaseService';

describe('profile header image storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bucketMock.getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/profile_header_images/user-123/header.png' },
    });
    bucketMock.upload.mockResolvedValue({ error: null });
    bucketMock.remove.mockResolvedValue({ error: null });
  });

  it('builds a cache-busted public URL from the user folder and fixed header path', () => {
    const url = getProfileHeaderImageUrl('user-123');

    expect(supabaseMock.storage.from).toHaveBeenCalledWith('profile_header_images');
    expect(bucketMock.getPublicUrl).toHaveBeenCalledWith('user-123/header.png');
    expect(url).toMatch(/\/user-123\/header\.png\?v=\d+$/);
  });

  it('uploads the cropped image with upsert into the user folder', async () => {
    const file = new File(['image'], 'avatar-cropped.png', { type: 'image/png' });

    const url = await uploadProfileHeaderImageToSupabase(file, 'user-123');

    expect(bucketMock.upload).toHaveBeenCalledWith('user-123/header.png', file, {
      upsert: true,
      contentType: 'image/png',
    });
    expect(url).toContain('/user-123/header.png?v=');
  });

  it('deletes only the fixed header object inside the user folder', async () => {
    await expect(deleteProfileHeaderImageFromSupabase('user-123')).resolves.toBe(true);

    expect(bucketMock.remove).toHaveBeenCalledWith(['user-123/header.png']);
  });

  it('does not create a public URL without a user id', () => {
    expect(getProfileHeaderImageUrl(null)).toBeNull();
    expect(supabaseMock.storage.from).not.toHaveBeenCalled();
  });
});
