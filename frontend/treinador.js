const API_BASE_URL = "https://backend-fantasy-6dnx.onrender.com";
// Para testar localmente:
// const API_BASE_URL = "http://127.0.0.1:8000";

const STORAGE_KEYS = {
  token: "access_token",
  user: "user"
};

const DRAFT_PREFIX = "treinador_palpites";
const NO_SCORER_VALUE = "__NO_SCORER__";

const TEAM_FLAG_MAP = {
  "Algeria": "dz",
  "Argentina": "ar",
  "Australia": "au",
  "Austria": "at",
  "Belgium": "be",
  "Bosnia & Herzegovina": "ba",
  "Brazil": "br",
  "Cape Verde": "cv",
  "Canada": "ca",
  "Colombia": "co",
  "Costa Rica": "cr",
  "Croatia": "hr",
  "Curaçao": "cw",
  "Czech Republic": "cz",
  "DR Congo": "cd",
  "Ecuador": "ec",
  "Egypt": "eg",
  "England": "gb-eng",
  "France": "fr",
  "Germany": "de",
  "Ghana": "gh",
  "Haiti": "ht",
  "Iran": "ir",
  "Iraq": "iq",
  "Italy": "it",
  "Ivory Coast": "ci",
  "Japan": "jp",
  "Jordan": "jo",
  "Mexico": "mx",
  "Morocco": "ma",
  "Netherlands": "nl",
  "New Zealand": "nz",
  "Norway": "no",
  "Panama": "pa",
  "Paraguay": "py",
  "Portugal": "pt",
  "Qatar": "qa",
  "Saudi Arabia": "sa",
  "Scotland": "gb-sct",
  "Senegal": "sn",
  "Serbia": "rs",
  "South Africa": "za",
  "South Korea": "kr",
  "Spain": "es",
  "Sweden": "se",
  "Switzerland": "ch",
  "Tunisia": "tn",
  "Turkey": "tr",
  "USA": "us",
  "Uruguay": "uy",
  "Uzbekistan": "uz"
};

const TEAM_NAME_PT_MAP = {
  "Algeria": "Argélia",
  "Argentina": "Argentina",
  "Australia": "Austrália",
  "Austria": "Áustria",
  "Belgium": "Bélgica",
  "Bosnia & Herzegovina": "Bósnia e Herzegovina",
  "Brazil": "Brasil",
  "Cape Verde": "Cabo Verde",
  "Canada": "Canadá",
  "Colombia": "Colômbia",
  "Costa Rica": "Costa Rica",
  "Croatia": "Croácia",
  "Curaçao": "Curaçau",
  "Czech Republic": "Chéquia",
  "DR Congo": "RD Congo",
  "Ecuador": "Equador",
  "Egypt": "Egito",
  "England": "Inglaterra",
  "France": "França",
  "Germany": "Alemanha",
  "Ghana": "Gana",
  "Haiti": "Haiti",
  "Iran": "Irão",
  "Iraq": "Iraque",
  "Italy": "Itália",
  "Ivory Coast": "Costa do Marfim",
  "Japan": "Japão",
  "Jordan": "Jordânia",
  "Mexico": "México",
  "Morocco": "Marrocos",
  "Netherlands": "Países Baixos",
  "New Zealand": "Nova Zelândia",
  "Norway": "Noruega",
  "Panama": "Panamá",
  "Paraguay": "Paraguai",
  "Portugal": "Portugal",
  "Qatar": "Catar",
  "Saudi Arabia": "Arábia Saudita",
  "Scotland": "Escócia",
  "Senegal": "Senegal",
  "Serbia": "Sérvia",
  "South Africa": "África do Sul",
  "South Korea": "Coreia do Sul",
  "Spain": "Espanha",
  "Sweden": "Suécia",
  "Switzerland": "Suíça",
  "Tunisia": "Tunísia",
  "Turkey": "Turquia",
  "USA": "Estados Unidos",
  "Uruguay": "Uruguai",
  "Uzbekistan": "Uzbequistão"
};

function getTeamDisplayName(teamName) {
  return TEAM_NAME_PT_MAP[teamName] || teamName || "TBD";
}

const RODADA_FIRST_MATCH_NUMBER = {
  4: 73,
  5: 89,
  6: 97,
  7: 101,
  8: 104
};

function getPlaceholderCode(teamName) {
  const value = String(teamName || "").trim();

  if (/^W\d+$/i.test(value)) {
    return value.toUpperCase();
  }

  return "";
}

