<script setup lang="ts">
const runtimeConfig = useRuntimeConfig();
const apiBase = runtimeConfig.public.apiBase || "";

const rangeOptions = [
  { key: "1w", label: "1W" },
  { key: "1m", label: "1M" },
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "1y", label: "1Y" },
] as const;

type RangeKey = (typeof rangeOptions)[number]["key"];

interface FlightHourCard {
  key: string;
  title: string;
  limit: number;
  windowLabel: string;
  total: number;
  progress: number;
}

interface FlightHourSummaryPoint {
  date: string;
  value: number;
  label: string;
  missingDays: number;
}

interface FlightHourSummaryResponse {
  range: RangeKey;
  referenceDate: string;
  limit: number;
  max: number;
  windowDays: number;
  displayRangeDays: number;
  missingDays: number;
  series: FlightHourSummaryPoint[];
}

interface DocumentItem {
  id: string;
  label: string;
  expiryDate: string;
  status: "safe" | "soon" | "expired";
  daysRemaining: number;
  badge: string;
}

const profile = ref({
  name: "",
  totalFlightHours: 0,
  avatarUrl: "/pilot-avatar.webp",
});

const greeting = computed(() => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
});

const cardConfigs = [
  { key: "daily", title: "Daily", limit: 8, windowLabel: "Today only" },
  { key: "weekly", title: "Weekly", limit: 40, windowLabel: "Rolling 7 days" },
  {
    key: "monthly",
    title: "Monthly",
    limit: 100,
    windowLabel: "Rolling 30 days",
  },
  {
    key: "annual",
    title: "Annual",
    limit: 1050,
    windowLabel: "Rolling 365 days",
  },
] as const;

const cards = ref<FlightHourCard[]>([]);
const documents = ref<DocumentItem[]>([]);
const selectedRange = ref<RangeKey>("1w");
const summary = ref<FlightHourSummaryResponse>({
  range: "1m",
  referenceDate: "",
  limit: 100,
  max: 125,
  windowDays: 30,
  displayRangeDays: 7,
  missingDays: 0,
  series: [],
});

const chartPoints = computed(() => summary.value.series ?? []);
const chartGeometry = {
  width: 860,
  height: 250,
  left: 62,
  right: 18,
  top: 20,
  bottom: 42,
} as const;
const chartPlotWidth =
  chartGeometry.width - chartGeometry.left - chartGeometry.right;
const chartPlotHeight =
  chartGeometry.height - chartGeometry.top - chartGeometry.bottom;
const chartMax = computed(() => Math.max(summary.value.max || 1, 1));
const hoveredPoint = ref<FlightHourSummaryPoint | null>(null);
const hoveredPointIndex = ref(-1);

const getChartX = (index: number) =>
  chartGeometry.left +
  (index / Math.max(chartPoints.value.length - 1, 1)) * chartPlotWidth;

const getChartY = (value: number) =>
  chartGeometry.top +
  chartPlotHeight -
  (value / chartMax.value) * chartPlotHeight;

const formatChartValue = (value: number) => Number(value.toFixed(1)).toString();

const chartYAxisTicks = computed(() =>
  Array.from({ length: 5 }, (_, index) => {
    const value = chartMax.value * (1 - index / 4);
    return {
      label: formatChartValue(value),
      y: getChartY(value),
    };
  }),
);

const chartLinePoints = computed(() => {
  if (!chartPoints.value.length) return "";

  return chartPoints.value
    .map((point, index) => `${getChartX(index)},${getChartY(point.value)}`)
    .join(" ");
});

const limitLineY = computed(() => getChartY(summary.value.limit));

const areaPath = computed(() => {
  if (!chartPoints.value.length) return "";

  const points = chartPoints.value.map((point, index) => [
    getChartX(index),
    getChartY(point.value),
  ]);
  const firstX = points[0][0];
  const lastX = points[points.length - 1][0];
  const baseY = chartGeometry.top + chartPlotHeight;

  return `M ${firstX} ${baseY} L ${points.map(([x, y]) => `${x} ${y}`).join(" L ")} L ${lastX} ${baseY} Z`;
});

const setHoveredPoint = (point: FlightHourSummaryPoint, index: number) => {
  hoveredPoint.value = point;
  hoveredPointIndex.value = index;
};

const clearHoveredPoint = () => {
  hoveredPoint.value = null;
  hoveredPointIndex.value = -1;
};

