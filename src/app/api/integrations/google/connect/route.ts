import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  buildGoogleAuthUrl,
  decodeOAuthState,
  encodeOAuthState,
} from "@/lib/integrations/google-oauth";
import { extractSpreadsheetId } from "@/lib/csv";
import { createClient } from "@/lib/supabase/server";

const OAUTH_NONCE_COOKIE = "google_oauth_nonce";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams, origin } = new URL(request.url);
  const name = searchParams.get("name")?.trim();
  const spreadsheetInput = searchParams.get("spreadsheetId")?.trim();
  const sheetName = searchParams.get("sheetName")?.trim() || "Form Responses 1";

  if (!name || !spreadsheetInput) {
    return NextResponse.json(
      { error: "name and spreadsheetId are required" },
      { status: 400 },
    );
  }

  const spreadsheetId = extractSpreadsheetId(spreadsheetInput);
  if (!spreadsheetId) {
    return NextResponse.json(
      { error: "Invalid Google Sheets URL or spreadsheet ID" },
      { status: 400 },
    );
  }

  const nonce = crypto.randomUUID();
  const state = encodeOAuthState({
    nonce,
    name,
    spreadsheetId,
    sheetName,
  });

  const cookieStore = await cookies();
  cookieStore.set(OAUTH_NONCE_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(buildGoogleAuthUrl(origin, state));
}
