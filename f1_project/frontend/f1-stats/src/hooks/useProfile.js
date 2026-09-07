import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { fetchProfileById } from '@/service/supabaseService';

const emptyProfile = {
  id: '',
  full_name: '',
  username: '',
  avatar_url: '',
  created_at: '',
};

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchProfileById(user.id);
        if (data) {
          setProfile({
            id: data.id || '',
            full_name: data.full_name || data.username || '',
            username: data.username || '',
            avatar_url: data.avatar_url || '',
            created_at: data.created_at || '',
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  return { profile, loading, error, user };
}
