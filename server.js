const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const mqtt = require("mqtt");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let recentLogs = [];

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/temperature", (req, res) => {
  res.json(recentLogs);
});

const mqttClient = mqtt.connect("mqtt://broker.benax.rw:1883");

mqttClient.on("connect", () => {
  mqttClient.subscribe("sensor_byiringiro_emmanuel");
});

mqttClient.on("message", (topic, message) => {
  if (topic === "sensor_byiringiro_emmanuel") {
    const temperatureValue = parseFloat(message.toString());

    if (!isNaN(temperatureValue)) {
      const logEntry = {
        id: Date.now(),
        temperature: temperatureValue,
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      };

      recentLogs.unshift(logEntry);

      if (recentLogs.length > 10) {
        recentLogs.pop();
      }

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "TEMPERATURE_UPDATE",
              value: temperatureValue,
            }),
          );
        }
      });
    }
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Local test server running at http://localhost:${PORT}`);
});
