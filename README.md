# Ramon's Care Hub

A lightweight, mobile-first PWA for family care coordination in an SNF context.

## Implemented Scaffold

- Pulse Dashboard (Care Status + One Big Thing)
- Clinical Log (BP, Pulse, speech clarity, mobility, mood)
- Medication Mirror (read-only meds + side-effect reporting)
- Family Visit Log (one-sentence update + next step)
- Therapy Tracker (PT/OT/ST minutes + wins)
- Activities & Hygiene tracker
- AI Export (JSON + CSV)
- Supabase magic-link auth foundation
- Family profile management tied to authenticated users
- Hybrid sync: per-entry collaboration with snapshot fallback
- Header sync status indicator (pending/syncing/last sync/error)
- Merge behavior unit tests for sync conflict logic
- Family membership-based RLS policies
- PWA scaffold (Vite PWA plugin + manifest)
- Netlify deploy config

## Run Locally

1. Install Node.js 20+ (includes npm)
2. Install dependencies

```bash
npm install
```

3. Start dev server

```bash
npm run dev
```

4. Build production bundle

```bash
npm run build
```

## Supabase Setup (Magic Link + Cloud Sync)

1. Create a Supabase project.
2. Enable Email auth (magic links).
3. Run [supabase/schema.sql](supabase/schema.sql) in the SQL editor.
4. Copy [.env.example](.env.example) to a local `.env` file and fill values.
5. Restart the dev server.

Once configured, users must sign in with a magic link before accessing care modules.
The Export screen includes Sync, Push, and Pull controls for collaboration across devices.

## Upgrade Note

If you previously ran an older version of [supabase/schema.sql](supabase/schema.sql), run the updated file again.
It now adds:

- `care_pulse` for shared pulse status
- `care_entries` for per-entry collaborative sync
- `family_profiles` for user display names and roles
- `family_members` for family-scoped authorization

The app will fall back to the legacy `care_hub_snapshots` table until the new schema is applied.

## Quality Checks

Run automated tests and build checks:

```bash
npm run test
npm run build
```

## Notes

- Data currently persists in localStorage as a local-first baseline.
- Automatic sync runs on sign-in, on reconnect, and after new local entries are saved.
