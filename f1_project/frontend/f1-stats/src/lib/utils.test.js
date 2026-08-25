import { describe, expect, it } from 'vitest';
import {
    cn,
    emailValidator,
    formatDateToProfile,
    getDriverCode,
    getInitials,
    passwordCompare,
    usernameValidator,
} from './utils.js';

describe('cn', () => {
    it('merges class names into a single string', () => {
        expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('filters out falsy values', () => {
        const disabled = false;
        expect(cn('foo', disabled && 'bar', 'baz')).toBe('foo baz');
    });

    it('handles conditional objects', () => {
        expect(cn('base', { active: true, disabled: false })).toBe('base active');
    });

    it('merges tailwind classes keeping the last value', () => {
        expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });

    it('returns empty string when no inputs are provided', () => {
        expect(cn()).toBe('');
    });
});

describe('emailValidator', () => {
    it('returns true for valid emails', () => {
        expect(emailValidator('user@example.com')).toBe(true);
        expect(emailValidator('name.lastname@domain.co.uk')).toBe(true);
        expect(emailValidator('user+tag@example.org')).toBe(true);
    });

    it('returns false for invalid emails', () => {
        expect(emailValidator('notanemail')).toBe(false);
        expect(emailValidator('@example.com')).toBe(false);
        expect(emailValidator('user@')).toBe(false);
        expect(emailValidator('user@com')).toBe(false);
        expect(emailValidator('')).toBe(false);
    });
});

describe('usernameValidator', () => {
    it('returns true for valid usernames', () => {
        expect(usernameValidator('john_doe')).toBe(true);
        expect(usernameValidator('user123')).toBe(true);
        expect(usernameValidator('a-b-c')).toBe(true);
        expect(usernameValidator('abc')).toBe(true);
    });

    it('returns false for usernames shorter than 3 characters', () => {
        expect(usernameValidator('ab')).toBe(false);
        expect(usernameValidator('a')).toBe(false);
        expect(usernameValidator('')).toBe(false);
    });

    it('returns false for usernames longer than 30 characters', () => {
        expect(usernameValidator('a'.repeat(31))).toBe(false);
    });

    it('returns false for usernames with invalid characters', () => {
        expect(usernameValidator('user name')).toBe(false);
        expect(usernameValidator('user@name')).toBe(false);
        expect(usernameValidator('user.name')).toBe(false);
    });
});

describe('passwordCompare', () => {
    it('returns true when passwords match', () => {
        expect(passwordCompare('secret123', 'secret123')).toBe(true);
    });

    it('returns false when passwords differ', () => {
        expect(passwordCompare('secret123', 'secret321')).toBe(false);
    });

    it('is case sensitive', () => {
        expect(passwordCompare('Secret', 'secret')).toBe(false);
    });
});

describe('formatDateToProfile', () => {
    it('returns an empty string for empty input', () => {
        expect(formatDateToProfile('')).toBe('');
        expect(formatDateToProfile(null)).toBe('');
        expect(formatDateToProfile(undefined)).toBe('');
    });

    it('capitalizes the first letter of the formatted date', () => {
        const result = formatDateToProfile('2023-05-15');
        expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase());
        expect(result).toContain('2023');
    });
});

describe('getDriverCode', () => {
    it('returns the first three letters of the surname uppercased', () => {
        expect(getDriverCode('Fernando Alonso')).toBe('ALO');
        expect(getDriverCode('Lewis Hamilton')).toBe('HAM');
        expect(getDriverCode('Max Verstappen')).toBe('VER');
    });

    it('removes diacritics from the surname', () => {
        expect(getDriverCode('Sergio Pérez')).toBe('PER');
        expect(getDriverCode('Nico Hülkenberg')).toBe('HUL');
    });

    it('returns a single-word code for one-word names', () => {
        expect(getDriverCode('Schumacher')).toBe('SCH');
    });

    it('returns an empty string for empty or missing values', () => {
        expect(getDriverCode('')).toBe('');
        expect(getDriverCode(null)).toBe('');
        expect(getDriverCode(undefined)).toBe('');
    });

    it('trims extra whitespace', () => {
        expect(getDriverCode('  Charles Leclerc  ')).toBe('LEC');
    });
});

describe('getInitials', () => {
    it('returns the first two initials uppercased', () => {
        expect(getInitials('Lewis Hamilton')).toBe('LH');
        expect(getInitials('max verstappen')).toBe('MV');
    });

    it('returns a single initial for one-word names', () => {
        expect(getInitials('Schumacher')).toBe('S');
    });

    it('returns only the first two initials for names with more than two words', () => {
        expect(getInitials('Juan Manuel Fangio')).toBe('JM');
    });

    it('returns an empty string for empty or missing values', () => {
        expect(getInitials('')).toBe('');
        expect(getInitials(null)).toBe('');
        expect(getInitials(undefined)).toBe('');
    });

    it('ignores extra spaces', () => {
        expect(getInitials('  Lewis   Hamilton  ')).toBe('LH');
    });
});
