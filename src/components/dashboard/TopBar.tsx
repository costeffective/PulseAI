"use client";

import { LogOut, MessageSquare, PanelLeft, Plus } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const dockBtn = "h-8 rounded-full px-3.5";

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
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-3 pt-3 sm:px-6 sm:pt-3">
      <header className="glass-dock pointer-events-auto flex w-full max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-5 sm:py-2.5">
        <div className="flex items-center gap-2">
          {showBatchesButton && onOpenBatches && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenBatches}
              aria-label="Open batches"
              className={cn(dockBtn)}
            >
              <PanelLeft />
              Batches
            </Button>
          )}
          <Logo size="sm" />
        </div>

        <div className="glass-dock-actions flex min-w-0 items-center gap-0.5 overflow-x-auto p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {showChatButton && onOpenChat && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenChat}
              className={cn(dockBtn)}
            >
              <MessageSquare />
              <span className="hidden sm:inline">Ask AI</span>
            </Button>
          )}

          <ThemeToggle />

          <Button
            onClick={onNewBatch}
            size="sm"
            className={cn(dockBtn, "hidden sm:inline-flex")}
          >
            <Plus />
            New batch
          </Button>
          <Button
            onClick={onNewBatch}
            size="sm"
            className={cn(dockBtn, "sm:hidden")}
            aria-label="New batch"
          >
            <Plus />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            className={cn(dockBtn)}
          >
            <LogOut />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </header>
    </div>
  );
}
