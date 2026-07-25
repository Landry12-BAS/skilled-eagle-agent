/**
 * Live model loader for the AI Provider Config admin.
 *
 * Reads the config ID from the page URL so the backend can look up
 * the saved API key directly from the database — no need to read the
 * masked password field from the DOM.
 *
 * Fallback: if the user types a NEW key before saving, it uses that value.
 */
(function () {
  "use strict";

  let debounceTimer = null;
  const DEBOUNCE_MS = 900;

  // Extract the record PK from admin change URLs like /admin/ai/.../1/change/
  function getConfigId() {
    const match = window.location.pathname.match(/\/(\d+)\/change\/?$/);
    return match ? match[1] : null;
  }

  function getCSRFToken() {
    const cookie = document.cookie.split(";").find((c) => c.trim().startsWith("csrftoken="));
    return cookie ? decodeURIComponent(cookie.trim().split("=")[1]) : "";
  }

  function showStatus(anchor, message, type) {
    let el = document.getElementById("model-load-status");
    if (!el) {
      el = document.createElement("p");
      el.id = "model-load-status";
      el.style.cssText = "margin-top:6px;font-size:12px;";
      anchor.parentNode.appendChild(el);
    }
    const colors = { loading: "#6b7280", ok: "#16a34a", warn: "#d97706", error: "#ef4444" };
    el.style.color = colors[type] || "#6b7280";
    el.textContent = message;
  }

  function buildURL(provider, configId, rawKey) {
    const params = new URLSearchParams();
    if (configId) {
      params.set("config_id", configId);
      params.set("provider", provider);   // override provider in case it changed
    } else {
      params.set("provider", provider);
      params.set("api_key", rawKey);
    }
    return "/api/ai/models/?" + params.toString();
  }

  function populateSelect(modelSelect, models, savedValue) {
    modelSelect.innerHTML = "";

    if (!models.length) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "— No models found (check API key / provider) —";
      modelSelect.appendChild(opt);
      return;
    }

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "— Select a model —";
    modelSelect.appendChild(placeholder);

    let matched = false;
    models.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = m.name || m.id;
      if (m.id === savedValue) { opt.selected = true; matched = true; }
      modelSelect.appendChild(opt);
    });

    // Keep the currently-saved value even if not in the live list
    if (savedValue && !matched) {
      const opt = document.createElement("option");
      opt.value = savedValue;
      opt.textContent = `⚙ Saved: ${savedValue}`;
      opt.selected = true;
      modelSelect.insertBefore(opt, modelSelect.children[1]);
    }
  }

  function fetchModels(provider, configId, rawKey, modelSelect, savedValue) {
    if (!provider) return;
    // Need either a saved config OR a raw key
    if (!configId && (!rawKey || rawKey.length < 8)) {
      showStatus(modelSelect, "Enter an API key to load available models.", "warn");
      return;
    }

    showStatus(modelSelect, "⏳ Fetching models from " + provider + " API…", "loading");
    modelSelect.disabled = true;

    fetch(buildURL(provider, configId, rawKey), {
      credentials: "same-origin",
      headers: { "X-CSRFToken": getCSRFToken() },
    })
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((data) => {
        if (data.error && !(data.models && data.models.length)) {
          showStatus(modelSelect, "⚠ " + data.error, "warn");
          return;
        }
        const models = data.models || [];
        populateSelect(modelSelect, models, savedValue);
        showStatus(modelSelect, `✅ ${models.length} model${models.length !== 1 ? "s" : ""} loaded.`, "ok");
      })
      .catch((err) => {
        showStatus(modelSelect, "❌ Failed to fetch models: " + err, "error");
      })
      .finally(() => {
        modelSelect.disabled = false;
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    const providerSelect = document.querySelector("#id_provider_name");
    const apiKeyInput    = document.querySelector("#id_api_key");
    const modelSelect    = document.querySelector("#id_model_name");

    if (!providerSelect || !apiKeyInput || !modelSelect) return;

    const configId   = getConfigId();               // null on "add" page
    const savedModel = modelSelect.value || "";

    // ── Add a manual "Reload" button ────────────────────────────────────────
    const reloadBtn = document.createElement("button");
    reloadBtn.type = "button";
    reloadBtn.textContent = "🔄 Load Models";
    reloadBtn.style.cssText =
      "margin-left:8px;padding:4px 12px;font-size:12px;cursor:pointer;" +
      "border:1px solid #d1d5db;border-radius:6px;background:#f9fafb;";
    modelSelect.parentNode.insertBefore(reloadBtn, modelSelect.nextSibling);

    function triggerLoad() {
      fetchModels(
        providerSelect.value,
        configId,
        apiKeyInput.value,
        modelSelect,
        savedModel
      );
    }

    reloadBtn.addEventListener("click", triggerLoad);

    // ── Auto-load on page open (saved config) ────────────────────────────────
    if (configId && providerSelect.value) {
      triggerLoad();
    }

    // ── Reload on provider change ────────────────────────────────────────────
    providerSelect.addEventListener("change", function () {
      fetchModels(providerSelect.value, configId, apiKeyInput.value, modelSelect, "");
    });

    // ── Debounced reload while typing a new API key ──────────────────────────
    apiKeyInput.addEventListener("input", function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchModels(providerSelect.value, null, apiKeyInput.value, modelSelect, savedModel);
      }, DEBOUNCE_MS);
    });
  });
})();
