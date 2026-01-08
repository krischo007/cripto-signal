const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

async function sendDiscordSignal() {
  if (!DISCORD_WEBHOOK_URL) {
    throw new Error("Missing DISCORD_WEBHOOK_URL. Add it in GitHub Secrets.");
  }

  const message = {
    content:
      "📈 **Crypto Signal Test**\n\n" +
      "BTC\n" +
      "Вход: 100 000 USD\n" +
      "Изход 1: 105 000 USD (+5%)\n" +
      "Изход 2: 107 000 USD (+7%)\n" +
      "Стоп: 99 000 USD (-1%)\n\n" +
      "🕒 Генерирано автоматично"
  };

  const res = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Discord webhook failed: ${res.status} ${txt}`);
  }

  console.log("Signal sent to Discord");
}

async function main() {
  await sendDiscordSignal();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