function getTeamFlagEmoji(teamName) {
  const flagCode = TEAM_FLAG_MAP[teamName];

  if (!flagCode) return "";

  const normalizedCode = flagCode
    .replace("gb-eng", "gb")
    .replace("gb-sct", "gb")
    .toUpperCase();

  if (normalizedCode.length !== 2) {
    return "";
  }

  return normalizedCode
    .split("")
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

function getPlaceholderOptionsLabel(teamName) {
  const code = getPlaceholderCode(teamName);

  if (!code) return "";

  const options = placeholderOptionsByCode.get(code);

  if (!Array.isArray(options) || options.length < 2) {
    return "";
  }

  return options
    .map(team => {
      const flag = getTeamFlagEmoji(team);
      const name = getTeamDisplayName(team);

      return flag ? `${flag} ${name}` : name;
    })
    .join(" / ");
}

const pageLoader = document.getElementById("page-loader");
const pageLoaderText = document.getElementById("page-loader-text");

const matchesBody = document.getElementById("matches-body");
const palpitesForm = document.getElementById("palpites-form");

const adminRoundControls = document.getElementById("admin-round-controls");
const nextRoundButton = document.getElementById("next-round-btn");

const playerDialog = document.getElementById("player-dialog");
const playerDialogTitle = document.getElementById("player-dialog-title");
const playerDialogSubtitle = document.getElementById("player-dialog-subtitle");
const playerDialogClose = document.getElementById("player-dialog-close");
const playerSearchInput = document.getElementById("player-search-input");
const playerList = document.getElementById("player-list");
const clearPlayerButton = document.getElementById("clear-player-btn");
const cancelPlayerButton = document.getElementById("cancel-player-btn");

const infoCardTitle = document.getElementById("info-title");
const infoCardDescription = document.getElementById("info-description");
const infoCardList = document.getElementById("info-list");
const predictsTableTitle = document.getElementById("grid-title");

const prevRoundViewButton = document.getElementById("prev-round-view-btn");
const nextRoundViewButton = document.getElementById("next-round-view-btn");
const prevRoundLabel = document.getElementById("prev-round-label");
const nextRoundLabel = document.getElementById("next-round-label");
const roundNavCurrentLabel = document.getElementById("round-nav-current-label");
const roundNavStatusLabel = document.getElementById("round-nav-status-label");

const leaderboardBody = document.getElementById("leaderboard-body");
const refreshLeaderboardButton = document.getElementById("refresh-leaderboard-btn");

const treinadorMobileMenuButton = document.querySelector(".treinador-mobile-menu-btn");
const treinadorMobileNav = document.querySelector(".treinador-mobile-nav");

let loadedMatches = [];
let currentRodada = 1;
let viewingRodada = 1;
let isCurrentRodadaLocked = false;
let hasAnyOpenMatch = false;

let activeScorerRow = null;
let activeDialogPlayers = [];
let matchPlayersById = new Map();
let placeholderOptionsByCode = new Map();

// ===============================
// HELPERS
// ===============================

function getToken() {
  return localStorage.getItem(STORAGE_KEYS.token);
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.user));
  } catch {
    return null;
  }
}

function isAdminUser() {
  return getStoredUser()?.role === "admin";
}

function requireLogin() {
  if (!getToken() || !getStoredUser()) {
    window.location.href = "registar.html?mode=login";
    return false;
  }

  return true;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setPageLoading(isLoading, message = "A carregar...") {
  if (pageLoaderText) {
    pageLoaderText.textContent = message;
  }

  if (!pageLoader) return;

  pageLoader.classList.toggle("hidden", !isLoading);
}

function getAuthHeaders(extraHeaders = {}) {
  const token = getToken();

  return {
    ...extraHeaders,
    Authorization: `Bearer ${token}`
  };
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.detail || "Erro no pedido ao servidor.";
    throw new Error(message);
  }

  return data;
}

function formatDateTime(value) {
  if (!value) return "Por definir";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
  }

  return date.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function isMatchClosed(match) {
  if (match.prediction_closed === true) {
    return true;
  }

  if (match.status && match.status !== "scheduled") {
    return true;
  }

  if (!match.starts_at) {
    return false;
  }

  const startsAt = new Date(match.starts_at);

  if (Number.isNaN(startsAt.getTime())) {
    return false;
  }

  return Date.now() >= startsAt.getTime();
}


function isTeamPlaceholder(status) {
  return String(status || "").trim().toLowerCase() === "placeholder";
}

function isMatchFullyConfirmed(match) {
  if (isTeamPlaceholder(match.home_team_status)) {
    return false;
  }

  if (isTeamPlaceholder(match.away_team_status)) {
    return false;
  }

  if (!match.home_team || !match.away_team) {
    return false;
  }

  return true;
}

function getMatchUnavailableReason(match) {
  if (!isMatchFullyConfirmed(match)) {
    return "Por confirmar";
  }

  return "";
}


function getRowLockedReason(match) {
  if (match.prediction) {
    return "Predict submetida";
  }

  if (isMatchClosed(match)) {
    return "Jogo fechado";
  }

  const unavailableReason = getMatchUnavailableReason(match);

  if (unavailableReason) {
    return unavailableReason;
  }

  return "";
}


function getPointsClass(points) {
  if (points <= 0) return "points-zero";
  if (points === 1) return "points-one";
  if (points === 4) return "points-four";
  if (points === 5) return "points-five";
  if (points >= 14) return "points-perfect";

  return "points-mid";
}


function getTeamName(match, side) {
  const team = side === "home" ? match.home_team : match.away_team;
  const status = side === "home" ? match.home_team_status : match.away_team_status;
  const placeholder = side === "home" ? match.home_team_placeholder : match.away_team_placeholder;

  if (status === "placeholder" && placeholder) return placeholder;

  return team || "TBD";
}

function getCleanGroupName(groupName) {
  return String(groupName || "-").replace(/^Group\s+/i, "");
}

