import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GraphicsDashboard } from './Graphics';
import { fetchSeasonHeatmapData, fetchYearSchedule } from '@/service/apiService.ts';

vi.mock('@/service/apiService.ts', () => ({
    fetchDriverLaps: vi.fn(),
    fetchDriverLapsImage: vi.fn(),
    fetchDriversLapsViolin: vi.fn(),
    fetchDriversLapsViolinImage: vi.fn(),
    fetchQualyOverviewData: vi.fn(),
    fetchQualyOverviewImage: vi.fn(),
    fetchSeasonHeatmapData: vi.fn(),
    fetchSeasonHeatmapImage: vi.fn(),
    fetchYearSchedule: vi.fn(),
    fetchDriversFullNamesByYear: vi.fn(),
}));

vi.mock('@/components/graphics/SeasonPointsHeatmap.jsx', () => ({
    SeasonPointsHeatmap: ({ data }) => <div data-testid="season-heatmap-result">{JSON.stringify(data)}</div>,
}));
vi.mock('../components/GenericComobobox.jsx', () => ({
    GenericCombobox: ({ options, value, onChange, disabled, placeholder }) => (
        <select
            aria-label={placeholder}
            value={value ?? ''}
            disabled={disabled}
            onChange={(event) => {
                const option = options.find((item) => String(item.value) === event.target.value);
                onChange(option?.value ?? '');
            }}
        >
            <option value="">Selecciona…</option>
            {options.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </select>
    ),
}));

describe('GraphicsDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchSeasonHeatmapData.mockResolvedValue([{ year: 2026 }]);
        fetchYearSchedule.mockResolvedValue({ tracks: [] });
    });

    it('generates the graph after confirming parameters and has no manual generate button', async () => {
        render(<GraphicsDashboard />);

        fireEvent.click(screen.getByRole('button', { name: 'Análisis de resultados' }));

        expect(screen.queryByRole('button', { name: /generar gráfico/i })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Configurar parámetros de Mapa de calor de puntos' }));

        const dialog = await screen.findByRole('dialog');

        const confirmButton = within(dialog).getByRole('button', { name: 'Confirmar' });
        expect(confirmButton).toBeDisabled();
        fireEvent.change(within(dialog).getByRole('combobox'), { target: { value: '2026' } });
        await waitFor(() => expect(confirmButton).toBeEnabled());
        fireEvent.click(confirmButton);

        await waitFor(() => expect(fetchSeasonHeatmapData).toHaveBeenCalledWith(2026));
        expect(await screen.findByTestId('season-heatmap-result')).toHaveTextContent('2026');
    });
});
