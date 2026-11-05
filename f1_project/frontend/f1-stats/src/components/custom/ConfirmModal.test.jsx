import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmModal } from './ConfirmModal';

function ConfirmModalHarness({ onConfirm }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onConfirm={onConfirm}
    />
  );
}

function renderConfirmModal(onConfirm) {
  return render(<ConfirmModalHarness onConfirm={onConfirm} />);
}

describe('ConfirmModal', () => {
  it('opens immediately without rendering an additional trigger', () => {
    renderConfirmModal(vi.fn());

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '¿Seguro que quieres eliminar tu cuenta?' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Show Dialog')).not.toBeInTheDocument();
  });

  it('closes when the user cancels without confirming', async () => {
    const onConfirm = vi.fn();
    renderConfirmModal(onConfirm);

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onConfirm).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  it('closes after the account deletion succeeds', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    renderConfirmModal(onConfirm);

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar cuenta' }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  it('keeps the dialog open and displays an error when deletion fails', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('No se pudo completar la solicitud.'));
    renderConfirmModal(onConfirm);

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar cuenta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo completar la solicitud.'
    );
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eliminar cuenta' })).toBeEnabled();
  });
});
