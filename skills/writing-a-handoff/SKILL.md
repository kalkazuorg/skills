---
name: writing-a-handoff
description: Use when your human partner wants to end a long conversation and continue the work in a new one, or when the context is getting large in the middle of a task - writes a continuation document that a fresh session can act on from its file path alone
---

# Writing a Handoff

## Overview

A new session knows nothing. Your human partner should be able to paste only the file's path into it and have work resume where it stopped, without re-explaining anything.

**Core principle:** The document speaks to the next agent, and every fact in it comes from a command you ran now, not from memory.

## The Steps

1. **Settle the machine.** Stop servers and background processes you started. Note anything you are leaving running on purpose.
2. **Gather facts with commands:** `git rev-parse --show-toplevel`, `git branch --show-current`, `git log --oneline -5`, `git status --short`. For each uncommitted file, know what state it is in.
3. **Write the document** in the language your human partner works in. Put it where their instructions say; otherwise in the project's `docs/` as `handoff-<topic>.md`. Don't commit it unless they ask.
4. **Check it as the next agent would:** could a session that has never seen this conversation start the first item of "What's left" using only this file? Fix what it would have to ask about.
5. **Hand over the full absolute path** in your reply and say: paste just this path into a new conversation.

## The Document

Start with this paragraph, adapted to the language:

> **To the agent reading this:** if your human partner pasted only this file's path, that is the whole request. Read this document to the end, then continue from "What's left", starting with the first item. Don't redo anything listed as done.

Then these sections. Leave one out only when it would be empty.

| Section | What goes in it |
|---|---|
| **Where** | Absolute repo path, branch, last commit (short SHA and message), each uncommitted file with what is half-done in it |
| **Goal** | What your human partner wants and why, in a few lines; link specs and plans by path |
| **Rules that always apply** | Their standing instructions for this work (approvals needed, things never to do) |
| **What they decided** | Decisions they made, in their terms |
| **Done and verified** | What is finished, and the command or check that proved it |
| **Not verified** | What was done but not proven, and what was never tried |
| **What's left** | Ordered list. The first item is concrete enough to start at once: file, function, next command |
| **Calls I made without them** | Choices you made on your own, so they can overrule them |
| **Their steps** | Things only they can do (approve, log in, deploy, pay) |
| **Machine state** | Servers or processes left running, temp files, local data to clean |

## Red Flags

| Thought | Reality |
|---------|---------|
| "I remember the branch and the last commit" | Run the commands. Memory after a long session is the thing that failed. |
| "They can paste the content into the new chat" | The promise is: paste only the path. Say so. |
| "A summary of what we did is enough" | The next agent needs what's left and where, not a story. |
| "Everything's committed, so no need to list state" | Check `git status`. Say it is clean, with the SHA. |
| "I'll leave the dev server running for them" | Stop it, or list it under Machine state. |
| "The relative path is fine" | A new session may start in another directory. Give the absolute path. |
