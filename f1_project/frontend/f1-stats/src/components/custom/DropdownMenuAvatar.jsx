import {
  BadgeCheckIcon,
  BellIcon,
  CreditCardIcon,
  LogOutIcon,
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
import { getCacheBusterUrl } from '@/lib/cacheBuster';

export function DropdownMenuAvatar({ avatar }) {
  // Update the avatar URL with a cache buster to ensure the latest image is fetched.
  // This prevents retrieving a cached (previous) version of the user's avatar with the same URL.
  avatar = getCacheBusterUrl(avatar);
  const navigate = useNavigate();
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='size-12 rounded-full cursor-pointer'>
          <Avatar size='lg' className='size-11'>
            <AvatarImage src={avatar} alt='avatar' fetchPriority='high' loading='eager' />
            <AvatarFallback>LR</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheckIcon />
            <Link to='/profile' className='w-full h-full'>
              Perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCardIcon />
            Facturación
          </DropdownMenuItem>
          <DropdownMenuItem>
            <BellIcon />
            Notificaciones
          </DropdownMenuItem>
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
