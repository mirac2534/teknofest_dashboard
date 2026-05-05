import type { AuthSession } from '../types/auth';
import { readJson, storageKeys, writeJson } from '../utils/storage';

const DEMO_USERNAME = 'Synapse';
const DEMO_PASSWORD = '1516';

export function getStoredSession() {
  return readJson<AuthSession>(storageKeys.authSession);
}

export function authenticate(username: string, password: string): AuthSession {
  if (username.trim() !== DEMO_USERNAME || password !== DEMO_PASSWORD) {
    throw new Error('Kullanıcı adı veya şifre hatalı.');
  }

  const session: AuthSession = {
    username: DEMO_USERNAME,
    authenticatedAt: new Date().toISOString(),
  };

  writeJson(storageKeys.authSession, session);
  sessionStorage.setItem('synapse.session.pulse', new Date().toISOString());
  return session;
}

export function clearSession() {
  localStorage.removeItem(storageKeys.authSession);
  sessionStorage.removeItem('synapse.session.pulse');
}