function updatePageModeContent() {
  if (!hasAnyOpenMatch) {
    if (infoCardTitle) {
      infoCardTitle.textContent = "Minhas Predicts";
    }

    if (infoCardDescription) {
      infoCardDescription.textContent = "Todos os jogos disponíveis desta rodada já estão bloqueados, submetidos ou fechados.";
    }

    if (infoCardList) {
      infoCardList.innerHTML = `
        <li>Depois de submeteres uma predict, ela fica bloqueada e já não pode ser alterada.</li>
        <li>Os jogos também fecham automaticamente à hora de início.</li>
        <li>Podes consultar as tuas predicts já submetidas na tabela.</li>
      `;
    }

    if (predictsTableTitle) {
      predictsTableTitle.textContent = "Minhas Predicts";
    }

    return;
  }

  if (infoCardTitle) {
    infoCardTitle.textContent = "Como funciona o jogo de predicts";
  }

  if (infoCardDescription) {
    infoCardDescription.innerHTML = `
      Preenche o resultado dos jogos ainda disponíveis e escolhe um marcador, ou seleciona manualmente
      <strong>Sem Marcador</strong>.
    `;
  }

  if (infoCardList) {
    infoCardList.innerHTML = `
      <li>Cada jogo só pode ser submetido uma vez.</li>
      <li>Depois de submeteres uma predict, ela fica bloqueada e já não pode ser alterada.</li>
      <li>Quando o jogo começa, a predict desse jogo fecha automaticamente.</li>
    `;
  }

  if (predictsTableTitle) {
    predictsTableTitle.textContent = "Grelha de jogos e predicts";
  }
}

function updateSubmitButtonState() {
  updatePageModeContent();
  updateRoundNavigator();

  const submitButton = palpitesForm?.querySelector(".btn-submit-palpites");

  if (!submitButton) return;

  if (isViewingPastRodada()) {
    submitButton.disabled = true;
    submitButton.textContent = "Rodada anterior — apenas consulta";
    return;
  }

  if (!hasAnyOpenMatch) {
    submitButton.disabled = true;

    if (isViewingFutureRodada()) {
      submitButton.textContent = "Sem jogos confirmados disponíveis";
    } else {
      submitButton.textContent = "Todos os jogos estão bloqueados";
    }

    return;
  }

  submitButton.disabled = false;

  submitButton.textContent = isViewingCurrentRodada()
    ? "Submeter Predicts Preenchidas"
    : `Submeter Predicts — ${formatRodadaName(viewingRodada)}`;
}

// ===============================
// BANDEIRAS
// ===============================

function getFlagUrl(teamName) {
  const flagCode = TEAM_FLAG_MAP[teamName];

  if (!flagCode) return null;

  return `https://flagcdn.com/80x60/${flagCode}.png`;
}

function renderTeamWithFlag(teamName) {
  const flagUrl = getFlagUrl(teamName);
  const displayName = getTeamDisplayName(teamName);
  const placeholderOptions = getPlaceholderOptionsLabel(teamName);

  if (!flagUrl) {
    return `
      <span class="team-line team-line-placeholder" title="${escapeHtml(displayName)}">
        <span>
          ${escapeHtml(displayName)}
          ${placeholderOptions ? `
            <small class="placeholder-options">
              (${escapeHtml(placeholderOptions)})
            </small>
          ` : ""}
        </span>
      </span>
    `;
  }

  return `
    <span class="team-line" title="${escapeHtml(displayName)}">
      <img
        src="${escapeHtml(flagUrl)}"
        alt="${escapeHtml(displayName)}"
        class="team-flag"
        loading="lazy"
      >
      <span>${escapeHtml(displayName)}</span>
    </span>
  `;
}

// ===============================
// RODADA / ADMIN
// ===============================

function formatRodadaName(rodada) {
  const rodadaNumber = Number(rodada);

  const knockoutLabels = {
    4: "16avos de Final",
    5: "Oitavos de Final",
    6: "Quartos de Final",
    7: "Meias-Finais",
    8: "Final"
  };

  return knockoutLabels[rodadaNumber] || `Rodada ${rodadaNumber}`;
}


function getRodadaShortLabel(rodada) {
  const rodadaNumber = Number(rodada);

  const labels = {
    1: "Rodada 1",
    2: "Rodada 2",
    3: "Rodada 3",
    4: "16avos",
    5: "Oitavos",
    6: "Quartos",
    7: "Meias",
    8: "Final"
  };

  return labels[rodadaNumber] || `Rodada ${rodadaNumber}`;
}

function isViewingCurrentRodada() {
  return Number(viewingRodada) === Number(currentRodada);
}

function isViewingPastRodada() {
  return Number(viewingRodada) < Number(currentRodada);
}

function isViewingFutureRodada() {
  return Number(viewingRodada) > Number(currentRodada);
}

function updateRoundTitle(rodada) {
  const title = document.querySelector(".jornada-title");

  if (!title) return;

  const rodadaNumber = Number(rodada);

  if (rodadaNumber <= 3) {
    title.textContent = `${formatRodadaName(rodadaNumber)} - Fase de Grupos`;
    return;
  }

  title.textContent = formatRodadaName(rodadaNumber);
}


function updateRoundNavigator() {
  const rodadaNumber = Number(viewingRodada);
  const previousRodada = rodadaNumber - 1;
  const nextRodada = rodadaNumber + 1;

  if (roundNavCurrentLabel) {
    roundNavCurrentLabel.textContent = formatRodadaName(rodadaNumber);
  }

  if (prevRoundLabel) {
    prevRoundLabel.textContent = previousRodada >= 1
      ? getRodadaShortLabel(previousRodada)
      : "Início";
  }

  if (nextRoundLabel) {
    nextRoundLabel.textContent = nextRodada <= 8
      ? getRodadaShortLabel(nextRodada)
      : "Fim";
  }

  if (prevRoundViewButton) {
    prevRoundViewButton.disabled = rodadaNumber <= 1;
  }

  if (nextRoundViewButton) {
    nextRoundViewButton.disabled = rodadaNumber >= 8;
  }

  if (roundNavStatusLabel) {
    if (isViewingCurrentRodada()) {
      roundNavStatusLabel.textContent = "Rodada ativa para submissões";
      roundNavStatusLabel.className = "is-current";
    } else if (isViewingPastRodada()) {
      roundNavStatusLabel.textContent = "Rodada anterior — apenas consulta";
      roundNavStatusLabel.className = "is-past";
    } else {
      roundNavStatusLabel.textContent = "Rodada futura — jogos confirmados já aceitam predicts";
      roundNavStatusLabel.className = "is-future";
    }
  }
}

