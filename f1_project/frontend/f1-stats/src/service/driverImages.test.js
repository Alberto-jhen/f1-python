import { beforeEach, describe, expect, it, vi } from 'vitest';

const storageMocks = vi.hoisted(() => ({
  createSignedUrls: vi.fn(),
  from: vi.fn(),
  list: vi.fn(),
}));

vi.mock('@/lib/supabase.js', () => ({
  supabase: {
    storage: {
      from: storageMocks.from,
    },
  },
}));

import {
  get2026DriverImageMap,
  getDriverImageKey,
  getDriverImageKeyFromFileName,
} from './driverImages';

describe('driverImages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageMocks.from.mockReturnValue({
      createSignedUrls: storageMocks.createSignedUrls,
      list: storageMocks.list,
    });
  });

  it('normalizes driver surnames and uploaded object suffixes', () => {
    expect(getDriverImageKey('Andrea Kimi Antonelli')).toBe('antonelli');
    expect(getDriverImageKey('Fernando Alonso')).toBe('alonso');
    expect(getDriverImageKeyFromFileName('0_01f7690c3bfdf2f8_2026antonelli.webp')).toBe(
      'antonelli'
    );
  });

  it('lists the 2026 folder and maps signed URLs by the uploaded driver suffix', async () => {
    const antonelliFile = '0_01f7690c3bfdf2f8_2026antonelli.webp';
    const alonsoFile = '1_01f7690c3bfdf2f8_2026alonso.webp';
    storageMocks.list.mockResolvedValue({
      data: [{ name: antonelliFile }, { name: alonsoFile }, { name: 'other-folder' }],
      error: null,
    });
    storageMocks.createSignedUrls.mockResolvedValue({
      data: [
        {
          path: `2026/${antonelliFile}`,
          signedUrl: 'https://example.com/antonelli.webp?token=one',
        },
        {
          path: `2026/${alonsoFile}`,
          signedUrl: 'https://example.com/alonso.webp?token=two',
        },
      ],
      error: null,
    });

    const imageMap = await get2026DriverImageMap();

    expect(storageMocks.from).toHaveBeenCalledWith('driver_images');
    expect(storageMocks.list).toHaveBeenCalledWith('2026', { limit: 1000 });
    expect(storageMocks.createSignedUrls).toHaveBeenCalledWith(
      [`2026/${antonelliFile}`, `2026/${alonsoFile}`],
      3600
    );
    expect(imageMap).toEqual({
      antonelli: 'https://example.com/antonelli.webp?token=one',
      alonso: 'https://example.com/alonso.webp?token=two',
    });
  });
});
