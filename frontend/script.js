// ===============================
// CONFIG
// ===============================

const API_BASE_URL = "https://backend-fantasy-6dnx.onrender.com";

const ADMIN_ICON_SRC = "img/admin.png";
const USER_ICON_SRC = "img/user.png";

const HOME_STORAGE_KEYS = {
  token: "access_token",
  user: "user"
};

// ===============================
// SESSION HELPERS
// ===============================

function getHomeToken() {
  return localStorage.getItem(HOME_STORAGE_KEYS.token);
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

async function getCurrentUserFromBackend() {
  const token = getHomeToken();

  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      clearHomeSession();
      return null;
    }

    const user = await response.json();
    localStorage.setItem(HOME_STORAGE_KEYS.user, JSON.stringify(user));

    return user;
  } catch (error) {
    console.error("Erro ao validar sessão:", error);
    return null;
  }
}

// ===============================
// HOMEPAGE NAV
// ===============================

function renderHomepageGuestActions() {
  return `
    <a href="registar.html?mode=register" class="nav-btn">Registar</a>
    <a href="registar.html?mode=login" class="nav-btn">Login</a>
  `;
}

function renderHomepageUserActions(user) {
  const name = escapeHomeHtml(user?.name || "Treinador");
  const isAdmin = user?.role === "admin";
  const iconSrc = isAdmin ? ADMIN_ICON_SRC : USER_ICON_SRC;
  const iconAlt = isAdmin ? "Admin" : "Utilizador";

  return `
    <span class="nav-user" title="${name}">
      <img src="${iconSrc}" alt="${iconAlt}" class="nav-user-icon" />

      <span class="nav-user-name">
        <span class="nav-user-prefix">Olá, </span>${name}
      </span>
    </span>

    <button class="nav-btn nav-logout" type="button" data-home-logout>
      Logout
    </button>
  `;
}

function renderAdminNavLink(user) {
  const navMenus = document.querySelectorAll(
    ".landing-navbar .nav-links, .landing-navbar .mobile-nav"
  );

  navMenus.forEach((navMenu) => {
    const existingAdminLink = navMenu.querySelector(".nav-admin-link");

    if (existingAdminLink) {
      existingAdminLink.remove();
    }

    if (user?.role !== "admin") return;

    navMenu.insertAdjacentHTML(
      "beforeend",
      `<a href="admin.html" class="nav-admin-link">Admin Dashboard</a>`
    );
  });
}

async function renderHomepageNavSession() {
  const navActions = document.querySelector(".landing-navbar .nav-actions");

  if (!navActions) return;

  const user = await getCurrentUserFromBackend();

  renderAdminNavLink(user);

  navActions.innerHTML = user
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


// ===============================
// BACK TO TOP
// ===============================

const backToTopButton = document.getElementById("back-to-top");

if (backToTopButton) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 500) {
      backToTopButton.classList.add("show");
    } else {
      backToTopButton.classList.remove("show");
    }
  });

  backToTopButton.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}


// ===============================
// MOBILE MENU
// ===============================

const mobileMenuButton = document.querySelector(".mobile-menu-btn");
const mobileNav = document.querySelector(".mobile-nav");

if (mobileMenuButton && mobileNav) {
  mobileMenuButton.addEventListener("click", () => {
    mobileNav.classList.toggle("show");
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileNav.classList.remove("show");
    });
  });
}

// Seleção dos elementos do Pop-up
const openModalBtn = document.getElementById('open-credits-btn');
const closeModalBtn = document.getElementById('close-credits-btn');
const creditsModal = document.getElementById('credits-modal');

// Abrir o Pop-up ao clicar no botão da secção Sobre
if (openModalBtn && creditsModal) {
  openModalBtn.addEventListener('click', () => {
    creditsModal.classList.add('active');
  });
}

// Fechar o Pop-up ao clicar no botão "X"
if (closeModalBtn && creditsModal) {
  closeModalBtn.addEventListener('click', () => {
    creditsModal.classList.remove('active');
  });
}

// Fechar o Pop-up se o utilizador clicar fora da caixa branca
if (creditsModal) {
  creditsModal.addEventListener('click', (e) => {
    if (e.target === creditsModal) {
      creditsModal.classList.remove('active');
    }
  });
}

// ===============================
// PROTECTED EVENT LINKS
// ===============================

document.querySelectorAll(".event-login-required").forEach((link) => {
  link.addEventListener("click", (event) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      event.preventDefault();
      window.location.href = "registar.html?mode=login";
    }
  });
});