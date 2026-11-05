import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSeasonForecast } from './apiService.ts';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('fetchSeasonForecast', () => {
    it('requests the season projection endpoint and returns its response', async () => {
        const forecast = { year: 2026, standings: [] };
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(forecast),
        });
        vi.stubGlobal('fetch', fetchMock);

        await expect(fetchSeasonForecast(2026)).resolves.toEqual(forecast);

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringMatching(/\/predict\/season\/2026$/),
            { signal: undefined }
        );
    });

    it('surfaces the API error detail when the request fails', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            json: vi.fn().mockResolvedValue({ detail: 'No season projection available' }),
        });
        vi.stubGlobal('fetch', fetchMock);

        await expect(fetchSeasonForecast(2026)).rejects.toThrow('No season projection available');
    });
});
