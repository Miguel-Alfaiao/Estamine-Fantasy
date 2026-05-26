// ===============================
// SHARED LOGO NAV
// ===============================

function renderSharedLogoNav() {
  const navMount = document.getElementById("shared-navbar");

  if (!navMount) return;

  navMount.innerHTML = `
    <header class="shared-logo-nav">
      <a href="index.html" class="shared-logo-button" aria-label="Voltar à página principal">
        <img src="img/logo.png" alt="Fantasy do Estaminé" class="shared-logo-img" />
      </a>
    </header>
  `;
}

document.addEventListener("DOMContentLoaded", renderSharedLogoNav);