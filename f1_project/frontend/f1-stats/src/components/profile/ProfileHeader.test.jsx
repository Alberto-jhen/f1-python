import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const profileHeaderService = vi.hoisted(() => ({
  uploadAvatarToSupabase: vi.fn(),
  getProfileHeaderImageUrl: vi.fn(),
  uploadProfileHeaderImageToSupabase: vi.fn(),
  deleteProfileHeaderImageFromSupabase: vi.fn(),
  uploadBiographyToSupabase: vi.fn(),
  uploadFullNameToSupabase: vi.fn(),
  uploadLocationToSupabase: vi.fn(),
}));

vi.mock('@/service/supabaseService', () => profileHeaderService);
vi.mock('@/service/usernameService', () => ({ updateUsernameForUser: vi.fn() }));
vi.mock('@/components/GenericComobobox', () => ({ GenericCombobox: () => null }));
vi.mock('./ImageCropModal', () => ({ ImageCropModal: () => null }));

import { ProfileHeader } from './ProfileHeader';

const profile = {
  full_name: 'Alberto',
  username: 'alberto',
  biography: '',
  location: '',
  avatar_url: '',
  created_at: '',
};

describe('ProfileHeader image', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profileHeaderService.getProfileHeaderImageUrl.mockReturnValue(null);
    profileHeaderService.deleteProfileHeaderImageFromSupabase.mockResolvedValue(true);
  });

  it('keeps the default gradient and offers to add a header image', async () => {
    const { container } = render(
      <ProfileHeader user={profile} userId='user-123' editable />
    );

    expect(container.querySelector('.h-64')).toHaveClass('bg-gradient-to-r');
    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }));

    expect(await screen.findByRole('dialog')).toHaveTextContent('Imagen de cabecera');
    expect(screen.getByRole('button', { name: 'Añadir cabecera' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Eliminar cabecera' })).not.toBeInTheDocument();
  });

  it("deletes the user's header image and restores the default gradient", async () => {
    profileHeaderService.getProfileHeaderImageUrl.mockReturnValue(
      'https://example.com/user-123/header.png?v=1'
    );

    const { container } = render(
      <ProfileHeader user={profile} userId='user-123' editable />
    );

    fireEvent.load(container.querySelector('.h-64 img'));
    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar cabecera' }));

    await waitFor(() => {
      expect(profileHeaderService.deleteProfileHeaderImageFromSupabase).toHaveBeenCalledWith('user-123');
      expect(container.querySelector('.h-64 img')).not.toBeInTheDocument();
    });
    expect(container.querySelector('.h-64')).toHaveClass('bg-gradient-to-r');
  });
});
