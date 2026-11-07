---
name: checking-for-secrets-before-commit
description: Use before any git commit or push, including when your human partner asks you to commit their changes - checks what is about to be committed for secrets (API keys, tokens, passwords, .env and key files) without ever printing their values
---

# Checking for Secrets Before Commit

## Overview

A secret that reaches a commit is exposed: history keeps it after you delete the line, and a push publishes it. Ignoring `.env` is not enough — keys also get hardcoded into source files.

**Core principle:** Scan exactly what is staged, before the commit, and never let a secret value reach your output.

**This is one check before a commit, not all of it.** A commit that scans clean but breaks the tests is still a bad commit, so step 1 below runs them.

## The Iron Law

```
NO COMMIT UNTIL THE STAGED SET SCANS CLEAN
NO SECRET VALUE IN ANY OUTPUT, EVER
```

## The Steps

1. **Run the project's tests** (lib-builder:verification-before-completion). If they fail, tell your human partner before committing, even when the failure looks older than the change.
2. **Stage deliberately.** `git status`, then `git add <paths>` for the files the change is about. `git add -A` is how untracked secret files slip in.
3. **Scan the staged set:**
   ```bash
   bash "<base directory of this skill>/scripts/check-secrets"
   ```
   The base directory is shown when this skill loads; don't search the disk for the script. It prints `path:line  kind` for each finding and never the value. Exit 0 is clean; exit 1 means stop.
4. **Fix every finding before committing:**
   - **Secret file staged** (`.env`, `*.pem`, credentials): `git restore --staged <file>` and add it to `.gitignore`.
   - **Unignored `.env` in the tree:** add it to `.gitignore`.
   - **Hardcoded value in code:** replace it with an environment lookup (`process.env.NAME`, `os.environ["NAME"]`), put the value in the ignored `.env`, and add the name with an empty value to `.env.example` if the project keeps one.
5. **Re-run the scan** until it exits 0. Then commit.
6. **Tell your human partner what you found:** file, line and kind, never the value. If a secret was already in an earlier commit, pushed, or pasted anywhere, say plainly that removing it now does not undo the exposure and that the key should be rotated.

## Never Print a Secret

Reading a secret to check it is how secrets leak into transcripts and logs.

| Instead of | Do |
|---|---|
| `cat .env`, opening it with a read tool | `test -f .env && echo exists` |
| `echo $API_KEY` | `[ -n "${API_KEY:-}" ] && echo set \|\| echo unset` |
| Quoting the line with the key | "`src/gateway.js:2` has a hardcoded Stripe key" |
| Showing the key "partly masked" | Name the kind and the length at most |

If a secret value does appear in your output by accident, tell your human partner at once and recommend rotating it.

## When the Scan Is Wrong

A finding you are sure is not a secret (a test fixture marked fake, a public identifier) still needs your human partner's call. Tell them the file, line and why you think it is safe, and let them decide. Don't edit the script or the pattern to make the finding go away.

## Red Flags

| Thought | Reality |
|---------|---------|
| "`.env` is ignored, so we're safe" | Keys get hardcoded in source too. Scan the staged lines. |
| "It's a private repo" | Private repos get cloned, forked, shared and leaked. |
| "I'll commit and clean it up in the next commit" | History keeps it. Fix before committing. |
| "Let me show the value so they can confirm" | File, line and kind are enough. Never the value. |
| "It's only a test key" | Test keys often reach real systems. Your partner decides. |
| "They asked me to just commit" | A clean commit is part of committing. Fix it, then tell them. |
