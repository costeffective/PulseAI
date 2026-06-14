"use client";

import { Inbox, Loader2, MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatBatchDate, formatBatchName } from "@/lib/stats";
import type { BatchListItem } from "@/lib/types";

interface BatchPanelProps {
  batches: BatchListItem[];
  selectedBatchId: string | null;
  onBatchSelect: (batchId: string) => void;
  onNewBatch: () => void;
  onClose?: () => void;
  onRename: (batchId: string, name: string) => Promise<void>;
  onDelete: (batchId: string) => Promise<void>;
  className?: string;
}

function statusLabel(status: BatchListItem["status"]) {
  switch (status) {
    case "processing":
      return "Analyzing";
    case "failed":
      return "Failed";
    default:
      return null;
  }
}

export function BatchPanel({
  batches,
  selectedBatchId,
  onBatchSelect,
  onNewBatch,
  onClose,
  onRename,
  onDelete,
  className,
}: BatchPanelProps) {
  const [renameTarget, setRenameTarget] = useState<BatchListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BatchListItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const openRenameDialog = (batch: BatchListItem) => {
    setActionError(null);
    setRenameTarget(batch);
    setRenameValue(batch.name.trim() || formatBatchName(batch.name, batch.created_at));
  };

  const closeRenameDialog = () => {
    if (isRenaming) return;
    setRenameTarget(null);
    setRenameValue("");
    setActionError(null);
  };

  const closeDeleteDialog = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
    setActionError(null);
  };

  const handleRename = async () => {
    if (!renameTarget) return;

    const trimmed = renameValue.trim();
    if (!trimmed) {
      setActionError("Enter a batch name");
      return;
    }

    setIsRenaming(true);
    setActionError(null);

    try {
      await onRename(renameTarget.id, trimmed);
      closeRenameDialog();
    } catch (renameError) {
      setActionError(
        renameError instanceof Error ? renameError.message : "Failed to rename batch",
      );
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setActionError(null);

    try {
      await onDelete(deleteTarget.id);
      closeDeleteDialog();
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error ? deleteError.message : "Failed to delete batch",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className={cn("flex h-full flex-col", className)}>
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-4">
          <div>
            <h2 className="font-sans text-sm font-semibold text-foreground">Batches</h2>
            <p className="text-xs text-muted-foreground">{batches.length} total</p>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" onClick={onNewBatch}>
              <Plus />
              New
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                aria-label="Close batches panel"
              >
                <X />
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {batches.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-4 py-10 text-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary ring-1 ring-primary/15">
                <Inbox className="size-4" />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">No batches yet</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Create your first batch to start triaging feedback.
              </p>
              <Button className="mt-4" size="sm" onClick={onNewBatch}>
                <Plus />
                Create batch
              </Button>
            </div>
          ) : (
            <ul className="space-y-1">
              {batches.map((batch) => {
                const isSelected = batch.id === selectedBatchId;
                const status = statusLabel(batch.status);

                return (
                  <li key={batch.id}>
                    <div
                      className={cn(
                        "group flex items-start gap-1 rounded-lg border transition-colors",
                        isSelected
                          ? "border-primary/25 bg-primary/8 ring-1 ring-primary/15"
                          : "border-transparent hover:border-border/60 hover:bg-muted/50",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => onBatchSelect(batch.id)}
                        className="min-w-0 flex-1 px-3 py-3 text-left"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "line-clamp-2 text-sm font-medium leading-5",
                              isSelected ? "text-foreground" : "text-foreground/90",
                            )}
                          >
                            {formatBatchName(batch.name, batch.created_at)}
                          </p>
                          {batch.status === "processing" && (
                            <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatBatchDate(batch.created_at)}
                        </p>
                        {status && (
                          <p
                            className={cn(
                              "mt-1 text-xs font-medium",
                              batch.status === "failed"
                                ? "text-destructive"
                                : "text-muted-foreground",
                            )}
                          >
                            {status}
                          </p>
                        )}
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="mt-2 mr-1 shrink-0 opacity-70 transition-opacity hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:data-popup-open:opacity-100"
                              aria-label={`Batch actions for ${formatBatchName(batch.name, batch.created_at)}`}
                              onClick={(event) => event.stopPropagation()}
                            />
                          }
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => openRenameDialog(batch)}>
                            <Pencil />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => {
                              setActionError(null);
                              setDeleteTarget(batch);
                            }}
                          >
                            <Trash2 />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <Dialog open={renameTarget !== null} onOpenChange={(open) => !open && closeRenameDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-sans text-lg font-semibold">Rename batch</DialogTitle>
            <DialogDescription>
              Give this batch a name you&apos;ll recognize later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-batch">Batch name</Label>
            <Input
              id="rename-batch"
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleRename();
              }}
              autoFocus
            />
            {actionError && (
              <p className="text-sm text-destructive">{actionError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeRenameDialog} disabled={isRenaming}>
              Cancel
            </Button>
            <Button onClick={() => void handleRename()} disabled={isRenaming}>
              {isRenaming ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && closeDeleteDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-sans text-lg font-semibold">Delete batch?</DialogTitle>
            <DialogDescription>
              This permanently removes{" "}
              <span className="font-medium text-foreground">
                {deleteTarget
                  ? formatBatchName(deleteTarget.name, deleteTarget.created_at)
                  : "this batch"}
              </span>{" "}
              and all of its feedback items. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {actionError && (
            <p className="text-sm text-destructive">{actionError}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteDialog} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete batch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