const tooltipX = computed(() => {
  if (hoveredPointIndex.value < 0) return 0;

  return Math.max(
    6,
    Math.min(
      getChartX(hoveredPointIndex.value) - 90,
      chartGeometry.width - 186,
    ),
  );
});

const tooltipY = computed(() => {
  if (!hoveredPoint.value) return 0;

  const pointY = getChartY(hoveredPoint.value.value);
  return pointY > 96 ? pointY - 76 : pointY + 12;
});

const getDateInput = (date: Date) => date.toISOString().slice(0, 10);

const shiftDate = (date: Date, dayOffset: number) => {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + dayOffset);
  return nextDate;
};

const getCardRange = (key: string, referenceDateValue?: string) => {
  const referenceDate = referenceDateValue
    ? new Date(`${referenceDateValue}T00:00:00Z`)
    : new Date();

  switch (key) {
    case "daily":
      return {
        from: getDateInput(referenceDate),
        to: getDateInput(referenceDate),
      };
    case "weekly":
      return {
        from: getDateInput(shiftDate(referenceDate, -6)),
        to: getDateInput(referenceDate),
      };
    case "monthly":
      return {
        from: getDateInput(shiftDate(referenceDate, -29)),
        to: getDateInput(referenceDate),
      };
    case "annual":
      return {
        from: getDateInput(shiftDate(referenceDate, -364)),
        to: getDateInput(referenceDate),
      };
    default:
      return {
        from: getDateInput(referenceDate),
        to: getDateInput(referenceDate),
      };
  }
};

const getApiUrl = (path: string) => {
  const base = apiBase ? apiBase.replace(/\/$/, "") : "";
  return `${base}${path}`;
};

const loadProfile = async () => {
  const token = localStorage.getItem("susiair_token");

  if (!token) {
    await navigateTo("/");
    return;
  }

  const endpoints = [getApiUrl("/profile/me"), getApiUrl("/pilot/me")];

  for (const endpoint of endpoints) {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("susiair_token");
      await navigateTo("/");
      return;
    }

    if (response.ok) {
      const data = await response.json();
      profile.value = {
        name: data.name || "John Doe",
        totalFlightHours: Number(data.totalFlightHours ?? 0),
        avatarUrl: data.avatarUrl || "/pilot-avatar.webp",
      };
      return;
    }
  }
};

const loadSummary = async () => {
  const response = await fetch(
    `${getApiUrl("/flight-hours/summary")}?range=${selectedRange.value}`,
  );

  if (!response.ok) {
    return;
  }

  const data = await response.json();
  summary.value = data;
};

const getProgressColor = (progress: number): string => {
  const stops = [
    { at: 0, color: [22, 163, 74] }, // green
    { at: 50, color: [234, 179, 8] }, // yellow
    { at: 100, color: [220, 38, 38] }, // red
  ];
  const value = Math.max(0, Math.min(progress, 100));
  const upperIndex = stops.findIndex((stop) => stop.at >= value);
  const lower = stops[Math.max(upperIndex - 1, 0)];
  const upper = stops[upperIndex < 0 ? stops.length - 1 : upperIndex];
  const ratio =
    upper.at === lower.at ? 0 : (value - lower.at) / (upper.at - lower.at);

  const color = lower.color.map((channel, index) =>
    Math.round(channel + (upper.color[index] - channel) * ratio),
  );

  return `rgb(${color.join(", ")})`;
};

const loadCards = async () => {
  const cardEntries = await Promise.all(
    cardConfigs.map(async (card) => {
      const range = getCardRange(
        card.key,
        summary.value.referenceDate || undefined,
      );
      const response = await fetch(
        `${getApiUrl("/flight-hours")}?from=${range.from}&to=${range.to}`,
      );

      if (!response.ok) {
        return {
          ...card,
          total: 0,
          progress: 0,
        };
      }

      const payload = await response.json();
      const total = payload.reduce(
        (sum: number, entry: { hours: number }) =>
          sum + Number(entry.hours ?? 0),
        0,
      );

      return {
        ...card,
        total: Number(total.toFixed(1)),
        progress: Math.min((total / card.limit) * 100, 100),
      };
    }),
  );

  cards.value = cardEntries;
};

const loadDocuments = async () => {
  const response = await fetch(getApiUrl("/documents"));

  if (!response.ok) {
    return;
  }

  const data = await response.json();
  documents.value = data;
};

