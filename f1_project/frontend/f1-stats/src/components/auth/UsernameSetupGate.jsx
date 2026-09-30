import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import {
  isUsernameConflictError,
  normalizeUsername,
  usernameValidator,
} from '@/lib/utils';
import { updateUsernameForUser } from '@/service/usernameService';

export function UsernameSetupGate() {
  const { user, loading } = useAuth();
  const [completedUserId, setCompletedUserId] = useState(null);
  const username = normalizeUsername(user?.user_metadata?.username);
  const requiresUsername = Boolean(user && !username && completedUserId !== user.id);

  if (loading || !requiresUsername) return null;

  return (
    <UsernameSetupDialog
      key={user.id}
      userId={user.id}
      onComplete={() => setCompletedUserId(user.id)}
    />
  );
}

function UsernameSetupDialog({ userId, onComplete }) {
  const [username, setUsername] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const candidate = normalizeUsername(username);

    if (!usernameValidator(candidate)) {
      setErrorMessage(
        'Usa entre 3 y 30 caracteres: letras, números, guiones o guiones bajos.'
      );
      return;
    }

    setSaving(true);
    setErrorMessage('');
    try {
      await updateUsernameForUser(candidate, userId);
      toast.success('Nombre de usuario guardado');
      onComplete();
    } catch (error) {
      console.error('Error guardando el username de OAuth:', error);
      setErrorMessage(
        isUsernameConflictError(error)
          ? 'Ese nombre de usuario ya está en uso. Prueba con otro.'
          : 'No se pudo guardar el nombre de usuario. Inténtalo de nuevo.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        className='border-zinc-800 bg-zinc-950 text-white sm:max-w-md'
      >
        <DialogHeader>
          <DialogTitle className='text-white'>Elige tu nombre de usuario</DialogTitle>
          <DialogDescription className='text-zinc-400'>
            Antes de continuar, crea un username único. No tiene que coincidir con tu correo ni con
            tu nombre de Google.
          </DialogDescription>
        </DialogHeader>

        <form className='space-y-4' onSubmit={handleSubmit}>
          <div className='space-y-2'>
            <label htmlFor='oauth-username' className='text-sm font-medium text-zinc-300'>
              Username
            </label>
            <div className='flex items-center rounded-md border border-zinc-700 bg-zinc-900 px-3 focus-within:border-red-600'>
              <span className='text-zinc-500' aria-hidden='true'>
                @
              </span>
              <input
                id='oauth-username'
                type='text'
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setErrorMessage('');
                }}
                placeholder='tu_usuario'
                maxLength={30}
                autoComplete='username'
                autoCapitalize='none'
                spellCheck={false}
                aria-invalid={!!errorMessage}
                aria-describedby='oauth-username-hint'
                className='w-full bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-zinc-600'
              />
            </div>
            <p id='oauth-username-hint' className='text-xs text-zinc-500'>
              3–30 caracteres, sin @. Solo letras, números, guiones y guiones bajos.
            </p>
            {errorMessage && (
              <p role='alert' className='text-sm text-red-400'>
                {errorMessage}
              </p>
            )}
          </div>

          <Button
            type='submit'
            disabled={saving}
            className='w-full bg-red-600 text-white hover:bg-red-700'
          >
            {saving ? 'Guardando...' : 'Guardar username'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
