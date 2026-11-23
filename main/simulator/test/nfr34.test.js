// NFR-34: the broker refuses a sensor publishing on another sensor's topic.
// Needs the KAN-56 broker (TLS + dynamic security); skipped until NFR34_* are set.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import mqtt from 'mqtt';

const env = process.env;
const NAO_AUTORIZADO = 0x87;

test('NFR-34: sensor só publica no seu tópico', { skip: !env.NFR34_SENSOR && 'NFR34_* não definidas (KAN-56)' }, async () => {
  const client = await mqtt.connectAsync(env.NFR34_URL, {
    clientId: env.NFR34_SENSOR,
    username: env.NFR34_SENSOR,
    password: env.NFR34_PASSWORD,
    ca: env.NFR34_CA ? readFileSync(env.NFR34_CA) : undefined,
    protocolVersion: 5,
    reconnectPeriod: 0,
  });
  try {
    const leitura = (id) => JSON.stringify({ sensor_id: id, nivel_enchimento: 1, data_hora: new Date().toISOString() });
    await client.publishAsync(`sensores/${env.NFR34_SENSOR}/leitura`, leitura(env.NFR34_SENSOR), { qos: 1 });
    await assert.rejects(
      client.publishAsync(`sensores/${env.NFR34_OUTRO}/leitura`, leitura(env.NFR34_OUTRO), { qos: 1 }),
      (err) => err.code === NAO_AUTORIZADO,
    );
  } finally {
    await client.endAsync();
  }
});
