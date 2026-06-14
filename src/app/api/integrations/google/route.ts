import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { IntegrationConnectionListItem } from "@/lib/types";

const PUBLIC_FIELDS =
  "id, provider, name, status, spreadsheet_id, sheet_name, batch_id, last_synced_at, last_synced_row, last_error, created_at, updated_at";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("integration_connections")
    .select(PUBLIC_FIELDS)
    .eq("provider", "google_sheets")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    connections: (data ?? []) as IntegrationConnectionListItem[],
  });
}