function updateAdminRoundButton() {
  if (!isAdminUser()) {
    adminRoundControls?.classList.add("hidden");
    return;
  }

  adminRoundControls?.classList.remove("hidden");

  if (!nextRoundButton) return;

  const rodadaNumber = Number(currentRodada);
  const nextRodada = rodadaNumber + 1;

  nextRoundButton.disabled = rodadaNumber >= 8;
  nextRoundButton.textContent =
    rodadaNumber >= 8
      ? "Final ativa"
      : `Passar para ${formatRodadaName(nextRodada)} →`;
}

async function setCurrentRodada(rodada) {
  const safeRodada = Math.max(rodada, 1);

  const data = await apiFetch("/admin/game-state/current-rodada", {
    method: "PUT",
    headers: getAuthHeaders({
      "Content-Type": "application/json"
    }),
    body: JSON.stringify({
      current_rodada: safeRodada
    })
  });

  currentRodada = Number(data.current_rodada) || safeRodada;

  return currentRodada;
}

function setupAdminRoundControls() {
  if (!nextRoundButton) return;

  nextRoundButton.addEventListener("click", async () => {
    try {
      if (!isAdminUser()) {
        alert("Só admins podem mudar a rodada.");
        return;
      }

      if (currentRodada >= 8) {
        alert("A Final já está ativa.");
        return;
      }

      const confirmed = confirm(`Passar para ${formatRodadaName(currentRodada + 1)}?`);

      if (!confirmed) return;

      setPageLoading(true, "A atualizar rodada...");

      await setCurrentRodada(currentRodada + 1);
      viewingRodada = currentRodada;

      await loadTreinadorPage();

      alert(`${formatRodadaName(currentRodada)} ativada com sucesso.`);
    } catch (error) {
      alert(`Erro ao mudar rodada: ${error.message}`);
    } finally {
      setPageLoading(false);
    }
  });
}

// ===============================
// DRAFTS
// ===============================

function getDraftKey() {
  const user = getStoredUser();
  const userId = user?.id || user?.email || "guest";

  return `${DRAFT_PREFIX}${userId}_rodada_${viewingRodada}`;
}

function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(getDraftKey())) || {};
  } catch {
    return {};
  }
}

function saveDraft(draft) {
  localStorage.setItem(getDraftKey(), JSON.stringify(draft));
}

function clearCurrentDraft() {
  localStorage.removeItem(getDraftKey());
}

function clearSubmittedRowsFromDraft(rows) {
  const draft = loadDraft();

  rows.forEach(row => {
    delete draft[row.dataset.matchId];
  });

  saveDraft(draft);
}

function saveRowDraft(row) {
  if (row.dataset.locked === "true") return;

  const matchId = row.dataset.matchId;

  if (!matchId) return;

  const draft = loadDraft();

  draft[matchId] = {
    predicted_home_score: row.querySelector(".home-score-input")?.value ?? "",
    predicted_away_score: row.querySelector(".away-score-input")?.value ?? "",
    predicted_scorer_id: row.querySelector(".scorer-select")?.value ?? ""
  };

  saveDraft(draft);
}

function setupDraftListeners() {
  const rows = [...matchesBody.querySelectorAll("tr[data-match-id]")];

  rows.forEach(row => {
    row.addEventListener("input", () => saveRowDraft(row));
    row.addEventListener("change", () => saveRowDraft(row));
  });
}

// ===============================
// PREDICTIONS
// ===============================

function getSubmittedScorerValue(prediction) {
  if (!prediction) return "";

  if (prediction.predicted_scorer_id === null || prediction.predicted_scorer_id === undefined) {
    return NO_SCORER_VALUE;
  }

  return prediction.predicted_scorer_id;
}

function getInitialPrediction(match) {
  if (match.prediction) {
    return {
      predicted_home_score: match.prediction.predicted_home_score ?? "",
      predicted_away_score: match.prediction.predicted_away_score ?? "",
      predicted_scorer_id: getSubmittedScorerValue(match.prediction)
    };
  }

  const initial = {
    predicted_home_score: "",
    predicted_away_score: "",
    predicted_scorer_id: ""
  };

  if (isMatchClosed(match)) {
    return initial;
  }

  const draft = loadDraft();
  const local = draft[match.id];

  if (!local) return initial;

  return {
    predicted_home_score: local.predicted_home_score ?? "",
    predicted_away_score: local.predicted_away_score ?? "",
    predicted_scorer_id: local.predicted_scorer_id ?? ""
  };
}

// ===============================
// JOGADORES / DIALOG
// ===============================

function getPlayerLabel(player) {
  const shirtNumber = player.shirt_number ? ` #${player.shirt_number}` : "";
  return `${player.player_name}${shirtNumber}`;
}

