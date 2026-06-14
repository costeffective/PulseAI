import type { GoogleSheetCredentials } from "@/lib/types";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_READONLY_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

export function getGoogleRedirectUri(origin: string) {
  return `${origin}/api/integrations/google/callback`;
}

export function buildGoogleAuthUrl(origin: string, state: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(origin),
    response_type: "code",
    scope: SHEETS_READONLY_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

async function postTokenRequest(body: URLSearchParams): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured");
  }

  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await response.json().catch(() => ({}))) as GoogleTokenResponse & {
    error?: string;
    error_description?: string;
  };

  if (!response.ok) {
    throw new Error(data.error_description ?? data.error ?? "Google token exchange failed");
  }

  return data;
}

export async function exchangeGoogleCode(
  code: string,
  origin: string,
): Promise<GoogleSheetCredentials> {
  const data = await postTokenRequest(
    new URLSearchParams({
      code,
      redirect_uri: getGoogleRedirectUri(origin),
      grant_type: "authorization_code",
    }),
  );

  if (!data.refresh_token) {
    throw new Error("Google did not return a refresh token. Try connecting again.");
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

export async function refreshGoogleAccessToken(
  credentials: GoogleSheetCredentials,
): Promise<GoogleSheetCredentials> {
  const data = await postTokenRequest(
    new URLSearchParams({
      refresh_token: credentials.refresh_token,
      grant_type: "refresh_token",
    }),
  );

  return {
    access_token: data.access_token,
    refresh_token: credentials.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

export async function getValidGoogleAccessToken(
  credentials: GoogleSheetCredentials,
): Promise<{ accessToken: string; credentials: GoogleSheetCredentials }> {
  if (credentials.expires_at > Date.now() + 60_000) {
    return { accessToken: credentials.access_token, credentials };
  }

  const refreshed = await refreshGoogleAccessToken(credentials);
  return { accessToken: refreshed.access_token, credentials: refreshed };
}

export interface GoogleOAuthState {
  nonce: string;
  name: string;
  spreadsheetId: string;
  sheetName: string;
}

export function encodeOAuthState(state: GoogleOAuthState) {
  return Buffer.from(JSON.stringify(state)).toString("base64url");
}

export function decodeOAuthState(value: string): GoogleOAuthState {
  const parsed = JSON.parse(
    Buffer.from(value, "base64url").toString("utf8"),
  ) as GoogleOAuthState;

  if (!parsed.nonce || !parsed.name || !parsed.spreadsheetId || !parsed.sheetName) {
    throw new Error("Invalid OAuth state");
  }

  return parsed;
}
