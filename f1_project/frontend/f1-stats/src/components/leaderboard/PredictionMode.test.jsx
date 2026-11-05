import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchSeasonForecast } from '@/service/apiService.ts';
import PredictionMode from './PredictionMode';

vi.mock('@/service/apiService.ts', () => ({
    fetchSeasonForecast: vi.fn(),
}));

describe('PredictionMode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchSeasonForecast.mockResolvedValue({
            year: 2026,
            as_of_round: 7,
            fetched_at: '2026-06-20T18:30:00Z',
            standings_source: 'jolpica',
            is_stale: false,
            validation: {},
            simulations: 2000,
            remaining_events: [],
            standings: [],
        });
    });

    it('defaults to manual prediction and keeps the automatic forecast as an alternate mode', async () => {
        render(
            <PredictionMode
                year={2026}
                currentStandings={[]}
                raceCalendar={[]}
                raceDates={{}}
                lastCompletedIndex={-1}
                sprintEvents={new Set()}
            />
        );

        const manualButton = screen.getByRole('button', { name: 'Predicción manual' });
        const forecastButton = screen.getByRole('button', { name: 'Proyección automática' });
        expect(manualButton).toHaveAttribute('aria-pressed', 'true');
        expect(fetchSeasonForecast).not.toHaveBeenCalled();
        expect(screen.getByText(/Ordena los pilotos como crees que acabarán/)).toBeInTheDocument();
        expect(screen.getByText(/Selecciona una carrera futura/)).toBeInTheDocument();

        fireEvent.click(forecastButton);

        expect(forecastButton).toHaveAttribute(
            'aria-pressed',
            'true'
        );
        expect(await screen.findByText(/No hay una proyección disponible/)).toBeInTheDocument();
        expect(screen.getByText(/Consulta una estimación de cómo podría terminar/)).toBeInTheDocument();

        fireEvent.click(manualButton);
        expect(manualButton).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByText(/Selecciona una carrera futura/)).toBeInTheDocument();
    });

    it('initializes the manual prediction when standings and calendar load after the mode mounts', async () => {
        const props = {
            year: 2026,
            currentStandings: [],
            raceCalendar: [],
            raceDates: {},
            lastCompletedIndex: -1,
            sprintEvents: new Set(),
        };
        const { rerender } = render(<PredictionMode {...props} />);

        rerender(
            <PredictionMode
                {...props}
                currentStandings={[
                    { position: 1, driver: 'Ava Example', constructor: 'McLaren', points: 50 },
                ]}
                raceCalendar={[{ label: 'MON', value: 'Monaco' }]}
            />
        );

        expect(await screen.findAllByText('Ava Example')).not.toHaveLength(0);
    });
});
