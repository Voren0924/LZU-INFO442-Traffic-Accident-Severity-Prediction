const MODEL_METRICS = [
  { model: "FT-Transformer raw", accuracy: 0.7250, balanced_accuracy: 0.4844, macro_f1: 0.4807, weighted_f1: 0.7196, selected: true },
  { model: "CatBoost raw", accuracy: 0.7215, balanced_accuracy: 0.4802, macro_f1: 0.4786, weighted_f1: 0.7210, selected: false },
  { model: "XGBoost raw", accuracy: 0.7176, balanced_accuracy: 0.4648, macro_f1: 0.4643, weighted_f1: 0.7180, selected: false }
];

let CATEGORICAL_FIELDS = [
  { name: "traffic_control_device", label: "Traffic control", options: ["TRAFFIC SIGNAL", "STOP SIGN/FLASHER", "NO CONTROLS", "YIELD", "OTHER", "UNKNOWN"] },
  { name: "weather_condition", label: "Weather", options: ["CLEAR", "RAIN", "SNOW", "CLOUDY/OVERCAST", "FOG/SMOKE/HAZE", "OTHER"] },
  { name: "lighting_condition", label: "Lighting", options: ["DAYLIGHT", "DARKNESS", "DARKNESS, LIGHTED ROAD", "DUSK", "DAWN", "UNKNOWN"] },
  { name: "first_crash_type", label: "First crash type", options: ["REAR END", "TURNING", "SIDESWIPE SAME DIRECTION", "ANGLE", "PARKED MOTOR VEHICLE", "PEDESTRIAN", "PEDALCYCLIST", "FIXED OBJECT", "HEAD ON", "OTHER"] },
  { name: "trafficway_type", label: "Trafficway", options: ["NOT DIVIDED", "DIVIDED - W/MEDIAN", "ONE-WAY", "FOUR WAY", "T-INTERSECTION", "OTHER"] },
  { name: "alignment", label: "Alignment", options: ["STRAIGHT AND LEVEL", "STRAIGHT ON GRADE", "CURVE LEVEL", "CURVE ON GRADE", "OTHER"] },
  { name: "roadway_surface_cond", label: "Road surface", options: ["DRY", "WET", "SNOW OR SLUSH", "ICE", "OTHER"] },
  { name: "road_defect", label: "Road defect", options: ["NO DEFECTS", "RUT, HOLES", "WORN SURFACE", "DEBRIS ON ROADWAY", "OTHER"] },
  { name: "intersection_related_i", label: "At intersection", options: ["N", "Y"] },
  { name: "prim_contributory_cause", label: "Main reported cause", options: ["UNABLE TO DETERMINE", "FAILING TO YIELD RIGHT-OF-WAY", "FOLLOWING TOO CLOSELY", "IMPROPER OVERTAKING/PASSING", "IMPROPER BACKING", "DISREGARDING TRAFFIC SIGNALS", "DRIVING SKILLS/KNOWLEDGE/EXPERIENCE", "WEATHER", "UNDER THE INFLUENCE OF ALCOHOL/DRUGS", "EXCEEDING AUTHORIZED SPEED LIMIT", "PHYSICAL CONDITION OF DRIVER", "VISION OBSCURED", "OTHER"] }
];

let NUMERIC_FIELDS = [
  { name: "num_units", label: "Number of involved units", min: 0, max: 12, value: 2, hint: "Count of vehicles or traffic units in the crash." },
  { name: "crash_hour", label: "Crash hour (0–23)", min: 0, max: 23, value: 12, hint: "Defaults to the current hour. You can change it." },
  { name: "crash_day_of_week", label: "Day of week", min: 1, max: 7, value: 4, hint: "1 Monday, 2 Tuesday, 3 Wednesday, 4 Thursday, 5 Friday, 6 Saturday, 7 Sunday." },
  { name: "crash_month", label: "Crash month", min: 1, max: 12, value: 10, hint: "Defaults to the current month. You can change it." }
];

