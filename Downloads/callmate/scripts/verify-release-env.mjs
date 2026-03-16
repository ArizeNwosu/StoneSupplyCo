import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const envPath = path.join(projectRoot, '.env.production');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const text = fs.readFileSync(filePath, 'utf8');
  const entries = {};

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    entries[key] = value;
  }

  return entries;
}

const fileEnv = parseEnvFile(envPath);
const mergedEnv = {
  ...fileEnv,
  ...Object.fromEntries(
    Object.entries(process.env).filter(([key]) =>
      ['VITE_API_URL', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'].includes(key),
    ),
  ),
};

const failures = [];

function readRequired(key) {
  const value = mergedEnv[key]?.trim();
  if (!value) {
    failures.push(`Missing ${key}. Set it in .env.production or the environment.`);
    return '';
  }
  return value;
}

const apiUrl = readRequired('VITE_API_URL');
readRequired('VITE_SUPABASE_URL');
readRequired('VITE_SUPABASE_ANON_KEY');

if (apiUrl) {
  let parsed;
  try {
    parsed = new URL(apiUrl);
  } catch {
    failures.push('VITE_API_URL must be a valid absolute URL.');
  }

  if (parsed) {
    const host = parsed.hostname.toLowerCase();
    if (parsed.protocol !== 'https:') {
      failures.push('VITE_API_URL must use https for release builds.');
    }
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.local') ||
      host.includes('ngrok') ||
      host.includes('ngrok-free.app')
    ) {
      failures.push('VITE_API_URL must point to a stable production host, not localhost or ngrok.');
    }
  }
}

if (failures.length > 0) {
  console.error('Release environment check failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Release environment check passed.');
