<script setup lang="ts">
import {
  AlertCircle,
  ArrowRight,
  LockKeyhole,
  PlaneTakeoff,
  ShieldCheck,
  UserRound,
} from "lucide-vue-next";

const runtimeConfig = useRuntimeConfig();
const apiBase = runtimeConfig.public.apiBase || "";

const username = ref("");
const password = ref("");
const errorMessage = ref("");
const isSubmitting = ref(false);

const submitLogin = async () => {
  errorMessage.value = "";

  if (!username.value.trim() || !password.value.trim()) {
    errorMessage.value = "Please enter your username and password.";
    return;
  }

  isSubmitting.value = true;

  try {
    const requestUrl = apiBase
      ? `${apiBase.replace(/\/$/, "")}/auth/login`
      : "/auth/login";

    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.value.trim(),
        password: password.value,
      }),
    });

    if (response.status === 401) {
      errorMessage.value =
        "Bad credentials. Please check your username and password.";
      return;
    }

    if (!response.ok) {
      errorMessage.value = "Something went wrong. Please try again.";
      return;
    }

    const data = await response.json();
    const token = data?.access_token || data?.accessToken || data?.token;

    if (token) {
      localStorage.setItem("susiair_token", token);
    }

    await navigateTo("/home");
  } catch (_error) {
    errorMessage.value = "Something went wrong. Please try again.";
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="auth-shell">
    <div class="auth-panel">
      <div class="brand-panel">
        <div class="brand-badge">
          <PlaneTakeoff :size="18" />
          SusiAir Ops
        </div>

        <div class="brand-mark">
          <img src="/susiair-logo.png" alt="SusiAir logo" />
        </div>

        <h1>Operations Access</h1>
        <p>
          Secure access for crew, maintenance, and flight operations
          coordination.
        </p>

        <ul class="feature-list">
          <li>
            <ShieldCheck :size="16" />
            Live dispatch updates
          </li>
          <li>
            <ShieldCheck :size="16" />
            Crew readiness tracking
          </li>
          <li>
            <ShieldCheck :size="16" />
            Maintenance status visibility
          </li>
        </ul>
      </div>

      <div class="login-panel">
        <div class="login-header">
          <span class="eyebrow">Welcome back</span>
          <h2>Sign in</h2>
        </div>

        <form class="login-form" @submit.prevent="submitLogin">
          <label class="field-group">
            <span>Username</span>
            <div class="input-wrap">
              <UserRound :size="18" />
              <input
                v-model="username"
                type="text"
                name="username"
                autocomplete="username"
                placeholder="Enter your username"
              />
            </div>
          </label>

          <label class="field-group">
            <span>Password</span>
            <div class="input-wrap">
              <LockKeyhole :size="18" />
              <input
                v-model="password"
                type="password"
                name="password"
                autocomplete="current-password"
                placeholder="Enter your password"
              />
            </div>
          </label>

          <div v-if="errorMessage" class="message error">
            <AlertCircle :size="16" />
            <span>{{ errorMessage }}</span>
          </div>

          <button class="primary-button" type="submit" :disabled="isSubmitting">
            <span>{{ isSubmitting ? "Signing in..." : "Sign in" }}</span>
            <ArrowRight :size="18" />
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(
      circle at top left,
      rgba(34, 197, 232, 0.12),
      transparent 30%
    ),
    #f5f6f8;
}

.auth-panel {
  width: min(100%, 980px);
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  background: #ffffff;
  border: 1px solid rgba(14, 33, 56, 0.08);
  border-radius: 24px;
  box-shadow: 0 18px 40px rgba(14, 33, 56, 0.08);
  overflow: hidden;
}

.brand-panel {
  padding: 44px 40px;
  background: linear-gradient(180deg, #0e2138 0%, #132f4d 100%);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.brand-mark {
  width: 164px;
  margin: 28px 0 18px;
}

.brand-mark img {
  display: block;
  width: 100%;
  height: auto;
  filter: drop-shadow(0 10px 16px rgba(0, 0, 0, 0.18));
}

.brand-panel h1 {
  margin: 0;
  font-size: clamp(2rem, 2vw, 2.7rem);
  line-height: 1.1;
}

.brand-panel p {
  margin: 16px 0 0;
  max-width: 28rem;
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.72);
}

.feature-list {
  display: grid;
  gap: 14px;
  list-style: none;
  margin: 28px 0 0;
  padding: 0;
}

.feature-list li {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.feature-list svg {
  color: #22c5e8;
}

.login-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 42px 32px;
  background: #ffffff;
}

.login-header {
  margin-bottom: 24px;
}

.eyebrow {
  display: inline-block;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #6b7280;
  font-weight: 700;
}

.login-header h2 {
  margin: 10px 0 0;
  font-size: clamp(1.8rem, 3vw, 2.3rem);
  letter-spacing: -0.04em;
  color: #0e2138;
}

.login-form {
  display: grid;
  gap: 20px;
}

.field-group {
  display: grid;
  gap: 10px;
  font-weight: 600;
  color: #0e2138;
}

.field-group span {
  font-size: 0.9rem;
}

.input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(14, 33, 56, 0.12);
  border-radius: 14px;
  background: #f9fafb;
  padding: 0 14px;
  min-height: 52px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.input-wrap:focus-within {
  border-color: rgba(230, 55, 87, 0.65);
  box-shadow: 0 0 0 4px rgba(230, 55, 87, 0.08);
}

.input-wrap svg {
  color: #6b7280;
  flex-shrink: 0;
}

.input-wrap input {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: #0e2138;
  font: inherit;
  font-size: 0.98rem;
}

.input-wrap input::placeholder {
  color: #9aa3af;
}

.message {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 0.92rem;
  font-weight: 600;
}

.message.error {
  background: rgba(230, 55, 87, 0.08);
  color: #b9273d;
  border: 1px solid rgba(230, 55, 87, 0.18);
}

.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 0;
  border-radius: 999px;
  min-height: 52px;
  padding: 0 22px;
  background: linear-gradient(135deg, #e63757 0%, #c92d49 100%);
  color: #ffffff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
  box-shadow: 0 12px 20px rgba(230, 55, 87, 0.25);
}

.primary-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.primary-button:disabled {
  opacity: 0.78;
  cursor: wait;
}

@media (max-width: 860px) {
  .auth-panel {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    padding: 30px 24px;
  }

  .login-panel {
    padding: 28px 20px 32px;
  }
}
</style>
