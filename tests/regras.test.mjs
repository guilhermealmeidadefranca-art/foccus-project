import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const Regras = require('../docs/jogo/regras.js');
const bom = { proibido: false, palavra: 'BOOK' };
const proibido = { proibido: true, palavra: 'FORBIDDEN' };

test('partida começa zerada e ainda não terminou', () => {
  assert.deepEqual(Regras.novaPartida(), { pontos: 0, combo: 0, acertos: 0, erros: 0, terminou: false });
});

test('acerto comum vale 10 e aumenta o combo', () => {
  const estado = Regras.acertar(Regras.novaPartida(), bom);
  assert.equal(estado.pontos, 10);
  assert.equal(estado.combo, 1);
  assert.equal(estado.acertos, 1);
});

test('quinto acerto seguido dobra os pontos', () => {
  let estado = Regras.novaPartida();
  for (let i = 0; i < 4; i++) estado = Regras.acertar(estado, bom);
  estado = Regras.acertar(estado, bom);
  assert.equal(estado.pontos, 60);
  assert.equal(estado.combo, 5);
});

test('alvo proibido tira 15 e zera o combo sem pontuação negativa', () => {
  let estado = Regras.acertar(Regras.novaPartida(), bom);
  estado = Regras.acertar(estado, proibido);
  assert.equal(estado.pontos, 0);
  assert.equal(estado.combo, 0);
  assert.equal(estado.erros, 1);
});

test('sorteio controlado cria alvo bom determinístico com tempo de validade', () => {
  const valores = [0.9, 0.2, 0.3, 0.7];
  const alvo = Regras.criarAlvo(() => valores.shift(), 8, 1000, 0);
  assert.deepEqual({ id: alvo.id, palavra: alvo.palavra, x: alvo.x, y: alvo.y }, { id: 8, palavra: 'SUN', x: 0.3, y: 0.7 });
  assert.equal(alvo.proibido, false);
  assert.equal(alvo.expiraEm, 2250);
});

test('sorteio controlado também pode criar o alvo proibido', () => {
  const valores = [0.1, 0, 0.5, 0.5];
  const alvo = Regras.criarAlvo(() => valores.shift(), 1, 0, 0);
  assert.equal(alvo.proibido, true);
  assert.equal(alvo.palavra, 'FORBIDDEN');
});

test('alvos aparecem mais rápido e duram menos conforme o tempo passa', () => {
  assert.equal(Regras.intervaloSpawn(0), 900);
  assert.equal(Regras.intervaloSpawn(20000), 580);
  assert.ok(Regras.tempoAlvo(20000) < Regras.tempoAlvo(0));
});

test('partida só termina ao chegar a 30 segundos e não muda depois', () => {
  const estado = Regras.novaPartida();
  assert.equal(Regras.terminar(estado, Regras.DURACAO_MS - 1), estado);
  const fim = Regras.terminar(estado, Regras.DURACAO_MS);
  assert.equal(fim.terminou, true);
  assert.equal(Regras.acertar(fim, bom), fim);
  assert.equal(Regras.terminar(fim, Regras.DURACAO_MS + 10), fim);
});
