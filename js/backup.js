(function () {
  const Run = window.Run = window.Run || {};
  const utils = Run.utils;
  const store = Run.store;

  function exportBackup() {
    const payload = store.exportData();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "diario-corrida-" + utils.todayISO() + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    Run.ui.toast("Backup exportado.");
  }

  function importFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      let parsed;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch (error) {
        Run.ui.toast("Arquivo inválido: não é um JSON.");
        return;
      }
      if (!window.confirm("Substituir todos os dados atuais pelo conteúdo deste backup?")) return;
      if (!store.replaceAll(parsed)) {
        Run.ui.toast("Backup incompatível: faltam listas de tênis, treinos ou provas.");
        return;
      }
      Run.ui.refreshAll();
      Run.ui.toast("Backup importado.");
    };
    reader.onerror = function () { Run.ui.toast("Não foi possível ler o arquivo."); };
    reader.readAsText(file);
  }

  function init() {
    document.getElementById("backup-export").addEventListener("click", exportBackup);
    const input = document.getElementById("backup-file");
    document.getElementById("backup-import").addEventListener("click", function () { input.click(); });
    input.addEventListener("change", function () {
      importFile(input.files && input.files[0]);
      input.value = "";
    });
  }

  Run.backup = { init: init, exportBackup: exportBackup, importFile: importFile };
})();
