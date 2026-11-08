import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Unit tests only need valid values when the Supabase client is imported.
vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
