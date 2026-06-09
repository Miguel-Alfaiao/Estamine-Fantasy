// ===============================
// ADMIN DASHBOARD - RESULTS
// ===============================

const RESULTS_API_BASE_URL = "https://backend-fantasy-6dnx.onrender.com";
const resultsToken = localStorage.getItem("access_token");

const resultsRoot = document.getElementById("admin-results-root");

let resultsAlreadyLoaded = false;

let activeResultMatch = null;
let activeResultPlayers = [];
let activeResultScorers = new Map();

function escapeResultsHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatResultsDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("pt-PT", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function initResultsMarkup() {
  if (!resultsRoot) return;

  resultsRoot.innerHTML = `
    <section class="admin-table-card">
      <div class="admin-table-header">
        <div class="results-header-text">
          <h2>Resultados dos jogos</h2>
          <p>
            Guarda manualmente o resultado final e os marcadores de cada jogo.
          </p>
        </div>

        <button id="refresh-results" type="button">Atualizar</button>
      </div>

      <div class="results-filters">
        <label>
          Rodada
          <select id="results-rodada-filter">
            <option value="">Todas</option>
            <option value="1">Rodada 1</option>
            <option value="2">Rodada 2</option>
            <option value="3">Rodada 3</option>
          </select>
        </label>

        <p id="results-current-filter">
          A mostrar: Todas as rodadas
        </p>
      </div>

      <div class="table-wrapper">
        <table class="results-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Rodada</th>
              <th>Grupo</th>
              <th>Jogo</th>
              <th>Resultado</th>
              <th>Ação</th>
            </tr>
          </thead>

          <tbody id="results-table-body">
            <tr>
              <td colspan="6">Abre esta aba para carregar os resultados.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <dialog id="result-dialog" class="result-dialog">
      <div class="result-dialog-card">
        <div class="result-dialog-header">
          <div>
            <h3 id="result-dialog-title">Inserir resultado</h3>
            <p id="result-dialog-subtitle">Seleciona o resultado e os marcadores.</p>
          </div>

          <button
            type="button"
            id="result-dialog-close"
            class="result-dialog-close"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div class="result-dialog-body">
          <div class="result-score-grid">
            <label>
              <span id="result-home-label">Casa</span>
              <input id="result-home-score" type="number" min="0" value="0">
            </label>

            <div class="result-score-separator">X</div>

            <label>
              <span id="result-away-label">Fora</span>
              <input id="result-away-score" type="number" min="0" value="0">
            </label>

            <label>
              <span>Autogolos / sem marcador fantasy</span>
              <input id="result-own-goals" type="number" min="0" value="0">
            </label>
          </div>

          <div class="result-goals-summary" id="result-goals-summary">
            Total de golos: 0 · Marcadores + autogolos: 0
          </div>

          <div class="result-players-header">
            <div>
              <h4>Marcadores</h4>
              <p>Clica em + para adicionar golos ao jogador. Se um jogador marcou 2 vezes, fica x2.</p>
            </div>

            <input
              type="search"
              id="result-player-search"
              class="result-player-search"
              placeholder="Pesquisar jogador..."
              autocomplete="off"
            >
          </div>

          <div id="result-players-list" class="result-players-list"></div>
        </div>

        <div class="result-dialog-footer">
          <button type="button" id="result-dialog-cancel" class="result-secondary-btn">
            Cancelar
          </button>

          <button type="button" id="result-dialog-save" class="result-primary-btn">
            Guardar resultado
          </button>
        </div>
      </div>
    </dialog>
  `;

  document
    .getElementById("refresh-results")
    ?.addEventListener("click", loadAdminResults);

  document
    .getElementById("results-rodada-filter")
    ?.addEventListener("change", loadAdminResults);

  document
    .getElementById("result-dialog-close")
    ?.addEventListener("click", closeResultDialog);

  document
    .getElementById("result-dialog-cancel")
    ?.addEventListener("click", closeResultDialog);

  document
    .getElementById("result-dialog-save")
    ?.addEventListener("click", saveResultDialog);

  document
    .getElementById("result-home-score")
    ?.addEventListener("input", updateResultDialogState);

  document
    .getElementById("result-away-score")
    ?.addEventListener("input", updateResultDialogState);

  document
    .getElementById("result-own-goals")
    ?.addEventListener("input", updateResultDialogState);

  document
    .getElementById("result-player-search")
    ?.addEventListener("input", renderResultPlayersList);

  document
    .getElementById("result-dialog")
    ?.addEventListener("click", (event) => {
      if (event.target.id === "result-dialog") {
        closeResultDialog();
      }
    });
}

function getResultsTableBody() {
  return document.getElementById("results-table-body");
}

function getResultsRodadaFilter() {
  return document.getElementById("results-rodada-filter");
}

function getResultsCurrentFilter() {
  return document.getElementById("results-current-filter");
}

function showResultsLoading() {
  const tableBody = getResultsTableBody();

  if (!tableBody) return;

  tableBody.innerHTML = `
    <tr>
      <td colspan="6">A carregar resultados...</td>
    </tr>
  `;
}

function showResultsError(message = "Erro ao carregar resultados.") {
  const tableBody = getResultsTableBody();

  if (!tableBody) return;

  tableBody.innerHTML = `
    <tr>
      <td colspan="6" class="results-error-cell">
        ${escapeResultsHtml(message)}
      </td>
    </tr>
  `;
}

function getResultsApiUrl() {
  const rodadaFilter = getResultsRodadaFilter();
  const url = new URL(`${RESULTS_API_BASE_URL}/admin/results/matches`);

  if (rodadaFilter?.value) {
    url.searchParams.set("rodada", rodadaFilter.value);
  }

  return url.toString();
}

function updateResultsCurrentFilterText() {
  const currentFilter = getResultsCurrentFilter();
  const rodadaFilter = getResultsRodadaFilter();

  if (!currentFilter) return;

  currentFilter.textContent = rodadaFilter?.value
    ? `A mostrar: Rodada ${rodadaFilter.value}`
    : "A mostrar: Todas as rodadas";
}

function formatResultScore(row) {
  if (!row.has_result || !row.result) {
    return `<span class="result-pill empty">Sem resultado</span>`;
  }

  return `
    <span class="result-pill saved">
      ${escapeResultsHtml(row.result.home_score)}
      -
      ${escapeResultsHtml(row.result.away_score)}
    </span>
  `;
}

function formatMatchName(row) {
  const homeTeam = row.home_team || "TBD";
  const awayTeam = row.away_team || "TBD";

  return `
    <span class="result-match-name">
      ${escapeResultsHtml(homeTeam)}
      <strong>vs</strong>
      ${escapeResultsHtml(awayTeam)}
    </span>
  `;
}

function renderResultsRows(rows) {
  const tableBody = getResultsTableBody();

  if (!tableBody) return;

  updateResultsCurrentFilterText();

  if (!Array.isArray(rows) || rows.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6">Não há jogos para mostrar.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = rows.map((row) => `
    <tr>
      <td>${formatResultsDate(row.starts_at)}</td>
      <td>${escapeResultsHtml(row.round_name || "-")}</td>
      <td>${escapeResultsHtml(row.group_name || "-")}</td>
      <td>${formatMatchName(row)}</td>
      <td>${formatResultScore(row)}</td>
      <td>
        <button
          type="button"
          class="result-action-btn"
          data-match-id="${escapeResultsHtml(row.match_id)}"
        >
          ${row.has_result ? "Editar" : "Inserir"}
        </button>
      </td>
    </tr>
  `).join("");

  document.querySelectorAll(".result-action-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const matchId = button.dataset.matchId;
      openResultDialog(matchId);
    });
  });
}

// ===============================
// RESULT DIALOG
// ===============================

function getResultDialogElements() {
  return {
    dialog: document.getElementById("result-dialog"),
    title: document.getElementById("result-dialog-title"),
    subtitle: document.getElementById("result-dialog-subtitle"),
    homeLabel: document.getElementById("result-home-label"),
    awayLabel: document.getElementById("result-away-label"),
    homeScore: document.getElementById("result-home-score"),
    awayScore: document.getElementById("result-away-score"),
    ownGoals: document.getElementById("result-own-goals"),
    summary: document.getElementById("result-goals-summary"),
    playersList: document.getElementById("result-players-list"),
    playerSearch: document.getElementById("result-player-search"),
    saveButton: document.getElementById("result-dialog-save"),
  };
}

function getNumberInputValue(input) {
  const value = Number(input?.value ?? 0);

  if (Number.isNaN(value) || value < 0) {
    return 0;
  }

  return value;
}

function getSelectedScorersTotal() {
  let total = 0;

  activeResultScorers.forEach((goals) => {
    total += Number(goals) || 0;
  });

  return total;
}

function getTotalMatchGoals() {
  const elements = getResultDialogElements();

  return (
    getNumberInputValue(elements.homeScore) +
    getNumberInputValue(elements.awayScore)
  );
}

function getOwnGoalsCount() {
  const elements = getResultDialogElements();

  return getNumberInputValue(elements.ownGoals);
}

function updateResultDialogState() {
  const elements = getResultDialogElements();

  const totalMatchGoals = getTotalMatchGoals();
  const selectedScorersTotal = getSelectedScorersTotal();
  const ownGoalsCount = getOwnGoalsCount();
  const registeredGoals = selectedScorersTotal + ownGoalsCount;

  if (elements.summary) {
    elements.summary.textContent =
      `Total de golos: ${totalMatchGoals} · Marcadores + autogolos: ${registeredGoals}`;

    elements.summary.classList.toggle("valid", registeredGoals === totalMatchGoals);
    elements.summary.classList.toggle("invalid", registeredGoals !== totalMatchGoals);
  }

  if (elements.saveButton) {
    elements.saveButton.disabled = registeredGoals !== totalMatchGoals;
  }

  renderResultPlayersList();
}

function setScorerGoals(playerId, goals) {
  const safeGoals = Math.max(Number(goals) || 0, 0);
  const safePlayerId = String(playerId);

  if (safeGoals <= 0) {
    activeResultScorers.delete(safePlayerId);
  } else {
    activeResultScorers.set(safePlayerId, safeGoals);
  }

  updateResultDialogState();
}

function renderResultPlayerSection(title, players) {
  if (!players.length) return "";

  return `
    <section class="result-player-section">
      <h5>${escapeResultsHtml(title)}</h5>

      <div class="result-player-grid">
        ${players.map((player) => {
          const playerId = String(player.player_id);
          const goals = activeResultScorers.get(playerId) || 0;

          return `
            <div class="result-player-row">
              <div class="result-player-info">
                <strong>${escapeResultsHtml(player.player_name)}</strong>
                <span>
                  ${player.shirt_number ? `#${escapeResultsHtml(player.shirt_number)}` : "Sem número"}
                  ${player.position ? ` · ${escapeResultsHtml(player.position)}` : ""}
                </span>
              </div>

              <div class="result-player-controls">
                <button
                  type="button"
                  class="result-scorer-minus"
                  data-player-id="${escapeResultsHtml(playerId)}"
                  ${goals <= 0 ? "disabled" : ""}
                >
                  −
                </button>

                <span class="result-scorer-count ${goals > 0 ? "active" : ""}">
                  ${goals > 0 ? `x${goals}` : "0"}
                </span>

                <button
                  type="button"
                  class="result-scorer-plus"
                  data-player-id="${escapeResultsHtml(playerId)}"
                >
                  +
                </button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function getFilteredResultPlayers() {
  const elements = getResultDialogElements();
  const query = String(elements.playerSearch?.value || "").trim().toLowerCase();

  if (!query) {
    return activeResultPlayers;
  }

  return activeResultPlayers.filter((player) => {
    const name = String(player.player_name || "").toLowerCase();
    const shirtNumber = String(player.shirt_number || "").toLowerCase();
    const position = String(player.position || "").toLowerCase();

    return (
      name.includes(query) ||
      shirtNumber.includes(query) ||
      position.includes(query)
    );
  });
}

function renderResultPlayersList() {
  const elements = getResultDialogElements();

  if (!elements.playersList) return;

  if (!activeResultMatch) {
    elements.playersList.innerHTML = "";
    return;
  }

  const filteredPlayers = getFilteredResultPlayers();

  const homePlayers = filteredPlayers.filter(player => player.team === "home");
  const awayPlayers = filteredPlayers.filter(player => player.team === "away");

  const homeTeam = activeResultMatch.home_team || "Equipa da casa";
  const awayTeam = activeResultMatch.away_team || "Equipa de fora";

  if (!filteredPlayers.length) {
    elements.playersList.innerHTML = `
      <div class="results-dialog-empty">
        Nenhum jogador encontrado.
      </div>
    `;
    return;
  }

  elements.playersList.innerHTML = `
    ${renderResultPlayerSection(homeTeam, homePlayers)}
    ${renderResultPlayerSection(awayTeam, awayPlayers)}
  `;

  elements.playersList.querySelectorAll(".result-scorer-plus").forEach((button) => {
    button.addEventListener("click", () => {
      const playerId = String(button.dataset.playerId);
      const current = activeResultScorers.get(playerId) || 0;

      setScorerGoals(playerId, current + 1);
    });
  });

  elements.playersList.querySelectorAll(".result-scorer-minus").forEach((button) => {
    button.addEventListener("click", () => {
      const playerId = String(button.dataset.playerId);
      const current = activeResultScorers.get(playerId) || 0;

      setScorerGoals(playerId, current - 1);
    });
  });
}

function hydrateExistingResult(result) {
  activeResultScorers = new Map();

  if (!result) return;

  result.scorers?.forEach((scorer) => {
    const playerId = String(scorer.player_id);
    const goals = Number(scorer.goals) || 0;

    if (goals > 0) {
      activeResultScorers.set(playerId, goals);
    }
  });
}

async function openResultDialog(matchId) {
  const elements = getResultDialogElements();

  if (!elements.dialog) return;

  try {
    activeResultMatch = null;
    activeResultPlayers = [];
    activeResultScorers = new Map();

    elements.title.textContent = "A carregar resultado...";
    elements.subtitle.textContent = "A buscar dados do jogo...";

    elements.homeLabel.textContent = "Casa";
    elements.awayLabel.textContent = "Fora";
    elements.homeScore.value = 0;
    elements.awayScore.value = 0;
    elements.ownGoals.value = 0;

    if (elements.playerSearch) {
      elements.playerSearch.value = "";
    }

    elements.playersList.innerHTML = `
      <div class="results-dialog-loading">
        A carregar jogadores...
      </div>
    `;

    elements.saveButton.disabled = true;
    elements.saveButton.textContent = "Guardar resultado";

    elements.dialog.showModal();

    const response = await fetch(`${RESULTS_API_BASE_URL}/admin/results/matches/${matchId}`, {
      headers: {
        Authorization: `Bearer ${resultsToken}`
      }
    });

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(data?.detail || "Erro ao carregar detalhes do jogo.");
    }

    activeResultMatch = data;
    activeResultPlayers = Array.isArray(data.players) ? data.players : [];

    hydrateExistingResult(data.result);

    const homeTeam = data.home_team || "Casa";
    const awayTeam = data.away_team || "Fora";

    elements.title.textContent = data.result ? "Editar resultado" : "Inserir resultado";
    elements.subtitle.textContent = `${homeTeam} vs ${awayTeam}`;

    elements.homeLabel.textContent = homeTeam;
    elements.awayLabel.textContent = awayTeam;

    elements.homeScore.value = data.result?.home_score ?? 0;
    elements.awayScore.value = data.result?.away_score ?? 0;
    elements.ownGoals.value = data.result?.own_goals_count ?? 0;

    if (elements.playerSearch) {
      elements.playerSearch.value = "";
    }

    updateResultDialogState();
  } catch (error) {
    console.error(error);

    elements.title.textContent = "Erro ao carregar";
    elements.subtitle.textContent = "Não foi possível abrir este jogo.";

    elements.playersList.innerHTML = `
      <div class="results-dialog-error">
        ${escapeResultsHtml(error.message)}
      </div>
    `;
  }
}

function closeResultDialog() {
  const elements = getResultDialogElements();

  if (elements.dialog?.open) {
    elements.dialog.close();
  }

  activeResultMatch = null;
  activeResultPlayers = [];
  activeResultScorers = new Map();
}

function buildResultPayload() {
  const elements = getResultDialogElements();

  const scorers = [...activeResultScorers.entries()].map(([playerId, goals]) => ({
    player_id: playerId,
    goals
  }));

  return {
    home_score: getNumberInputValue(elements.homeScore),
    away_score: getNumberInputValue(elements.awayScore),
    own_goals_count: getOwnGoalsCount(),
    is_final: true,
    scorers
  };
}

async function saveResultDialog() {
  if (!activeResultMatch?.match_id) return;

  const elements = getResultDialogElements();

  const totalMatchGoals = getTotalMatchGoals();
  const registeredGoals = getSelectedScorersTotal() + getOwnGoalsCount();

  if (registeredGoals !== totalMatchGoals) {
    alert("A soma dos marcadores + autogolos tem de ser igual ao total de golos.");
    return;
  }

  try {
    elements.saveButton.disabled = true;
    elements.saveButton.textContent = "A guardar...";

    const response = await fetch(
      `${RESULTS_API_BASE_URL}/admin/results/matches/${activeResultMatch.match_id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${resultsToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildResultPayload())
      }
    );

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(data?.detail || "Erro ao guardar resultado.");
    }

    closeResultDialog();
    await loadAdminResults();
  } catch (error) {
    console.error(error);
    alert(error.message);
  } finally {
    const freshElements = getResultDialogElements();

    if (freshElements.saveButton) {
      freshElements.saveButton.textContent = "Guardar resultado";
    }

    if (activeResultMatch) {
      updateResultDialogState();
    }
  }
}

// ===============================
// LOAD DATA
// ===============================

async function loadAdminResults() {
  if (!resultsToken) {
    showResultsError("Tens de iniciar sessão como admin para ver os resultados.");
    return;
  }

  try {
    resultsAlreadyLoaded = true;
    showResultsLoading();

    const response = await fetch(getResultsApiUrl(), {
      headers: {
        Authorization: `Bearer ${resultsToken}`
      }
    });

    if (response.status === 401) {
      showResultsError("Sessão expirada. Faz login novamente.");
      return;
    }

    if (response.status === 403) {
      showResultsError("A tua conta não tem permissões de administrador.");
      return;
    }

    if (!response.ok) {
      showResultsError("Erro ao carregar resultados.");
      return;
    }

    const data = await response.json();

    renderResultsRows(data);
  } catch (error) {
    console.error(error);
    showResultsError("Erro ao comunicar com o backend.");
  }
}

window.loadAdminResults = loadAdminResults;

initResultsMarkup();