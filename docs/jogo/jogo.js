(async function () {
  'use strict';

  const config = window.JOGO_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  document.title = config.nome || 'Foccus';
  $('titulo').textContent = config.nome || 'Foccus';
  if (config.cor) {
    document.documentElement.style.setProperty('--cor', config.cor);
    document.querySelector('meta[name="theme-color"]').setAttribute('content', config.cor);
  }

  PlacarUI.montar($('painel-placar'));
  const progresso = await Placar.iniciar();
  $('melhor').textContent = progresso.melhor;
  Placar.aoMudar((p) => { $('melhor').textContent = p.melhor; });

  let estado;
  let inicio = 0;
  let proximoId = 0;
  let timerRelogio;
  let timerSpawn;
  let timerFim;

  function mostrar(tela) {
    ['tela-inicio', 'tela-jogo', 'tela-fim'].forEach((id) => { $(id).hidden = id !== tela; });
  }

  function tempoAtual() { return Math.min(Regras.DURACAO_MS, performance.now() - inicio); }

  function atualizarPainel() {
    const restante = Math.max(0, Regras.DURACAO_MS - tempoAtual());
    $('tempo').textContent = (restante / 1000).toFixed(1);
    $('tempo').classList.toggle('urgente', restante <= 10000);
    $('pontos').textContent = estado.pontos;
    $('combo').textContent = estado.combo >= 5 ? (estado.combo % 5 || 5) : estado.combo;
    if (restante <= 0) encerrar();
  }

  function removerAlvo(alvo, errou) {
    const elemento = $('alvo-' + alvo.id);
    if (!elemento) return;
    if (elemento) elemento.remove();
    if (errou && estado.combo) {
      estado = Object.assign({}, estado, { combo: 0 });
      $('mensagem').textContent = 'Quase! O combo zerou.';
      atualizarPainel();
    }
  }

  function criarBotao(alvo) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.id = 'alvo-' + alvo.id;
    botao.className = alvo.proibido ? 'alvo alvo-proibido' : 'alvo';
    botao.setAttribute('aria-label', alvo.proibido ? 'Alvo proibido' : 'Alvo ' + alvo.palavra);
    const emoji = document.createElement('span');
    emoji.className = 'alvo-emoji';
    emoji.textContent = alvo.emoji;
    const palavra = document.createElement('span');
    palavra.className = 'alvo-palavra';
    palavra.textContent = alvo.palavra;
    botao.append(emoji, palavra);
    const area = $('arena');
    const margemX = 42 / Math.max(1, area.clientWidth);
    const margemY = 42 / Math.max(1, area.clientHeight);
    botao.style.left = (margemX + alvo.x * (1 - 2 * margemX)) * 100 + '%';
    botao.style.top = (margemY + alvo.y * (1 - 2 * margemY)) * 100 + '%';
    botao.addEventListener('pointerdown', (evento) => {
      evento.preventDefault();
      if (estado.terminou || tempoAtual() >= Regras.DURACAO_MS || !botao.isConnected) return;
      estado = Regras.acertar(estado, alvo);
      removerAlvo(alvo, false);
      $('mensagem').textContent = alvo.proibido ? 'Ops! −15 pontos.' : (estado.combo >= 5 ? 'Combo x2! ' : 'Nice! ') + alvo.palavra + '!';
      atualizarPainel();
    });
    $('arena').appendChild(botao);
    const duracao = Math.max(0, alvo.expiraEm - performance.now());
    window.setTimeout(() => removerAlvo(alvo, true), duracao);
  }

  function agendarAlvo() {
    if (estado.terminou) return;
    const decorrido = tempoAtual();
    if (decorrido >= Regras.DURACAO_MS) return encerrar();
    const alvo = Regras.criarAlvo(Math.random, ++proximoId, performance.now(), decorrido);
    criarBotao(alvo);
    timerSpawn = window.setTimeout(agendarAlvo, Regras.intervaloSpawn(decorrido));
  }

  function comecar() {
    window.clearInterval(timerRelogio);
    window.clearTimeout(timerSpawn);
    window.clearTimeout(timerFim);
    estado = Regras.novaPartida();
    inicio = performance.now();
    proximoId = 0;
    $('arena').replaceChildren();
    $('mensagem').textContent = 'Toque nos alvos bons!';
    mostrar('tela-jogo');
    atualizarPainel();
    agendarAlvo();
    timerRelogio = window.setInterval(atualizarPainel, 100);
    timerFim = window.setTimeout(encerrar, Regras.DURACAO_MS);
  }

  async function encerrar() {
    if (!estado || estado.terminou) return;
    estado = Regras.terminar(estado, Regras.DURACAO_MS);
    window.clearInterval(timerRelogio);
    window.clearTimeout(timerSpawn);
    window.clearTimeout(timerFim);
    $('arena').replaceChildren();
    $('resultado').textContent = estado.pontos;
    $('situacao-salvamento').textContent = 'Salvando...';
    mostrar('tela-fim');
    try {
      const salvo = await Placar.registrarPartida(estado.pontos, { acertos: estado.acertos, erros: estado.erros });
      $('situacao-salvamento').textContent = Placar.modo() === 'nuvem' && !salvo.salvoNaNuvem
        ? 'Pontuação guardada neste aparelho. Entre com apelido e PIN para enviar ao ranking.'
        : 'Pontuação registrada!';
    } catch (erro) {
      $('situacao-salvamento').textContent = 'Não deu para salvar: ' + erro.message;
    }
  }

  $('botao-jogar').addEventListener('click', comecar);
  $('botao-de-novo').addEventListener('click', comecar);
  mostrar('tela-inicio');
})();
