(function () {
  const Run = window.Run = window.Run || {};
  const utils = Run.utils;
  const STORAGE_KEY = "running.data.v1";

  function emptyState() {
    return {
      shoes: [{ id: utils.uid(), name: "Tênis padrão", active: true, archived: false }],
      workouts: [],
      officialRaces: []
    };
  }

  function normalizeShoe(shoe) {
    return {
      id: String(shoe && shoe.id ? shoe.id : utils.uid()),
      name: String(shoe && shoe.name ? shoe.name : "Tênis sem nome").slice(0, 80),
      active: Boolean(shoe && shoe.active),
      archived: Boolean(shoe && shoe.archived)
    };
  }

  function normalizeWorkout(workout) {
    const date = utils.parseISODate(workout && workout.date) ? String(workout.date) : utils.todayISO();
    const type = ["corrida", "tiros", "calistenia"].indexOf(workout && workout.type) >= 0 ? workout.type : "corrida";
    const distance = utils.parseDistance(workout && workout.distanceKm);
    const pace = Number(workout && workout.paceSeconds);
    return {
      id: String(workout && workout.id ? workout.id : utils.uid()),
      date: date,
      type: type,
      distanceKm: distance,
      paceSeconds: Number.isFinite(pace) && pace > 0 ? Math.round(pace) : null,
      shoeId: String(workout && workout.shoeId ? workout.shoeId : "")
    };
  }

  function normalizeRace(race) {
    const distance = utils.parseDistance(race && race.distanceKm);
    const pace = Number(race && race.paceSeconds);
    return {
      id: String(race && race.id ? race.id : utils.uid()),
      name: String(race && race.name ? race.name : "Prova sem nome").slice(0, 100),
      date: utils.parseISODate(race && race.date) ? String(race.date) : utils.todayISO(),
      distanceKm: distance,
      paceSeconds: Number.isFinite(pace) && pace > 0 ? Math.round(pace) : 0,
      shoeId: String(race && race.shoeId ? race.shoeId : "")
    };
  }

  function normalizeState(raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    const shoes = Array.isArray(source.shoes) ? source.shoes.map(normalizeShoe) : [];
    const workouts = Array.isArray(source.workouts) ? source.workouts.map(normalizeWorkout) : [];
    const races = Array.isArray(source.officialRaces) ? source.officialRaces.map(normalizeRace) : [];
    if (shoes.length && !shoes.some(function (shoe) { return shoe.active && !shoe.archived; })) {
      const first = shoes.find(function (shoe) { return !shoe.archived; }) || shoes[0];
      first.active = true;
      first.archived = false;
    }
    return { shoes: shoes, workouts: workouts, officialRaces: races };
  }

  let state = emptyState();

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      state = raw ? normalizeState(JSON.parse(raw)) : emptyState();
      if (!raw) save();
    } catch (error) {
      state = emptyState();
    }
    return state;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      if (Run.ui) Run.ui.toast("Não foi possível salvar no navegador.");
      return false;
    }
  }

  function commit() {
    save();
    if (Run.ui) Run.ui.refreshAll();
  }

  function shoes() { return state.shoes; }
  function workouts() { return state.workouts; }
  function races() { return state.officialRaces; }

  function activeShoe() {
    return state.shoes.find(function (shoe) { return shoe.active && !shoe.archived; }) || null;
  }

  function findShoe(id) {
    return state.shoes.find(function (shoe) { return shoe.id === id; }) || null;
  }

  function addShoe(name) {
    const clean = String(name || "").trim();
    if (!clean) return null;
    const shoe = normalizeShoe({ name: clean, active: state.shoes.length === 0, archived: false });
    state.shoes.push(shoe);
    commit();
    return shoe;
  }

  function updateShoe(id, patch) {
    const shoe = findShoe(id);
    if (!shoe) return null;
    if (patch && typeof patch.name === "string" && patch.name.trim()) shoe.name = patch.name.trim().slice(0, 80);
    commit();
    return shoe;
  }

  function setActiveShoe(id) {
    const shoe = findShoe(id);
    if (!shoe || shoe.archived) return false;
    state.shoes.forEach(function (item) { item.active = item.id === id; });
    commit();
    return true;
  }

  function setArchivedShoe(id, archived) {
    const shoe = findShoe(id);
    if (!shoe) return false;
    shoe.archived = Boolean(archived);
    if (shoe.archived && shoe.active) {
      shoe.active = false;
      const replacement = state.shoes.find(function (item) { return !item.archived; });
      if (replacement) replacement.active = true;
    }
    if (!shoe.archived && !state.shoes.some(function (item) { return item.active && !item.archived; })) {
      shoe.active = true;
    }
    commit();
    return true;
  }

  function removeShoe(id) {
    const index = state.shoes.findIndex(function (shoe) { return shoe.id === id; });
    if (index === -1) return false;
    state.shoes.splice(index, 1);
    if (!state.shoes.some(function (shoe) { return shoe.active && !shoe.archived; })) {
      const replacement = state.shoes.find(function (shoe) { return !shoe.archived; });
      if (replacement) replacement.active = true;
    }
    commit();
    return true;
  }

  function findWorkout(id) {
    return state.workouts.find(function (workout) { return workout.id === id; }) || null;
  }

  function addWorkout(data) {
    const workout = normalizeWorkout(data);
    state.workouts.push(workout);
    commit();
    return workout;
  }

  function updateWorkout(id, data) {
    const workout = findWorkout(id);
    if (!workout) return null;
    const updated = normalizeWorkout(Object.assign({}, workout, data, { id: id }));
    Object.assign(workout, updated);
    commit();
    return workout;
  }

  function removeWorkout(id) {
    const index = state.workouts.findIndex(function (workout) { return workout.id === id; });
    if (index === -1) return false;
    state.workouts.splice(index, 1);
    commit();
    return true;
  }

  function findRace(id) {
    return state.officialRaces.find(function (race) { return race.id === id; }) || null;
  }

  function addRace(data) {
    const race = normalizeRace(data);
    state.officialRaces.push(race);
    commit();
    return race;
  }

  function updateRace(id, data) {
    const race = findRace(id);
    if (!race) return null;
    Object.assign(race, normalizeRace(Object.assign({}, race, data, { id: id })));
    commit();
    return race;
  }

  function removeRace(id) {
    const index = state.officialRaces.findIndex(function (race) { return race.id === id; });
    if (index === -1) return false;
    state.officialRaces.splice(index, 1);
    commit();
    return true;
  }

  function mileageForShoe(id) {
    let total = 0;
    state.workouts.forEach(function (workout) {
      if (workout.shoeId === id && (workout.type === "corrida" || workout.type === "tiros")) {
        total += Number(workout.distanceKm) || 0;
      }
    });
    state.officialRaces.forEach(function (race) {
      if (race.shoeId === id) total += Number(race.distanceKm) || 0;
    });
    return Math.round(total * 100) / 100;
  }

  function exportData() {
    return { version: 1, exportedAt: new Date().toISOString(), data: normalizeState(state) };
  }

  function replaceAll(raw) {
    const next = normalizeState(raw && raw.data ? raw.data : raw);
    const source = raw && raw.data ? raw.data : raw;
    if (!source || !Array.isArray(source.shoes) || !Array.isArray(source.workouts) || !Array.isArray(source.officialRaces)) return false;
    state = next;
    commit();
    return true;
  }

  function init() {
    load();
  }

  Run.store = {
    init: init,
    shoes: shoes,
    workouts: workouts,
    races: races,
    activeShoe: activeShoe,
    findShoe: findShoe,
    addShoe: addShoe,
    updateShoe: updateShoe,
    setActiveShoe: setActiveShoe,
    setArchivedShoe: setArchivedShoe,
    removeShoe: removeShoe,
    findWorkout: findWorkout,
    addWorkout: addWorkout,
    updateWorkout: updateWorkout,
    removeWorkout: removeWorkout,
    findRace: findRace,
    addRace: addRace,
    updateRace: updateRace,
    removeRace: removeRace,
    mileageForShoe: mileageForShoe,
    exportData: exportData,
    replaceAll: replaceAll,
    save: save
  };
})();
