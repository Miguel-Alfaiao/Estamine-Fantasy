// frontend/draft.js

const DRAFT_API_BASE_URL = "https://backend-fantasy-6dnx.onrender.com";
// Para testar localmente:
// const DRAFT_API_BASE_URL = "http://127.0.0.1:8000";

const TOKEN_KEY = "access_token";

const draftForm = document.getElementById("draftForm");
const resumoContainer = document.getElementById("resumoDraft");
const resumoTableBody = document.getElementById("resumoTableBody");
const submitButton = draftForm?.querySelector(".btn-submit");

const pageLoader = document.getElementById("page-loader");
const pageLoaderText = document.getElementById("page-loader-text");

let draftAlreadySubmitted = false;

// ===============================
// HELPERS
// ===============================

function setPageLoading(isLoading, message = "A carregar...") {
  if (pageLoaderText) {
    pageLoaderText.textContent = message;
  }

  if (!pageLoader) return;

  pageLoader.classList.toggle("hidden", !isLoading);
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getAuthHeaders(extraHeaders = {}) {
  return {
    ...extraHeaders,
    Authorization: `Bearer ${getToken()}`
  };
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${DRAFT_API_BASE_URL}${path}`, options);

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

function getCheckedBoxesFromCard(card) {
  return [...card.querySelectorAll(".team-checkbox:checked")];
}

function updatePoteCounter(card) {
  const counter = card.querySelector(".pote-counter");
  const checkedCount = getCheckedBoxesFromCard(card).length;

  if (counter) {
    counter.textContent = `${checkedCount}/2`;
  }
}

function updateAllCounters() {
  document.querySelectorAll(".pote-card").forEach(card => {
    updatePoteCounter(card);
  });
}

// ===============================
// RESUMO
// ===============================

function atualizarTabelaResumo() {
  if (!resumoContainer || !resumoTableBody) return;

  resumoTableBody.innerHTML = "";

  const todasSelecionadas = document.querySelectorAll(".team-checkbox:checked");

  if (todasSelecionadas.length === 0) {
    resumoContainer.style.display = "none";
    return;
  }

  resumoContainer.style.display = "block";

  document.querySelectorAll(".pote-card").forEach(card => {
    const poteNumero = card.getAttribute("data-pote");
    const pontos = card.getAttribute("data-pts");
    const selecionadasNoPote = card.querySelectorAll(".team-checkbox:checked");

    selecionadasNoPote.forEach(checkbox => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td style="font-weight: bold; color: var(--text-secondary);">Pote ${poteNumero}</td>
        <td style="font-style: italic;">${checkbox.value}</td>
        <td style="color: var(--selection-active); font-weight: bold;">+${pontos} pts</td>
        <td style="color: var(--selection-active); font-weight: bold;">+${pontos} pts</td>
      `;

      resumoTableBody.appendChild(tr);
    });
  });
}

// ===============================
// VALIDAÇÃO
// ===============================

function validateDraftSelection() {
  const picks = [];

  for (const card of document.querySelectorAll(".pote-card")) {
    const poteNumero = Number(card.getAttribute("data-pote"));
    const checkedBoxes = getCheckedBoxesFromCard(card);

    if (checkedBoxes.length !== 2) {
      const poteNome = card.querySelector(".pote-header span")?.textContent || `Pote ${poteNumero}`;
      alert(`Precisas de escolher exatamente 2 seleções no ${poteNome}!`);
      return null;
    }

    checkedBoxes.forEach(checkbox => {
      picks.push({
        team: checkbox.value,
        pot: poteNumero
      });
    });
  }

  if (picks.length !== 8) {
    alert("Tens de escolher exatamente 8 seleções no total.");
    return null;
  }

  return picks;
}

// ===============================
// BLOQUEAR / DESBLOQUEAR
// ===============================

function lockDraftForm(message = "Draft já submetido") {
  draftAlreadySubmitted = true;

  document.querySelectorAll("#draftForm .team-checkbox").forEach(checkbox => {
    checkbox.disabled = true;
  });

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = message;
  }
}

function unlockDraftForm() {
  draftAlreadySubmitted = false;

  document.querySelectorAll("#draftForm .team-checkbox").forEach(checkbox => {
    checkbox.disabled = false;
  });

  if (submitButton) {
    submitButton.disabled = false;
    submitButton.textContent = "Submeter Equipas do Draft";
  }
}

function applySubmittedDraft(picks) {
  const selectedTeams = new Set((picks || []).map(pick => pick.team));

  document.querySelectorAll("#draftForm .team-checkbox").forEach(checkbox => {
    checkbox.checked = selectedTeams.has(checkbox.value);
  });

  updateAllCounters();
  atualizarTabelaResumo();
  lockDraftForm("Draft já submetido");
}

// ===============================
// CARREGAR DRAFT EXISTENTE
// ===============================

async function loadMyDraft() {
  const data = await apiFetch("/draft/me", {
    headers: getAuthHeaders()
  });

  if (data.submitted) {
    applySubmittedDraft(data.picks);
    return;
  }

  unlockDraftForm();
}

// ===============================
// EVENTOS DOS CHECKBOXES
// ===============================

function setupCheckboxLimits() {
  document.querySelectorAll(".pote-card").forEach(card => {
    const checkboxes = card.querySelectorAll(".team-checkbox");
    const counter = card.querySelector(".pote-counter");

    checkboxes.forEach(checkbox => {
      checkbox.addEventListener("change", () => {
        if (draftAlreadySubmitted) {
          return;
        }

        const checkedCount = card.querySelectorAll(".team-checkbox:checked").length;

        if (checkedCount > 2) {
          checkbox.checked = false;
          alert("Só podes escolher 2 seleções deste pote!");
          return;
        }

        if (counter) {
          counter.textContent = `${checkedCount}/2`;
        }

        atualizarTabelaResumo();
      });
    });

    updatePoteCounter(card);
  });

  atualizarTabelaResumo();
}

// ===============================
// SUBMISSÃO
// ===============================

async function submitDraft(event) {
  event.preventDefault();

  if (draftAlreadySubmitted) {
    alert("Já submeteste o teu Draft das Nações.");
    return;
  }

  const picks = validateDraftSelection();

  if (!picks) return;

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "A submeter...";
  }

  setPageLoading(true, "A submeter o teu Draft... Aguarda um momento.");

  try {
    await apiFetch("/draft/submit", {
      method: "POST",
      headers: getAuthHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        picks
      })
    });

    await loadMyDraft();

    alert("Draft submetido com sucesso!");
  } catch (error) {
    alert(`Erro ao submeter draft: ${error.message}`);

    if (!draftAlreadySubmitted && submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Submeter Equipas do Draft";
    }
  } finally {
    setPageLoading(false);
  }
}

// ===============================
// INIT
// ===============================

document.addEventListener("DOMContentLoaded", async () => {
  setPageLoading(true, "A carregar o teu Draft...");

  setupCheckboxLimits();

  if (draftForm) {
    draftForm.addEventListener("submit", submitDraft);
  }

  try {
    await loadMyDraft();
  } catch (error) {
    console.error("Erro ao carregar draft do utilizador:", error);
    alert(`Erro ao carregar o teu Draft: ${error.message}`);

    unlockDraftForm();
  } finally {
    setPageLoading(false);
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

  backToTopButton.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}