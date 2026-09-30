import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { RatingCard } from '../RatingCard';
import { deleteRating } from '@/service/ratingsService.ts';

vi.mock('@/service/ratingsService.ts', () => ({
  deleteRating: vi.fn(() => Promise.resolve({ ok: true })),
}));

const baseRating = {
  id: 'rating-1',
  profile: {
    id: 'profile-1',
    username: 'alonso14',
    full_name: 'Fernando Alonso',
    avatar_url: 'https://example.com/avatars/alonso.jpg',
  },
  race: {
    id: 16,
    season_year: 2026,
    round: 14,
    circuit_name: 'Monza',
  },
  rating: 4,
  comment: 'Gran remontada en el último stint.',
  created_at: '2026-09-10T10:00:00Z',
  likes: 5,
  liked_by_me: false,
};

describe('RatingCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders the author and race information', () => {
    render(<RatingCard rating={baseRating} currentProfileId='profile-2' onToggleLike={vi.fn()} />);

    expect(screen.getByText('Fernando Alonso')).toBeInTheDocument();
    expect(screen.getByText('@alonso14')).toBeInTheDocument();
    expect(screen.getByText('Monza')).toBeInTheDocument();
    expect(screen.getByText('5 Likes')).toBeInTheDocument();
  });

  it('shows a filled heart and updated count when liked_by_me is true', () => {
    render(
      <RatingCard
        rating={{ ...baseRating, liked_by_me: true, likes: 6 }}
        currentProfileId='profile-2'
        onToggleLike={vi.fn()}
      />
    );

    expect(screen.getByText('6 Me gusta')).toBeInTheDocument();
  });

  it('calls onToggleLike with the rating id and current liked state', () => {
    const onToggleLike = vi.fn();
    render(<RatingCard rating={baseRating} currentProfileId='profile-2' onToggleLike={onToggleLike} />);

    fireEvent.click(screen.getByRole('button', { name: /dar like/i }));

    expect(onToggleLike).toHaveBeenCalledTimes(1);
    expect(onToggleLike).toHaveBeenCalledWith('rating-1', false);
  });

  it('preserves profile and race info after a simulated like update', () => {
    const onToggleLike = vi.fn();
    const { rerender } = render(
      <RatingCard rating={baseRating} currentProfileId='profile-2' onToggleLike={onToggleLike} />
    );

    fireEvent.click(screen.getByRole('button', { name: /dar like/i }));

    const updatedRating = { ...baseRating, liked_by_me: true, likes: 6 };
    rerender(<RatingCard rating={updatedRating} currentProfileId='profile-2' onToggleLike={onToggleLike} />);

    expect(screen.getByText('Fernando Alonso')).toBeInTheDocument();
    expect(screen.getByText('@alonso14')).toBeInTheDocument();
    expect(screen.getByText('Monza')).toBeInTheDocument();
    expect(screen.getByText('6 Me gusta')).toBeInTheDocument();
  });

  it('disables the like button for the author own rating', () => {
    render(<RatingCard rating={baseRating} currentProfileId='profile-1' onToggleLike={vi.fn()} />);

    expect(screen.getByRole('button', { name: /dar like/i })).toBeDisabled();
  });

  it('shows a login prompt and disables the like button when no user is logged in', () => {
    render(<RatingCard rating={baseRating} onToggleLike={vi.fn()} />);

    expect(screen.getByText('Inicia sesión para votar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dar like/i })).toBeDisabled();
  });

  it('falls back to default labels when profile and race are missing', () => {
    const minimalRating = {
      ...baseRating,
      profile: null,
      race: null,
      created_at: null,
      comment: null,
    };

    render(<RatingCard rating={minimalRating} currentProfileId='profile-2' onToggleLike={vi.fn()} />);

    expect(screen.getByText('Usuario')).toBeInTheDocument();
    expect(screen.getByText('@usuario')).toBeInTheDocument();
    expect(screen.getByText('Gran Premio')).toBeInTheDocument();
  });

  it('handles invalid created_at values without crashing', () => {
    render(
      <RatingCard
        rating={{ ...baseRating, created_at: 'not-a-valid-date' }}
        currentProfileId='profile-2'
        onToggleLike={vi.fn()}
      />
    );

    expect(screen.getByText('Fernando Alonso')).toBeInTheDocument();
  });

  it('asks for confirmation before deleting and deletes on confirm', async () => {
    const onDelete = vi.fn();
    render(
      <RatingCard
        rating={baseRating}
        currentProfileId='profile-1'
        onToggleLike={vi.fn()}
        onDelete={onDelete}
        deleteMode
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /eliminar valoración/i }));

    expect(await screen.findByText('¿Eliminar valoración?')).toBeInTheDocument();
    expect(screen.getByText(/esta acción no se puede deshacer/i)).toBeInTheDocument();
    expect(deleteRating).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /^eliminar$/i }));

    await waitFor(() => expect(deleteRating).toHaveBeenCalledWith('profile-1', 'rating-1'));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('rating-1'));
  });

  it('does not delete when the confirmation modal is cancelled', async () => {
    render(
      <RatingCard
        rating={baseRating}
        currentProfileId='profile-1'
        onToggleLike={vi.fn()}
        onDelete={vi.fn()}
        deleteMode
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /eliminar valoración/i }));
    fireEvent.click(await screen.findByRole('button', { name: /cancelar/i }));

    expect(deleteRating).not.toHaveBeenCalled();
  });

  it('does not show the rated-driver line when not in driver mode', () => {
    render(<RatingCard rating={baseRating} currentProfileId='profile-2' onToggleLike={vi.fn()} />);

    expect(screen.queryByText('Valora a')).not.toBeInTheDocument();
  });

  it('shows only the rated driver name next to the stars in driver mode', () => {
    render(
      <RatingCard
        rating={{ ...baseRating, driver_id: 'VER' }}
        currentProfileId='profile-2'
        onToggleLike={vi.fn()}
        driverMode
        driverInfo={{
          value: 'VER',
          label: 'Max Verstappen',
          team: 'Red Bull',
          team_color: '2563eb',
        }}
      />
    );

    expect(screen.getByText('Max Verstappen')).toBeInTheDocument();
    expect(screen.queryByText('Valora a')).not.toBeInTheDocument();
    expect(screen.queryByText('Red Bull')).not.toBeInTheDocument();
  });

  it('falls back to the driver code when driver info is not available', () => {
    render(
      <RatingCard
        rating={{ ...baseRating, driver_id: 'VER' }}
        currentProfileId='profile-2'
        onToggleLike={vi.fn()}
        driverMode
      />
    );

    expect(screen.queryByText('Valora a')).not.toBeInTheDocument();
    expect(screen.getByText('VER')).toBeInTheDocument();
  });

  it('keeps the author location but hides favorite driver and team', () => {
    render(
      <RatingCard
        rating={{
          ...baseRating,
          profile: {
            ...baseRating.profile,
            location: 'España',
            favorite_driver: 'Carlos Sainz',
            favorite_team: 'Williams',
          },
        }}
        currentProfileId='profile-2'
        onToggleLike={vi.fn()}
      />
    );

    expect(screen.getByTitle('España')).toBeInTheDocument();
    expect(screen.queryByText('Carlos Sainz')).not.toBeInTheDocument();
    expect(screen.queryByText('Williams')).not.toBeInTheDocument();
  });

  it('does not render the author context row when the profile has no extra data', () => {
    render(<RatingCard rating={baseRating} currentProfileId='profile-2' onToggleLike={vi.fn()} />);

    expect(screen.queryByTitle('España')).not.toBeInTheDocument();
    expect(screen.queryByText('Carlos Sainz')).not.toBeInTheDocument();
  });

  it('links the author avatar and name to their profile when a path is provided', () => {
    render(
      <MemoryRouter>
        <RatingCard
          rating={baseRating}
          authorProfilePath='/ratings/community/profile/profile-1'
          currentProfileId='profile-2'
          onToggleLike={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Ver el perfil de Fernando Alonso' })).toHaveAttribute(
      'href',
      '/ratings/community/profile/profile-1'
    );
    expect(screen.getByRole('link', { name: 'Fernando Alonso' })).toHaveAttribute(
      'href',
      '/ratings/community/profile/profile-1'
    );
  });
});
