# Auto-Capture

A [Clawdbot](https://github.com/clawdbot/clawdbot) skill that gives your AI assistant persistent memory — automatically.

## Why This Exists

AI assistants wake up fresh every session. If yours tells you it "remembers" something, what it really means is: that information exists in a file it can read. If it never wrote it down, it's gone.

We hit this the hard way. Our assistant missed three days of cycling data, sent wrong reminders, and claimed it was our "first movement day" when it wasn't. The problem wasn't the memory system — the tools worked fine. The problem was the assistant not writing things down fast enough before context got recycled.

Auto-Capture fixes this. It runs in the background every two hours, reviews what was said in conversation, checks what made it into the daily log, and fills in the gaps. Think of it as spell-check for your AI's memory.

## How It Works

1. **Scans** recent conversation history across all active sessions
2. **Reads** today's daily memory log
3. **Compares** — finds anything mentioned in conversation that didn't make it to the log
4. **Writes** missing information to the log under a timestamped section
5. **Rebuilds** the state cache from the updated logs

The daily log is always the source of truth. Everything else — state files, caches, pattern trackers — gets derived from it. If the cache is stale, nothing breaks. The logs are always right.

## What Gets Captured

Health data, decisions, purchases, plans, calendar items, tasks, reminders, key conversations. Anything with real informational value.

What gets skipped: tool calls, system messages, greetings, "sounds good" type responses.

## Setup

### 1. Copy the skill

```bash
cp -r auto-capture ~/clawd/skills/
```

### 2. Add the cron job

Import `cron-job.json` or create it manually. Default schedule: every 2 hours during waking hours (8am–10pm).

### 3. Run the state rebuilder

```bash
node scripts/rebuild-state.js
```

This parses your daily logs and rebuilds `heartbeat-state.json` as a derived cache. Run it whenever you want fresh state — the morning briefing cron is a good place.

## Files

| File | What it does |
|------|-------------|
| `SKILL.md` | Skill definition for Clawdbot |
| `scripts/rebuild-state.js` | Rebuilds state cache from daily logs |
| `scripts/rebuild-state.sh` | Shell wrapper for the rebuild script |
| `cron-job.json` | Ready-to-import cron job definition |

## The Principle

Daily logs are truth. State files are caches. Caches go stale. Logs don't.

If your AI reads from a cache and the cache is wrong, your AI is wrong. If it reads from the log — the thing it actually wrote to during the conversation — it's right. Auto-Capture makes sure the log is always complete.

## Origin

Built in one hour over iMessage after a frustrating debugging session with our assistant. It kept getting things wrong. We traced every failure back to the same root cause: stale state, unwritten data. So we built a system where the AI audits its own memory. Now it catches what it drops.

## License

MIT
