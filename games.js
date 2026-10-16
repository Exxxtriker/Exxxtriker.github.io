(() => {
  'use strict';
  if ((new URLSearchParams(location.search).get('section') || 'perfil') !== 'perfil') return;
  const profile = document.getElementById('perfil');
  if (!profile) return;
  document.body.classList.add('computer-mode');
  document.querySelector('.screen-top > span:last-child').textContent = 'ARQUIVO 01 / PERSONAL TERMINAL';
  document.title = 'Leonardo Carvalho | Personal Terminal';
  profile.innerHTML = `<div class="computer-heading"><div><p class="eyebrow">LEONARDO CARVALHO / FULL STACK</p><h1>PERSONAL TERMINAL<span class="cursor">_</span></h1></div><a href="https://github.com/Exxxtriker" target="_blank" rel="noopener noreferrer">GITHUB ↗</a></div><section class="game-console" aria-label="Terminal de comandos e easter eggs"><div class="game-console-bar"><span>ROBCO ENTERTAINMENT MODULE / 38</span><span class="game-console-lamps"><i></i><i></i><i></i><span class="desktop-only"> LOCAL SESSION</span></span></div><div class="game-log" id="game-log" role="log" aria-live="polite" aria-relevant="additions"></div><form class="game-prompt" id="game-form" autocomplete="off"><label for="game-input">courier@mojave:~$</label><input id="game-input" name="command" maxlength="140" placeholder="Digite help…" spellcheck="false" autocapitalize="off" aria-label="Comando do computador"><button type="submit">EXECUTAR ↵</button></form></section><div class="game-shortcuts" aria-label="Atalhos de comandos"><button data-command="help">HELP</button><button data-command="undertale">♥ UNDERTALE</button><button data-command="helldivers">↑ HELLDIVERS</button><button data-command="minecraft">▧ MINECRAFT</button><button data-command="steam">◉ STEAM</button><button data-command="achievements">CONQUISTAS</button></div><div class="game-bottom"><span>TAB COMPLETA · ↑↓ HISTÓRICO · ESC SAI DO MINIJOGO</span><span id="achievement-count"></span></div>`;

  const log = document.getElementById('game-log');
  const input = document.getElementById('game-input');
  const commandHistory = [];
  let historyIndex = 0, active = null, audio = null, toastTimer;
  const achievementNames = {
    undertale: 'Uma saída pacífica', helldivers: 'Democracia entregue', minecraft: 'Que haja luz', steam: 'Bibliotecário do Mojave',
    hack: 'Acesso concedido', portal: 'Ciência questionável', konami: 'Memória muscular', sandwich: 'Privilégios de cozinha'
  };
  function load(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
  function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* The games still work without storage. */ } }
  const storedAchievements = load('mojave-achievements-v1', []);
  const found = new Set((Array.isArray(storedAchievements) ? storedAchievements : []).filter(id => Object.hasOwn(achievementNames,id)));
  const storedInventory = load('mojave-inventory-v1', {});
  const inventory = Object.fromEntries(['wood','planks','sticks','table','pickaxe','stone','coal','torches'].map(key => [key, Number.isInteger(storedInventory?.[key]) ? Math.max(0, Math.min(storedInventory[key], 999)) : 0]));
  const items = { wood: ['▤','Tronco'], planks: ['▥','Tábuas'], sticks: ['/','Gravetos'], table: ['▦','Bancada'], pickaxe: ['⛏','Picareta'], stone: ['▧','Pedregulho'], coal: ['◆','Carvão'], torches: ['♜','Tochas'] };

  function node(tag, className, text) { const el = document.createElement(tag); if (className) el.className = className; if (text !== undefined) el.textContent = text; return el; }
  function bottom() { requestAnimationFrame(() => {
    if (active?.type === 'steam' && active.root.offsetHeight > log.clientHeight - 20) {
      log.scrollTop += active.root.getBoundingClientRect().top - log.getBoundingClientRect().top - 12;
    } else log.scrollTop = log.scrollHeight;
  }); }
  function print(text, style = '') { const p = node('p', 'log-line ' + style, text); log.append(p); trim(); bottom(); return p; }
  function trim() { while (log.children.length > 100) { if (active?.root === log.firstElementChild) stopGame(); log.firstElementChild.remove(); } }
  function updateCount() { document.getElementById('achievement-count').textContent = 'SEGREDOS: ' + found.size + ' / ' + Object.keys(achievementNames).length; }
  function unlock(id) {
    if (found.has(id)) return;
    found.add(id); save('mojave-achievements-v1', [...found]); updateCount();
    document.querySelector('.game-toast')?.remove();
    const toast = node('div', 'game-toast'); toast.setAttribute('role','status'); toast.append(node('small','', 'CONQUISTA DESBLOQUEADA'), node('span','', '✦ ' + achievementNames[id])); document.body.append(toast);
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.remove(), 3600); beep(660);
  }
  function stopGame(message) {
    if (!active) return;
    active.cleanup?.(); active.root.classList.add('inactive'); active.root.querySelectorAll('button').forEach(b => { b.disabled = true; });
    if (message) active.status.textContent = message;
    active = null;
  }
  function card(title, type, style = '') {
    stopGame();
    const root = node('article', 'game-card ' + style), head = node('div','game-card-head'); head.append(node('h2','',title),node('span','','SIMULAÇÃO / ' + type.toUpperCase())); root.append(head);
    const status = node('p','',''); status.setAttribute('role','status'); root.append(status); log.append(root); trim();
    active = { type, root, status, cleanup: null }; bottom(); return active;
  }
  function button(parent, label, action, description) { const b = node('button','',label); b.type = 'button'; if (description) b.setAttribute('aria-label', description); b.addEventListener('click', action); parent.append(b); return b; }
  function actions(root) { const div = node('div','game-actions'); root.append(div); return div; }
  function beep(freq = 330) {
    if (!audio) return;
    const oscillator = audio.createOscillator(), gain = audio.createGain(); oscillator.type = 'triangle'; oscillator.frequency.value = freq;
    gain.gain.setValueAtTime(.025, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + .09);
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + .1);
  }

  function undertale() {
    const game = card('Um encontro inesperado', 'undertale', 'undertale-card');
    let mercy = 0, hp = 20, finished = false;
    const scene = node('div','ut-scene'); const skeleton = node('img','ut-skeleton');
    skeleton.src = 'assets/sans-sprite.svg'; skeleton.alt = 'Esqueleto sorridente de jaqueta azul e pantufas rosas'; skeleton.width = 120; skeleton.height = 156;
    scene.append(skeleton, node('p','','Um esqueleto bloqueia o prompt.\nEle parece estar esperando uma piada.')); game.root.insertBefore(scene,game.status);
    const stats = node('div','ut-stats'), meter = node('div','ut-mercy'), fill = node('span'); meter.append(fill); game.root.append(stats,meter);
    const controls = actions(game.root);
    function update(text) { stats.replaceChildren(node('span','ut-heart','♥'),node('span','','HP ' + hp + '/20  ·  MERCY ' + mercy + '%')); fill.style.width = mercy + '%'; game.status.textContent = text; bottom(); }
    function act(choice) {
      if (finished || active !== game) return;
      beep(choice === 'mercy' ? 520 : 260);
      if (choice === 'act') { mercy = Math.min(100,mercy + 50); update(mercy === 50 ? 'Você conta uma piada sobre callbacks. Ele ri antes de você terminar.' : 'Vocês concordam que todo mundo merece uma segunda execução.'); }
      if (choice === 'item') { hp = 20; mercy = Math.min(100,mercy + 25); update('Você divide um biscoito de canela. HP restaurado.'); }
      if (choice === 'fight') { hp = Math.max(1,hp - 4); update('Seu ataque erra o cursor. Talvez exista outra solução.'); }
      if (choice === 'mercy') {
        if (mercy < 100) { update('Ele ainda tem uma piada para contar. Tente ACT mais uma vez.'); return; }
        finished = true; update('Você poupa o esqueleto. O prompt fica livre.\nO terminal parece cheio de determinação.'); unlock('undertale'); controls.querySelectorAll('button').forEach(b => { b.disabled = true; });
      }
    }
    for (const [id,label] of [['fight','⚔ FIGHT'],['act','✦ ACT'],['item','▣ ITEM'],['mercy','♥ MERCY']]) button(controls,label,() => act(id));
    game.action = act; update('Você pode escolher como este encontro termina.');
  }

  function helldivers() {
    const game = card('Stratagem training', 'helldivers', 'helldivers-card');
    const rounds = [{ name:'REINFORCE', code:['↑','↓','→','←','↑'] },{ name:'RESUPPLY', code:['↓','↓','↑','→'] },{ name:'ORBITAL PRECISION STRIKE', code:['→','→','↑'] }];
    let round = 0, progress = 0, deadline = performance.now() + 20000, finished = false, errorTimer;
    const name = node('p',''), code = node('div','stratagem-code'), bottomRow = node('div','stratagem-bottom'), pad = node('div','stratagem-pad'), timer = node('span','stratagem-clock'); timer.setAttribute('aria-hidden','true');
    game.root.append(name,code,bottomRow); bottomRow.append(pad,timer);
    function render() { name.textContent = 'RONDA ' + (round + 1) + '/3 · ' + rounds[round].name; code.replaceChildren(...rounds[round].code.map((arrow,i) => node('span',i < progress ? 'correct' : '',arrow))); }
    function finish(success) {
      finished = true; clearInterval(interval); clearTimeout(errorTimer); pad.querySelectorAll('button').forEach(b => { b.disabled = true; });
      game.status.textContent = success ? 'Três transmissões confirmadas. Democracia entregue.' : 'A janela de transmissão fechou. Digite helldivers para tentar novamente.';
      if (success) unlock('helldivers');
    }
    function press(arrow) {
      if (finished || active !== game) return;
      beep(arrow === rounds[round].code[progress] ? 440 : 160);
      if (arrow !== rounds[round].code[progress]) { progress = 0; code.classList.add('error'); clearTimeout(errorTimer); errorTimer = setTimeout(() => code.classList.remove('error'),220); game.status.textContent = 'Código reiniciado. A transmissão ainda está aberta.'; render(); return; }
      progress++;
      if (progress === rounds[round].code.length) {
        if (round === rounds.length - 1) { render(); finish(true); return; }
        round++; progress = 0; deadline = performance.now() + 20000; game.status.textContent = 'Estratagema recebido. Próxima transmissão.';
      }
      render();
    }
    for (const arrow of ['↑','←','↓','→']) button(pad,arrow,() => press(arrow), 'Enviar seta ' + arrow);
    const interval = setInterval(() => { const remaining = Math.max(0,(deadline - performance.now()) / 1000); timer.textContent = remaining.toFixed(1) + 's'; if (remaining <= 0) finish(false); },100);
    game.cleanup = () => { clearInterval(interval); clearTimeout(errorTimer); }; game.arrow = press;
    game.status.textContent = 'Repita as setas com o teclado ou os botões. 20 segundos por ronda.'; render(); timer.textContent = '20.0s'; bottom();
  }

  function minecraft() {
    const game = card('Um mundo em blocos', 'minecraft', 'minecraft-card');
    const slots = node('div','mc-inventory'), goal = node('p','mc-progress'); game.root.append(slots,goal);
    const mining = actions(game.root), crafting = actions(game.root);
    function refresh(text) {
      slots.replaceChildren(...Object.keys(inventory).map(key => { const slot = node('div','mc-slot' + (inventory[key] ? '' : ' empty')); slot.append(node('b','',items[key][0]),node('span','',items[key][1]),node('i','',String(inventory[key]))); return slot; }));
      goal.textContent = 'OBJETIVO: faça uma bancada, uma picareta e suas primeiras tochas.';
      if (inventory.torches) goal.textContent = 'OBJETIVO CONCLUÍDO · Agora o Mojave tem iluminação de emergência.';
      game.status.textContent = text; save('mojave-inventory-v1',inventory); bottom();
    }
    function mine(item) {
      if (active !== game) return;
      const aliases = { madeira:'wood', tronco:'wood', pedra:'stone', carvao:'coal', carvão:'coal' }; item = aliases[item] || item;
      if (!['wood','stone','coal'].includes(item)) { refresh('Você pode minerar wood, stone ou coal.'); return; }
      if (item !== 'wood' && !inventory.pickaxe) { refresh('Você precisa de uma picareta. Comece pela madeira.'); return; }
      inventory[item] = Math.min(999,inventory[item] + 1); beep(item === 'wood' ? 230 : 150); refresh('+1 ' + items[item][1] + '.');
    }
    function craft(recipe) {
      if (active !== game) return;
      const aliases = { tabuas:'planks', tábuas:'planks', gravetos:'sticks', bancada:'table', picareta:'pickaxe', tocha:'torch', tochas:'torch' }; recipe = aliases[recipe] || recipe;
      const recipes = { planks:{ cost:{wood:1}, result:'planks', amount:4 }, sticks:{cost:{planks:2},result:'sticks',amount:4},table:{cost:{planks:4},result:'table',amount:1},pickaxe:{cost:{planks:3,sticks:2},result:'pickaxe',amount:1,table:true},torch:{cost:{coal:1,sticks:1},result:'torches',amount:4} };
      const r = recipes[recipe];
      if (!r) { refresh('Receitas: planks, sticks, table, pickaxe e torch.'); return; }
      if (r.table && !inventory.table) { refresh('Essa receita precisa de uma bancada: craft table.'); return; }
      if (Object.entries(r.cost).some(([key,amount]) => inventory[key] < amount)) { refresh('Faltam recursos. Receita: ' + Object.entries(r.cost).map(([key,n]) => n + ' ' + items[key][1]).join(' + ') + '.'); return; }
      for (const [key,n] of Object.entries(r.cost)) inventory[key] -= n;
      inventory[r.result] = Math.min(999,inventory[r.result] + r.amount); beep(500); refresh('Crafting concluído: +' + r.amount + ' ' + items[r.result][1] + '.'); if (inventory.torches) unlock('minecraft');
    }
    for (const [id,label] of [['wood','MINERAR MADEIRA'],['stone','MINERAR PEDRA'],['coal','MINERAR CARVÃO']]) button(mining,label,() => mine(id));
    for (const [id,label] of [['planks','TÁBUAS'],['sticks','GRAVETOS'],['table','BANCADA'],['pickaxe','PICARETA'],['torch','TOCHAS']]) button(crafting,label,() => craft(id));
    game.mine = mine; game.craft = craft; refresh('Colete madeira e transforme os recursos. Também funciona com mine e craft no prompt.');
  }

  function steam() {
    const game = card('Steam · Biblioteca', 'steam', 'steam-card');
    const games = [
      { cmd:'undertale', title:'UNDERTALE', genre:'RPG · ESCOLHAS', subtitle:'Você está cheio de determinação.', description:'Um encontro no prompt. Conte uma piada, compartilhe um biscoito e descubra uma saída pacífica.', icon:'♥', art:'undertale', achievement:'undertale' },
      { cmd:'helldivers', title:'HELLDIVERS', genre:'AÇÃO · ESTRATAGEMAS', subtitle:'Pela democracia gerenciada.', description:'Memorize as sequências e envie seus estratagemas antes que o tempo acabe.', icon:'↑', art:'helldivers', achievement:'helldivers' },
      { cmd:'minecraft', title:'MINECRAFT', genre:'SANDBOX · CRAFTING', subtitle:'Só mais um bloco.', description:'Colete madeira, monte sua bancada e transforme recursos em ferramentas. Seu inventário fica salvo aqui.', icon:'▧', art:'minecraft', achievement:'minecraft' },
      { cmd:'hack', title:'FALLOUT', genre:'MOJAVE · HACKING', subtitle:'A guerra nunca muda.', description:'Recupere o acesso a um terminal RobCo. Quatro tentativas, cinco letras e uma senha escondida.', icon:'⚙', art:'fallout', achievement:'hack' }
    ];
    const client = node('div','steam-client'), chrome = node('div','steam-chrome');
    const brand = node('div','steam-brand'), logo = node('img'); logo.src='assets/steam-mark.svg'; logo.alt='Steam'; logo.width=29; logo.height=29;
    brand.append(logo,node('span','','STEAM')); chrome.append(brand,node('span','steam-window-label','MOJAVE / LOCAL CLIENT'),node('span','steam-window-controls','−  □  ×'));
    const nav = node('div','steam-nav'); nav.append(node('span','','LOJA'),node('strong','','BIBLIOTECA'),node('span','','COMUNIDADE'),node('span','steam-user','EXXXTRIKER ▾'));
    const layout = node('div','steam-layout'), sidebar = node('aside','steam-sidebar'); sidebar.setAttribute('aria-label','Jogos da biblioteca');
    sidebar.append(node('div','steam-home','⌂  INÍCIO'),node('div','steam-collection','TODOS OS JOGOS (4)'));
    const detail = node('section','steam-detail'); detail.setAttribute('aria-label','Jogo selecionado');
    const selections = [];
    function select(item) {
      if (active !== game) return;
      selections.forEach(({entry,data}) => { const selected=data===item; entry.classList.toggle('selected',selected); entry.setAttribute('aria-pressed',String(selected)); });
      detail.replaceChildren();
      const hero = node('div','steam-hero steam-hero-'+item.art), art = node('img','steam-hero-art'); art.src='assets/library-'+item.art+'.svg'; art.alt='';
      hero.append(art,node('div','steam-hero-shade'),node('span','steam-hero-kicker',item.genre),node('h3','steam-game-title',item.title),node('span','steam-hero-subtitle',item.subtitle));
      const launch = node('div','steam-launch'); const play = button(launch,'▶  JOGAR',() => { if(active===game) run(item.cmd); }); play.className='steam-play';
      const ready = node('div','steam-ready'); ready.append(node('b','','PRONTO PARA JOGAR'),node('span','','Minijogo local · sem instalação')); launch.append(ready);
      const info = node('div','steam-game-info'); info.append(node('h4','','SOBRE ESTA EXPERIÊNCIA'),node('p','',item.description));
      const achievement = node('div','steam-game-achievement'); achievement.append(node('span','steam-trophy','✦'),node('span','',found.has(item.achievement) ? 'CONQUISTA DESBLOQUEADA' : 'UMA CONQUISTA PARA DESCOBRIR'));
      info.append(achievement); detail.append(hero,launch,info);
    }
    for (const item of games) {
      const entry = button(sidebar,'',() => select(item)); entry.className='steam-game-select';
      entry.append(node('span','steam-game-icon steam-icon-'+item.art,item.icon),node('span','',item.title)); selections.push({entry,data:item});
    }
    layout.append(sidebar,detail); const footer=node('div','steam-client-footer'); footer.append(node('span','','●  TODOS OS SISTEMAS ONLINE'),node('span','','FÃS & JOGOS  /  SESSÃO LOCAL'));
    client.append(chrome,nav,layout,footer); game.root.append(client); select(games[0]);
    unlock('steam'); bottom();
  }

  function hacking() {
    const game = card('RobCo password recovery', 'hack');
    const words = ['VAULT','FAULT','VALUE','VALES','SALUT']; let tries = 4, finished = false;
    game.root.append(node('pre','hack-art','0xF4A0  {!#)<>[];:|?}  MEMORY DUMP\n0xF4B0  [VAULT] {FAULT} <VALUE>\n0xF4C0  #!%&[VALES] ^(SALUT)'));
    const choices = node('div','hack-words'); game.root.append(choices);
    function guess(word) {
      if (finished || active !== game) return;
      word = word.toUpperCase();
      if (!words.includes(word)) { game.status.textContent = 'Escolha uma palavra da memória.'; return; }
      const likeness = [...word].filter((char,i) => char === 'VAULT'[i]).length;
      if (likeness === 5) { finished = true; game.status.textContent = 'ACCESS GRANTED. A senha estava bem guardada... num Vault.'; unlock('hack'); }
      else { tries--; game.status.textContent = word + ' · LIKENESS ' + likeness + '/5 · TENTATIVAS ' + tries; if (tries === 0) { finished = true; game.status.textContent += '\nTERMINAL LOCKED. Digite hack para reiniciar o simulador.'; } }
      if (finished) choices.querySelectorAll('button').forEach(b => { b.disabled = true; });
    }
    for (const word of words) button(choices,word,() => guess(word));
    game.guess = guess; game.status.textContent = '4 tentativas. Likeness conta letras na posição certa.'; bottom();
  }

  function achievements() {
    const game = card('Conquistas locais', 'achievements'); game.status.textContent = found.size + ' de ' + Object.keys(achievementNames).length + ' segredos descobertos neste navegador.';
    const list = node('div','achievement-list'); game.root.append(list);
    for (const [id,title] of Object.entries(achievementNames)) { const row = node('div','achievement-item' + (found.has(id) ? '' : ' locked')); row.append(node('span','',found.has(id) ? '✦' : '◇'),node('span','',found.has(id) ? title : '??? · ainda não encontrado')); list.append(row); }
    bottom();
  }
  const completions = ['help','whoami','ls','cat readme','undertale','helldivers','minecraft','steam','hack','achievements','inventory','mine wood','mine stone','mine coal','craft planks','craft sticks','craft table','craft pickaxe','craft torch','roll d20','coin','fortune','theme amber','theme green','sound on','sound off','clear','exit'];
  function run(raw) {
    const text = String(raw).trim().slice(0,140); if (!text) return;
    commandHistory.push(text); historyIndex = commandHistory.length; input.value = ''; print('courier@mojave:~$ ' + text,'log-echo');
    const value = text.toLowerCase(), [cmd,...args] = value.split(/\s+/);
    if (['help','ajuda','?'].includes(value)) print('ARQUIVOS\n  whoami / cat readme   apresentação\n  ls                   diretórios disponíveis\n\nEXPERIÊNCIAS\n  undertale            um encontro inesperado\n  helldivers           treino de estratagemas\n  minecraft            mineração e crafting\n  steam                biblioteca do terminal\n  hack                 quebra-cabeça RobCo\n  achievements         seus segredos encontrados\n\nUTILIDADES\n  roll d20 / coin      dados e cara ou coroa\n  fortune              uma mensagem do sistema\n  theme amber|green    paleta do terminal\n  crt                  estática ligada/desligada\n  sound on|off         sons sintetizados\n  exit                 encerrar minijogo\n  clear                limpar a tela\n\nTAB completa comandos. ↑↓ recuperam seu histórico.\nAlguns segredos não estão nesta lista.');
    else if (value === 'ls' || value === 'dir') print('readme.txt  /games/  /achievements/  .secrets\nDica: cat readme ou o nome de um jogo.');
    else if (['whoami','cat readme','cat readme.txt','about','perfil'].includes(value)) print('LEONARDO CARVALHO / EXXXTRIKER\nDesenvolvimento full stack. Interfaces, APIs e bancos de dados.\nEste computador tem alguns programas extras instalados.\nOs outros arquivos do portfólio ficam nos objetos da sala.');
    else if (['undertale','sans','papyrus'].includes(value)) undertale();
    else if (['helldivers','democracy','democracia','stratagem'].includes(value)) helldivers();
    else if (value === 'minecraft') minecraft();
    else if (value === 'steam') steam();
    else if (value === 'hack' || value === 'fallout') hacking();
    else if (['achievements','conquistas'].includes(value)) achievements();
    else if (['mine','craft','inventory','inventario'].includes(cmd)) {
      if (active?.type !== 'minecraft') minecraft();
      if (cmd === 'mine') active.mine(args[0] || 'wood');
      else if (cmd === 'craft') active.craft(args[0] || '');
    }
    else if (['act','fight','item','mercy','spare'].includes(cmd) && active?.type === 'undertale') active.action(cmd === 'spare' ? 'mercy' : cmd);
    else if (cmd === 'guess' && active?.type === 'hack') active.guess(args[0] || '');
    else if (value === 'exit' || value === 'sair') { stopGame('Sessão encerrada. O prompt está livre.'); print('Programa encerrado. Digite outro comando.'); }
    else if (value === 'clear' || value === 'limpar') { stopGame(); log.replaceChildren(); }
    else if (cmd === 'theme' || cmd === 'cor') {
      const color = args[0]; if (color && !['green','verde','amber','ambar','âmbar'].includes(color)) print('Paletas: theme amber ou theme green.');
      else { const green = color ? ['green','verde'].includes(color) : !document.body.classList.contains('green'); document.body.classList.toggle('green',green); try { localStorage.setItem('mojave-green',String(green)); } catch {} print('Paleta ' + (green ? 'verde' : 'âmbar') + ' selecionada.'); }
    }
    else if (value === 'crt') document.getElementById('effects').click();
    else if (cmd === 'sound' || cmd === 'som') {
      if (args[0] === 'off') { audio?.close(); audio = null; print('Som desligado.'); }
      else if (args[0] === 'on') { try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); beep(440); print('Som ligado. Volume suave, sem música.'); } catch { print('Áudio indisponível neste navegador.'); } }
      else print('Use sound on ou sound off.');
    }
    else if (cmd === 'roll' || cmd === 'dado') { const match = /^(?:1)?d(\d{1,4})$/.exec(args[0] || 'd20'); const faces = match ? Number(match[1]) : 0; print(faces >= 2 && faces <= 1000 ? '⚄ d' + faces + ' → ' + (1 + Math.floor(Math.random() * faces)) : 'Use roll d20, roll d6 ou outro dado entre d2 e d1000.','log-accent'); }
    else if (value === 'coin' || value === 'moeda') print(Math.random() < .5 ? '◉ CARA. O destino piscou primeiro.' : '◉ COROA. A moeda escolheu um lado.','log-accent');
    else if (value === 'fortune') { const messages = ['Você encontrou uma fogueira. Talvez seja hora de salvar.','Não cave direto para baixo. Vale para bugs também.','O boss final era uma variável sem nome.','Seu inventário está cheio. Deixe um TODO para depois.','Um mercador aparece. Ele só aceita commits pequenos.']; print(messages[Math.floor(Math.random() * messages.length)]); }
    else if (['portal','cake','the cake is a lie'].includes(value)) { const game = card('Teste de transferência', 'portal'); game.status.textContent = 'O portal azul leva ao laranja. O bolo continua fora do escopo.'; game.root.append(node('pre','portal-art','  ╭────╮          ╭────╮\n  │ ░░ │  ─────→  │ ▒▒ │\n  │ ░░ │          │ ▒▒ │\n  ╰────╯          ╰────╯')); unlock('portal'); bottom(); }
    else if (value === 'sudo make me a sandwich' || value === 'sudo sandwich') { print('Autorização concedida.\n  [ pão ]\n  [ queijo ]\n  [ pão ]\nSanduíche compilado sem erros.','log-success'); unlock('sandwich'); }
    else if (value === 'konami' || value === '↑↑↓↓←→←→ba') { print('↑ ↑ ↓ ↓ ← → ← → B A\n30 vidas para lidar com o próximo bug.','log-success'); unlock('konami'); }
    else if (value === 'war never changes') print('War. War never changes.\nO terminal ainda está aqui.');
    else if (value === 'iddqd') print('GOD MODE não altera o escopo do projeto. Mas boa tentativa.');
    else if (value === 'rm -rf /') print('O esqueleto do terminal guardou seus arquivos em um lugar seguro.');
    else if (['projetos','projects','skills','habilidades','contato','contact'].includes(value)) print('Esse arquivo tem seu próprio objeto na sala. Use VOLTAR À SALA para encontrá-lo.');
    else print('Comando não encontrado. Digite help — ou tente o nome de um jogo.','log-warning');
    input.focus({preventScroll:true}); bottom();
  }

  document.getElementById('game-form').addEventListener('submit',event => { event.preventDefault(); run(input.value); });
  document.querySelectorAll('[data-command]').forEach(b => b.addEventListener('click',() => run(b.dataset.command)));
  input.addEventListener('keydown',event => {
    if (active?.type === 'helldivers' && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)) return;
    if (event.key === 'ArrowUp') { event.preventDefault(); historyIndex = Math.max(0,historyIndex - 1); input.value = commandHistory[historyIndex] || ''; }
    if (event.key === 'ArrowDown') { event.preventDefault(); historyIndex = Math.min(commandHistory.length,historyIndex + 1); input.value = commandHistory[historyIndex] || ''; }
    if (event.key === 'Tab' && input.value.trim()) { const matches = completions.filter(c => c.startsWith(input.value.toLowerCase())); if (matches.length) { event.preventDefault(); if (matches.length === 1) input.value = matches[0]; else print(matches.join('  ')); } }
    if (event.ctrlKey && event.key.toLowerCase() === 'l') { event.preventDefault(); run('clear'); }
  });
  const konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']; let konamiIndex = 0;
  document.addEventListener('keydown',event => {
    if (event.key === 'Escape' && active) { event.preventDefault(); event.stopPropagation(); stopGame('Programa encerrado. O prompt está livre.'); input.focus({preventScroll:true}); return; }
    const arrows = {ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→'};
    if (active?.type === 'helldivers' && arrows[event.key]) { event.preventDefault(); event.stopPropagation(); active.arrow(arrows[event.key]); return; }
    if (document.activeElement !== input) { if (event.key === konami[konamiIndex]) { konamiIndex++; if (konamiIndex === konami.length) { konamiIndex = 0; run('konami'); } } else konamiIndex = 0; }
  },true);
  window.addEventListener('message',event => { if (event.source === window.parent && event.data?.type === 'mojave-pause') { stopGame('Sessão encerrada ao voltar à sala.'); audio?.suspend(); } });
  window.addEventListener('pagehide',() => { stopGame(); audio?.close(); });
  updateCount();
  print('ROBCO PERSONAL TERMINAL · ENTERTAINMENT MODULE LOADED','log-accent');
  print('Olá, visitante. Tem mais coisa neste computador do que parece.\nDigite help ou escolha um programa abaixo.');
  print('Dica do dia: nem todo encontro precisa terminar em uma luta.');
})();
