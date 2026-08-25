import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function emailValidator(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export function usernameValidator(name) {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(name);
}

export function passwordCompare(password, passwordConfirm) {
  return password === passwordConfirm;
}


export function formatDateToProfile(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString.replace(' ', 'T'));
    
    const formattedDate = date.toLocaleDateString('es-ES', { 
        month: 'long', 
        year: 'numeric' 
    });

    return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
};

export function getInitials(fullName) {
    if (!fullName) return '';
    return fullName
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export function getDriverCode(fullName) {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    const surname = parts[parts.length - 1];
    return surname
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .slice(0, 3)
        .toUpperCase();
}
