const API_BASE_URL = "https://backend-fantasy-6dnx.onrender.com";

const token = localStorage.getItem("access_token");
let sociosOpen = true;

const navActions = document.getElementById("treinador-nav-actions");
const navLoading = document.getElementById("nav-loading");
const twitchButton = document.getElementById("btn-twitch-login");

const form = document.getElementById("socios-form");
const submitButton = document.getElementById("btn-submit");

const statusBox = document.getElementById("status-box");
const submittedPill = document.getElementById("submitted-pill");
const formMessage = document.getElementById("form-message");

const TWITCH_ICON_HTML = `
  <span class="twitch-icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" role="img" focusable="false">
      <path
        fill="currentColor"
        d="M3 2l-1 4v14h5v3h3l3-3h4l5-5V2H3zm17 12l-3 3h-5l-3 3v-3H5V4h15v10z"
      />
      <rect x="14" y="7" width="2" height="5" fill="currentColor"></rect>
      <rect x="9" y="7" width="2" height="5" fill="currentColor"></rect>
    </svg>
  </span>
`;

const fieldMap = {
  vencedor: "vencedor",
  melhor_jogador_1: "melhor-jogador-1",
  melhor_jogador_2: "melhor-jogador-2",
  melhor_jogador_3: "melhor-jogador-3",
  melhor_marcador_1: "melhor-marcador-1",
  melhor_marcador_2: "melhor-marcador-2",
  melhor_marcador_3: "melhor-marcador-3",
  melhor_guarda_redes: "melhor-guarda-redes",
  melhor_jovem: "melhor-jovem",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setMessage(message, type = "info") {
  formMessage.textContent = message || "";
  formMessage.className = `form-message ${type}`;
}

function setStatusBox(message, type = "info") {
  statusBox.textContent = message;
  statusBox.className = `status-box ${type}`;
}

function setStatusPill(element, text, type = "muted") {
  element.textContent = text;
  element.className = `status-pill status-${type}`;
}

function setTwitchButton(text, disabled = false) {
  twitchButton.innerHTML = `${TWITCH_ICON_HTML}<span>${text}</span>`;
  twitchButton.disabled = disabled;
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function renderHeaderUser(user) {
  const isAdmin = user?.role === "admin";
  const icon = isAdmin ? "img/admin.png" : "img/user.png";
  const title = escapeHtml(user?.email || user?.name || "Utilizador");
  const name = escapeHtml(user?.name || "Utilizador");

  if (navLoading) {
    navLoading.remove();
  }

  const existing = navActions.querySelector(".nav-user");

  if (existing) {
    existing.remove();
  }

  navActions.insertAdjacentHTML(
    "beforeend",
    `
      <div class="nav-user" title="${title}">
        <img src="${escapeHtml(icon)}" alt="" class="nav-user-icon">
        <span class="nav-user-name">Olá, ${name}</span>
      </div>
    `
  );
}

function renderHeaderGuest(text = "Sem login") {
  if (navLoading) {
    navLoading.remove();
  }

  const existing = navActions.querySelector(".nav-user");

  if (existing) {
    existing.remove();
  }

  navActions.insertAdjacentHTML(
    "beforeend",
    `
      <div class="nav-user" title="${escapeHtml(text)}">
        <img src="img/user.png" alt="" class="nav-user-icon">
        <span class="nav-user-name">${escapeHtml(text)}</span>
      </div>
    `
  );
}

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function disableForm(message) {
  Array.from(form.elements).forEach((element) => {
    element.disabled = true;
  });

  if (message) {
    setMessage(message, "error");
  }
}

function enableForm() {
  Array.from(form.elements).forEach((element) => {
    element.disabled = false;
  });

  setMessage("");
}

function fillPredictionForm(prediction) {
  if (!prediction) return;

  Object.entries(fieldMap).forEach(([apiKey, elementId]) => {
    const input = document.getElementById(elementId);

    if (input && prediction[apiKey]) {
      input.value = prediction[apiKey];
    }
  });
}

function buildPayload() {
  const payload = {};

  Object.entries(fieldMap).forEach(([apiKey, elementId]) => {
    const input = document.getElementById(elementId);
    payload[apiKey] = input.value.trim();
  });

  return payload;
}

function handleTwitchQueryStatus() {
  const params = new URLSearchParams(window.location.search);
  const twitchStatus = params.get("twitch");

  if (!twitchStatus) return;

  const messages = {
    sub_ok: {
      text: "Twitch ligada com sucesso. Subscrição confirmada.",
      type: "success",
    },
    not_sub: {
      text: "Twitch ligada, mas esta conta não aparece como subscritora ativa.",
      type: "warning",
    },
    denied: {
      text: "Autorização Twitch cancelada.",
      type: "warning",
    },
    missing_code: {
      text: "A Twitch não devolveu o código de autorização.",
      type: "error",
    },
    invalid_state: {
      text: "Sessão Twitch inválida. Tenta ligar novamente.",
      type: "error",
    },
    user_not_found: {
      text: "Não foi possível associar a Twitch ao teu utilizador.",
      type: "error",
    },
    no_twitch_user: {
      text: "Não foi possível obter os dados da tua conta Twitch.",
      type: "error",
    },
    already_linked: {
      text: "Esta conta Twitch já está ligada a outro utilizador.",
      type: "error",
    },
    error: {
      text: "Erro ao validar a conta Twitch. Tenta novamente.",
      type: "error",
    },
  };

  const result = messages[twitchStatus];

  if (result) {
    setStatusBox(result.text, result.type);
  }

  window.history.replaceState({}, document.title, window.location.pathname);
}

async function loadSocioStatus() {
  disableForm("Liga a tua Twitch e confirma a subscrição para submeter previsões.");

  if (!token) {
    renderHeaderGuest("Sem login");

    setStatusPill(submittedPill, "Bloqueado", "danger");
    setStatusBox(
      "Tens de iniciar sessão no site antes de aceder ao Plano Sócios.",
      "error"
    );

    setTwitchButton("Iniciar sessão", false);

    twitchButton.addEventListener(
      "click",
      () => {
        window.location.href = "registar.html?mode=login";
      },
      { once: true }
    );

    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/socios/me`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");

      renderHeaderGuest("Sessão expirada");

      setStatusPill(submittedPill, "Bloqueado", "danger");
      setStatusBox("A tua sessão expirou. Faz login novamente.", "error");
      disableForm("Sessão expirada.");

      setTwitchButton("Iniciar sessão", false);

      twitchButton.addEventListener(
        "click",
        () => {
          window.location.href = "registar.html?mode=login";
        },
        { once: true }
      );

      return;
    }

    if (!response.ok) {
      throw new Error("Erro ao carregar estado de sócio.");
    }

    const data = await response.json();

    sociosOpen = data.socios_open !== false;

    const storedUser = getStoredUser();
    renderHeaderUser({
      ...storedUser,
      name: data.name,
      email: data.email,
    });

    if (data.submitted && data.prediction) {
      fillPredictionForm(data.prediction);
    }

    if (!sociosOpen) {
      setStatusPill(submittedPill, "Fechado", "danger");

      setStatusBox(
        data.submitted
          ? "O Plano Sócios está fechado. Podes consultar as tuas previsões, mas já não é possível atualizar."
          : "O Plano Sócios está fechado. Já não é possível submeter previsões.",
        "warning"
      );

      setTwitchButton("Plano fechado", true);
      disableForm("O Plano Sócios está fechado.");

      if (submitButton) {
        submitButton.textContent = "Plano Sócios fechado";
      }

      return;
    }

    if (data.twitch && data.twitch.linked && data.twitch.is_sub) {
      setStatusBox(
        `Twitch ligada: ${data.twitch.twitch_display_name}. Subscrição confirmada.`,
        "success"
      );

      setTwitchButton("Twitch ligada", true);
      enableForm();

      if (data.submitted && data.prediction) {
        setStatusPill(submittedPill, "Já submetido", "success");
        submitButton.textContent = "Atualizar Previsões";
      } else {
        setStatusPill(submittedPill, "Disponível", "success");
        submitButton.textContent = "Submeter Previsões";
      }

      return;
    }

    if (data.twitch && data.twitch.linked && !data.twitch.is_sub) {
      setStatusBox(
        `Twitch ligada: ${data.twitch.twitch_display_name}. Esta conta ainda não aparece como subscritora ativa.`,
        "warning"
      );

      setTwitchButton("Verificar Twitch", false);
      setStatusPill(submittedPill, "Bloqueado", "danger");
      disableForm("Só contas Twitch subscritoras podem submeter previsões.");

      return;
    }

    setStatusBox(
      "Ainda não ligaste a Twitch. Liga a tua conta e confirma a subscrição para desbloquear os palpites VIP.",
      "info"
    );

    setTwitchButton("Ligar Twitch", false);
    setStatusPill(submittedPill, "Bloqueado", "danger");
    disableForm("Liga a tua Twitch para desbloquear a submissão.");
  } catch (error) {
    console.error(error);

    renderHeaderGuest("Erro");

    setStatusPill(submittedPill, "Bloqueado", "danger");
    setStatusBox(
      "Não foi possível carregar o estado dos sócios. Tenta novamente.",
      "error"
    );
    disableForm("Erro ao carregar dados.");
  }
}

async function connectTwitch() {
  if (!token) {
    window.location.href = "registar.html?mode=login";
    return;
  }

  setTwitchButton("A abrir Twitch...", true);

  try {
    const response = await fetch(`${API_BASE_URL}/socios/auth/twitch/login`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Erro ao criar link Twitch.");
    }

    const data = await response.json();

    if (!data.auth_url) {
      throw new Error("Backend não devolveu auth_url.");
    }

    window.location.href = data.auth_url;
  } catch (error) {
    console.error(error);

    setTwitchButton("Ligar Twitch", false);
    setStatusBox(
      "Ainda não foi possível abrir a ligação à Twitch. Confirma as variáveis no Render.",
      "error"
    );
  }
}

async function submitPredictions(event) {
  event.preventDefault();

  if (!sociosOpen) {
    setMessage("O Plano Sócios está fechado. Já não é possível submeter ou atualizar previsões.", "error");
    return;
  }

  if (!token) {
    setMessage("Tens de iniciar sessão primeiro.", "error");
    return;
  }

  const payload = buildPayload();

  const hasEmptyField = Object.values(payload).some((value) => !value);

  if (hasEmptyField) {
    setMessage("Preenche todos os campos antes de submeter.", "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "A submeter...";
  setMessage("");

  try {
    const response = await fetch(`${API_BASE_URL}/socios/predictions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        result?.detail || "Erro ao submeter as previsões de sócio.";

      throw new Error(errorMessage);
    }

    setStatusPill(submittedPill, "Já submetido", "success");
    submitButton.textContent = "Atualizar Previsões";

    setMessage(
      result?.created
        ? "Previsões submetidas com sucesso."
        : "Previsões atualizadas com sucesso.",
      "success"
    );
  } catch (error) {
    console.error(error);
    setMessage(error.message, "error");
  } finally {
    submitButton.disabled = false;

    if (submittedPill.textContent === "Já submetido") {
      submitButton.textContent = "Atualizar Previsões";
    } else {
      submitButton.textContent = "Submeter Previsões";
    }
  }
}

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
    event.preventDefault();
    
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  handleTwitchQueryStatus();
  loadSocioStatus();

  twitchButton.addEventListener("click", connectTwitch);
  form.addEventListener("submit", submitPredictions);

  if (window.lucide) {
    lucide.createIcons();
    }

});