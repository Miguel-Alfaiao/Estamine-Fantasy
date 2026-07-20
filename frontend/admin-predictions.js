// ===============================
// ADMIN DASHBOARD - PREDICTIONS / DRAFT PICKS
// ===============================

const PREDICTIONS_API_BASE_URL = "https://backend-fantasy-6dnx.onrender.com";
const predictionsToken = localStorage.getItem("access_token");

const mainTabButtons = document.querySelectorAll("[data-admin-main-tab]");
const usersAdminPanel = document.getElementById("users-admin-panel");
const predictionsAdminPanel = document.getElementById("predictions-admin-panel");
const sociosPredictionsAdminPanel = document.getElementById("socios-predictions-admin-panel");
const resultsAdminPanel = document.getElementById("results-admin-panel");
const draftScoringAdminPanel = document.getElementById("draft-scoring-admin-panel");
const predictionsRoot = document.getElementById("admin-predictions-root");

const predictionModes = {
  treinador: {
    label: "Treinador de Bancada",
    type: "predictions",
    endpoint: "/admin/predictions/users",
  },

  draft: {
    label: "Draft das Nações",
    type: "draft",
    endpoint: "/admin/draft/picks/users"
  }
};

let activePredictionMode = "treinador";
let predictionsAlreadyLoaded = false;

function escapePredictionHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatPredictionDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("pt-PT", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function getPredictionRodadaLabel(rodada) {
  const rodadaNumber = Number(rodada);

  const labels = {
    1: "Rodada 1",
    2: "Rodada 2",
    3: "Rodada 3",
    4: "16avos de Final",
    5: "Oitavos de Final",
    6: "Quartos de Final",
    7: "Meias-Finais",
    8: "Final"
  };

  return labels[rodadaNumber] || `Rodada ${rodadaNumber}`;
}

function initPredictionsMarkup() {
  predictionsRoot.innerHTML = `
    <section class="admin-table-card">
      <div class="admin-table-header">
        <div class="predictions-header-text">
          <h2>Predictions</h2>
          <p>Vê as previsões e picks submetidas por cada utilizador.</p>
        </div>

        <button id="refresh-predictions" type="button">Atualizar</button>
      </div>

      <div class="prediction-subtabs">
        <button
          class="prediction-subtab active"
          type="button"
          data-prediction-mode="treinador"
        >
          Treinador de Bancada
        </button>

        <button
          class="prediction-subtab"
          type="button"
          data-prediction-mode="draft"
        >
          Draft das Nações
        </button>
      </div>

      <div id="prediction-filters" class="prediction-filters">
        <label>
          Rodada
          <select id="prediction-rodada-filter">
            <option value="">Todas</option>
            <option value="1">Rodada 1</option>
            <option value="2">Rodada 2</option>
            <option value="3">Rodada 3</option>
            <option value="4">16avos de Final</option>
            <option value="5">Oitavos de Final</option>
            <option value="6">Quartos de Final</option>
            <option value="7">Meias-Finais</option>
            <option value="8">Final</option>
          </select>
        </label>

        <p id="prediction-current-filter">
          A mostrar: Treinador de Bancada · Todas as rodadas
        </p>
      </div>

      <div id="predictions-list" class="predictions-list">
        <div class="empty-state">
          Abre esta aba para carregar os dados.
        </div>
      </div>
    </section>
  `;

  document
    .getElementById("refresh-predictions")
    .addEventListener("click", loadPredictions);

  document
    .getElementById("prediction-rodada-filter")
    .addEventListener("change", loadPredictions);

  document.querySelectorAll("[data-prediction-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      setActivePredictionMode(button.dataset.predictionMode);
    });
  });
}

function setActiveMainTab(tabName) {
  mainTabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.adminMainTab === tabName);
  });

  usersAdminPanel?.classList.toggle("active", tabName === "users");
  predictionsAdminPanel?.classList.toggle("active", tabName === "predictions");
  sociosPredictionsAdminPanel?.classList.toggle("active", tabName === "socios-predictions");
  resultsAdminPanel?.classList.toggle("active", tabName === "results");
  draftScoringAdminPanel?.classList.toggle("active", tabName === "draft-scoring");

  if (tabName === "predictions" && !predictionsAlreadyLoaded) {
    loadPredictions();
  }

  if (tabName === "socios-predictions" && window.loadAdminSociosPredictions) {
    window.loadAdminSociosPredictions();
  }

  if (tabName === "results" && window.loadAdminResults) {
    window.loadAdminResults();
  }
  
  if (tabName === "draft-scoring" && window.loadAdminDraftScoring) {
    window.loadAdminDraftScoring();
  }
}

