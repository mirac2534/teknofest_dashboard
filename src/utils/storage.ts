export const storageKeys = {
  authSession: 'synapse.auth.session',
  themeMode: 'synapse.theme.mode',
} as const;

export function readJson<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}
