'use strict';
(() => {
  if (new URLSearchParams(location.search).get('section') !== 'habilidades') return;
  const buttons = [...document.querySelectorAll('.vit-tabs [role="tab"]')];
  const section = document.getElementById('habilidades');
  section.removeAttribute('aria-labelledby');
  section.setAttribute('aria-label', 'Vit-o-matic: registro do desenvolvedor');
  function select(button) {
    buttons.forEach(tab => {
      const selected = tab === button;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
    });
  }
  buttons.forEach((button,index) => {
    button.addEventListener('click', () => select(button));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? buttons[0] : event.key === 'End' ? buttons.at(-1) : buttons[(index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length];
      select(next); next.focus();
    });
  });
  document.querySelector('.screen-top > span:last-child').textContent = 'VIT-O-MATIC / REGISTRO DO DEV';
  document.title = 'Leonardo Carvalho | Vit-o-matic';
})();
