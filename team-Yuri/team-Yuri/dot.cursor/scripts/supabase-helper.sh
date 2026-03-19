#!/usr/bin/env bash

set -euo pipefail

ACTION="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

say() {
  printf "\n%s\n" "$1"
}

info() {
  printf "[INFO] %s\n" "$1"
}

warn() {
  printf "[WARN] %s\n" "$1"
}

err() {
  printf "[ERROR] %s\n" "$1" >&2
}

detect_os() {
  case "$(uname -s)" in
    Darwin) printf "macos" ;;
    Linux) printf "linux" ;;
    *) printf "unknown" ;;
  esac
}

is_git_repo() {
  git rev-parse --is-inside-work-tree >/dev/null 2>&1
}

repo_root() {
  git rev-parse --show-toplevel 2>/dev/null || pwd
}

project_root() {
  if command -v git >/dev/null 2>&1 && is_git_repo; then
    repo_root
  else
    pwd
  fi
}

helper_state_dir() {
  printf "%s/.supabase-helper" "$(project_root)"
}

helper_state_file() {
  printf "%s/project-ref" "$(helper_state_dir)"
}

linked_project_ref_saved() {
  local f
  f="$(helper_state_file)"
  [ -f "$f" ] && cat "$f" || true
}

save_project_ref() {
  mkdir -p "$(helper_state_dir)"
  printf "%s" "$1" > "$(helper_state_file)"
}

supabase_dir_exists() {
  [ -d "$(project_root)/supabase" ]
}

supabase_config_exists() {
  [ -f "$(project_root)/supabase/config.toml" ]
}

migrations_dir_exists() {
  [ -d "$(project_root)/supabase/migrations" ]
}

has_migration_files() {
  [ -d "$(project_root)/supabase/migrations" ] && find "$(project_root)/supabase/migrations" -type f | grep -q .
}

default_local_db_path() {
  local root
  root="$(project_root)"
  for candidate in \
    "$root/data/app.db" \
    "$root/data/local.db" \
    "$root/data/chat.db" \
    "$root/app.db" \
    "$root/local.db"; do
    if [ -f "$candidate" ]; then
      printf "%s" "$candidate"
      return 0
    fi
  done
  printf "%s" "$root/data/app.db"
}

show_git_missing_message() {
  cat <<EOF2
Git is not installed on this computer.

Why this matters:
This helper detects the project root more reliably when Git is available.

What to do:
1. Open a terminal on your machine.
2. Go to:
   https://git-scm.com/downloads
3. Install Git for your operating system.
4. Verify it works by running:
   git --version
5. Run this helper again.

No changes were made.
EOF2
}

show_supabase_missing_message() {
  cat <<EOF2
Supabase CLI is not installed.

Why this matters:
This helper uses Supabase CLI to prepare the project, list your Supabase projects,
connect this repo to Supabase, create migrations, and push schema changes.

What to do:
1. Open a terminal on your machine.
2. Go to the official Supabase CLI installation guide:
   https://supabase.com/docs/guides/local-development/cli/getting-started
3. Follow the install instructions for your operating system.
4. After installation, verify it works by running:
   supabase --help
5. Run this helper again.

No changes were made.
EOF2
}

show_supabase_auth_missing_message() {
  cat <<EOF2
Supabase CLI is installed, but you are not logged in.

Why this matters:
The helper must access your Supabase account to list your cloud projects and connect this repo to one of them.

What to do:
1. Open a terminal on your machine.
2. Run this command exactly:
   supabase login
3. Complete the login flow in the browser.
4. After login finishes, run this helper again.

Helpful references:
- CLI getting started:
  https://supabase.com/docs/guides/local-development/cli/getting-started
- Example flow using login, project list, and link:
  https://supabase.com/docs/guides/functions/quickstart

No changes were made.
EOF2
}

show_no_projects_message() {
  cat <<EOF2
No Supabase cloud projects were found for the logged-in account.

Why this matters:
This helper can only connect this repo to an existing Supabase cloud project.

What to do:
1. Open the Supabase dashboard:
   https://supabase.com/dashboard/projects
2. Create a new project.
3. Wait until the project finishes provisioning.
4. Run this helper again and choose the connect option.

No changes were made.
EOF2
}

show_not_prepared_message() {
  cat <<EOF2
This local project is not prepared for Supabase yet.

Why this matters:
The local Supabase configuration folder does not exist yet.

What to do:
1. Run this helper again.
2. Choose:
   1. Prepare this local project for Supabase
3. After that completes, run your current action again.

No changes were made.
EOF2
}

