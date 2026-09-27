/* Andrés Mejía — Portafolio · main.js (IIFE, sin módulos) */
(function () {
  "use strict";

  var BRAND = window.__BRAND__ || {};
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  /* ---------- Smooth anchors (native scroll) ---------- */
  function initAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      closeMenu();
      var nav = $("[data-nav] .nav__inner");
      var navH = nav ? nav.getBoundingClientRect().bottom + 12 : 88;
      window.scrollTo({
        top: id === "#inicio" ? 0 : el.getBoundingClientRect().top + window.scrollY - navH + 1,
        behavior: reduced ? "auto" : "smooth"
      });
    });
  }

  /* ---------- Nav: scrolled state + active link ---------- */
  function initNav() {
    var nav = $("[data-nav]");
    var ticking = false;
    function onScroll() {
      if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 24);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    var links = $$("[data-navlink]");
    var map = {};
    links.forEach(function (l) { map[l.getAttribute("href").slice(1)] = l; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (l) { l.classList.remove("is-active"); });
          map[en.target.id].classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    $$("main section[id]").forEach(function (s) { io.observe(s); });
  }

  /* ---------- Mobile menu ---------- */
  function closeMenu() {
    var b = $("[data-burger]");
    document.body.classList.remove("menu-open");
    if (b) { b.setAttribute("aria-expanded", "false"); b.setAttribute("aria-label", "Abrir menú"); }
    var m = $("[data-menu]"); if (m) m.setAttribute("aria-hidden", "true");
  }
  function initMenu() {
    var b = $("[data-burger]");
    var m = $("[data-menu]");
    if (!b || !m) return;
    b.addEventListener("click", function () {
      var open = !document.body.classList.contains("menu-open");
      document.body.classList.toggle("menu-open", open);
      b.setAttribute("aria-expanded", String(open));
      b.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      m.setAttribute("aria-hidden", String(!open));
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
    window.addEventListener("resize", function () { if (window.innerWidth > 1040) closeMenu(); });
  }

  /* ---------- Scramble decode for hero role ---------- */
  function initScramble() {
    var el = $("[data-scramble]");
    if (!el || el.dataset.scrambled) return;
    el.dataset.scrambled = "1";
    var final = el.textContent;
    el.setAttribute("aria-label", final);
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/{}[]=+*#01";
    var start = null, dur = 1600, delay = 750;
    function frame(t) {
      if (start === null) start = t;
      var p = Math.min(1, Math.max(0, (t - start - delay) / dur));
      var reveal = Math.floor(p * final.length);
      var out = "";
      for (var i = 0; i < final.length; i++) {
        var c = final[i];
        if (i < reveal || c === " " || c === "|" || c === "&") out += c;
        else out += chars[(Math.random() * chars.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = final;
    }
    requestAnimationFrame(frame);
    setTimeout(function () { el.textContent = final; }, delay + dur + 800); // safety
  }

  /* ---------- Reveals (threshold ≤ .05 + 6s safety) ---------- */
  function initReveals() {
    var els = $$(".reveal");
    $$(".skills__cards, .contact__right").forEach(function (grid) {
      $$(":scope > .reveal", grid).forEach(function (el, i) { el.style.setProperty("--d", (i * 0.09) + "s"); });
    });
    if (!("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add("is-visible"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      $$(".reveal:not(.is-visible)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-visible");
      });
    }, 6000);
  }

  /* ---------- Section titles type themselves when they enter the viewport ---------- */
  function initTyping() {
    var titles = $$("[data-type]");
    if (!titles.length) return;
    function finish(el) {
      el.textContent = el.dataset.full;
      el.classList.remove("is-typing");
      el.classList.add("is-typed");
      el.style.minHeight = "";
    }
    if (reduced || !("IntersectionObserver" in window)) {
      titles.forEach(function (el) { el.classList.add("is-typed"); });
      return;
    }
    titles.forEach(function (el) {
      if (el.dataset.full) return;
      el.dataset.full = el.textContent.trim();
      el.setAttribute("aria-label", el.dataset.full);
      // Only blank titles that start below the fold, so nothing visible disappears
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.style.minHeight = el.offsetHeight + "px";
        el.textContent = "";
        el.dataset.pending = "1";
      } else {
        el.classList.add("is-typed");
      }
    });
    function type(el) {
      if (!el.dataset.pending) return;
      delete el.dataset.pending;
      el.classList.add("is-typing");
      var full = el.dataset.full, i = 0;
      var step = Math.max(28, Math.min(60, 1400 / full.length));
      (function tick() {
        i++;
        el.textContent = full.slice(0, i);
        if (i < full.length) setTimeout(tick, step);
        else finish(el);
      })();
      setTimeout(function () { if (el.classList.contains("is-typing")) finish(el); }, step * full.length + 1500);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { type(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.01, rootMargin: "0px 0px -10% 0px" });
    titles.forEach(function (el) { if (el.dataset.pending) io.observe(el); });
    // Safety: anything already scrolled past gets its full text
    setTimeout(function () {
      titles.forEach(function (el) {
        if (el.dataset.pending && el.getBoundingClientRect().top < window.innerHeight) type(el);
      });
    }, 6000);
  }

  /* ---------- Work gallery: 3D coverflow ---------- */
  function initGallery() {
    var root = $("[data-gallery]");
    if (!root || root.dataset.bound) return;
    root.dataset.bound = "1";
    var stage = $("[data-gallery-stage]", root);
    var info = $("[data-gallery-info]", root);
    var count = $("[data-gallery-count]", root);
    var cards = $$(".gcard", stage);
    var n = cards.length;
    if (!n) return;
    var active = 0, timer = null, hovering = false, inView = false, dragged = false;

    function offset(i) {
      var d = i - active;
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;
      return d;
    }
    function layout() {
      var cw = cards[0].offsetWidth || 500;
      var spread = cw * (window.innerWidth < 640 ? 0.74 : 0.58);
      cards.forEach(function (c, i) {
        var d = offset(i), a = Math.abs(d);
        c.style.transform = "translateX(" + (d * spread).toFixed(1) + "px) translateZ(" + (-a * 170) + "px) rotateY(" + (-d * 9) + "deg) scale(" + (1 - a * 0.06).toFixed(3) + ")";
        c.style.opacity = a > 2 ? "0" : String(1 - a * 0.12);
        c.style.zIndex = String(10 - a);
        c.style.pointerEvents = a > 2 ? "none" : "";
        c.classList.toggle("is-active", d === 0);
        c.setAttribute("aria-hidden", d === 0 ? "false" : "true");
      });
    }
    function renderInfo(animate) {
      var meta = $(".gcard__meta", cards[active]);
      var apply = function () {
        info.innerHTML = meta ? meta.innerHTML : "";
        if (count) count.textContent = pad(active + 1) + " / " + pad(n);
        info.classList.remove("is-changing");
      };
      if (!animate) return apply();
      info.classList.add("is-changing");
      setTimeout(apply, 260);
    }
    function go(i) {
      active = (i + n) % n;
      layout();
      renderInfo(true);
      restart();
    }
    function next() { go(active + 1); }
    function prev() { go(active - 1); }
    function restart() {
      clearInterval(timer);
      if (reduced) return;
      timer = setInterval(function () {
        if (!hovering && inView && !document.hidden) go(active + 1);
      }, 5000);
    }

    cards.forEach(function (c, i) {
      c.addEventListener("click", function () {
        if (dragged) return;
        if (i === active) {
          var url = c.getAttribute("data-url");
          if (url) window.open(url, "_blank", "noopener");
        } else go(i);
      });
    });
    var p = $("[data-gallery-prev]", root), nx = $("[data-gallery-next]", root);
    if (p) p.addEventListener("click", prev);
    if (nx) nx.addEventListener("click", next);
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    });
    root.addEventListener("mouseover", function () { hovering = true; });
    root.addEventListener("mouseout", function (e) { if (!root.contains(e.relatedTarget)) hovering = false; });

    // Swipe / drag
    var sx = null;
    stage.addEventListener("pointerdown", function (e) { sx = e.clientX; dragged = false; });
    stage.addEventListener("pointermove", function (e) {
      if (sx === null) return;
      if (Math.abs(e.clientX - sx) > 8) { dragged = true; stage.classList.add("is-dragging"); }
    });
    function end(e) {
      if (sx === null) return;
      var dx = e.clientX - sx;
      sx = null;
      stage.classList.remove("is-dragging");
      if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); }
      setTimeout(function () { dragged = false; }, 50);
    }
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
    stage.addEventListener("pointerleave", function (e) { if (sx !== null) end(e); });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }, { threshold: 0.05 }).observe(root);
    } else inView = true;

    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(layout, 120); });

    layout();
    renderInfo(false);
    restart();
  }

  /* ---------- Trait card deck (tap / auto-cycle) ---------- */
  function initTraits() {
    var deck = $("[data-traits]");
    if (!deck || deck.dataset.bound) return;
    deck.dataset.bound = "1";
    var order = $$(".trait", deck);
    var busy = false, hovering = false, inView = false;
    function apply() {
      order.forEach(function (c, pos) {
        c.style.setProperty("--i", String(pos));
        c.style.opacity = pos >= 3 ? "0" : "1";
        c.tabIndex = pos === 0 ? 0 : -1;
        c.setAttribute("aria-hidden", pos === 0 ? "false" : "true");
      });
    }
    function cycle() {
      if (busy) return;
      busy = true;
      var top = order[0];
      top.classList.add("is-flying");
      setTimeout(function () {
        top.classList.remove("is-flying");
        order.push(order.shift());
        apply();
        busy = false;
      }, reduced ? 0 : 420);
    }
    deck.addEventListener("click", cycle);
    deck.addEventListener("mouseover", function () { hovering = true; });
    deck.addEventListener("mouseout", function (e) { if (!deck.contains(e.relatedTarget)) hovering = false; });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }, { threshold: 0.05 }).observe(deck);
    }
    if (!reduced) setInterval(function () { if (inView && !hovering && !document.hidden) cycle(); }, 3200);
    apply();
  }

  /* ---------- Floating "send me a message" window ---------- */
  function initMessage() {
    var msg = $("[data-msg]");
    if (!msg) return;
    msg.setAttribute("aria-hidden", "true");
    function open() {
      msg.classList.remove("is-min");
      msg.classList.add("is-open");
      msg.setAttribute("aria-hidden", "false");
      setTimeout(function () { var f = $("input[name=nombre]", msg); if (f) f.focus({ preventScroll: true }); }, 350);
    }
    function close() {
      msg.classList.remove("is-open");
      msg.setAttribute("aria-hidden", "true");
    }
    $$("[data-open-message]").forEach(function (b) { b.addEventListener("click", open); });
    var c = $("[data-msg-close]", msg), m = $("[data-msg-min]", msg);
    if (c) c.addEventListener("click", close);
    if (m) m.addEventListener("click", function () { msg.classList.toggle("is-min"); });
    $(".msg__bar", msg).addEventListener("click", function (e) {
      if (msg.classList.contains("is-min") && !e.target.closest("button")) msg.classList.remove("is-min");
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && msg.classList.contains("is-open")) close(); });
  }

  /* ---------- Hero parallax (GSAP ScrollTrigger) ---------- */
  function initHero() {
    if (!window.gsap || !window.ScrollTrigger) return;
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.gsap.to("[data-hero-person]", {
      yPercent: 10, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
    window.gsap.to("[data-hero-marquee]", {
      xPercent: -12, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
    if (window.innerWidth > 1100) {
      window.gsap.to(".hero__content", {
        opacity: 0.2, y: -40, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true }
      });
    }
  }

  /* ---------- Contact form ---------- */
  function initForm() {
    var form = $("[data-form]");
    if (!form) return;
    var status = $("[data-form-status]", form);
    var submit = $("[data-submit]", form);
    var label = $("[data-submit-label]", form);
    var waBtn = $("[data-wa-send]", form);

    function setStatus(msg, kind) {
      status.textContent = msg;
      status.classList.remove("is-ok", "is-err");
      if (kind) status.classList.add(kind);
    }
    function values() {
      return { nombre: form.nombre.value.trim(), email: form.email.value.trim(), mensaje: form.mensaje.value.trim() };
    }
    function validate(requireEmail) {
      var v = values();
      var ok = true;
      [["nombre", v.nombre.length > 1], ["email", !requireEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)], ["mensaje", v.mensaje.length > 3]]
        .forEach(function (pair) {
          var f = form[pair[0]].closest(".mfield");
          f.classList.toggle("is-invalid", !pair[1]);
          if (!pair[1]) ok = false;
        });
      if (!ok) setStatus("Revisa los campos marcados, por favor.", "is-err");
      return ok ? v : null;
    }
    $$("input, textarea", form).forEach(function (i) {
      i.addEventListener("input", function () { var f = i.closest(".mfield"); if (f) f.classList.remove("is-invalid"); });
    });

    function mailtoFallback(v) {
      var body = "Nombre: " + v.nombre + "\nEmail: " + v.email + "\n\n" + v.mensaje;
      window.location.href = "mailto:" + (BRAND.email || "aemejiacastro@gmail.com") +
        "?subject=" + encodeURIComponent("Contacto desde el portafolio — " + v.nombre) +
        "&body=" + encodeURIComponent(body);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form._honey && form._honey.value) return;
      var v = validate(true);
      if (!v) return;
      submit.disabled = true;
      label.textContent = "Enviando…";
      setStatus("", null);

      if (!window.fetch || !BRAND.formEndpoint) { mailtoFallback(v); submit.disabled = false; label.textContent = "Enviar mensaje"; return; }

      fetch(BRAND.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          name: v.nombre, email: v.email, message: v.mensaje,
          _subject: "Nuevo mensaje desde el portafolio — " + v.nombre,
          _template: "table"
        })
      })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (res.ok && String(res.j.success) !== "false") {
            form.reset();
            setStatus("¡Gracias! Tu mensaje llegó. Te respondo pronto.", "is-ok");
          } else {
            throw new Error("endpoint");
          }
        })
        .catch(function () {
          setStatus("No se pudo enviar desde aquí. Abriendo tu correo para enviarlo directamente…", "is-err");
          setTimeout(function () { mailtoFallback(v); }, 900);
        })
        .then(function () { submit.disabled = false; label.textContent = "Enviar mensaje"; });
    });

    if (waBtn) {
      waBtn.addEventListener("click", function () {
        var v = validate(false);
        if (!v) return;
        var txt = "Hola Andrés, soy " + v.nombre + (v.email ? " (" + v.email + ")" : "") + ".\n\n" + v.mensaje;
        window.open("https://wa.me/" + (BRAND.whatsapp || "50581971137") + "?text=" + encodeURIComponent(txt), "_blank", "noopener");
        setStatus("Abriendo WhatsApp…", "is-ok");
      });
    }
  }

  /* ---------- Theme toggle with circular reveal ---------- */
  function initTheme() {
    var btn = $("[data-theme-toggle]");
    if (!btn) return;
    var root = document.documentElement;
    var meta = $('meta[name="theme-color"]');
    function sync() {
      var light = root.getAttribute("data-theme") === "light";
      btn.setAttribute("aria-label", light ? "Cambiar a modo oscuro" : "Cambiar a modo claro");
      if (meta) meta.setAttribute("content", light ? "#dcdde0" : "#121317");
    }
    function apply(next) {
      root.classList.add("theme-switching");
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("am-theme", next); } catch (e) {}
      sync();
    }
    sync();
    btn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      var r = btn.getBoundingClientRect();
      var x = r.left + r.width / 2, y = r.top + r.height / 2;
      var end = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      var done = function () { requestAnimationFrame(function () { root.classList.remove("theme-switching"); }); };
      if (!document.startViewTransition || reduced) { apply(next); done(); return; }
      var vt = document.startViewTransition(function () { apply(next); });
      vt.ready.then(function () {
        root.animate(
          { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + end + "px at " + x + "px " + y + "px)"] },
          { duration: 750, easing: "cubic-bezier(.65, 0, .35, 1)", pseudoElement: "::view-transition-new(root)" }
        );
      }).catch(function () {});
      vt.finished.then(done, done);
    });
  }

  function initYear() {
    var y = $("[data-year]");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  function boot() {
    safe(initAnchors, "initAnchors");
    safe(initTheme, "initTheme");
    safe(initNav, "initNav");
    safe(initMenu, "initMenu");
    safe(initScramble, "initScramble");
    safe(initReveals, "initReveals");
    safe(initTyping, "initTyping");
    safe(initGallery, "initGallery");
    safe(initTraits, "initTraits");
    safe(initMessage, "initMessage");
    safe(initHero, "initHero");
    safe(initForm, "initForm");
    safe(initYear, "initYear");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
