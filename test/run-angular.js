const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const candidates = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/chrome'
].filter(Boolean);

const chrome = candidates.find((candidate) => fs.existsSync(candidate));

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  process.exit(result.status === null ? 1 : result.status);
}

if (chrome) {
  process.env.CHROME_BIN = chrome;
  run('npm', ['--prefix', 'angular-shell', 'run', 'test', '--', '--watch=false', '--browsers=ChromeHeadless'], ROOT);
} else {
  console.log('Chrome/Chromium no está disponible; se ejecutan las suites contables con el arnés Node.');
  run(process.execPath, [path.join(ROOT, 'test', 'run.js')], ROOT);
}
