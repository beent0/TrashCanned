// Minimal sensor simulator: N sensors publish fill levels on sensores/{sensor_id}/leitura (QoS 1).
// shortcut: plain MQTT on 1883 with no per-sensor credentials, fixed fill curve; KAN-48 adds TLS 8883, credentials, peaks and silent sensors.
import mqtt from 'mqtt';

const url = process.env.MQTT_URL ?? 'mqtt://localhost:1883';
const count = Number(process.env.SENSORS ?? 3);
const intervalMs = Number(process.env.INTERVAL_MS ?? 5000);

const sensors = Array.from({ length: count }, (_, i) => ({
  id: `SNS-SIM-${String(i + 1).padStart(3, '0')}`,
  level: Math.random() * 50,
}));

const client = mqtt.connect(url, { reconnectPeriod: 2000 });
client.on('connect', () => console.log(`ligado a ${url}, ${count} sensores`));
client.on('error', (err) => console.error('erro MQTT:', err.message));

setInterval(() => {
  if (!client.connected) return;
  for (const s of sensors) {
    s.level = s.level >= 100 ? 0 : Math.min(100, s.level + Math.random() * 5);
    const leitura = {
      sensor_id: s.id,
      nivel_enchimento: Number(s.level.toFixed(1)),
      data_hora: new Date().toISOString(),
    };
    client.publish(`sensores/${s.id}/leitura`, JSON.stringify(leitura), { qos: 1 });
  }
}, intervalMs);
