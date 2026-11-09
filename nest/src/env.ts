import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function isTrueEnv(name: string): boolean {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().toLowerCase() === 'true';
}

export function loadProjectEnv(): void {
  const envPath = resolve(process.cwd(), '.env');

  if (typeof process.loadEnvFile === 'function') {
    if (existsSync(envPath)) {
      process.loadEnvFile(envPath);
    }
    return;
  }

  try {
    // Fallback for older Node runtimes: keep startup resilient without requiring the app
    // to be launched from a shell that already exported the values.
    require('dotenv').config();
  } catch {
    // Ignore missing dotenv; the environment may already be populated by Docker or the shell.
  }
}
