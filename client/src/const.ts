import { encodeOAuthState } from "@shared/const";

export const APP_ID = import.meta.env.VITE_APP_ID || "";
export const OAUTH_PORTAL_URL = import.meta.env.VITE_OAUTH_PORTAL_URL || "";

export const getLoginUrl = () => {
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  const nonce = crypto.randomUUID();
  document.cookie = `__Host-oauth_state=${nonce}; Path=/; Max-Age=600; SameSite=None; Secure`;

  const state = encodeOAuthState({ redirectUri, nonce });

  const params = new URLSearchParams({
    app_id: APP_ID,
    redirect_url: redirectUri,
    state,
  });

  return `${OAUTH_PORTAL_URL}/login?${params.toString()}`;
};
