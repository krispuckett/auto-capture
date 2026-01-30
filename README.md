# Auto-Capture

A [Clawdbot](https://github.com/clawdbot/clawdbot) skill that automatically captures conversation content to daily memory logs. No more lost context between sessions.

## The Problem

AI assistants are stateless between turns. If you tell your assistant something important and it doesn't write it down immediately, that information can be lost — to context compaction, session boundaries, or just never getting logged.

This skill is a safety net. It periodically reviews conversation history, compares it against your daily memory logs, and fills in the gaps automatically.

## What It Does

- **Session scanning** — Pulls recent conversation history from main + isolated sessions via `sessions_list` and `sessions_history`
- **Semantic deduplication** — Reads today's daily log and only captures information that isn't already there
- **Structured output** — Appends new information under a timestamped `## Auto-Captured` section
- **State rebuild** — Includes `rebuild-state.js` to derive state caches from daily logs (never trust a cache as source of truth)

## What Gets Captured

- Health data, metrics, symptoms
- Decisions, purchases, plans
- Life events, calendar items
- Tasks and reminders set
- Key conversations and insights

## What Gets Skipped

- Tool call details
- System messages and heartbeats
- Content already in today's log
- Routine acknowledgments

## Setup

### 1. Install the skill

Copy `SKILL.md` and `scripts/` to your Clawdbot skills directory:

```bash
cp -r auto-capture ~/clawd/skills/
```

### 2. Create the cron job

The skill runs as a Clawdbot cron job. Add it via the cron tool or manually:

```
Schedule: 15 8,10,12,14,16,18,20,22 * * * (every 2 hours, waking hours)
Session: isolated
```

See `cron-job.json` for the full job definition you can import.

### 3. Set up rebuild-state

The `scripts/rebuild-state.js` script parses your daily memory logs and rebuilds `heartbeat-state.json` as a derived cache.

```bash
node scripts/rebuild-state.js
```

Run it on morning briefings or any time you need fresh state.

## Architecture

```
Daily logs (memory/YYYY-MM-DD.md) ← SOURCE OF TRUTH
         ↑
   Auto-Capture writes here
         ↑
   Compares against session history
         ↑
   sessions_list + sessions_history
```

The key principle: **daily logs are truth, state files are caches.** The auto-capture agent writes to daily logs. The rebuild script derives state from them. Nothing critical reads from the cache alone.

## Files

| File | Purpose |
|------|---------|
| `SKILL.md` | Skill definition for Clawdbot |
| `scripts/rebuild-state.js` | Rebuilds heartbeat-state.json from daily logs |
| `scripts/rebuild-state.sh` | Shell wrapper for the rebuild script |
| `cron-job.json` | Importable cron job definition |

## Origin

Built live over iMessage in one hour after debugging a memory reliability issue. The AI assistant was reading from a stale state cache instead of its own daily logs — missing exercise data, sending wrong reminders. The fix: make the AI audit itself.

## License

MIT
