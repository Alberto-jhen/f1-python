import { useState } from 'react';
import { GlobeIcon, X } from 'lucide-react';
import { toast } from 'sonner';

import { ProfileSection } from './ProfileSection';
import { GenericCombobox } from '@/components/GenericComobobox';
import { COUNTRY_OPTIONS, getFlagEmojiByName } from '@/lib/countries';
import { uploadLocationToSupabase } from '@/service/supabaseService';

export function LocationSection({ userId, location, onSaved }) {
  const [saving, setSaving] = useState(false);

  const saveLocation = async (nextLocation) => {
    if (!userId) {
      toast.error('No se ha detectado un usuario logueado');
      return;
    }
    setSaving(true);
    try {
      await uploadLocationToSupabase(nextLocation, userId);
      toast.success(nextLocation ? 'País actualizado' : 'País eliminado');
      onSaved?.(nextLocation);
    } catch (error) {
      console.error('Error al guardar el país:', error);
      toast.error('Error al guardar el país');
    } finally {
      setSaving(false);
    }
  };

  const flag = location ? getFlagEmojiByName(location) : null;

  return (
    <ProfileSection title='País' icon={GlobeIcon}>
      <div className='flex items-center gap-4 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800'>
        <span className='text-4xl leading-none' aria-hidden='true'>
          {flag || '🏳️'}
        </span>
        <div className='min-w-0'>
          <p className='text-sm font-bold text-white truncate'>
            {location || 'Sin seleccionar'}
          </p>
          <p className='text-xs text-zinc-500'>
            {location ? 'Tu país de origen' : 'Elige de qué país eres'}
          </p>
        </div>
        {location && (
          <button
            type='button'
            onClick={() => saveLocation(null)}
            disabled={saving}
            title='Quitar país'
            className='ml-auto p-1.5 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50'
          >
            <X className='size-4' />
          </button>
        )}
      </div>
      <div className='mt-4'>
        <GenericCombobox
          options={COUNTRY_OPTIONS}
          value={location || ''}
          onChange={(countryName) => saveLocation(countryName)}
          placeholder='Selecciona tu país...'
          disabled={saving}
        />
      </div>
    </ProfileSection>
  );
}
