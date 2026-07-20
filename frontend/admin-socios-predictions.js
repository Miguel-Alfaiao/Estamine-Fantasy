// ===============================
// ADMIN DASHBOARD - SÓCIOS PREDICTIONS
// ===============================

const SOCIOS_PREDICTIONS_API_BASE_URL = "https://backend-fantasy-6dnx.onrender.com";
const sociosPredictionsToken = localStorage.getItem("access_token");
const sociosPredictionsRoot = document.getElementById("admin-socios-predictions-root");

let sociosPredictionsAlreadyLoaded = false;

function escapeSociosPredictionHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatSociosPredictionDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("pt-PT", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function initSociosPredictionsMarkup() {
  if (!sociosPredictionsRoot) return;

  sociosPredictionsRoot.innerHTML = `
    <section class="admin-table-card">
      <div class="admin-table-header">
        <div class="socios-predictions-header-text">
          <h2>Predicts dos Sócios</h2>
          <p>Vê as previsões especiais submetidas no Plano Sócios.</p>
        </div>

        <button id="refresh-socios-predictions" type="button">Atualizar</button>
      </div>

      <div id="socios-predictions-summary" class="socios-predictions-summary">
        <article>
          <span>Total de submissões</span>
          <strong id="socios-predictions-total">0</strong>
        </article>

        <article>
          <span>Subs confirmados</span>
          <strong id="socios-predictions-subs">0</strong>
        </article>

        <article>
          <span>Sem sub confirmado</span>
          <strong id="socios-predictions-non-subs">0</strong>
        </article>
      </div>

      <div id="socios-predictions-list" class="predictions-list socios-predictions-list">
        <div class="empty-state">
          Abre esta aba para carregar os dados.
        </div>
      </div>
    </section>
  `;

  document
    .getElementById("refresh-socios-predictions")
    .addEventListener("click", () => loadAdminSociosPredictions(true));
}

function getSociosPredictionsListElement() {
  return document.getElementById("socios-predictions-list");
}

function setSociosPredictionsSummary(rows) {
  const total = rows.length;
  const subs = rows.filter((row) => row.is_sub).length;
  const nonSubs = total - subs;

  document.getElementById("socios-predictions-total").textContent = total;
  document.getElementById("socios-predictions-subs").textContent = subs;
  document.getElementById("socios-predictions-non-subs").textContent = nonSubs;
}

function showSociosPredictionsLoading() {
  getSociosPredictionsListElement().innerHTML = `
    <div class="empty-state">A carregar predicts dos sócios...</div>
  `;
}

function renderSociosPredictionField(label, value) {
  return `
    <div class="socios-prediction-field">
      <span>${escapeSociosPredictionHtml(label)}</span>
      <strong>${escapeSociosPredictionHtml(value || "-")}</strong>
    </div>
  `;
}

function renderSociosPredictionCard(row) {
  const prediction = row.prediction || {};
  const twitchName = row.twitch_display_name || "Twitch não ligada";
  const subLabel = row.is_sub ? "Sub confirmado" : "Sem sub confirmado";

  return `
    <article class="prediction-user-card socios-prediction-card">
      <button class="prediction-user-toggle socios-prediction-toggle" type="button">
        <div class="prediction-user-main">
          <span class="prediction-user-name">
            ${escapeSociosPredictionHtml(row.user_name)}
          </span>

          <span class="prediction-user-email">
            ${escapeSociosPredictionHtml(row.user_email)}
          </span>

          <span class="socios-twitch-name">
            Twitch: ${escapeSociosPredictionHtml(twitchName)}
          </span>
        </div>

        <div class="prediction-user-meta">
          <span class="socios-sub-pill ${row.is_sub ? "sub-ok" : "sub-no"}">
            ${escapeSociosPredictionHtml(subLabel)}
          </span>

          <span class="prediction-arrow">+</span>
        </div>
      </button>

      <div class="prediction-user-body">
        <div class="socios-prediction-detail">
          <section class="socios-prediction-section winner-section">
            ${renderSociosPredictionField("Vencedor", prediction.vencedor)}
          </section>

          <section class="socios-prediction-section">
            <h3>Melhor jogador</h3>
            ${renderSociosPredictionField("1.º", prediction.melhor_jogador_1)}
            ${renderSociosPredictionField("2.º", prediction.melhor_jogador_2)}
            ${renderSociosPredictionField("3.º", prediction.melhor_jogador_3)}
          </section>

          <section class="socios-prediction-section">
            <h3>Melhor marcador</h3>
            ${renderSociosPredictionField("1.º", prediction.melhor_marcador_1)}
            ${renderSociosPredictionField("2.º", prediction.melhor_marcador_2)}
            ${renderSociosPredictionField("3.º", prediction.melhor_marcador_3)}
          </section>

          <section class="socios-prediction-section">
            <h3>Prémios individuais</h3>
            ${renderSociosPredictionField("Guarda-redes", prediction.melhor_guarda_redes)}
            ${renderSociosPredictionField("Jovem", prediction.melhor_jovem)}
          </section>

          <section class="socios-prediction-section submitted-section">
            ${renderSociosPredictionField("Submetido em", formatSociosPredictionDate(prediction.submitted_at))}
            ${renderSociosPredictionField("Atualizado em", formatSociosPredictionDate(prediction.updated_at))}
          </section>
        </div>
      </div>
    </article>
  `;
}

function attachSociosPredictionToggles() {
  document.querySelectorAll(".socios-prediction-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".prediction-user-card");
      card.classList.toggle("open");
    });
  });
}

function renderSociosPredictions(rows) {
  sociosPredictionsAlreadyLoaded = true;

  const list = getSociosPredictionsListElement();
  setSociosPredictionsSummary(rows);

  if (!rows.length) {
    list.innerHTML = `
      <div class="empty-state">
        Ainda não existem predicts submetidas no Plano Sócios.
      </div>
    `;
    return;
  }

  list.innerHTML = rows.map(renderSociosPredictionCard).join("");
  attachSociosPredictionToggles();
}

async function loadAdminSociosPredictions(forceReload = false) {
  if (!sociosPredictionsRoot) return;

  if (sociosPredictionsAlreadyLoaded && !forceReload) {
    return;
  }

  const list = getSociosPredictionsListElement();

  if (!sociosPredictionsToken) {
    list.innerHTML = `
      <div class="empty-state">
        Tens de iniciar sessão como admin para ver os dados.
      </div>
    `;
    return;
  }

  try {
    showSociosPredictionsLoading();

    const response = await fetch(
      `${SOCIOS_PREDICTIONS_API_BASE_URL}/socios/admin/predictions`,
      {
        headers: {
          Authorization: `Bearer ${sociosPredictionsToken}`
        }
      }
    );

    if (response.status === 401) {
      list.innerHTML = `
        <div class="empty-state">
          Sessão expirada. Faz login novamente.
        </div>
      `;
      return;
    }

    if (response.status === 403) {
      list.innerHTML = `
        <div class="empty-state">
          A tua conta não tem permissões de administrador.
        </div>
      `;
      return;
    }

    if (!response.ok) {
      list.innerHTML = `
        <div class="empty-state">
          Erro ao carregar predicts dos sócios.
        </div>
      `;
      return;
    }

    const rows = await response.json();
    renderSociosPredictions(Array.isArray(rows) ? rows : []);
  } catch (error) {
    console.error(error);

    list.innerHTML = `
      <div class="empty-state">
        Erro ao comunicar com o backend.
      </div>
    `;
  }
}

initSociosPredictionsMarkup();
window.loadAdminSociosPredictions = loadAdminSociosPredictions;