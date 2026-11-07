# GitHub issues

lib-builder lives in `kalkazuorg/skills`, next to other skills, so every
search and every new issue carries `lib-builder` in it.

Use `gh` when it is installed and authenticated; it handles auth, rate
limits, and JSON. Fall back to the public API with curl, then to a URL
your partner opens.

## Search

```bash
gh search issues --repo kalkazuorg/skills --limit 10 "lib-builder <terms>" \
  --json number,state,title --jq '.[] | "\(.number)\t\(.state)\t\(.title)"'
```

Without `gh` (unauthenticated, 10 requests a minute):

```bash
curl -s -H "Accept: application/vnd.github+json" \
  "https://api.github.com/search/issues?q=repo:kalkazuorg/skills+is:issue+lib-builder+<url-encoded terms>&per_page=10" \
  | jq -r '.items[] | "\(.number)\t\(.state)\t\(.title)"'
```

Without curl, hand over `https://github.com/kalkazuorg/skills/issues?q=lib-builder+<terms>`.

## File

Write the filled `templates/issue.md` to the workspace and show the exact
text. Start the title with `[lib-builder]`. After approval:

```bash
gh issue create --repo kalkazuorg/skills --title "[lib-builder] <title>" --body-file <path> \
  --label bug
```

GitHub drops labels silently when the reporter lacks push access, so the
label lands only for collaborators; the template footer still marks the
issue as skill-filed. `gh` cannot attach files: give your partner the
bundle path to attach through the browser after the issue exists.

Without `gh`, hand over a prefilled link:

```
https://github.com/kalkazuorg/skills/issues/new?labels=bug&title=%5Blib-builder%5D%20<url-encoded title>&body=<url-encoded body>
```

GitHub rejects URLs over about 8,000 characters; past that, send the link
with the title only and tell your partner to paste the body from the file.
