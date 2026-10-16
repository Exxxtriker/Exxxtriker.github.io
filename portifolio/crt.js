(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 100; canvas.className = 'crt-grain'; canvas.setAttribute('aria-hidden', 'true');
  const roll = document.createElement('div'); roll.className = 'crt-roll'; roll.setAttribute('aria-hidden', 'true');
  document.body.append(canvas, roll);
  const ctx = canvas.getContext('2d', { alpha: true });
  const pixels = ctx.createImageData(160, 100);
  let enabled = !reduced, burstTimer, lastFrame = 0;
  function setEnabled(value) { enabled = value && !reduced; document.body.classList.toggle('crt-disabled', !enabled); }
  function burst() { if (!enabled) return; canvas.classList.add('burst'); clearTimeout(burstTimer); burstTimer = setTimeout(() => canvas.classList.remove('burst'), 230); }
  function animate(time) {
    requestAnimationFrame(animate);
    if (!enabled || document.hidden || time - lastFrame < 140) return;
    lastFrame = time;
    if (document.querySelector('.screen.effects-off')) { canvas.style.opacity = '0'; roll.style.opacity = '0'; return; }
    canvas.style.opacity = ''; roll.style.opacity = '';
    for (let i = 0; i < pixels.data.length; i += 4) { const v = Math.random() * 255; pixels.data[i] = v; pixels.data[i + 1] = v; pixels.data[i + 2] = v; pixels.data[i + 3] = 160; }
    ctx.putImageData(pixels, 0, 0);
  }
  window.MojaveCRT = { setEnabled, burst };
  setEnabled(enabled); requestAnimationFrame(animate);
})();
