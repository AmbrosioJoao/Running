(function () {
  const Run = window.Run = window.Run || {};
  const TAB_KEY = "running.tab";
  let currentTab = "calendario";

  function setTab(name) {
    const names = ["calendario", "graficos", "corridas"];
    if (names.indexOf(name) === -1) name = "calendario";
    currentTab = name;
    document.querySelectorAll(".tab").forEach(function (button) {
      const active = button.dataset.tab === name;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll(".tab-panel").forEach(function (panel) {
      panel.hidden = panel.id !== "tab-" + name;
    });
    try { sessionStorage.setItem(TAB_KEY, name); } catch (error) {}
    if (Run.charts && name === "graficos" && typeof Run.charts.render === "function") Run.charts.render();
  }

  function openModal(title, html, setup) {
    document.getElementById("modal-title").textContent = title;
    const body = document.getElementById("modal-body");
    body.innerHTML = html;
    document.getElementById("modal-root").hidden = false;
    const focusable = body.querySelector("input, select, textarea, button");
    if (focusable) focusable.focus();
    if (typeof setup === "function") setup(body);
  }

  function closeModal() {
    document.getElementById("modal-root").hidden = true;
    document.getElementById("modal-body").innerHTML = "";
  }

  function toast(message) {
    const root = document.getElementById("toast-root");
    const item = document.createElement("div");
    item.className = "toast";
    item.textContent = message;
    root.appendChild(item);
    window.setTimeout(function () { item.remove(); }, 2800);
  }

  function refreshAll() {
    ["shoes", "calendar", "charts", "races"].forEach(function (name) {
      const module = Run[name];
      if (module && typeof module.render === "function") module.render();
    });
  }

  function onAuthenticated() {
    ["store", "backup", "shoes", "calendar", "charts", "races"].forEach(function (name) {
      const module = Run[name];
      if (module && typeof module.init === "function") module.init();
    });
    let saved = "calendario";
    try { saved = sessionStorage.getItem(TAB_KEY) || "calendario"; } catch (error) { saved = "calendario"; }
    setTab(saved);
    refreshAll();
  }

  function init() {
    document.querySelectorAll(".tab").forEach(function (button) {
      button.addEventListener("click", function () { setTab(button.dataset.tab); });
    });
    document.querySelectorAll("[data-modal-close]").forEach(function (button) {
      button.addEventListener("click", closeModal);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !document.getElementById("modal-root").hidden) closeModal();
    });
    Run.auth.init();
  }

  Run.ui = {
    setTab: setTab,
    openModal: openModal,
    closeModal: closeModal,
    toast: toast,
    refreshAll: refreshAll
  };
  Run.app = {
    init: init,
    onAuthenticated: onAuthenticated
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
