const DISCORD_WEBHOOK =
  "https://discord.com/api/webhooks/1458539725383451670/1Fc9pbK2ZDPaZ7U42LfmkYCZZIWmg8x3z-5km7bKL575NjA5sVMUpkYhFxyKMMa";

await fetch(DISCORD_WEBHOOK, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    content: "✅ NeLex Signals test: GitHub Actions → Discord OK"
  })
});

console.log("Message sent to Discord");