function initMainTabs() {
  mainTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveMainTab(button.dataset.adminMainTab);
    });
  });
}

function setActivePredictionMode(mode) {
  activePredictionMode = mode;

  document.querySelectorAll("[data-prediction-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.predictionMode === mode);
  });

  updateFiltersVisibility();
  loadPredictions();
}

function getPredictionsListElement() {
  return document.getElementById("predictions-list");
}

function getPredictionRodadaFilterElement() {
  return document.getElementById("prediction-rodada-filter");
}

function getPredictionCurrentFilterElement() {
  return document.getElementById("prediction-current-filter");
}

function getPredictionFiltersElement() {
  return document.getElementById("prediction-filters");
}

function updateFiltersVisibility() {
  const modeConfig = predictionModes[activePredictionMode];
  const filters = getPredictionFiltersElement();
  const rodadaFilter = getPredictionRodadaFilterElement();

  if (modeConfig.type === "draft") {
    rodadaFilter.value = "";
    filters.classList.add("draft-mode");
  } else {
    filters.classList.remove("draft-mode");
  }
}

function showPredictionsLoading() {
  getPredictionsListElement().innerHTML = `
    <div class="empty-state">A carregar dados...</div>
  `;
}

function buildPredictionsUrl() {
  const modeConfig = predictionModes[activePredictionMode];
  const rodadaFilter = getPredictionRodadaFilterElement();

  const url = new URL(`${PREDICTIONS_API_BASE_URL}${modeConfig.endpoint}`);

  if (modeConfig.type === "predictions" && rodadaFilter.value) {
    url.searchParams.set("rodada", rodadaFilter.value);
  }

  return url.toString();
}

// ===============================
// RENDER - TREINADOR DE BANCADA
// ===============================

function renderPredictionRows(predictions) {
  return predictions.map((prediction) => `
    <tr>
      <td>${formatPredictionDate(prediction.starts_at)}</td>
      <td>${escapePredictionHtml(prediction.rodada ?? "-")}</td>
      <td>${escapePredictionHtml(prediction.group_name ?? "-")}</td>
      <td>${escapePredictionHtml(prediction.match)}</td>
      <td>
        <span class="predicted-score">
          ${escapePredictionHtml(prediction.predicted_score)}
        </span>
      </td>
      <td>${escapePredictionHtml(prediction.predicted_scorer_name || "Sem Marcador")}</td>
      <td>${formatPredictionDate(prediction.submitted_at || prediction.created_at)}</td>
    </tr>
  `).join("");
}

function renderTreinadorPredictions(data) {
  const predictionsList = getPredictionsListElement();
  const currentFilterText = getPredictionCurrentFilterElement();
  const rodadaValue = getPredictionRodadaFilterElement().value;

  const rodadaLabel = rodadaValue
    ? getPredictionRodadaLabel(rodadaValue)
    : "Todas as rodadas";

  currentFilterText.textContent = `A mostrar: Treinador de Bancada · ${rodadaLabel}`;

  if (!data.users || !data.users.length) {
    predictionsList.innerHTML = `
      <div class="empty-state">
        Ainda não existem previsões submetidas para este filtro.
      </div>
    `;
    return;
  }

  predictionsList.innerHTML = data.users.map((user) => `
    <article class="prediction-user-card">
      <button class="prediction-user-toggle" type="button">
        <div class="prediction-user-main">
          <span class="prediction-user-name">
            ${escapePredictionHtml(user.user_name)}
          </span>

          <span class="prediction-user-email">
            ${escapePredictionHtml(user.user_email)}
          </span>
        </div>

        <div class="prediction-user-meta">
          <span class="prediction-count-pill">
            ${escapePredictionHtml(user.prediction_count)} previsões
          </span>

          <span class="prediction-arrow">+</span>
        </div>
      </button>

      <div class="prediction-user-body">
        <div class="table-wrapper">
          <table class="predictions-inner-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Rodada</th>
                <th>Grupo</th>
                <th>Jogo</th>
                <th>Resultado</th>
                <th>Marcador</th>
                <th>Submetido em</th>
              </tr>
            </thead>

            <tbody>
              ${renderPredictionRows(user.predictions)}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  `).join("");

  attachPredictionCardToggles();
}

