import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { Links } from './Links';

describe('Links', () => {
    it('marks the current section with lighter text and a discreet underline on a nested route', () => {
        render(
            <MemoryRouter initialEntries={['/ratings/community']}>
                <Links user={{ id: 'profile-1' }} />
            </MemoryRouter>
        );

        const ratingsLink = screen.getByRole('link', { name: 'Valoraciones' });

        expect(ratingsLink).toHaveAttribute('aria-current', 'page');
        expect(ratingsLink).toHaveClass('border-b');
        expect(ratingsLink).toHaveClass('border-zinc-500');
        expect(ratingsLink).toHaveClass('text-zinc-200');
        expect(ratingsLink).not.toHaveClass('bg-zinc-800/70');
        expect(ratingsLink).not.toHaveClass('text-red-600');
    });
});
