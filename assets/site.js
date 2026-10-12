// Internet Doctor — site. No cookies, no counters: only the demo, scroll reveal and a language hint.
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Header border once the page scrolls.
  var top = document.querySelector(".top");
  function onScroll() { top.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Reveal blocks as they come into view.
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  // "How it thinks": walks the chain node by node, then shows the verdict.
  var demo = document.getElementById("demo");
  if (demo) {
    var data = JSON.parse(demo.getAttribute("data-demo"));
    var tabs = demo.querySelectorAll("[data-sc]");
    var nodes = demo.querySelectorAll(".chain li");
    var verdict = demo.querySelector(".verdict");
    var wait = demo.querySelector(".v-wait");
    var body = demo.querySelector(".v-body");
    var icons = { ok: "i-check", warn: "i-alert", bad: "i-x", na: "i-dash" };
    var timers = [];
    var current = "wifi";
    var started = false;

    function svg(id) { return '<svg><use href="#' + id + '"/></svg>'; }
    function clear() { timers.forEach(clearTimeout); timers = []; }
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

    function showVerdict(sc) {
      verdict.setAttribute("data-tone", sc.tone);
      demo.querySelector(".v-ico").innerHTML = svg(sc.tone === "ok" ? "i-check" : sc.tone === "warn" ? "i-alert" : "i-x");
      demo.querySelector(".v-eyebrow").textContent = sc.eyebrow;
      demo.querySelector(".v-title").textContent = sc.title;
      demo.querySelector(".v-text").textContent = sc.text;
      var where = demo.querySelector(".v-where");
      where.hidden = !sc.where;
      where.querySelector("span").textContent = sc.where || "";
      var list = demo.querySelector(".v-steps");
      var items = sc.steps || sc.enough;
      list.classList.toggle("enough", !sc.steps);
      demo.querySelector(".v-side-h").textContent = demo.getAttribute(sc.steps ? "data-todo" : "data-enough");
      list.innerHTML = "";
      items.forEach(function (t) { var li = document.createElement("li"); li.textContent = t; list.appendChild(li); });
      wait.hidden = true;
      body.hidden = false;
      // Restart the entrance animation.
      body.style.animation = "none"; void body.offsetWidth; body.style.animation = "";
    }

    function run(key) {
      clear();
      current = key;
      var sc = data[key];
      var states = sc.nodes.split(" ");
      tabs.forEach(function (t) { t.setAttribute("aria-selected", t.getAttribute("data-sc") === key ? "true" : "false"); });
      nodes.forEach(function (li) { li.className = ""; li.querySelector(".badge").innerHTML = ""; });
      body.hidden = true;
      wait.hidden = false;
      var step = reduce ? 0 : 380;
      var stopAt = states.length;
      // A hard failure ends the walk: nodes after it can't be reached.
      for (var i = 0; i < states.length; i++) { if (states[i] === "bad") { stopAt = i + 1; break; } }
      states.forEach(function (s, i) {
        var li = nodes[i];
        later(function () {
          if (i < stopAt) { li.classList.add("busy"); if (i > 0) li.classList.add("lit"); }
        }, i * step);
        later(function () {
          li.classList.remove("busy");
          li.classList.add("s-" + s);
          if (i > 0 && s !== "na") li.classList.add("lit");
          li.querySelector(".badge").innerHTML = svg(icons[s]);
        }, (i < stopAt ? i * step + step * 0.8 : stopAt * step));
      });
      later(function () { showVerdict(sc); }, stopAt * step + (reduce ? 0 : 300));
    }

    tabs.forEach(function (t) {
      t.addEventListener("click", function () { started = true; run(t.getAttribute("data-sc")); });
    });
    demo.querySelector(".replay").addEventListener("click", function () { run(current); });

    // Arrow keys move between scenario tabs.
    demo.querySelector(".tabs").addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var list = Array.prototype.slice.call(tabs);
      var i = list.indexOf(document.activeElement);
      if (i < 0) return;
      var next = list[(i + (e.key === "ArrowRight" ? 1 : list.length - 1)) % list.length];
      next.focus(); next.click();
    });

    if ("IntersectionObserver" in window) {
      var dio = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && !started) { started = true; run(current); dio.disconnect(); }
      }, { threshold: 0.35 });
      dio.observe(demo);
    } else {
      run(current);
    }
  }

  // Count the stats up once.
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && !reduce) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target, end = +el.getAttribute("data-count"), t0 = null;
        function tick(t) {
          if (!t0) t0 = t;
          var p = Math.min(1, (t - t0) / 1100);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        }
        el.textContent = "0";
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  // Remember an explicit language choice; offer the other language once if the browser prefers it.
  var b = document.body;
  var lang = b.getAttribute("data-lang");
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  document.querySelectorAll("[data-lang]").forEach(function (a) {
    if (a === b) return;
    a.addEventListener("click", function () { store("lang", a.getAttribute("data-lang")); });
  });
  var chosen = read("lang");
  var prefersRu = (navigator.languages || [navigator.language || ""]).some(function (l) { return /^(ru|be|uk|kk)\b/i.test(l); });
  var wants = prefersRu ? "ru" : "en";
  if (!chosen && wants !== lang && !read("suggested")) {
    store("suggested", "1");
    var bar = document.createElement("div");
    bar.className = "suggest";
    bar.setAttribute("role", "status");
    var a = document.createElement("a");
    a.href = b.getAttribute("data-other");
    a.textContent = b.getAttribute("data-suggest-btn");
    a.addEventListener("click", function () { store("lang", wants); });
    var x = document.createElement("button");
    x.type = "button"; x.setAttribute("aria-label", "×"); x.textContent = "×";
    x.addEventListener("click", function () { bar.classList.remove("on"); store("lang", lang); });
    var span = document.createElement("span");
    span.textContent = b.getAttribute("data-suggest");
    bar.appendChild(span); bar.appendChild(a); bar.appendChild(x);
    b.appendChild(bar);
    setTimeout(function () { bar.classList.add("on"); }, 1200);
  }
})();
