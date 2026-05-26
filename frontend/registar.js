// ===============================
// CONFIG
// ===============================

const API_BASE_URL = "https://backend-fantasy-6dnx.onrender.com";
const AUTH_STORAGE_KEYS = {
  token: "access_token",
  user: "user"
};

// ===============================
// ELEMENTS
// ===============================

const registerSection = document.getElementById("register-section");
const loginSection = document.getElementById("login-section");
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const registerMessage = document.getElementById("register-message");
const loginMessage = document.getElementById("login-message");

// ===============================
// UI HELPERS
// ===============================

function showRegister() {
  registerSection.classList.remove("hidden");
  loginSection.classList.add("hidden");
  clearMessage(loginMessage);
}

function showLogin() {
  loginSection.classList.remove("hidden");
  registerSection.classList.add("hidden");
  clearMessage(registerMessage);
}

function showMessage(element, type, text) {
  if (!element) return;

  element.className = `form-message ${type}`;
  element.textContent = text;
}

function clearMessage(element) {
  if (!element) return;

  element.className = "form-message hidden";
  element.textContent = "";
}

function setFormLoading(form, isLoading) {
  const button = form?.querySelector("button[type='submit']");

  if (!button) return;

  button.disabled = isLoading;
  button.textContent = isLoading ? "A processar..." : button.dataset.defaultText;
}

// ===============================
// SESSION HELPERS
// ===============================

function saveSession(data) {
  localStorage.setItem(AUTH_STORAGE_KEYS.token, data.access_token);
  localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(data.user));
}

function hasSession() {
  return Boolean(
    localStorage.getItem(AUTH_STORAGE_KEYS.token) &&
    localStorage.getItem(AUTH_STORAGE_KEYS.user)
  );
}

// ===============================
// API HELPER
// ===============================

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || "Erro ao comunicar com o backend.");
  }

  return data;
}

// ===============================
// INIT
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("button[type='submit']").forEach((button) => {
    button.dataset.defaultText = button.textContent;
  });

  if (hasSession()) {
    window.location.href = "index.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");

  if (mode === "login") {
    showLogin();
  } else {
    showRegister();
  }
});

document.querySelectorAll("[data-auth-toggle]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();

    if (registerSection.classList.contains("hidden")) {
      showRegister();
      history.replaceState(null, "", "registar.html?mode=register");
    } else {
      showLogin();
      history.replaceState(null, "", "registar.html?mode=login");
    }
  });
});

// ===============================
// REGISTER
// ===============================

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage(registerMessage);

  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;

  if (!name || !email || !password) {
    showMessage(registerMessage, "error", "Preenche todos os campos.");
    return;
  }

  if (password.length < 6) {
    showMessage(registerMessage, "error", "A password precisa de ter pelo menos 6 caracteres.");
    return;
  }

  try {
    setFormLoading(registerForm, true);
    showMessage(registerMessage, "loading", "A criar a tua conta...");

    const data = await apiRequest("/users/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });

    saveSession(data);
    registerForm.reset();
    showMessage(registerMessage, "success", "Conta criada com sucesso! A redirecionar...");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 700);
  } catch (error) {
    showMessage(registerMessage, "error", error.message);
  } finally {
    setFormLoading(registerForm, false);
  }
});

// ===============================
// LOGIN
// ===============================

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage(loginMessage);

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    showMessage(loginMessage, "error", "Preenche o email e a password.");
    return;
  }

  try {
    setFormLoading(loginForm, true);
    showMessage(loginMessage, "loading", "A entrar na tua conta...");

    const data = await apiRequest("/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    saveSession(data);
    loginForm.reset();
    showMessage(loginMessage, "success", "Login feito com sucesso! A redirecionar...");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 700);
  } catch (error) {
    showMessage(loginMessage, "error", error.message);
  } finally {
    setFormLoading(loginForm, false);
  }
});