function renderScorerPicker(players, selectedPlayerId = "", disabled = false) {
  const selectedPlayer = players.find(player => String(player.player_id) === String(selectedPlayerId));
  const isNoScorer = selectedPlayerId === NO_SCORER_VALUE;

  let selectedName = "Escolher";
  let stateClass = "is-placeholder";

  if (selectedPlayer) {
    selectedName = getPlayerLabel(selectedPlayer);
    stateClass = "has-player";
  } else if (isNoScorer) {
    selectedName = "Sem Marcador";
    stateClass = "has-player";
  }

  const disabledAttribute = disabled ? "disabled" : "";
  const lockedClass = disabled ? "is-locked" : "";

  return `
    <div class="scorer-picker">
      <button type="button" class="scorer-picker-btn ${stateClass} ${lockedClass}" ${disabledAttribute}>
        <span class="scorer-selected-name">${escapeHtml(selectedName)}</span>
      </button>

      <input
        type="hidden"
        class="scorer-select"
        value="${escapeHtml(selectedPlayerId || "")}"
      >
    </div>
  `;
}

function setupScorerPickerButtons() {
  const buttons = [...matchesBody.querySelectorAll(".scorer-picker-btn")];

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      if (button.disabled) return;

      const row = button.closest("tr[data-match-id]");
      if (!row || row.dataset.locked === "true") return;

      openPlayerDialog(row);
    });
  });
}

function openPlayerDialog(row) {
  const matchId = row.dataset.matchId;
  const players = matchPlayersById.get(String(matchId)) || [];

  activeScorerRow = row;
  activeDialogPlayers = players;

  const homeTeam = getTeamDisplayName(row.dataset.homeTeam) || "Equipa da casa";
  const awayTeam = getTeamDisplayName(row.dataset.awayTeam) || "Equipa de fora";

  if (playerDialogTitle) {
    playerDialogTitle.textContent = "Escolher marcador";
  }

  if (playerDialogSubtitle) {
    playerDialogSubtitle.textContent = `${homeTeam} vs ${awayTeam}`;
  }

  if (playerSearchInput) {
    playerSearchInput.value = "";
  }

  renderPlayerDialogList(players);

  if (playerDialog?.showModal) {
    playerDialog.showModal();

    setTimeout(() => {
      playerSearchInput?.focus();
    }, 50);
  }
}

function getCurrentSelectedPlayerId() {
  if (!activeScorerRow) return "";

  return activeScorerRow.querySelector(".scorer-select")?.value || "";
}

function renderPlayerDialogList(players) {
  if (!playerList) return;

  const query = String(playerSearchInput?.value || "").trim().toLowerCase();
  const filteredPlayers = players.filter(player => {
    const name = String(player.player_name || "").toLowerCase();
    const number = String(player.shirt_number || "").toLowerCase();

    return !query || name.includes(query) || number.includes(query);
  });

  if (!filteredPlayers.length) {
    playerList.innerHTML = `
      <div class="player-empty">
        Nenhum jogador encontrado.
      </div>
    `;
    return;
  }

  const homePlayers = filteredPlayers.filter(player => player.team === "home");
  const awayPlayers = filteredPlayers.filter(player => player.team === "away");

  const homeLabel = activeScorerRow
    ? getTeamDisplayName(activeScorerRow.dataset.homeTeam)
    : "Equipa da casa";

  const awayLabel = activeScorerRow
    ? getTeamDisplayName(activeScorerRow.dataset.awayTeam)
    : "Equipa de fora";

  playerList.innerHTML = `
    ${renderPlayerDialogSection(homeLabel, homePlayers)}
    ${renderPlayerDialogSection(awayLabel, awayPlayers)}
  `;

  playerList.querySelectorAll(".player-option").forEach(button => {
    button.addEventListener("click", () => {
      const playerId = button.dataset.playerId;
      const player = activeDialogPlayers.find(item => String(item.player_id) === String(playerId));

      if (player) {
        selectDialogPlayer(player);
      }
    });
  });
}

