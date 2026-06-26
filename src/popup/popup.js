/**
 * DAP – popup.js
 * Lógica del popup de la extensión.
 *
 * Separado de popup.html para cumplir con la Content Security Policy
 * de Manifest V3, que prohíbe scripts inline en páginas de extensión.
 *
 * Seguridad:
 *   - Datos dinámicos insertados solo vía textContent / createElement (sin innerHTML).
 *   - sender.id verificado en todos los listeners de mensajes.
 *   - Versión leída dinámicamente desde chrome.runtime.getManifest()
 *     para evitar fingerprinting estático en el HTML.
 */

"use strict";

const flowListEl = document.getElementById("flowList");
const statusDot  = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const appFooter  = document.getElementById("appFooter");

// ── Versión dinámica desde manifest.json (sin hardcodear en HTML) ──────────────
(function setFooterVersion() {
  try {
    const { version } = chrome.runtime.getManifest();
    if (appFooter && version) {
      // Solo el equipo interno verá la versión (en el popup, contexto privilegiado),
      // nunca estará expuesta en el HTML estático ni en la página web.
      appFooter.textContent = `DAP v${version} · Santander Consumer Bank Guide`;
    }
  } catch (_) {
    // Si por alguna razón el manifest no está disponible, el footer queda sin versión
  }
}());

// ── Validación de la estructura de un flujo recibido por mensaje ──
function isValidFlow(f) {
  return (
    f !== null &&
    typeof f === "object" &&
    typeof f.id    === "string" && f.id.length > 0 &&
    typeof f.name  === "string" &&
    typeof f.steps === "number"
  );
}

// ── Obtener la pestaña activa y pedir los flujos al content script ──
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab || !tab.id) {
    setStatus(false, "No se puede acceder a esta pestaña.");
    return;
  }

  const tabId = tab.id;

  // Escuchar la respuesta del content script
  chrome.runtime.onMessage.addListener(function handler(msg, sender) {
    // FIX: verificar que el mensaje viene de la propia extensión
    if (!sender || sender.id !== chrome.runtime.id) return;
    if (msg.action !== "flowsResponse") return;
    if (!Array.isArray(msg.flows)) return;
    chrome.runtime.onMessage.removeListener(handler);
    renderFlows(msg.flows.filter(isValidFlow), tabId);
  });

  // Pedir los flujos disponibles en la página actual
  chrome.tabs.sendMessage(tabId, { action: "getFlows" }, () => {
    if (chrome.runtime.lastError) {
      // El content script aún no está activo en esta página
      setStatus(false, "Página no compatible con DAP.");
    }
  });
});

function renderFlows(flows, tabId) {
  if (!flows || flows.length === 0) {
    setStatus(false, "Sin flujos para esta página.");
    return;
  }

  setStatus(true, `${flows.length} flujo${flows.length > 1 ? "s" : ""} disponible${flows.length > 1 ? "s" : ""}`);
  flowListEl.innerHTML = "";

  flows.forEach(flow => {
    const card = document.createElement("div");
    card.className = "flow-card";

    // FIX XSS: construir el DOM con createElement/textContent en lugar de innerHTML
    const iconSpan = document.createElement("span");
    iconSpan.className   = "flow-card__icon";
    iconSpan.textContent = typeof flow.icon === "string" ? flow.icon : "🗺️";

    const infoDiv = document.createElement("div");
    infoDiv.className = "flow-card__info";

    const nameDiv = document.createElement("div");
    nameDiv.className   = "flow-card__name";
    nameDiv.textContent = flow.name;

    const stepsDiv = document.createElement("div");
    stepsDiv.className   = "flow-card__steps";
    stepsDiv.textContent = `${flow.steps} paso${flow.steps !== 1 ? "s" : ""}`;

    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(stepsDiv);

    const btn = document.createElement("button");
    btn.className   = "flow-card__btn";
    btn.dataset.id  = flow.id;          // siempre string validado
    btn.textContent = "Iniciar";

    btn.addEventListener("click", () => {
      const isRunning = btn.classList.contains("flow-card__btn--stop");

      chrome.tabs.sendMessage(tabId, {
        action: isRunning ? "stopFlow" : "startFlow",
        flowId: flow.id,
      });

      btn.classList.toggle("flow-card__btn--stop", !isRunning);
      btn.textContent = isRunning ? "Iniciar" : "Detener";
    });

    card.appendChild(iconSpan);
    card.appendChild(infoDiv);
    card.appendChild(btn);
    flowListEl.appendChild(card);
  });
}

function setStatus(active, text) {
  statusDot.className    = "status-dot" + (active ? "" : " status-dot--inactive");
  statusText.textContent = text;
}
