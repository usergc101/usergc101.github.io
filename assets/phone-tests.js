/* Knowfone online phone tests: screen, touch, multi-touch, refresh rate, speakers, microphone,
   cameras and flash, vibration, sensors and the charging port, in the phone's own browser.
   Nothing leaves the phone: no uploads, no cookies, no trackers. Pictures and sound stay in memory.

   A page wires itself with:
     <button data-run="touch">  one test        <button data-run="all">  every test in a row
     <div id="pt-results">      where the summary appears after a run                        */
(() => {
  'use strict';

  const ABORT = Symbol('abort');
  const SITE = 'https://usergc101.github.io';
  const APK = 'https://github.com/usergc101/usergc101.github.io/releases/latest/download/knowfone.apk';

  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const btn = (label, cls = 'pt-btn', attrs = {}) => {
    const b = el('button', cls, label);
    b.type = 'button';
    for (const [k, v] of Object.entries(attrs)) b.setAttribute(k, v);
    return b;
  };
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const ICONS = {
    screen: '<path d="M4 4h16v13H4z"/><path d="M9 21h6M12 17v4"/><path d="M8 8h2v2H8zM14 11h2v2h-2z" fill="currentColor" stroke="none"/>',
    touch: '<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="10.5" opacity=".45"/>',
    multitouch: '<circle cx="6" cy="9" r="2.6"/><circle cx="12" cy="6" r="2.6"/><circle cx="18" cy="9" r="2.6"/><circle cx="12" cy="16" r="2.6"/>',
    refresh: '<path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4.5-5.5"/><circle cx="12" cy="16" r="1.4" fill="currentColor" stroke="none"/>',
    speaker: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    camera: '<path d="M3.5 7.5h4l1.5-2.5h6l1.5 2.5h4V19h-17z"/><circle cx="12" cy="13" r="3.6"/>',
    vibrate: '<rect x="8" y="3.5" width="8" height="17" rx="2"/><path d="M4.5 8v8M2 10v4M19.5 8v8M22 10v4"/>',
    sensors: '<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.2l-1.6 4-4 1.6 1.6-4z" fill="currentColor"/>',
    charging: '<rect x="3" y="7" width="16" height="10" rx="2.2"/><path d="M21 10.5v3"/><path d="M11.5 8.6L9 12.4h3.4L10.5 15.4" stroke-linejoin="round"/>'
  };
  const icon = (id, size = 28) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">${ICONS[id] || ''}</svg>`;

  /* ---------------------------------------------------------------- the stage (full-screen layer) */

  class Stage {
    constructor() {
      this.root = el('div', 'pt-stage');
      this.root.setAttribute('role', 'dialog');
      this.root.setAttribute('aria-modal', 'true');
      this.body = el('div', 'pt-body');
      this.bar = el('div', 'pt-bar');
      this.titleEl = el('div', 'pt-title');
      this.exitBtn = btn('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>', 'pt-x', { 'aria-label': 'Close the test' });
      this.bar.append(this.titleEl, this.exitBtn);
      this.root.append(this.body, this.bar);
      this.cleanups = [];
      this.aborters = new Set();
      this.exitBtn.addEventListener('click', () => this.abort());
      this.onKey = e => { if (e.key === 'Escape') this.abort(); };
      this.onPop = () => { this.popped = true; this.abort(); };
      document.addEventListener('keydown', this.onKey);
      document.body.append(this.root);
      document.documentElement.classList.add('pt-open');
      try { history.pushState({ ptStage: 1 }, ''); } catch (_) { /* file:// or sandboxed */ }
      window.addEventListener('popstate', this.onPop);
      this.goFullscreen();
    }

    goFullscreen() {
      const d = document.documentElement;
      try {
        const p = d.requestFullscreen ? d.requestFullscreen({ navigationUI: 'hide' }) : d.webkitRequestFullscreen && d.webkitRequestFullscreen();
        if (p && p.catch) p.catch(() => {});
      } catch (_) { /* not allowed here; the layer still covers the page */ }
    }

    /** Clears the previous step and shows [title]. [chrome]: 'bar' (default), 'faint' (full-screen
        pictures) or 'none' (the touch grid, where the close button would cover squares; Back still exits). */
    step(title, chrome = 'bar') {
      this.runCleanups();
      this.body.textContent = '';
      this.body.className = 'pt-body';
      this.body.style.background = '';
      this.titleEl.textContent = title;
      this.bar.classList.toggle('pt-bar-faint', chrome === 'faint');
      this.bar.hidden = chrome === 'none';
    }

    onCleanup(fn) { this.cleanups.push(fn); }

    runCleanups() {
      const list = this.cleanups.splice(0);
      for (const fn of list) { try { fn(); } catch (_) { /* keep closing */ } }
    }

    /** A promise that settles with what the step reports, or ABORT when the person closes the test. */
    task(executor) {
      return new Promise(resolve => {
        let settled = false;
        const finish = v => { if (!settled) { settled = true; this.aborters.delete(onAbort); resolve(v); } };
        const onAbort = () => finish(ABORT);
        this.aborters.add(onAbort);
        if (this.aborted) return finish(ABORT);
        executor(finish);
      });
    }

    abort() {
      this.aborted = true;
      for (const fn of [...this.aborters]) fn();
    }

    /** A centred card with a question and answer buttons; resolves with the chosen value. */
    ask(html, choices, opts = {}) {
      return this.task(done => {
        const wrap = el('div', opts.sheet ? 'pt-sheet-wrap' : 'pt-center');
        const card = el('div', 'pt-card' + (opts.sheet ? ' pt-sheet' : ''));
        card.append(el('div', 'pt-ask', html));
        const row = el('div', 'pt-choices');
        for (const c of choices) {
          const b = btn(c.label, 'pt-btn ' + (c.cls || ''));
          b.addEventListener('click', () => { wrap.remove(); done(c.value); });
          row.append(b);
        }
        card.append(row);
        wrap.append(card);
        this.body.append(wrap);
        this.onCleanup(() => wrap.remove());
        const first = row.querySelector('button');
        if (first) first.focus({ preventScroll: true });
      });
    }

    close() {
      this.runCleanups();
      document.removeEventListener('keydown', this.onKey);
      window.removeEventListener('popstate', this.onPop);
      this.root.remove();
      document.documentElement.classList.remove('pt-open');
      try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); } catch (_) { /* ignore */ }
      if (!this.popped) { try { if (history.state && history.state.ptStage) history.back(); } catch (_) { /* ignore */ } }
    }
  }

  /** "Did it work?" with the three usual answers. */
  const verdict = (st, question, okLabel = 'It works', badLabel = 'There is a problem') =>
    st.ask(question, [
      { label: okLabel, value: 'pass', cls: 'pt-ok' },
      { label: badLabel, value: 'fail', cls: 'pt-bad' },
      { label: 'Skip', value: 'skip', cls: 'pt-ghost' }
    ]);

  const result = (status, note, value) => ({ status, note, value });

  /* ---------------------------------------------------------------- 1. screen colours (dead pixels) */

  const SCREENS = [
    ['#000000', 'Black', 'Look for bright dots and light leaking at the edges.'],
    ['#ffffff', 'White', 'Look for dark dots, yellow or pink patches and shadows.'],
    ['#ff0000', 'Red', 'Look for dots in a different colour.'],
    ['#00ff00', 'Green', 'Look for dots in a different colour.'],
    ['#0000ff', 'Blue', 'Look for dots in a different colour.'],
    ['#7f7f7f', 'Grey', 'Look for faint shapes burnt into the screen, like a keyboard or status bar.'],
    ['linear-gradient(90deg,#000,#fff)', 'Gradient', 'The shades should flow smoothly, without bands or lines.']
  ];

  async function screenTest(st) {
    st.step('Screen colours', 'faint');
    st.body.classList.add('pt-colors');
    const hint = el('div', 'pt-hint');
    st.body.append(hint);
    let i = 0;
    let hideTimer = 0;
    const show = () => {
      const [bg, name, tip] = SCREENS[i];
      st.body.style.background = bg;
      const light = name === 'White' || name === 'Green';
      hint.classList.toggle('pt-hint-dark', light);
      hint.innerHTML = `<b>${i + 1}/${SCREENS.length} ${name}</b><span>${tip}</span><small>Tap for the next colour</small>`;
      hint.classList.remove('pt-hide');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => hint.classList.add('pt-hide'), 2600);
    };
    show();
    const r = await st.task(done => {
      const tap = e => {
        if (e.target.closest('.pt-bar')) return;
        i += 1;
        if (i >= SCREENS.length) done('end'); else show();
      };
      st.body.addEventListener('click', tap);
      st.onCleanup(() => { st.body.removeEventListener('click', tap); clearTimeout(hideTimer); });
    });
    if (r === ABORT) return ABORT;
    st.body.style.background = '';
    st.body.classList.remove('pt-colors');
    hint.remove();
    st.bar.classList.remove('pt-bar-faint');
    const v = await verdict(st, '<h3>Did every colour look clean?</h3><p>No dots, lines, stains, bands or shapes burnt in.</p>', 'All clean', 'I saw a problem');
    if (v === ABORT) return ABORT;
    return result(v, v === 'pass' ? 'No dots, lines or burn-in seen.' : v === 'fail' ? 'Marks seen on the screen.' : '');
  }

  /* ---------------------------------------------------------------- 2. touch grid */

  async function touchTest(st) {
    st.step('Touch screen', 'none');
    const cv = el('canvas', 'pt-canvas');
    const hud = el('div', 'pt-hud');
    hud.innerHTML = '<b class="mono">0%</b><span>Swipe over every square, edges too</span>';
    const hudRow = el('div', 'pt-hud-row');
    const finishBtn = btn('Finish', 'pt-pill');
    hudRow.append(finishBtn);
    hud.append(hudRow);
    st.body.append(cv, hud);
    const g = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    let W = 0, H = 0, cols = 0, rows = 0, cw = 0, ch = 0, total = 0, count = 0, cells = new Uint8Array(0);
    let showMissed = false;
    let complete = false;

    const drawCell = i => {
      const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
      g.fillStyle = '#020409';
      g.fillRect(x, y, cw, ch);
      g.fillStyle = cells[i] ? (complete ? '#3ee8a4' : '#5ce1ff') : showMissed ? 'rgba(255,92,116,.75)' : '#0e1626';
      g.fillRect(x + 1, y + 1, cw - 2, ch - 2);
    };
    const drawAll = () => { for (let i = 0; i < total; i++) drawCell(i); };
    const layout = () => {
      const r = st.body.getBoundingClientRect();
      W = r.width; H = r.height;
      cols = Math.max(8, Math.round(W / 28));
      rows = Math.max(12, Math.round(H / 28));
      cw = W / cols; ch = H / rows; total = cols * rows;
      cells = new Uint8Array(total); count = 0; showMissed = false;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawAll();
      update();
    };
    let doneFn = null;
    const update = () => {
      const pct = total ? Math.floor((count / total) * 100) : 0;
      hud.querySelector('b').textContent = pct + '%';
      if (count === total && total && !complete) {
        complete = true;
        drawAll();
        hud.querySelector('span').textContent = 'Every square responded';
        hud.classList.remove('pt-dim');
        hud.classList.add('pt-win');
        setTimeout(() => doneFn && doneFn('complete'), 900);
      }
    };
    const mark = (x, y) => {
      const c = Math.min(cols - 1, Math.max(0, Math.floor(x / cw)));
      const r = Math.min(rows - 1, Math.max(0, Math.floor(y / ch)));
      const i = r * cols + c;
      if (!cells[i]) { cells[i] = 1; count += 1; drawCell(i); }
    };
    const line = (x0, y0, x1, y1) => {
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (Math.min(cw, ch) / 3)));
      for (let k = 0; k <= n; k++) mark(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n);
    };
    const last = new Map();
    const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const down = e => {
      e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch (_) { /* older browsers */ }
      const p = pos(e);
      last.set(e.pointerId, p);
      mark(p[0], p[1]);
      hud.classList.add('pt-dim');
      update();
    };
    const move = e => {
      if (!last.has(e.pointerId)) return;
      e.preventDefault();
      const list = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
      for (const ce of list.length ? list : [e]) {
        const p = pos(ce), q = last.get(e.pointerId);
        line(q[0], q[1], p[0], p[1]);
        last.set(e.pointerId, p);
      }
      update();
    };
    const up = e => { last.delete(e.pointerId); if (!last.size) hud.classList.remove('pt-dim'); };
    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    const onResize = () => { if (!complete) layout(); };
    window.addEventListener('resize', onResize);
    st.onCleanup(() => window.removeEventListener('resize', onResize));
    await sleep(60);
    layout();

    for (;;) {
      const r = await st.task(done => {
        doneFn = done;
        const f = () => done('finish');
        finishBtn.addEventListener('click', f, { once: true });
        st.onCleanup(() => finishBtn.removeEventListener('click', f));
      });
      if (r === ABORT) return ABORT;
      const pct = Math.floor((count / total) * 100);
      if (r === 'complete') return result('pass', 'Every square of the screen responded to touch.', 100);
      showMissed = true;
      drawAll();
      const v = await st.ask(`<h3>${pct}% responded</h3><p>Squares that never lit are red. Swipe them again: if they stay red, that part of the screen does not respond.</p>`, [
        { label: 'Swipe the red squares', value: 'again', cls: 'pt-ok' },
        { label: 'They do not respond', value: 'fail', cls: 'pt-bad' },
        { label: 'Stop here', value: 'stop', cls: 'pt-ghost' }
      ], { sheet: true });
      if (v === ABORT) return ABORT;
      if (v === 'fail') return result('fail', `Some areas did not respond (${pct}% of the screen did).`, pct);
      if (v === 'stop') return result('skip', `Stopped at ${pct}% of the screen.`, pct);
    }
  }

  /* ---------------------------------------------------------------- 3. multi-touch */

  async function multiTouchTest(st) {
    st.step('Multi-touch', 'faint');
    const cv = el('canvas', 'pt-canvas');
    const hud = el('div', 'pt-hud pt-hud-top');
    hud.innerHTML = '<b class="mono">0</b><span>Put more fingers on the screen</span>';
    const doneBtn = btn('Done', 'pt-pill');
    const row = el('div', 'pt-hud-row');
    row.append(doneBtn);
    hud.append(row);
    st.body.append(cv, hud);
    const g = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const colors = ['#5ce1ff', '#ff9447', '#3ee8a4', '#ffc24a', '#ff5c74', '#a88bff', '#5ce1ff', '#ff9447', '#3ee8a4', '#ffc24a'];
    const pts = new Map();
    let most = 0;
    let raf = 0;
    const size = () => {
      const r = st.body.getBoundingClientRect();
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
      cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = () => {
      g.clearRect(0, 0, cv.width, cv.height);
      let n = 0;
      for (const [, p] of pts) {
        n += 1;
        g.beginPath(); g.arc(p.x, p.y, 46, 0, Math.PI * 2);
        g.fillStyle = p.c + '33'; g.fill();
        g.lineWidth = 3; g.strokeStyle = p.c; g.stroke();
        g.fillStyle = p.c; g.font = '700 20px Sora, system-ui, sans-serif'; g.textAlign = 'center';
        g.fillText(String(p.n), p.x, p.y - 58);
      }
      hud.querySelector('b').textContent = String(n);
      hud.querySelector('span').textContent = most ? `Most at once: ${most}` : 'Put more fingers on the screen';
      raf = requestAnimationFrame(draw);
    };
    const pos = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const down = e => {
      e.preventDefault();
      const p = pos(e);
      pts.set(e.pointerId, { ...p, c: colors[pts.size % colors.length], n: pts.size + 1 });
      most = Math.max(most, pts.size);
      hud.classList.add('pt-dim');
    };
    const move = e => { const p = pts.get(e.pointerId); if (!p) return; e.preventDefault(); Object.assign(p, pos(e)); };
    const up = e => { pts.delete(e.pointerId); if (!pts.size) hud.classList.remove('pt-dim'); };
    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    window.addEventListener('resize', size);
    st.onCleanup(() => { cancelAnimationFrame(raf); window.removeEventListener('resize', size); });
    await sleep(60);
    size();
    draw();
    const r = await st.task(done => doneBtn.addEventListener('click', () => done('done'), { once: true }));
    if (r === ABORT) return ABORT;
    if (most >= 5) return result('pass', `${most} fingers at once.`, most);
    const v = await verdict(st, `<h3>${most} finger${most === 1 ? '' : 's'} at once</h3><p>Most phones follow 5 or more fingers (10 on many). If a finger dot jumped or vanished while you held still, the touch layer has a problem.</p>`, 'Looks right', 'Dots jumped or vanished');
    if (v === ABORT) return ABORT;
    return result(v, `${most} fingers at once.`, most);
  }

  /* ---------------------------------------------------------------- 4. refresh rate */

  const RATES = [30, 48, 50, 60, 72, 75, 90, 96, 100, 120, 144, 165, 240];
  const snapRate = hz => {
    let best = hz, gap = Infinity;
    for (const r of RATES) { const d = Math.abs(r - hz) / r; if (d < gap) { gap = d; best = r; } }
    return gap < 0.07 ? best : Math.round(hz);
  };

  async function refreshTest(st) {
    st.step('Refresh rate');
    const box = el('div', 'pt-center pt-main');
    const card = el('div', 'pt-card pt-wide');
    card.innerHTML = '<div class="pt-meter"><b class="mono">--</b><span>Hz</span></div><div class="pt-track"><i></i></div><p class="pt-note">Keep one finger moving on the screen while it measures: many phones only use their top speed while you touch.</p>';
    box.append(card);
    st.body.append(box);
    const out = card.querySelector('b');
    const bar = card.querySelector('.pt-track i');
    const deltas = [];
    let lastT = 0, raf = 0, x = 0;
    const started = performance.now();
    const r = await st.task(done => {
      const frame = t => {
        if (lastT) {
          const d = t - lastT;
          if (d > 2 && d < 100) deltas.push(d);
        }
        lastT = t;
        x = (x + 6) % 100;
        bar.style.transform = `translateX(${x * 2.4}%)`;
        if (deltas.length > 20) {
          const recent = deltas.slice(-90).sort((a, b) => a - b);
          out.textContent = String(snapRate(1000 / recent[Math.floor(recent.length / 2)]));
        }
        if (t - started > 4500) return done('end');
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      st.onCleanup(() => cancelAnimationFrame(raf));
    });
    if (r === ABORT) return ABORT;
    const recent = deltas.slice(-150).sort((a, b) => a - b);
    const hz = recent.length ? snapRate(1000 / recent[Math.floor(recent.length / 2)]) : 0;
    box.remove();
    const v = await st.ask(`<h3>About ${hz} Hz</h3><p>That is how often the browser drew this page. Compare it with the model's screen: a phone sold as 90 or 120 Hz that stays at 60 Hz here is worth a closer look. Battery saver and some phones hold browsers at 60 Hz, so check those first.</p>`, [
      { label: 'Measure again', value: 'again', cls: 'pt-ghost' },
      { label: 'Next', value: 'next', cls: 'pt-ok' }
    ]);
    if (v === ABORT) return ABORT;
    if (v === 'again') return refreshTest(st);
    return result('info', `The browser drew at about ${hz} Hz.`, hz);
  }

  /* ---------------------------------------------------------------- 5. speakers */

  let audioCtx = null;
  const audio = () => {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  };

  const playNotes = (pan, notes, gainMax = 0.32) => {
    const ac = audio();
    if (!ac) return 0;
    const out = ac.createGain();
    out.gain.value = gainMax;
    let node = out;
    if (ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = pan; out.connect(p); node = p; }
    node.connect(ac.destination);
    let t = ac.currentTime + 0.03;
    for (const f of notes) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(1, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
      o.connect(g); g.connect(out);
      o.start(t); o.stop(t + 0.45);
      t += 0.17;
    }
    return (t - ac.currentTime + 0.3) * 1000;
  };

  const playSweep = () => {
    const ac = audio();
    if (!ac) return 0;
    const o = ac.createOscillator();
    const g = ac.createGain();
    const t = ac.currentTime + 0.03;
    o.type = 'sine';
    o.frequency.setValueAtTime(80, t);
    o.frequency.exponentialRampToValueAtTime(12000, t + 5);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.22, t + 0.15);
    g.gain.setValueAtTime(0.22, t + 4.8);
    g.gain.linearRampToValueAtTime(0, t + 5);
    o.connect(g); g.connect(ac.destination);
    o.start(t); o.stop(t + 5.05);
    return 5200;
  };

  async function speakerTest(st) {
    st.step('Speakers');
    if (!(window.AudioContext || window.webkitAudioContext)) {
      const v = await verdict(st, '<h3>This browser cannot play test sounds</h3><p>Play a song or video instead, at full volume, with the phone flat and then upright.</p>', 'Sounds fine', 'Quiet, crackling or silent');
      return v === ABORT ? ABORT : result(v, '');
    }
    const box = el('div', 'pt-center pt-main');
    const card = el('div', 'pt-card pt-wide');
    card.innerHTML = `<div class="pt-orb">${icon('speaker', 44)}</div><p class="pt-note">Turn the volume up. On phones with two speakers, hold the phone sideways: Left plays from one end, Right from the other.</p>`;
    const grid = el('div', 'pt-grid4');
    const orb = card.querySelector('.pt-orb');
    const play = ms => { orb.classList.add('pt-live'); clearTimeout(orb.t); orb.t = setTimeout(() => orb.classList.remove('pt-live'), ms); };
    const chord = [523.25, 659.25, 783.99, 1046.5];
    const keys = [
      ['Left', () => play(playNotes(-1, chord))],
      ['Right', () => play(playNotes(1, chord))],
      ['Both', () => play(playNotes(0, chord))],
      ['Sweep', () => play(playSweep())]
    ];
    for (const [label, fn] of keys) { const b = btn(label, 'pt-btn pt-ghost'); b.addEventListener('click', fn); grid.append(b); }
    card.append(grid);
    box.append(card);
    st.body.append(box);
    play(playNotes(0, chord));
    const v = await st.ask('<h3>Clear and loud, no rattle?</h3><p>The sweep rises from a low hum to a high whistle: listen for buzzing or crackling on the way.</p>', [
      { label: 'Sounds fine', value: 'pass', cls: 'pt-ok' },
      { label: 'Quiet, crackling or silent', value: 'fail', cls: 'pt-bad' },
      { label: 'Skip', value: 'skip', cls: 'pt-ghost' }
    ], { sheet: true });
    if (v === ABORT) return ABORT;
    return result(v, v === 'fail' ? 'Speaker sounded quiet, distorted or silent.' : v === 'pass' ? 'Speakers sounded clear.' : '');
  }

  /* ---------------------------------------------------------------- 6. microphone */

  async function micTest(st) {
    st.step('Microphone');
    const md = navigator.mediaDevices;
    if (!md || !md.getUserMedia) {
      const v = await verdict(st, '<h3>This browser cannot use the microphone</h3><p>Record a short voice note in any app and play it back instead.</p>', 'Recording sounds fine', 'Muffled or silent');
      return v === ABORT ? ABORT : result(v, '');
    }
    const box = el('div', 'pt-center pt-main');
    const card = el('div', 'pt-card pt-wide');
    card.innerHTML = '<div class="pt-bars" aria-hidden="true"></div><p class="pt-note">Allow the microphone, then speak or blow gently near the bottom of the phone. Nothing is recorded unless you tap Record, and nothing leaves the phone.</p>';
    const bars = card.querySelector('.pt-bars');
    for (let i = 0; i < 24; i++) bars.append(el('i'));
    const rec = btn('Record 3 seconds and play back', 'pt-btn pt-ghost');
    card.append(rec);
    box.append(card);
    st.body.append(box);
    let stream;
    try {
      stream = await md.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    } catch (e) {
      card.querySelector('.pt-note').textContent = 'The microphone was not allowed or is not available. Allow it in the browser and try again, or record a voice note in another app.';
    }
    if (stream) {
      st.onCleanup(() => stream.getTracks().forEach(t => t.stop()));
      const ac = audio();
      if (ac) {
        const src = ac.createMediaStreamSource(stream);
        const an = ac.createAnalyser();
        an.fftSize = 1024;
        src.connect(an);
        const data = new Uint8Array(an.fftSize);
        const items = [...bars.children];
        let raf = 0;
        const tick = () => {
          an.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
          const level = Math.min(1, Math.sqrt(sum / data.length) * 5);
          items.push(items.shift());
          items.forEach((b, i) => { if (i === items.length - 1) b.style.transform = `scaleY(${0.06 + level})`; });
          bars.append(...items);
          raf = requestAnimationFrame(tick);
        };
        tick();
        st.onCleanup(() => { cancelAnimationFrame(raf); try { src.disconnect(); } catch (_) { /* ignore */ } });
      }
      if (window.MediaRecorder) {
        rec.addEventListener('click', () => {
          rec.disabled = true;
          rec.textContent = 'Recording... speak now';
          const chunks = [];
          let mr;
          try { mr = new MediaRecorder(stream); } catch (_) { rec.textContent = 'Recording is not available here'; return; }
          mr.ondataavailable = e => e.data.size && chunks.push(e.data);
          mr.onstop = () => {
            const url = URL.createObjectURL(new Blob(chunks, { type: mr.mimeType || 'audio/webm' }));
            const a = new Audio(url);
            rec.textContent = 'Playing it back';
            a.onended = () => { rec.disabled = false; rec.textContent = 'Record again'; URL.revokeObjectURL(url); };
            a.play().catch(() => { rec.disabled = false; rec.textContent = 'Record again'; });
          };
          mr.start();
          setTimeout(() => { if (mr.state !== 'inactive') mr.stop(); }, 3000);
        });
      } else {
        rec.remove();
      }
    } else {
      rec.remove();
    }
    const v = await st.ask('<h3>Did the bars move and your voice play back clearly?</h3>', [
      { label: 'Yes, clear', value: 'pass', cls: 'pt-ok' },
      { label: 'Muffled or silent', value: 'fail', cls: 'pt-bad' },
      { label: 'Skip', value: 'skip', cls: 'pt-ghost' }
    ], { sheet: true });
    if (v === ABORT) return ABORT;
    return result(v, v === 'fail' ? 'Microphone sounded muffled or silent.' : v === 'pass' ? 'Microphone picked up sound clearly.' : '');
  }

  /* ---------------------------------------------------------------- 7. cameras and flash */

  async function cameraTest(st) {
    st.step('Cameras');
    const md = navigator.mediaDevices;
    if (!md || !md.getUserMedia) {
      const v = await verdict(st, '<h3>This browser cannot open the cameras</h3><p>Open the phone\'s camera app and try every lens, the flash and the front camera.</p>', 'All work', 'A camera has a problem');
      return v === ABORT ? ABORT : result(v, '');
    }
    st.body.classList.add('pt-cam');
    const video = el('video', 'pt-video');
    video.playsInline = true;
    video.muted = true;
    video.setAttribute('playsinline', '');
    const info = el('div', 'pt-chip mono');
    const dock = el('div', 'pt-dock');
    const camRow = el('div', 'pt-cams');
    const torchBtn = btn('Flash', 'pt-pill');
    const doneBtn = btn('Done', 'pt-pill pt-pill-solid');
    torchBtn.hidden = true;
    dock.append(camRow, el('div', 'pt-dock-row'));
    dock.lastChild.append(torchBtn, doneBtn);
    st.body.append(video, info, dock);
    let stream = null;
    let torch = false;
    const seen = new Set();
    const stop = () => { if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; };
    st.onCleanup(stop);
    const open = async constraints => {
      stop();
      info.textContent = 'Opening...';
      try {
        stream = await md.getUserMedia({ audio: false, video: constraints });
      } catch (e) {
        info.textContent = 'This camera did not open';
        return false;
      }
      video.srcObject = stream;
      try { await video.play(); } catch (_) { /* autoplay is muted, so this rarely fails */ }
      const track = stream.getVideoTracks()[0];
      const s = track.getSettings ? track.getSettings() : {};
      const caps = track.getCapabilities ? track.getCapabilities() : {};
      if (s.deviceId) seen.add(s.deviceId);
      const facing = s.facingMode === 'user' ? 'front' : s.facingMode === 'environment' ? 'back' : '';
      info.textContent = `${facing ? facing + ' camera' : (track.label || 'camera')}  ${s.width || '?'}x${s.height || '?'}`;
      video.classList.toggle('pt-mirror', s.facingMode === 'user');
      torch = false;
      torchBtn.hidden = !caps.torch;
      torchBtn.classList.remove('pt-on');
      return true;
    };
    const ok = await open({ facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } });
    if (ok && md.enumerateDevices) {
      try {
        const cams = (await md.enumerateDevices()).filter(d => d.kind === 'videoinput');
        cams.forEach((d, i) => {
          const label = d.label ? d.label.replace(/camera2?\s*/i, 'Camera ').replace(/,?\s*facing\s*/i, ' ').trim() : `Camera ${i + 1}`;
          const b = btn(label || `Camera ${i + 1}`, 'pt-pill');
          b.addEventListener('click', async () => {
            camRow.querySelectorAll('.pt-pill').forEach(x => x.classList.remove('pt-on'));
            b.classList.add('pt-on');
            await open({ deviceId: { exact: d.deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } });
          });
          camRow.append(b);
        });
        if (cams.length < 2) {
          const flip = btn('Front camera', 'pt-pill');
          let front = false;
          flip.addEventListener('click', async () => {
            front = !front;
            flip.textContent = front ? 'Back camera' : 'Front camera';
            await open({ facingMode: { ideal: front ? 'user' : 'environment' } });
          });
          camRow.append(flip);
        }
      } catch (_) { /* labels need permission; the default camera still shows */ }
    }
    torchBtn.addEventListener('click', async () => {
      const track = stream && stream.getVideoTracks()[0];
      if (!track) return;
      torch = !torch;
      try { await track.applyConstraints({ advanced: [{ torch }] }); torchBtn.classList.toggle('pt-on', torch); } catch (_) { torchBtn.hidden = true; }
    });
    const r = await st.task(done => doneBtn.addEventListener('click', () => done('done'), { once: true }));
    if (r === ABORT) return ABORT;
    stop();
    st.body.classList.remove('pt-cam');
    video.remove(); info.remove(); dock.remove();
    const v = await verdict(st, `<h3>Did every camera show a sharp, clean picture?</h3><p>Check each one: no black screen, spots, haze, pink or green tint. ${seen.size > 1 ? `You opened ${seen.size} cameras.` : ''} The phone's camera app may reach lenses a browser cannot.</p>`, 'All sharp', 'A camera has a problem');
    if (v === ABORT) return ABORT;
    return result(v, v === 'pass' ? 'Cameras showed a clean picture.' : v === 'fail' ? 'A camera showed a problem.' : '', seen.size);
  }

  /* ---------------------------------------------------------------- 8. vibration */

  async function vibrationTest(st) {
    st.step('Vibration');
    if (!navigator.vibrate) {
      const v = await verdict(st, '<h3>This browser cannot use the vibration motor</h3><p>iPhones and some browsers block it. Turn on vibration for calls and ask someone to call the phone, or use the phone\'s own test menu.</p>', 'It vibrates', 'No vibration');
      return v === ABORT ? ABORT : result(v, '');
    }
    const box = el('div', 'pt-center pt-main');
    const card = el('div', 'pt-card pt-wide');
    card.innerHTML = `<div class="pt-orb">${icon('vibrate', 44)}</div><p class="pt-note">Hold the phone in your hand. A healthy motor gives a firm, even buzz without rattling.</p>`;
    const row = el('div', 'pt-grid4 pt-grid2');
    const orb = card.querySelector('.pt-orb');
    const buzz = (pattern, ms) => { navigator.vibrate(pattern); orb.classList.add('pt-shake'); clearTimeout(orb.t); orb.t = setTimeout(() => orb.classList.remove('pt-shake'), ms); };
    const long = btn('Long buzz', 'pt-btn pt-ghost');
    const pulse = btn('Pulses', 'pt-btn pt-ghost');
    long.addEventListener('click', () => buzz(900, 900));
    pulse.addEventListener('click', () => buzz([120, 90, 120, 90, 120, 90, 400], 1100));
    row.append(long, pulse);
    card.append(row);
    box.append(card);
    st.body.append(box);
    buzz([300, 120, 300], 800);
    st.onCleanup(() => navigator.vibrate(0));
    const v = await st.ask('<h3>Did you feel a firm buzz?</h3>', [
      { label: 'Yes, firm', value: 'pass', cls: 'pt-ok' },
      { label: 'Weak, rattly or none', value: 'fail', cls: 'pt-bad' },
      { label: 'Skip', value: 'skip', cls: 'pt-ghost' }
    ], { sheet: true });
    if (v === ABORT) return ABORT;
    return result(v, v === 'fail' ? 'Vibration was weak, rattly or missing.' : v === 'pass' ? 'Vibration motor works.' : '');
  }

  /* ---------------------------------------------------------------- 9. sensors */

  async function sensorTest(st) {
    st.step('Sensors');
    const box = el('div', 'pt-center pt-main');
    const card = el('div', 'pt-card pt-wide');
    card.innerHTML = '<div class="pt-sensors"><div class="pt-level"><i></i></div><div class="pt-compass"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" fill="none" stroke="rgba(143,180,255,.3)" stroke-width="2"/><path d="M50 12 L57 50 L50 46 L43 50Z" fill="#ff5c74"/><path d="M50 88 L57 50 L50 54 L43 50Z" fill="#a2b0ce"/><text x="50" y="9" text-anchor="middle" font-size="9" fill="#eaf1ff">N</text></svg></div></div>' +
      '<div class="pt-readout mono"><span>Tilt <b data-k="tilt">--</b></span><span>Heading <b data-k="head">--</b></span><span>Shakes <b data-k="shake">0</b></span></div>' +
      '<p class="pt-note">Tilt the phone: the dot should follow smoothly. Turn around: the needle should turn. Shake it twice.</p>';
    box.append(card);
    st.body.append(box);
    const dot = card.querySelector('.pt-level i');
    const needle = card.querySelector('.pt-compass svg');
    const out = k => card.querySelector(`[data-k="${k}"]`);
    let gotTilt = false, gotHead = false, shakes = 0, lastShake = 0;
    const onOrient = e => {
      if (e.beta == null && e.gamma == null) return;
      gotTilt = true;
      const x = Math.max(-40, Math.min(40, e.gamma || 0));
      const y = Math.max(-40, Math.min(40, e.beta || 0));
      dot.style.transform = `translate(${x * 1.3}px, ${y * 1.3}px)`;
      out('tilt').textContent = `${Math.round(e.beta || 0)}°/${Math.round(e.gamma || 0)}°`;
      let h = null;
      if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;
      else if (e.absolute && e.alpha != null) h = 360 - e.alpha;
      if (h != null) {
        gotHead = true;
        needle.style.transform = `rotate(${-h}deg)`;
        out('head').textContent = `${Math.round(h) % 360}°`;
      }
    };
    const onMotion = e => {
      const a = e.accelerationIncludingGravity || e.acceleration;
      if (!a) return;
      const m = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
      const now = performance.now();
      if (m > 22 && now - lastShake > 500) { shakes += 1; lastShake = now; out('shake').textContent = String(shakes); }
    };
    const listen = () => {
      window.addEventListener('deviceorientationabsolute', onOrient);
      window.addEventListener('deviceorientation', onOrient);
      window.addEventListener('devicemotion', onMotion);
    };
    st.onCleanup(() => {
      window.removeEventListener('deviceorientationabsolute', onOrient);
      window.removeEventListener('deviceorientation', onOrient);
      window.removeEventListener('devicemotion', onMotion);
    });
    const D = window.DeviceOrientationEvent;
    if (D && typeof D.requestPermission === 'function') {
      const allow = btn('Allow motion sensors', 'pt-btn pt-ok');
      card.append(allow);
      allow.addEventListener('click', async () => {
        try {
          const a = await D.requestPermission();
          if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') await DeviceMotionEvent.requestPermission().catch(() => {});
          if (a === 'granted') { allow.remove(); listen(); }
        } catch (_) { allow.textContent = 'Motion access was not allowed'; }
      });
    } else {
      listen();
    }
    const watch = setTimeout(() => {
      if (!gotTilt) card.querySelector('.pt-note').textContent = 'No motion data yet. This browser or phone may not share its sensors with web pages; the Knowfone app can still test them.';
    }, 3500);
    st.onCleanup(() => clearTimeout(watch));
    const v = await st.ask('<h3>Did the dot, the needle and the shake counter respond?</h3>', [
      { label: 'All responded', value: 'pass', cls: 'pt-ok' },
      { label: 'Something did not', value: 'fail', cls: 'pt-bad' },
      { label: 'Skip', value: 'skip', cls: 'pt-ghost' }
    ], { sheet: true });
    if (v === ABORT) return ABORT;
    const parts = [gotTilt ? 'tilt' : null, gotHead ? 'compass' : null, shakes ? 'shake' : null].filter(Boolean);
    return result(v, parts.length ? `Responded: ${parts.join(', ')}.` : 'No sensor data reached the browser.');
  }

  /* ---------------------------------------------------------------- 10. charging port */

  async function chargingTest(st) {
    st.step('Charging port');
    if (!navigator.getBattery) {
      const v = await verdict(st, '<h3>This browser cannot see the charger</h3><p>Plug the charger in and watch the battery icon: it should show charging at once. Then gently wiggle the plug. If charging stops and starts, the port or the cable is loose.</p>', 'Charges steadily', 'Charging cuts in and out');
      return v === ABORT ? ABORT : result(v, '');
    }
    let bat;
    try { bat = await navigator.getBattery(); } catch (_) { bat = null; }
    if (!bat) return result('skip', 'Battery status not available.');
    const box = el('div', 'pt-center pt-main');
    const card = el('div', 'pt-card pt-wide');
    card.innerHTML = '<div class="pt-battery"><i></i><b class="mono"></b></div><div class="pt-plug"></div><p class="pt-note">Plug in the charger. Then gently wiggle the plug for a few seconds. A good port keeps charging the whole time.</p>';
    box.append(card);
    st.body.append(box);
    const fill = card.querySelector('.pt-battery i');
    const pct = card.querySelector('.pt-battery b');
    const state = card.querySelector('.pt-plug');
    let changes = 0;
    let wasCharging = bat.charging;
    const paint = () => {
      const level = Math.round(bat.level * 100);
      fill.style.width = level + '%';
      pct.textContent = level + '%';
      card.classList.toggle('pt-charging', bat.charging);
      state.textContent = bat.charging ? 'Charging' : 'Not charging';
      if (changes > 1) state.textContent += ` - cut out ${Math.floor(changes / 2)} time${changes > 3 ? 's' : ''}`;
    };
    const onChange = () => { if (bat.charging !== wasCharging) { changes += 1; wasCharging = bat.charging; } paint(); };
    bat.addEventListener('chargingchange', onChange);
    bat.addEventListener('levelchange', paint);
    st.onCleanup(() => { bat.removeEventListener('chargingchange', onChange); bat.removeEventListener('levelchange', paint); });
    paint();
    const v = await st.ask('<h3>Did it charge the whole time you wiggled the plug?</h3>', [
      { label: 'Charged steadily', value: 'pass', cls: 'pt-ok' },
      { label: 'Cut in and out', value: 'fail', cls: 'pt-bad' },
      { label: 'Skip', value: 'skip', cls: 'pt-ghost' }
    ], { sheet: true });
    if (v === ABORT) return ABORT;
    const cut = Math.floor(changes / 2);
    const status = v === 'pass' && cut > 0 ? 'fail' : v;
    return result(status, status === 'fail' ? `Charging cut out${cut ? ` ${cut} time${cut > 1 ? 's' : ''}` : ''} while the plug moved.` : status === 'pass' ? 'Charged steadily.' : '');
  }

  /* ---------------------------------------------------------------- catalogue and runner */

  const TESTS = {
    screen: { name: 'Screen colours', run: screenTest, how: 'Full-screen colours show dead pixels, lines, stains and burn-in.', page: '/test/dead-pixel-test.html' },
    touch: { name: 'Touch screen', run: touchTest, how: 'Swipe until every square lights up. Dead zones stay dark.', page: '/test/touch-screen-test.html' },
    multitouch: { name: 'Multi-touch', run: multiTouchTest, how: 'Put several fingers down. Each one should get its own dot.', page: '/test/multi-touch-test.html' },
    refresh: { name: 'Refresh rate', run: refreshTest, how: 'Measures how fast the screen redraws: 60, 90 or 120 Hz.', page: '/test/refresh-rate-test.html' },
    speaker: { name: 'Speakers', run: speakerTest, how: 'Left, right and a rising sweep that shows rattles.', page: '/test/speaker-test.html' },
    mic: { name: 'Microphone', run: micTest, how: 'A live level meter and a 3-second recording played back.', page: '/test/microphone-test.html' },
    camera: { name: 'Cameras and flash', run: cameraTest, how: 'Opens each camera the browser can reach, and the flash.', page: '/test/camera-test.html' },
    vibrate: { name: 'Vibration', run: vibrationTest, how: 'A firm buzz and pulses from the motor.', page: '/test/vibration-test.html' },
    sensors: { name: 'Sensors', run: sensorTest, how: 'Tilt, compass and shake, read live.', page: '/test/sensor-test.html' },
    charging: { name: 'Charging port', run: chargingTest, how: 'Shows if charging cuts out while you wiggle the plug.', page: '/test/charging-port-test.html' }
  };
  const ORDER = ['screen', 'touch', 'multitouch', 'refresh', 'speaker', 'mic', 'camera', 'vibrate', 'sensors', 'charging'];

  async function intro(st, id, i, n) {
    st.step(`Test ${i + 1} of ${n}`);
    const t = TESTS[id];
    return st.ask(`<div class="pt-orb pt-orb-sm">${icon(id, 36)}</div><p class="pt-count mono">${i + 1} / ${n}</p><h3>${t.name}</h3><p>${t.how}</p>`, [
      { label: 'Start', value: 'start', cls: 'pt-ok' },
      { label: 'Skip', value: 'skip', cls: 'pt-ghost' }
    ]);
  }

  let running = false;

  async function run(ids) {
    if (running) return;
    running = true;
    const st = new Stage();
    const results = [];
    try {
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        if (ids.length > 1) {
          const go = await intro(st, id, i, ids.length);
          if (go === ABORT) break;
          if (go === 'skip') { results.push({ id, status: 'skip', note: '' }); continue; }
        }
        let r;
        try { r = await TESTS[id].run(st); } catch (e) { r = result('skip', 'This test could not run in this browser.'); }
        if (r === ABORT) break;
        results.push({ id, ...r });
      }
    } finally {
      st.close();
      running = false;
    }
    render(results, ids);
  }

  const MARK = { pass: ['pt-r-ok', 'Works'], fail: ['pt-r-bad', 'Problem'], skip: ['pt-r-skip', 'Skipped'], info: ['pt-r-info', 'Measured'] };

  function summaryText(results) {
    const lines = results.map(r => `${r.status === 'pass' ? 'OK' : r.status === 'fail' ? 'PROBLEM' : r.status === 'info' ? 'INFO' : 'SKIPPED'} - ${TESTS[r.id].name}${r.note ? ': ' + r.note : ''}`);
    return `Phone test results (Knowfone online test)\n${lines.join('\n')}\nTest a phone yourself: ${SITE}/test/`;
  }

  function render(results, ids) {
    const box = document.getElementById('pt-results');
    if (!box) return;
    if (!results.length) { box.hidden = true; return; }
    const fails = results.filter(r => r.status === 'fail').length;
    const passes = results.filter(r => r.status === 'pass').length;
    box.hidden = false;
    box.innerHTML = '';
    const head = el('div', 'pt-res-head');
    head.innerHTML = fails
      ? `<h2>${fails} problem${fails > 1 ? 's' : ''} found</h2><p>Ask the seller about ${fails > 1 ? 'them' : 'it'}, or ask for a lower price. A repair can cost more than the discount.</p>`
      : `<h2>${passes ? 'No problems found' : 'Done'}</h2><p>${passes ? 'What a browser can reach works. Now check what it cannot reach.' : 'Run the tests on the phone you want to check.'}</p>`;
    box.append(head);
    const list = el('ul', 'pt-res-list');
    for (const r of results) {
      const [cls, label] = MARK[r.status] || MARK.skip;
      const li = el('li', cls);
      li.innerHTML = `<span class="pt-res-ic">${icon(r.id, 22)}</span><span class="pt-res-name">${TESTS[r.id].name}<small>${r.note || ''}</small></span><span class="pt-res-tag">${label}</span>`;
      list.append(li);
    }
    box.append(list);
    const row = el('div', 'cta');
    const again = btn('Run again', 'btn btn-ghost');
    again.addEventListener('click', () => run(ids));
    const copy = btn('Copy results', 'btn btn-ghost');
    copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(summaryText(results)); copy.textContent = 'Copied'; } catch (_) { copy.textContent = 'Copy not allowed here'; }
    });
    row.append(again, copy);
    box.append(row);
    const more = el('div', 'pt-more');
    more.innerHTML = '<h3>What a browser cannot see</h3><p>Whether the phone is the model it claims (copies run on a different processor), how worn the battery is, whether the storage is as big as it says, and whether the system was modified. The free Knowfone app checks all of that in about 7 minutes and answers: good to buy, buy only at a lower price, or don\'t buy.</p>' +
      `<div class="cta"><a class="btn btn-primary" href="${APK}">Download Knowfone for Android (free)</a><a class="btn btn-ghost" href="/#install">How to install</a></div>`;
    box.append(more);
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-run]');
    if (!b) return;
    e.preventDefault();
    const what = b.getAttribute('data-run');
    run(what === 'all' ? ORDER : what.split(',').filter(id => TESTS[id]));
  });

  window.KnowfoneTests = { run, TESTS, ORDER };
})();
