import { beforeEach, describe, expect, it, vi } from 'vitest';

const { bucketMock, profileEqMock, profileUpdateMock, supabaseMock, uploadImageMock } = vi.hoisted(() => {
  const bucket = {
    getPublicUrl: vi.fn(),
    upload: vi.fn(),
    remove: vi.fn(),
  };
  const profileEq = vi.fn();
  const profileUpdate = vi.fn(() => ({ eq: profileEq }));

  return {
    bucketMock: bucket,
    profileEqMock: profileEq,
    profileUpdateMock: profileUpdate,
    uploadImageMock: vi.fn(),
    supabaseMock: {
      storage: {
        from: vi.fn(() => bucket),
      },
      from: vi.fn(() => ({ update: profileUpdate })),
    },
  };
});

vi.mock('@/lib/supabase', () => ({ supabase: supabaseMock }));
vi.mock('@/service/imageUploadService', () => ({ uploadImageToService: uploadImageMock }));

import {
  deleteProfileHeaderImageFromSupabase,
  getProfileHeaderImageUrl,
  uploadAvatarToSupabase,
  uploadProfileHeaderImageToSupabase,
} from './supabaseService';

describe('profile header image storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bucketMock.getPublicUrl.mockImplementation((filePath) => ({
      data: { publicUrl: `https://example.supabase.co/storage/v1/object/public/${filePath}` },
    }));
    bucketMock.upload.mockResolvedValue({ error: null });
    bucketMock.remove.mockResolvedValue({ error: null });
    profileEqMock.mockResolvedValue({ error: null });
    uploadImageMock.mockResolvedValue({
      bucket_name: 'profile_header_images',
      object_path: 'user-123/header.webp',
      content_type: 'image/webp',
    });
  });

  it('uploads avatars as WebP, updates the profile URL, and removes the old PNG', async () => {
    const file = new File(['image'], 'avatar-cropped.png', { type: 'image/png' });
    uploadImageMock.mockResolvedValue({
      bucket_name: 'profile_avatars',
      object_path: 'user-123/avatar.webp',
      content_type: 'image/webp',
    });

    const url = await uploadAvatarToSupabase(file, 'user-123');

    expect(uploadImageMock).toHaveBeenCalledWith(file, {
      bucketName: 'profile_avatars',
      objectPath: 'user-123/avatar.webp',
    });
    expect(profileUpdateMock).toHaveBeenCalledWith({ avatar_url: expect.stringContaining('/user-123/avatar.webp?v=') });
    expect(profileEqMock).toHaveBeenCalledWith('id', 'user-123');
    expect(bucketMock.remove).toHaveBeenCalledWith(['user-123/avatar.png']);
    expect(url).toContain('/user-123/avatar.webp?v=');
  });
  it('builds a cache-busted public URL from the user folder and fixed WebP header path', () => {
    const url = getProfileHeaderImageUrl('user-123');

    expect(supabaseMock.storage.from).toHaveBeenCalledWith('profile_header_images');
    expect(bucketMock.getPublicUrl).toHaveBeenCalledWith('user-123/header.webp');
    expect(url).toContain('/user-123/header.webp?v=');
  });

  it('uploads the cropped image to the generic service as WebP', async () => {
    const file = new File(['image'], 'avatar-cropped.png', { type: 'image/png' });

    const url = await uploadProfileHeaderImageToSupabase(file, 'user-123');

    expect(uploadImageMock).toHaveBeenCalledWith(file, {
      bucketName: 'profile_header_images',
      objectPath: 'user-123/header.webp',
    });
    expect(url).toContain('/user-123/header.webp?v=');
  });

  it('deletes the WebP header and any legacy PNG in the user folder', async () => {
    await expect(deleteProfileHeaderImageFromSupabase('user-123')).resolves.toBe(true);

    expect(bucketMock.remove).toHaveBeenCalledWith(['user-123/header.webp', 'user-123/header.png']);
  });

  it('can build the legacy PNG URL to keep existing headers visible', () => {
    const url = getProfileHeaderImageUrl('user-123', 'png');

    expect(bucketMock.getPublicUrl).toHaveBeenCalledWith('user-123/header.png');
    expect(url).toContain('/user-123/header.png?v=');
  });

  it('does not create a public URL without a user id', () => {
    expect(getProfileHeaderImageUrl(null)).toBeNull();
    expect(supabaseMock.storage.from).not.toHaveBeenCalled();
  });
});
