import type { createClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

const BATCH_FIELDS_WITH_ANALYSIS =
  "id, user_id, name, summary, analysis, status, created_at";
const BATCH_FIELDS_WITHOUT_ANALYSIS =
  "id, user_id, name, summary, status, created_at";

export function isMissingAnalysisColumn(message: string) {
  return /analysis/i.test(message) && /column|schema cache/i.test(message);
}

export async function fetchBatchRecord(
  supabase: ServerSupabase,
  id: string,
) {
  const withAnalysis = await supabase
    .from("batches")
    .select(BATCH_FIELDS_WITH_ANALYSIS)
    .eq("id", id)
    .single();

  if (!withAnalysis.error && withAnalysis.data) {
    return withAnalysis;
  }

  if (
    withAnalysis.error &&
    !isMissingAnalysisColumn(withAnalysis.error.message)
  ) {
    return withAnalysis;
  }

  const withoutAnalysis = await supabase
    .from("batches")
    .select(BATCH_FIELDS_WITHOUT_ANALYSIS)
    .eq("id", id)
    .single();

  if (withoutAnalysis.error || !withoutAnalysis.data) {
    return withoutAnalysis;
  }

  return {
    data: { ...withoutAnalysis.data, analysis: null },
    error: null,
  };
}
