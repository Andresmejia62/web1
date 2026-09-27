/* Andrés Mejía — Portafolio · main.js (IIFE, sin módulos) */
(function () {
  "use strict";

  var BRAND = window.__BRAND__ || {};
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ---------- Single rAF loop ---------- */
  var updaters = [];
  function addUpdater(fn) { updaters.push(fn); }
  function loop(t) { for (var i = 0; i < updaters.length; i++) updaters[i](t); requestAnimationFrame(loop); }

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

  /* ---------- Nav: scrolled state, progress, active link ---------- */
  function initNav() {
    var nav = $("[data-nav]");
    var bar = $("[data-progress]");
    var ticking = false;
    function onScroll() {
      var y = window.scrollY;
      if (nav) nav.classList.toggle("is-scrolled", y > 24);
      if (bar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.setProperty("--p", max > 0 ? (y / max).toFixed(4) : 0);
      }
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
    window.addEventListener("resize", function () { if (window.innerWidth > 920) closeMenu(); });
  }

  /* ---------- Mouse-reactive gradient (drifts on its own on touch) ---------- */
  function initGradient() {
    var g = $("[data-mouse-gradient]");
    if (!g) return;
    var tx = 62, ty = 38, x = tx, y = ty, lastMove = 0;
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      tx = (e.clientX / window.innerWidth) * 100;
      ty = (e.clientY / window.innerHeight) * 100;
      lastMove = performance.now();
    }, { passive: true });
    addUpdater(function (t) {
      // idle drift when no mouse input (touch devices, or mouse still)
      if (t - lastMove > 2500) {
        var s = t / 1000;
        tx = 55 + Math.sin(s * 0.35) * 18;
        ty = 40 + Math.cos(s * 0.28) * 14;
      }
      x += (tx - x) * 0.05;
      y += (ty - y) * 0.05;
      if (window.scrollY < window.innerHeight * 1.2) {
        g.style.setProperty("--mx", x.toFixed(2) + "%");
        g.style.setProperty("--my", y.toFixed(2) + "%");
      }
    });
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
    // stagger siblings inside grids
    $$(".skills__grid, .stats, .projects, .contact__grid").forEach(function (grid) {
      $$(":scope > .reveal", grid).forEach(function (el, i) { el.style.setProperty("--d", (i * 0.09) + "s"); });
    });
    if (!("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add("is-visible"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          io.unobserve(en.target);
          if (en.target.classList.contains("stats")) countUp(en.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      $$(".reveal:not(.is-visible)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-visible");
      });
    }, 6000);
  }

  /* ---------- Count-up ---------- */
  function countUp(root) {
    $$("[data-count]", root).forEach(function (el) {
      if (el.dataset.counted) return;
      el.dataset.counted = "1";
      var to = parseInt(el.dataset.count, 10) || 0;
      var t0 = null, dur = 1400;
      el.textContent = "0";
      function step(t) {
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(to * e));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      setTimeout(function () { el.textContent = String(to); }, dur + 500);
    });
  }

  /* ---------- Project accordion ---------- */
  function initProjects() {
    $$(".project").forEach(function (p, i) {
      var btn = $(".project__row", p);
      if (!btn || btn.dataset.bound) return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", function () {
        var open = !p.classList.contains("is-open");
        $$(".project.is-open").forEach(function (o) {
          if (o !== p) { o.classList.remove("is-open"); $(".project__row", o).setAttribute("aria-expanded", "false"); }
        });
        p.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", String(open));
      });
    });
  }

  /* ---------- Floating preview over closed project rows (desktop) ---------- */
  function initFloatPreview() {
    if (!canHover) return;
    var fp = $("[data-float-preview]");
    if (!fp) return;
    var img = $("img", fp);
    var tx = 0, ty = 0, x = 0, y = 0, on = false;
    function show(row) {
      var p = row.closest(".project");
      if (!p || p.classList.contains("is-open") || window.innerWidth <= 920) return hide();
      var src = row.getAttribute("data-preview");
      if (src && img.getAttribute("src") !== src) img.setAttribute("src", src);
      on = true; fp.classList.add("is-on");
    }
    function hide() { on = false; fp.classList.remove("is-on"); }
    $$(".project__row[data-preview]").forEach(function (row) {
      row.addEventListener("mouseover", function (e) {
        if (row.contains(e.relatedTarget)) return;
        tx = x = e.clientX + 28; ty = y = e.clientY - 90;
        show(row);
      });
      row.addEventListener("mouseout", function (e) { if (!row.contains(e.relatedTarget)) hide(); });
      row.addEventListener("pointermove", function (e) { tx = e.clientX + 28; ty = e.clientY - 90; });
      row.addEventListener("click", hide);
    });
    window.addEventListener("scroll", function () { if (on) hide(); }, { passive: true });
    addUpdater(function () {
      if (!on) return;
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      fp.style.setProperty("--fx", x.toFixed(1) + "px");
      fp.style.setProperty("--fy", y.toFixed(1) + "px");
    });
  }

  /* ---------- Cursor spotlight on cards ---------- */
  function initSpotlight() {
    if (!canHover) return;
    $$("[data-spot]").forEach(function (card) {
      if (card.dataset.spotBound) return;
      card.dataset.spotBound = "1";
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--sx", (e.clientX - r.left) + "px");
        card.style.setProperty("--sy", (e.clientY - r.top) + "px");
      });
    });
  }

  /* ---------- Magnetic buttons ---------- */
  function initMagnetic() {
    if (!canHover) return;
    $$("[data-magnetic]").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        b.style.setProperty("--mx", (dx * 0.22).toFixed(1) + "px");
        b.style.setProperty("--my", (dy * 0.3).toFixed(1) + "px");
      });
      b.addEventListener("pointerleave", function () {
        b.style.setProperty("--mx", "0px");
        b.style.setProperty("--my", "0px");
      });
    });
  }

  /* ---------- Timeline rail fill (GSAP ScrollTrigger, with fallback) ---------- */
  function initTimeline() {
    var tl = $("[data-timeline]");
    var rail = $("[data-rail]");
    if (!tl || !rail) return;
    if (window.gsap && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      window.ScrollTrigger.create({
        trigger: tl,
        start: "top 70%",
        end: "bottom 60%",
        scrub: 0.4,
        onUpdate: function (self) { rail.style.setProperty("--rail", self.progress.toFixed(3)); }
      });
      // hero: portrait sinks slower, name marquee drifts sideways, content fades
      window.gsap.to("[data-hero-person]", {
        yPercent: 10, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
      window.gsap.to("[data-hero-marquee]", {
        xPercent: -12, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
      window.gsap.to(".hero__content", {
        opacity: 0.2, y: -40, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true }
      });
    } else {
      window.addEventListener("scroll", function () {
        var r = tl.getBoundingClientRect();
        var vh = window.innerHeight;
        var p = (vh * 0.7 - r.top) / (r.height);
        rail.style.setProperty("--rail", Math.max(0, Math.min(1, p)).toFixed(3));
      }, { passive: true });
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
      return {
        nombre: form.nombre.value.trim(),
        email: form.email.value.trim(),
        mensaje: form.mensaje.value.trim()
      };
    }
    function validate(requireEmail) {
      var v = values();
      var ok = true;
      [["nombre", v.nombre.length > 1], ["email", !requireEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)], ["mensaje", v.mensaje.length > 3]]
        .forEach(function (pair) {
          var f = form[pair[0]].closest(".field");
          f.classList.toggle("is-invalid", !pair[1]);
          if (!pair[1]) ok = false;
        });
      if (!ok) setStatus("Revisa los campos marcados, por favor.", "is-err");
      return ok ? v : null;
    }
    $$("input, textarea", form).forEach(function (i) {
      i.addEventListener("input", function () { i.closest(".field") && i.closest(".field").classList.remove("is-invalid"); });
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
      if (meta) meta.setAttribute("content", light ? "#e7e8ec" : "#07080d");
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
    safe(initGradient, "initGradient");
    safe(initScramble, "initScramble");
    safe(initReveals, "initReveals");
    safe(initProjects, "initProjects");
    safe(initFloatPreview, "initFloatPreview");
    safe(initSpotlight, "initSpotlight");
    safe(initMagnetic, "initMagnetic");
    safe(initTimeline, "initTimeline");
    safe(initForm, "initForm");
    safe(initYear, "initYear");
    requestAnimationFrame(loop);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