onMounted(async () => {
  await loadProfile();
  await loadSummary();
  await loadCards();
  await loadDocuments();
});

watch(selectedRange, () => {
  loadSummary();
});
</script>

<template>
  <div class="page-shell">
    <header class="topbar">
      <div class="brand-wrap">
        <img src="/susiair-logo.png" alt="SusiAir logo" class="brand-logo" />
        <div>
          <p class="small-label">Operations</p>
          <h1>SusiAir</h1>
        </div>
      </div>

      <nav class="nav-links">
        <NuxtLink to="/home" class="nav-item active">Home</NuxtLink>
        <NuxtLink to="/schedule" class="nav-item">Schedule</NuxtLink>
      </nav>
    </header>

    <main class="dashboard">
      <section class="hero-card">
        <div class="hero-copy">
          <p class="eyebrow">Overview</p>
          <h2>{{ greeting }}, {{ profile.name || "Pilot" }}</h2>
        </div>
        <div class="pilot-badge">
          <img :src="profile.avatarUrl" :alt="`${profile.name} avatar`" />
          <div class="pilot-identity">
            <strong>Total Flight Hours</strong>
            <span
              >{{ Number(profile.totalFlightHours || 0).toFixed(1) }} hrs</span
            >
          </div>
        </div>
      </section>

      <section class="cards-grid">
        <article v-for="card in cards" :key="card.key" class="flight-card">
          <div class="card-head">
            <span class="card-title">{{ card.title }}</span>
            <span class="card-window">{{ card.windowLabel }}</span>
          </div>

          <div class="hours-value">
            <strong>{{ card.total.toFixed(1) }}</strong>
            <span>hrs</span>
          </div>

          <div class="progress-track" aria-label="Flight hours progress">
            <div
              class="progress-fill"
              :style="{
                width: `${Math.min(card.progress, 100)}%`,
                backgroundColor: getProgressColor(card.progress),
              }"
            />
          </div>

          <div class="limit-row">
            <span>{{
              card.total > card.limit ? "Exceeded" : "Within limit"
            }}</span>
            <span>{{ card.limit }} hrs</span>
          </div>
        </article>
      </section>

      <section class="chart-panel">
        <div class="chart-header">
          <div>
            <p class="section-label">Rolling hours</p>
            <h3>Flight time summary</h3>
          </div>

          <div class="range-switch" role="tablist" aria-label="Summary range">
            <button
              v-for="option in rangeOptions"
              :key="option.key"
              type="button"
              class="range-button"
              :class="{ active: selectedRange === option.key }"
              @click="selectedRange = option.key"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="chart-wrap">
          <p
            v-if="summary.missingDays > 0"
            class="chart-data-note"
            role="status"
          >
            {{ summary.missingDays }}
            {{ summary.missingDays === 1 ? "day is" : "days are" }} missing from
            the chart's calculation range. Missing dates are treated as 0 flight
            hours.
          </p>

          <svg
            viewBox="0 0 860 250"
            class="chart-svg"
            role="group"
            aria-label="Flight hour summary chart"
          >
            <g
              v-for="tick in chartYAxisTicks"
              :key="tick.label"
              class="grid-lines"
            >
              <line x1="62" x2="842" :y1="tick.y" :y2="tick.y" />
              <text
                class="y-axis-label"
                x="52"
                :y="tick.y + 4"
                text-anchor="end"
              >
                {{ tick.label }}
              </text>
            </g>

            <line
              x1="62"
              x2="842"
              :y1="limitLineY"
              :y2="limitLineY"
              class="limit-line"
            />

            <path :d="areaPath" class="area-fill" />
            <polyline :points="chartLinePoints" class="chart-line" />

            <circle
              v-for="(point, index) in chartPoints"
              :key="point.date"
              :cx="getChartX(index)"
              :cy="getChartY(point.value)"
              :r="
                point.date === summary.referenceDate
                  ? hoveredPoint?.date === point.date
                    ? 7
                    : 6
                  : hoveredPoint?.date === point.date
                    ? 6
                    : 4
              "
              :class="{
                'chart-point': true,
                'reference-date-point': point.date === summary.referenceDate,
              }"
              tabindex="0"
              role="graphics-symbol"
              :aria-label="`${point.date}: ${point.value.toFixed(1)} flight hours; ${point.missingDays} missing days in rolling window${point.date === summary.referenceDate ? '; reference date' : ''}`"
              @mouseenter="setHoveredPoint(point, index)"
              @mouseleave="clearHoveredPoint"
              @focus="setHoveredPoint(point, index)"
              @blur="clearHoveredPoint"
            />

            <g
              v-for="(point, index) in chartPoints.filter(
                (item) => item.date === summary.referenceDate,
              )"
              :key="`${point.date}-reference-label`"
              class="reference-point-annotation"
            >
              <text
                :x="getChartX(chartPoints.indexOf(point))"
                :y="Math.max(getChartY(point.value) - 13, 12)"
                text-anchor="middle"
              >
                Today
              </text>
            </g>

            <g
              v-if="hoveredPoint"
              class="chart-tooltip"
              :transform="`translate(${tooltipX}, ${tooltipY})`"
              aria-hidden="true"
            >
              <rect width="180" height="66" rx="8" />
              <text x="10" y="18" class="chart-tooltip-date">
                {{ hoveredPoint.date }}
              </text>
              <text x="10" y="37">
                {{ hoveredPoint.value.toFixed(1) }} flight hours
              </text>
              <text x="10" y="54">
                {{ hoveredPoint.missingDays }} missing days in window
              </text>
            </g>

            <g
              v-for="(point, index) in chartPoints"
              :key="`${point.date}-label`"
              class="x-labels"
            >
              <text :x="getChartX(index)" y="232" text-anchor="middle">
                {{ point.label }}
              </text>
            </g>
          </svg>
        </div>
      </section>

      <section class="documents-panel">
        <div class="documents-header">
          <p class="section-label">Documents</p>
          <h3>My documents</h3>
        </div>

        <div class="documents-list">
          <article
            v-for="document in documents"
            :key="document.id"
            class="document-item"
          >
            <div class="document-copy">
              <span class="document-label">{{ document.label }}</span>
              <span class="document-date">{{ document.expiryDate }}</span>
            </div>

            <span :class="['document-badge', document.status]">{{
              document.badge
            }}</span>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.page-shell {
  min-height: 100vh;
  background: #f5f6f8;
  color: #0e2138;
  padding: 24px;
}

