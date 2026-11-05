import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const driverProfileMocks = vi.hoisted(() => ({
    fetchDriverCareerStandings: vi.fn(() => Promise.resolve({ titles: 0, wins: 0, podiums: 0 })),
    fetchDriverSeasonStandings: vi.fn(() => Promise.resolve({ position: 1, points: 0 })),
    getDriverImageKey: vi.fn(() => 'antonelli'),
    useDriverImageMap: vi.fn((year) => (
        Number(year) === 2026
            ? { antonelli: 'https://example.com/antonelli.webp?token=sample' }
            : {}
    )),
}));

vi.mock('@/service/apiService.ts', () => ({
    fetchDriverCareerStandings: driverProfileMocks.fetchDriverCareerStandings,
    fetchDriverSeasonStandings: driverProfileMocks.fetchDriverSeasonStandings,
}));

vi.mock('@/service/driverImages.js', () => ({
    getDriverImageKey: driverProfileMocks.getDriverImageKey,
    useDriverImageMap: driverProfileMocks.useDriverImageMap,
}));
vi.mock('@/assets/form-bg.svg', () => ({ default: '/assets/form-bg.svg' }));

vi.mock('@/components/ui/accordion', () => {
    const Wrapper = ({ children, className }) => <div className={className}>{children}</div>;

    return {
        Accordion: Wrapper,
        AccordionContent: Wrapper,
        AccordionItem: Wrapper,
        AccordionTrigger: Wrapper,
    };
});

import DriverProfileCard from './DriverProfileCard';

const baseDriver = {
    driverLabel: 'Andrea Kimi Antonelli',
    driverNumber: 12,
    team: 'Mercedes',
    team_color: '00D2BE',
    country: 'Italia',
    value: 'ANT',
};

describe('DriverProfileCard', () => {
    it('crops 2026 full-body portraits to a bust within the standard card frame', async () => {
        render(<DriverProfileCard data={{ ...baseDriver, year: 2026 }} />);

        const image = screen.getByRole('img', { name: baseDriver.driverLabel });
        const imageFrame = image.parentElement;
        const imageGradient = imageFrame.querySelector('[data-testid="driver-image-gradient"]');
        const pattern = imageFrame.querySelector('[data-testid="driver-background-pattern"]');
        const numberFill = imageFrame.querySelector('[data-testid="driver-number-fill"]');
        const numberOutline = imageFrame.querySelector('[data-testid="driver-number-outline"]');
        expect(image).toHaveClass('absolute', 'inset-0', 'object-cover', 'object-top', 'scale-125', 'origin-top');
        expect(imageFrame).toHaveClass('md:h-auto', 'md:min-h-120', 'md:self-stretch');
        expect(imageFrame).not.toHaveClass('md:h-[30rem]');
        expect(imageFrame.style.backgroundColor).toBe('rgba(0, 210, 190, 0.6)');
        expect(pattern).toHaveClass('opacity-40');
        expect(pattern.style.backgroundImage).toContain('/assets/form-bg.svg');
        expect(image).toHaveClass('z-20');
        expect(imageGradient).toBeInTheDocument();
        expect(imageGradient).toHaveClass('bg-linear-to-b', 'to-slate-950', 'md:bg-linear-to-r', 'md:to-slate-950');
        expect(numberFill).toHaveClass('opacity-20');
        expect(numberOutline).not.toBeInTheDocument();
        expect(imageFrame.style.backgroundImage).toBe('');
        await waitFor(() => {
            expect(image).toHaveAttribute('src', 'https://example.com/antonelli.webp?token=sample');
        });
        await waitFor(() => {
            expect(screen.queryByText('Cargando estadísticas…')).not.toBeInTheDocument();
        });
    });

    it('preserves the existing image sizing for other seasons', async () => {
        render(<DriverProfileCard data={{ ...baseDriver, year: 2025 }} />);

        const image = screen.getByRole('img', { name: baseDriver.driverLabel });
        const imageFrame = image.parentElement;
        const imageGradient = imageFrame.querySelector('[data-testid="driver-image-gradient"]');
        const numberFill = imageFrame.querySelector('[data-testid="driver-number-fill"]');

        expect(image).toHaveClass('object-cover');
        expect(imageFrame).toHaveClass('md:h-auto', 'md:max-h-none');
        expect(imageGradient).toBeInTheDocument();
        expect(imageGradient).toHaveClass('bg-linear-to-b', 'to-slate-950', 'md:bg-linear-to-r', 'md:to-slate-950');
        expect(numberFill).toHaveClass('opacity-20');
        expect(imageFrame.querySelector('[data-testid="driver-background-pattern"]')).not.toBeInTheDocument();
        expect(imageFrame.querySelector('[data-testid="driver-number-outline"]')).not.toBeInTheDocument();
        expect(imageFrame).not.toHaveClass('md:h-[30rem]');
        expect(imageFrame.style.backgroundImage).toBe('');
        await waitFor(() => {
            expect(screen.queryByText('Cargando estadísticas…')).not.toBeInTheDocument();
        });
    });
});
