(function () {
  const Run = window.Run = window.Run || {};
  const utils = Run.utils;
  const store = Run.store;
  const CLASSIC_DISTANCES = [5, 10, 21.1, 42.2];

  function classicDistance(value) {
    return CLASSIC_DISTANCES.find(function (distance) { return Math.abs(Number(value) - distance) < 0.05; }) || null;
  }

  function bestPaces() {
    const best = {};
    store.races().forEach(function (race) {
      const key = classicDistance(race.distanceKm);
      if (!key || !race.paceSeconds) return;
      if (!best[key] || race.paceSeconds < best[key]) best[key] = race.paceSeconds;
    });
    return best;
  }

  function shoeOptions(selectedId) {
    let html = '<option value="">Sem tênis</option>';
    store.shoes().filter(function (shoe) { return !shoe.archived || shoe.id === selectedId; }).forEach(function (shoe) {
      const selected = shoe.id === selectedId ? " selected" : "";
      html += '<option value="' + utils.escapeHtml(shoe.id) + '"' + selected + ">" + utils.escapeHtml(shoe.name) + "</option>";
    });
    return html;
  }

  function listHtml() {
    const races = store.races().slice().sort(function (a, b) {
      if (a.date === b.date) return a.id.localeCompare(b.id);
      return a.date < b.date ? 1 : -1;
    });
    const best = bestPaces();
    let rows = "";

    races.forEach(function (race) {
      const key = classicDistance(race.distanceKm);
      const isBest = key && best[key] === race.paceSeconds;
      const total = utils.estimateRaceSeconds(race.distanceKm, race.paceSeconds);
      const shoe = store.findShoe(race.shoeId);
      const meta = [
        utils.formatDateBR(race.date),
        '<span class="mono">' + utils.formatDistance(race.distanceKm) + " km</span>",
        '<span class="mono">' + utils.formatPace(race.paceSeconds) + "/km</span>",
        '<span class="mono">total ' + utils.formatDuration(total) + "</span>"
      ];
      if (shoe) meta.push(utils.escapeHtml(shoe.name));
      rows += '<li class="list-item">' +
        '<div class="list-item-main">' +
          '<span class="list-item-title">' + utils.escapeHtml(race.name) + (isBest ? ' <span class="tag tag-rp">RP</span>' : "") + "</span>" +
          '<span class="list-item-meta">' + meta.join(" · ") + "</span>" +
        "</div>" +
        '<div class="list-item-actions">' +
          '<button type="button" class="btn btn-small" data-race-action="edit" data-id="' + utils.escapeHtml(race.id) + '">Editar</button>' +
          '<button type="button" class="btn btn-small" data-race-action="delete" data-id="' + utils.escapeHtml(race.id) + '">Excluir</button>' +
        "</div>" +
      "</li>";
    });

    return '<div class="card">' +
      '<div class="card-header"><div><h2>Corridas oficiais</h2><p class="hint">RP marcado para 5 km, 10 km, 21,1 km e 42,2 km.</p></div>' +
      '<button type="button" class="btn btn-primary" data-race-action="new">Nova prova</button></div>' +
      (rows ? '<ul class="list">' + rows + "</ul>" : '<p class="empty">Nenhuma prova registrada.</p>') +
    "</div>";
  }

  function formHtml(race) {
    const editing = Boolean(race);
    const active = store.activeShoe();
    const shoeId = editing ? race.shoeId : (active ? active.id : "");
    const total = editing ? utils.estimateRaceSeconds(race.distanceKm, race.paceSeconds) : 0;

    return '<form id="race-form" class="form-grid"' + (editing ? ' data-id="' + utils.escapeHtml(race.id) + '"' : "") + ">" +
      '<div class="field"><label for="race-name">Nome da prova</label>' +
        '<input id="race-name" name="name" type="text" maxlength="100" required value="' + utils.escapeHtml(editing ? race.name : "") + '" placeholder="Ex.: Meia Maratona de Curitiba"></div>' +
      '<div class="form-row">' +
        '<div class="field"><label for="race-date">Data</label><input id="race-date" name="date" type="date" required value="' + utils.escapeHtml(editing ? race.date : utils.todayISO()) + '"></div>' +
        '<div class="field"><label for="race-distance">Distância (km)</label><input id="race-distance" name="distance" class="mono-input" type="text" inputmode="decimal" required value="' + utils.escapeHtml(editing ? utils.formatDistance(race.distanceKm) : "") + '" placeholder="21.1"></div>' +
      "</div>" +
      '<div class="form-row">' +
        '<div class="field"><label for="race-pace">Pace (mm:ss)</label><input id="race-pace" name="pace" class="mono-input" type="text" inputmode="numeric" required value="' + utils.escapeHtml(editing ? utils.formatPace(race.paceSeconds) : "") + '" placeholder="05:10"></div>' +
        '<div class="field"><label for="race-shoe">Tênis (opcional)</label><select id="race-shoe" name="shoeId">' + shoeOptions(shoeId) + "</select></div>" +
      "</div>" +
      '<p id="race-total" class="hint mono">Tempo total estimado: ' + utils.formatDuration(total) + "</p>" +
      '<p id="race-error" class="form-error" role="alert" hidden></p>' +
      '<div class="form-actions">' +
        '<button type="button" class="btn" data-race-action="back">Voltar</button>' +
        (editing ? '<button type="button" class="btn" data-race-action="delete" data-id="' + utils.escapeHtml(race.id) + '">Excluir</button>' : "") +
        '<button type="submit" class="btn btn-primary">' + (editing ? "Salvar" : "Registrar") + "</button>" +
      "</div>" +
    "</form>";
  }

  function renderList() {
    Run.ui.openModal("Corridas oficiais", listHtml());
  }

  function renderForm(race) {
    Run.ui.openModal(race ? "Editar prova" : "Nova prova", formHtml(race));
  }

  function updateTotal(body) {
    const form = body.querySelector("#race-form");
    if (!form) return;
    const distance = utils.parseDistance(form.elements.distance.value);
    const pace = utils.parsePace(form.elements.pace.value);
    const total = distance && pace ? utils.estimateRaceSeconds(distance, pace) : 0;
    body.querySelector("#race-total").textContent = "Tempo total estimado: " + utils.formatDuration(total);
  }

  function handleClick(event) {
    const button = event.target.closest("[data-race-action]");
    if (!button) return;
    const action = button.dataset.raceAction;
    if (action === "new") return renderForm(null);
    if (action === "back") return renderList();

    const race = store.findRace(button.dataset.id);
    if (!race) return;
    if (action === "edit") return renderForm(race);
    if (action === "delete" && window.confirm("Excluir esta prova?")) {
      store.removeRace(race.id);
      Run.ui.toast("Prova excluída.");
      renderList();
    }
  }

  function handleSubmit(event) {
    const form = event.target;
    if (form.id !== "race-form") return;
    event.preventDefault();
    const error = form.querySelector("#race-error");
    error.hidden = true;

    const name = form.elements.name.value.trim();
    const date = form.elements.date.value;
    const distance = utils.parseDistance(form.elements.distance.value);
    const pace = utils.parsePace(form.elements.pace.value);
    if (!name || !utils.parseISODate(date) || !distance || !pace) {
      error.textContent = "Preencha nome, data, distância em km e pace no formato mm:ss.";
      error.hidden = false;
      return;
    }

    const data = { name: name, date: date, distanceKm: distance, paceSeconds: pace, shoeId: form.elements.shoeId.value };
    if (form.dataset.id) {
      store.updateRace(form.dataset.id, data);
      Run.ui.toast("Prova atualizada.");
    } else {
      store.addRace(data);
      Run.ui.toast("Prova registrada.");
    }
    renderList();
  }

  function render() {
    document.getElementById("races-view").innerHTML = listHtml();
  }

  function init() {
    document.getElementById("races-view").addEventListener("click", handleClick);
    const body = document.getElementById("modal-body");
    body.addEventListener("click", handleClick);
    body.addEventListener("submit", handleSubmit);
    body.addEventListener("input", function (event) {
      if (event.target.id === "race-distance" || event.target.id === "race-pace") updateTotal(body);
    });
    render();
  }

  Run.races = { init: init, render: render, renderList: renderList, renderForm: renderForm, classicDistance: classicDistance };
})();
