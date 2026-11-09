// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  devServer: {
    port: 6060,
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.API_URL || "",
    },
  },
});
