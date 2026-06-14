"use client";

import { LogOut, MessageSquare, PanelLeft, Plus } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface TopBarProps {
  onOpenBatches?: () => void;
  onOpenChat?: () => void;
  onNewBatch: () => void;
  onSignOut: () => void;
  showBatchesButton?: boolean;
  showChatButton?: boolean;
}

export function TopBar({
  onOpenBatches,
  onOpenChat,
  onNewBatch,
  onSignOut,
  showBatchesButton = false,
  showChatButton = false,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 px-6 py-3.5">
        <div className="flex items-center gap-2">
          {showBatchesButton && onOpenBatches && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenBatches}
              aria-label="Open batches"
            >
              <PanelLeft />
              Batches
            </Button>
          )}
          <Logo size="sm" />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {showChatButton && onOpenChat && (
            <Button variant="outline" size="sm" onClick={onOpenChat}>
              <MessageSquare />
              <span className="hidden sm:inline">Ask AI</span>
            </Button>
          )}

          <ThemeToggle />

          <Button onClick={onNewBatch} size="sm" className="hidden sm:inline-flex">
            <Plus />
            New batch
          </Button>
          <Button onClick={onNewBatch} size="sm" className="sm:hidden" aria-label="New batch">
            <Plus />
          </Button>
          <Separator orientation="vertical" className="hidden h-6 sm:block" />
          <Button variant="outline" size="sm" onClick={onSignOut}>
            <LogOut />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
