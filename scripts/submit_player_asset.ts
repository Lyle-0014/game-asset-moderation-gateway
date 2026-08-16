const response = await fetch("http://localhost:3000/events/summer-cup/assets", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    playerId: "player-42",
    kind: "emblem",
    description: "A smiling sun above a pixel-art mountain"
  })
});

const result: unknown = await response.json();
console.log(JSON.stringify(result, null, 2));
