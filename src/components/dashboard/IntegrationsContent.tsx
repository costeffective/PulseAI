"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Sheet,
  Trash2,
} from "lucide-react";
import { TopBar } from "@/components/dashboard/TopBar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { IntegrationConnectionListItem } from "@/lib/types";

function formatRelativeTime(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString();
}

function statusVariant(status: IntegrationConnectionListItem["status"]) {
  if (status === "active") return "default" as const;
  if (status === "paused") return "secondary" as const;
  return "destructive" as const;
}

export function IntegrationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<IntegrationConnectionListItem[]>([]);
  const [name, setName] = useState("");
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [sheetName, setSheetName] = useState("Form Responses 1");
  const [isLoading, setIsLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await fetch("/api/integrations/google");
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to load integrations");
      setConnections([]);
      setIsLoading(false);
      return;
    }

    setConnections(data.connections ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  useEffect(() => {
    if (searchParams.get("connected") === "1") {
      setNotice("Google Sheets connected. New form responses will sync automatically.");
    }

    const queryError = searchParams.get("error");
    if (queryError) {
      setError(decodeURIComponent(queryError));
    }
  }, [searchParams]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleConnect = () => {
    if (!name.trim() || !spreadsheetId.trim()) {
      setError("Add a connection name and Google Sheets URL.");
      return;
    }

    const params = new URLSearchParams({
      name: name.trim(),
      spreadsheetId: spreadsheetId.trim(),
      sheetName: sheetName.trim() || "Form Responses 1",
    });

    window.location.href = `/api/integrations/google/connect?${params.toString()}`;
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    setError(null);
    setNotice(null);

    const response = await fetch(`/api/integrations/google/${id}/sync`, {
      method: "POST",
    });
    const data = await response.json().catch(() => ({}));

    setSyncingId(null);

    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Sync failed");
      await loadConnections();
      return;
    }

    const newRows = data.result?.newRows ?? 0;
    if (newRows > 0) {
      const target = data.result?.createdBatch ? "a new batch" : "the existing batch";
      setNotice(
        `Synced ${newRows} new response${newRows === 1 ? "" : "s"} into ${target}.`,
      );
    } else {
      setNotice("No new form responses since the last sync.");
    }

    await loadConnections();
  };

  const handleToggle = async (id: string, status: "active" | "paused") => {
    const response = await fetch(`/api/integrations/google/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Failed to update connection");
      return;
    }

    await loadConnections();
  };

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/integrations/google/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Failed to delete connection");
      return;
    }

    await loadConnections();
  };

  return (
    <div className="landing-mesh flex min-h-dvh flex-col">
      <TopBar onNewBatch={() => router.push("/dashboard")} onSignOut={() => void handleSignOut()} />

      <main className="mx-auto w-full max-w-3xl space-y-8 px-4 pb-12 pt-24 sm:px-6">
        <div>
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to dashboard
          </Link>
          <h1 className="font-heading text-3xl tracking-tight text-foreground">
            Integrations
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Connect a Google Form via its linked response sheet. Pulse polls for new
            rows once per day and adds them to one persistent batch per connection.
          </p>
        </div>

        {notice && (
          <Alert>
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sheet className="size-4" />
              Google Forms via Sheets
            </CardTitle>
            <CardDescription>
              In Google Forms, open Responses → Link to Sheets. Paste that sheet URL
              below and authorize read-only access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="connection-name">Connection name</Label>
              <Input
                id="connection-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="March NPS form"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spreadsheet-url">Google Sheet URL or ID</Label>
              <Input
                id="spreadsheet-url"
                value={spreadsheetId}
                onChange={(event) => setSpreadsheetId(event.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sheet-name">Sheet tab name</Label>
              <Input
                id="sheet-name"
                value={sheetName}
                onChange={(event) => setSheetName(event.target.value)}
                placeholder="Form Responses 1"
                className="rounded-xl"
              />
            </div>
            <Button onClick={handleConnect} className="rounded-full">
              <ExternalLink className="size-4" />
              Connect Google account
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="font-sans text-lg font-semibold text-foreground">
            Connected sheets
          </h2>

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading connections…
            </div>
          ) : connections.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-sm text-muted-foreground">
                No Google Sheets connections yet.
              </CardContent>
            </Card>
          ) : (
            connections.map((connection) => (
              <Card key={connection.id}>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{connection.name}</p>
                      <Badge variant={statusVariant(connection.status)}>
                        {connection.status}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {connection.sheet_name} · {connection.spreadsheet_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last sync: {formatRelativeTime(connection.last_synced_at)}
                      {connection.last_synced_row > 0
                        ? ` · ${connection.last_synced_row} rows processed`
                        : ""}
                    </p>
                    {connection.batch_id && (
                      <Link
                        href={`/dashboard?batch=${connection.batch_id}`}
                        className="inline-flex text-xs font-medium text-primary hover:underline"
                      >
                        View linked batch
                      </Link>
                    )}
                    {connection.last_error && (
                      <p className="text-xs text-destructive">{connection.last_error}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      disabled={syncingId === connection.id}
                      onClick={() => void handleSync(connection.id)}
                    >
                      {syncingId === connection.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <RefreshCw className="size-4" />
                      )}
                      Sync now
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() =>
                        void handleToggle(
                          connection.id,
                          connection.status === "active" ? "paused" : "active",
                        )
                      }
                    >
                      {connection.status === "active" ? (
                        <Pause className="size-4" />
                      ) : (
                        <Play className="size-4" />
                      )}
                      {connection.status === "active" ? "Pause" : "Resume"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-destructive"
                      onClick={() => void handleDelete(connection.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
