# lib-builder

**Based on [Superpowers](https://github.com/obra/superpowers) by [Jesse Vincent](https://blog.fsck.com) · improved by [Kalkazu.org](https://kalkazu.org)**

lib-builder is a complete software development methodology for your coding agent, built on a set of composable skills and a short set of starting instructions that make sure your agent uses them. It works in **Claude Code** and **Codex**.

It started from Superpowers 7.0.1 (MIT). We audited it, measured it on a fixed set of tasks, made three improvements, added three new skills and measured again before releasing it. The original license and credit stay in [LICENSE](LICENSE).

## Table of Contents

- [How it works](#how-it-works)
- [Installation](#installation)
- [What we changed](#what-we-changed)
- [How we measured it](#how-we-measured-it)
- [The basic workflow](#the-basic-workflow)
- [When something goes wrong](#when-something-goes-wrong)
- [What's inside](#whats-inside)
- [Philosophy](#philosophy)
- [Issues and contributing](#issues-and-contributing)
- [No telemetry](#no-telemetry)
- [License](#license)

## How it works

It starts from the moment you fire up your coding agent. As soon as it sees that you're building something, it *doesn't* just jump into writing code. Instead, it steps back and asks you what you're really trying to do.

Once it has teased a spec out of the conversation, it shows it to you in chunks short enough to actually read and digest.

After you've signed off on the design, your agent puts together an implementation plan clear enough for an enthusiastic junior engineer with no project context to follow. It emphasizes true red/green TDD, YAGNI (You Aren't Gonna Need It) and DRY.

Once you say "go", it works through the plan task by task, reviewing its own work as it goes. Before a commit it checks the staged files for secrets, and before a long conversation runs out it can leave a handoff that a fresh session can pick up from its path alone.

Because the skills trigger automatically, you don't need to do anything special. Your coding agent just has lib-builder.

## Installation

If you use both agents, install lib-builder in each one. If you already have Superpowers installed, disable it first: both ship skills with the same names.

### Claude Code

```bash
/plugin marketplace add kalkazuorg/skills
/plugin install lib-builder@kalkazuorg
```

Start a new session afterwards. To check it works, send `Let's make a react todo list`: a working install triggers `brainstorming` before any code is written.

Update later with `/plugin marketplace update kalkazuorg`.

### Codex

```bash
codex plugin marketplace add kalkazuorg/skills
codex plugin add lib-builder@kalkazuorg
```

Start a new Codex session afterwards. Codex loads the 18 skills natively and picks them by their descriptions; lib-builder does not register a session-start hook on Codex.

Update later with `codex plugin marketplace upgrade kalkazuorg`.

## What we changed

Compared with Superpowers 7.0.1:

**Improvements**
- **No telemetry.** The visual companion no longer loads a logo from the original authors' website. Its pages load nothing from outside your computer (see [below](#no-telemetry)).
- **A skill applies only when its description fits.** The starting instructions now say that a skill is relevant when its "use when" matches the situation, not when its name sounds close. In the original, a review-only question pulled in a diff-review skill with no diff to review and cost 4× for the same answer.
- **Worktrees ask first.** `using-git-worktrees` asks before installing dependencies or committing a `.gitignore` change.

**New skills**
- **checking-for-secrets-before-commit** – runs the tests, then scans the staged set for keys, tokens and secret files before committing, never printing a value. Includes the `check-secrets` script (24/24 tests).
- **writing-a-handoff** – writes a continuation document a new session can act on from its path alone.
- **previewing-visual-changes** – shows visibly different previews before changing how anything looks, and implements only the one your human partner picks.

**Packaging**
- Renamed to lib-builder (skills are `lib-builder:<skill>`, settings are `LIB_BUILDER_*`).
- Released for Claude Code and Codex. The integrations for other agents were removed until they are tested.

See [CHANGELOG.md](CHANGELOG.md) for the full list.

## How we measured it

The same 11 tasks ran in isolated Claude Code sessions with three setups: no plugin, Superpowers 7.0.1, and lib-builder. Tasks T1–T8 cover everyday work (a simple question, a rename, failing tests, a new feature, a code review, a new module, a bug hunt, "verify and commit"). T9–T11 cover the new skills (a secret in the commit, a handoff, a visual change).

| | No plugin | Superpowers 7.0.1 | lib-builder |
|---|---|---|---|
| Tasks passed (main run) | 9/11 | 9/11 | 9/11 |
| Handoff (T10) | ✗ | ✗ | ✓ |
| Visual preview first (T11) | ✗ | ✗ | ✓ |
| Feature task T4, retested 3× | – | 1/3 | 3/3 |
| "Verify and commit" T8, retested 3× after the fix | – | – | 3/3 |
| Cost, main run (API-equivalent) | $1.63 | $2.58 | **$2.39** |

What this means:

- lib-builder does everything the original does, and it is about 7% cheaper. The biggest savings came on simple questions, new features and bug hunts.
- It adds two abilities neither other setup had: handoffs and visual previews before changing anything.
- It still costs about 1.5× more than using no plugin. What that buys is regression tests and a process that holds.
- The first run showed the new secrets skill skipping the test run on "verify and commit". We fixed it and retested it 3/3.

Limits: the main run was a single pass per task, and only the doubtful tasks were retested three times. **All measurements ran in Claude Code.** On Codex we have verified that lib-builder installs and that all 18 skills reach the model; behavior on Codex has not been measured yet.

## The basic workflow

1. **brainstorming** – Activates before building anything. Draws out what you actually want, and why, then plays its understanding back for correction. Small changes get agreed in chat; projects get a written design document.
2. **using-git-worktrees** – Activates after design approval. Creates an isolated workspace on a new branch, asks before installing dependencies, and checks for a clean test baseline.
3. **writing-plans** – Activates with an approved design. Breaks the work into bite-sized tasks (2–5 minutes each), each with exact file paths, complete code and verification steps.
4. **subagent-driven-development** or **executing-plans** – Activates with a plan. Either dispatches a fresh subagent per task with a review after each (most thorough), or implements every task inline with one review of the whole branch at the end (cheapest).
5. **test-driven-development** – Activates during implementation. Enforces RED-GREEN-REFACTOR: write a failing test, watch it fail, write minimal code, watch it pass, commit.
6. **requesting-code-review** – Activates between tasks. Reviews against the plan and reports issues by severity.
7. **checking-for-secrets-before-commit** – Activates before a commit. Runs the tests, then scans what is staged for secrets.
8. **finishing-a-development-branch** – Activates when the tasks are done. Verifies the tests, presents the options (merge, PR, keep, discard) and cleans up the worktree.

## When something goes wrong

Sometimes a session misbehaves: a skill fires when it shouldn't, stays silent when it should, or the agent ignores its plan or burns more tokens than you'd expect. Ask your coding agent to "figure out what went wrong with lib-builder in this session" and it will invoke **diagnosing-lib-builder**. To examine an earlier session, name it: "figure out what went wrong with lib-builder in session `<id>`".

The skill reads the session transcript, reports what happened with line-level evidence and, if you want, packages a scrubbed bundle for a bug report.

## What's inside

**Testing**
- **test-driven-development** – RED-GREEN-REFACTOR cycle (includes a testing anti-patterns reference)

**Debugging**
- **systematic-debugging** – 4-phase root cause process (root-cause tracing, defense in depth, condition-based waiting)
- **verification-before-completion** – Make sure it's actually fixed
- **diagnosing-lib-builder** – Work out what went wrong in a session, with evidence; export a scrubbed bundle or file an issue

**Collaboration**
- **brainstorming** – Drawing out intent before building
- **writing-plans** – Detailed implementation plans
- **executing-plans** – Inline plan execution: one context, one final review
- **dispatching-parallel-agents** – Concurrent subagent workflows
- **requesting-code-review** – Pre-review checklist
- **receiving-code-review** – Responding to feedback
- **using-git-worktrees** – Parallel development branches
- **finishing-a-development-branch** – Merge/PR decision workflow
- **subagent-driven-development** – Fast iteration with two-stage review (spec compliance, then code quality)
- **previewing-visual-changes** – Visibly different previews before changing how anything looks *(new)*
- **writing-a-handoff** – A continuation document a new session can act on from its path alone *(new)*

**Safety**
- **checking-for-secrets-before-commit** – Scan the staged set for keys, tokens and secret files before committing, never printing a value *(new)*

**Meta**
- **writing-skills** – Create new skills following best practices (includes testing methodology)
- **using-lib-builder** – Introduction to the skills system

## Philosophy

- **Test-driven development** – Write tests first, always
- **Systematic over ad hoc** – Process over guessing
- **Complexity reduction** – Simplicity as the primary goal
- **Evidence over claims** – Verify before declaring success

Read [the original Superpowers announcement](https://blog.fsck.com/2025/10/09/superpowers/) by Jesse Vincent.

## Issues and contributing

lib-builder lives in [kalkazuorg/skills](https://github.com/kalkazuorg/skills) next to other Kalkazu.org skills. Report problems in [its issues](https://github.com/kalkazuorg/skills/issues) and start the title with `[lib-builder]`.

Every change to a skill is measured before and after, on the same tasks, before it is released. Follow the `writing-skills` skill when you change or add a skill. Problems that also exist in the original Superpowers belong in [obra/superpowers](https://github.com/obra/superpowers/issues).

Plugin infrastructure tests live in `tests/` and run with the relevant `test-*.sh` script or `node <file>.test.js`.

## No telemetry

lib-builder collects nothing. In Superpowers, the visual companion of `brainstorming` loaded its logo from the original authors' website, which let them count users. lib-builder removed that: the Kalkazu.org symbol in the companion's corner ships inside the plugin, and its pages load nothing from outside your computer. There is no setting to turn it back on.

## License

MIT. See [LICENSE](LICENSE). Superpowers is copyright Jesse Vincent; the changes in lib-builder are by Kalkazu.org under the same license.
