import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMock = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: authMock,
  },
}));

import { uploadImageToService } from './imageUploadService';

describe('imageUploadService', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_IMAGE_UPLOAD_API_URL', 'http://localhost:8081/');
    authMock.getSession.mockResolvedValue({
      data: { session: { access_token: 'access-token' } },
      error: null,
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: 'uploaded',
        bucket_name: 'profile_avatars',
        object_path: 'user-123/avatar.webp',
        content_type: 'image/webp',
        size_bytes: 120,
      }),
    }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('sends multipart data with the Supabase access token', async () => {
    const file = new File(['image data'], 'avatar.png', { type: 'image/png' });

    const result = await uploadImageToService(file, {
      bucketName: 'profile_avatars',
      objectPath: 'user-123/avatar.webp',
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe('http://localhost:8081/upload/images');
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ Authorization: 'Bearer access-token' });
    expect(options.headers).not.toHaveProperty('Content-Type');
    expect(options.body.get('image').name).toBe(file.name);
    expect(options.body.get('image').type).toBe(file.type);
    expect(options.body.get('bucket_name')).toBe('profile_avatars');
    expect(options.body.get('object_path')).toBe('user-123/avatar.webp');
    expect(result.content_type).toBe('image/webp');
  });

  it('does not upload without an authenticated session', async () => {
    authMock.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    await expect(uploadImageToService(new File(['image'], 'image.png'), {
      bucketName: 'profile_avatars',
      objectPath: 'user-123/avatar.webp',
    })).rejects.toThrow('Inicia sesión');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('surfaces an API error response', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'bucket_name is not allowed' }),
    });

    await expect(uploadImageToService(new File(['image'], 'image.png'), {
      bucketName: 'profile_avatars',
      objectPath: 'user-123/avatar.webp',
    })).rejects.toThrow('bucket_name is not allowed');
  });

  it('requires the upload endpoint configuration', async () => {
    vi.stubEnv('VITE_IMAGE_UPLOAD_API_URL', '');

    await expect(uploadImageToService(new File(['image'], 'image.png'), {
      bucketName: 'profile_avatars',
      objectPath: 'user-123/avatar.webp',
    })).rejects.toThrow('VITE_IMAGE_UPLOAD_API_URL');
  });
});