// ===============================
// RENDER - DRAFT DAS NAÇÕES
// ===============================

function renderDraftPickRows(picks) {
  return picks.map((pick) => `
    <tr>
      <td>${escapePredictionHtml(pick.pot)}</td>
      <td>${escapePredictionHtml(pick.team)}</td>
      <td>${escapePredictionHtml(pick.points_per_win)}</td>
      <td>${escapePredictionHtml(pick.points_per_qualification)}</td>
      <td>${formatPredictionDate(pick.submitted_at)}</td>
    </tr>
  `).join("");
}

function renderDraftPicks(data) {
  const predictionsList = getPredictionsListElement();
  const currentFilterText = getPredictionCurrentFilterElement();

  currentFilterText.textContent = "A mostrar: Draft das Nações";

  if (!data.users || !data.users.length) {
    predictionsList.innerHTML = `
      <div class="empty-state">
        Ainda não existem picks submetidas no Draft das Nações.
      </div>
    `;
    return;
  }

  predictionsList.innerHTML = data.users.map((user) => `
    <article class="prediction-user-card">
      <button class="prediction-user-toggle" type="button">
        <div class="prediction-user-main">
          <span class="prediction-user-name">
            ${escapePredictionHtml(user.user_name)}
          </span>

          <span class="prediction-user-email">
            ${escapePredictionHtml(user.user_email)}
          </span>
        </div>

        <div class="prediction-user-meta">
          <span class="prediction-count-pill">
            ${escapePredictionHtml(user.pick_count)} picks
          </span>

          <span class="prediction-arrow">+</span>
        </div>
      </button>

      <div class="prediction-user-body">
        <div class="table-wrapper">
          <table class="predictions-inner-table">
            <thead>
              <tr>
                <th>Pote</th>
                <th>Seleção</th>
                <th>Pontos por vitória</th>
                <th>Pontos por qualificação</th>
                <th>Submetido em</th>
              </tr>
            </thead>

            <tbody>
              ${renderDraftPickRows(user.picks)}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  `).join("");

  attachPredictionCardToggles();
}

function attachPredictionCardToggles() {
  document.querySelectorAll(".prediction-user-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".prediction-user-card");
      card.classList.toggle("open");
    });
  });
}

function renderPredictions(data) {
  predictionsAlreadyLoaded = true;

  const modeConfig = predictionModes[activePredictionMode];

  if (modeConfig.type === "draft") {
    renderDraftPicks(data);
    return;
  }

  renderTreinadorPredictions(data);
}

// ===============================
// LOAD DATA
// ===============================

async function loadPredictions() {
  const predictionsList = getPredictionsListElement();

  if (!predictionsToken) {
    predictionsList.innerHTML = `
      <div class="empty-state">
        Tens de iniciar sessão como admin para ver os dados.
      </div>
    `;
    return;
  }

  try {
    showPredictionsLoading();

    const response = await fetch(buildPredictionsUrl(), {
      headers: {
        Authorization: `Bearer ${predictionsToken}`
      }
    });

    if (response.status === 401) {
      predictionsList.innerHTML = `
        <div class="empty-state">
          Sessão expirada. Faz login novamente.
        </div>
      `;
      return;
    }

    if (response.status === 403) {
      predictionsList.innerHTML = `
        <div class="empty-state">
          A tua conta não tem permissões de administrador.
        </div>
      `;
      return;
    }

    if (!response.ok) {
      predictionsList.innerHTML = `
        <div class="empty-state">
          Erro ao carregar dados.
        </div>
      `;
      return;
    }

    const data = await response.json();

    renderPredictions(data);
  } catch (error) {
    console.error(error);

    predictionsList.innerHTML = `
      <div class="empty-state">
        Erro ao comunicar com o backend.
      </div>
    `;
  }
}

// ===============================
// INIT
// ===============================

initPredictionsMarkup();
initMainTabs();
updateFiltersVisibility();