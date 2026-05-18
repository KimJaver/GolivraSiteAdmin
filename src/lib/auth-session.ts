const STORAGE_KEY = "golivra_admin_token";
const REMEMBER_KEY = "golivra_admin_remember";

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getAdminToken(): string | null {
  return readStorage(STORAGE_KEY);
}

export function isRememberMeEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(REMEMBER_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAdminToken(token: string, remember = false): void {
  clearAdminToken();
  if (remember) {
    localStorage.setItem(STORAGE_KEY, token);
    localStorage.setItem(REMEMBER_KEY, "1");
  } else {
    sessionStorage.setItem(STORAGE_KEY, token);
    localStorage.removeItem(REMEMBER_KEY);
  }
}

export function clearAdminToken(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(REMEMBER_KEY);
  } catch {
    /* ignore */
  }
}
