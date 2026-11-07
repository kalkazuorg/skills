# skills

Official collection of Agent Skills for Kalkazu.org (kalkazu.org). Modular, reusable packages of instructions, scripts and resources that extend Claude and other AI agents with Kalkazu.org's workflows, brand guidelines and domain expertise. Easy to install, customize and contribute.

Every skill here is audited for safety and measured on real tasks before it is released. Skills based on someone else's work keep the original license and credit.

## Plugins

| Plugin | What it does | Works in |
|---|---|---|
| [lib-builder](lib-builder/) | Skills library for coding agents: brainstorming, planning, TDD, debugging, code review, secret checks before commit, handoffs and visual previews. Based on [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent. | Claude Code, Codex |

### Install

**Claude Code**

```bash
/plugin marketplace add kalkazuorg/skills
/plugin install lib-builder@kalkazuorg
```

**Codex**

```bash
codex plugin marketplace add kalkazuorg/skills
codex plugin add lib-builder@kalkazuorg
```

## Skills

Standalone skills live in their own folder, one skill per folder, and install with:

```bash
npx skills add kalkazuorg/skills --skill <name>
```

## Issues

Open an issue in this repository and start the title with the skill or plugin name, for example `[lib-builder] ...`.
