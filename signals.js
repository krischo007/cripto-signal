const DISCORD_WEBHOOK_URL = "ТУК_СЛАГАШ_ТВОЯ_WEBHOOK_URL";

async function sendDiscordSignal() {
  const message = {
    content:
`📊 **Crypto Signal Test**

BTC
Вход: 100 000 USD
Изход 1: 105 000 USD (+5%)
Изход 2: 107 000 USD (+7%)
Стоп: 99 000 USD (-1%)

⏱ Генерирано автоматично`
  };

  await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message)
  });

  console.log("Signal sent to Discord");
}

sendDiscordSignal();

