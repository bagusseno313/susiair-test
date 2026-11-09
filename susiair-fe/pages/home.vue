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
}

interface FlightHourSummaryResponse {
  range: RangeKey;
  referenceDate: string;
  limit: number;
  max: number;
  windowDays: number;
  displayRangeDays: number;
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
  series: [],
});

const chartPoints = computed(() => summary.value.series ?? []);
const chartMax = computed(() => Math.max(summary.value.max || 1, 1));
const chartLinePoints = computed(() => {
  if (!chartPoints.value.length) return "";

  const width = 820;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 24, left: 32 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  return chartPoints.value
    .map((point, index) => {
      const x =
        padding.left +
        (index / Math.max(chartPoints.value.length - 1, 1)) * innerWidth;
      const y =
        padding.top +
        innerHeight -
        (point.value / chartMax.value) * innerHeight;
      return `${x},${y}`;
    })
    .join(" ");
});

const limitLineY = computed(() => {
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 24, left: 32 };
  const innerHeight = height - padding.top - padding.bottom;

  return (
    padding.top +
    innerHeight -
    (summary.value.limit / chartMax.value) * innerHeight
  );
});

const areaPath = computed(() => {
  if (!chartPoints.value.length) return "";

  const width = 820;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 24, left: 32 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const points = chartPoints.value.map((point, index) => {
    const x =
      padding.left +
      (index / Math.max(chartPoints.value.length - 1, 1)) * innerWidth;
    const y =
      padding.top + innerHeight - (point.value / chartMax.value) * innerHeight;
    return [x, y];
  });

  const firstX = points[0][0];
  const lastX = points[points.length - 1][0];
  const baseY = padding.top + innerHeight;

  return `M ${firstX} ${baseY} L ${points.map(([x, y]) => `${x} ${y}`).join(" L ")} L ${lastX} ${baseY} Z`;
});

const getDateInput = (date: Date) => date.toISOString().slice(0, 10);

const shiftDate = (date: Date, dayOffset: number) => {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + dayOffset);
  return nextDate;
};

const getCardRange = (key: string) => {
  const referenceDate = new Date();

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

const loadCards = async () => {
  const cardEntries = await Promise.all(
    cardConfigs.map(async (card) => {
      const range = getCardRange(card.key);
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
              :style="{ width: `${Math.min(card.progress, 100)}%` }"
              :class="{ exceeded: card.total > card.limit }"
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
          <svg
            viewBox="0 0 820 220"
            class="chart-svg"
            role="img"
            aria-label="Flight hour summary chart"
          >
            <g class="grid-lines">
              <line x1="32" x2="800" y1="20" y2="20" />
              <line x1="32" x2="800" y1="80" y2="80" />
              <line x1="32" x2="800" y1="140" y2="140" />
              <line x1="32" x2="800" y1="200" y2="200" />
            </g>

            <line
              x1="32"
              x2="800"
              :y1="limitLineY"
              :y2="limitLineY"
              class="limit-line"
            />

            <path :d="areaPath" class="area-fill" />
            <polyline :points="chartLinePoints" class="chart-line" />

            <g v-for="point in chartPoints" :key="point.date">
              <circle
                :cx="
                  32 +
                  (chartPoints.indexOf(point) /
                    Math.max(chartPoints.length - 1, 1)) *
                    768
                "
                :cy="20 + (200 - (point.value / chartMax) * 180)"
                r="4"
                class="chart-point"
              />
            </g>

            <g
              v-for="point in chartPoints"
              :key="`${point.date}-label`"
              class="x-labels"
            >
              <text
                :x="
                  32 +
                  (chartPoints.indexOf(point) /
                    Math.max(chartPoints.length - 1, 1)) *
                    768
                "
                y="214"
                text-anchor="middle"
              >
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
  background: linear-gradient(90deg, #22c5e8 0%, #0e2138 100%);
}

.progress-fill.exceeded {
  background: linear-gradient(90deg, #ffa5a5 0%, #ef4444 100%);
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
  height: 220px;
}

.grid-lines line {
  stroke: rgba(148, 163, 184, 0.35);
  stroke-width: 1;
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
