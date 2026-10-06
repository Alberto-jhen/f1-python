import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }) => <div className={className}>{children}</div>,
  AvatarFallback: ({ children, className }) => <span className={className}>{children}</span>,
  AvatarImage: (props) => <img {...props} />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, className, onClick }) => (
    <button type='button' className={className} onClick={onClick}>{children}</button>
  ),
}));

vi.mock('@/components/ui/dropdown-menu', () => {
  const Wrapper = ({ children }) => <div>{children}</div>;

  return {
    DropdownMenu: Wrapper,
    DropdownMenuContent: Wrapper,
    DropdownMenuGroup: Wrapper,
    DropdownMenuItem: Wrapper,
    DropdownMenuSeparator: () => <hr />,
    DropdownMenuTrigger: Wrapper,
  };
});

vi.mock('@/lib/supabase.js', () => ({
  supabase: { auth: { signOut: vi.fn() } },
}));

import { DropdownMenuAvatar } from './DropdownMenuAvatar';

describe('DropdownMenuAvatar', () => {
  it('uses the requested Gravatar when the user has no profile avatar', () => {
    render(
      <MemoryRouter>
        <DropdownMenuAvatar profileId='user-123' />
      </MemoryRouter>
    );

    expect(screen.getByRole('img', { name: 'Avatar de perfil' })).toHaveAttribute(
      'src',
      'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
    );
    expect(screen.queryByText('LR')).not.toBeInTheDocument();
  });

  it('continues to prefer the user avatar when one is configured', () => {
    render(
      <MemoryRouter>
        <DropdownMenuAvatar avatar='https://example.com/avatar.png' profileId='user-123' />
      </MemoryRouter>
    );

    expect(screen.getByRole('img', { name: 'Avatar de perfil' })).toHaveAttribute(
      'src',
      'https://example.com/avatar.png'
    );
  });
});
