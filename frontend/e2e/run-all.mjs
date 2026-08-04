import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdirSync } from 'node:fs';

/**
 * Runs every e2e suite against the production build.
 *
 * Starts `vite preview`, waits for it to answer, runs each suite in turn, and
 * always tears the server down. Exits non-zero if any suite fails, so CI can
 * gate on it.
 */
const PORT = process.env.E2E_PORT ?? '5190';
const BASE = `http://localhost:${PORT}`;
const SUITES = ['e2e/smoke.mjs', 'e2e/tabs.mjs', 'e2e/detail.mjs'];

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

// Screenshots land here; gitignored, uploaded as a CI artifact on failure.
mkdirSync('e2e-output', { recursive: true });

const server = spawn(npx, ['vite', 'preview', '--port', PORT, '--strictPort'], {
  stdio: 'ignore',
  shell: process.platform === 'win32',
});

let failed = 0;

function run(script) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [script], {
      stdio: 'inherit',
      env: { ...process.env, E2E_BASE: BASE },
    });
    child.on('exit', code => resolve(code ?? 1));
  });
}

try {
  // Wait for the preview server to accept requests.
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(BASE);
      if (res.ok) { ready = true; break; }
    } catch {
      // not up yet
    }
    await sleep(500);
  }
  if (!ready) {
    console.error(`preview server did not start on ${BASE}`);
    process.exit(1);
  }

  for (const suite of SUITES) {
    console.log(`\n=== ${suite} ===`);
    const code = await run(suite);
    if (code !== 0) {
      failed++;
      console.error(`${suite} FAILED (exit ${code})`);
    }
  }
} finally {
  server.kill();
}

console.log(`\n${SUITES.length - failed}/${SUITES.length} e2e suites passed`);
process.exit(failed === 0 ? 0 : 1);
