'use strict';

const panels = [...document.querySelectorAll('.panel')];
const tabs = [...document.querySelectorAll('.tab')];
const effectsButton = document.querySelector('#effects');
const paletteButton = document.querySelector('#palette');
const screen = document.querySelector('#screen');
const output = document.querySelector('#console-output');
const command = document.querySelector('#command');
const toggle = document.querySelector('#console-toggle');
const dialog = document.querySelector('#project-dialog');
const requestedSection = new URLSearchParams(location.search).get('section') || 'perfil';
const lockedSection = panels.some(p => p.id === requestedSection) ? requestedSection : 'perfil';
document.body.classList.add('isolated');
const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* Preferences are optional. */ } }
};

function navigate() {
  const selected = lockedSection;
  panels.forEach(panel => { panel.hidden = panel.id !== selected; panel.classList.toggle('active', panel.id === selected); });
  tabs.forEach(tab => {
    const active = tab.hash === '#' + selected;
    tab.classList.toggle('active', active);
    if (active) tab.setAttribute('aria-current', 'page'); else tab.removeAttribute('aria-current');
  });
}
window.addEventListener('hashchange', navigate);
window.addEventListener('popstate', navigate);
navigate();
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || !panels.some(panel => '#' + panel.id === link.hash)) return;
  event.preventDefault();
  history.pushState(null, '', link.hash);
  navigate();
  window.scrollTo({ top: 0, behavior: 'instant' });
});
tabs.forEach((tab, index) => tab.addEventListener('keydown', e => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  e.preventDefault();
  const next = tabs[(index + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
  next.focus();
  history.pushState(null, '', next.hash);
  navigate();
}));

function setEffects(on) {
  screen.classList.toggle('effects-off', !on);
  effectsButton.setAttribute('aria-pressed', String(on));
  effectsButton.querySelector('span').textContent = on ? 'ON' : 'OFF';
  storage.set('mojave-effects', String(on));
  window.MojaveCRT?.setEnabled(on);
  if (window.parent !== window) window.parent.postMessage({ type: 'mojave-crt', enabled: on }, '*');
}
const crtParameter = new URLSearchParams(location.search).get('crt');
setEffects(crtParameter === null ? storage.get('mojave-effects') !== 'false' : crtParameter === '1');
effectsButton.addEventListener('click', () => setEffects(effectsButton.getAttribute('aria-pressed') !== 'true'));
function setPalette(green) {
  document.body.classList.toggle('green', green);
  paletteButton.setAttribute('aria-label', green ? 'Cor verde. Alternar para âmbar' : 'Cor âmbar. Alternar para verde');
  storage.set('mojave-green', String(green));
}
setPalette(storage.get('mojave-green') === 'true');
paletteButton.addEventListener('click', () => setPalette(!document.body.classList.contains('green')));
document.querySelector('#year').textContent = String(new Date().getFullYear());

const projects = {
  gideon: {
    name: 'Gideon the Bard',
    description: 'Bot para acompanhar mesas de RPG no Discord, com música, soundboard e sistemas de jogo.',
    features: ['Música, playlists e efeitos sonoros com controles interativos.', 'Rolagem de dados, perfis e economia independentes por servidor.', 'Cartas colecionáveis com inventário, trocas e progressão.', 'Persistência com MongoDB e Mongoose.'],
    tech: 'JavaScript / Node.js / Discord.js / MongoDB',
    url: 'https://github.com/Exxxtriker/Better-Soundpad-for-Bot-Discord'
  },
  haruka: {
    name: 'Haruka Bot',
    description: 'Bot de administração e entretenimento para comunidades no Discord.',
    features: ['Comandos de moderação e gerenciamento de mensagens.', 'Minigames e interação com a comunidade.', 'Consultas e integração com Minecraft.', 'Reprodução de efeitos sonoros em canais de voz.'],
    tech: 'JavaScript / Node.js / Discord.js / Express / SQLite',
    url: 'https://github.com/Exxxtriker/Haruka-bot'
  }
};
document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => {
  const p = projects[button.dataset.project];
  const container = document.querySelector('#dialog-content');
  container.replaceChildren();
  const heading = document.createElement('h2'); heading.id = 'dialog-title'; heading.textContent = p.name;
  const description = document.createElement('p'); description.textContent = p.description;
  const list = document.createElement('ul');
  p.features.forEach(feature => { const li = document.createElement('li'); li.textContent = feature; list.append(li); });
  const tech = document.createElement('p'); tech.className = 'eyebrow'; tech.textContent = p.tech;
  const link = document.createElement('a'); link.className = 'button primary'; link.href = p.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'VER CÓDIGO NO GITHUB ↗';
  container.append(heading, description, list, tech, link);
  dialog.showModal();
}));
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});

