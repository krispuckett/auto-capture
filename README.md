# Auto-Capture

A [Clawdbot](https://github.com/clawdbot/clawdbot) skill that catches what your AI drops.

## The problem

Your AI assistant doesn't have memory. It has files it can read. If it doesn't write something down during the conversation, the next session starts blank. Context compaction, session restarts, cron jobs running in isolation — there are a dozen ways information gets lost between "you told me" and "I remember."

We kept running into this. The assistant missed three days of cycling data. Sent a wrong iron supplement reminder. Called it my "first movement day" when it was my third ride in four days. Every failure traced back to the same thing: data that existed in conversation but never made it to the log file.

## What this does

Auto-Capture runs as a cron job every two hours. It pulls your recent conversation history, reads today's daily log, and writes down anything that's missing.

That's it. No magic. It just does the thing the AI should have done during the conversation.

**It captures:** health data, decisions, purchases, plans, calendar stuff, tasks, reminders, anything with actual informational value.

**It skips:** tool calls, system messages, heartbeats, "sounds good" responses, stuff already in the log.

## The architecture in one sentence

Daily logs are truth. Everything else is a cache.

`heartbeat-state.json`, pattern files, weekly summaries — those all get rebuilt from daily logs by `rebuild-state.js`. If the cache is wrong, rebuild it. If the log is wrong, you have a real problem. Auto-Capture makes sure the log stays complete.

## Setup

**1. Copy the skill**

```bash
cp -r auto-capture ~/clawd/skills/
```

**2. Add the cron job**

Import `cron-job.json` or create it manually. Runs every 2 hours, 8am–10pm.

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

## How this got built

Debugging session over iMessage. The assistant kept getting things wrong. We traced every failure to stale state and unwritten data. Built the fix in an hour. Now the AI audits its own memory.

## License

MIT
