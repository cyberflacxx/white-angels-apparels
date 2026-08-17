const tokenKey = "wa-admin-token";

export function getAdminToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(tokenKey) ?? "";
}

export function setAdminToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(tokenKey, token);
}

export function clearAdminToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(tokenKey);
}
