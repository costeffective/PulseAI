"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, Sheet, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { extractItemsFromUpload } from "@/lib/csv";
import { generateBatchName, parseFeedbackLines } from "@/lib/stats";
import type { BatchSubmitItem } from "@/lib/types";

interface NewBatchModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (items: BatchSubmitItem[], name?: string) => Promise<void>;
}

export function NewBatchModal({ open, onClose, onSubmit }: NewBatchModalProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [uploadHint, setUploadHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedItems, setParsedItems] = useState<BatchSubmitItem[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setText("");
    setName("");
    setUploadHint(null);
    setError(null);
    setIsSubmitting(false);
    setParsedItems(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isSubmitting) {
      reset();
      onClose();
    }
  };

  const handleCsvUpload = async (file: File) => {
    try {
      setError(null);
      const items = await extractItemsFromUpload(file);
      setParsedItems(items);
      setText(items.map((item) => item.text).join("\n"));

      const withMetadata = items.filter(
        (item) => Object.keys(item.metadata).length > 0,
      ).length;

      setUploadHint(
        withMetadata > 0
          ? `Imported ${items.length} rows. Detected feedback column and preserved extra fields (name, email, etc.) for ${withMetadata} items.`
          : `Imported ${items.length} feedback items from ${file.name}.`,
      );
    } catch (uploadError) {
      setParsedItems(null);
      setUploadHint(null);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not read file",
      );
    }
  };

  const handleSubmit = async () => {
    const items: BatchSubmitItem[] =
      parsedItems ??
      parseFeedbackLines(text).map((line) => ({
        text: line,
        metadata: {},
      }));

    if (items.length === 0) {
      setError("Add at least one feedback item");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(items, name.trim() || undefined);
      reset();
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create batch",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnectGoogleForms = () => {
    if (isSubmitting) return;
    reset();
    onClose();
    router.push("/dashboard/integrations");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-2 border-b border-border/60 px-6 py-5">
          <DialogTitle className="font-sans text-xl font-semibold">
            New feedback batch
          </DialogTitle>
          <DialogDescription className="text-sm leading-6">
            Paste feedback one item per line, or upload a CSV/Excel export.
            We&apos;ll auto-detect the feedback column and keep name, email, and
            other fields when available.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          <button
            type="button"
            onClick={handleConnectGoogleForms}
            disabled={isSubmitting}
            className="flex w-full items-start gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4 text-left transition-colors hover:bg-muted/40 disabled:opacity-50"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <Sheet className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="font-sans text-sm font-semibold text-foreground">
                Connect Google Forms
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Link a response sheet and auto-sync new submissions once per day.
              </p>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-xs font-medium text-muted-foreground">or add manually</span>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="batch-name" className="text-sm font-medium">
              Batch name (optional)
            </Label>
            <Input
              id="batch-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={generateBatchName()}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to auto-name, e.g. &ldquo;{generateBatchName()}&rdquo;
            </p>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="feedback-items" className="text-sm font-medium">
              Feedback items
            </Label>
            <Textarea
              id="feedback-items"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setParsedItems(null);
                setUploadHint(null);
              }}
              rows={10}
              placeholder="Paste one feedback item per line"
              className="min-h-48 resize-y text-sm leading-6"
            />
            <p className="text-xs leading-5 text-muted-foreground">
              For spreadsheets, we look for columns named Feedback, Comment,
              Response, etc. Other columns are saved as details you can view per
              item.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleCsvUpload(file);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="h-10"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
          >
            <FileUp />
            Upload CSV or Excel
          </Button>

          {uploadHint && (
            <Alert>
              <AlertDescription className="text-sm leading-6">
                {uploadHint}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm leading-6">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="border-t border-border/60 bg-muted/20 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="h-10"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="h-10"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Sparkles />
                Analyze batch
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
