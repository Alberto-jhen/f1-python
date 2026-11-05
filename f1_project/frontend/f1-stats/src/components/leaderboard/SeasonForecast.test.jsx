import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchSeasonForecast } from '@/service/apiService.ts';
import SeasonForecast from './SeasonForecast';

vi.mock('@/service/apiService.ts', () => ({
    fetchSeasonForecast: vi.fn(),
}));

const forecast = {
    year: 2026,
    as_of_round: 7,
    fetched_at: '2026-06-20T18:30:00Z',
    standings_source: 'jolpica',
    is_stale: true,
    validation: {
        target: 'current_points_per_driver_session',
        mae: 2.58,
    },
    simulations: 2000,
    remaining_events: [{ name: 'Silverstone' }, { name: 'Spa' }],
    standings: [
        {
            position: 1,
            current_position: 2,
            driver: 'Ava Example',
            constructor: 'McLaren',
            current_points: 120,
            expected_final_points: 185.5,
            p10_final_points: 160,
            p90_final_points: 210,
            championship_probability: 0.62,
        },
    ],
};

describe('SeasonForecast', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchSeasonForecast.mockResolvedValue(forecast);
    });

    it('shows understandable projected standings without technical model metadata', async () => {
        render(<SeasonForecast year={2026} />);

        const table = await screen.findByRole('table', {
            name: 'Proyección final de la temporada 2026',
        });
        const row = screen.getByRole('row', { name: /Ava Example/i });

        expect(fetchSeasonForecast).toHaveBeenCalledWith(2026, expect.any(AbortSignal));
        expect(screen.getByRole('heading', { name: 'Clasificación final estimada 2026' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Puntos finales estimados' })).toBeInTheDocument();
        expect(screen.getByText('Datos desactualizados')).toBeInTheDocument();
        expect(screen.queryByText('jolpica')).not.toBeInTheDocument();
        expect(screen.queryByText('Validación del modelo')).not.toBeInTheDocument();
        expect(screen.queryByText('MAE (puntos/sesión)')).not.toBeInTheDocument();
        expect(screen.queryByText('Rango p10–p90')).not.toBeInTheDocument();
        expect(table).toBeInTheDocument();
        expect(row).toHaveTextContent('Ava Example');
        expect(row).toHaveTextContent('120');
        expect(row).toHaveTextContent(/185[.,]5/);
        expect(row).toHaveTextContent(/62[.,]00\s*%/);
    });

    it('shows title probabilities to two decimals while keeping the points-based order clear', async () => {
        fetchSeasonForecast.mockResolvedValueOnce({
            ...forecast,
            standings: [
                {
                    position: 3,
                    current_position: 3,
                    driver: 'Hamilton',
                    constructor: 'Ferrari',
                    current_points: 100,
                    expected_final_points: 150,
                    p10_final_points: 130,
                    p90_final_points: 170,
                    championship_probability: 0.0005,
                },
                {
                    position: 1,
                    current_position: 1,
                    driver: 'Antonelli',
                    constructor: 'Mercedes',
                    current_points: 200,
                    expected_final_points: 250,
                    p10_final_points: 230,
                    p90_final_points: 270,
                    championship_probability: 0.999,
                },
                {
                    position: 2,
                    current_position: 2,
                    driver: 'Russell',
                    constructor: 'Mercedes',
                    current_points: 150,
                    expected_final_points: 180,
                    p10_final_points: 160,
                    p90_final_points: 200,
                    championship_probability: 0,
                },
                {
                    position: 4,
                    current_position: 4,
                    driver: 'Verstappen',
                    constructor: 'Red Bull',
                    current_points: 90,
                    expected_final_points: 140,
                    p10_final_points: 120,
                    p90_final_points: 160,
                    championship_probability: 0.0005,
                },
            ],
        });

        render(<SeasonForecast year={2026} />);

        const table = await screen.findByRole('table', {
            name: 'Proyección final de la temporada 2026',
        });
        const rows = within(table).getAllByRole('row').slice(1);
        const displayedProbabilities = rows.map((row) =>
            Number.parseFloat(
                row.lastElementChild.textContent.replace('%', '').replace(',', '.')
            )
        );

        expect(rows.map((row) => row.cells[2].textContent.trim())).toEqual([
            'Antonelli',
            'Russell',
            'Hamilton',
            'Verstappen',
        ]);
        expect(screen.getByText(/El orden se basa en los puntos finales estimados/))
            .toBeInTheDocument();
        expect(screen.getByRole('row', { name: /Russell/ })).toHaveTextContent('0.00%');
        expect(screen.getByRole('row', { name: /Hamilton/ })).toHaveTextContent('0.05%');
        expect(screen.getByRole('row', { name: /Verstappen/ })).toHaveTextContent('0.05%');
        expect(displayedProbabilities.reduce((sum, value) => sum + value, 0))
            .toBeCloseTo(100, 2);
    });

    it('offers a refresh action that requests the season forecast again', async () => {
        render(<SeasonForecast year={2026} />);
        await screen.findByRole('table');

        fireEvent.click(screen.getByRole('button', { name: 'Actualizar proyección' }));

        await waitFor(() => expect(fetchSeasonForecast).toHaveBeenCalledTimes(2));
    });

    it('shows a loading state while the request is pending', () => {
        fetchSeasonForecast.mockReturnValue(new Promise(() => {}));

        render(<SeasonForecast year={2026} />);

        expect(screen.getByRole('status')).toHaveTextContent('Cargando proyección de temporada');
    });

    it('shows an explicit error when the request fails', async () => {
        fetchSeasonForecast.mockRejectedValueOnce(new Error('El modelo no está disponible'));

        render(<SeasonForecast year={2026} />);

        expect(await screen.findByText(
            'No se pudo cargar la proyección ahora mismo. Inténtalo de nuevo más tarde.'
        )).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    });

    it('shows a no-data state when the API returns no standings', async () => {
        fetchSeasonForecast.mockResolvedValueOnce({ ...forecast, standings: [] });

        render(<SeasonForecast year={2026} />);

        expect(await screen.findByText(/No hay una proyección disponible para la temporada 2026/))
            .toBeInTheDocument();
    });
});
