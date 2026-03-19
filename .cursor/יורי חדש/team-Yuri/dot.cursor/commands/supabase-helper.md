Run guided Supabase setup and migration commands from agent

description: Guided helper for basic Supabase setup and migration tasks for students. Use when the user wants to prepare the local project for Supabase, connect the local project to an existing Supabase cloud project, create a migration, apply local schema changes to Supabase, migrate a local app database to Supabase, or check Supabase setup status.
---

# Supabase Helper

This helper lets students perform a few common Supabase actions in a guided way.

## Supported actions

1. Prepare this local project for Supabase
2. Connect this project to my Supabase cloud project
3. Create a database migration
4. Apply local schema changes to Supabase
5. Migrate my local app database to Supabase
6. Check Supabase setup status

## Core rule

You must EXECUTE the helper script directly.
Do NOT replace the helper with raw Supabase commands unless the helper script itself fails.
Do NOT tell the user to open Terminal / PowerShell unless the script output explicitly says a required tool is missing or login must be completed there.
Do NOT explain generic Supabase steps when the helper already supports the task.

## Meaning of each option

1. **Prepare this local project for Supabase**
   - Use this when the project does not yet have local Supabase files.
   - This action runs local Supabase initialization only.
   - It creates Supabase-related local project artifacts such as `supabase/config.toml`.
   - It does not create a cloud project and does not push any changes.

2. **Connect this project to my Supabase cloud project**
   - Use this when the student already created a Supabase project in the dashboard.
   - The script must first verify Supabase CLI is installed and authenticated.
   - The script must list the student's available Supabase projects by running `supabase projects list`.
   - The script must present those projects and let the student choose one.
   - The script must then connect the local repo using `supabase link --project-ref <selected-ref>`.
   - If no projects are found, the script must explain that the student should create one in the dashboard first.

3. **Create a database migration**
   - Use this when the student wants a new migration file under `supabase/migrations`.
   - The script should ask for a migration name.
   - If the student provides nothing, use a safe default.
   - This action creates the migration file only. It does not push it.

4. **Apply local schema changes to Supabase**
   - Use this when local migration files already exist and the student wants to apply them to the connected Supabase cloud project.
   - This action is for schema changes, not for browsing data.
   - The script should clearly explain that it will run `supabase db push`.

5. **Migrate my local app database to Supabase**
   - Use this when the student already has a local app database and wants to move its data into Supabase.
   - For this class, the default expected local database is SQLite, but the command wording should stay generic.
   - The script may ask for the local DB path if it cannot detect one.
   - The script must leave the local database file intact.
   - The script must explain that after migration, Supabase becomes the new source of truth.
   - Query / inspect / verify can be demonstrated in the Supabase dashboard.

6. **Check Supabase setup status**
   - Show whether Supabase CLI is installed.
   - Show whether the CLI appears logged in.
   - Show whether the local project is prepared for Supabase.
   - Show whether the local project is connected to a cloud project.
   - Show whether migration files exist.
   - Recommend the next step.

## Menu

When invoked, present this menu exactly:

1. Prepare this local project for Supabase
2. Connect this project to my Supabase cloud project
3. Create a database migration
4. Apply local schema changes to Supabase
5. Migrate my local app database to Supabase
6. Check Supabase setup status

Then ask the user which option they want.

## Execution

Use the matching script for the user's operating system.

On macOS or Linux, execute:

```bash
.cursor/scripts/supabase-helper.sh <action>
```

On Windows, execute:

```powershell
powershell -ExecutionPolicy Bypass -File .cursor\scripts\supabase-helper.ps1 <action>
```

Where `<action>` is one of:
- `setup`
- `connect`
- `migration`
- `push`
- `migrate-local-db`
- `status`

## Interactive behavior

- Guided question / answer flow is allowed.
- The script should ask one clear question at a time.
- The script should not silently hang.
- When prerequisites are missing, the script must stop and print explicit recovery instructions.
- Recovery instructions must include:
  - what happened
  - why it matters
  - what command to run in Terminal when needed
  - what URL to open when needed
  - confirmation that no changes were made

## Local file boundary

The helper may manage Supabase-related local project artifacts such as:
- `supabase/`
- migration files
- helper state files needed for Supabase connection tracking
- temporary SQL files used for migration

The helper must not modify unrelated application source files.

## Notes for the agent

- The helper is intentionally narrower than the full Supabase platform.
- Cloud project creation happens in the Supabase dashboard first.
- Query / inspect / verify can be demonstrated in the Supabase dashboard.
- The helper should prefer the script's own explanations over generic chat explanations.
