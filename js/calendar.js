(function () {
  const Run = window.Run = window.Run || {};
  const utils = Run.utils;
  const store = Run.store;
  const TYPE_LABELS = { corrida: "Corrida", tiros: "Tiros", calistenia: "Calistenia" };
  const TYPE_MARKS = { corrida: "C", tiros: "T", calistenia: "F" };
  let cursor = null;

  function monthStart(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function currentMonth() {
    return monthStart(new Date());
  }

  function isoInCursor(day) {
    return utils.toISODate(new Date(cursor.getFullYear(), cursor.getMonth(), day));
  }

  function workoutsFor(date) {
    return store.workouts()
      .filter(function (workout) { return workout.date === date; })
      .sort(function (a, b) { return TYPE_LABELS[a.type].localeCompare(TYPE_LABELS[b.type]); });
  }

  function monthLabel(date) {
    const name = utils.formatMonthLabel(date.getFullYear(), date.getMonth());
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  function calendarHtml() {
    const today = utils.todayISO();
    const firstWeekday = (cursor.getDay() + 6) % 7;
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    let cells = "";

    for (let i = 0; i < firstWeekday; i += 1) cells += '<div class="day day-empty" aria-hidden="true"></div>';

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = isoInCursor(day);
      const past = date < today;
      const items = workoutsFor(date);
      const marks = items.map(function (workout) {
        const label = TYPE_LABELS[workout.type] + (workout.distanceKm ? " " + utils.formatDistance(workout.distanceKm) + " km" : "");
        return '<span class="day-mark" title="' + utils.escapeHtml(label) + '">' + TYPE_MARKS[workout.type] + "</span>";
      }).join("");
      const classes = ["day"];
      if (past) classes.push("day-past");
      if (date === today) classes.push("is-today");
      if (items.length) classes.push("has-workout");
      cells += '<button type="button" class="' + classes.join(" ") + '" data-date="' + date + '"' +
        (past ? " disabled" : "") + ' aria-label="' + utils.escapeHtml(utils.formatDateBR(date) + (items.length ? " " + items.length + " treino(s)" : "")) + '">' +
        '<span class="day-number">' + day + '</span><span class="day-marks">' + marks + "</span></button>";
    }

    const isFirstMonth = cursor.getFullYear() === new Date().getFullYear() && cursor.getMonth() === new Date().getMonth();

    return '<div class="card">' +
      '<div class="card-header">' +
        "<div><h2>Calendário de treinos</h2><p class=\"hint\">Clique em um dia para registrar ou editar.</p></div>" +
        '<div class="toolbar">' +
          '<button type="button" class="btn btn-small" data-cal-action="prev"' + (isFirstMonth ? " disabled" : "") + ' aria-label="Mês anterior">&lsaquo;</button>' +
          '<strong class="mono">' + monthLabel(cursor) + "</strong>" +
          '<button type="button" class="btn btn-small" data-cal-action="next" aria-label="Próximo mês">&rsaquo;</button>' +
          '<button type="button" class="btn btn-small" data-cal-action="today">Hoje</button>' +
        "</div>" +
      "</div>" +
      '<div class="calendar-weekdays" aria-hidden="true"><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span></div>' +
      '<div class="calendar-grid">' + cells + "</div>" +
      '<p class="hint calendar-legend"><span class="day-mark">C</span> Corrida <span class="day-mark">T</span> Tiros <span class="day-mark">F</span> Calistenia</p>' +
    "</div>";
  }

  function dayHtml(date) {
    const items = workoutsFor(date);
    let rows = "";
    items.forEach(function (workout) {
      const detail = [];
      if (workout.distanceKm) detail.push(utils.formatDistance(workout.distanceKm) + " km");
      if (workout.paceSeconds) detail.push(utils.formatPace(workout.paceSeconds) + "/km");
      const shoe = store.findShoe(workout.shoeId);
      if (shoe) detail.push(shoe.name);
      rows += '<li class="list-item">' +
        '<div class="list-item-main"><span class="list-item-title">' + TYPE_LABELS[workout.type] + "</span>" +
        '<span class="list-item-meta mono">' + utils.escapeHtml(detail.join(" · ") || "Sem detalhes") + "</span></div>" +
        '<div class="list-item-actions">' +
          '<button type="button" class="btn btn-small" data-workout-action="edit" data-id="' + utils.escapeHtml(workout.id) + '">Editar</button>' +
          '<button type="button" class="btn btn-small" data-workout-action="delete" data-id="' + utils.escapeHtml(workout.id) + '">Excluir</button>' +
        "</div></li>";
    });

    return '<div class="form-grid">' +
      '<div class="card"><h3>' + utils.formatDateBR(date) + "</h3>" +
      (rows ? '<ul class="list">' + rows + "</ul>" : '<p class="empty">Nenhum treino neste dia.</p>') +
      "</div>" +
      '<div class="form-actions"><button type="button" class="btn btn-primary" data-day-action="new" data-date="' + date + '">Novo treino</button></div>' +
    "</div>";
  }

  function shoeOptions(selectedId, optional) {
    let html = optional ? '<option value="">Sem tênis</option>' : "";
    store.shoes().filter(function (shoe) { return !shoe.archived; }).forEach(function (shoe) {
      const selected = shoe.id === selectedId ? " selected" : "";
      html += '<option value="' + utils.escapeHtml(shoe.id) + '"' + selected + ">" + utils.escapeHtml(shoe.name) + "</option>";
    });
    return html;
  }

  function formHtml(date, workout) {
    const editing = Boolean(workout);
    const type = editing ? workout.type : "corrida";
    const distance = editing && workout.distanceKm ? utils.formatDistance(workout.distanceKm) : "";
    const pace = editing && workout.paceSeconds ? utils.formatPace(workout.paceSeconds) : "";
    const active = store.activeShoe();
    const shoeId = editing ? workout.shoeId : (active ? active.id : "");
    const options = shoeOptions(shoeId, type === "tiros");

    return '<form id="workout-form" class="form-grid" data-date="' + date + '"' + (editing ? ' data-id="' + utils.escapeHtml(workout.id) + '"' : "") + ">" +
      '<div class="field"><label for="workout-type">Tipo de treino</label>' +
        '<select id="workout-type" name="type">' +
          Object.keys(TYPE_LABELS).map(function (key) {
            return '<option value="' + key + '"' + (key === type ? " selected" : "") + ">" + TYPE_LABELS[key] + "</option>";
          }).join("") +
        "</select></div>" +
      '<div id="field-distance" class="field"><label for="workout-distance">Distância (km)</label>' +
        '<input id="workout-distance" name="distance" class="mono-input" type="text" inputmode="decimal" placeholder="Ex.: 8.5" value="' + utils.escapeHtml(distance) + '">' +
        '<span class="hint">Use ponto ou vírgula para decimais.</span></div>' +
      '<div id="field-pace" class="field"><label for="workout-pace">Pace (mm:ss por km)</label>' +
        '<input id="workout-pace" name="pace" class="mono-input" type="text" inputmode="numeric" placeholder="05:10" value="' + utils.escapeHtml(pace) + '"></div>' +
      '<div id="field-shoe" class="field"><label for="workout-shoe">Tênis</label>' +
        '<select id="workout-shoe" name="shoeId">' + options + "</select></div>" +
      '<p id="workout-error" class="form-error" role="alert" hidden></p>' +
      '<div class="form-actions">' +
        '<button type="button" class="btn" data-workout-action="back" data-date="' + date + '">Voltar</button>' +
        (editing ? '<button type="button" class="btn" data-workout-action="delete" data-id="' + utils.escapeHtml(workout.id) + '" data-date="' + date + '">Excluir</button>' : "") +
        '<button type="submit" class="btn btn-primary">' + (editing ? "Salvar" : "Registrar") + "</button>" +
      "</div>" +
    "</form>";
  }

  function updateTypeFields(body) {
    const form = body.querySelector("#workout-form");
    if (!form) return;
    const type = form.elements.type.value;
    body.querySelector("#field-distance").hidden = type === "calistenia";
    body.querySelector("#field-pace").hidden = type !== "corrida";
    body.querySelector("#field-shoe").hidden = type === "calistenia";
  }

  function renderDay(date) {
    Run.ui.openModal("Treinos do dia", dayHtml(date));
  }

  function renderForm(date, workout) {
    Run.ui.openModal(workout ? "Editar treino" : "Novo treino", formHtml(date, workout), function (body) {
      updateTypeFields(body);
    });
  }

  function formHtmlShoes(form, type, current) {
    const select = form.elements.shoeId;
    select.innerHTML = shoeOptions(current, type === "tiros");
    if (type === "tiros" && !current && store.activeShoe()) select.value = store.activeShoe().id;
  }

  function handleCalendarClick(event) {
    const button = event.target.closest("[data-cal-action]");
    if (!button) return;
    const action = button.dataset.calAction;
    if (action === "prev") {
      const previous = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
      if (previous >= currentMonth()) cursor = previous;
    } else if (action === "next") {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    } else if (action === "today") {
      cursor = currentMonth();
    }
    render();
  }

  function handleDayClick(event) {
    const cell = event.target.closest(".day[data-date]");
    if (cell && !cell.disabled) renderDay(cell.dataset.date);
  }

  function handleModalClick(event) {
    const dayButton = event.target.closest("[data-day-action]");
    if (dayButton && dayButton.dataset.dayAction === "new") return renderForm(dayButton.dataset.date, null);

    const backButton = event.target.closest('[data-workout-action="back"]');
    if (backButton) return renderDay(backButton.dataset.date);

    const workoutButton = event.target.closest('[data-workout-action="edit"], [data-workout-action="delete"]');
    if (!workoutButton) return;
    const workout = store.findWorkout(workoutButton.dataset.id);
    if (!workout) return;
    if (workoutButton.dataset.workoutAction === "edit") return renderForm(workout.date, workout);
    if (window.confirm("Excluir este treino?")) {
      store.removeWorkout(workout.id);
      Run.ui.toast("Treino excluído.");
      renderDay(workout.date);
    }
  }

  function handleSubmit(event) {
    const form = event.target;
    if (form.id !== "workout-form") return;
    event.preventDefault();
    const error = form.querySelector("#workout-error");
    error.hidden = true;
    const type = form.elements.type.value;
    let distance = null;
    let pace = null;

    if (type !== "calistenia") {
      distance = utils.parseDistance(form.elements.distance.value);
      if (!distance) {
        error.textContent = "Informe uma distância válida em km (ex.: 8.5).";
        error.hidden = false;
        return;
      }
    }
    if (type === "corrida") {
      pace = utils.parsePace(form.elements.pace.value);
      if (!pace) {
        error.textContent = "Informe o pace no formato mm:ss (ex.: 05:10).";
        error.hidden = false;
        return;
      }
    }

    const data = {
      date: form.dataset.date,
      type: type,
      distanceKm: distance,
      paceSeconds: pace,
      shoeId: type === "calistenia" ? "" : form.elements.shoeId.value
    };
    if (form.dataset.id) {
      store.updateWorkout(form.dataset.id, data);
      Run.ui.toast("Treino atualizado.");
    } else {
      store.addWorkout(data);
      Run.ui.toast("Treino registrado.");
    }
    renderDay(form.dataset.date);
  }

  function render() {
    const container = document.getElementById("calendar-view");
    container.innerHTML = calendarHtml();
  }

  function init() {
    cursor = currentMonth();
    const container = document.getElementById("calendar-view");
    container.addEventListener("click", handleCalendarClick);
    container.addEventListener("click", handleDayClick);
    const body = document.getElementById("modal-body");
    body.addEventListener("click", handleModalClick);
    body.addEventListener("submit", handleSubmit);
    body.addEventListener("change", function (event) {
      if (event.target.id === "workout-type") {
        const form = event.target.closest("#workout-form");
        const current = form.elements.shoeId.value;
        formHtmlShoes(form, event.target.value, current);
        updateTypeFields(body);
      }
    });
    render();
  }

  Run.calendar = { init: init, render: render, renderDay: renderDay, renderForm: renderForm };
})();
