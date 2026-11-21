/*
 * tracking.js — Hub Advance
 * Único ficheiro de rastreio (Meta Pixel + Google Analytics 4), com aviso de cookies.
 * Os IDs ficam só aqui, em CONFIG. Se mudar de pixel, altera apenas estas linhas.
 *
 * Ligar a cada página, dentro do <head>:
 *   <script src="/tracking.js" defer></script>
 *
 * O Pixel e o Analytics só carregam DEPOIS de a pessoa clicar em "Aceitar".
 * Os eventos feitos antes disso ficam em espera e seguem se ela aceitar.
 */
(function () {
  "use strict";

  var CONFIG = {
    META_PIXEL_ID: "1644173373834188", // 15 a 16 dígitos
    GA4_ID: "G-GFPZYCCMYS"             // começa por G-
  };

  var CONSENT_KEY = "ha_cookies"; // "sim" | "nao"

  var metaOk = /^\d{15,16}$/.test(CONFIG.META_PIXEL_ID);
  var ga4Ok = /^G-[A-Z0-9]+$/.test(CONFIG.GA4_ID) && CONFIG.GA4_ID !== "G-XXXXXXXXXX";

  var GA_MAP = {
    Lead: "generate_lead",
    CompleteRegistration: "sign_up",
    InitiateCheckout: "begin_checkout",
    Purchase: "purchase",
    ViewContent: "view_item"
  };

  var loaded = false;
  var fila = [];

  function lerConsent() { try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; } }
  function guardarConsent(v) { try { localStorage.setItem(CONSENT_KEY, v); } catch (e) {} }

  // ---------- Carregar Meta Pixel + GA4 (só depois de aceitar) ----------
  function carregar() {
    if (loaded) return;
    loaded = true;

    if (metaOk) {
      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
        t = b.createElement(e); t.async = !0; t.src = v;
        s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      fbq("init", CONFIG.META_PIXEL_ID);
      fbq("track", "PageView");
    }

    if (ga4Ok) {
      var g = document.createElement("script");
      g.async = true;
      g.src = "https://www.googletagmanager.com/gtag/js?id=" + CONFIG.GA4_ID;
      document.head.appendChild(g);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      gtag("js", new Date());
      gtag("config", CONFIG.GA4_ID);
    }

    // enviar os eventos que ficaram em espera
    while (fila.length) { enviar(fila.shift()); }
  }

  function enviar(ev) {
    if (metaOk && window.fbq) fbq("track", ev.name, ev.params || {});
    if (ga4Ok && window.gtag) gtag("event", GA_MAP[ev.name] || ev.name, ev.params || {});
  }

  // ---------- Eventos ----------
  // Uso nas páginas: track("Lead"), track("Purchase", { value: 27, currency: "EUR" })
  // Eventos padrão da Meta: Lead, CompleteRegistration, InitiateCheckout, Purchase, ViewContent
  window.track = function (name, params) {
    var ev = { name: name, params: params };
    if (loaded) enviar(ev);
    else if (lerConsent() !== "nao") fila.push(ev); // espera pela resposta ao aviso
  };

  // Atalho sem JavaScript extra: <a data-track="Lead">…</a> regista o clique.
  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("[data-track]");
    if (el) window.track(el.getAttribute("data-track"));
  });

  // ---------- Aviso de cookies ----------
  function mostrarAviso() {
    var bar = document.createElement("div");
    bar.setAttribute("role", "dialog");
    bar.setAttribute("aria-label", "Aviso de cookies");
    bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#16181d;color:#f1efe9;" +
      "padding:16px 20px;font:14px/1.5 Helvetica,Arial,sans-serif;display:flex;gap:16px;align-items:center;" +
      "justify-content:center;flex-wrap:wrap;box-shadow:0 -4px 20px rgba(0,0,0,.25)";
    var txt = document.createElement("span");
    txt.style.cssText = "max-width:640px";
    txt.textContent = "Usamos cookies para perceber como o site é usado e para medir os nossos anúncios. Pode aceitar ou recusar. ";
    var pol = document.createElement("a");
    pol.href = "/privacidade/"; pol.textContent = "Política de privacidade";
    pol.style.cssText = "color:#f1efe9;text-decoration:underline";
    txt.appendChild(pol);
    var ok = document.createElement("button");
    ok.type = "button"; ok.textContent = "Aceitar";
    ok.style.cssText = "background:#fff;color:#16181d;border:0;border-radius:8px;padding:10px 20px;font:600 14px Helvetica,Arial,sans-serif;cursor:pointer";
    var no = document.createElement("button");
    no.type = "button"; no.textContent = "Recusar";
    no.style.cssText = "background:transparent;color:#f1efe9;border:1px solid rgba(255,255,255,.5);border-radius:8px;padding:10px 20px;font:600 14px Helvetica,Arial,sans-serif;cursor:pointer";
    ok.onclick = function () { guardarConsent("sim"); bar.remove(); carregar(); };
    no.onclick = function () { guardarConsent("nao"); fila.length = 0; bar.remove(); };
    bar.appendChild(txt); bar.appendChild(ok); bar.appendChild(no);
    document.body.appendChild(bar);
  }

  function iniciar() {
    var c = lerConsent();
    if (c === "sim") carregar();
    else if (c !== "nao") mostrarAviso();
  }

  if (document.body) iniciar();
  else document.addEventListener("DOMContentLoaded", iniciar);
})();
