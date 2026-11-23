# Warmline: a live prompt-cache band for Claude Code

![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-D97757)
![License: PolyForm Noncommercial](https://img.shields.io/badge/license-PolyForm%20Noncommercial%201.0.0-blue)
![Version](https://img.shields.io/badge/version-0.2.0-informational)
![Languages](https://img.shields.io/badge/UI-English%20%7C%20Arabic%20RTL-success)

> **In short:** Warmline is a Claude Code plugin that adds a small band above your chat prompt. It shows whether your session's prompt cache is **warm, cooling soon or cold**, how long is left before it goes cold, and what a **rebuild costs versus keeping it warm**, in USD. The numbers come from your session transcript's usage data, not estimates. It warns you before the cache expires and suggests one action.

**Keywords:** Claude Code prompt cache, Anthropic prompt caching, cache TTL 5 minutes, cache TTL 1 hour, cache write cost, cache read cost, token cost monitor, Claude Code status band, Claude Code plugin, Arabic RTL Claude Code.

---

## Features

- **Cache state:** 🟢 Warm, 🟡 Cooling soon, 🔵 Cold, or ⚪ Unknown.
- **Countdown:** time left until cold, counted from the last model response. Once cold, it shows how long the cache has been idle.
- **TTL detection:** 5 minutes or 1 hour, read from the transcript's cache-write breakdown. If the data doesn't say, it shows `TTL unknown` and raises no alerts.
- **Cost comparison, USD:** what a cold rebuild costs (cached tokens × the cache-write price for the detected TTL) against the cost of each refresh (cached tokens × the cache-read price).
- **Alerts:** one toast before the cache goes cold (5 minutes before for a 1-hour TTL, 1 minute before for a 5-minute TTL), with one suggestion.
- **Suggestions:**
  - Large, still-useful context: copy a short refresh message.
  - Costly rebuild or huge context: start a new session and copy a handoff prompt.
- **Languages:** English (default) or Arabic with right-to-left layout, chosen in the plugin's config.
- **Compact:** a rounded three-line card, each line kept to one line.

## How it works

Warmline reads your session transcript file, which Claude Code writes as JSON lines. It takes the last assistant response's timestamp and usage fields (`cache_read_input_tokens`, `cache_creation_input_tokens`, and the `cache_creation` 5-minute and 1-hour split), then re-reads only when the file grows. The band redraws once per second.

**Calls to a model:** none, except when you press **Copy handoff**. That button asks a small model (configurable, `haiku` by default) to write a handoff prompt from the last 16 messages.

## Install

### Claude Code (recommended)

Type this at the prompt of a terminal session:

```text
/plugin install warmline --marketplace MOHJRNL/warmline
```

Or from a shell:

```bash
claude plugin install warmline --marketplace MOHJRNL/warmline
```

In the desktop app, where `/plugin` isn't available: click **+** next to the prompt box, choose **Plugins**, then **Add marketplace** and enter `MOHJRNL/warmline`, then **Add plugin**.

Set the language under the plugin's options in the config menu (`en` or `ar`).

### Codex, Gemini CLI, OpenCode, Grok

Warmline is **not supported** in these tools. It draws into Claude Code's interface and reads Claude Code's transcript format, and those tools don't provide the same surfaces.

## Configuration

Edit `hooks/config.ts`:

- **`pricing`**: USD per million tokens, per model (input, 5-minute cache write, 1-hour cache write, cache read). Check these against current pricing before relying on the dollar figures.
- **`rebuildThresholdUsd`**: suggest a new session above this rebuild cost (default $0.50).
- **`largeContextTokens` / `hugeContextTokens`**: context sizes that trigger the refresh and new-session suggestions (defaults 100,000 and 400,000).
- **`alertBeforeMs`**: how early to warn before cold, per TTL.
- **`keepWarmPrompt`**: the short message copied for a refresh.
- **`handoffModel`**: the model that writes handoff prompts.

## FAQ

**What does "cached tokens" mean?** The tokens the cache holds for the prompt: cache reads plus cache writes from the last response. A cold rebuild would write them again.

**Why does the rebuild cost use the 1-hour or 5-minute write price?** It uses the price for the TTL the cache was written with, so the figure matches what a rebuild would cost.

**Does it slow Claude Code down?** The band reads a small tail of the transcript and only when the file has grown. Tests cover the parsing and the rendering on four surfaces.

**What if my model has no price in the config?** The band says so and asks you to add it. It does not guess.

**Is it an official Anthropic product?** No. It's an independent community plugin.

## Development

```bash
claude plugin validate ./     # manifest, module and types checks
claude plugin test ./         # unit and UI tests
```

## Test proof

A recorded test run on a fresh clone: see [TEST-PROOF.md](TEST-PROOF.md).

## License and commercial use

Free to use, copy and modify for non-commercial purposes, under the PolyForm Noncommercial License 1.0.0 (see `LICENSE`). For commercial use, contact the author for a separate license.

## Contributing

Issues and pull requests are welcome. Please include a test for behaviour changes.
