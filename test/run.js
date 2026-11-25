'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const APP_HTML = path.join(ROOT, 'index.html');
const TEST_DIR = path.join(ROOT, 'assets', 'tests');
const SPECIFIC_SUITES = ['specific-test/owners/owners.test.js', 'specific-test/period/period.test.js'];

function scriptSources() {
  const html = fs.readFileSync(APP_HTML, 'utf8');
  const matches = html.matchAll(/<script\s+src="assets\/([^"]+)"><\/script>/g);
  return Array.from(matches, function (match) { return path.join(ROOT, 'assets', match[1]); });
}

function testSources() {
  return ['harness.js', 'suites/core.test.js', 'suites/store.test.js', 'suites/views.test.js',
    'suites/app.test.js', 'suites/actions.test.js'].map(function (name) {
    return path.join(TEST_DIR, name);
  }).concat(SPECIFIC_SUITES.map(function (name) {
    return path.join(ROOT, name);
  }));
}

function createStorage() {
  const data = new Map();
  return {
    getItem: function (key) { return data.has(key) ? data.get(key) : null; },
    setItem: function (key, value) { data.set(key, String(value)); },
    removeItem: function (key) { data.delete(key); },
    clear: function () { data.clear(); }
  };
}

function createDom() {
  const app = { innerHTML: '', querySelectorAll: function () { return []; } };
  const results = { innerHTML: '' };
  return {
    document: {
      body: { className: '', appendChild: function () {}, removeChild: function () {} },
      getElementById: function (id) {
        if (id === 'app') return app;
        if (id === 'results') return results;
        return null;
      },
      addEventListener: function () {},
      createElement: function () {
        return { setAttribute: function () {}, appendChild: function () {}, removeChild: function () {}, click: function () {}, style: {} };
      },
      querySelectorAll: function () { return []; }
    },
    app: app
  };
}

function createContext() {
  const dom = createDom();
  const Url = function URL(value) { return new global.URL(value); };
  Url.createObjectURL = function () { return 'blob:plasticina-test'; };
  Url.revokeObjectURL = function () {};

  const context = {
    console: console,
    Intl: global.Intl,
    Uint8Array: global.Uint8Array,
    ArrayBuffer: global.ArrayBuffer,
    TextDecoder: global.TextDecoder,
    TextEncoder: global.TextEncoder,
    btoa: function (value) { return Buffer.from(value, 'binary').toString('base64'); },
    atob: function (value) { return Buffer.from(value, 'base64').toString('binary'); },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    URL: Url,
    URLSearchParams: global.URLSearchParams,
    Blob: global.Blob,
    navigator: { userAgent: 'node' },
    sessionStorage: createStorage(),
    localStorage: createStorage(),
    __PLASTICINA_SQLITE_BYTES__: null,
    location: { hash: '#/' },
    history: { replaceState: function () {} },
    scrollTo: function () {},
    confirm: function () { return true; },
    RadioNodeList: function RadioNodeList() {},
    FileReader: function FileReader() {
      this.readAsText = function () {};
      this.readAsArrayBuffer = function () {};
    },
    addEventListener: function () {},
    document: dom.document
  };
  vm.createContext(context);
  context.window = context;
  context.self = context;
  return context;
}

function load(context, filename) {
  const code = fs.readFileSync(filename, 'utf8');
  vm.runInContext(code, context, { filename: filename });
}

async function main() {
  const context = createContext();
  const files = scriptSources().concat(testSources());
  if (files.length === 0) throw new Error('No se encontraron scripts en index.html.');
  files.forEach(function (filename) { load(context, filename); });

  await context.window.Plasticina.db.ready;
  context.window.Store.load();
  const results = await context.window.PlasticinaTest.run();
  results.forEach(function (result) {
    process.stdout.write((result.ok ? 'ok   ' : 'FAIL ') + result.name + '\n');
    if (!result.ok) process.stdout.write('     ' + result.error + '\n');
  });
  const failed = results.filter(function (result) { return !result.ok; });
  process.stdout.write('\n' + (results.length - failed.length) + '/' + results.length + ' pruebas pasaron\n');
  if (failed.length) process.exitCode = 1;
}

main().catch(function (error) {
  process.stderr.write(String(error && error.stack ? error.stack : error) + '\n');
  process.exitCode = 1;
});
