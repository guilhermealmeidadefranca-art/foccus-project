/* Regras puras do Foccus. O sorteio é sempre recebido como argumento. */
(function (raiz, fabrica) {
  const api = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.Regras = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const DURACAO_MS = 30000;
  const ALVOS = [
    { palavra: 'BOOK', emoji: '📚' }, { palavra: 'APPLE', emoji: '🍎' },
    { palavra: 'SUN', emoji: '🌞' }, { palavra: 'CAT', emoji: '🐱' },
    { palavra: 'MUSIC', emoji: '🎵' }, { palavra: 'STAR', emoji: '⭐' },
    { palavra: 'WATER', emoji: '💧' }, { palavra: 'FLOWER', emoji: '🌼' },
    { palavra: 'HOUSE', emoji: '🏠' }, { palavra: 'HAPPY', emoji: '😊' }
  ];

  function novaPartida() {
    return { pontos: 0, combo: 0, acertos: 0, erros: 0, terminou: false };
  }

  function intervaloSpawn(tempoDecorrido) {
    return Math.max(420, 900 - Math.floor(Math.max(0, tempoDecorrido) / 10000) * 160);
  }

  function tempoAlvo(tempoDecorrido) {
    return Math.max(550, 1250 - Math.max(0, tempoDecorrido) * 0.018);
  }

  function criarAlvo(sorteio, id, agora, tempoDecorrido) {
    const aleatorio = typeof sorteio === 'function' ? sorteio : Math.random;
    const proibido = aleatorio() < 0.22;
    const indice = Math.min(ALVOS.length - 1, Math.floor(aleatorio() * ALVOS.length));
    return {
      id,
      palavra: proibido ? 'FORBIDDEN' : ALVOS[indice].palavra,
      emoji: proibido ? '🚫' : ALVOS[indice].emoji,
      proibido,
      x: aleatorio(),
      y: aleatorio(),
      criadoEm: agora,
      expiraEm: agora + tempoAlvo(tempoDecorrido)
    };
  }

  function acertar(estado, alvo) {
    if (estado.terminou || !alvo) return estado;
    if (alvo.proibido) {
      return Object.assign({}, estado, {
        pontos: Math.max(0, estado.pontos - 15), combo: 0, erros: estado.erros + 1
      });
    }
    const combo = estado.combo + 1;
    const valor = combo >= 5 ? 20 : 10;
    return Object.assign({}, estado, {
      pontos: estado.pontos + valor, combo, acertos: estado.acertos + 1
    });
  }

  function terminar(estado, tempoDecorrido) {
    if (estado.terminou || tempoDecorrido < DURACAO_MS) return estado;
    return Object.assign({}, estado, { terminou: true });
  }

  return { DURACAO_MS, ALVOS, novaPartida, intervaloSpawn, tempoAlvo, criarAlvo, acertar, terminar };
});
