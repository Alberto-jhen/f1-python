import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { RatingCard } from '../RatingCard';

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
});
