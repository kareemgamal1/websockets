import express from "express";

const app = express();

let eventId = 0;
const eventHistory = []; // simple in-memory store
const MAX_HISTORY = 100; // prevent memory leak

app.get("/sse-stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.flushHeaders();

  const lastEventId = Number(req.headers["last-event-id"]);

  const sendEvent = (event) => {
    res.write(`id: ${event.id}\n`);
    res.write(`data: ${event.data}\n\n`);
  };

  // 🔁 Replay missed events
  if (!isNaN(lastEventId)) {
    const missed = eventHistory.filter(e => e.id > lastEventId);
    missed.forEach(sendEvent);
  }

  // Send new events every second
  const intervalId = setInterval(() => {
    const event = {
      id: ++eventId,
      data: new Date().toString(),
    };

    eventHistory.push(event);

    if (eventHistory.length > MAX_HISTORY) {
      eventHistory.shift();
    }

    sendEvent(event);
  }, 1000);

  res.on("close", () => {
    clearInterval(intervalId);
  });
});

app.listen(3000, () => console.log("Server started on port 3000"));