const SAMPLES = {
  low: {
    traffic_control_device: "TRAFFIC SIGNAL",
    weather_condition: "CLEAR",
    lighting_condition: "DAYLIGHT",
    first_crash_type: "REAR END",
    trafficway_type: "NOT DIVIDED",
    alignment: "STRAIGHT AND LEVEL",
    roadway_surface_cond: "DRY",
    road_defect: "NO DEFECTS",
    intersection_related_i: "N",
    prim_contributory_cause: "FOLLOWING TOO CLOSELY",
    num_units: 2,
    crash_hour: 14,
    crash_day_of_week: 3,
    crash_month: 6
  },
  high: {
    traffic_control_device: "NO CONTROLS",
    weather_condition: "RAIN",
    lighting_condition: "DARKNESS, LIGHTED ROAD",
    first_crash_type: "PEDESTRIAN",
    trafficway_type: "NOT DIVIDED",
    alignment: "STRAIGHT AND LEVEL",
    roadway_surface_cond: "WET",
    road_defect: "NO DEFECTS",
    intersection_related_i: "Y",
    prim_contributory_cause: "FAILING TO YIELD RIGHT-OF-WAY",
    num_units: 3,
    crash_hour: 22,
    crash_day_of_week: 7,
    crash_month: 11
  }
};

const WEATHER_CODES = {
  0: ["Clear", "☀️"], 1: ["Mainly clear", "🌤️"], 2: ["Partly cloudy", "⛅"], 3: ["Overcast", "☁️"],
  45: ["Fog", "🌫️"], 48: ["Depositing rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"], 53: ["Drizzle", "🌦️"], 55: ["Heavy drizzle", "🌧️"],
  61: ["Light rain", "🌧️"], 63: ["Rain", "🌧️"], 65: ["Heavy rain", "🌧️"],
  71: ["Light snow", "🌨️"], 73: ["Snow", "🌨️"], 75: ["Heavy snow", "🌨️"],
  80: ["Rain showers", "🌦️"], 81: ["Rain showers", "🌦️"], 82: ["Violent showers", "⛈️"],
  95: ["Thunderstorm", "⛈️"], 96: ["Thunderstorm with hail", "⛈️"], 99: ["Thunderstorm with hail", "⛈️"]
};

const FIELD_LABELS = {
  traffic_control_device: "Traffic control",
  weather_condition: "Weather",
  lighting_condition: "Lighting",
  first_crash_type: "First crash type",
  trafficway_type: "Trafficway",
  alignment: "Alignment",
  roadway_surface_cond: "Road surface",
  road_defect: "Road defect",
  intersection_related_i: "At intersection",
  prim_contributory_cause: "Main reported cause",
  num_units: "Number of involved units",
  crash_hour: "Crash hour (0–23)",
  crash_day_of_week: "Day of week",
  crash_month: "Crash month"
};

const FIELD_HINTS = {
  num_units: "Count of vehicles or traffic units in the crash.",
  crash_hour: "Defaults to the current hour. ",
  crash_day_of_week: "1 Monday, 2 Tuesday, 3 Wednesday, 4 Thursday, 5 Friday, 6 Saturday, 7 Sunday.",
  crash_month: "Defaults to the current month. "
};

const OPTION_LABELS = {
  intersection_related_i: {
    N: "No",
    Y: "Yes"
  }
};

const USER_EDITED_FIELDS = new Set();
let latestWeatherModelValue = null;


async function loadModelSchema() {
  try {
    const response = await fetch("/api/schema", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const schema = await response.json();
    if (!Array.isArray(schema.input_fields)) return;

    const categorical = [];
    const numeric = [];
    schema.input_fields.forEach(field => {
      if (field.type === "categorical") {
        const fallback = CATEGORICAL_FIELDS.find(item => item.name === field.name);
        const preferred = fallback ? fallback.options : [];
        const modelOptions = Array.isArray(field.options) ? field.options : [];
        const ordered = [...preferred, ...modelOptions.filter(option => !preferred.includes(option))];
        categorical.push({
          name: field.name,
          label: FIELD_LABELS[field.name] || labelize(field.name),
          options: ordered
        });
      } else if (field.type === "number") {
        const fallback = NUMERIC_FIELDS.find(item => item.name === field.name) || {};
        numeric.push({
          name: field.name,
          label: FIELD_LABELS[field.name] || labelize(field.name),
          min: field.minimum ?? fallback.min ?? 0,
          max: field.maximum ?? fallback.max ?? null,
          value: fallback.value ?? field.default_if_null ?? 0,
          hint: FIELD_HINTS[field.name] || fallback.hint || ""
        });
      }
    });
    if (categorical.length) CATEGORICAL_FIELDS = categorical;
    if (numeric.length) NUMERIC_FIELDS = numeric;
  } catch (error) {
    console.info("Using bundled fallback input schema.", error);
  }
}

function fmtPct(value) {
  return `${(Number(value) * 100).toFixed(2)}%`;
}

function labelize(name) {
  return name.replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase());
}

