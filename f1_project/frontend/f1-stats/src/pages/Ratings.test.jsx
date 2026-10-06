import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { Ratings } from './Ratings';

describe('Ratings', () => {
    it('offers access to community ratings before the user selects a rating type', () => {
        render(
            <MemoryRouter>
                <Ratings />
            </MemoryRouter>
        );

        expect(screen.getByRole('link', { name: 'Ver valoraciones de la comunidad' })).toHaveAttribute(
            'href',
            '/ratings/community'
        );
        expect(screen.getByRole('heading', { name: /haz tus valoraciones/i })).toBeInTheDocument();
    });
});
