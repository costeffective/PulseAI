import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  decodeOAuthState,
  exchangeGoogleCode,
} from "@/lib/integrations/google-oauth";
import { createClient } from "@/lib/supabase/server";

const OAUTH_NONCE_COOKIE = "google_oauth_nonce";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/dashboard/integrations?error=${encodeURIComponent(oauthError)}`,
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${origin}/dashboard/integrations?error=missing_code`,
    );
  }

  const cookieStore = await cookies();
  const nonce = cookieStore.get(OAUTH_NONCE_COOKIE)?.value;
  cookieStore.delete(OAUTH_NONCE_COOKIE);

  try {
    const parsedState = decodeOAuthState(state);

    if (!nonce || parsedState.nonce !== nonce) {
      return NextResponse.redirect(
        `${origin}/dashboard/integrations?error=invalid_state`,
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${origin}/login`);
    }

    const credentials = await exchangeGoogleCode(code, origin);

    const { data: existing } = await supabase
      .from("integration_connections")
      .select("id")
      .eq("user_id", user.id)
      .eq("spreadsheet_id", parsedState.spreadsheetId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("integration_connections")
        .update({
          name: parsedState.name,
          sheet_name: parsedState.sheetName,
          credentials,
          status: "active",
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        return NextResponse.redirect(
          `${origin}/dashboard/integrations?error=${encodeURIComponent(error.message)}`,
        );
      }
    } else {
      const { error } = await supabase.from("integration_connections").insert({
        user_id: user.id,
        provider: "google_sheets",
        name: parsedState.name,
        spreadsheet_id: parsedState.spreadsheetId,
        sheet_name: parsedState.sheetName,
        credentials,
        status: "active",
      });

      if (error) {
        return NextResponse.redirect(
          `${origin}/dashboard/integrations?error=${encodeURIComponent(error.message)}`,
        );
      }
    }

    return NextResponse.redirect(`${origin}/dashboard/integrations?connected=1`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "oauth_failed";
    return NextResponse.redirect(
      `${origin}/dashboard/integrations?error=${encodeURIComponent(message)}`,
    );
  }
}
