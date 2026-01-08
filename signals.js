import fs from "fs";

// === НАСТРОЙКА ===
const DISCORD_WEBHOOK_URL =
  "ПЕЙСТНИ_ТУК_ТВОЯ_DISCORD_WEBHOOK_URL";

const MAX_PER_RUN = 3;   // 2–3 сигнала на пускане
const MAX_PER_DAY = 10; // до 10 на ден
const MIN_TARGET_PCT = 2.0;

// Binance public API
const BASE = "https://api.binance.com";
const QUOTE = "USDT";

// Таймфреймове
const TF_FAST = "1m";
const TF_MID = "15m";
const TF_SLOW = "1h";

// Индикатори
const EMA_FAST = 9;
const EMA_SLOW = 21;
const RSI_LEN = 14;
const ATR_LEN = 14;

// === ПОМОЩНИ ===
function today() {
  return new Date().toISOString().slice(0, 10);
}

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

async function sendDiscord(msg) {
  await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: msg })
  });
}

function ema(arr, len) {
  const k = 2 / (len + 1);
  let e = arr[0];
  for (let i = 1; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
  return e;
}

function rsi(closes, len) {
  let g = 0, l = 0;
  for (let i = closes.length - len; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    d >= 0 ? (g += d) : (l -= d);
  }
  if (l === 0) return 100;
  const rs = g / len / (l / len);
  return 100 - 100 / (1 + rs);
}

function atr(kl, len) {
  let s = 0;
  for (let i = kl.length - len; i < kl.length; i++) {
    const p = kl[i - 1];
    const c = kl[i];
    s += Math.max(
      c.h - c.l,
      Math.abs(c.h - p.c),
      Math.abs(c.l - p.c)
    );
  }
  return s / len;
}

function round(p) {
  return Number(p.toFixed(4));
}

// === STATE (лимит на ден) ===
function loadState() {
  try {
    return JSON.parse(fs.readFileSync("state.json"));
  } catch {
    return { date: "", sent_today: 0, sent: {} };
  }
}

function saveState(s) {
  fs.writeFileSync("state.json", JSON.stringify(s, null, 2));
}

// === ОСНОВНА ЛОГИКА ===
async function main() {
  const state = loadState();
  const d = today();

  if (state.date !== d) {
    state.date = d;
    state.sent_today = 0;
    state.sent = {};
  }

  if (state.sent_today >= MAX_PER_DAY) return;

  const tickers = await fetchJson(`${BASE}/api/v3/ticker/24hr`);
  const top = tickers
    .filter(t => t.symbol.endsWith(QUOTE))
    .sort((a, b) => b.quoteVolume - a.quoteVolume)
    .slice(0, 30);

  let sentNow = 0;

  for (const t of top) {
    if (sentNow >= MAX_PER_RUN || state.sent_today >= MAX_PER_DAY) break;

    const [k1, k15, k60] = await Promise.all([
      fetchJson(`${BASE}/api/v3/klines?symbol=${t.symbol}&interval=${TF_FAST}&limit=100`),
      fetchJson(`${BASE}/api/v3/klines?symbol=${t.symbol}&interval=${TF_MID}&limit=100`),
      fetchJson(`${BASE}/api/v3/klines?symbol=${t.symbol}&interval=${TF_SLOW}&limit=100`)
    ]);

    const c1 = k1.map(x => +x[4]);
    const c15 = k15.map(x => +x[4]);

    const eFast = ema(c15.slice(-50), EMA_FAST);
    const eSlow = ema(c15.slice(-50), EMA_SLOW);
    const r = rsi(c1, RSI_LEN);
    const a = atr(k15.map(x => ({ h: +x[2], l: +x[3], c: +x[4] })), ATR_LEN);

    let side = null;
    if (eFast > eSlow && r > 45 && r < 70) side = "BUY";
    if (eFast < eSlow && r < 55 && r > 30) side = "SELL";
    if (!side) continue;

    const entry = +t.lastPrice;
    const stop = side === "BUY" ? entry - a * 1.2 : entry + a * 1.2;
    const exit1 = side === "BUY"
      ? entry * (1 + MIN_TARGET_PCT / 100)
      : entry * (1 - MIN_TARGET_PCT / 100);
    const exit2 = side === "BUY"
      ? entry * (1 + (MIN_TARGET_PCT + 3) / 100)
      : entry * (1 - (MIN_TARGET_PCT + 3) / 100);

    const key = `${t.symbol}-${side}`;
    if (state.sent[key]) continue;

    const msg =
`**${t.symbol}**
${side === "BUY" ? "🟢 BUY" : "🔴 SELL"}
Entry: **${round(entry)}**
Exit 1: **${round(exit1)}**
Exit 2: **${round(exit2)}**
Stop: **${round(stop)}**
Why: EMA trend + RSI + ATR`;

    await sendDiscord(msg);

    state.sent[key] = true;
    state.sent_today++;
    sentNow++;
  }

  saveState(state);
}

main();
