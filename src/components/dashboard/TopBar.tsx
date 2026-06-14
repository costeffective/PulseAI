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
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-3 sm:px-6">
      <header className="glass-dock pointer-events-auto flex w-full max-w-6xl items-center justify-between gap-3 px-3 py-2 sm:px-4">
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

        <div className="glass-dock-actions flex items-center gap-1">
          {showChatButton && onOpenChat && (
            <Button variant="ghost" size="sm" onClick={onOpenChat}>
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
          <Separator orientation="vertical" className="hidden h-5 sm:block" />
          <Button variant="ghost" size="sm" onClick={onSignOut}>
            <LogOut />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </header>
    </div>
  );
}
