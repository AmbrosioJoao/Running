(function () {
  const Run = window.Run = window.Run || {};
  const utils = Run.utils;
  const store = Run.store;

  function badge(shoe) {
    if (shoe.archived) return '<span class="chip">Arquivado</span>';
    if (shoe.active) return '<span class="chip">Padrão</span>';
    return "";
  }

  function listHtml() {
    const shoes = store.shoes();
    let items = "";
    shoes.forEach(function (shoe) {
      const id = utils.escapeHtml(shoe.id);
      const actions = [];
      if (!shoe.active && !shoe.archived) {
        actions.push('<button type="button" class="btn btn-small" data-shoe-action="activate" data-id="' + id + '">Ativar</button>');
      }
      actions.push('<button type="button" class="btn btn-small" data-shoe-action="edit" data-id="' + id + '">Editar</button>');
      actions.push('<button type="button" class="btn btn-small" data-shoe-action="archive" data-id="' + id + '">' + (shoe.archived ? "Desarquivar" : "Arquivar") + "</button>");
      actions.push('<button type="button" class="btn btn-small" data-shoe-action="remove" data-id="' + id + '">Excluir</button>');
      items += '<li class="list-item">' +
        '<div class="list-item-main">' +
          '<span class="list-item-title">' + utils.escapeHtml(shoe.name) + "</span>" +
          '<span class="list-item-meta"><span class="mono">' + utils.formatDistance(store.mileageForShoe(shoe.id)) + " km</span> " + badge(shoe) + "</span>" +
        "</div>" +
        '<div class="list-item-actions">' + actions.join("") + "</div>" +
      "</li>";
    });

    const active = store.activeShoe();
    return '<div class="form-grid">' +
      '<div class="card">' +
        '<div class="card-header"><h3>Tênis cadastrados</h3><span class="muted hint">' + shoes.length + " cadastro(s)</span></div>" +
        (items ? '<ul class="list">' + items + "</ul>" : '<p class="empty">Nenhum tênis cadastrado.</p>') +
      "</div>" +
      '<div class="card">' +
        '<h3>Novo tênis</h3>' +
        '<p class="hint">Padrão atual: ' + utils.escapeHtml(active ? active.name : "nenhum") + ".</p>" +
        '<form id="shoe-form" class="form-grid" data-mode="create">' +
          '<div class="field"><label for="shoe-name">Nome / modelo</label><input id="shoe-name" name="name" type="text" maxlength="80" required placeholder="Ex.: Olympikus Corre 3"></div>' +
          '<div class="form-actions"><button type="submit" class="btn btn-primary">Adicionar tênis</button></div>' +
        "</form>" +
      "</div>" +
    "</div>";
  }

  function formHtml(shoe) {
    return '<form id="shoe-form" class="form-grid" data-mode="edit" data-id="' + utils.escapeHtml(shoe.id) + '">' +
      '<div class="field"><label for="shoe-name">Nome / modelo</label><input id="shoe-name" name="name" type="text" maxlength="80" required value="' + utils.escapeHtml(shoe.name) + '"></div>' +
      '<p class="hint">Quilometragem acumulada: <span class="mono">' + utils.formatDistance(store.mileageForShoe(shoe.id)) + " km</span></p>" +
      '<div class="form-actions"><button type="button" class="btn" data-shoe-action="list">Voltar</button><button type="submit" class="btn btn-primary">Salvar</button></div>' +
    "</form>";
  }

  function renderList() {
    Run.ui.openModal("Tênis", listHtml(), function (body) {
      const input = body.querySelector("#shoe-name");
      if (input) input.focus();
    });
  }

  function renderForm(id) {
    const shoe = store.findShoe(id);
    if (!shoe) return renderList();
    Run.ui.openModal("Editar tênis", formHtml(shoe));
  }

  function usageCount(id) {
    let count = 0;
    store.workouts().forEach(function (workout) { if (workout.shoeId === id) count += 1; });
    store.races().forEach(function (race) { if (race.shoeId === id) count += 1; });
    return count;
  }

  function handleClick(event) {
    const button = event.target.closest("[data-shoe-action]");
    if (!button) return;
    const action = button.dataset.shoeAction;
    const id = button.dataset.id;
    if (action === "list") return renderList();
    if (action === "edit") return renderForm(id);
    if (action === "activate") {
      store.setActiveShoe(id);
      Run.ui.toast("Tênis definido como padrão.");
      renderList();
      return;
    }
    if (action === "archive") {
      const shoe = store.findShoe(id);
      store.setArchivedShoe(id, !shoe.archived);
      Run.ui.toast(shoe.archived ? "Tênis desarquivado." : "Tênis arquivado.");
      renderList();
      return;
    }
    if (action === "remove") {
      const used = usageCount(id);
      if (used > 0) {
        Run.ui.toast("Tênis usado em " + used + " registro(s). Arquive para ocultar.");
        return;
      }
      if (window.confirm("Excluir este tênis?")) {
        store.removeShoe(id);
        Run.ui.toast("Tênis excluído.");
        renderList();
      }
    }
  }

  function handleSubmit(event) {
    const form = event.target;
    if (form.id !== "shoe-form") return;
    event.preventDefault();
    const name = form.elements.name.value.trim();
    if (!name) return;
    if (form.dataset.mode === "edit") {
      store.updateShoe(form.dataset.id, { name: name });
      Run.ui.toast("Tênis atualizado.");
      renderList();
    } else {
      store.addShoe(name);
      Run.ui.toast("Tênis adicionado.");
      renderList();
    }
  }

  function init() {
    document.getElementById("shoes-open").addEventListener("click", renderList);
    const body = document.getElementById("modal-body");
    body.addEventListener("click", handleClick);
    body.addEventListener("submit", handleSubmit);
  }

  function render() {
    const active = store.activeShoe();
    document.getElementById("shoes-open").textContent = active ? "Tênis: " + active.name : "Tênis";
  }

  Run.shoes = { init: init, render: render, renderList: renderList };
})();
