(function () {
  const Run = window.Run = window.Run || {};
  const utils = Run.utils;
  const SESSION_KEY = "running.session";
  const USERNAME = "jambrosio";
  const PASSWORD_HASH = "6ee1f58e7b08b04e58109a89bc575651338419dc646b9d660ff95f81ec594299";

  function readSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (!session || session.user !== USERNAME || session.token !== PASSWORD_HASH) return null;
      return session;
    } catch (error) {
      return null;
    }
  }

  function persistSession(remember) {
    const session = { user: USERNAME, token: PASSWORD_HASH, since: Date.now() };
    const serialized = JSON.stringify(session);
    try {
      sessionStorage.setItem(SESSION_KEY, serialized);
      localStorage.removeItem(SESSION_KEY);
      if (remember) localStorage.setItem(SESSION_KEY, serialized);
    } catch (error) {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
    }
    return session;
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  }

  function showApp(session) {
    document.getElementById("login-view").hidden = true;
    document.getElementById("app-view").hidden = false;
    document.getElementById("user-label").textContent = session.user;
    if (Run.app && typeof Run.app.onAuthenticated === "function") Run.app.onAuthenticated();
  }

  function showLogin() {
    document.getElementById("app-view").hidden = true;
    document.getElementById("login-view").hidden = false;
    const form = document.getElementById("login-form");
    if (form) form.reset();
    const error = document.getElementById("login-error");
    if (error) {
      error.textContent = "";
      error.hidden = true;
    }
  }

  async function login(username, password, remember) {
    const hash = await utils.sha256(password || "");
    if (String(username || "").trim() !== USERNAME || hash !== PASSWORD_HASH) return false;
    showApp(persistSession(remember));
    return true;
  }

  function logout() {
    clearSession();
    showLogin();
  }

  function init() {
    const form = document.getElementById("login-form");
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      const error = document.getElementById("login-error");
      error.hidden = true;
      error.textContent = "";
      const username = document.getElementById("login-user").value;
      const password = document.getElementById("login-pass").value;
      const ok = await login(username, password, false);
      if (!ok) {
        error.textContent = "Usuário ou senha inválidos.";
        error.hidden = false;
        document.getElementById("login-pass").focus();
      }
    });

    document.getElementById("logout-btn").addEventListener("click", logout);

    const session = readSession();
    if (session) showApp(session);
    else showLogin();
  }

  Run.auth = {
    init: init,
    login: login,
    logout: logout,
    isAuthenticated: function () { return Boolean(readSession()); }
  };
})();
