// ===============================
// ADMIN DASHBOARD - USERS
// ===============================

const API_BASE_URL = "https://backend-fantasy-6dnx.onrender.com";

const token = localStorage.getItem("access_token");

const adminContent = document.getElementById("admin-content");
const adminError = document.getElementById("admin-error");
const adminName = document.getElementById("admin-name");
const usersCount = document.getElementById("users-count");
const usersTableBody = document.getElementById("users-table-body");
const refreshButton = document.getElementById("refresh-users");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("pt-PT", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function showError(message = "Não tens permissão para aceder a esta página.") {
  adminContent.classList.add("hidden");
  adminError.classList.remove("hidden");
  adminError.textContent = message;
  adminName.textContent = "Acesso negado";
}

function showLoading() {
  usersTableBody.innerHTML = `
    <tr>
      <td colspan="4">A carregar...</td>
    </tr>
  `;
}

function renderUsers(data) {
  adminError.classList.add("hidden");
  adminContent.classList.remove("hidden");

  adminName.textContent = `Sessão iniciada como ${data.admin.name}`;
  usersCount.textContent = data.count;

  if (!data.users.length) {
    usersTableBody.innerHTML = `
      <tr>
        <td colspan="4">Ainda não existem utilizadores registados.</td>
      </tr>
    `;
    return;
  }

  usersTableBody.innerHTML = data.users.map((user) => `
    <tr>
      <td>${escapeHtml(user.name)}</td>
      <td>${escapeHtml(user.email)}</td>
      <td>
        <span class="role-pill ${user.role === "admin" ? "role-admin" : ""}">
          ${escapeHtml(user.role)}
        </span>
      </td>
      <td>${formatDate(user.created_at)}</td>
    </tr>
  `).join("");
}

async function loadAdminUsers() {
  if (!token) {
    showError("Tens de iniciar sessão como admin para aceder a esta página.");
    return;
  }

  try {
    showLoading();

    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      showError("Sessão expirada. Faz login novamente.");
      return;
    }

    if (response.status === 403) {
      showError("A tua conta não tem permissões de administrador.");
      return;
    }

    if (!response.ok) {
      showError("Erro ao carregar dados da dashboard.");
      return;
    }

    const data = await response.json();
    renderUsers(data);
  } catch (error) {
    console.error(error);
    showError("Erro ao comunicar com o backend.");
  }
}

refreshButton.addEventListener("click", loadAdminUsers);

loadAdminUsers();