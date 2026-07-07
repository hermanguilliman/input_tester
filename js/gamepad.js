/* ================================================================
   GamepadTest — Gamepad API (опрос через requestAnimationFrame)
   Публикует глобальный объект `GamepadTest`.
   ================================================================ */
window.GamepadTest = (() => {
  const els = {};
  let activeIndex = null;
  let btnEls = [];
  const STD_BUTTONS = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Back', 'Start', 'LS', 'RS', 'Up', 'Down', 'Left', 'Right', 'Home'];

  function getPads() { return navigator.getGamepads ? navigator.getGamepads() : []; }

  function pickActive() {
    const pads = getPads();
    for (let i = 0; i < pads.length; i++) if (pads[i]) return i;
    return null;
  }

  function buildButtons(pad) {
    els.buttons.innerHTML = '';
    btnEls = [];
    pad.buttons.forEach((b, i) => {
      const el = document.createElement('div');
      el.className = 'gp-btn';
      el.innerHTML = `
        <div class="gp-btn-name">${STD_BUTTONS[i] || ('B' + i)}</div>
        <div class="gp-btn-val">0.00</div>
        <div class="gp-fill" style="width:0%"></div>`;
      els.buttons.appendChild(el);
      btnEls.push(el);
    });
  }

  function setActive(index) {
    const pad = getPads()[index];
    if (!pad) return;
    activeIndex = index;
    els.empty.style.display = 'none';
    els.content.classList.add('active');
    els.id.innerText = pad.id;
    els.meta.innerText = `index: ${pad.index} · buttons: ${pad.buttons.length} · axes: ${pad.axes.length} · mapping: ${pad.mapping || 'n/a'}`;
    buildButtons(pad);
  }

  function clearActive() {
    activeIndex = null;
    els.content.classList.remove('active');
    els.empty.style.display = 'flex';
  }

  function stickPos(dot, x, y) {
    dot.style.left = (50 + x * 42) + '%';
    dot.style.top = (50 + y * 42) + '%';
  }

  function loop() {
    if (activeIndex !== null) {
      const pad = getPads()[activeIndex];
      if (pad) {
        pad.buttons.forEach((b, i) => {
          const el = btnEls[i];
          if (!el) return;
          const v = b.value;
          el.classList.toggle('on', b.pressed);
          el.querySelector('.gp-btn-val').innerText = v.toFixed(2);
          el.querySelector('.gp-fill').style.width = (v * 100) + '%';
        });
        const ax = pad.axes;
        if (ax.length >= 2) { stickPos(els.stickL, ax[0], ax[1]); els.stickLLabel.innerText = `L: ${ax[0].toFixed(2)}, ${ax[1].toFixed(2)}`; }
        if (ax.length >= 4) { stickPos(els.stickR, ax[2], ax[3]); els.stickRLabel.innerText = `R: ${ax[2].toFixed(2)}, ${ax[3].toFixed(2)}`; }
      } else {
        const next = pickActive();
        if (next === null) clearActive(); else setActive(next);
      }
    }
    requestAnimationFrame(loop);
  }

  function vibrate() {
    if (activeIndex === null) return;
    const pad = getPads()[activeIndex];
    const act = pad && pad.vibrationActuator;
    if (act && act.playEffect) {
      act.playEffect('dual-rumble', { duration: 400, strongMagnitude: 1.0, weakMagnitude: 1.0 });
    }
  }

  function reset() { /* геймпад — состояние реального времени, сбрасывать нечего */ }

  function init() {
    const map = {
      empty: 'gpEmpty', content: 'gpContent', id: 'gpId', meta: 'gpMeta', buttons: 'gpButtons',
      stickL: 'stickL', stickR: 'stickR', stickLLabel: 'stickLLabel', stickRLabel: 'stickRLabel',
    };
    Object.keys(map).forEach(k => els[k] = document.getElementById(map[k]));
    document.getElementById('gpVibrateBtn').addEventListener('click', vibrate);

    window.addEventListener('gamepadconnected', (e) => { if (activeIndex === null) setActive(e.gamepad.index); });
    window.addEventListener('gamepaddisconnected', (e) => {
      if (e.gamepad.index === activeIndex) {
        const next = pickActive();
        if (next === null) clearActive(); else setActive(next);
      }
    });

    // на случай, если геймпад уже подключён
    const existing = pickActive();
    if (existing !== null) setActive(existing);
    loop();
  }

  return { init, reset };
})();
