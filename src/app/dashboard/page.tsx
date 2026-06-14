"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Inbox, Plus } from "lucide-react";
import { BatchChatPanel } from "@/components/dashboard/BatchChatPanel";
import { BatchInsights } from "@/components/dashboard/BatchInsights";
import { BatchPanel } from "@/components/dashboard/BatchPanel";
import { FeedbackTable } from "@/components/dashboard/FeedbackTable";
import { FilterChips } from "@/components/dashboard/FilterChips";
import { TopBar } from "@/components/dashboard/TopBar";
import { NewBatchModal } from "@/components/NewBatchModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import {
  computeBatchStats,
  EMPTY_ITEM_FILTER,
  filterFeedbackItems,
  formatBatchDate,
  formatBatchName,
  getUniqueCategories,
  type FeedbackItemFilter,
} from "@/lib/stats";
import type { BatchListItem, BatchSubmitItem, BatchWithItems, FeedbackItem } from "@/lib/types";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-10 w-72 rounded-lg" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preferredBatchId = searchParams.get("batch");
  const [batches, setBatches] = useState<BatchListItem[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<BatchWithItems | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [itemFilter, setItemFilter] = useState<FeedbackItemFilter>(EMPTY_ITEM_FILTER);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchPanelOpen, setIsBatchPanelOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatSeedPrompt, setChatSeedPrompt] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [hasInitializedPanel, setHasInitializedPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mobileMq = window.matchMedia("(max-width: 1023px)");

    const updateViewport = () => {
      setIsMobile(mobileMq.matches);
    };

    updateViewport();
    mobileMq.addEventListener("change", updateViewport);
    return () => mobileMq.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    if (hasInitializedPanel) return;

    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    setIsBatchPanelOpen(isDesktop);
    setHasInitializedPanel(true);
  }, [hasInitializedPanel]);

  const loadBatch = useCallback(async (batchId: string) => {
    const response = await fetch(`/api/batches/${batchId}`);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        typeof data.error === "string" ? data.error : "Failed to load batch",
      );
    }

    const batch = data.batch as BatchWithItems;
    setSelectedBatch({
      ...batch,
      items: batch.items.map((item) => ({
        ...item,
        metadata: (item.metadata ?? {}) as FeedbackItem["metadata"],
      })),
    });
    setSelectedBatchId(batchId);
    setItemFilter(EMPTY_ITEM_FILTER);
  }, []);

  const refreshBatches = useCallback(
    async (preferredBatchId?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/batches");
        if (!response.ok) throw new Error("Failed to load batches");

        const data = await response.json();
        const nextBatches = data.batches as BatchListItem[];
        setBatches(nextBatches);

        if (nextBatches.length > 0) {
          const targetId =
            preferredBatchId &&
            nextBatches.some((batch) => batch.id === preferredBatchId)
              ? preferredBatchId
              : nextBatches[0].id;
          await loadBatch(targetId);
        } else {
          setSelectedBatch(null);
          setSelectedBatchId(null);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load dashboard",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [loadBatch],
  );

  useEffect(() => {
    void refreshBatches(preferredBatchId ?? undefined);
  }, [refreshBatches, preferredBatchId]);

  const stats = useMemo(
    () => computeBatchStats(selectedBatch?.items ?? []),
    [selectedBatch],
  );

  const categories = useMemo(
    () => getUniqueCategories(selectedBatch?.items ?? []),
    [selectedBatch],
  );

  const filteredItems = useMemo(
    () => filterFeedbackItems(selectedBatch?.items ?? [], itemFilter),
    [selectedBatch, itemFilter],
  );

  const handleCategorySelect = (category: string | null) => {
    setItemFilter(
      category
        ? { category, sentiment: null, priority: null }
        : EMPTY_ITEM_FILTER,
    );
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleCreateBatch = async (items: BatchSubmitItem[], name?: string) => {
    const response = await fetch("/api/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, name }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "Failed to create batch");
    }

    await refreshBatches(data.batchId);
  };

  const handleBatchSelect = (batchId: string) => {
    setIsBatchPanelOpen(false);
    void loadBatch(batchId);
  };

  const handleNewBatch = () => {
    setIsBatchPanelOpen(false);
    setIsModalOpen(true);
  };

  const handleRenameBatch = async (batchId: string, name: string) => {
    const response = await fetch(`/api/batches/${batchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        typeof data.error === "string" ? data.error : "Failed to rename batch",
      );
    }

    const updated = data.batch as BatchListItem;
    setBatches((current) =>
      current.map((batch) => (batch.id === batchId ? { ...batch, name: updated.name } : batch)),
    );

    if (selectedBatchId === batchId) {
      setSelectedBatch((current) =>
        current ? { ...current, name: updated.name } : current,
      );
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    const response = await fetch(`/api/batches/${batchId}`, {
      method: "DELETE",
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        typeof data.error === "string" ? data.error : "Failed to delete batch",
      );
    }

    const remainingBatches = batches.filter((batch) => batch.id !== batchId);
    setBatches(remainingBatches);

    if (selectedBatchId === batchId) {
      if (remainingBatches.length > 0) {
        await loadBatch(remainingBatches[0].id);
      } else {
        setSelectedBatch(null);
        setSelectedBatchId(null);
      }
    }
  };

  const openChat = (prompt?: string) => {
    if (prompt) setChatSeedPrompt(prompt);
    setIsChatOpen(true);
  };

  const closeBatchPanel = () => setIsBatchPanelOpen(false);
  const openBatchPanel = () => setIsBatchPanelOpen(true);

  const batchPanelProps = {
    batches,
    selectedBatchId,
    onBatchSelect: handleBatchSelect,
    onNewBatch: handleNewBatch,
    onClose: closeBatchPanel,
    onRename: handleRenameBatch,
    onDelete: handleDeleteBatch,
  };

  return (
    <div className="app-shell-bg flex min-h-full">
      {isBatchPanelOpen && !isMobile && (
        <aside className="flex w-72 shrink-0 flex-col border-r border-border/60 bg-background/80 backdrop-blur-md">
          <BatchPanel {...batchPanelProps} />
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          showBatchesButton={!isBatchPanelOpen}
          showChatButton={Boolean(selectedBatch)}
          onOpenBatches={openBatchPanel}
          onOpenChat={() => openChat()}
          onNewBatch={handleNewBatch}
          onSignOut={() => void handleSignOut()}
        />

        <main className="mx-auto w-full max-w-6xl space-y-8 px-6 pb-10 pt-24">
          {selectedBatch && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current batch</p>
              <h1 className="font-heading text-3xl tracking-tight text-foreground">
                {formatBatchName(selectedBatch.name, selectedBatch.created_at)}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatBatchDate(selectedBatch.created_at)}
              </p>
            </div>
          )}

          {isLoading ? (
            <DashboardSkeleton />
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : !selectedBatch ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/70 px-6 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/8 text-primary ring-1 ring-primary/15">
                <Inbox className="size-6" />
              </div>
              <h2 className="mt-5 font-heading text-2xl tracking-tight">No batches yet</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Paste feedback or upload a CSV to generate your first AI-triaged batch.
                We&apos;ll classify sentiment, category, and priority automatically.
              </p>
              <Button className="mt-6" onClick={handleNewBatch}>
                <Plus />
                Create your first batch
              </Button>
            </div>
          ) : (
            <>
              <BatchInsights
                stats={stats}
                summary={selectedBatch.summary}
                status={selectedBatch.status}
                itemFilter={itemFilter}
                onFilterChange={setItemFilter}
                onOpenChat={() => openChat()}
                onAskPrompt={(prompt) => openChat(prompt)}
              />
              <FilterChips
                categories={categories}
                selectedCategory={itemFilter.category}
                hasOtherFilters={
                  itemFilter.sentiment !== null || itemFilter.priority !== null
                }
                onSelect={handleCategorySelect}
              />
              <FeedbackTable items={filteredItems} />
            </>
          )}
        </main>
      </div>

      <Sheet
        open={isBatchPanelOpen && isMobile}
        onOpenChange={(open) => setIsBatchPanelOpen(open)}
      >
        <SheetContent side="left" className="w-80 gap-0 p-0 sm:max-w-sm" showCloseButton={false}>
          <BatchPanel {...batchPanelProps} />
        </SheetContent>
      </Sheet>

      <NewBatchModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateBatch}
      />

      <BatchChatPanel
        batchId={selectedBatchId}
        batchName={
          selectedBatch
            ? formatBatchName(selectedBatch.name, selectedBatch.created_at)
            : null
        }
        open={isChatOpen}
        onOpenChange={setIsChatOpen}
        seedPrompt={chatSeedPrompt}
        onSeedConsumed={() => setChatSeedPrompt(null)}
      />
    </div>
  );
}
