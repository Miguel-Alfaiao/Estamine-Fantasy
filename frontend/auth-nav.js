// frontend/auth-nav.js

(() => {
  const AUTH_API_BASE_URL = "https://backend-fantasy-6dnx.onrender.com";
  // Para testar localmente:
  // const AUTH_API_BASE_URL = "http://127.0.0.1:8000";

  const TOKEN_KEY = "access_token";
  const USER_KEY = "user";

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getStoredUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function redirectToLogin() {
    window.location.href = "registar.html?mode=login";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function fetchCurrentUser() {
    const token = getToken();

    if (!token) {
      clearSession();
      redirectToLogin();
      return null;
    }

    try {
      const response = await fetch(`${AUTH_API_BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        clearSession();
        redirectToLogin();
        return null;
      }

      const user = await response.json();
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch (error) {
      console.error("Erro ao validar sessão:", error);

      const storedUser = getStoredUser();

      if (storedUser) {
        return storedUser;
      }

      clearSession();
      redirectToLogin();
      return null;
    }
  }

  function renderAuthNav(user) {
    const navActions = document.getElementById("treinador-nav-actions");

    if (!navActions) return;

    const isAdmin = user?.role === "admin";
    const icon = isAdmin ? "img/admin.png" : "img/user.png";

    navActions.innerHTML = `
      <div class="nav-user" title="${escapeHtml(user.email || user.name || "Utilizador")}">
        <img src="${escapeHtml(icon)}" alt="" class="nav-user-icon">
        <span class="nav-user-name">Olá, ${escapeHtml(user.name || "Utilizador")}</span>
      </div>
    `;
  }

  async function initAuthNav() {
    const user = await fetchCurrentUser();

    if (!user) return;

    renderAuthNav(user);
  }

  document.addEventListener("DOMContentLoaded", initAuthNav);
})();