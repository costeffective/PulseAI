# Form Integrations Plan

Pulse can evolve from manual CSV uploads to live form ingestion.

## Goals

- Pull responses from Google Forms, Typeform, Tally, and similar tools
- Map form fields to feedback text + metadata (name, email, timestamp, ratings)
- Create batches on a schedule or in real time
- Reuse the existing Gemini classification pipeline

## Architecture

```mermaid
flowchart LR
  subgraph sources [Form sources]
    GoogleForms[Google Forms]
    Typeform[Typeform]
    Tally[Tally]
    Webhook[Generic webhook]
  end

  subgraph ingest [Ingestion layer]
    WebhookAPI["POST /api/integrations/webhook"]
    PollJobs[Scheduled sync jobs]
    OAuth[OAuth connections]
  end

  subgraph app [Pulse]
    Connections[integration_connections]
    Batches[batches]
    Items[feedback_items]
    Gemini[Gemini classifier]
  end

  GoogleForms --> PollJobs
  Typeform --> WebhookAPI
  Tally --> WebhookAPI
  Webhook --> WebhookAPI
  PollJobs --> Connections
  WebhookAPI --> Connections
  OAuth --> Connections
  Connections --> Batches
  Batches --> Items
  Items --> Gemini
```

## Phase 1 — Foundation

**Database**

- `integration_connections` — user_id, provider, status, encrypted credentials, field_mapping jsonb, last_synced_at
- `integration_events` — raw payload log for debugging

**API**

- `POST /api/integrations/webhook/:connectionId`
- `GET/POST /api/integrations`
- Field mapping UI in dashboard

Reuse `src/lib/csv.ts` column detection for webhook JSON payloads.

## Phase 2 — Google Forms ✅ (Sheets polling MVP)

### Implemented: Google Sheets bridge

1. Form responses sync to a linked Google Sheet
2. Pulse OAuth (read-only Sheets scope)
3. GitHub Actions polls active connections every 15 minutes (Vercel Hobby does not support sub-daily crons)
4. Reuses `src/lib/csv.ts` column detection on sheet rows
5. Appends new responses to one persistent AI-classified batch per connection

**Dashboard:** `/dashboard/integrations`

**Setup:**

1. Run `supabase/migrations/004_integration_connections.sql`
2. Create Google Cloud OAuth credentials (Web application)
3. Add redirect URI: `https://your-domain/api/integrations/google/callback`
4. Set env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`
5. Add GitHub repo secrets: `CRON_SECRET` (same value) and `PULSE_APP_URL` (e.g. `https://pulse-ai-dash.vercel.app`)
5. In Google Forms: Responses → Link to Sheets
6. Connect the sheet in Pulse → Integrations

### Option B: Google Apps Script relay (planned)

1. Apps Script on the response Sheet POSTs new rows to a Pulse webhook
2. Near real-time without polling

**Recommendation:** Start with Sheets polling; offer Apps Script for power users.

## Phase 3 — Typeform, Tally, Jotform

Native webhooks:

1. User creates a connection → receives webhook URL + secret
2. User configures the form tool
3. Each submission is verified, mapped, and classified

| Source field | Pulse |
|--------------|---------------|
| Long text answer | `text` |
| Email | `metadata.Email` |
| Name | `metadata.Name` |
| Submitted at | `metadata.Timestamp` |

## Phase 4 — Product UX

- Integrations page: connect, test, pause, last sync
- Auto-batch naming from source
- Deduplication via external response IDs in metadata
- Alerts for high-priority negative feedback

## Security

- Encrypt OAuth tokens at rest
- Webhook HMAC verification per connection
- RLS on integration tables

## Suggested order

1. Metadata + smart CSV parsing (done)
2. Google Sheets polling (done)
3. Generic webhook + field mapping
4. Typeform / Tally templates
5. Integrations settings UI polish
