import type { SupabaseClient } from '@supabase/supabase-js';

// Row shape of public.profiles as read by the app.
export type ProfileRow = {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
    location: string | null;
    biography: string | null;
    favorite_driver: string | null;
    favorite_team: string | null;
};

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: ProfileRow;
                Insert: Partial<ProfileRow>;
                Update: Partial<ProfileRow>;
                Relationships: [];
            };
        };
        Views: Record<string, never>;
        Functions: {
            delete_user: {
                Args: never;
                Returns: undefined;
            };
        };
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
};

export declare const supabase: SupabaseClient<Database>;
