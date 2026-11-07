/**
 * Tests for the visual companion's lib-builder branding.
 *
 * lib-builder has no telemetry: the companion pages never load anything from
 * outside the local server, whatever the environment says.
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const REPO_ROOT = path.join(__dirname, '../..');
const SERVER_PATH = path.join(REPO_ROOT, 'skills/brainstorming/scripts/server.cjs');
const PACKAGE_VERSION = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, '.codex-plugin/plugin.json'), 'utf-8')
).version;
const TOKEN = 'testtoken-branding-0123456789abcdef';
const BRAND_URL = 'https://kalkazu.org';

function cleanup(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true });
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function startServer({ port, dir, env = {}, serverPath = SERVER_PATH }) {
  cleanup(dir);
  return spawn('node', [serverPath], {
    env: {
      ...process.env,
      BRAINSTORM_PORT: String(port),
      BRAINSTORM_DIR: dir,
      BRAINSTORM_TOKEN: TOKEN,
      ...env
    }
  });
}

function waitForServer(server) {
  let stdout = '';
  let stderr = '';

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Server did not start. stderr: ${stderr}`)), 5000);
    server.stdout.on('data', (data) => {
      stdout += data.toString();
      if (stdout.includes('server-started')) {
        clearTimeout(timeout);
        resolve();
      }
    });
    server.stderr.on('data', (data) => { stderr += data.toString(); });
    server.on('error', reject);
  });
}

function fetchHtml(port) {
  return new Promise((resolve, reject) => {
    const headers = { Cookie: `brainstorm-key-${port}=${TOKEN}` };
    http.get(`http://localhost:${port}/`, { headers }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

function writeFragment(dir) {
  const contentDir = path.join(dir, 'content');
  fs.mkdirSync(contentDir, { recursive: true });
  fs.writeFileSync(path.join(contentDir, 'screen.html'), '<h2>Pick a layout</h2>');
}

function createPackagedServerFixture(version) {
  const root = fs.mkdtempSync(path.join('/tmp', 'lib-builder-packaged-server-'));
  const scriptDir = path.join(root, 'skills/brainstorming/scripts');
  fs.cpSync(path.join(REPO_ROOT, 'skills/brainstorming/scripts'), scriptDir, { recursive: true });
  fs.mkdirSync(path.join(root, '.codex-plugin'), { recursive: true });
  fs.writeFileSync(
    path.join(root, '.codex-plugin/plugin.json'),
    JSON.stringify({ name: 'lib-builder', version }, null, 2)
  );
  return {
    root,
    serverPath: path.join(scriptDir, 'server.cjs')
  };
}

async function withServer(options, fn) {
  const server = startServer(options);
  try {
    await waitForServer(server);
    await fn();
  } finally {
    if (server.exitCode === null && server.signalCode === null) {
      server.kill();
      await new Promise(resolve => server.once('exit', resolve));
    }
    await sleep(100);
    cleanup(options.dir);
  }
}

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (e) {
    console.log(`  FAIL: ${name}`);
    console.log(`    ${e.message}`);
    failed++;
  }
}

function assertLocalBranding(html, version = PACKAGE_VERSION) {
  assert(
    /<a href="https:\/\/kalkazu\.org"[^>]*>\s*<img class="brand-logo" src="data:image\/png;base64,[A-Za-z0-9+/=]+" alt=""[^>]*>\s*<span class="brand-name">kalkazu\.org<\/span>/.test(html),
    'brand should show the embedded Kalkazu.org logo followed by "kalkazu.org", linking to kalkazu.org'
  );
  assert(
    html.includes(`<span class="brand-copy">lib-builder v${version}</span>`),
    'brand should still show "lib-builder v<version>"'
  );
  assert.strictEqual((html.match(/class="brand-logo"/g) || []).length, 1, 'the logo should appear once');
  assert(!/prime radiant|primeradiant/i.test(html), 'branding should not mention Prime Radiant');
  assert(html.includes(`href="${BRAND_URL}"`), 'brand should link to kalkazu.org');
}

function assertLogoStyles(html) {
  assert(/\.brand-logo\s*\{[^}]*height:\s*1\.7em/i.test(html), 'logo should sit a little above text height');
  assert(/\.brand-logo\s*\{[^}]*flex-shrink:\s*0/i.test(html), 'logo should not be squeezed by the status column');
  assert(/\.brand-name\s*\{[^}]*font-weight:\s*600/i.test(html), 'kalkazu.org should stand out from the version text');
}

function assertNoRemoteResources(html) {
  assert(
    !/\s(src|srcset|poster|data)\s*=\s*["']?(https?:)?\/\//i.test(html),
    'page must not load any image, script or media from another site'
  );
  assert(
    !/<link\b[^>]*href\s*=\s*["']?(https?:)?\/\//i.test(html),
    'page must not load stylesheets or fonts from another site'
  );
  assert(!/url\(\s*["']?(https?:)?\/\//i.test(html), 'page CSS must not reference another site');
}

function assertBrandRowLayout(html) {
  assert(
    /\.brand a\s*\{[^}]*max-width:\s*100%/i.test(html),
    'brand link should be constrained so it cannot overlap the status column'
  );
  assert(
    /\.brand\s*\{[^}]*overflow:\s*hidden/i.test(html),
    'brand wrapper should clip before it reaches the status column'
  );
  assert(
    /\.brand-copy\s*\{[^}]*min-width:\s*0/i.test(html),
    'version text should be allowed to shrink inside the brand row'
  );
}

function assertFramedScreenUsesBrandHeader(html) {
  const brandCount = (html.match(/<div class="brand">/g) || []).length;
  assert.strictEqual(brandCount, 1, 'framed screens should render the branding only in the header');
  assert(!html.includes('<div class="indicator-bar">'), 'framed screens should not render footer chrome');
  assert(
    /<div class="header">[\s\S]*<div class="brand">[\s\S]*<div class="status">Connecting…<\/div>/.test(html),
    'header should contain branding and connection status'
  );
  assert(!html.includes('id="indicator-text"'), 'header should not render the selection indicator text');
  assert(!html.includes('Click an option above'), 'header should not render the selection instruction');
}

function assertHeaderAvoidsNarrowOverlap(html) {
  assert(
    /grid-template-columns:\s*minmax\(0,\s*1fr\)\s*auto/i.test(html),
    'header should allocate shrinkable space to branding before the status column'
  );
  assert(
    /\.header \.status\s*\{[^}]*grid-column:\s*2/i.test(html),
    'status should live in the final fixed-width grid column'
  );
  assert(
    /\.header \.brand\s*\{[^}]*width:\s*100%/i.test(html),
    'header brand should fill its grid track so overflow clipping prevents overlap'
  );
}

async function main() {
  console.log('\n--- Visual Companion Branding ---');

  await test('framed screens show local text branding and load nothing remote', async () => {
    const port = 3451;
    const dir = '/tmp/brainstorm-branding-default';
    await withServer({ port, dir }, async () => {
      writeFragment(dir);
      await sleep(300);
      const html = await fetchHtml(port);
      assertLocalBranding(html);
      assertNoRemoteResources(html);
      assertBrandRowLayout(html);
      assertLogoStyles(html);
      assertFramedScreenUsesBrandHeader(html);
      assertHeaderAvoidsNarrowOverlap(html);
    });
  });

  await test('waiting screen shows local text branding and loads nothing remote', async () => {
    const port = 3452;
    const dir = '/tmp/brainstorm-branding-waiting';
    await withServer({ port, dir }, async () => {
      const html = await fetchHtml(port);
      assert(html.includes('Waiting for the agent'), 'waiting page should still render');
      assertLocalBranding(html);
      assertNoRemoteResources(html);
      assertBrandRowLayout(html);
      assertLogoStyles(html);
    });
  });

  await test('packaged Codex plugin reads version from .codex-plugin manifest', async () => {
    const port = 3457;
    const dir = '/tmp/brainstorm-branding-packaged-codex';
    const packagedVersion = '7.8.9';
    const fixture = createPackagedServerFixture(packagedVersion);

    try {
      await withServer({ port, dir, serverPath: fixture.serverPath }, async () => {
        writeFragment(dir);
        await sleep(300);
        const html = await fetchHtml(port);
        assertLocalBranding(html, packagedVersion);
        assert(!html.includes('lib-builder vunknown'), 'packaged plugin should not fall back to unknown version');
      });
    } finally {
      cleanup(fixture.root);
    }
  });

  await test('the old telemetry opt-in variables are ignored', async () => {
    const port = 3458;
    const dir = '/tmp/brainstorm-branding-old-optin';
    const env = { LIB_BUILDER_ENABLE_TELEMETRY: '1', SUPERPOWERS_ENABLE_TELEMETRY: '1' };
    await withServer({ port, dir, env }, async () => {
      writeFragment(dir);
      await sleep(300);
      const html = await fetchHtml(port);
      assertLocalBranding(html);
      assertNoRemoteResources(html);
    });
  });

  await test('the old telemetry opt-in is ignored on the waiting screen too', async () => {
    const port = 3459;
    const dir = '/tmp/brainstorm-branding-old-optin-waiting';
    await withServer({ port, dir, env: { LIB_BUILDER_ENABLE_TELEMETRY: 'true' } }, async () => {
      const html = await fetchHtml(port);
      assertLocalBranding(html);
      assertNoRemoteResources(html);
    });
  });

  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
