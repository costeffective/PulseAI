import { parseNewSheetRows } from "@/lib/csv";
import { fetchSheetValues } from "@/lib/integrations/google-sheets";
import { getValidGoogleAccessToken } from "@/lib/integrations/google-oauth";
import { processBatchFromItems } from "@/lib/process-batch";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { createClient } from "@/lib/supabase/server";
import type { BatchSubmitItem, GoogleSheetCredentials } from "@/lib/types";

type AnySupabase =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClient>;

export interface IntegrationConnectionRow {
  id: string;
  user_id: string;
  name: string;
  status: string;
  spreadsheet_id: string;
  sheet_name: string;
  credentials: GoogleSheetCredentials;
  last_synced_at: string | null;
  last_synced_row: number;
}

export interface SyncResult {
  connectionId: string;
  newRows: number;
  batchId?: string;
  skipped: boolean;
}

function formatSyncBatchName(connectionName: string) {
  const date = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${connectionName} · ${date}`;
}

export async function syncGoogleSheetsConnection(
  supabase: AnySupabase,
  connection: IntegrationConnectionRow,
): Promise<SyncResult> {
  if (connection.status === "paused") {
    return { connectionId: connection.id, newRows: 0, skipped: true };
  }

  try {
    const { accessToken, credentials } = await getValidGoogleAccessToken(
      connection.credentials,
    );

    const values = await fetchSheetValues(
      connection.spreadsheet_id,
      connection.sheet_name,
      accessToken,
    );

    const parsed = parseNewSheetRows(values, connection.last_synced_row);

    if (parsed.length === 0) {
      await supabase
        .from("integration_connections")
        .update({
          credentials,
          last_synced_at: new Date().toISOString(),
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", connection.id);

      return { connectionId: connection.id, newRows: 0, skipped: true };
    }

    const items: BatchSubmitItem[] = parsed.map((row) => ({
      text: row.text,
      metadata: {
        ...row.metadata,
        Source: "Google Forms",
        "Sheet name": connection.sheet_name,
      },
    }));

    const { batchId } = await processBatchFromItems(
      supabase,
      connection.user_id,
      items,
      formatSyncBatchName(connection.name),
    );

    const dataRowCount = Math.max(values.length - 1, 0);

    await supabase
      .from("integration_connections")
      .update({
        credentials,
        status: "active",
        last_synced_at: new Date().toISOString(),
        last_synced_row: dataRowCount,
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connection.id);

    return {
      connectionId: connection.id,
      newRows: parsed.length,
      batchId,
      skipped: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";

    await supabase
      .from("integration_connections")
      .update({
        status: "error",
        last_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connection.id);

    throw error;
  }
}

export async function syncAllActiveConnections(
  supabase: ReturnType<typeof createAdminClient>,
) {
  const { data: connections, error } = await supabase
    .from("integration_connections")
    .select(
      "id, user_id, name, status, spreadsheet_id, sheet_name, credentials, last_synced_at, last_synced_row",
    )
    .eq("provider", "google_sheets")
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  const results: SyncResult[] = [];

  for (const connection of connections ?? []) {
    try {
      const result = await syncGoogleSheetsConnection(
        supabase,
        connection as IntegrationConnectionRow,
      );
      results.push(result);
    } catch {
      results.push({
        connectionId: connection.id,
        newRows: 0,
        skipped: true,
      });
    }
  }

  return results;
}