function renderPlayerDialogSection(label, players) {
  if (!players.length) return "";

  const selectedPlayerId = getCurrentSelectedPlayerId();

  return `
    <section class="player-team-section">
      <div class="player-team-title">${escapeHtml(label)}</div>

      <div class="player-grid">
        ${players.map(player => {
          const selected = String(player.player_id) === String(selectedPlayerId) ? "selected" : "";
          const shirtNumber = player.shirt_number ? `#${escapeHtml(player.shirt_number)}` : "Sem número";

          return `
            <button
              type="button"
              class="player-option ${selected}"
              data-player-id="${escapeHtml(player.player_id)}"
            >
              <span>${escapeHtml(player.player_name)}</span>
              <span class="player-option-number">${shirtNumber}</span>
            </button>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function selectDialogPlayer(player) {
  if (!activeScorerRow || activeScorerRow.dataset.locked === "true") return;

  const hiddenInput = activeScorerRow.querySelector(".scorer-select");
  const button = activeScorerRow.querySelector(".scorer-picker-btn");
  const label = activeScorerRow.querySelector(".scorer-selected-name");

  if (hiddenInput) {
    hiddenInput.value = player.player_id;
  }

  if (label) {
    label.textContent = getPlayerLabel(player);
  }

  if (button) {
    button.classList.add("has-player");
    button.classList.remove("is-placeholder");
  }

  saveRowDraft(activeScorerRow);
  closePlayerDialog();
}

function clearDialogPlayer() {
  if (!activeScorerRow || activeScorerRow.dataset.locked === "true") return;

  const hiddenInput = activeScorerRow.querySelector(".scorer-select");
  const button = activeScorerRow.querySelector(".scorer-picker-btn");
  const label = activeScorerRow.querySelector(".scorer-selected-name");

  if (hiddenInput) {
    hiddenInput.value = NO_SCORER_VALUE;
  }

  if (label) {
    label.textContent = "Sem Marcador";
  }

  if (button) {
    button.classList.add("has-player");
    button.classList.remove("is-placeholder");
  }

  saveRowDraft(activeScorerRow);
  closePlayerDialog();
}

function closePlayerDialog() {
  if (playerDialog?.open) {
    playerDialog.close();
  }

  activeScorerRow = null;
  activeDialogPlayers = [];
}

function setupPlayerDialog() {
  playerDialogClose?.addEventListener("click", closePlayerDialog);
  cancelPlayerButton?.addEventListener("click", closePlayerDialog);
  clearPlayerButton?.addEventListener("click", clearDialogPlayer);

  playerSearchInput?.addEventListener("input", () => {
    renderPlayerDialogList(activeDialogPlayers);
  });

  playerDialog?.addEventListener("click", event => {
    if (event.target === playerDialog) {
      closePlayerDialog();
    }
  });
}

// ===============================
// LEADERBOARD
// ===============================

function renderLeaderboardLoading() {
  if (!leaderboardBody) return;

  leaderboardBody.innerHTML = `
    <tr>
      <td colspan="3" class="leaderboard-loading">
        A carregar leaderboard...
      </td>
    </tr>
  `;
}

function renderLeaderboardError(message = "Erro ao carregar leaderboard.") {
  if (!leaderboardBody) return;

  leaderboardBody.innerHTML = `
    <tr>
      <td colspan="3" class="leaderboard-error">
        ${escapeHtml(message)}
      </td>
    </tr>
  `;
}

function renderLeaderboard(rows) {
  if (!leaderboardBody) return;

  if (!Array.isArray(rows) || rows.length === 0) {
    leaderboardBody.innerHTML = `
      <tr>
        <td colspan="3" class="leaderboard-empty">
          Ainda não há participantes na leaderboard.
        </td>
      </tr>
    `;
    return;
  }

  const currentUser = getStoredUser();
  const currentUserId = String(currentUser?.id || "");

  leaderboardBody.innerHTML = rows.map((row) => {
    const isCurrentUser = String(row.user_id) === currentUserId;

    return `
      <tr class="${isCurrentUser ? "is-current-user" : ""}">
        <td>
          <span class="leaderboard-position">
            ${escapeHtml(row.position)}
          </span>
        </td>

        <td>
          <span class="leaderboard-user">
            ${escapeHtml(row.name)}
            ${isCurrentUser ? `<span class="you-badge">Tu</span>` : ""}
          </span>
        </td>

        <td>
          <span class="leaderboard-points">
            ${escapeHtml(row.total_points)} pts
          </span>
        </td>
      </tr>
    `;
  }).join("");
}

async function loadLeaderboard() {
  try {
    renderLeaderboardLoading();

    const data = await apiFetch("/leaderboard");

    renderLeaderboard(data);
  } catch (error) {
    renderLeaderboardError(error.message);
  }
}

// ===============================
// LOAD / RENDER
// ===============================

function getPreviousRodadaForPlaceholders(rodada) {
  const rodadaNumber = Number(rodada);

  if (rodadaNumber >= 5 && rodadaNumber <= 8) {
    return rodadaNumber - 1;
  }

  return null;
}

function buildPlaceholderOptionsFromMatches(rodada, matches) {
  const firstMatchNumber = RODADA_FIRST_MATCH_NUMBER[Number(rodada)];

  if (!firstMatchNumber || !Array.isArray(matches)) {
    return;
  }

  matches.forEach((match, index) => {
    const matchNumber = firstMatchNumber + index;
    const code = `W${matchNumber}`;

    const homeTeam = getTeamName(match, "home");
    const awayTeam = getTeamName(match, "away");

    if (!homeTeam || !awayTeam || homeTeam === "TBD" || awayTeam === "TBD") {
      return;
    }

    placeholderOptionsByCode.set(code, [homeTeam, awayTeam]);
  });
}

async function loadPlaceholderOptionsForRodada(rodada) {
  placeholderOptionsByCode = new Map();

  const previousRodada = getPreviousRodadaForPlaceholders(rodada);

  if (!previousRodada) {
    return;
  }

  try {
    const data = await apiFetch(`/treinador/rodada/${previousRodada}`, {
      headers: getAuthHeaders()
    });

    const previousMatches = Array.isArray(data.matches) ? data.matches : [];

    buildPlaceholderOptionsFromMatches(previousRodada, previousMatches);
  } catch {
    placeholderOptionsByCode = new Map();
  }
}


async function loadTreinadorPage() {
  try {
    matchesBody.innerHTML = `
      <tr>
        <td colspan="5" class="loading-cell">
          A carregar jogos, jogadores e predicts...
        </td>
      </tr>
    `;

    const endpoint = isViewingCurrentRodada()
      ? "/treinador/current"
      : `/treinador/rodada/${viewingRodada}`;

    const data = await apiFetch(endpoint, {
      headers: getAuthHeaders()
    });

    if (endpoint === "/treinador/current") {
      currentRodada = Number(data.rodada) || 1;
      viewingRodada = currentRodada;
    } else {
      viewingRodada = Number(data.rodada) || viewingRodada;
    }

    loadedMatches = Array.isArray(data.matches) ? data.matches : [];

    await loadPlaceholderOptionsForRodada(viewingRodada);

    hasAnyOpenMatch =
      !isViewingPastRodada() &&
      loadedMatches.some(match => !getRowLockedReason(match));

    isCurrentRodadaLocked = !hasAnyOpenMatch;

    updateRoundTitle(viewingRodada);
    updateAdminRoundButton();
    updatePageModeContent();
    updateRoundNavigator();

    if (!loadedMatches.length) {
      updateSubmitButtonState();

      matchesBody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-cell">
            Não há jogos disponíveis para esta rodada.
          </td>
        </tr>
      `;

      return;
    }

    await renderMatches(loadedMatches);
    updateSubmitButtonState();
  } catch (error) {
    matchesBody.innerHTML = `
      <tr>
        <td colspan="5" class="error-cell">
          Erro ao carregar jogos: ${escapeHtml(error.message)}
        </td>
      </tr>
    `;
  }
}

