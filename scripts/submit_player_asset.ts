const response = await fetch("http://localhost:3000/events/summer-cup/assets", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    playerId: "player-42",
    kind: "emblem",
    description: "A bright arena banner"
  })
});
console.log(JSON.stringify(await response.json(), null, 2));
export {};