function optionLabel(fieldName, optionValue) {
  return (OPTION_LABELS[fieldName] && OPTION_LABELS[fieldName][optionValue]) || optionValue;
}

function jsDayToModelDay(date) {
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function setFieldValue(name, value, { force = false } = {}) {
  const field = document.getElementById(name);
  if (!field) return;
  if (!force && USER_EDITED_FIELDS.has(name)) return;
  field.value = value;
}

function applyCurrentTimeDefaults({ force = false } = {}) {
  const now = new Date();
  setFieldValue("crash_hour", now.getHours(), { force });
  setFieldValue("crash_day_of_week", jsDayToModelDay(now), { force });
  setFieldValue("crash_month", now.getMonth() + 1, { force });
}

function weatherCodeToModelValue(code) {
  if ([0, 1].includes(code)) return "CLEAR";
  if ([2, 3].includes(code)) return "CLOUDY/OVERCAST";
  if ([45, 48].includes(code)) return "FOG/SMOKE/HAZE";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code)) return "RAIN";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "SNOW";
  return "OTHER";
}

function applyWeatherDefault({ force = false } = {}) {
  if (!latestWeatherModelValue) return;
  setFieldValue("weather_condition", latestWeatherModelValue, { force });
}

function trackUserFieldEdits() {
  document.querySelectorAll("#predict-form select, #predict-form input").forEach(field => {
    field.addEventListener("input", event => USER_EDITED_FIELDS.add(event.target.name));
    field.addEventListener("change", event => USER_EDITED_FIELDS.add(event.target.name));
  });
}

function updateClock() {
  const now = new Date();
  document.getElementById("clock-time").textContent = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  }).format(now);
  document.getElementById("clock-date").textContent = new Intl.DateTimeFormat("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  }).format(now);
}

