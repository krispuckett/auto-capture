#!/usr/bin/env node
// rebuild-state.js — Rebuilds heartbeat-state.json from daily log files (source of truth)
// Daily logs are truth. State file is a derived cache.

const fs = require('fs');
const path = require('path');

const memDir = path.join(process.env.HOME, 'clawd', 'memory');
const stateFile = path.join(memDir, 'heartbeat-state.json');
const today = new Date().toISOString().split('T')[0];

function getDates(n) {
  const dates = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function parseDay(date) {
  const file = path.join(memDir, date + '.md');
  if (!fs.existsSync(file)) return null;

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  const result = {
    date,
    recovery: null,
    hrv: null,
    rhr: null,
    sleep_score: null,
    sleep_duration: '',
    spo2: null,
    temp: null,
    rem: '',
    deep: '',
    sleep_bank: '',
    zone: 'Unknown',
    iron_taken: false,
    iron_due: false,
    movement: false
  };

  for (const line of lines) {
    const l = line.trim();

    // Recovery: '**Recovery:** 67%' OR '- Recovery: 45% (down...)'
    const recMatch = l.match(/(?:\*\*)?Recovery:?\*?\*?\s*(\d+)%/);
    if (recMatch && result.recovery === null) result.recovery = parseInt(recMatch[1]);

    // HRV: '**HRV:** 30.1' OR '- HRV: 22.9ms'
    const hrvMatch = l.match(/^-\s*(?:\*\*)?HRV:?\*?\*?\s*([\d.]+)/);
    if (hrvMatch && result.hrv === null) result.hrv = parseFloat(hrvMatch[1]);

    // RHR
    const rhrMatch = l.match(/^-\s*(?:\*\*)?RHR:?\*?\*?\s*([\d.]+)/);
    if (rhrMatch && result.rhr === null) result.rhr = parseFloat(rhrMatch[1]);

    // Sleep Score: '**Sleep Score:** 90%' OR '- Sleep: 78%, 6h 38m'
    const sleepMatch = l.match(/(?:\*\*)?Sleep(?: Score)?:?\*?\*?\s*(\d+)%/);
    if (sleepMatch && result.sleep_score === null) result.sleep_score = parseInt(sleepMatch[1]);

    // Sleep Duration
    const durMatch = l.match(/(?:\*\*)?Sleep(?: Duration)?:?\*?\*?\s*(?:\d+%,?\s*)?(\dh\s*\d+m)/);
    if (durMatch && !result.sleep_duration) result.sleep_duration = durMatch[1];

    // SpO2 - dedicated line only
    const spo2Match = l.match(/^-\s*(?:\*\*)?SpO2:?\*?\*?\s*([\d.]+)%?/);
    if (spo2Match && result.spo2 === null) result.spo2 = parseFloat(spo2Match[1]);

    // Temp
    const tempMatch = l.match(/^-\s*(?:\*\*)?Temp:?\*?\*?\s*([\d.]+)/);
    if (tempMatch && result.temp === null) result.temp = parseFloat(tempMatch[1]);

    // REM
    const remMatch = l.match(/(?:\*\*)?REM:?\*?\*?\s*(?:flagged\s+\w+\s+\w+\s+\()?(\dh?\s*\d*m?)/);
    if (remMatch && !result.rem) result.rem = remMatch[1];

    // Deep
    const deepMatch = l.match(/^-\s*(?:\*\*)?Deep:?\*?\*?\s*(\dh?\s*\d*m)/);
    if (deepMatch && !result.deep) result.deep = deepMatch[1];

    // Sleep Bank
    const bankMatch = l.match(/(?:\*\*)?Sleep [Bb]ank:?\*?\*?\s*([+-]?[\d]+(?:h\s*\d+)?m)/);
    if (bankMatch && !result.sleep_bank) result.sleep_bank = bankMatch[1];
  }

  // Iron detection - specific positive confirmations only
  // DO NOT match: "Taken yesterday", "iron missed", general discussion
  const ironTakenPatterns = [
    /iron[\s:]*taken(?!\s+yesterday)/i,
    /took\s+(?:my\s+)?iron/i,
    /iron\s*✓/i,
    /iron.*done\s*(?:today|tonight|this)/i,
    /iron\s+confirmed/i,
  ];
  const ironDuePatterns = [
    /iron\s*(?:day\s*\d+\s*)?(?:due|tonight)/i,
    /iron\s+due/i,
    /iron day \d+ tonight/i,
  ];

  for (const pattern of ironTakenPatterns) {
    if (pattern.test(content)) {
      result.iron_taken = true;
      break;
    }
  }
  for (const pattern of ironDuePatterns) {
    if (pattern.test(content)) {
      result.iron_due = true;
      break;
    }
  }

  // Movement detection - actual exercise events only
  const movementPositive = [
    /(?:outdoor|indoor)\s+cycling\s+ride/i,
    /swift\s+ride\s+done/i,
    /zwift\s+ride/i,
    /ride\s+done/i,
    /first\s+zwift\s+ride/i,
    /got\s+(?:the\s+)?(?:bike\s+)?ride\s+in/i,
    /movement.*streak:\s*[1-9]/i,
    /movement\s+achieved/i,
    /\*\*Duration:\*\*\s*\d+\s*min/i,
    /\*\*Distance:\*\*\s*[\d.]+\s*mi/i,
    /workout.*completed/i,
    /##\s*(?:Outdoor|Indoor)\s+Cycling/i,
  ];
  const movementNegative = [
    /movement.*didn.t happen/i,
    /0\/7\s*days/i,
    /no\s+exercise/i,
    /movement.*not.*done/i,
  ];

  let hasPositive = false;
  for (const pattern of movementPositive) {
    if (pattern.test(content)) { hasPositive = true; break; }
  }
  // Positive wins (actual events trump earlier negative plans)
  result.movement = hasPositive;

  // Zone (Bevel thresholds)
  if (result.recovery !== null) {
    if (result.recovery >= 67) result.zone = 'Green';
    else if (result.recovery >= 34) result.zone = 'Yellow';
    else result.zone = 'Red';
  }

  return result;
}

const dates = getDates(7);
const days = dates.map(d => parseDay(d)).filter(Boolean);
const todayData = days[0] || { date: today };

// Backward inference for iron tracking
for (let i = 0; i < days.length; i++) {
  const day = days[i];
  const file = path.join(memDir, day.date + '.md');
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');

  // If this day says "Taken yesterday", mark previous day
  if (/taken yesterday/i.test(content) && i + 1 < days.length) {
    days[i + 1].iron_taken = true;
  }

  // If iron was due and no evidence of missing, assume taken
  if (day.iron_due && !day.iron_taken) {
    const nextIdx = i - 1; // days are reverse chronological
    let missed = false;
    if (nextIdx >= 0) {
      const nextFile = path.join(memDir, days[nextIdx].date + '.md');
      if (fs.existsSync(nextFile)) {
        const nextContent = fs.readFileSync(nextFile, 'utf8');
        if (/iron.*miss|forgot.*iron/i.test(nextContent)) {
          missed = true;
        }
      }
    }
    if (!missed) {
      day.iron_taken = true;
    }
  }
}

// Week stats
const hrvs = days.filter(d => d.hrv).map(d => d.hrv);
const recs = days.filter(d => d.recovery !== null).map(d => d.recovery);
const avgHrv = hrvs.length ? +(hrvs.reduce((a, b) => a + b, 0) / hrvs.length).toFixed(1) : null;
const avgRecovery = recs.length ? +(recs.reduce((a, b) => a + b, 0) / recs.length).toFixed(1) : null;

// Find last iron day
let lastIronDay = null;
for (const day of days) {
  if (day.iron_taken) { lastIronDay = day.date; break; }
}

let nextIronDay = null;
if (lastIronDay) {
  const d = new Date(lastIronDay + 'T12:00:00');
  d.setDate(d.getDate() + 2);
  nextIronDay = d.toISOString().split('T')[0];
}

// Preserve existing lastChecks
let lastChecks = { email: null, calendar: null, weather: null, craft_sync: null };
try {
  const existing = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  if (existing.lastChecks) lastChecks = existing.lastChecks;
} catch (e) {}

const state = {
  lastChecks,
  todayMetrics: {
    date: today,
    recovery: todayData.recovery ?? null,
    sleep_score: todayData.sleep_score ?? null,
    hrv: todayData.hrv ?? null,
    rhr: todayData.rhr ?? null,
    spo2: todayData.spo2 ?? null,
    temp: todayData.temp ?? null,
    zone: todayData.zone ?? 'Unknown',
    iron_due: todayData.iron_due ?? false,
    iron_taken: todayData.iron_taken ?? false,
    movement: todayData.movement ?? false,
    sleep_duration: todayData.sleep_duration ?? '',
    rem: todayData.rem ?? '',
    deep: todayData.deep ?? '',
    sleep_bank: todayData.sleep_bank ?? ''
  },
  ironSchedule: {
    lastIronDay,
    nextIronDay,
    pattern: 'every_other_day'
  },
  weekSummary: {
    updated: new Date().toISOString(),
    days: days.map(d => ({
      date: d.date,
      recovery: d.recovery,
      hrv: d.hrv,
      sleep: d.sleep_score,
      zone: d.zone,
      iron: d.iron_taken,
      movement: d.movement
    })),
    avgHrv,
    avgRecovery,
    greenDays: days.filter(d => d.zone === 'Green').length,
    yellowDays: days.filter(d => d.zone === 'Yellow').length,
    redDays: days.filter(d => d.zone === 'Red').length,
    ironDays: days.filter(d => d.iron_taken).length,
    movementDays: days.filter(d => d.movement).length
  }
};

fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
console.log('State rebuilt from daily logs at ' + new Date().toLocaleString());
