(function () {
  const Run = window.Run = window.Run || {};
  const utils = Run.utils;
  const store = Run.store;
  const COLORS = ["#1C1C1C", "#3F6B8A", "#8A4B3C", "#4F7A4B", "#7A5C9E", "#A8762C", "#2F7A76", "#9C5A78"];
  const WIDTH = 720;
  const HEIGHT = 260;
  const MARGIN = { top: 16, right: 18, bottom: 36, left: 62 };
  let selected = [];

  function runs() {
    return store.workouts()
      .filter(function (workout) { return workout.type === "corrida"; })
      .sort(function (a, b) {
        if (a.date === b.date) return a.id.localeCompare(b.id);
        return a.date < b.date ? -1 : 1;
      });
  }

  function availablePeriods() {
    const list = new Set();
    const today = new Date();
    list.add(String(today.getFullYear()));
    list.add(utils.monthKeyFromISO(utils.todayISO()));
    runs().forEach(function (workout) {
      list.add(String(workout.date).slice(0, 4));
      list.add(utils.monthKeyFromISO(workout.date));
    });
    const months = Array.from(list).filter(function (value) { return value.length === 7; }).sort().reverse();
    const years = Array.from(list).filter(function (value) { return value.length === 4; }).sort().reverse();
    return months.concat(years);
  }

  function seriesFor(metric) {
    return selected.map(function (period, index) {
      return {
        period: period,
        label: utils.periodLabel(period),
        color: COLORS[index % COLORS.length],
        points: runs().filter(function (workout) { return utils.inPeriod(workout.date, period); }).map(function (workout) {
          return {
            date: workout.date,
            value: metric === "pace" ? workout.paceSeconds : workout.distanceKm
          };
        })
      };
    }).filter(function (series) { return series.points.length > 0; });
  }

  function niceScale(values, isPace) {
    let min = Math.min.apply(null, values);
    let max = Math.max.apply(null, values);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1 };
    if (min === max) {
      const single = isPace ? 30 : 2;
      min -= single;
      max += single;
    }
    const pad = Math.max(isPace ? 20 : 1, (max - min) * 0.15);
    const step = isPace ? 10 : 0.5;
    min = Math.max(0, Math.floor((min - pad) / step) * step);
    max = Math.ceil((max + pad) / step) * step;
    if (max <= min) max = min + step;
    return { min: min, max: max };
  }

  function formatTick(value, isPace) {
    return isPace ? utils.formatPace(value) : String(Number(value.toFixed(1)));
  }

  function formatValue(value, isPace) {
    return isPace ? utils.formatPace(value) + "/km" : utils.formatDistance(value) + " km";
  }

  function chartHtml(series, metric) {
    if (!series.length) {
      return '<p class="empty">Sem corridas no período selecionado.</p>';
    }

    const isPace = metric === "pace";
    const values = [];
    series.forEach(function (item) { item.points.forEach(function (point) { values.push(point.value); }); });
    const domain = niceScale(values, isPace);
    const maxLength = Math.max.apply(null, series.map(function (item) { return item.points.length; }));
    const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
    const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const x = function (index) {
      return maxLength === 1 ? MARGIN.left + plotWidth / 2 : MARGIN.left + index * plotWidth / (maxLength - 1);
    };
    const y = function (value) {
      return MARGIN.top + plotHeight - (value - domain.min) / (domain.max - domain.min) * plotHeight;
    };

    let grid = "";
    for (let tick = 0; tick <= 4; tick += 1) {
      const value = domain.min + (domain.max - domain.min) * tick / 4;
      const py = y(value);
      grid += `<line x1="${MARGIN.left}" y1="${py}" x2="${WIDTH - MARGIN.right}" y2="${py}" stroke="#D5D1C8" stroke-width="1" />`;
      grid += `<text x="${MARGIN.left - 8}" y="${py + 4}" text-anchor="end" font-size="11" fill="#5F5D58" font-family="ui-monospace, monospace">${formatTick(value, isPace)}</text>`;
    }

    const labelEvery = Math.max(1, Math.ceil(maxLength / 8));
    let xLabels = "";
    for (let index = 0; index < maxLength; index += 1) {
      if (index % labelEvery !== 0 && index !== maxLength - 1) continue;
      const source = series[0].points[index];
      const text = series.length === 1 && source
        ? utils.formatDateBR(source.date).slice(0, 5)
        : String(index + 1);
      xLabels += `<text x="${x(index)}" y="${HEIGHT - MARGIN.bottom + 20}" text-anchor="middle" font-size="10" fill="#5F5D58" font-family="ui-monospace, monospace">${utils.escapeHtml(text)}</text>`;
    }
    xLabels += `<text x="${WIDTH / 2}" y="${HEIGHT - 2}" text-anchor="middle" font-size="10" fill="#5F5D58">${series.length === 1 ? "data da corrida" : "sequência da corrida no período"}</text>`;

    let curves = "";
    series.forEach(function (item) {
      const coordinates = item.points.map(function (point, index) {
        return x(index).toFixed(2) + "," + y(point.value).toFixed(2);
      });
      curves += `<polyline points="${coordinates.join(" ")}" fill="none" stroke="${item.color}" stroke-width="2" stroke-linejoin="round" />`;
      item.points.forEach(function (point, index) {
        const tip = item.label + " · " + utils.formatDateBR(point.date) + " · " + formatValue(point.value, isPace);
        curves += `<circle cx="${x(index).toFixed(2)}" cy="${y(point.value).toFixed(2)}" r="3.5" fill="${item.color}"><title>${utils.escapeHtml(tip)}</title></circle>`;
      });
    });

    const legend = series.length > 1
      ? '<div class="chart-legend">' + series.map(function (item) {
          return `<span><i class="legend-line" style="background:${item.color}"></i>${utils.escapeHtml(item.label)}</span>`;
        }).join("") + "</div>"
      : "";

    return legend + `<svg class="chart-svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="Gráfico de ${isPace ? "pace" : "distância"}">${grid}${xLabels}${curves}</svg>`;
  }

  function controlsHtml() {
    const periods = availablePeriods();
    if (!periods.length) return "";
    return '<div class="card">' +
      '<div class="card-header"><div><h2>Comparar períodos</h2><p class="hint">Selecione um ou mais períodos. As curvas são alinhadas pela ordem das corridas.</p></div></div>' +
      '<div class="period-grid">' + periods.map(function (value) {
        const checked = selected.indexOf(value) >= 0 ? " checked" : "";
        return `<label class="period-option"><input type="checkbox" data-period="${utils.escapeHtml(value)}"${checked}> ${utils.escapeHtml(utils.periodLabel(value))}</label>`;
      }).join("") + "</div>" +
    "</div>";
  }

  function render() {
    const container = document.getElementById("charts-view");
    const periods = availablePeriods();
    selected = selected.filter(function (value) { return periods.indexOf(value) >= 0; });
    if (!selected.length && periods.length) selected.push(periods[0]);

    const paceSeries = seriesFor("pace");
    const distanceSeries = seriesFor("distance");
    container.innerHTML = controlsHtml() +
      '<div class="card chart-card"><div class="card-header"><h3>Pace (mm:ss/km)</h3><span class="hint">Quanto menor, melhor</span></div>' + chartHtml(paceSeries, "pace") + "</div>" +
      '<div class="card chart-card"><div class="card-header"><h3>Distância (km)</h3></div>' + chartHtml(distanceSeries, "distance") + '</div>';
  }

  function init() {
    const container = document.getElementById("charts-view");
    container.addEventListener("change", function (event) {
      const input = event.target.closest("[data-period]");
      if (!input) return;
      const value = input.dataset.period;
      const index = selected.indexOf(value);
      if (input.checked && index === -1) selected.push(value);
      if (!input.checked && index >= 0) selected.splice(index, 1);
      render();
    });
    render();
  }

  Run.charts = { init: init, render: render, availablePeriods: availablePeriods, seriesFor: seriesFor };
})();
