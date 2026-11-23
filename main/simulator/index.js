// Sensor simulator (KAN-48): each sensor is its own MQTT client publishing on sensores/{sensor_id}/leitura (QoS 1).
// Config and behaviour: decisions doc §7 and .env.example.
import { readFileSync } from 'node:fs';
import mqtt from 'mqtt';
import { ZONAS_PADRAO, horaAcores, proximoNivel, silencioso, taxaAtual } from './sim.js';

const env = process.env;
const url = env.MQTT_URL || 'mqtt://localhost:1883';
const ca = env.MQTT_CA ? readFileSync(env.MQTT_CA) : undefined;
const intervalMs = Number(env.INTERVAL_MS || 5000);
const speed = Number(env.SPEED || 1);
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

function ligar(nome, username, password) {
  const client = mqtt.connect(url, {
    clientId: nome,
    username: password ? username : undefined,
    password,
    ca,
    protocolVersion: 5,
  });
  client.on('connect', () => console.log(`${nome}: ligado a ${url}`));
  client.on('error', (err) => console.error(`${nome}: ${err.message}`));
  return client;
}

const sensores = configs.map((c) => ({ ...c, nivel: Math.random() * 50, client: ligar(c.id, c.id, c.password) }));

const inicio = Date.now();
let ultimo = inicio;
setInterval(() => {
  const agora = Date.now();
  const hora = horaAcores(new Date(agora));
  for (const s of sensores) {
    s.nivel = proximoNivel(s.nivel, taxaAtual(zonas[s.zona], hora, s.taxa_pct_h), agora - ultimo, speed);
    if (silencioso(s.silencioso, inicio, agora) || !s.client.connected) continue;
    const leitura = { sensor_id: s.id, nivel_enchimento: Number(s.nivel.toFixed(1)), data_hora: new Date(agora).toISOString() };
    s.client.publish(`sensores/${s.id}/leitura`, JSON.stringify(leitura), { qos: 1 }, (err) => {
      if (err) console.error(`${s.id}: publicação recusada: ${err.message}`);
    });
  }
  ultimo = agora;
}, intervalMs);

console.log(`${sensores.length} sensores, intervalo ${intervalMs} ms, SPEED ${speed}`);
