/* Gishnu Prasad — Portfolio · scroll engine (no dependencies) */
(() => {
  'use strict';

  const d = document;
  const root = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => Array.from(c.querySelectorAll(s));

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const norm = (v, a, b) => clamp((v - a) / (b - a));
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeIn = t => t * t;
  const easeIO = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const mobile = matchMedia('(max-width: 860px)');

  if (!reduce) root.classList.add('motion');

  /* ------------------------------------------------------------------ *
   * Text splitting
   * ------------------------------------------------------------------ */
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    Array.from(text).forEach((c, i) => {
      const s = d.createElement('span');
      s.className = 'ch';
      s.style.setProperty('--i', i);
      s.textContent = c === ' ' ? ' ' : c;
      el.appendChild(s);
    });
    return $$('.ch', el);
  }

  function splitWords(el, outer, inner) {
    let i = 0;
    const walk = node => {
      Array.from(node.childNodes).forEach(child => {
        if (child.nodeType === 3) {
          const frag = d.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(d.createTextNode(' ')); return; }
            const o = d.createElement('span');
            o.className = outer;
            if (inner) {
              const n = d.createElement('span');
              n.className = inner;
              n.style.setProperty('--i', i);
              n.textContent = part;
              o.appendChild(n);
            } else {
              o.textContent = part;
            }
            i++;
            frag.appendChild(o);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(el);
  }

  $$('.hero [data-chars]').forEach(splitChars);
  const bigLines = $$('.contact__line').map(line => ({ el: line, chars: splitChars(line) }));
  $$('[data-split]').forEach(el => splitWords(el, 'sw', 'sw__i'));
  const fills = $$('[data-fill]').map(el => {
    splitWords(el, 'fw');
    return { el, words: $$('.fw', el), last: -1 };
  });
  $$('[data-stagger]').forEach(el => Array.from(el.children).forEach((c, i) => c.style.setProperty('--i', i)));

  /* ------------------------------------------------------------------ *
   * Fit display type to the viewport
   * ------------------------------------------------------------------ */
  const heroPin = $('.hero__pin');
  const heroName = $('.hero__name');
  const heroWordL = $('.hero__word--l');
  const heroWordR = $('.hero__word--r');
  const contactBig = $('.contact__big');

  function fitType() {
    if (heroPin && heroWordL) {
      heroPin.style.setProperty('--name-size', '100px');
      const w100 = Math.max(heroWordL.getBoundingClientRect().width, heroWordR.getBoundingClientRect().width) || 290;
      const pad = parseFloat(getComputedStyle(heroName).paddingLeft) || 20;
      const vw = heroPin.clientWidth, vh = heroPin.clientHeight;
      const target = mobile.matches ? vw - pad * 2 : (vw - pad * 2 - vw * 0.07) / 2;
      const cap = mobile.matches ? vh * 0.19 : vh * 0.42;
      heroPin.style.setProperty('--name-size', Math.min(100 * target / w100, cap).toFixed(1) + 'px');
    }
    if (contactBig) {
      bigLines.forEach(({ el }) => {
        el.style.setProperty('--fit', '100px');
        const w = el.getBoundingClientRect().width || 500;
        el.style.setProperty('--fit', (100 * contactBig.clientWidth / w).toFixed(1) + 'px');
      });
    }
  }

  /* ------------------------------------------------------------------ *
   * Loader
   * ------------------------------------------------------------------ */
  const loader = $('.loader');
  const loaderCount = $('#loaderCount');
  let ready = false;
  let pageLoaded = d.readyState === 'complete';
  addEventListener('load', () => { pageLoaded = true; fitType(); layout(); });

  function setReady() {
    if (ready) return;
    ready = true;
    if (loaderCount) loaderCount.textContent = '100';
    root.classList.remove('is-loading');
    root.classList.add('is-ready');
    setTimeout(() => { if (loader) loader.style.display = 'none'; }, 1300);
  }

  if (reduce || !loader) {
    setReady();
  } else {
    const t0 = performance.now();
    const DUR = 1500, MAX = 4200;
    const tick = now => {
      if (ready) return;
      const el = now - t0;
      let p = clamp(el / DUR);
      if (!pageLoaded && el < MAX) p = Math.min(p, .93);
      loaderCount.textContent = String(Math.round(easeOut(p) * 100));
      if (p >= 1) { setTimeout(setReady, 180); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(setReady, MAX + 600); // safety net if rAF is throttled
  }

  /* ------------------------------------------------------------------ *
   * Reveal on scroll
   * ------------------------------------------------------------------ */
  const revealEls = $$('[data-reveal], [data-split], [data-stagger]');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
    revealEls.forEach(el => io.observe(el));
  }

  /* Count-up numbers */
  const counters = $$('[data-count]');
  const fmt = (el, v) => (el.dataset.prefix || '') + v + (el.dataset.suffix || '');
  if (!reduce && 'IntersectionObserver' in window) {
    const cio = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        const el = e.target, end = +el.dataset.count, t0 = performance.now(), dur = 1600;
        const step = now => {
          const p = clamp((now - t0) / dur);
          el.textContent = fmt(el, Math.round(easeOut(p) * end));
          if (p < 1) requestAnimationFrame(step);
        };
        el.textContent = fmt(el, 0);
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(el => cio.observe(el));
  }

  /* ------------------------------------------------------------------ *
   * Elements driven by the scroll loop
   * ------------------------------------------------------------------ */
  const nav = $('.nav');
  const navLinks = $$('.nav__links a');
  const themed = $$('main [data-theme]');
  const sections = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
  const scrollbar = $('#scrollbar');

  const hero = $('.hero');
  const heroRole = $('.hero__role');
  const heroFigure = $('.hero__figure');
  const heroMeta = $$('.hero__meta');
  const heroBadge = $('.hero__badge');
  const heroDisc = $('.hero__disc');
  const heroInk = $('.hero__ink');

  const cards = $$('.card');

  const proj = $('.projects');
  const projPin = $('.projects__pin');
  const projTrack = $('.projects__track');
  const projItems = $$('.proj');
  const projBar = $('#projBar');
  const projNow = $('#projNow');

  const marquee = $('.marquee__track');

  let hMode = false, hDist = 0, hx = 0;
  let marqueeW = 0, marqueeX = 0, marqueeDir = -1;
  let hp = 0;                 // smoothed hero progress
  let mx = 0, my = 0, tmx = 0, tmy = 0; // pointer parallax
  let lastY = scrollY, vel = 0, navY = scrollY;

  /* Marquee: clone the set until it comfortably overflows */
  if (marquee) {
    const set = Array.from(marquee.children);
    for (let i = 0; i < 3; i++) set.forEach(n => marquee.appendChild(n.cloneNode(true)));
  }

  let cardsSticky = false;
  let layoutW = 0;

  function layout() {
    layoutW = innerWidth;
    fitType();
    cardsSticky = cards.length > 0 && getComputedStyle(cards[0]).position === 'sticky';

    if (marquee) marqueeW = marquee.scrollWidth / 4;

    if (proj) {
      const want = !reduce && !mobile.matches && innerHeight >= 560;
      proj.classList.toggle('is-h', want);
      hMode = want;
      if (want) {
        hDist = Math.max(0, projTrack.offsetWidth - innerWidth);
        proj.style.height = Math.round(projPin.offsetHeight + hDist) + 'px';
      } else {
        proj.style.height = '';
        projTrack.style.transform = '';
        hDist = 0;
      }
    }
  }

  /* ---------- Hero ---------- */
  function updateHero(vh) {
    if (!hero || reduce) return;
    const total = hero.offsetHeight - vh;
    if (scrollY > hero.offsetHeight + 40) return;

    const target = total > 0 ? clamp(scrollY / total) : 0;
    hp = lerp(hp, target, 0.14);
    if (Math.abs(hp - target) < 0.0004) hp = target;

    mx = lerp(mx, tmx, 0.07);
    my = lerp(my, tmy, 0.07);

    const part = easeIO(norm(hp, 0, 0.58));
    const vw = innerWidth;
    const stacked = mobile.matches;

    // Act 1 — the name opens like a pair of doors
    const dx = part * vw * (stacked ? 1.05 : 0.6);
    const px = mx * -16;
    heroWordL.style.transform = `translate3d(${(-dx + px).toFixed(2)}px,0,0)`;
    heroWordR.style.transform = `translate3d(${(dx + px).toFixed(2)}px,0,0)`;

    heroFigure.style.transform =
      `translate3d(${(mx * 10).toFixed(2)}px,${(hp * 3).toFixed(2)}%,0) scale(${(1 + hp * 0.13).toFixed(4)})`;

    if (heroDisc) heroDisc.style.transform = `scale(${(1 + part * 0.35).toFixed(4)})`;

    // Act 3 — the role line sweeps across in front of the portrait
    if (heroRole) {
      const t = norm(hp, 0.5, 1);
      const end = Math.min(vw * 0.04, vw - heroRole.offsetWidth - vw * 0.03);
      heroRole.style.transform = `translate3d(${lerp(vw * 1.03, end, t).toFixed(1)}px,0,0)`;
    }
    heroPin.style.setProperty('--fade', (1 - norm(hp, 0.05, 0.3)).toFixed(3));

    const fade = 1 - norm(hp, 0.02, 0.2);
    heroMeta.forEach(m => {
      m.style.opacity = fade.toFixed(3);
      m.style.transform = `translate3d(0,${(-hp * 90).toFixed(1)}px,0)`;
      m.style.pointerEvents = fade < 0.3 ? 'none' : '';
    });
    if (heroBadge) {
      heroBadge.style.opacity = (1 - norm(hp, 0.1, 0.32)).toFixed(3);
      heroBadge.style.transform = `translate3d(${(mx * 22).toFixed(2)}px,${(-hp * 160 + my * 14).toFixed(1)}px,0)`;
    }

    // Act 2 — night falls behind the portrait
    const r = easeIO(norm(hp, 0.26, 0.74)) * 150;
    heroInk.style.clipPath = `circle(${r.toFixed(2)}vmax at 50% 62%)`;
    hero.dataset.covered = (r / 100) * Math.max(vw, vh) > Math.hypot(vw / 2, vh * 0.62) * 0.9 ? '1' : '';
  }

  /* ---------- Manifesto word fill ---------- */
  function updateFills(vh) {
    if (reduce) return;
    fills.forEach(f => {
      const r = f.el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      const p = norm(vh * 0.86 - r.top, 0, r.height + vh * 0.36);
      const n = f.words.length;
      const x = Math.round(p * (n + 6) * 20) / 20;
      if (x === f.last) return;
      f.last = x;
      for (let i = 0; i < n; i++) {
        f.words[i].style.opacity = (0.16 + 0.84 * clamp((x - i) / 6)).toFixed(2);
      }
    });
  }

  /* ---------- Stacking cards ---------- */
  function updateCards() {
    if (reduce || !cards.length) return;
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i], next = cards[i + 1];
      if (!next) { c.style.setProperty('--t', '0'); continue; }
      const a = c.getBoundingClientRect().top, b = next.getBoundingClientRect().top;
      const t = cardsSticky ? clamp(1 - (b - a - 14) / c.offsetHeight) : 0;
      c.style.setProperty('--t', t.toFixed(3));
    }
  }

  /* ---------- Horizontal projects ---------- */
  function updateProjects() {
    if (!proj || !hMode) return;
    const r = proj.getBoundingClientRect();
    if (r.bottom < -100 || r.top > innerHeight + 100) return;
    const p = hDist > 0 ? clamp(-r.top / hDist) : 0;
    const tx = -p * hDist;
    hx = lerp(hx, tx, 0.13);
    if (Math.abs(hx - tx) < 0.2) hx = tx;
    projTrack.style.transform = `translate3d(${hx.toFixed(2)}px,0,0)`;
    if (projBar) projBar.style.transform = `scaleX(${p.toFixed(4)})`;

    if (projNow) {
      const mid = innerWidth / 2;
      let best = 0, bestD = Infinity;
      projItems.forEach((el, i) => {
        const dd = Math.abs(el.offsetLeft + el.offsetWidth / 2 + hx - mid);
        if (dd < bestD) { bestD = dd; best = i; }
      });
      const label = String(best + 1).padStart(2, '0');
      if (projNow.textContent !== label) projNow.textContent = label;
    }
  }

  /* ---------- Contact headline ---------- */
  function updateBig(vh) {
    if (reduce || !contactBig) return;
    const r = contactBig.getBoundingClientRect();
    if (r.top > vh + 80 || r.bottom < -80) return;
    const p = norm(vh * 0.98 - r.top, 0, vh * 0.62);
    bigLines.forEach((line, li) => {
      const n = line.chars.length;
      line.chars.forEach((c, i) => {
        const t = easeOut(clamp(p * 2.1 - li * 0.32 - (i / n) * 0.75));
        c.style.transform = `translate3d(0,${((1 - t) * 108).toFixed(1)}%,0)`;
      });
    });
  }

  /* ---------- Marquee ---------- */
  function updateMarquee() {
    if (!marquee || reduce || !marqueeW) return;
    if (Math.abs(vel) > 0.5) marqueeDir = vel > 0 ? -1 : 1;
    marqueeX += (0.7 + Math.min(Math.abs(vel), 60) * 0.32) * marqueeDir;
    if (marqueeX <= -marqueeW) marqueeX += marqueeW;
    if (marqueeX > 0) marqueeX -= marqueeW;
    marquee.style.transform = `translate3d(${marqueeX.toFixed(2)}px,0,0)`;
  }

  /* ---------- Nav state ---------- */
  function updateNav(y, vh) {
    let theme = 'paper';
    for (const s of themed) {
      const r = s.getBoundingClientRect();
      if (r.top <= 36 && r.bottom > 36) theme = s.dataset.theme;
    }
    if (hero && hero.dataset.covered && y < hero.offsetHeight) theme = 'ink';
    if (nav.dataset.theme !== theme) nav.dataset.theme = theme;

    nav.classList.toggle('is-scrolled', !!hero && y > hero.offsetHeight - 80);
    if (!menuOpen) {
      if (y > navY + 8 && y > 240) nav.classList.add('is-hidden');
      else if (y < navY - 8 || y < 240) nav.classList.remove('is-hidden');
    }
    navY = y;

    let active = null;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top <= vh * 0.45) active = i; });
    navLinks.forEach((a, i) => a.classList.toggle('is-active', i === active));

    const max = d.documentElement.scrollHeight - vh;
    if (scrollbar) scrollbar.style.transform = `scaleX(${max > 0 ? clamp(y / max).toFixed(4) : 0})`;
  }

  /* ------------------------------------------------------------------ *
   * Main loop
   * ------------------------------------------------------------------ */
  function step() {
    if (innerWidth !== layoutW) layout();   // width changed (rotate / window resize): re-measure right away
    const y = scrollY, vh = innerHeight;
    vel = lerp(vel, y - lastY, 0.25);
    lastY = y;

    updateHero(vh);
    updateFills(vh);
    updateCards();
    updateProjects();
    updateBig(vh);
    updateMarquee();
    updateNav(y, vh);
    updateCursor();
  }
  function frame() {
    step();
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------------ *
   * Pointer: cursor follower, magnetic buttons, hero parallax
   * ------------------------------------------------------------------ */
  const cursor = $('.cursor');
  const cursorLabel = $('.cursor__label');
  let cx = innerWidth / 2, cy = innerHeight / 2, tcx = cx, tcy = cy;

  function updateCursor() {
    if (!fine || !cursor) return;
    cx = lerp(cx, tcx, 0.22);
    cy = lerp(cy, tcy, 0.22);
    cursor.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
  }

  if (fine) {
    addEventListener('mousemove', e => {
      tcx = e.clientX; tcy = e.clientY;
      tmx = e.clientX / innerWidth - 0.5;
      tmy = e.clientY / innerHeight - 0.5;
      if (cursor) cursor.classList.add('on');
    }, { passive: true });
    d.addEventListener('mouseleave', () => cursor && cursor.classList.remove('on'));

    d.addEventListener('mouseover', e => {
      if (!cursor) return;
      const labelled = e.target.closest('[data-cursor]');
      const link = e.target.closest('a, button, .chips li');
      cursor.classList.toggle('is-label', !!labelled);
      cursor.classList.toggle('is-link', !labelled && !!link);
      if (labelled) cursorLabel.textContent = labelled.dataset.cursor;
    });

    if (!reduce) {
      $$('[data-magnetic]').forEach(el => {
        el.addEventListener('mousemove', e => {
          const r = el.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
          el.style.transition = 'transform .15s ease-out, background-color .4s, color .4s';
          el.style.transform = `translate3d(${(dx * 0.28).toFixed(1)}px,${(dy * 0.4).toFixed(1)}px,0)`;
        });
        el.addEventListener('mouseleave', () => {
          el.style.transition = 'transform .7s cubic-bezier(.22,1,.36,1), background-color .4s, color .4s';
          el.style.transform = '';
        });
      });
    }
  }

  /* ------------------------------------------------------------------ *
   * Menu (small screens)
   * ------------------------------------------------------------------ */
  const burger = $('.nav__burger');
  const menu = $('#menu');
  let menuOpen = false;

  function setMenu(open) {
    menuOpen = open;
    burger.setAttribute('aria-expanded', String(open));
    $('.nav__burger-txt').textContent = open ? 'Close' : 'Menu';
    if (open) {
      menu.hidden = false;
      nav.classList.remove('is-hidden');
      nav.dataset.menu = '1';
      requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('open')));
      d.body.style.overflow = 'hidden';
    } else {
      menu.classList.remove('open');
      delete nav.dataset.menu;
      d.body.style.overflow = '';
      setTimeout(() => { if (!menuOpen) menu.hidden = true; }, reduce ? 0 : 800);
    }
  }
  if (burger && menu) {
    burger.addEventListener('click', () => setMenu(!menuOpen));
    $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) setMenu(false); });
    mobile.addEventListener('change', () => { if (menuOpen) setMenu(false); });
  }

  /* ------------------------------------------------------------------ *
   * Clock + year
   * ------------------------------------------------------------------ */
  const clock = $('#clock');
  if (clock) {
    const f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const tickClock = () => { clock.textContent = f.format(new Date()); };
    tickClock();
    setInterval(tickClock, 1000);
  }
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */
  let resizeT = 0;
  addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(layout, 120);
  });
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(layout);

  layout();
  requestAnimationFrame(frame);
})();