.topbar {
  max-width: 1180px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(14, 33, 56, 0.06);
  border-radius: 18px;
  padding: 16px 20px;
  box-shadow: 0 10px 28px rgba(14, 33, 56, 0.04);
  backdrop-filter: blur(10px);
}

.brand-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.small-label {
  margin: 0;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #6b7280;
}

.brand-wrap h1 {
  margin: 2px 0 0;
  font-size: 1.2rem;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-item {
  text-decoration: none;
  color: #0e2138;
  font-weight: 600;
  padding: 10px 14px;
  border-radius: 999px;
  transition: background 0.2s ease;
}

.nav-item.active,
.nav-item:hover {
  background: rgba(14, 33, 56, 0.06);
}

.dashboard {
  max-width: 1180px;
  margin: 0 auto;
  display: grid;
  gap: 22px;
}

.hero-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 26px;
  border-radius: 16px;
  background: linear-gradient(135deg, #0e2138 0%, #193b61 100%);
  color: #ffffff;
  border: 1px solid rgba(14, 33, 56, 0.06);
  box-shadow: 0 12px 28px rgba(14, 33, 56, 0.04);
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
}

.hero-card h2 {
  margin: 0;
  font-size: clamp(1.7rem, 2vw, 2.4rem);
}

.pilot-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 220px;
}

.pilot-badge img {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.25);
}

