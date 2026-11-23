// Sensor simulator (KAN-48): each sensor is its own MQTT client publishing on sensores/{sensor_id}/leitura (QoS 1).
// Config and behaviour: decisions doc §7 and .env.example.
import { readFileSync } from 'node:fs';
import mqtt from 'mqtt';
import {
  ZONAS_PADRAO,
  atrasoReligacao,
  guardar,
  horaAcores,
  proximoNivel,
  silencioso,
  taxaAtual,
} from './sim.js';

const env = process.env;
const url = env.MQTT_URL || 'mqtt://localhost:1883';
const ca = env.MQTT_CA ? readFileSync(env.MQTT_CA) : undefined;
const intervalMs = Number(env.INTERVAL_MS || 5000);
const speed = Number(env.SPEED || 1);
const MAX_BUFFER = 500;
const zonas = { ...ZONAS_PADRAO, ...JSON.parse(env.ZONAS_JSON || '{}') };

const configs = env.SENSORS_JSON
  ? JSON.parse(env.SENSORS_JSON)
  : Array.from({ length: Number(env.SENSORS || 3) }, (_, i) => ({
      id: `SNS-SIM-${String(i + 1).padStart(3, '0')}`,
      zona: i % 2 === 0 ? 'turistica' : 'residencial',
    }));

for (const c of configs) {
  if (!c.id) throw new Error('SENSORS_JSON: sensor sem id');
  if (!zonas[c.zona]) throw new Error(`${c.id}: zona desconhecida "${c.zona}"`);
}

// MQTT.js only retries at a fixed period, so reconnection is driven here with backoff.
function ligar(nome, username, password) {
  const client = mqtt.connect(url, {
    clientId: nome,
    username: password ? username : undefined,
    password,
    ca,
    protocolVersion: 5,
    reconnectPeriod: 0,
  });
  let tentativa = 0;
  client.on('connect', () => {
    tentativa = 0;
    console.log(`${nome}: ligado a ${url}`);
  });
  client.on('close', () => setTimeout(() => client.reconnect(), atrasoReligacao(tentativa++)));
  client.on('error', (err) => console.error(`${nome}: ${err.message}`));
  return client;
}

function enviar(s) {
  while (s.client.connected && s.buffer.length) {
    const leitura = s.buffer.shift();
    s.client.publish(`sensores/${s.id}/leitura`, JSON.stringify(leitura), { qos: 1 }, (err) => {
      if (err) console.error(`${s.id}: publicação recusada: ${err.message}`);
    });
  }
}

const inicio = Date.now();
const sensores = configs.map((c) => {
  const s = { ...c, nivel: Math.random() * 50, buffer: [] };
  s.client = ligar(c.id, c.id, c.password);
  s.client.on('connect', () => enviar(s));
  return s;
});

let ultimo = inicio;
setInterval(() => {
  const agora = Date.now();
  const hora = horaAcores(new Date(agora));
  for (const s of sensores) {
    s.nivel = proximoNivel(s.nivel, taxaAtual(zonas[s.zona], hora, s.taxa_pct_h), agora - ultimo, speed);
    if (silencioso(s.silencioso, inicio, agora)) continue;
    guardar(
      s.buffer,
      { sensor_id: s.id, nivel_enchimento: Number(s.nivel.toFixed(1)), data_hora: new Date(agora).toISOString() },
      MAX_BUFFER,
    );
    enviar(s);
  }
  ultimo = agora;
}, intervalMs);

console.log(`${sensores.length} sensores, intervalo ${intervalMs} ms, SPEED ${speed}`);
