import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export const token = writable<string | null>(null);

export const initAuth = () => {
  if (!browser) {
    return;
  }

  const stored = localStorage.getItem('plannit-token');
  token.set(stored ?? null);

  token.subscribe((value) => {
    if (value) {
      localStorage.setItem('plannit-token', value);
    } else {
      localStorage.removeItem('plannit-token');
    }
  });
};
