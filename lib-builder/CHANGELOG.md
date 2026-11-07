# Changelog

## 1.0.0 – first release

Based on Superpowers 7.0.1 by Jesse Vincent (`2ce8aa1`). The Superpowers history up to that version is in [RELEASE-NOTES.md](RELEASE-NOTES.md).

### Improvements

- **No telemetry.** The visual companion no longer loads its logo from primeradiant.com. Its corner shows the Kalkazu.org symbol (shipped with the plugin and inlined in the page), "kalkazu.org" and "lib-builder v<version>", linking to kalkazu.org, and its pages load nothing remote. The `*_TELEMETRY` variables are gone. During the measurement the telemetry was opt-in; removing it only changes the companion's header.
- **using-lib-builder: a skill applies when its description fits.** Relevance means the description's "use when" matches the situation, not a similar-sounding name.
- **using-git-worktrees asks first.** It asks your human partner before installing dependencies or committing a `.gitignore` change.

### New skills

- **checking-for-secrets-before-commit**, with the `check-secrets` script and 24 tests. Running the tests is step 1, so "verify and commit" still catches a broken test.
- **writing-a-handoff**: a continuation document a new session can act on from its path alone.
- **previewing-visual-changes**: visibly different previews before changing how anything looks; only the pick is implemented.

### Packaging

- Renamed from Superpowers to lib-builder: plugin name, `lib-builder:` skill prefix, `using-lib-builder`, `diagnosing-lib-builder`, `LIB_BUILDER_*` variables, `.lib-builder/` and `docs/lib-builder/` folders.
- Moved into [kalkazuorg/skills](https://github.com/kalkazuorg/skills) as the `lib-builder/` folder, with Claude Code and Codex marketplaces named `kalkazuorg` at the repository root.
- Released for Claude Code and Codex. The integrations for Antigravity, Cursor, Devin, Gemini, Hermes, Kimi, Muse, OpenCode and Pi were removed until each one is tested.
- `diagnosing-lib-builder` searches and files issues in kalkazuorg/skills, with titles starting `[lib-builder]`.
- Version reset to 1.0.0.

### Measured

11 tasks in Claude Code, no plugin vs. Superpowers 7.0.1 vs. lib-builder: lib-builder passes everything the original passes. It is about 7% cheaper on the main run and is the only setup that passes the handoff and visual-preview tasks. Details are in the [README](README.md#how-we-measured-it).
