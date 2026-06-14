import { NextResponse } from "next/server";
import { syncGoogleSheetsConnection } from "@/lib/integrations/sync-connection";
import { createClient } from "@/lib/supabase/server";
import type { GoogleSheetCredentials } from "@/lib/types";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: connection, error } = await supabase
    .from("integration_connections")
    .select(
      "id, user_id, name, status, spreadsheet_id, sheet_name, credentials, last_synced_at, last_synced_row",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !connection) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  try {
    const result = await syncGoogleSheetsConnection(supabase, {
      ...connection,
      credentials: connection.credentials as GoogleSheetCredentials,
    });

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
