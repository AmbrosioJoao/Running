(function () {
  const Run = window.Run = window.Run || {};

  const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  function uid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function toISODate(date) {
    return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
  }

  function parseISODate(value) {
    const parts = String(value || "").split("-");
    if (parts.length !== 3) return null;
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (Number.isNaN(date.getTime())) return null;
    return date;
  }

  function todayISO() {
    return toISODate(new Date());
  }

  function formatDateBR(value) {
    const date = parseISODate(value);
    if (!date) return String(value || "");
    return pad2(date.getDate()) + "/" + pad2(date.getMonth() + 1) + "/" + date.getFullYear();
  }

  function formatMonthLabel(year, monthIndex) {
    return MONTHS[monthIndex] + "/" + year;
  }

  function monthKeyFromISO(value) {
    return String(value || "").slice(0, 7);
  }

  function parsePeriod(value) {
    const parts = String(value).split("-");
    if (parts.length === 1 && /^\d{4}$/.test(parts[0])) {
      return { year: Number(parts[0]), month: null };
    }
    if (parts.length === 2 && /^\d{4}$/.test(parts[0]) && /^\d{2}$/.test(parts[1])) {
      const month = Number(parts[1]);
      if (month >= 1 && month <= 12) return { year: Number(parts[0]), month: month - 1 };
    }
    return null;
  }

  function periodLabel(value) {
    const parsed = parsePeriod(value);
    if (!parsed) return String(value);
    return parsed.month === null ? String(parsed.year) : formatMonthLabel(parsed.year, parsed.month);
  }

  function inPeriod(isoDate, periodValue) {
    const parsed = parsePeriod(periodValue);
    if (!parsed) return false;
    const date = parseISODate(isoDate);
    if (!date) return false;
    if (date.getFullYear() !== parsed.year) return false;
    return parsed.month === null || date.getMonth() === parsed.month;
  }

  function parsePace(value) {
    const match = /^\s*(\d{1,3}):([0-5]\d)\s*$/.exec(String(value || ""));
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  }

  function formatPace(seconds) {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    return pad2(Math.floor(total / 60)) + ":" + pad2(total % 60);
  }

  function parseDistance(value) {
    if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
    const normalized = String(value || "").trim().replace(",", ".");
    if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
    const number = Number(normalized);
    return number > 0 ? number : null;
  }

  function formatDistance(value) {
    const number = Number(value) || 0;
    return Number.isInteger(number) ? String(number) : number.toFixed(1).replace(/\.0$/, "");
  }

  function formatDuration(seconds) {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    return hours > 0 ? hours + ":" + pad2(minutes) + ":" + pad2(secs) : pad2(minutes) + ":" + pad2(secs);
  }

  function estimateRaceSeconds(distanceKm, paceSeconds) {
    return Math.round((Number(distanceKm) || 0) * (Number(paceSeconds) || 0));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function rotr(value, bits) {
    return ((value >>> bits) | (value << (32 - bits))) >>> 0;
  }

  function sha256Pure(message) {
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const bytes = new TextEncoder().encode(message);
    const bits = bytes.length * 8;
    const length = Math.ceil((bytes.length + 9) / 64) * 64;
    const data = new Uint8Array(length);
    data.set(bytes);
    data[bytes.length] = 0x80;
    const view = new DataView(data.buffer);
    view.setUint32(length - 8, Math.floor(bits / 0x100000000));
    view.setUint32(length - 4, bits >>> 0);
    const words = new Uint32Array(64);

    for (let offset = 0; offset < length; offset += 64) {
      for (let i = 0; i < 16; i += 1) words[i] = view.getUint32(offset + i * 4);
      for (let i = 16; i < 64; i += 1) {
        const s0 = rotr(words[i - 15], 7) ^ rotr(words[i - 15], 18) ^ (words[i - 15] >>> 3);
        const s1 = rotr(words[i - 2], 17) ^ rotr(words[i - 2], 19) ^ (words[i - 2] >>> 10);
        words[i] = (words[i - 16] + s0 + words[i - 7] + s1) >>> 0;
      }
      let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (let i = 0; i < 64; i += 1) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[i] + words[i]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0;
      H[1] = (H[1] + b) >>> 0;
      H[2] = (H[2] + c) >>> 0;
      H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0;
      H[5] = (H[5] + f) >>> 0;
      H[6] = (H[6] + g) >>> 0;
      H[7] = (H[7] + h) >>> 0;
    }
    return H.map(function (value) { return value.toString(16).padStart(8, "0"); }).join("");
  }

  async function sha256(message) {
    if (window.crypto && window.crypto.subtle && window.isSecureContext !== false) {
      const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(message));
      return Array.from(new Uint8Array(digest), function (byte) { return byte.toString(16).padStart(2, "0"); }).join("");
    }
    return sha256Pure(message);
  }

  Run.utils = {
    uid: uid,
    pad2: pad2,
    toISODate: toISODate,
    parseISODate: parseISODate,
    todayISO: todayISO,
    formatDateBR: formatDateBR,
    formatMonthLabel: formatMonthLabel,
    monthKeyFromISO: monthKeyFromISO,
    parsePeriod: parsePeriod,
    periodLabel: periodLabel,
    inPeriod: inPeriod,
    parsePace: parsePace,
    formatPace: formatPace,
    parseDistance: parseDistance,
    formatDistance: formatDistance,
    formatDuration: formatDuration,
    estimateRaceSeconds: estimateRaceSeconds,
    escapeHtml: escapeHtml,
    sha256: sha256,
    sha256Pure: sha256Pure,
    MONTHS: MONTHS
  };
})();
