#!/usr/bin/env bash
set -euo pipefail

REMOTE_URL="${REMOTE_URL:-https://github.com/JavaGT/wearetheuniversity.org.git}"
REMOTE_NAME="${REMOTE_NAME:-target}"
REMOTE_BRANCH="${REMOTE_BRANCH:-main}"
BACKUP="backup-before-overwrite-$(date -u +%Y%m%dT%H%M%SZ)"

echo "[remote-overwrite] Starting (dry-run unless --execute supplied)"

# Quick check: ensure we're inside a git repository so subsequent git calls don't print a fatal error
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[remote-overwrite] ERROR: This directory ($(pwd)) is not a git repository."
  echo "[remote-overwrite] Run this from your repository root (where .git exists), or initialize a repository first."
  echo "[remote-overwrite] Script exiting without performing any actions."
  exit 0
fi

# Commit any local changes
echo "[remote-overwrite] Staging changes..."
git add -A
if git diff --cached --quiet && git diff --quiet; then
  echo "[remote-overwrite] No changes to commit"
else
  git commit -m "Prepare workspace for remote overwrite ($(date -u))"
fi

# Create a safe local backup branch. We do NOT fetch or touch the network in dry-run mode.
if git rev-parse --verify "refs/remotes/${REMOTE_NAME}/${REMOTE_BRANCH}" >/dev/null 2>&1; then
  echo "[remote-overwrite] Local remote ref refs/remotes/${REMOTE_NAME}/${REMOTE_BRANCH} exists; making local branch $BACKUP from it"
  git branch --force "$BACKUP" "refs/remotes/${REMOTE_NAME}/${REMOTE_BRANCH}"
  echo "[remote-overwrite] Created local backup branch $BACKUP from existing local remote ref"
else
  echo "[remote-overwrite] No local remote ref for $REMOTE_NAME/$REMOTE_BRANCH; saving HEAD to local branch $BACKUP"
  git branch --force "$BACKUP" HEAD
  echo "[remote-overwrite] Created local backup branch $BACKUP from HEAD"
fi

# If the user passed --execute, do the networked steps (remote add/fetch + remote backup + force-push)
if [ "${1:-}" = "--execute" ]; then
  echo "[remote-overwrite] --execute supplied: performing remote actions (will contact ${REMOTE_URL})"
  # Ensure remote is configured
  git remote remove "$REMOTE_NAME" 2>/dev/null || true
  git remote add "$REMOTE_NAME" "$REMOTE_URL"
  git fetch "$REMOTE_NAME"

  # Create remote backup branch on the remote
  if git rev-parse --verify "refs/remotes/${REMOTE_NAME}/${REMOTE_BRANCH}" >/dev/null 2>&1; then
    echo "[remote-overwrite] Creating remote backup branch $BACKUP from ${REMOTE_NAME}/${REMOTE_BRANCH}"
    git push "$REMOTE_NAME" "refs/remotes/${REMOTE_NAME}/${REMOTE_BRANCH}:refs/heads/$BACKUP"
  else
    echo "[remote-overwrite] Remote branch ${REMOTE_NAME}/${REMOTE_BRANCH} not found; pushing HEAD as remote backup $BACKUP"
    git push "$REMOTE_NAME" HEAD:refs/heads/$BACKUP
  fi

  echo "[remote-overwrite] Force-pushing local HEAD to ${REMOTE_NAME}/${REMOTE_BRANCH} (using --force-with-lease)"
  git push --force-with-lease "$REMOTE_NAME" HEAD:"$REMOTE_BRANCH"
  echo "[remote-overwrite] Remote overwrite complete"
else
  echo
  echo "[remote-overwrite] Dry-run complete. No network operations were performed."
  echo "[remote-overwrite] To perform the remote backup + overwrite, re-run this script with --execute." 
  echo
  echo "[remote-overwrite] The following remote commands will be run if you pass --execute (or run with REMOTE_URL/REMOTE_NAME/REMOTE_BRANCH env vars set):"
  echo
  echo "  git remote remove ${REMOTE_NAME} 2>/dev/null || true"
  echo "  git remote add ${REMOTE_NAME} ${REMOTE_URL}"
  echo "  git fetch ${REMOTE_NAME}"
  echo "  git push ${REMOTE_NAME} refs/remotes/${REMOTE_NAME}/${REMOTE_BRANCH}:refs/heads/${BACKUP}  # (or HEAD:refs/heads/${BACKUP} if remote branch missing)"
  echo "  git push --force-with-lease ${REMOTE_NAME} HEAD:${REMOTE_BRANCH}"
  echo
  echo "[remote-overwrite] Local backup branch created: $BACKUP"
fi
