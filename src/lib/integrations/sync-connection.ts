import { parseNewSheetRows } from "@/lib/csv";
import { fetchSheetValues } from "@/lib/integrations/google-sheets";
import { getValidGoogleAccessToken } from "@/lib/integrations/google-oauth";
import {
  appendItemsToBatch,
  processBatchFromItems,
} from "@/lib/process-batch";
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
  batch_id: string | null;
  last_synced_at: string | null;
  last_synced_row: number;
}

export interface SyncResult {
  connectionId: string;
  newRows: number;
  batchId?: string;
  createdBatch: boolean;
  skipped: boolean;
}

function countNewDataRows(values: string[][], syncedDataRowCount: number) {
  if (values.length < 2) return 0;
  return Math.max(0, values.length - 1 - syncedDataRowCount);
}

async function getExistingBatchId(
  supabase: AnySupabase,
  connection: IntegrationConnectionRow,
): Promise<string | null> {
  if (!connection.batch_id) return null;

  const { data: existingBatch, error } = await supabase
    .from("batches")
    .select("id")
    .eq("id", connection.batch_id)
    .eq("user_id", connection.user_id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return existingBatch?.id ?? null;
}

async function markConnectionError(
  supabase: AnySupabase,
  connectionId: string,
  message: string,
) {
  await supabase
    .from("integration_connections")
    .update({
      last_error: message,
      status: "error",
      updated_at: new Date().toISOString(),
    })
    .eq("id", connectionId);
}

export async function syncGoogleSheetsConnection(
  supabase: AnySupabase,
  connection: IntegrationConnectionRow,
): Promise<SyncResult> {
  if (connection.status === "paused") {
    return {
      connectionId: connection.id,
      newRows: 0,
      skipped: true,
      createdBatch: false,
      batchId: connection.batch_id ?? undefined,
    };
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

    const rawNewRowCount = countNewDataRows(
      values,
      connection.last_synced_row,
    );
    const parsedRows = parseNewSheetRows(values, connection.last_synced_row);

    if (rawNewRowCount === 0) {
      await supabase
        .from("integration_connections")
        .update({
          credentials,
          last_synced_at: new Date().toISOString(),
          last_error: null,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", connection.id);

      return {
        connectionId: connection.id,
        newRows: 0,
        skipped: true,
        createdBatch: false,
        batchId: connection.batch_id ?? undefined,
      };
    }

    const items: BatchSubmitItem[] = parsedRows.map((row) => ({
      text: row.text,
      metadata: row.metadata,
    }));

    let batchId = connection.batch_id ?? undefined;
    let createdBatch = false;

    if (items.length > 0) {
      const existingBatchId = await getExistingBatchId(supabase, connection);

      if (existingBatchId) {
        const result = await appendItemsToBatch(
          supabase,
          existingBatchId,
          items,
        );
        batchId = result.batchId;
      } else {
        const result = await processBatchFromItems(
          supabase,
          connection.user_id,
          items,
          connection.name,
        );
        batchId = result.batchId;
        createdBatch = true;
      }
    }

    await supabase
      .from("integration_connections")
      .update({
        credentials,
        batch_id: batchId ?? connection.batch_id,
        last_synced_at: new Date().toISOString(),
        last_synced_row: connection.last_synced_row + rawNewRowCount,
        last_error: null,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", connection.id);

    return {
      connectionId: connection.id,
      newRows: items.length,
      batchId,
      createdBatch,
      skipped: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    await markConnectionError(supabase, connection.id, message);
    throw error;
  }
}

export async function syncAllActiveConnections(
  supabase: AnySupabase,
): Promise<SyncResult[]> {
  const { data: connections, error } = await supabase
    .from("integration_connections")
    .select(
      "id, user_id, name, status, spreadsheet_id, sheet_name, credentials, batch_id, last_synced_at, last_synced_row",
    )
    .eq("provider", "google_sheets")
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  const results: SyncResult[] = [];

  for (const connection of connections ?? []) {
    try {
      const result = await syncGoogleSheetsConnection(supabase, {
        ...connection,
        credentials: connection.credentials as GoogleSheetCredentials,
      });
      results.push(result);
    } catch {
      results.push({
        connectionId: connection.id,
        newRows: 0,
        skipped: true,
        createdBatch: false,
        batchId: connection.batch_id ?? undefined,
      });
    }
  }

  return results;
}
