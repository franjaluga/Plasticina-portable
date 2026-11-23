'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const APP_HTML = path.join(ROOT, 'index.html');
const TEST_DIR = path.join(ROOT, 'assets', 'tests');

function scriptSources() {
  const html = fs.readFileSync(APP_HTML, 'utf8');
  const matches = html.matchAll(/<script\s+src="assets\/([^"]+)"><\/script>/g);
  return Array.from(matches, function (match) { return path.join(ROOT, 'assets', match[1]); });
}

function testSources() {
  return ['harness.js', 'suites/core.test.js', 'suites/store.test.js', 'suites/views.test.js',
    'suites/app.test.js', 'suites/actions.test.js'].map(function (name) {
    return path.join(TEST_DIR, name);
  });
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
        return { setAttribute: function () {}, click: function () {}, style: {} };
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
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    URL: Url,
    URLSearchParams: global.URLSearchParams,
    Blob: global.Blob,
    sessionStorage: createStorage(),
    localStorage: createStorage(),
    location: { hash: '#/' },
    history: { replaceState: function () {} },
    scrollTo: function () {},
    confirm: function () { return true; },
    RadioNodeList: function RadioNodeList() {},
    FileReader: function FileReader() {
      this.readAsText = function () {};
    },
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

function main() {
  const context = createContext();
  const files = scriptSources().concat(testSources());
  if (files.length === 0) throw new Error('No se encontraron scripts en index.html.');
  files.forEach(function (filename) { load(context, filename); });

  const results = context.window.PlasticinaTest.run();
  results.forEach(function (result) {
    process.stdout.write((result.ok ? 'ok   ' : 'FAIL ') + result.name + '\n');
    if (!result.ok) process.stdout.write('     ' + result.error + '\n');
  });
  const failed = results.filter(function (result) { return !result.ok; });
  process.stdout.write('\n' + (results.length - failed.length) + '/' + results.length + ' pruebas pasaron\n');
  if (failed.length) process.exitCode = 1;
}

main();
