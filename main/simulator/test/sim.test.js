import assert from 'node:assert/strict';
import test from 'node:test';
import { ZONAS_PADRAO, atrasoReligacao, guardar, horaAcores, proximoNivel, silencioso, taxaAtual } from '../sim.js';

const { turistica, residencial } = ZONAS_PADRAO;
const HORA = 3_600_000;

test('taxa aplica o pico da zona só dentro de [de, ate)', () => {
  assert.equal(taxaAtual(turistica, 9, undefined), 3);
  assert.equal(taxaAtual(turistica, 10, undefined), 7.5);
  assert.equal(taxaAtual(turistica, 19, undefined), 3);
  assert.equal(taxaAtual(residencial, 20, 4), 6);
});

test('nível sobe com a taxa e SPEED e para nos 100', () => {
  assert.equal(proximoNivel(10, 2, HORA, 1), 12);
  assert.equal(proximoNivel(10, 2, HORA / 60, 60), 12);
  assert.equal(proximoNivel(99, 2, HORA, 1), 100);
});

test('hora dos Açores (UTC-1 no inverno)', () => {
  assert.equal(horaAcores(new Date('2026-11-23T12:00:00Z')), 11);
});

test('janela de silêncio em minutos reais', () => {
  const cfg = { apos_min: 10, duracao_min: 5 };
  assert.equal(silencioso(cfg, 0, 9 * 60_000), false);
  assert.equal(silencioso(cfg, 0, 10 * 60_000), true);
  assert.equal(silencioso(cfg, 0, 15 * 60_000), false);
  assert.equal(silencioso(undefined, 0, 0), false);
});

test('buffer guarda só as leituras mais recentes', () => {
  const b = [];
  for (let i = 1; i <= 5; i++) guardar(b, i, 3);
  assert.deepEqual(b, [3, 4, 5]);
});

test('religação entre 0.5 s e 60 s', () => {
  assert.ok(atrasoReligacao(0) >= 500 && atrasoReligacao(0) <= 1000);
  assert.ok(atrasoReligacao(20) >= 30_000 && atrasoReligacao(20) <= 60_000);
});