async function renderMatches(matches) {
  matchesBody.innerHTML = "";
  matchPlayersById = new Map();

  for (const match of matches) {
    const players = Array.isArray(match.players) ? match.players : [];

    matchPlayersById.set(String(match.id), players);

    const initialPrediction = getInitialPrediction(match);
    const homeTeam = getTeamName(match, "home");
    const awayTeam = getTeamName(match, "away");
    const lockedReason = getRowLockedReason(match);
    const disabled = Boolean(lockedReason) || isViewingPastRodada();
    const lockBadgeClass = lockedReason === "Predict submetida"
    ? "is-submitted"
    : lockedReason === "Jogo fechado"
      ? "is-closed"
      : lockedReason === "Por confirmar"
        ? "is-pending"
        : "";
    
    const isScored = match.prediction?.is_scored === true;
    const pointsEarned = Number(match.prediction?.points_earned ?? 0);
    const pointsClass = getPointsClass(pointsEarned);

    const row = document.createElement("tr");
    row.dataset.matchId = match.id;
    row.dataset.homeTeam = homeTeam;
    row.dataset.awayTeam = awayTeam;
    row.dataset.locked = disabled ? "true" : "false";
    
    if (isScored) {
      row.classList.add("is-scored", pointsClass);
    }

    row.innerHTML = `
      <td class="time-cell">
        ${escapeHtml(formatDateTime(match.starts_at))}

        <div class="match-badges-stack">
          ${lockedReason ? `<div class="match-lock-badge ${lockBadgeClass}">${escapeHtml(lockedReason)}</div>` : ""}

          ${isScored ? `
            <div class="match-points-badge ${pointsClass}">
              +${escapeHtml(pointsEarned)} pts
            </div>
          ` : ""}
        </div>
      </td>

      <td class="group-cell">
        <strong>${escapeHtml(getCleanGroupName(match.group_name))}</strong>
      </td>

      <td class="team-cell">
        <div class="team-match">
          ${renderTeamWithFlag(homeTeam)}
          <span class="versus">vs</span>
          ${renderTeamWithFlag(awayTeam)}
        </div>
      </td>

      <td class="text-center nowrap">
        <input
          type="number"
          min="0"
          class="input-golo home-score-input"
          placeholder="0"
          value="${escapeHtml(initialPrediction.predicted_home_score)}"
          ${disabled ? "disabled" : ""}
        >

        <span class="multiplier-x">X</span>

        <input
          type="number"
          min="0"
          class="input-golo away-score-input"
          placeholder="0"
          value="${escapeHtml(initialPrediction.predicted_away_score)}"
          ${disabled ? "disabled" : ""}
        >
      </td>

      <td>
        ${renderScorerPicker(players, initialPrediction.predicted_scorer_id, disabled)}
      </td>
    `;

    matchesBody.appendChild(row);
  }

  setupDraftListeners();
  setupScorerPickerButtons();
}

// ===============================
// VALIDAÇÃO / SUBMISSÃO
// ===============================

function rowHasAnyPredictionInput(row) {
  const homeScore = row.querySelector(".home-score-input")?.value;
  const awayScore = row.querySelector(".away-score-input")?.value;
  const scorerId = row.querySelector(".scorer-select")?.value;

  return homeScore !== "" || awayScore !== "" || scorerId !== "";
}

function rowHasCompletePredictionInput(row) {
  const homeScore = row.querySelector(".home-score-input")?.value;
  const awayScore = row.querySelector(".away-score-input")?.value;
  const scorerId = row.querySelector(".scorer-select")?.value;

  return homeScore !== "" && awayScore !== "" && scorerId !== "";
}

function validatePredictionRows(rows) {
  for (const row of rows) {
    if (row.dataset.locked === "true") {
      continue;
    }

    const homeTeam = getTeamDisplayName(row.dataset.homeTeam);
    const awayTeam = getTeamDisplayName(row.dataset.awayTeam);

    const homeScore = row.querySelector(".home-score-input")?.value;
    const awayScore = row.querySelector(".away-score-input")?.value;
    const scorerId = row.querySelector(".scorer-select")?.value;

    if (homeScore === "" || awayScore === "") {
      alert(`Tens de preencher o resultado completo de ${homeTeam} vs ${awayTeam}.`);
      return false;
    }

    if (Number(homeScore) < 0 || Number(awayScore) < 0) {
      alert(`Os golos não podem ser negativos em ${homeTeam} vs ${awayTeam}.`);
      return false;
    }

    if (!scorerId) {
      alert(`Tens de escolher um marcador ou selecionar "Sem Marcador" em ${homeTeam} vs ${awayTeam}.`);
      return false;
    }
  }

  return true;
}

