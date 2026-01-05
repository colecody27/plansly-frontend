import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const DEFAULT_THEME = 'plannit';

export const theme = writable(DEFAULT_THEME);

export const initTheme = () => {
  if (!browser) {
    return;
  }

  const stored = localStorage.getItem('plannit-theme');
  theme.set(stored ?? DEFAULT_THEME);

  theme.subscribe((value) => {
    document.documentElement.setAttribute('data-theme', value);
    localStorage.setItem('plannit-theme', value);
  });
};
