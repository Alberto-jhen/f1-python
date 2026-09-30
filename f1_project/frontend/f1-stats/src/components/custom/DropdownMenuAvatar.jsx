import {
  BadgeCheckIcon,
  LogOutIcon,
  UserStarIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { Link } from 'react-router-dom';

export function DropdownMenuAvatar({ avatar, profileId }) {
  // La URL guardada en BD ya incluye el parámetro de versión (?v=...) desde la subida,
  // por lo que aquí se usa tal cual: es estable entre renders (sin recargas ni
  // parpadeos) y cambia cuando el usuario actualiza su avatar.
  const navigate = useNavigate();
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='size-12 rounded-full cursor-pointer'>
          <Avatar size='lg' className='size-11'>
            <AvatarImage src={avatar} alt='avatar' fetchPriority='high' loading='eager' />
            <AvatarFallback delayMs={200}>LR</AvatarFallback>
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
        <DropdownMenuSeparator />
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