async function submitPredictions(event) {
  event.preventDefault();

  if (isViewingPastRodada()) {
    alert("Esta rodada já é apenas para consulta.");
    return;
  }

  const rows = [...matchesBody.querySelectorAll("tr[data-match-id]")];
  const openRows = rows.filter(row => row.dataset.locked !== "true");

  const rowsToSubmit = openRows.filter(row => rowHasCompletePredictionInput(row));

  const incompleteRows = openRows.filter(row => {
    return rowHasAnyPredictionInput(row) && !rowHasCompletePredictionInput(row);
  });

  if (!openRows.length) {
    alert("Não há jogos disponíveis para submeter.");
    return;
  }

  if (!rowsToSubmit.length) {
    alert("Não tens nenhum jogo completo para submeter. Preenche resultado e marcador em pelo menos um jogo.");
    return;
  }

  if (!validatePredictionRows(rowsToSubmit)) {
    return;
  }

  const submitButton = palpitesForm.querySelector(".btn-submit-palpites");

  submitButton.disabled = true;
  submitButton.textContent = "A submeter...";
  setPageLoading(true, "A submeter os teus predicts... Aguarda um momento.");

  try {
    const predictionsPayload = rowsToSubmit.map(row => {
      saveRowDraft(row);

      const scorerValue = row.querySelector(".scorer-select").value;

      return {
        match_id: row.dataset.matchId,
        predicted_home_score: Number(row.querySelector(".home-score-input").value),
        predicted_away_score: Number(row.querySelector(".away-score-input").value),
        predicted_scorer_id: scorerValue === NO_SCORER_VALUE ? null : scorerValue
      };
    });

    const result = await apiFetch(`/treinador/rodada/${viewingRodada}/submit`, {
      method: "POST",
      headers: getAuthHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        predictions: predictionsPayload
      })
    });

    clearSubmittedRowsFromDraft(rowsToSubmit);

    await loadTreinadorPage();
    await loadLeaderboard();

    const created = Number(result?.created || 0);
    const alreadySubmitted = Number(result?.already_submitted || 0);
    const blocked = Array.isArray(result?.blocked) ? result.blocked.length : 0;
    const ignoredIncomplete = incompleteRows.length;

    let message = "";

    if (created > 0) {
      message = created === 1
        ? "Boa! 1 predict foi submetida e ficou bloqueada."
        : `Boa! ${created} predicts foram submetidas e ficaram bloqueadas.`;
    } else {
      message = "Nenhuma predict nova foi submetida.";
    }

    if (alreadySubmitted > 0) {
      message += ` ${alreadySubmitted} já tinham sido submetidas.`;
    }

    if (blocked > 0) {
      message += ` ${blocked} já estavam fechadas.`;
    }

    if (ignoredIncomplete > 0) {
      message += ` ${ignoredIncomplete} jogo${ignoredIncomplete === 1 ? "" : "s"} meio preenchido${ignoredIncomplete === 1 ? " foi ignorado" : "s foram ignorados"}.`;
    }

    alert(message);
  } catch (error) {
    alert(`Erro ao submeter predicts: ${error.message}`);
    updateSubmitButtonState();
  } finally {
    setPageLoading(false);
  }
}


async function changeViewingRodada(nextRodada) {
  const safeRodada = Math.min(Math.max(Number(nextRodada), 1), 8);

  if (safeRodada === Number(viewingRodada)) {
    return;
  }

  viewingRodada = safeRodada;

  setPageLoading(true, `A carregar ${formatRodadaName(viewingRodada)}...`);

  try {
    await loadTreinadorPage();
  } catch (error) {
    alert(`Erro ao carregar rodada: ${error.message}`);
  } finally {
    setPageLoading(false);
  }
}

function setupRoundNavigator() {
  prevRoundViewButton?.addEventListener("click", () => {
    changeViewingRodada(Number(viewingRodada) - 1);
  });

  nextRoundViewButton?.addEventListener("click", () => {
    changeViewingRodada(Number(viewingRodada) + 1);
  });
}


// ===============================
// MOBILE MENU
// ===============================

function setupTreinadorMobileMenu() {
  if (!treinadorMobileMenuButton || !treinadorMobileNav) return;

  treinadorMobileMenuButton.addEventListener("click", () => {
    treinadorMobileNav.classList.toggle("open");
  });

  treinadorMobileNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      treinadorMobileNav.classList.remove("open");
    });
  });

  document.addEventListener("click", event => {
    const clickedInsideMenu = treinadorMobileNav.contains(event.target);
    const clickedButton = treinadorMobileMenuButton.contains(event.target);

    if (!clickedInsideMenu && !clickedButton) {
      treinadorMobileNav.classList.remove("open");
    }
  });
}

// ===============================
// INIT
// ===============================

document.addEventListener("DOMContentLoaded", async () => {
  if (!requireLogin()) return;

  setupAdminRoundControls();
  setupPlayerDialog();
  setupRoundNavigator();
  setupTreinadorMobileMenu();

  refreshLeaderboardButton?.addEventListener("click", loadLeaderboard);

  try {
    setPageLoading(
      true,
      "A carregar jogos, jogadores e predicts... Aguarda um momento."
    );

    await loadTreinadorPage();
    await loadLeaderboard();
  } finally {
    setPageLoading(false);
  }

  if (palpitesForm) {
    palpitesForm.addEventListener("submit", submitPredictions);
  }
});

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

  backToTopButton.addEventListener("click", event => {
    event.preventDefault();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}