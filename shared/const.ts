export const COOKIE_NAME = "__session";
export const OAUTH_STATE_COOKIE = "__Host-oauth_state";

export type OAuthState = {
  redirectUri: string;
  nonce: string;
};

export function encodeOAuthState(state: OAuthState): string {
  return btoa(JSON.stringify(state));
}

export function decodeOAuthState(raw: string | undefined | null): Partial<OAuthState> {
  if (!raw) return {};
  try {
    const decoded = JSON.parse(atob(raw)) as OAuthState;
    if (typeof decoded.redirectUri !== "string" || typeof decoded.nonce !== "string") {
      return {};
    }
    return decoded;
  } catch {
    return {};
  }
}

export const APP_ID = process.env.VITE_APP_ID || "";
export const OAUTH_PORTAL_URL = process.env.VITE_OAUTH_PORTAL_URL || "";
export const ANALYTICS_ENDPOINT = process.env.VITE_ANALYTICS_ENDPOINT || "";
export const ANALYTICS_WEBSITE_ID = process.env.VITE_ANALYTICS_WEBSITE_ID || "";
