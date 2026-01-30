# Auto-Capture

A [Clawdbot](https://github.com/clawdbot/clawdbot) skill that makes your AI's memory more reliable.

## What Clawdbot already does

Clawdbot has persistent memory. Files, daily logs, semantic search — your assistant reads them every session and picks up where it left off. That part works.

## What this adds

Conversations are long. Context windows fill up and compact. Sessions restart. Cron jobs run in isolation. There are gaps between "said in conversation" and "written to the log." Auto-Capture closes those gaps.

It runs hourly in the background, pulls recent conversation history, checks what made it into today's daily log, and writes down anything that's missing. Your assistant's memory was already good. This makes it airtight.

**It captures:** health data, decisions, purchases, plans, calendar items, tasks, reminders — anything with real informational value that was discussed but not yet logged.

**It skips:** tool calls, system messages, heartbeats, routine responses, stuff already in the log.

## How it works

1. Scans recent session history across active sessions
2. Reads today's daily log
3. Finds information gaps
4. Appends missing info under a timestamped `## Auto-Captured` section
5. Rebuilds the state cache from updated logs

Runs silently. You never see it unless you check the daily log.

## The architecture in one sentence

Daily logs are truth. Everything else is a cache.

`heartbeat-state.json`, pattern files, weekly summaries — all rebuilt from daily logs by `rebuild-state.js`. Auto-Capture makes sure the logs stay complete. The caches take care of themselves.

## Setup

**1. Copy the skill**

```bash
cp -r auto-capture ~/clawd/skills/
```

**2. Add the cron job**

Import `cron-job.json` or create it manually. Runs every hour during waking hours (8am–10pm).

**3. Run the state rebuilder**

```bash
node scripts/rebuild-state.js
```

Parses your daily logs, rebuilds `heartbeat-state.json`. Run it on morning briefings or whenever you want fresh state.

## Files

- `SKILL.md` — Skill definition
- `scripts/rebuild-state.js` — Rebuilds state from daily logs
- `scripts/rebuild-state.sh` — Shell wrapper
- `cron-job.json` — Ready to import

## License

MIT
