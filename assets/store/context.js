(function () {
  'use strict';

  const s = window.Plasticina.store.internals;
  const db = window.Plasticina.db;

  const COLLECTIONS = ['owners', 'accounts', 'entities', 'documentTypes', 'documents', 'journals',
    'journalEntries', 'templates', 'templateItems'];
  const AMOUNT_FIELDS = ['net', 'exempt', 'vat_rec', 'vat_no_rec', 'plus_oth_tax', 'minus_oth_tax', 'total'];

  let state = null;

  function clone(value) {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value !== 'object') return value;
    return JSON.parse(JSON.stringify(value));
  }

  function currentYear() {
    return new Date().getFullYear();
  }

  function todayIso() {
    if (window.UI && typeof window.UI.today === 'function') {
      return window.UI.today();
    }
    return new Date().toISOString().slice(0, 10);
  }

  function seedAccounts() {
    return (window.SEED_ACCOUNTS || []).map(function (item) {
      return {
        id: 0,
        owner_id: 1,
        code: String(item.code),
        name: String(item.name || ''),
        category: String(item.category || '')
      };
    });
  }

  function freshState() {
    return {
      owners: [{ id: 1, rut: '55555555-5', name: 'Test', account_plan_type: 'standard_pyme', is_active: true }],
      accounts: seedAccounts(),
      entities: [],
      documentTypes: [],
      documents: [],
      journals: [],
      journalEntries: [],
      templates: [],
      templateItems: [],
      settings: { workingYear: currentYear(), activeOwnerId: 1 }
    };
  }

  function normalizeState(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error('Estado inválido.');
    }
    const fresh = freshState();
    const result = {};
    COLLECTIONS.forEach(function (key) {
      result[key] = Array.isArray(raw[key]) ? clone(raw[key]) : [];
    });
    if (result.owners.length === 0) result.owners = fresh.owners;
    if (result.accounts.length === 0) result.accounts = fresh.accounts;
    const rawSettings = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
    result.settings = {
      workingYear: Number.isFinite(Number(rawSettings.workingYear)) ? Number(rawSettings.workingYear) : fresh.settings.workingYear,
      activeOwnerId: Number.isFinite(Number(rawSettings.activeOwnerId)) ? Number(rawSettings.activeOwnerId) : fresh.settings.activeOwnerId
    };
    return result;
  }

  function num(value) {
    if (value === null || value === undefined || value === '') return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function round2(value) {
    return Math.round((num(value) + Number.EPSILON) * 100) / 100;
  }

  function isIntegerValue(value) {
    if (typeof value === 'number') return Number.isInteger(value);
    if (typeof value !== 'string') return false;
    return /^[+-]?\d+$/.test(value.trim());
  }

  function isNumericValue(value) {
    if (value === null || value === undefined) return false;
    const text = String(value).trim();
    if (text === '') return false;
    return Number.isFinite(Number(text));
  }

  function makeIso(year, month, day) {
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
    if (month < 1 || month > 12 || day < 1) return null;
    if (day > new Date(year, month, 0).getDate()) return null;
    return year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
  }

  function parseDate(value) {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    if (text === '') return null;
    let match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
    if (match) return makeIso(Number(match[1]), Number(match[2]), Number(match[3]));
    match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text);
    if (match) return makeIso(Number(match[3]), Number(match[2]), Number(match[1]));
    const time = Date.parse(text);
    if (!Number.isNaN(time)) {
      const date = new Date(time);
      return makeIso(date.getFullYear(), date.getMonth() + 1, date.getDate());
    }
    return null;
  }

  function like(haystack, needle) {
    if (needle === null || needle === undefined || needle === '') return true;
    return String(haystack === null || haystack === undefined ? '' : haystack).toLowerCase().indexOf(String(needle).toLowerCase()) !== -1;
  }

  function nullable(value) {
    return value === '' || value === null || value === undefined ? null : value;
  }

  function validationMessage(errors) {
    for (const field of Object.keys(errors)) {
      if (Array.isArray(errors[field]) && errors[field].length > 0) return errors[field][0];
    }
    return 'Datos inválidos.';
  }

  function refresh() {
    state = db.repositories.system.hydrate();
    return clone(state);
  }

  function save() {
    return Boolean(refresh());
  }

  function load() {
    state = db.repositories.system.ensureSeed();
    return clone(state);
  }

  function reset() {
    state = db.repositories.system.reset();
    return clone(state);
  }

  function replaceState(raw) {
    state = db.repositories.system.replace(normalizeState(raw));
    return clone(state);
  }

  function exportJson() {
    return JSON.stringify(state, null, 2);
  }

  function importJson(text) {
    let parsed = null;
    try {
      parsed = JSON.parse(String(text));
    } catch (error) {
      throw new Error('JSON inválido.');
    }
    return transaction(function () { return replaceState(parsed); });
  }

  function exportSqlite() {
    return db.exportBytes();
  }

  function importSqlite(bytes) {
    db.replaceBytes(bytes);
    state = db.repositories.system.hydrate();
    return clone(state);
  }

  function transaction(fn) {
    if (typeof fn !== 'function') throw new Error('Transacción inválida.');
    const result = db.transaction(fn);
    refresh();
    return result;
  }

  function nextId(key) {
    return db.repositories.system.nextId(key);
  }

  function workingYear() {
    return Number(state.settings.workingYear);
  }

  function setWorkingYear(year) {
    const value = Number(year);
    if (!Number.isInteger(value) || value < 2000) throw new Error('El año de trabajo no es válido.');
    db.transaction(function () { db.repositories.settings.set('working_year', value); });
    refresh();
    return value;
  }

  Object.defineProperty(s, 'state', {
    get: function () { return state; },
    enumerable: true,
    configurable: true
  });

  Object.assign(s, {
    AMOUNT_FIELDS,
    clone,
    currentYear,
    todayIso,
    seedAccounts,
    freshState,
    normalizeState,
    num,
    round2,
    isIntegerValue,
    isNumericValue,
    makeIso,
    parseDate,
    like,
    nullable,
    validationMessage,
    refresh,
    save,
    load,
    reset,
    replaceState,
    exportJson,
    importJson,
    exportSqlite,
    importSqlite,
    transaction,
    nextId,
    workingYear,
    setWorkingYear,
  });
})();