function expandConsole(expanded) {
  output.hidden = !expanded;
  toggle.setAttribute('aria-expanded', String(expanded));
  toggle.textContent = expanded ? '−' : '+';
}
function print(text, echo = false) {
  const line = document.createElement('p');
  line.textContent = text;
  if (echo) line.className = 'command-echo';
  output.append(line);
  while (output.children.length > 70) output.firstElementChild.remove();
  output.scrollTop = output.scrollHeight;
}
toggle.addEventListener('click', () => {
  expandConsole(output.hidden);
  if (!output.children.length) print('Terminal pronto. Digite help para ver os comandos.');
});
const commandHistory = [];
let historyIndex = 0;
document.querySelector('#terminal-form').addEventListener('submit', event => {
  event.preventDefault();
  const input = command.value.trim();
  if (!input) { command.focus(); return; }
  commandHistory.push(input); historyIndex = commandHistory.length;
  command.value = '';
  expandConsole(true);
  print('visitante@mojave:~$ ' + input, true);
  const value = input.toLowerCase();
  const routes = { perfil: 'perfil', about: 'perfil', projetos: 'projetos', projects: 'projetos', habilidades: 'habilidades', skills: 'habilidades', contato: 'contato', contact: 'contato' };
  if (routes[value]) { history.pushState(null, '', '#' + routes[value]); navigate(); print('Abrindo arquivo: ' + routes[value] + '…'); }
  else if (value === 'help' || value === 'ajuda') print('perfil       apresentação\nprojetos     repositórios atuais\nhabilidades tecnologias\ncontato      redes e canais\ncor          alternar âmbar / verde\ncrt          alternar efeito de tela\nwhoami       identificação\nclear        limpar terminal');
  else if (value === 'clear' || value === 'limpar') output.replaceChildren();
  else if (value === 'cor' || value === 'color') { setPalette(!document.body.classList.contains('green')); print('Paleta atualizada.'); }
  else if (value === 'crt') { setEffects(effectsButton.getAttribute('aria-pressed') !== 'true'); print('Efeito de tela atualizado.'); }
  else if (value === 'whoami') print('Visitante do portfólio de Leonardo Carvalho. Bem-vindo ao Mojave.');
  else if (value === 'war never changes') print('War. War never changes. O código, por outro lado, sempre pode melhorar.');
  else print('Comando não encontrado. Digite help para ver as opções.');
  command.focus();
});
command.addEventListener('keydown', event => {
  if (event.key === 'ArrowUp') { event.preventDefault(); historyIndex = Math.max(0, historyIndex - 1); command.value = commandHistory[historyIndex] || ''; }
  if (event.key === 'ArrowDown') { event.preventDefault(); historyIndex = Math.min(commandHistory.length, historyIndex + 1); command.value = commandHistory[historyIndex] || ''; }
});

// Each room object owns one page. Other sections and cross-links do not exist in this view.
panels.filter(panel => panel.id !== lockedSection).forEach(panel => panel.remove());
document.querySelector('.tabs')?.remove();
document.querySelector('.console')?.remove();
document.querySelectorAll('a[href^="#"]').forEach(link => {
  if (link.hash === '#main' || link.hash === '#' + lockedSection) return;
  if (link.classList.contains('brand')) { link.removeAttribute('href'); link.removeAttribute('aria-label'); return; }
  link.remove();
});
const sectionLabels = { perfil: 'REGISTRO PESSOAL / PERFIL', projetos: 'ARQUIVO LOCAL / PROJETOS', habilidades: 'VIT-O-MATIC / HABILIDADES', contato: 'RADIO LINK / CONTATO' };
document.querySelector('.screen-top > span:last-child').textContent = sectionLabels[lockedSection];
document.title = 'Leonardo Carvalho | ' + sectionLabels[lockedSection];
