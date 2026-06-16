const liveTempDisplay = document.getElementById("live-temp");
const statusText = document.getElementById("status-text");
const logsTableBody = document.getElementById("logs-table-body");

const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
const socket = new WebSocket(`${wsProtocol}${window.location.host}`);

socket.onopen = () => {
  statusText.textContent = "Connected. Awaiting real-time updates...";
  fetchInitialLogs();
};

socket.onclose = () => {
  statusText.textContent = "Disconnected from server. Retrying connection...";
};

socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);

    if (data.type === "TEMPERATURE_UPDATE") {
      const tempValue = parseFloat(data.value).toFixed(1);
      liveTempDisplay.textContent = tempValue;

      statusText.textContent = `Live data received at ${new Date().toLocaleTimeString()}`;

      prependRowToTable(tempValue);
    }
  } catch (error) {
    if (event.data === "refresh") {
      fetchInitialLogs();
    }
  }
};

async function fetchInitialLogs() {
  try {
    const response = await fetch("/api/temperature");
    const logs = await response.json();

    logsTableBody.innerHTML = "";

    if (logs.length === 0) {
      logsTableBody.innerHTML =
        '<tr><td colspan="2">No historical records found.</td></tr>';
      return;
    }

    logs.forEach((log) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${log.timestamp}</td>
                <td>${parseFloat(log.temperature).toFixed(1)} °C</td>
            `;
      logsTableBody.appendChild(row);
    });
  } catch (error) {
    logsTableBody.innerHTML =
      '<tr><td colspan="2">Error loading historical records.</td></tr>';
  }
}

function prependRowToTable(tempValue) {
  const row = document.createElement("tr");
  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);

  row.innerHTML = `
        <td>${timestamp} (Live)</td>
        <td>${tempValue} °C</td>
    `;

  if (logsTableBody.firstChild && logsTableBody.firstChild.tagName === "TR") {
    logsTableBody.insertBefore(row, logsTableBody.firstChild);
  } else {
    logsTableBody.appendChild(row);
  }

  if (logsTableBody.children.length > 10) {
    logsTableBody.removeChild(logsTableBody.lastChild);
  }
}
