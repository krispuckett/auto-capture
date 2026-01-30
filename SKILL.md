# Auto-Capture Skill

**Trigger:** Cron job (runs every 2 hours) or manual invocation
**Purpose:** Automatically capture conversation content to daily memory logs, eliminating the behavioral dependency on manual writes.

## Architecture

```
Session History (sessions_list + sessions_history)
        ↓
  Extract user messages + assistant responses (text only, no tool calls)
        ↓
  Read today's daily log (memory/YYYY-MM-DD.md)
        ↓
  Semantic deduplication: identify what's NEW (not already captured)
        ↓
  Summarize new content into structured sections
        ↓
  Append to daily log under ## Auto-Captured section
```

## How It Works

1. **Gather:** Pull recent session history from main session + any active isolated sessions
2. **Extract:** Get user messages and assistant text responses (skip tool calls, thinking tokens)
3. **Compare:** Read current daily log, identify information gaps
4. **Summarize:** Generate structured summary of uncaptured content
5. **Write:** Append to daily log with clear `## Auto-Captured` header and timestamp
6. **Rebuild:** Run rebuild-state.sh to update the state cache

## What Gets Captured

- Health data shared by user (metrics, symptoms, iron status)
- Decisions made (purchases, plans, commitments)
- Important life events mentioned
- Calendar items discussed
- Tasks or reminders set
- Key conversations or insights

## What Gets Skipped

- Tool call details (file reads, web fetches, etc.)
- Thinking tokens
- System messages / heartbeats
- Content already in today's daily log
- Routine acknowledgments with no information value

## Deduplication Strategy

The skill reads today's daily log and checks each extracted fact against it. Uses keyword matching + semantic similarity:
- If a fact contains the same key terms (names, numbers, dates) as existing log entries → skip
- If a fact is genuinely new information → include

## Invocation

### Via Cron (automatic)
Runs every 2 hours during waking hours (8am-10pm MST).

### Via Manual Command
User says "capture session" or "sync memory" → runs immediately.

## Files

- `SKILL.md` — This file
- Cron job: `auto-capture` (created on install)
