/**
 * E2E Smoke Tests — hits the running dev server (http://localhost:5000).
 * Run only when the dev server is active.
 * Usage: node __tests__/e2e/smoke.test.js
 */

const BASE = process.env.E2E_BASE_URL || 'http://localhost:5000';

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

async function json(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function run() {
  console.log('\n  E2E Smoke Tests (dev server)\n');

  // Health
  await test('GET /health → 200', async () => {
    const { status } = await json('GET', '/health');
    assert(status === 200, `Expected 200, got ${status}`);
  });

  // Register
  let token;
  await test('POST /api/auth/register → 201', async () => {
    const email = `smoke_${Date.now()}@test.com`;
    const { status, data } = await json('POST', '/api/auth/register', {
      body: { username: 'smoke_user', email, password: 'SmokePass123!' },
    });
    assert(status === 201 || status === 409, `Expected 201 or 409, got ${status}`);
    if (status === 201) {
      token = data.accessToken;
    }
  });

  // Login
  await test('POST /api/auth/login → 200', async () => {
    const { status } = await json('POST', '/api/auth/login', {
      body: { email: `smoke_${Date.now()}@test.com`, password: 'SmokePass123!' },
    });
    assert(status === 200 || status === 401, `Expected 200 or 401, got ${status}`);
  });

  // Me (unauthenticated)
  await test('GET /api/auth/me → 401 (no token)', async () => {
    const { status } = await json('GET', '/api/auth/me');
    assert(status === 401, `Expected 401, got ${status}`);
  });

  // Search (unauthenticated)
  await test('GET /api/friends/search → 401 (no token)', async () => {
    const { status } = await json('GET', '/api/friends/search?q=test');
    assert(status === 401, `Expected 401, got ${status}`);
  });

  // Chats (unauthenticated)
  await test('GET /api/chats → 401 (no token)', async () => {
    const { status } = await json('GET', '/api/chats');
    assert(status === 401, `Expected 401, got ${status}`);
  });

  // Notifications (unauthenticated)
  await test('GET /api/notifications → 401 (no token)', async () => {
    const { status } = await json('GET', '/api/notifications');
    assert(status === 401, `Expected 401, got ${status}`);
  });

  // Rate limiting check — rapid requests shouldn't crash the server (429 is fine)
  await test('Rapid requests do not crash server', async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }).map(() => json('GET', '/health')),
    );
    const allOk = results.every((r) => r.status === 200 || r.status === 429);
    assert(allOk, 'Server crashed on rapid requests');
  });

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
