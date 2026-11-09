export function isTrueEnv(name: string): boolean {
  const value = process.env[name];
  return typeof value === "string" && value.trim().toLowerCase() === "true";
}

export function loadProjectEnv(): void {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile();
    return;
  }

  try {
    // Fallback for older Node runtimes: keep startup resilient without requiring the app
    // to be launched from a shell that already exported the values.
    require("dotenv").config();
  } catch {
    // Ignore missing dotenv; the environment may already be populated by Docker or the shell.
  }
}
