import {
  BadgeCheckIcon,
  LogOutIcon,
  UserRound,
  UserStarIcon,
  TrashIcon
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase.js';
import { ConfirmModal } from '@/components/custom/ConfirmModal.jsx';
import { handleDeleteAccount } from '@/service/supabaseService.js';
const DEFAULT_AVATAR_URL = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

export function DropdownMenuAvatar({ avatar, profileId }) {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='size-12 rounded-full cursor-pointer'>
            <Avatar size='lg' className='size-11'>
              <AvatarImage
                src={avatar || DEFAULT_AVATAR_URL}
                alt='Avatar de perfil'
                fetchPriority='high'
                loading='eager'
              />
              <AvatarFallback delayMs={200}>
                <UserRound className='size-5' aria-hidden='true' />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuGroup>
            <Link to='/profile' className='w-full h-full'>
              <DropdownMenuItem
              className='cursor-pointer'>
                <BadgeCheckIcon />
                  Perfil
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <Link to={`/profile/${profileId}/ratings`} className='w-full h-full'>
              <DropdownMenuItem
              className='cursor-pointer'>
                <UserStarIcon />
                  Valoraciones
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          <DropdownMenuItem
            className='cursor-pointer'
            onClick={async () => {
              const { error } = await supabase.auth.signOut();
              navigate('/'); 
              if (error) {
                console.error('Error al cerrar sesión:', error);
              }
            }}>
            <LogOutIcon />
            Cerrar sesión
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className='cursor-pointer'
            onClick={() => setIsModalOpen(true)}>
            <TrashIcon />
            Eliminar cuenta
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </>    
  );
}
