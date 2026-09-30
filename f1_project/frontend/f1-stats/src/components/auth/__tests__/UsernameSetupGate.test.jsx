import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { UsernameSetupGate } from '../UsernameSetupGate';
import { useAuth } from '@/hooks/useAuth';
import { updateUsernameForUser } from '@/service/usernameService';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/service/usernameService', () => ({
  updateUsernameForUser: vi.fn(),
}));

describe('UsernameSetupGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { id: 'google-user', user_metadata: {} },
      loading: false,
    });
    updateUsernameForUser.mockResolvedValue('alberto_1');
  });

  it('requires a username when the authenticated user has none', () => {
    render(<UsernameSetupGate />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Elige tu nombre de usuario')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  it('saves the trimmed username and closes after success', async () => {
    render(<UsernameSetupGate />);
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: '  alberto_1  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar username' }));

    await waitFor(() => {
      expect(updateUsernameForUser).toHaveBeenCalledWith('alberto_1', 'google-user');
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('shows a friendly error when the username is already taken', async () => {
    updateUsernameForUser.mockRejectedValue({ code: 'USERNAME_TAKEN' });
    render(<UsernameSetupGate />);
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'alberto_1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar username' }));

    expect(
      await screen.findByText('Ese nombre de usuario ya está en uso. Prueba con otro.')
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not ask again when the account already has a username', () => {
    useAuth.mockReturnValue({
      user: { id: 'email-user', user_metadata: { username: 'alberto_1' } },
      loading: false,
    });

    render(<UsernameSetupGate />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
