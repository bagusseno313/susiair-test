<script setup lang="ts">
import { computed, ref, watch } from "vue";

const runtimeConfig = useRuntimeConfig();
const apiBase = runtimeConfig.public.apiBase || "";
const viewDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
const scheduleData = ref<{ legend: Array<{ code: string; label: string; color: string }>; days: Array<{ date: string; base_name: string | null; base_color: string | null; duty_type: string | null; count_schedules: number; count_logbooks: number; remainingDuties: number; isComplete: boolean; }> }>({
  legend: [],
  days: [],
});
const isLoading = ref(true);
const error = ref("");

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getApiUrl = (path: string) => {
  const base = apiBase ? apiBase.replace(/\/$/, "") : "";
  return `${base}${path}`;
};

const monthLabel = computed(() =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(viewDate.value),
);

const calendarCells = computed(() => {
  const days = scheduleData.value.days || [];
  if (!days.length) {
    return [];
  }

  const firstDay = new Date(`${days[0].date}T00:00:00Z`);
  const leadingBlanks = firstDay.getUTCDay();
  const cells: Array<Record<string, unknown>> = [];

  for (let index = 0; index < leadingBlanks; index += 1) {
    cells.push({ empty: true });
  }

  days.forEach((day) => {
    cells.push({ ...day, empty: false });
  });

  while (cells.length % 7 !== 0) {
    cells.push({ empty: true });
  }

  return cells;
});

const fetchMonth = async () => {
  const year = viewDate.value.getFullYear();
  const month = viewDate.value.getMonth() + 1;

  isLoading.value = true;
  error.value = "";

  try {
    const response = await fetch(
      `${getApiUrl("/schedules")}?year=${year}&month=${month}`,
    );

    if (!response.ok) {
      throw new Error("Schedule API unavailable");
    }

    scheduleData.value = await response.json();
  } catch (_err) {
    error.value = "Unable to load the schedule for this month.";
    scheduleData.value = { legend: [], days: [] };
  } finally {
    isLoading.value = false;
  }
};

const moveMonth = (delta: number) => {
  const nextDate = new Date(
    viewDate.value.getFullYear(),
    viewDate.value.getMonth() + delta,
    1,
  );

  viewDate.value = nextDate;
};

const getRemainingText = (day: any) => {
  if (!day || !day.count_schedules) {
    return "";
  }

  if (day.count_logbooks === day.count_schedules) {
    return "✓";
  }

  return String(Math.max(day.count_schedules - day.count_logbooks, 0));
};

const getStatusClass = (day: any) => {
  if (!day || !day.count_schedules) {
    return "status neutral";
  }

  if (day.count_logbooks === day.count_schedules) {
    return "status complete";
  }

  return "status pending";
};

const openDayDetail = (day: any) => {
  if (!day || day.empty || !day.date) {
    return;
  }

  window.alert(`Detail page coming soon for ${day.date}.`);
};