show_docker_missing_message() {
  cat <<EOF2
Docker is not installed or not running.

Why this matters:
Supabase local development uses Docker to run the local Supabase stack.
This is only required if you choose to run the local stack.

What to do:
1. Open a browser.
2. Go to the official local development guide:
   https://supabase.com/docs/guides/local-development
3. Install Docker Desktop or another Docker-compatible runtime.
4. Start Docker.
5. Run the needed Supabase local command again.

No changes were made.
EOF2
}

ensure_git() {
  if command -v git >/dev/null 2>&1; then
    return 0
  fi
  show_git_missing_message
  exit 1
}

ensure_supabase() {
  if command -v supabase >/dev/null 2>&1; then
    return 0
  fi
  show_supabase_missing_message
  exit 1
}

ensure_supabase_auth() {
  if supabase projects list >/dev/null 2>&1; then
    return 0
  fi
  show_supabase_auth_missing_message
  exit 1
}

ensure_prepared() {
  if supabase_config_exists; then
    return 0
  fi
  show_not_prepared_message
  exit 1
}

confirm_yes_no() {
  local prompt default answer
  prompt="$1"
  default="${2:-Y}"
  if [ "$default" = "Y" ]; then
    read -r -p "$prompt [Y/n]: " answer || true
    answer="${answer:-Y}"
  else
    read -r -p "$prompt [y/N]: " answer || true
    answer="${answer:-N}"
  fi
  case "$answer" in
    Y|y|yes|YES) return 0 ;;
    *) return 1 ;;
  esac
}

choose_menu_option() {
  cat <<EOF2
1. Prepare this local project for Supabase
2. Connect this project to my Supabase cloud project
3. Create a database migration
4. Apply local schema changes to Supabase
5. Migrate my local app database to Supabase
6. Check Supabase setup status
EOF2
  printf "Choose an option number: "
  read -r choice
  case "$choice" in
    1) ACTION="setup" ;;
    2) ACTION="connect" ;;
    3) ACTION="migration" ;;
    4) ACTION="push" ;;
    5) ACTION="migrate-local-db" ;;
    6) ACTION="status" ;;
    *) err "Invalid option: $choice"; exit 1 ;;
  esac
}

show_setup_intro() {
  cat <<EOF2
This action will prepare the current repo for Supabase.

What will happen:
1. The helper will run:
   supabase init
2. A local supabase/ folder will be created in this project.
3. No cloud changes will be made.
EOF2
}

setup_project() {
  ensure_supabase
  say "Prepare this local project for Supabase"
  show_setup_intro
  if supabase_config_exists; then
    info "This project already contains supabase/config.toml."
    info "No changes were needed."
    return 0
  fi
  (cd "$(project_root)" && supabase init)
  info "Supabase local project files were created successfully."
  info "Next recommended step: Connect this project to my Supabase cloud project."
}

parse_projects_list() {
  awk 'NF >= 1 {
    ref=""; name="";
    for (i=1; i<=NF; i++) {
      if ($i ~ /^[a-z0-9]{20}$/) {
        ref=$i;
        break;
      }
    }
    if (ref != "") {
      name=$1;
      print name "|" ref;
    }
  }'
}

connect_project() {
  ensure_supabase
  ensure_supabase_auth
  ensure_prepared

  say "Connect this project to my Supabase cloud project"
  cat <<EOF2
This action will connect the current repo to an existing Supabase cloud project.

What will happen:
1. The helper will run:
   supabase projects list
2. You will choose one project.
3. The helper will run:
   supabase link --project-ref <selected-project-ref>
4. No schema changes will be pushed yet.
EOF2

  local raw_list parsed projects_file count choice selected_line selected_name selected_ref
  raw_list="$(supabase projects list 2>/dev/null || true)"
  parsed="$(printf "%s\n" "$raw_list" | parse_projects_list)"

  if [ -z "$parsed" ]; then
    show_no_projects_message
    exit 1
  fi

  projects_file="$(mktemp)"
  printf "%s\n" "$parsed" > "$projects_file"
  count=0
  say "Your available Supabase cloud projects:"
  while IFS='|' read -r pname pref; do
    count=$((count + 1))
    printf "%d. %s    %s\n" "$count" "$pname" "$pref"
  done < "$projects_file"

  printf "Choose the project number to connect this repo to: "
  read -r choice
  if ! [[ "$choice" =~ ^[0-9]+$ ]]; then
    rm -f "$projects_file"
    err "Invalid selection."
    exit 1
  fi

  selected_line="$(sed -n "${choice}p" "$projects_file" || true)"
  rm -f "$projects_file"
  if [ -z "$selected_line" ]; then
    err "Project number not found."
    exit 1
  fi

  selected_name="${selected_line%%|*}"
  selected_ref="${selected_line##*|}"

  say "Selected project"
  printf "Name: %s\n" "$selected_name"
  printf "Ref:  %s\n" "$selected_ref"

  if ! confirm_yes_no "Connect this repo to this Supabase project?" "Y"; then
    warn "Cancelled. No changes were made."
    exit 1
  fi

  (cd "$(project_root)" && supabase link --project-ref "$selected_ref")
  save_project_ref "$selected_ref"
  info "This repo is now connected to Supabase project: $selected_name ($selected_ref)"
  info "Next recommended step: Create a database migration or apply local schema changes to Supabase."
}

