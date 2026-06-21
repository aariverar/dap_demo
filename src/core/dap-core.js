/**
 * DAP – Digital Adoption Platform  |  dap-core.js
 *
 * Motor principal: tooltip, overlay, highlight, panel lateral y lanzador.
 * NO contiene definiciones de flujos. Cada flujo vive en flows/<nombre>.js
 * y se registra en window.__DAP_FLOWS__ antes de que este script se ejecute.
 *
 * Para agregar un nuevo flujo:
 *  1. Crear flows/mi-flujo.js  →  window.__DAP_FLOWS__["mi-flujo"] = { ... }
 *  2. Declararlo en manifest.json antes de dap-core.js
 *  ¡Sin tocar este archivo!
 */

(function () {
  "use strict";

  // ─────────────────────────────────────────────
  // REGISTRO DE FLUJOS
  // Leído desde los archivos flows/*.js
  // ─────────────────────────────────────────────
  const FLOWS = window.__DAP_FLOWS__ || {};

  if (Object.keys(FLOWS).length === 0) {
    console.warn("[DAP] No se encontraron flujos registrados. ¿Cargaste los archivos flows/*.js?");
  }

  // ─────────────────────────────────────────────
  // ESTADO
  // ─────────────────────────────────────────────
  const STATE_KEY = "dap_state";
  let state = { active: false, flowId: null, stepIndex: 0 };

  function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STATE_KEY);
      if (saved) state = JSON.parse(saved);
    } catch (_) {}
  }

  // ─────────────────────────────────────────────
  // DETECCIÓN AUTOMÁTICA DEL FLUJO
  // Decodifica la URL para manejar %2F u otras codificaciones.
  // ─────────────────────────────────────────────
  function detectFlow() {
    const url = decodeURIComponent(window.location.href);
    for (const key of Object.keys(FLOWS)) {
      if (FLOWS[key].url.test(url)) return FLOWS[key];
    }
    return null;
  }

  // ─────────────────────────────────────────────
  // CONSTRUCCIÓN DE ELEMENTOS UI
  // ─────────────────────────────────────────────
  let tooltipEl = null;
  let overlayEl = null;
  let highlightEl = null;

  function createOverlay() {
    overlayEl = document.createElement("div");
    overlayEl.className = "dap-overlay";
    document.body.appendChild(overlayEl);
  }

  function createHighlight() {
    highlightEl = document.createElement("div");
    highlightEl.className = "dap-highlight";
    document.body.appendChild(highlightEl);
  }

  function createTooltip() {
    tooltipEl = document.createElement("div");
    tooltipEl.className = "dap-tooltip";
    tooltipEl.innerHTML = `
      <div class="dap-tooltip__header">
        <span class="dap-tooltip__title"></span>
        <button class="dap-tooltip__close" aria-label="Cerrar guía">✕</button>
      </div>
      <p class="dap-tooltip__body"></p>
      <div class="dap-tooltip__footer">
        <span class="dap-tooltip__counter"></span>
        <div class="dap-tooltip__actions">
          <button class="dap-btn dap-btn--secondary dap-btn--prev">← Anterior</button>
          <button class="dap-btn dap-btn--primary dap-btn--next">Siguiente →</button>
        </div>
      </div>
    `;
    document.body.appendChild(tooltipEl);

    tooltipEl.querySelector(".dap-tooltip__close").addEventListener("click", stopGuide);
    tooltipEl.querySelector(".dap-btn--prev").addEventListener("click", prevStep);
    tooltipEl.querySelector(".dap-btn--next").addEventListener("click", nextStep);
  }

  // ─────────────────────────────────────────────
  // POSICIONAMIENTO
  // ─────────────────────────────────────────────
  function positionTooltip(targetEl, position) {
    const targetRect = targetEl.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const GAP = 12;

    tooltipEl.style.visibility = "hidden";
    tooltipEl.style.display = "block";

    const tW = tooltipEl.offsetWidth;
    const tH = tooltipEl.offsetHeight;

    let top, left;

    switch (position) {
      case "right":
        top  = targetRect.top + scrollY + targetRect.height / 2 - tH / 2;
        left = targetRect.right + scrollX + GAP;
        break;
      case "left":
        top  = targetRect.top + scrollY + targetRect.height / 2 - tH / 2;
        left = targetRect.left + scrollX - tW - GAP;
        break;
      case "top":
        top  = targetRect.top + scrollY - tH - GAP;
        left = targetRect.left + scrollX + targetRect.width / 2 - tW / 2;
        break;
      case "bottom":
      default:
        top  = targetRect.bottom + scrollY + GAP;
        left = targetRect.left + scrollX + targetRect.width / 2 - tW / 2;
        break;
    }

    left = Math.max(8, Math.min(left, window.innerWidth + scrollX - tW - 8));
    top  = Math.max(8, top);

    tooltipEl.style.top  = top + "px";
    tooltipEl.style.left = left + "px";
    tooltipEl.style.visibility = "visible";
  }

  function positionHighlight(targetEl) {
    const rect  = targetEl.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const PAD = 6;

    highlightEl.style.top    = rect.top  + scrollY - PAD + "px";
    highlightEl.style.left   = rect.left + scrollX - PAD + "px";
    highlightEl.style.width  = rect.width  + PAD * 2 + "px";
    highlightEl.style.height = rect.height + PAD * 2 + "px";
  }

  // ─────────────────────────────────────────────
  // RENDERIZADO DE UN PASO
  // ─────────────────────────────────────────────
  function renderStep() {
    const flow  = FLOWS[state.flowId];
    const step  = flow.steps[state.stepIndex];
    const total = flow.steps.length;

    const targetEl = document.querySelector(step.selector);
    if (!targetEl) {
      console.warn(`[DAP] Selector no encontrado: ${step.selector}`);
      return;
    }

    targetEl.scrollIntoView({ behavior: "smooth", block: "center" });

    positionHighlight(targetEl);
    highlightEl.style.display = "block";

    tooltipEl.querySelector(".dap-tooltip__title").textContent   = step.title;
    tooltipEl.querySelector(".dap-tooltip__body").textContent    = step.description;
    tooltipEl.querySelector(".dap-tooltip__counter").textContent = `${state.stepIndex + 1} / ${total}`;

    const prevBtn = tooltipEl.querySelector(".dap-btn--prev");
    const nextBtn = tooltipEl.querySelector(".dap-btn--next");

    prevBtn.disabled   = state.stepIndex === 0;
    nextBtn.textContent = state.stepIndex === total - 1 ? "Finalizar ✓" : "Siguiente →";

    positionTooltip(targetEl, step.position);

    document.querySelectorAll(".dap-panel__step").forEach((el, i) => {
      el.classList.toggle("dap-panel__step--active", i === state.stepIndex);
    });

    saveState();
  }

  // ─────────────────────────────────────────────
  // NAVEGACIÓN
  // ─────────────────────────────────────────────
  function nextStep() {
    const flow = FLOWS[state.flowId];
    if (state.stepIndex < flow.steps.length - 1) {
      state.stepIndex++;
      renderStep();
    } else {
      stopGuide(true);
    }
  }

  function prevStep() {
    if (state.stepIndex > 0) {
      state.stepIndex--;
      renderStep();
    }
  }

  function goToStep(index) {
    state.stepIndex = index;
    renderStep();
  }

  // ─────────────────────────────────────────────
  // INICIAR / DETENER GUÍA
  // ─────────────────────────────────────────────
  function startGuide(flowId, fromStep = 0) {
    if (!FLOWS[flowId]) return;
    state.active    = true;
    state.flowId    = flowId;
    state.stepIndex = fromStep;

    overlayEl.style.display = "block";
    buildPanel(FLOWS[flowId]);
    renderStep();
  }

  function stopGuide(completed = false) {
    state.active = false;
    saveState();

    overlayEl.style.display  = "none";
    tooltipEl.style.display  = "none";
    highlightEl.style.display = "none";

    const panel = document.getElementById("dap-panel");
    if (panel) panel.remove();

    if (completed) showCompletionBanner();
  }

  // ─────────────────────────────────────────────
  // PANEL LATERAL DE PASOS
  // ─────────────────────────────────────────────
  function buildPanel(flow) {
    const existing = document.getElementById("dap-panel");
    if (existing) existing.remove();

    const panel = document.createElement("div");
    panel.id        = "dap-panel";
    panel.className = "dap-panel";
    panel.innerHTML = `
      <div class="dap-panel__header">
        <span class="dap-panel__icon">${flow.icon || "🗺️"}</span>
        <strong>${flow.name}</strong>
        <button class="dap-panel__close" aria-label="Cerrar panel">✕</button>
      </div>
      <ul class="dap-panel__list">
        ${flow.steps.map((s, i) => `
          <li class="dap-panel__step${i === state.stepIndex ? " dap-panel__step--active" : ""}"
              data-step="${i}">
            <span class="dap-panel__step-num">${i + 1}</span>
            <span class="dap-panel__step-title">${s.title.replace(/^Paso \d+ – /, "")}</span>
          </li>`).join("")}
      </ul>
    `;
    document.body.appendChild(panel);

    panel.querySelector(".dap-panel__close").addEventListener("click", stopGuide);
    panel.querySelectorAll(".dap-panel__step").forEach((el) => {
      el.addEventListener("click", () => goToStep(Number(el.dataset.step)));
    });
  }

  // ─────────────────────────────────────────────
  // BANNER DE COMPLETADO
  // ─────────────────────────────────────────────
  function showCompletionBanner() {
    const banner = document.createElement("div");
    banner.className = "dap-banner";
    banner.innerHTML = `
      <span>🎉 ¡Completaste el flujo de <strong>${FLOWS[state.flowId]?.name || ""}</strong>!</span>
      <button class="dap-banner__close" aria-label="Cerrar">✕</button>
    `;
    document.body.appendChild(banner);
    banner.querySelector(".dap-banner__close").addEventListener("click", () => banner.remove());
    setTimeout(() => banner.remove(), 5000);
  }

  // ─────────────────────────────────────────────
  // BOTÓN FLOTANTE
  // Siempre visible; detecta el flujo al hacer clic.
  // ─────────────────────────────────────────────
  function createLauncherButton() {
    const existing = document.getElementById("dap-launcher-btn");
    if (existing) return;

    const btn = document.createElement("button");
    btn.id        = "dap-launcher-btn";
    btn.className = "dap-launcher";
    btn.title     = "Iniciar guía DAP";
    btn.setAttribute("aria-label", "Iniciar guía DAP");

    const iconUrl = chrome.runtime.getURL("icons/icon48.png");
    btn.innerHTML = `<img src="${iconUrl}" alt="DAP" width="28" height="28"
      style="display:block;pointer-events:none;border-radius:4px;" />`;

    btn.addEventListener("click", () => {
      const flow = detectFlow();
      if (flow) {
        startGuide(flow.id);
      } else {
        showNoFlowMessage();
      }
    });

    document.body.appendChild(btn);
  }

  function showNoFlowMessage() {
    const existing = document.getElementById("dap-no-flow");
    if (existing) { existing.remove(); return; }

    const msg = document.createElement("div");
    msg.id        = "dap-no-flow";
    msg.className = "dap-banner";
    msg.style.background = "#6b7280";
    msg.innerHTML = `<span>No hay guía disponible para esta página.</span>
      <button class="dap-banner__close" aria-label="Cerrar">✕</button>`;
    document.body.appendChild(msg);
    msg.querySelector(".dap-banner__close").addEventListener("click", () => msg.remove());
    setTimeout(() => msg.remove(), 3000);
  }

  // ─────────────────────────────────────────────
  // MENSAJES DESDE EL POPUP
  // ─────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "startFlow" && msg.flowId) {
      startGuide(msg.flowId);
    }
    if (msg.action === "stopFlow") {
      stopGuide();
    }
    if (msg.action === "getFlows") {
      const url       = decodeURIComponent(window.location.href);
      const available = Object.values(FLOWS)
        .filter((f) => f.url.test(url))
        .map((f)   => ({ id: f.id, name: f.name, icon: f.icon || "🗺️", steps: f.steps.length }));
      chrome.runtime.sendMessage({ action: "flowsResponse", flows: available });
    }
  });

  // ─────────────────────────────────────────────
  // INICIALIZACIÓN
  // ─────────────────────────────────────────────
  function init() {
    loadState();
    createOverlay();
    createHighlight();
    createTooltip();
    createLauncherButton();

    const flow = detectFlow();
    if (state.active && flow && state.flowId === flow.id) {
      startGuide(state.flowId, state.stepIndex);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