.pilot-identity {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pilot-identity strong {
  font-size: 0.8rem;
  opacity: 0.8;
}

.pilot-identity span {
  font-size: 1.2rem;
  font-weight: 700;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.flight-card {
  background: #ffffff;
  border: 1px solid rgba(14, 33, 56, 0.06);
  border-radius: 16px;
  box-shadow: 0 12px 28px rgba(14, 33, 56, 0.04);
  padding: 18px 18px 16px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.card-title {
  font-size: 0.9rem;
  font-weight: 700;
}

.card-window {
  font-size: 0.7rem;
  color: #6b7280;
}

.hours-value {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 14px;
}

.hours-value strong {
  font-size: 2rem;
  letter-spacing: -0.06em;
}

.hours-value span {
  color: #6b7280;
  font-weight: 600;
}

.progress-track {
  position: relative;
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: rgba(14, 33, 56, 0.08);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  transition:
    width 0.3s ease,
    background-color 0.3s ease;
}

.limit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
  font-size: 0.75rem;
  color: #475569;
}

.chart-panel,
.documents-panel {
  background: #ffffff;
  border: 1px solid rgba(14, 33, 56, 0.06);
  border-radius: 16px;
  box-shadow: 0 12px 28px rgba(14, 33, 56, 0.04);
}

.chart-panel {
  padding: 20px 20px 12px;
}

.documents-panel {
  padding: 18px 18px 12px;
}

.chart-header,
.documents-header,
.documents-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-label {
  margin: 0 0 4px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #64748b;
}

.chart-header h3 {
  margin: 0;
  font-size: 1.4rem;
}

.range-switch {
  display: inline-flex;
  gap: 8px;
  padding: 6px;
  border-radius: 999px;
  background: rgba(14, 33, 56, 0.04);
}

.range-button {
  border: 0;
  background: transparent;
  color: #475569;
  font-weight: 700;
  padding: 8px 12px;
  border-radius: 999px;
  cursor: pointer;
}

.range-button.active {
  background: #0e2138;
  color: #ffffff;
}

.chart-wrap {
  width: 100%;
  overflow-x: auto;
}

.chart-svg {
  width: 100%;
  min-width: 720px;
  height: 250px;
  overflow: visible;
}

.grid-lines line {
  stroke: rgba(148, 163, 184, 0.35);
  stroke-width: 1;
}

.y-axis-label {
  fill: #64748b;
  font-size: 11px;
}

.chart-data-note {
  margin: 0 0 12px;
  padding: 9px 12px;
  border-radius: 10px;
  background: rgba(245, 158, 11, 0.1);
  color: #92400e;
  font-size: 0.82rem;
  line-height: 1.45;
}

.limit-line {
  stroke: #ef4444;
  stroke-width: 2;
  stroke-dasharray: 6 6;
}

.area-fill {
  fill: rgba(34, 197, 232, 0.18);
}

.chart-line {
  fill: none;
  stroke: #0e2138;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.chart-point {
  fill: #0e2138;
  cursor: pointer;
  outline: none;
  transition:
    r 0.15s ease,
    fill 0.15s ease;
}

.chart-point:hover,
.chart-point:focus {
  fill: #22c5e8;
  stroke: #0e2138;
  stroke-width: 2;
}

.chart-point.reference-date-point {
  fill: #16a34a;
  stroke: #ffffff;
  stroke-width: 2;
}

.chart-point.reference-date-point:hover,
.chart-point.reference-date-point:focus {
  fill: #15803d;
  stroke: #0e2138;
  stroke-width: 2;
}

.reference-point-annotation {
  pointer-events: none;
}

.reference-point-annotation text {
  fill: #15803d;
  font-size: 10px;
  font-weight: 800;
  paint-order: stroke;
  stroke: #ffffff;
  stroke-width: 3px;
  stroke-linejoin: round;
}

.chart-tooltip {
  pointer-events: none;
}

.chart-tooltip rect {
  fill: #0e2138;
  stroke: rgba(255, 255, 255, 0.2);
  stroke-width: 1;
  filter: drop-shadow(0 4px 10px rgba(14, 33, 56, 0.18));
}

.chart-tooltip text {
  fill: #ffffff;
  font-size: 11px;
}

.chart-tooltip .chart-tooltip-date {
  font-weight: 700;
}

.x-labels text {
  fill: #64748b;
  font-size: 10px;
}

.documents-list {
  display: grid;
  gap: 12px;
}

.document-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid rgba(14, 33, 56, 0.06);
  border-radius: 12px;
  background: rgba(148, 163, 184, 0.04);
}

.document-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.document-label {
  font-weight: 700;
}

.document-date {
  font-size: 0.8rem;
  color: #64748b;
}

.document-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 88px;
  padding: 7px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
}

.document-badge.safe {
  background: rgba(22, 163, 74, 0.12);
  color: #15803d;
}

.document-badge.soon {
  background: rgba(245, 158, 11, 0.12);
  color: #b45309;
}

.document-badge.expired {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

@media (max-width: 900px) {
  .cards-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .page-shell {
    padding: 16px;
  }

  .topbar,
  .hero-card,
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .nav-links {
    width: 100%;
  }

  .nav-item {
    flex: 1;
    text-align: center;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>
