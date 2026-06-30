// ===============================
// ADMIN DRAFT SCORING
// ===============================

const DRAFT_SCORING_API_BASE_URL = "https://backend-fantasy-6dnx.onrender.com";
const draftScoringToken = localStorage.getItem("access_token");

const draftScoringRoot = document.getElementById("admin-draft-scoring-root");

let draftScoringLoaded = false;
let currentDraftScoringData = null;

const DRAFT_SCORING_RODADAS = [
  {
    rodada: 4,
    label: "Passaram da Fase de Grupos / 16avos",
  },
  {
    rodada: 5,
    label: "Passaram aos Oitavos",
  },
  {
    rodada: 6,
    label: "Passaram aos Quartos",
  },
  {
    rodada: 7,
    label: "Passaram às Meias",
  },
  {
    rodada: 8,
    label: "Passaram à Final",
  },
];

function escapeDraftScoringHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function draftScoringFetch(path, options = {}) {
  const response = await fetch(`${DRAFT_SCORING_API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${draftScoringToken}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.detail || "Erro ao comunicar com o backend.");
  }

  return data;
}

function initDraftScoringMarkup() {
  draftScoringRoot.innerHTML = `
    <section class="admin-table-card">
      <div class="admin-table-header">
        <div class="draft-scoring-header-text">
          <h2>Pontuação do Draft</h2>
          <p>
            Seleciona as equipas que passaram em cada fase. Cada equipa só pode ser pontuada uma vez por fase.
          </p>
        </div>

        <button id="open-draft-scoring-dialog" type="button">
          Pontuar qualificação
        </button>
      </div>

      <div class="draft-scoring-summary" id="draft-scoring-summary">
        Abre o dialog para carregar as equipas disponíveis.
      </div>
    </section>

    <dialog id="draft-scoring-dialog" class="draft-scoring-dialog">
      <form method="dialog" class="draft-scoring-dialog-content">
        <div class="draft-scoring-dialog-header">
          <div>
            <p class="draft-scoring-kicker">Draft das Nações</p>
            <h3>Pontuar equipas qualificadas</h3>
          </div>

          <button
            type="button"
            id="close-draft-scoring-dialog"
            class="draft-scoring-close"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <label class="draft-scoring-field">
          Fase
          <select id="draft-scoring-rodada-select">
            ${DRAFT_SCORING_RODADAS.map((item) => `
              <option value="${item.rodada}">
                ${escapeDraftScoringHtml(item.label)}
              </option>
            `).join("")}
          </select>
        </label>

        <div id="draft-scoring-status" class="draft-scoring-status">
          Escolhe uma fase para carregar as equipas.
        </div>

        <div id="draft-scoring-teams" class="draft-scoring-teams"></div>

        <div class="draft-scoring-actions">
          <button type="button" id="confirm-draft-scoring" class="draft-scoring-confirm">
            Confirmar e dar pontos
          </button>

          <button type="button" id="cancel-draft-scoring" class="draft-scoring-cancel">
            Cancelar
          </button>
        </div>
      </form>
    </dialog>
  `;

  document
    .getElementById("open-draft-scoring-dialog")
    ?.addEventListener("click", openDraftScoringDialog);

  document
    .getElementById("close-draft-scoring-dialog")
    ?.addEventListener("click", closeDraftScoringDialog);

  document
    .getElementById("cancel-draft-scoring")
    ?.addEventListener("click", closeDraftScoringDialog);

  document
    .getElementById("draft-scoring-rodada-select")
    ?.addEventListener("change", loadDraftScoringOptions);

  document
    .getElementById("confirm-draft-scoring")
    ?.addEventListener("click", applyDraftScoringAwards);
}

function getDraftScoringDialog() {
  return document.getElementById("draft-scoring-dialog");
}

function getDraftScoringRodada() {
  return Number(document.getElementById("draft-scoring-rodada-select")?.value || 4);
}

function setDraftScoringStatus(message, type = "") {
  const status = document.getElementById("draft-scoring-status");

  if (!status) return;

  status.textContent = message;
  status.className = `draft-scoring-status ${type}`;
}

function openDraftScoringDialog() {
  const dialog = getDraftScoringDialog();

  if (!dialog) return;

  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "open");
  }

  loadDraftScoringOptions();
}

function closeDraftScoringDialog() {
  const dialog = getDraftScoringDialog();

  if (!dialog) return;

  dialog.close();
}


async function loadDraftScoringGlobalSummary() {
  const summary = document.getElementById("draft-scoring-summary");

  if (!summary) return;

  summary.innerHTML = "A carregar resumo das fases...";

  try {
    const phases = await Promise.all(
      DRAFT_SCORING_RODADAS.map(async (item) => {
        const data = await draftScoringFetch(
          `/admin/scoring/draft/qualification/options/${item.rodada}`
        );

        return data;
      })
    );

    summary.innerHTML = `
      <div class="draft-scoring-global-summary">
        ${phases.map((phase) => `
          <div class="draft-scoring-phase-card">
            <strong>${escapeDraftScoringHtml(phase.label)}</strong>
            <span>
              ${phase.awarded_count || 0} pontuadas / ${phase.teams_count || 0} disponíveis
            </span>
          </div>
        `).join("")}
      </div>
    `;
  } catch (error) {
    summary.innerHTML = `
      <div class="draft-scoring-empty is-error">
        ${escapeDraftScoringHtml(error.message)}
      </div>
    `;
  }
}



function renderDraftScoringSummary(data) {
  // O resumo principal é carregado por loadDraftScoringGlobalSummary().
  // Esta função fica aqui só para não quebrar chamadas antigas.
}

function renderDraftScoringTeams(data) {
  const teamsContainer = document.getElementById("draft-scoring-teams");

  if (!teamsContainer) return;

  if (!data.teams.length) {
    teamsContainer.innerHTML = `
      <div class="draft-scoring-empty">
        Ainda não há equipas confirmed nos jogos desta fase.
      </div>
    `;
    return;
  }

  teamsContainer.innerHTML = data.teams.map((team) => {
    const disabled = team.awarded ? "disabled" : "";
    const checked = team.awarded ? "checked" : "";

    return `
      <label class="draft-scoring-team ${team.awarded ? "is-awarded" : ""}">
        <input
          type="checkbox"
          value="${escapeDraftScoringHtml(team.team)}"
          ${checked}
          ${disabled}
        >

        <span class="draft-scoring-team-main">
          <strong>${escapeDraftScoringHtml(team.team)}</strong>
          <small>
            Pote ${team.pot} · +${team.points_per_qualification} pontos
          </small>
        </span>

        ${team.awarded ? `
          <em>Já pontuada</em>
        ` : ""}
      </label>
    `;
  }).join("");
}

async function loadDraftScoringOptions() {
  const rodada = getDraftScoringRodada();

  setDraftScoringStatus("A carregar equipas...", "is-loading");

  try {
    const data = await draftScoringFetch(`/admin/scoring/draft/qualification/options/${rodada}`);

    currentDraftScoringData = data;

    renderDraftScoringTeams(data);

    setDraftScoringStatus(
      `${data.label}: ${data.awarded_count} já pontuadas / ${data.teams_count} disponíveis.`,
      "is-ok"
    );
  } catch (error) {
    setDraftScoringStatus(error.message, "is-error");

    document.getElementById("draft-scoring-teams").innerHTML = `
      <div class="draft-scoring-empty is-error">
        ${escapeDraftScoringHtml(error.message)}
      </div>
    `;
  }
}

async function applyDraftScoringAwards() {
  const rodada = getDraftScoringRodada();

  const selectedTeams = [
    ...document.querySelectorAll("#draft-scoring-teams input[type='checkbox']:checked:not(:disabled)")
  ].map((input) => input.value);

  if (!selectedTeams.length) {
    alert("Seleciona pelo menos uma equipa nova para pontuar.");
    return;
  }

  const label = currentDraftScoringData?.label || "esta fase";

  const confirmed = confirm(
    `Vais dar pontos de qualificação a ${selectedTeams.length} equipa(s) em ${label}. Confirmas?`
  );

  if (!confirmed) return;

  setDraftScoringStatus("A aplicar pontos...", "is-loading");

  try {
    const result = await draftScoringFetch(`/admin/scoring/draft/qualification/apply/${rodada}`, {
      method: "POST",
      body: JSON.stringify({
        teams: selectedTeams,
      }),
    });

    alert(
      `${result.message}\n\n` +
      `Users atualizados: ${result.users_updated}\n` +
      `Total de pontos adicionados: ${result.total_points_added}`
    );

    await loadDraftScoringOptions();
    await loadDraftScoringGlobalSummary();
  } catch (error) {
    alert(error.message);
    setDraftScoringStatus(error.message, "is-error");
  }
}

function loadAdminDraftScoring() {
  if (draftScoringLoaded) {
    loadDraftScoringGlobalSummary();
    return;
  }

  initDraftScoringMarkup();
  draftScoringLoaded = true;

  loadDraftScoringGlobalSummary();
}

window.loadAdminDraftScoring = loadAdminDraftScoring;