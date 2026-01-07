const DISCORD_WEBHOOK = "ПЕЙСТНИ_ТУК_WEBHOOK_URL_А";

await fetch(DISCORD_WEBHOOK, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    content: "✅ NeLex bot test: GitHub -> Discord работи (direct)."
  })
});

console.log("Discord message sent");