create_migration() {
  ensure_supabase
  ensure_prepared

  say "Create a database migration"
  cat <<EOF2
This action will create a new database migration file.

What will happen:
1. The helper will run:
   supabase migration new <migration_name>
2. A new SQL migration file will be created under supabase/migrations/.
3. You can then edit that file with your schema changes.
EOF2

  local name safe_name
  printf "Enter a migration name (default: update_schema): "
  read -r name || true
  name="${name:-update_schema}"
  safe_name="$(printf "%s" "$name" | tr ' ' '_' | tr -cd '[:alnum:]_-')"
  safe_name="${safe_name:-update_schema}"

  (cd "$(project_root)" && supabase migration new "$safe_name")
  info "Migration created successfully."
  info "Review the new SQL file under supabase/migrations/."
}

apply_schema_changes() {
  ensure_supabase
  ensure_prepared

  say "Apply local schema changes to Supabase"
  cat <<EOF2
This action will apply your local migration files to the connected Supabase cloud project.

What will happen:
1. The helper will verify that this repo is connected to a Supabase cloud project.
2. The helper will run:
   supabase db push
3. Your migration files will be applied to the remote database.

Before you continue:
- Make sure your migration SQL is correct.
- Make sure this repo is connected to the correct Supabase project.
EOF2

  if ! has_migration_files; then
    warn "No migration files were found under supabase/migrations/."
    warn "Create a migration first, then try again."
    exit 1
  fi

  local saved_ref
  saved_ref="$(linked_project_ref_saved)"
  if [ -z "$saved_ref" ]; then
    warn "No linked Supabase project was recorded by this helper."
    warn "Use the connect option first."
    exit 1
  fi

  if ! confirm_yes_no "Proceed with supabase db push to the connected cloud project?" "N"; then
    warn "Cancelled. No changes were made."
    exit 1
  fi

  (cd "$(project_root)" && supabase db push)
  info "Schema changes were applied successfully."
  info "Verification can be done in the Supabase dashboard using Table Editor or SQL Editor."
}

find_python_for_sqlite() {
  if command -v python3 >/dev/null 2>&1; then
    printf "python3"
  elif command -v python >/dev/null 2>&1; then
    printf "python"
  else
    printf ""
  fi
}