async function loadWeather(position) {
  const fallback = { latitude: 35.6762, longitude: 139.6503, label: "Tokyo" };
  const coords = position ? {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    label: "Local"
  } : fallback;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current_weather=true&timezone=auto`;
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const current = data.current_weather;
    latestWeatherModelValue = weatherCodeToModelValue(Number(current.weathercode));
    applyWeatherDefault();
    const [desc, icon] = WEATHER_CODES[current.weathercode] || ["Weather available", "🌡️"];
    document.getElementById("weather-icon").textContent = icon;
    document.getElementById("weather-temp").textContent = `${Math.round(current.temperature)}°C · ${desc}`;
    document.getElementById("weather-desc").textContent = `Updated from Open-Meteo at ${current.time.replace("T", " ")}`;
    document.getElementById("weather-wind").textContent = `${Math.round(current.windspeed)} km/h`;
    document.getElementById("weather-location").textContent = coords.label;
  } catch (error) {
    document.getElementById("weather-temp").textContent = "Weather unavailable";
    document.getElementById("weather-desc").textContent = "Internet or browser permission may be blocked.";
    document.getElementById("weather-wind").textContent = "--";
  }
}

function requestWeather() {
  if (!navigator.geolocation) {
    loadWeather(null);
    return;
  }
  navigator.geolocation.getCurrentPosition(loadWeather, () => loadWeather(null), { timeout: 4500, maximumAge: 600000 });
}

function renderModelTable() {
  const tbody = document.getElementById("model-table-body");
  const bars = document.getElementById("metric-bars");
  if (!tbody || !bars) return;
  tbody.innerHTML = MODEL_METRICS.map(row => `
    <tr class="${row.selected ? "selected" : ""}">
      <td>${row.model}${row.selected ? " ★" : ""}</td>
      <td>${fmtPct(row.accuracy)}</td>
      <td>${fmtPct(row.balanced_accuracy)}</td>
      <td>${fmtPct(row.macro_f1)}</td>
      <td>${fmtPct(row.weighted_f1)}</td>
    </tr>
  `).join("");

  const barRows = [];
  MODEL_METRICS.forEach(row => {
    barRows.push({ label: `${row.model} · Macro F1`, value: row.macro_f1 });
    barRows.push({ label: `${row.model} · Balanced Acc.`, value: row.balanced_accuracy });
  });
  bars.innerHTML = barRows.map(item => `
    <div class="metric-row">
      <div class="metric-row-header"><span>${item.label}</span><strong>${fmtPct(item.value)}</strong></div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.max(4, item.value * 100)}%"></div></div>
    </div>
  `).join("");
}

function renderFields() {
  const cat = document.getElementById("categorical-fields");
  const num = document.getElementById("numeric-fields");
  cat.innerHTML = CATEGORICAL_FIELDS.map(field => `
    <div class="field">
      <label for="${field.name}">${field.label}</label>
      <select id="${field.name}" name="${field.name}">
        ${field.options.map(option => `<option value="${option}">${optionLabel(field.name, option)}</option>`).join("")}
      </select>
    </div>
  `).join("");
  num.innerHTML = NUMERIC_FIELDS.map(field => `
    <div class="field">
      <label for="${field.name}">${field.label}</label>
      <input id="${field.name}" name="${field.name}" type="number" min="${field.min}" ${field.max !== null ? `max="${field.max}"` : ""} value="${field.value}" />
      ${field.hint ? `<small class="field-hint">${field.hint}</small>` : ""}
    </div>
  `).join("");
  applySample("low", false);
  applyCurrentTimeDefaults({ force: true });
  applyWeatherDefault({ force: true });
  trackUserFieldEdits();
}

function applySample(name, markEdited = true) {
  const sample = SAMPLES[name];
  Object.entries(sample).forEach(([key, value]) => {
    const input = document.getElementById(key);
    if (input) {
      input.value = value;
      if (markEdited) USER_EDITED_FIELDS.add(key);
    }
  });
}

function collectRecord() {
  const record = {};
  CATEGORICAL_FIELDS.forEach(field => {
    record[field.name] = document.getElementById(field.name).value;
  });
  NUMERIC_FIELDS.forEach(field => {
    record[field.name] = Number(document.getElementById(field.name).value);
  });
  return record;
}

function simulatePrediction(record) {
  let risk = 1.8;
  const reasons = [];
  const add = (points, reason) => { risk += points; reasons.push(reason); };

  if (record.num_units >= 3) add(1.1, "multi-unit crash");
  if (record.num_units >= 5) add(1.4, "high number of involved units");
  if (["PEDESTRIAN", "PEDALCYCLIST", "HEAD ON"].includes(record.first_crash_type)) add(2.2, "vulnerable road user or high-impact crash type");
  if (["FIXED OBJECT", "ANGLE"].includes(record.first_crash_type)) add(0.9, "crash type associated with higher injury risk");
  if (["RAIN", "SNOW", "FOG/SMOKE/HAZE"].includes(record.weather_condition)) add(0.9, "adverse weather");
  if (["WET", "ICE", "SNOW OR SLUSH"].includes(record.roadway_surface_cond)) add(0.9, "reduced road friction");
  if (String(record.lighting_condition).includes("DARKNESS")) add(0.8, "dark lighting conditions");
  if (["UNDER THE INFLUENCE OF ALCOHOL/DRUGS", "EXCEEDING AUTHORIZED SPEED LIMIT", "DISREGARDING TRAFFIC SIGNALS", "PHYSICAL CONDITION OF DRIVER"].includes(record.prim_contributory_cause)) add(1.4, "high-risk contributory cause");
  if (record.intersection_related_i === "Y") add(0.4, "intersection involvement");
  if (record.crash_hour <= 5 || record.crash_hour >= 21) add(0.5, "late-night / low-light time window");
  if (record.crash_day_of_week === 1 || record.crash_day_of_week === 7) add(0.3, "weekend pattern");

  risk = Math.max(0, Math.min(10, risk));
  let severe = Math.max(0.015, Math.min(0.52, 0.015 + Math.max(0, risk - 4) * 0.075));
  let minor = Math.max(0.12, Math.min(0.62, 0.18 + risk * 0.045 - severe * 0.15));
  let noInjury = Math.max(0.05, 1 - minor - severe);
  const total = noInjury + minor + severe;
  noInjury /= total; minor /= total; severe /= total;
  const probabilities = { NO_INJURY: noInjury, MINOR_INJURY: minor, SEVERE_INJURY: severe };
  const predicted_label = Object.entries(probabilities).sort((a, b) => b[1] - a[1])[0][0];
  return {
    predicted_label,
    confidence: probabilities[predicted_label],
    probabilities,
    model: "Browser demo heuristic",
    demo_mode: true,
    reasons: reasons.slice(0, 4)
  };
}

async function predict(record) {
  try {
    const response = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    return simulatePrediction(record);
  }
}

function noteForLabel(label, demoMode) {
  const prefix = demoMode ? "Demo estimate: " : "Model estimate: ";
  if (label === "SEVERE_INJURY") return prefix + "severe outcomes are rare and difficult to predict. Review this case carefully.";
  if (label === "MINOR_INJURY") return prefix + "the input conditions are associated with higher injury risk. Check the probability values as well as the label.";
  return prefix + "the case is closest to the no-injury group, but severe cases can still be missed.";
}

function renderPrediction(result, record) {
  const label = result.predicted_label || "UNKNOWN";
  const probabilities = result.probabilities || {};
  const demoMode = Boolean(result.demo_mode || String(result.model || "").toLowerCase().includes("demo"));
  document.getElementById("prediction-label").textContent = label.replaceAll("_", " ");
  document.getElementById("prediction-confidence").textContent = `${fmtPct(result.confidence || 0)} confidence · ${result.model || "Local model"}`;
  document.getElementById("prediction-source").textContent = demoMode ? "Demo mode" : "Real model";
  document.getElementById("prediction-source").className = demoMode ? "badge" : "badge subtle";
  document.getElementById("prediction-note").textContent = noteForLabel(label, demoMode);
  document.getElementById("request-json").textContent = JSON.stringify(record, null, 2);

  const bars = document.getElementById("probability-bars");
  bars.innerHTML = ["NO_INJURY", "MINOR_INJURY", "SEVERE_INJURY"].map(key => {
    const value = Number(probabilities[key] || 0);
    return `
      <div class="prob-row">
        <div class="prob-label"><span>${labelize(key)}</span><strong>${fmtPct(value)}</strong></div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(3, value * 100)}%"></div></div>
      </div>
    `;
  }).join("");
}

async function checkBackendStatus() {
  const dot = document.getElementById("status-dot");
  const title = document.getElementById("model-status-title");
  const detail = document.getElementById("model-status-detail");
  if (!dot || !title || !detail) return;
  try {
    const response = await fetch("/api/status", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const status = await response.json();
    if (status.demo_mode) {
      dot.className = "status-dot demo";
      title.textContent = "Demo predictor active";
      detail.textContent = status.message || "Saved model files were not found. Demo predictor is being used.";
    } else {
      dot.className = "status-dot ready";
      title.textContent = "FT-Transformer loaded";
      detail.textContent = status.message || "Predictions use the saved local model files.";
    }
  } catch (error) {
    dot.className = "status-dot demo";
    title.textContent = "Browser demo mode";
    detail.textContent = "Run with server.py to use the model endpoint.";
  }
}

function setupEdaFilters() {
  document.querySelectorAll("[data-eda-filter]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-eda-filter]").forEach(b => b.classList.remove("active"));
      button.classList.add("active");
      const filter = button.dataset.edaFilter;
      document.querySelectorAll(".viz-card").forEach(card => {
        card.style.display = filter === "all" || card.dataset.edaType === filter ? "" : "none";
      });
    });
  });
}

function setupPredictionForm() {
  document.querySelectorAll("[data-sample]").forEach(button => {
    button.addEventListener("click", () => applySample(button.dataset.sample));
  });
  document.getElementById("predict-form").addEventListener("submit", async event => {
    event.preventDefault();
    const record = collectRecord();
    document.getElementById("prediction-label").textContent = "Predicting…";
    document.getElementById("prediction-confidence").textContent = "Running prediction.";
    const result = await predict(record);
    renderPrediction(result, record);
  });
}

async function init() {
  updateClock();
  setInterval(updateClock, 1000);
  requestWeather();
  document.getElementById("refresh-weather").addEventListener("click", requestWeather);
  renderModelTable();
  await loadModelSchema();
  renderFields();
  setupEdaFilters();
  setupPredictionForm();
  checkBackendStatus();
}

document.addEventListener("DOMContentLoaded", () => {
  init().catch(error => {
    console.error("Page initialisation failed", error);
  });
});
