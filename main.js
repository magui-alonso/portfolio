/* Magdalena Alonso · Portfolio v2 — movimiento e interacciones
   Todo el movimiento se desactiva si la persona prefiere reducirlo. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var isDesktop = function () { return window.innerWidth > 900; };

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Entrada del hero ---------- */
  var ready = function () { document.body.classList.add('is-ready'); };
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { setTimeout(ready, 120); }); }
  else { setTimeout(ready, 300); }
  setTimeout(ready, 1500); // por si las fuentes tardan

  /* ---------- Apariciones al hacer scroll ---------- */
  var toReveal = $$('.reveal, .sec .line, .tray-open .line, .xp-row');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    toReveal.forEach(function (el) { io.observe(el); });
  } else {
    toReveal.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Menú mobile ---------- */
  var overlay = $('#overlay'), openBtn = $('#menuOpen'), closeBtn = $('#menuClose');
  function setMenu(open) {
    overlay.classList.toggle('is-open', open);
    overlay.setAttribute('aria-hidden', String(!open));
    openBtn.setAttribute('aria-expanded', String(open));
    (open ? closeBtn : openBtn).focus();
  }
  openBtn.addEventListener('click', function () { setMenu(true); });
  closeBtn.addEventListener('click', function () { setMenu(false); });
  overlay.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay.classList.contains('is-open')) setMenu(false); });

  /* ---------- Sección activa en la navegación ---------- */
  var navLinks = $$('.nav a');
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + e.target.id;
          a.classList.toggle('is-active', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) spy.observe(s); });
  }

  /* ---------- Texto que se completa al scrollear ---------- */
  var fill = $('#fill'), words = [];
  if (fill && !reduce) {
    fill.innerHTML = fill.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    words = $$('.w', fill);
  }

  /* ---------- Contadores ---------- */
  $$('[data-count]').forEach(function (el) {
    if (reduce || !('IntersectionObserver' in window)) return;
    var target = +el.dataset.count, pad = +(el.dataset.pad || 0);
    var fmt = function (n) { var s = String(n); while (s.length < pad) s = '0' + s; return s; };
    el.textContent = fmt(0);
    var o = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      o.disconnect();
      var t0 = performance.now(), dur = 1400;
      (function tick(t) {
        var p = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(target * e));
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }, { threshold: 0.6 });
    o.observe(el);
  });

  /* ---------- Cinta cinética ---------- */
  var marquee = $('#marquee');
  marquee.innerHTML += marquee.innerHTML; // duplicado para el bucle
  var mx = 0, dir = 1, velocity = 0;

  /* ---------- Cursor de color + vista previa ---------- */
  var cursor = $('#cursor');
  var preview = $('#preview');
  var mouse = { x: -200, y: -200 }, cur = { x: -200, y: -200 }, prev = { x: -200, y: -200 };
  if (finePointer && !reduce) {
    window.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    /* El cursor se mantiene siempre como un cuadradito chico */
    $$('.item').forEach(function (el) {
      el.addEventListener('mouseenter', function () { preview.style.setProperty('--c', el.dataset.color); if (el.dataset.desktop) { $('#pvDesk').src = el.dataset.desktop; $('#pvMob').src = el.dataset.mobile; } preview.classList.add('is-on'); });
      el.addEventListener('mouseleave', function () { preview.classList.remove('is-on'); });
    });
    /* Botones "magnéticos" */
    $$('.magnetic').forEach(function (m) {
      m.addEventListener('mousemove', function (e) {
        var r = m.getBoundingClientRect();
        m.style.transform = 'translate(' + (e.clientX - r.left - r.width / 2) * 0.3 + 'px,' + (e.clientY - r.top - r.height / 2) * 0.4 + 'px)';
      });
      m.addEventListener('mouseleave', function () { m.style.transform = ''; });
    });
  }

  /* Precarga de las capturas de los sitios */
  $$('.item[data-desktop]').forEach(function (el) { new Image().src = el.dataset.desktop; new Image().src = el.dataset.mobile; });

  /* ---------- Elementos ligados al scroll ---------- */
  var progress = $('#progress');
  var hscroll = $('#hscroll'), htrack = $('#htrack'), hbar = $('#hbar');
  var cards = $$('.card');
  var lastY = window.scrollY;

  function onFrame() {
    var y = window.scrollY, vh = window.innerHeight;
    var delta = y - lastY; lastY = y;

    // Barra de progreso
    var max = document.documentElement.scrollHeight - vh;
    progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';

    if (!reduce) {
      // Cinta: velocidad base + empuje del scroll, cambia de sentido
      if (delta !== 0) dir = delta > 0 ? 1 : -1;
      velocity = lerp(velocity, Math.abs(delta) * 0.6, 0.1);
      mx -= (0.6 + velocity) * dir;
      var half = marquee.scrollWidth / 2;
      if (mx <= -half) mx += half;
      if (mx > 0) mx -= half;
      marquee.style.transform = 'translate3d(' + mx + 'px,0,0)';

      // Enfoque: scroll horizontal
      if (isDesktop()) {
        var r = hscroll.getBoundingClientRect();
        var p = clamp(-r.top / (hscroll.offsetHeight - vh), 0, 1);
        // Distancia hasta que la última tarjeta queda con el mismo margen derecho que el sitio
        var last = htrack.lastElementChild;
        var pad = parseFloat(getComputedStyle(htrack).paddingLeft) || 0;
        var dist = Math.max(0, last.offsetLeft + last.offsetWidth + pad - window.innerWidth);
        htrack.style.transform = 'translate3d(' + (-p * dist) + 'px,0,0)';
        hbar.style.transform = 'scaleX(' + p + ')';
      } else {
        htrack.style.transform = '';
      }

      // Casos: la tarjeta de atrás se achica cuando llega la siguiente
      for (var i = 0; i < cards.length; i++) {
        if (!isDesktop() || i === cards.length - 1) { cards[i].style.transform = ''; continue; }
        var next = cards[i + 1].getBoundingClientRect().top;
        var top = cards[i].getBoundingClientRect().top;
        var k = clamp(1 - (next - top - 20) / (vh * 0.6), 0, 1);
        cards[i].style.transform = 'scale(' + (1 - k * 0.06) + ')';
      }

      // Texto que se completa
      if (words.length) {
        var fr = fill.getBoundingClientRect();
        var fp = clamp((vh * 0.85 - fr.top) / (vh * 0.5), 0, 1);
        var n = Math.round(fp * words.length);
        for (var w = 0; w < words.length; w++) words[w].classList.toggle('on', w < n);
      }

      // Cursor y vista previa (con retraso suave)
      if (finePointer) {
        cur.x = lerp(cur.x, mouse.x, 0.22); cur.y = lerp(cur.y, mouse.y, 0.22);
        var s = cursor.offsetWidth / 2;
        cursor.style.transform = 'translate3d(' + (cur.x - s) + 'px,' + (cur.y - s) + 'px,0)';
        // La vista previa sigue al mouse pero siempre queda completa dentro de la pantalla
        var pw = preview.offsetWidth, ph = preview.offsetHeight, m = 24;
        var tx = clamp(mouse.x + 40, m, window.innerWidth - pw - m);
        var ty = clamp(mouse.y - ph / 2, 84, vh - ph - m);
        prev.x = lerp(prev.x, tx, 0.12); prev.y = lerp(prev.y, ty, 0.12);
        preview.style.transform = 'translate3d(' + prev.x + 'px,' + prev.y + 'px,0) scale(' + (preview.classList.contains('is-on') ? 1 : .8) + ') rotate(' + clamp((tx - prev.x) * 0.02, -3, 3) + 'deg)';
      }
    }
    requestAnimationFrame(onFrame);
  }
  requestAnimationFrame(onFrame);


  /* Casos: todas las tarjetas con la misma altura (la del contenido más largo) */
  function equalizeCards() {
    var list = $$('.card');
    list.forEach(function (c) { c.style.height = ''; });
    if (!isDesktop()) return;
    var h = Math.max.apply(null, list.map(function (c) { return c.offsetHeight; }));
    // Que la tarjeta más baja del apilado deje al menos 56px libres abajo de la pantalla
    var lastTop = 100 + (list.length - 1) * 20;
    var room = window.innerHeight - lastTop - 56;
    // Nunca más baja que el contenido (no se corta el texto)
    if (room > 420 && room > h) h = h;
    list.forEach(function (c) { c.style.height = h + 'px'; });
  }
  equalizeCards();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(equalizeCards);
  window.addEventListener('load', equalizeCards);
  var eqT; window.addEventListener('resize', function () { clearTimeout(eqT); eqT = setTimeout(equalizeCards, 150); });

  /* ---------- Copiar email ---------- */
  var status = $('#copyStatus');
  $('#copyBtn').addEventListener('click', function () {
    var email = $('#email').textContent.trim();
    var say = function (m) { status.textContent = m; setTimeout(function () { status.textContent = ''; }, 2400); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(function () { say('Email copiado.'); }, function () { say('No se pudo copiar. Seleccioná el email y copialo.'); });
    } else { say('No se pudo copiar. Seleccioná el email y copialo.'); }
  });

  /* ---------- Formulario: arma un email ---------- */
  var form = $('#contactForm'), err = $('#formError');
  form.addEventListener('input', function () { err.textContent = ''; });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.elements.name.value.trim(), msg = form.elements.message.value.trim();
    if (!name) { err.textContent = 'Escribí tu nombre.'; form.elements.name.focus(); return; }
    if (!msg) { err.textContent = 'Escribí un mensaje.'; form.elements.message.focus(); return; }
    window.location.href = 'mailto:magui.alonso.g@gmail.com?subject=' + encodeURIComponent('Contacto desde el portfolio · ' + name) + '&body=' + encodeURIComponent(msg + '\n\n' + name);
  });
})();