migrate_local_db() {
  ensure_supabase
  ensure_prepared

  local py db_path root temp_sql
  py="$(find_python_for_sqlite)"
  if [ -z "$py" ]; then
    err "Python is required for SQLite export but was not found."
    exit 1
  fi

  db_path="$(default_local_db_path)"

  say "Migrate my local app database to Supabase"
  cat <<EOF2
This action will migrate data from your local app database into Supabase.

What will happen:
1. The helper will read the local database source.
2. The helper will convert supported data into SQL INSERT statements.
3. The helper will create a migration file under supabase/migrations/.
4. If you confirm, the helper will run:
   supabase db push
5. Your local database file will remain intact.

Important:
- After migration, Supabase becomes the new source of truth.
- Query / inspect / verify can be done in the Supabase dashboard.
EOF2

  printf "Enter the local database path (default: %s): " "$db_path"
  read -r user_db_path || true
  db_path="${user_db_path:-$db_path}"

  if [ ! -f "$db_path" ]; then
    err "Local database file was not found: $db_path"
    exit 1
  fi

  temp_sql="$(mktemp)"

  "$py" - "$db_path" "$temp_sql" <<'PY'
import sqlite3, sys, json
from pathlib import Path

db_path = Path(sys.argv[1])
out_path = Path(sys.argv[2])
conn = sqlite3.connect(str(db_path))
conn.row_factory = sqlite3.Row
cur = conn.cursor()

def table_exists(name):
    row = cur.execute("select name from sqlite_master where type='table' and name=?", (name,)).fetchone()
    return row is not None

def sql_quote(v):
    if v is None:
        return 'NULL'
    if isinstance(v, (int, float)):
        return str(v)
    s = str(v).replace("'", "''")
    return f"'{s}'"

lines = []
lines.append("-- Generated by supabase-helper from local SQLite data")
lines.append("-- Source DB: " + str(db_path))
lines.append("")

supported = []
if table_exists('sessions'):
    supported.append('sessions')
if table_exists('messages'):
    supported.append('messages')

if not supported:
    raise SystemExit("No supported tables were found. Expected tables like sessions and messages.")

if 'sessions' in supported:
    rows = cur.execute("select id, created_at from sessions").fetchall()
    for r in rows:
        vals = [sql_quote(r['id']), sql_quote(r['created_at'])]
        lines.append("insert into public.sessions (id, created_at) values (" + ", ".join(vals) + ") on conflict do nothing;")

if 'messages' in supported:
    rows = cur.execute("select id, session_id, seq_num, role, content, created_at from messages order by session_id, seq_num").fetchall()
    for r in rows:
        vals = [
            sql_quote(r['id']),
            sql_quote(r['session_id']),
            sql_quote(r['seq_num']),
            sql_quote(r['role']),
            sql_quote(r['content']),
            sql_quote(r['created_at']),
        ]
        lines.append("insert into public.messages (id, session_id, seq_num, role, content, created_at) values (" + ", ".join(vals) + ") on conflict do nothing;")

out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(out_path)
PY

  root="$(project_root)"
  local migration_name migration_path timestamp
  timestamp="$(date +%Y%m%d%H%M%S)"
  migration_name="${timestamp}_import_local_data.sql"
  migration_path="$root/supabase/migrations/$migration_name"
  cp "$temp_sql" "$migration_path"
  rm -f "$temp_sql"

  info "Generated migration file: $migration_path"

  if confirm_yes_no "Apply this data migration to the connected Supabase project now?" "Y"; then
    (cd "$root" && supabase db push)
    info "Local database data was migrated to Supabase successfully."
    cat <<EOF2
How to verify:
1. Open the Supabase dashboard:
   https://supabase.com/dashboard/projects
2. Open the connected project.
3. Go to Table Editor to inspect tables and rows.
4. Go to SQL Editor to run verification queries such as:
   select * from sessions;
   select * from messages order by session_id, seq_num;
EOF2
  else
    warn "The migration file was created but not pushed yet."
    warn "You can apply it later with option 4: Apply local schema changes to Supabase."
  fi
}

show_status() {
  say "Supabase setup status"
  local supabase_installed supabase_logged_in prepared connected migrations next_step

  if command -v supabase >/dev/null 2>&1; then
    supabase_installed="y"
  else
    supabase_installed="n"
  fi

  if [ "$supabase_installed" = "y" ] && supabase projects list >/dev/null 2>&1; then
    supabase_logged_in="y"
  else
    supabase_logged_in="n"
  fi

  if supabase_config_exists; then
    prepared="y"
  else
    prepared="n"
  fi

  if [ -n "$(linked_project_ref_saved)" ]; then
    connected="y"
  else
    connected="n"
  fi

  if has_migration_files; then
    migrations="y"
  else
    migrations="n"
  fi

  printf "Supabase CLI installed: %s\n" "$supabase_installed"
  printf "Supabase CLI logged in: %s\n" "$supabase_logged_in"
  printf "Local project prepared for Supabase: %s\n" "$prepared"
  printf "Connected to Supabase cloud project: %s\n" "$connected"
  if [ "$connected" = "y" ]; then
    printf "Connected project ref: %s\n" "$(linked_project_ref_saved)"
  fi
  printf "Migration files exist: %s\n" "$migrations"

  if [ "$supabase_installed" = "n" ]; then
    next_step="Install Supabase CLI"
  elif [ "$supabase_logged_in" = "n" ]; then
    next_step="Run supabase login in Terminal"
  elif [ "$prepared" = "n" ]; then
    next_step="Choose option 1: Prepare this local project for Supabase"
  elif [ "$connected" = "n" ]; then
    next_step="Choose option 2: Connect this project to my Supabase cloud project"
  elif [ "$migrations" = "n" ]; then
    next_step="Choose option 3: Create a database migration"
  else
    next_step="Choose option 4: Apply local schema changes to Supabase"
  fi

  printf "Recommended next step: %s\n" "$next_step"
}

case "$ACTION" in
  "")
    choose_menu_option
    ;;
  setup|connect|migration|push|migrate-local-db|status)
    ;;
  *)
    err "Unknown action: $ACTION"
    exit 1
    ;;
esac

case "$ACTION" in
  setup)
    setup_project
    ;;
  connect)
    connect_project
    ;;
  migration)
    create_migration
    ;;
  push)
    apply_schema_changes
    ;;
  migrate-local-db)
    migrate_local_db
    ;;
  status)
    show_status
    ;;
esac
