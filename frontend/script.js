// ===============================
// HOMEPAGE NAV SESSION
// ===============================

const HOME_STORAGE_KEYS = {
  token: "access_token",
  user: "user"
};

function getHomeToken() {
  return localStorage.getItem(HOME_STORAGE_KEYS.token);
}

function getHomeUser() {
  const rawUser = localStorage.getItem(HOME_STORAGE_KEYS.user);

  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

function clearHomeSession() {
  localStorage.removeItem(HOME_STORAGE_KEYS.token);
  localStorage.removeItem(HOME_STORAGE_KEYS.user);
}

function escapeHomeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderHomepageGuestActions() {
  return `
    <a href="registar.html?mode=register" class="nav-btn">Registar</a>
    <a href="registar.html?mode=login" class="nav-btn">Login</a>
  `;
}

function renderHomepageUserActions(user) {
  const name = escapeHomeHtml(user?.name || "Treinador");

  return `
    <span class="nav-user" title="${name}">Olá, ${name}</span>
    <button class="nav-btn nav-logout" type="button" data-home-logout>
      Logout
    </button>
  `;
}

function renderHomepageNavSession() {
  const navActions = document.querySelector(".landing-navbar .nav-actions");

  if (!navActions) return;

  const token = getHomeToken();
  const user = getHomeUser();
  const isLoggedIn = Boolean(token && user);

  navActions.innerHTML = isLoggedIn
    ? renderHomepageUserActions(user)
    : renderHomepageGuestActions();

  const logoutButton = navActions.querySelector("[data-home-logout]");

  if (logoutButton) {
    logoutButton.addEventListener("click", openLogoutModal);
  }
}

document.addEventListener("DOMContentLoaded", renderHomepageNavSession);



// ===============================
// LOGOUT MODAL
// ===============================

function openLogoutModal() {
  const existingModal = document.getElementById("logout-modal");

  if (existingModal) {
    existingModal.classList.remove("hidden");
    return;
  }

  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <div id="logout-modal" class="logout-modal">
        <div class="logout-modal-card">
          <h2>Terminar sessão?</h2>
          <p>Tens a certeza que queres sair da tua conta?</p>

          <div class="logout-modal-actions">
            <button type="button" class="logout-cancel" data-close-logout>
              Cancelar
            </button>

            <button type="button" class="logout-confirm" data-confirm-logout>
              Sim, sair
            </button>
          </div>
        </div>
      </div>
    `
  );

  document.querySelector("[data-close-logout]").addEventListener("click", closeLogoutModal);
  document.querySelector("[data-confirm-logout]").addEventListener("click", confirmLogout);

  document.getElementById("logout-modal").addEventListener("click", (event) => {
    if (event.target.id === "logout-modal") {
      closeLogoutModal();
    }
  });
}

function closeLogoutModal() {
  const modal = document.getElementById("logout-modal");

  if (modal) {
    modal.classList.add("hidden");
  }
}

function confirmLogout() {
  clearHomeSession();
  window.location.href = "index.html";
}


// ===============================
// WORLD CUP COUNTDOWN
// ===============================

function updateWorldCupCountdown() {
  const targetDate = new Date("2026-06-11T00:00:00");

  const daysEl = document.getElementById("count-days");
  const hoursEl = document.getElementById("count-hours");
  const minutesEl = document.getElementById("count-minutes");
  const secondsEl = document.getElementById("count-seconds");

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  const now = new Date();
  const diff = targetDate - now;

  if (diff <= 0) {
    daysEl.textContent = "0";
    hoursEl.textContent = "0";
    minutesEl.textContent = "0";
    secondsEl.textContent = "0";
    return;
  }

  const totalSeconds = Math.floor(diff / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  daysEl.textContent = days;
  hoursEl.textContent = String(hours).padStart(2, "0");
  minutesEl.textContent = String(minutes).padStart(2, "0");
  secondsEl.textContent = String(seconds).padStart(2, "0");
}

updateWorldCupCountdown();
setInterval(updateWorldCupCountdown, 1000);