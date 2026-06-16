# Temperature Monitoring System (MQTT & WebSockets)

Real-time temperature tracking using Arduino Uno, DHT11, Python gateway, and a Node.js VPS web dashboard.

**Key Features:**

- Arduino reads DHT11 sensor and handles scrolling LCD name banner.
- Python gateway transfers local USB serial data (`COM14`) to MQTT.
- Topic isolation on shared broker: `sensor_zigirumugabe_louis_miguel`.
- Node.js cloud server serves dashboard and broadcasts live data via WebSockets.

---

## System Architecture

```text
[Sensor] -> [Arduino] -> (Serial) -> [Python Gateway] -> (MQTT) -> [Broker] -> [Node.js VPS] -> (WS) -> [Web UI]

```

---

## Code Configurations

### 1. Local Gateway (`main.py`)

```python
import serial, time, paho.mqtt.client as mqtt
ser = serial.Serial('COM14', 9600, timeout=1)
client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
client.connect("broker.benax.rw", 1883, 60)
client.loop_start()

while True:
    if ser.in_waiting > 0:
        raw = ser.readline().decode('utf-8').strip()
        if "Temperature:" in raw:
            val = raw.split(":")[1].strip().split(" ")[0]
            client.publish("sensor_zigirumugabe_louis_miguel", payload=val, qos=1)
    time.sleep(0.01)

```

### 2. Backend Server (`server.js`)

```javascript
const express = require("express"),
  http = require("http"),
  WebSocket = require("ws"),
  mqtt = require("mqtt"),
  path = require("path");
const app = express(),
  server = http.createServer(app),
  wss = new WebSocket.Server({ server }),
  topic = "sensor_zigirumugabe_louis_miguel";
let logs = [];

app.use(express.static(path.join(__dirname, "public")));
app.get("/api/temperature", (req, res) => res.json(logs));

const mqttClient = mqtt.connect("mqtt://broker.benax.rw:1883");
mqttClient.on("connect", () => mqttClient.subscribe(topic));
mqttClient.on("message", (t, msg) => {
  const val = parseFloat(msg.toString().replace(/[^\d.-]/g, ""));
  if (!isNaN(val)) {
    logs.unshift({
      id: Date.now(),
      temperature: val,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
    });
    if (logs.length > 10) logs.pop();
    wss.clients.forEach(
      (c) =>
        c.readyState === WebSocket.OPEN &&
        c.send(JSON.stringify({ type: "TEMPERATURE_UPDATE", value: val })),
    );
  }
});
server.listen(process.env.PORT || 9280);
```

---

## Setup & Deployment

### Hardware & Gateway Setup

1. Wire DHT11 to pin **D2** and LCD to I2C pins (**A4/A5**). Upload `.ino` sketch.
2. Run local gateway: `pip install pyserial paho-mqtt && python main.py`

### VPS Production Deployment

1. SSH to VPS and purge old repository layout files:

```bash
ssh user280@157.173.101.159
cd ~/practical && shopt -s extglob && rm -rf !(server.js|public)

```

2. Start background engine: `npm install express ws mqtt && PORT=9280 nohup node server.js > server.log 2>&1 &`

---

## Previews & Delivery
- **Images folder** : For examples of the live previews
- **Production Link:** [http://157.173.101.159:9280/](http://157.173.101.159:9280/)
