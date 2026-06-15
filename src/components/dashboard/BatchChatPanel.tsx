"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CHAT_SUGGESTED_PROMPTS } from "@/lib/chat-prompts";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = CHAT_SUGGESTED_PROMPTS;

interface BatchChatPanelProps {
  batchId: string | null;
  batchName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seedPrompt?: string | null;
  onSeedConsumed?: () => void;
}

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
  };
}

export function BatchChatPanel({
  batchId,
  batchName,
  open,
  onOpenChange,
  seedPrompt,
  onSeedConsumed,
}: BatchChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastBatchId = useRef<string | null>(null);
  const seedHandled = useRef<string | null>(null);

  useEffect(() => {
    if (batchId !== lastBatchId.current) {
      setMessages([]);
      setInput("");
      setError(null);
      seedHandled.current = null;
      lastBatchId.current = batchId;
    }
  }, [batchId]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !batchId || isSending) return;

    const userMessage = createMessage("user", trimmed);
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsSending(true);

    try {
      const response = await fetch(`/api/batches/${batchId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Failed to get AI reply",
        );
      }

      setMessages((current) => [
        ...current,
        createMessage("assistant", String(data.reply)),
      ]);
    } catch (sendError) {
      setError(
        sendError instanceof Error ? sendError.message : "Failed to send message",
      );
      setMessages((current) => current.slice(0, -1));
      setInput(trimmed);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  useEffect(() => {
    if (!seedPrompt) {
      seedHandled.current = null;
    }
  }, [seedPrompt]);

  useEffect(() => {
    if (!open || !seedPrompt || !batchId || isSending) return;
    if (seedHandled.current === seedPrompt) return;

    seedHandled.current = seedPrompt;
    onSeedConsumed?.();
    void sendMessage(seedPrompt);
  }, [open, seedPrompt, batchId, isSending, onSeedConsumed]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-full max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <SheetHeader className="shrink-0 space-y-1.5 border-b border-border/60 px-6 py-5 pr-14">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <MessageSquare className="size-4" />
            </div>
            <div>
              <SheetTitle className="font-sans text-lg font-semibold leading-tight">
                Ask AI
              </SheetTitle>
              <SheetDescription className="font-sans text-sm leading-6">
                Chat about {batchName ? `"${batchName}"` : "this batch"}.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5">
          {messages.length === 0 ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-5">
                <div className="flex items-start gap-3">
                  <MessageSquare className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p className="font-sans text-sm leading-6 text-muted-foreground">
                    Ask questions about trends, priorities, themes, or specific
                    feedback in this batch. The AI only uses your uploaded data.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Suggested questions
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <Button
                      key={prompt}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-auto whitespace-normal px-3 py-2 text-left text-xs leading-5"
                      onClick={() => void sendMessage(prompt)}
                      disabled={!batchId || isSending}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[90%] rounded-2xl px-4 py-3 font-sans text-sm leading-6",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border/70 bg-muted/30 text-foreground",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Thinking…
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="shrink-0 border-t border-border/60 bg-background px-6 py-4"
        >
          {error && (
            <p className="mb-3 font-sans text-sm text-destructive">{error}</p>
          )}
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about this batch…"
              rows={2}
              className="min-h-11 resize-none text-sm leading-6"
              disabled={!batchId || isSending}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage(input);
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              className="size-11 shrink-0"
              disabled={!batchId || !input.trim() || isSending}
              aria-label="Send message"
            >
              <Send />
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
