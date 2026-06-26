/**
 * DAP – Background Service Worker
 *
 * Actúa como intermediario seguro entre el popup y los content scripts.
 * En MV3 el background service worker es el canal recomendado para:
 *   - Gestionar el ciclo de vida de la extensión.
 *   - Centralizar y auditar el flujo de mensajes entre contextos.
 *   - Evitar que el popup se comunique directamente con páginas no verificadas.
 *
 * Diagrama de mensajes:
 *   popup.js  →  (chrome.runtime.sendMessage)  →  service-worker.js
 *   service-worker.js  →  (chrome.tabs.sendMessage)  →  dap-core.js (content script)
 *   dap-core.js  →  (chrome.runtime.sendMessage)  →  service-worker.js
 *   service-worker.js  →  (chrome.tabs.sendMessage / port)  →  popup.js
 */

"use strict";

// ── Ciclo de vida ─────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(({ reason }) => {
  console.log(`[DAP SW] Instalado. Razón: ${reason}`);
});

// ── Relay de mensajes popup → content script ──────────────────────────────────
// El popup envía { action, flowId?, tabId } al service worker,
// y éste reenvía el mensaje al content script de la pestaña correspondiente.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  // Solo procesar mensajes que vengan de la propia extensión
  if (!sender || sender.id !== chrome.runtime.id) return false;

  const { action, flowId, tabId } = msg;

  // Acciones que deben reenviarse al content script
  const RELAY_ACTIONS = ["startFlow", "stopFlow", "getFlows"];

  if (RELAY_ACTIONS.includes(action) && typeof tabId === "number") {
    const payload = { action };
    if (typeof flowId === "string") payload.flowId = flowId;

    chrome.tabs.sendMessage(tabId, payload, (response) => {
      if (chrome.runtime.lastError) {
        // La página aún no tiene el content script activo — no es un error crítico
        console.warn(`[DAP SW] No se pudo contactar al content script en tab ${tabId}:`,
          chrome.runtime.lastError.message);
      }
      // Propagar la respuesta al remitente (popup) si es necesario
      if (response !== undefined) sendResponse(response);
    });

    return true; // Indica respuesta asíncrona
  }

  // flowsResponse viene del content script hacia el popup (a través del SW)
  if (action === "flowsResponse") {
    // Reenviar a todas las vistas abiertas de la extensión (popup)
    chrome.runtime.sendMessage(msg).catch(() => {
      // El popup puede haber cerrado — ignorar silenciosamente
    });
    return false;
  }

  return false;
});