watch(viewDate, fetchMonth, { immediate: true });
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
        <NuxtLink to="/home" class="nav-item">Home</NuxtLink>
        <NuxtLink to="/schedule" class="nav-item active">Schedule</NuxtLink>
      </nav>
    </header>

    <main class="schedule-wrap">
      <section class="calendar-card">
        <div class="calendar-header">
          <button type="button" class="month-button" @click="moveMonth(-1)">
            ‹
          </button>
          <h2>{{ monthLabel }}</h2>
          <button type="button" class="month-button" @click="moveMonth(1)">
            ›
          </button>
        </div>

        <div v-if="isLoading" class="status-state">Loading schedule...</div>
        <div v-else-if="error" class="status-state error-state">{{ error }}</div>

        <div v-else class="calendar-panel">
          <div class="weekday-row">
            <div v-for="weekday in weekDays" :key="weekday" class="weekday-name">
              {{ weekday }}
            </div>
          </div>

          <div class="calendar-grid">
            <button
              v-for="(cell, index) in calendarCells"
              :key="`${cell.date ?? 'empty'}-${index}`"
              type="button"
              class="day-cell"
              :class="{ empty: cell.empty, filled: !cell.empty }"
              :style="cell.empty ? {} : { background: cell.base_color ? `${cell.base_color}20` : '#f8fafc', borderColor: cell.base_color || '#dfe3ea' }"
              :disabled="cell.empty"
              @click="openDayDetail(cell)"
            >
              <span class="day-number" v-if="!cell.empty">
                {{ new Date(`${cell.date}T00:00:00Z`).getUTCDate() }}
              </span>

              <span v-if="!cell.empty && cell.base_name" class="day-base">
                {{ cell.base_name }}
              </span>

              <span
                v-if="!cell.empty && cell.count_schedules"
                :class="getStatusClass(cell)"
              >
                {{ getRemainingText(cell) }}
              </span>
            </button>
          </div>
        </div>
      </section>

      <section class="legend-card">
        <h3>Duty legend</h3>
        <div class="legend-list">
          <div v-for="item in scheduleData.legend" :key="item.code" class="legend-item">
            <span class="legend-swatch" :style="{ background: item.color }" />
            <span>{{ item.label }}</span>
          </div>
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
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(14, 33, 56, 0.06);
  border-radius: 18px;
  padding: 16px 20px;
  box-shadow: 0 10px 28px rgba(14, 33, 56, 0.04);
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

.schedule-wrap {
  max-width: 1180px;
  margin: 0 auto;
  display: grid;
  gap: 18px;
}

.calendar-card,
.legend-card {
  background: #ffffff;
  border: 1px solid rgba(14, 33, 56, 0.06);
  border-radius: 18px;
  box-shadow: 0 12px 28px rgba(14, 33, 56, 0.04);
}

.calendar-card {
  padding: 22px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 20px;
}

.calendar-header h2 {
  margin: 0;
  font-size: clamp(1.4rem, 2vw, 2rem);
}

.month-button {
  width: 42px;
  height: 42px;
  border: 1px solid rgba(14, 33, 56, 0.1);
  border-radius: 12px;
  background: #f8fafc;
  font-size: 1.5rem;
  color: #0e2138;
  cursor: pointer;
}

.status-state {
  text-align: center;
  color: #475569;
  font-weight: 600;
  padding: 18px 10px;
}

.error-state {
  color: #b91c1c;
}

.calendar-panel {
  display: grid;
  gap: 12px;
}

.weekday-row,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
}

.weekday-name {
  text-align: center;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
  font-weight: 700;
  padding: 0 0 8px;
}

.day-cell {
  height: 118px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 8px;
  cursor: pointer;
  text-align: left;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.day-cell:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
}

.day-cell.empty {
  opacity: 0.15;
  cursor: default;
}

.day-number {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}

.day-base {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #334155;
}

.status {
  align-self: flex-end;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  min-height: 26px;
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 0.72rem;
  font-weight: 800;
  margin-top: auto;
}

.status.complete {
  background: rgba(16, 185, 129, 0.18);
  color: #047857;
}

.status.pending {
  background: rgba(245, 158, 11, 0.18);
  color: #b45309;
}

.status.neutral {
  background: rgba(148, 163, 184, 0.14);
  color: #475569;
}

.legend-card {
  padding: 20px 22px 18px;
}

.legend-card h3 {
  margin: 0 0 14px;
  font-size: 1rem;
}

.legend-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: #f8fafc;
  border: 1px solid rgba(14, 33, 56, 0.06);
  color: #0f172a;
  font-size: 0.8rem;
  font-weight: 600;
}

.legend-swatch {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

@media (max-width: 820px) {
  .page-shell {
    padding: 16px;
  }

  .topbar {
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

  .day-cell {
    height: 96px;
    padding: 8px;
  }
}
</style>
