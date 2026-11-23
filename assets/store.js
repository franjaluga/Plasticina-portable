(function () {
  'use strict';

  const STORAGE_KEY = 'plasticina_desktop_store_v1';
  const COLLECTIONS = ['owners', 'accounts', 'entities', 'documentTypes', 'documents', 'journals', 'journalEntries', 'templates', 'templateItems'];
  const ID_KEYS = {
    owners: 'owners',
    accounts: 'accounts',
    entities: 'entities',
    documentTypes: 'documentTypes',
    documents: 'documents',
    journals: 'journals',
    journalEntries: 'journalEntries',
    templates: 'templates',
    templateItems: 'templateItems',
    vc_documents: 'documents',
    document_types: 'documentTypes',
    journal_entries: 'journalEntries',
    account_templates: 'templates',
    account_template_items: 'templateItems'
  };
  const AMOUNT_FIELDS = ['net', 'exempt', 'vat_rec', 'vat_no_rec', 'plus_oth_tax', 'minus_oth_tax', 'total'];

  let state = null;
  let memoryStorage = null;

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

  function readStorage() {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      return value === null ? memoryStorage : value;
    } catch (error) {
      return memoryStorage;
    }
  }

  function writeStorage(value) {
    memoryStorage = value;
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
      return false;
    }
    return true;
  }

  function removeStorage() {
    memoryStorage = null;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      return false;
    }
    return true;
  }

  function seedAccounts() {
    const seeds = window.SEED_ACCOUNTS || [];
    return seeds.map(function (item, index) {
      return {
        id: index + 1,
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

  function typeOf(document) {
    return String(document && document.type_vc !== undefined ? document.type_vc : '').trim().toUpperCase();
  }

  function isSaleDocument(document) {
    const type = typeOf(document);
    return type === 'V' || type === 'VENTA';
  }

  function rawOwner(id) {
    return state.owners.find(function (item) { return Number(item.id) === Number(id); }) || null;
  }

  function rawAccount(id) {
    return state.accounts.find(function (item) { return Number(item.id) === Number(id); }) || null;
  }

  function rawAccountByCode(code, ownerId) {
    return state.accounts.find(function (item) {
      if (String(item.code) !== String(code)) return false;
      return ownerId === undefined || ownerId === null || Number(item.owner_id) === Number(ownerId);
    }) || null;
  }

  function rawDocument(id) {
    return state.documents.find(function (item) { return Number(item.id) === Number(id); }) || null;
  }

  function rawJournal(id) {
    return state.journals.find(function (item) { return Number(item.id) === Number(id); }) || null;
  }

  function rawDocumentType(doctype) {
    return state.documentTypes.find(function (item) { return Number(item.doctype) === Number(doctype); }) || null;
  }

  function activeOwnerRaw() {
    const selected = rawOwner(state.settings.activeOwnerId);
    if (selected && selected.is_active) return selected;
    return state.owners.find(function (item) { return item.is_active === true || Number(item.is_active) === 1; }) || null;
  }

  function nextEntryNumber(ownerId, year) {
    let last = 0;
    state.journals.forEach(function (journal) {
      if (Number(journal.owner_id) !== Number(ownerId)) return;
      if (Number(journal.year) !== Number(year)) return;
      const value = num(journal.entry_number);
      if (value > last) last = value;
    });
    return last + 1;
  }

  function hydrateDocument(raw, withJournal) {
    if (!raw) return null;
    const document = clone(raw);
    const entity = state.entities.find(function (item) { return Number(item.id) === Number(raw.entity_id); });
    document.entity = entity ? clone(entity) : null;
    const documentType = rawDocumentType(raw.document_type_id);
    document.documentType = documentType ? clone(documentType) : null;
    AMOUNT_FIELDS.forEach(function (field) { document[field] = num(document[field]); });
    if (withJournal !== false) {
      let journal = null;
      state.journals.forEach(function (item) {
        if (Number(item.vc_document_id) !== Number(raw.id)) return;
        if (!journal || Number(item.id) > Number(journal.id)) journal = item;
      });
      document.journal = journal ? hydrateJournal(journal, false) : null;
    }
    return document;
  }

  function hydrateJournal(raw, withDocument) {
    if (!raw) return null;
    const journal = clone(raw);
    const entries = state.journalEntries
      .filter(function (item) { return Number(item.journal_id) === Number(raw.id); })
      .sort(function (a, b) { return Number(a.id) - Number(b.id); })
      .map(function (item) {
        const entry = clone(item);
        entry.account = clone(rawAccountByCode(entry.account_code));
        entry.debit = num(entry.debit);
        entry.credit = num(entry.credit);
        if (entry.component_name === undefined || entry.component_name === null) entry.component_name = 'manual';
        return entry;
      });
    journal.entries = entries;
    const owner = rawOwner(raw.owner_id);
    journal.owner = owner ? clone(owner) : null;
    journal.document = null;
    journal.paidDocument = null;
    if (withDocument !== false) {
      if (raw.vc_document_id) journal.document = hydrateDocument(rawDocument(raw.vc_document_id), false);
      if (raw.ref_doc_payed) journal.paidDocument = hydrateDocument(rawDocument(raw.ref_doc_payed), false);
    }
    journal.is_balanced = Boolean(journal.is_balanced);
    journal.total_debit = num(journal.total_debit);
    journal.total_credit = num(journal.total_credit);
    journal.entry_number = num(journal.entry_number);
    return journal;
  }

  function normalizeEntries(entries) {
    const formatted = [];
    let debitTotal = 0;
    let creditTotal = 0;
    (Array.isArray(entries) ? entries : []).forEach(function (entry) {
      const debit = num(entry && entry.debit);
      const credit = num(entry && entry.credit);
      if (debit <= 0 && credit <= 0) return;
      debitTotal += debit;
      creditTotal += credit;
      formatted.push({
        account_code: entry && entry.account_code !== undefined && entry.account_code !== null ? String(entry.account_code) : '',
        component_name: 'manual',
        debit: debit,
        credit: credit
      });
    });
    if (round2(debitTotal) !== round2(creditTotal)) {
      throw new Error('El asiento contable no está cuadrado. Total Debe: ' + debitTotal + ', Total Haber: ' + creditTotal);
    }
    return [formatted, round2(debitTotal), round2(creditTotal)];
  }

  function insertJournal(data) {
    const journal = {
      id: nextId('journals'),
      vc_document_id: data.vc_document_id === undefined || data.vc_document_id === null ? null : Number(data.vc_document_id),
      ref_doc_payed: data.ref_doc_payed === undefined || data.ref_doc_payed === null ? null : Number(data.ref_doc_payed),
      owner_id: Number(data.owner_id),
      year: Number(data.year),
      entry_number: Number(data.entry_number),
      date: String(data.date || ''),
      description: String(data.description || ''),
      total_debit: num(data.total_debit),
      total_credit: num(data.total_credit),
      is_balanced: true
    };
    state.journals.push(journal);
    return journal;
  }

  function insertEntries(journalId, entries) {
    entries.forEach(function (entry) {
      state.journalEntries.push({
        id: nextId('journalEntries'),
        journal_id: Number(journalId),
        account_code: String(entry.account_code || ''),
        component_name: entry.component_name === undefined || entry.component_name === null ? 'manual' : String(entry.component_name),
        debit: num(entry.debit),
        credit: num(entry.credit)
      });
    });
  }

  function validationMessage(errors) {
    for (const field of Object.keys(errors)) {
      if (Array.isArray(errors[field]) && errors[field].length > 0) return errors[field][0];
    }
    return 'Datos inválidos.';
  }

  function save() {
    return writeStorage(JSON.stringify(state));
  }

  function load() {
    const stored = readStorage();
    if (!stored) {
      state = freshState();
      save();
      return clone(state);
    }
    try {
      state = normalizeState(JSON.parse(stored));
    } catch (error) {
      state = freshState();
      save();
    }
    return clone(state);
  }

  function reset() {
    removeStorage();
    state = freshState();
    save();
    return clone(state);
  }

  function replaceState(raw) {
    state = normalizeState(raw);
    save();
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

  function transaction(fn) {
    if (typeof fn !== 'function') throw new Error('Transacción inválida.');
    const snapshot = JSON.stringify(state);
    try {
      const result = fn();
      save();
      return result;
    } catch (error) {
      state = JSON.parse(snapshot);
      save();
      throw error;
    }
  }

  function nextId(key) {
    const collection = ID_KEYS[key];
    if (!collection || !COLLECTIONS.includes(collection)) throw new Error('Colección desconocida: ' + String(key));
    let max = 0;
    state[collection].forEach(function (item) {
      const value = num(item.id);
      if (value > max) max = value;
    });
    return max + 1;
  }

  function workingYear() {
    return Number(state.settings.workingYear);
  }

  function setWorkingYear(year) {
    const value = Number(year);
    if (!Number.isInteger(value) || value < 2000) throw new Error('El año de trabajo no es válido.');
    state.settings.workingYear = value;
    save();
    return value;
  }

  function owners() {
    return clone(state.owners.slice().sort(function (a, b) { return Number(a.id) - Number(b.id); }));
  }

  function owner(id) {
    const item = rawOwner(id);
    return item ? clone(item) : null;
  }

  function activeOwner() {
    const item = activeOwnerRaw();
    return item ? clone(item) : null;
  }

  function setActiveOwner(id) {
    const item = rawOwner(id);
    if (!item) throw new Error('Owner no encontrado.');
    return transaction(function () {
      state.owners.forEach(function (candidate) { candidate.is_active = Number(candidate.id) === Number(item.id); });
      state.settings.activeOwnerId = Number(item.id);
      return clone(item);
    });
  }

  function accounts(ownerId) {
    return clone(state.accounts
      .filter(function (item) { return Number(item.owner_id) === Number(ownerId); })
      .sort(function (a, b) { return String(a.code).localeCompare(String(b.code), 'en'); }));
  }

  function activeOwnerAccounts() {
    const ownerRecord = activeOwnerRaw();
    if (!ownerRecord) return [];
    const seen = {};
    const result = [];
    accounts(ownerRecord.id).forEach(function (item) {
      if (seen[item.code]) return;
      seen[item.code] = true;
      result.push(item);
    });
    return result;
  }

  function account(id) {
    const item = rawAccount(id);
    return item ? clone(item) : null;
  }

  function accountByCode(ownerId, code) {
    const item = rawAccountByCode(code, ownerId);
    return item ? clone(item) : null;
  }

  function templates() {
    return clone(state.templates
      .slice()
      .sort(function (a, b) { return Number(a.id) - Number(b.id); })
      .map(function (item) {
        const copy = clone(item);
        copy.items_count = state.templateItems.filter(function (child) {
          return Number(child.account_template_id) === Number(item.id);
        }).length;
        return copy;
      }));
  }

  function template(id) {
    const item = state.templates.find(function (candidate) {
      return Number(candidate.id) === Number(id) || String(candidate.slug) === String(id);
    });
    return item ? clone(item) : null;
  }

  function templateItems(templateId) {
    return clone(state.templateItems
      .filter(function (item) { return Number(item.account_template_id) === Number(templateId); })
      .sort(function (a, b) { return Number(a.id) - Number(b.id); }));
  }

  function documentTypes() {
    return clone(state.documentTypes.slice().sort(function (a, b) { return Number(a.doctype) - Number(b.doctype); }));
  }

  function entityByRut(rut) {
    const item = state.entities.find(function (candidate) { return String(candidate.rut) === String(rut); });
    return item ? clone(item) : null;
  }

  function documentTypeByDoctype(doctype) {
    const item = rawDocumentType(doctype);
    return item ? clone(item) : null;
  }

  function documents(options) {
    const opts = options || {};
    const ownerId = opts.owner_id !== undefined ? Number(opts.owner_id) : null;
    const year = opts.year_register !== undefined ? Number(opts.year_register) : (opts.year !== undefined ? Number(opts.year) : null);
    const month = opts.month_register !== undefined ? Number(opts.month_register) : (opts.month !== undefined ? Number(opts.month) : null);
    const typeVc = opts.type_vc !== undefined ? opts.type_vc : opts.typeVc;
    let rows = state.documents.filter(function (item) {
      if (ownerId !== null && Number(item.owner_id) !== ownerId) return false;
      if (year !== null && Number(item.year_register) !== year) return false;
      if (month !== null && Number(item.month_register) !== month) return false;
      if (typeVc !== undefined && typeVc !== null && typeOf(item) !== String(typeVc).trim().toUpperCase()) return false;
      if (opts.entity_id !== undefined && Number(item.entity_id) !== Number(opts.entity_id)) return false;
      if (opts.document_type_id !== undefined && Number(item.document_type_id) !== Number(opts.document_type_id)) return false;
      if (opts.folio !== undefined && Number(item.folio) !== Number(opts.folio)) return false;
      if (opts.rut !== undefined && !like(entityRut(item), opts.rut)) return false;
      if (opts.date !== undefined && String(item.date) !== String(opts.date)) return false;
      if (opts.date_from !== undefined && String(item.date) < String(opts.date_from)) return false;
      if (opts.date_to !== undefined && String(item.date) > String(opts.date_to)) return false;
      if (opts.pending && state.journals.some(function (journal) { return Number(journal.vc_document_id) === Number(item.id); })) return false;
      return true;
    });
    const direction = opts.order === 'desc' ? -1 : 1;
    rows.sort(function (a, b) {
      const left = [Number(a.month_register), String(a.date), Number(a.folio), Number(a.id)];
      const right = [Number(b.month_register), String(b.date), Number(b.folio), Number(b.id)];
      for (let i = 0; i < left.length; i++) {
        if (left[i] < right[i]) return -1 * direction;
        if (left[i] > right[i]) return 1 * direction;
      }
      return 0;
    });
    return rows.map(function (item) { return hydrateDocument(item, opts.withJournal !== false); });
  }

  function entityRut(document) {
    const entity = state.entities.find(function (item) { return Number(item.id) === Number(document.entity_id); });
    return entity ? entity.rut : '';
  }

  function document(id) {
    return hydrateDocument(rawDocument(id), true);
  }

  function hydrateDocumentRaw(raw, withJournal) {
    return hydrateDocument(raw, withJournal);
  }

  function hydrateJournalRaw(raw, withDocument) {
    return hydrateJournal(raw, withDocument);
  }

  function entries(journalId) {
    return state.journalEntries
      .filter(function (item) { return Number(item.journal_id) === Number(journalId); })
      .sort(function (a, b) { return Number(a.id) - Number(b.id); })
      .map(function (item) {
        const entry = clone(item);
        entry.account = clone(rawAccountByCode(entry.account_code));
        entry.debit = num(entry.debit);
        entry.credit = num(entry.credit);
        if (entry.component_name === undefined || entry.component_name === null) entry.component_name = 'manual';
        return entry;
      });
  }

  function journals(options) {
    const opts = options || {};
    let rows = state.journals.filter(function (item) {
      if (opts.owner_id !== undefined && Number(item.owner_id) !== Number(opts.owner_id)) return false;
      if (opts.year !== undefined && Number(item.year) !== Number(opts.year)) return false;
      if (opts.date_from !== undefined && opts.date_to !== undefined && (String(item.date) < String(opts.date_from) || String(item.date) > String(opts.date_to))) return false;
      return true;
    });
    const direction = opts.order === 'desc' ? -1 : 1;
    rows.sort(function (a, b) {
      if (String(a.date) < String(b.date)) return -1 * direction;
      if (String(a.date) > String(b.date)) return 1 * direction;
      return (num(a.entry_number) - num(b.entry_number)) * direction;
    });
    return rows.map(function (item) { return hydrateJournal(item, opts.withDocument !== false); });
  }

  function journal(id) {
    return hydrateJournal(rawJournal(id), true);
  }

  function pendingDocuments(filters) {
    const opts = filters || {};
    const ownerRecord = activeOwnerRaw();
    if (!ownerRecord) return [];
    const rows = state.documents.filter(function (item) {
      if (Number(item.owner_id) !== Number(ownerRecord.id)) return false;
      if (Number(item.year_register) !== workingYear()) return false;
      if (state.journals.some(function (journalRecord) { return Number(journalRecord.vc_document_id) === Number(item.id); })) return false;
      if (opts.rut !== undefined && !like(entityRut(item), opts.rut)) return false;
      if (opts.document_type_id !== undefined && Number(item.document_type_id) !== Number(opts.document_type_id)) return false;
      if (opts.date !== undefined && String(item.date) !== String(opts.date)) return false;
      if (opts.folio !== undefined && Number(item.folio) !== Number(opts.folio)) return false;
      return true;
    });
    rows.sort(function (a, b) {
      return Number(a.month_register) - Number(b.month_register) || String(a.date).localeCompare(String(b.date), 'en');
    });
    return rows.map(function (item) { return hydrateDocument(item, true); });
  }

  function queryDocuments(typeVc, month, year) {
    const ownerRecord = activeOwnerRaw();
    if (!ownerRecord) return [];
    const target = String(typeVc === null || typeVc === undefined ? '' : typeVc).trim().toUpperCase();
    return state.documents
      .filter(function (item) {
        return Number(item.owner_id) === Number(ownerRecord.id)
          && typeOf(item) === target
          && Number(item.month_register) === Number(month)
          && Number(item.year_register) === Number(year);
      })
      .sort(function (a, b) { return Number(a.folio) - Number(b.folio); })
      .map(function (item) { return hydrateDocument(item, true); });
  }

  function effectiveJournalDate(journalRecord) {
    if (journalRecord.vc_document_id) {
      const source = rawDocument(journalRecord.vc_document_id);
      if (source) return source.date_centralize || '';
    }
    return journalRecord.date || '';
  }

  function systemJournals(year, filters) {
    const opts = filters || {};
    const ownerRecord = activeOwnerRaw();
    if (!ownerRecord) return [];
    const rows = state.journals.filter(function (item) {
      if (Number(item.owner_id) !== Number(ownerRecord.id)) return false;
      if (Number(item.year) !== Number(year)) return false;
      const source = item.vc_document_id ? rawDocument(item.vc_document_id) : null;
      const date = effectiveJournalDate(item);
      if (opts.entry_from !== undefined && num(item.entry_number) < num(opts.entry_from)) return false;
      if (opts.entry_to !== undefined && num(item.entry_number) > num(opts.entry_to)) return false;
      if (opts.date_from !== undefined && String(date) < String(opts.date_from)) return false;
      if (opts.date_to !== undefined && String(date) > String(opts.date_to)) return false;
      if (opts.folio_from !== undefined && (!source || num(source.folio) < num(opts.folio_from))) return false;
      if (opts.folio_to !== undefined && (!source || num(source.folio) > num(opts.folio_to))) return false;
      if (opts.rut !== undefined && !like(source ? entityRut(source) : '', opts.rut)) return false;
      if (opts.document_type_id !== undefined && (!source || Number(source.document_type_id) !== Number(opts.document_type_id))) return false;
      if (opts.folio_ref !== undefined && !like(source ? source.folio_ref : '', opts.folio_ref)) return false;
      return true;
    });
    rows.sort(function (a, b) {
      return String(a.date).localeCompare(String(b.date), 'en') || num(a.entry_number) - num(b.entry_number);
    });
    return rows.map(function (item) { return hydrateJournal(item, true); });
  }

  function ledger(accountCode, month, year) {
    const ownerRecord = activeOwnerRaw();
    if (!ownerRecord) return [];
    const target = String(accountCode === null || accountCode === undefined ? '' : accountCode).trim();
    const rows = state.journals.filter(function (item) {
      if (Number(item.owner_id) !== Number(ownerRecord.id)) return false;
      const parsed = parseDate(item.date);
      if (!parsed || Number(parsed.slice(0, 4)) !== Number(year)) return false;
      if (Number(parsed.slice(5, 7)) !== Number(month)) return false;
      return state.journalEntries.some(function (entry) {
        return Number(entry.journal_id) === Number(item.id) && String(entry.account_code) === target;
      });
    });
    rows.sort(function (a, b) {
      return String(a.date).localeCompare(String(b.date), 'en') || num(a.entry_number) - num(b.entry_number);
    });
    return rows.map(function (item) { return hydrateJournal(item, true); });
  }

  function taxBalance(year) {
    const ownerRecord = activeOwnerRaw();
    if (!ownerRecord) return [];
    const grouped = {};
    state.journals.forEach(function (journalRecord) {
      if (Number(journalRecord.owner_id) !== Number(ownerRecord.id)) return;
      if (Number(journalRecord.year) !== Number(year)) return;
      state.journalEntries.forEach(function (entry) {
        if (Number(entry.journal_id) !== Number(journalRecord.id)) return;
        const code = String(entry.account_code);
        const linkedAccount = rawAccountByCode(code, journalRecord.owner_id);
        if (!grouped[code]) {
          grouped[code] = {
            code: code,
            name: linkedAccount && linkedAccount.name ? linkedAccount.name : 'Cuenta Sin Nombre',
            category: linkedAccount ? String(linkedAccount.category || '').trim().toLowerCase() : '',
            sum_debit: 0,
            sum_credit: 0
          };
        }
        grouped[code].sum_debit += num(entry.debit);
        grouped[code].sum_credit += num(entry.credit);
      });
    });
    const rows = Object.keys(grouped).map(function (code) {
      const row = grouped[code];
      const difference = row.sum_debit - row.sum_credit;
      const balanceDebit = difference > 0 ? difference : 0;
      const balanceCredit = difference < 0 ? Math.abs(difference) : 0;
      let category = row.category;
      if (category === '') {
        const first = code.slice(0, 1);
        if (first === '1') category = 'activo';
        else if (first === '2') category = 'pasivo';
        else if (first === '3') category = 'patrimonio';
        else if (first === '4') category = 'ganancia';
        else category = 'perdida';
      }
      let activo = 0;
      let pasivo = 0;
      let perdida = 0;
      let ganancia = 0;
      if (category === 'activo') {
        activo = balanceDebit - balanceCredit;
        if (activo < 0) {
          pasivo = Math.abs(activo);
          activo = 0;
        }
      } else if (category === 'pasivo' || category === 'patrimonio') {
        pasivo = balanceCredit - balanceDebit;
        if (pasivo < 0) {
          activo = Math.abs(pasivo);
          pasivo = 0;
        }
      } else if (category === 'ganancia') {
        ganancia = balanceCredit - balanceDebit;
        if (ganancia < 0) {
          perdida = Math.abs(ganancia);
          ganancia = 0;
        }
      } else {
        perdida = balanceDebit - balanceCredit;
        if (perdida < 0) {
          ganancia = Math.abs(perdida);
          perdida = 0;
        }
      }
      return {
        code: row.code,
        name: row.name,
        sum_debit: round2(row.sum_debit),
        sum_credit: round2(row.sum_credit),
        balance_debit: round2(balanceDebit),
        balance_credit: round2(balanceCredit),
        activo: Math.max(0, round2(activo)),
        pasivo: Math.max(0, round2(pasivo)),
        perdida: Math.max(0, round2(perdida)),
        ganancia: Math.max(0, round2(ganancia))
      };
    });
    rows.sort(function (a, b) { return a.code < b.code ? -1 : (a.code > b.code ? 1 : 0); });
    return rows;
  }

  function pendingBalanceDocuments(year) {
    const ownerRecord = activeOwnerRaw();
    if (!ownerRecord) return [];
    const targetYear = year === undefined || year === null ? workingYear() : Number(year);
    const result = [];
    state.documents.forEach(function (item) {
      if (Number(item.owner_id) !== Number(ownerRecord.id)) return;
      if (Number(item.year_register) !== targetYear) return;
      if (!state.journals.some(function (journalRecord) { return Number(journalRecord.vc_document_id) === Number(item.id); })) return;
      const sale = isSaleDocument(item) && typeOf(item) === 'V';
      const account = sale ? '1010401' : '2010201';
      const column = sale ? 'credit' : 'debit';
      let paid = 0;
      state.journals.forEach(function (journalRecord) {
        if (Number(journalRecord.owner_id) !== Number(ownerRecord.id)) return;
        if (Number(journalRecord.ref_doc_payed) !== Number(item.id)) return;
        state.journalEntries.forEach(function (entry) {
          if (Number(entry.journal_id) !== Number(journalRecord.id)) return;
          if (String(entry.account_code) !== account) return;
          paid += num(entry[column]);
        });
      });
      const document = hydrateDocument(item, true);
      document.calculated_paid = round2(paid);
      document.calculated_balance = round2(num(document.total) - paid);
      if (round2(document.calculated_balance) !== 0) result.push(document);
    });
    result.sort(function (a, b) { return Number(a.folio) - Number(b.folio); });
    return result;
  }

  function validateDocument(data) {
    const source = data && typeof data === 'object' ? data : {};
    const rules = [
      { field: 'month_register', required: true, type: 'integer', min: 1, max: 12 },
      { field: 'year_register', required: true, type: 'integer', min: 2000 },
      { field: 'type_vc', required: true, type: 'string', max: 1 },
      { field: 'rut', required: true, type: 'string', max: 10 },
      { field: 'entity_name', required: true, type: 'string', max: 100 },
      { field: 'doctype', required: true, type: 'integer' },
      { field: 'document_type_name', required: true, type: 'string', max: 50 },
      { field: 'folio', required: true, type: 'integer' },
      { field: 'date', required: true, type: 'date' },
      { field: 'rut_ref', nullable: true, type: 'string', max: 10 },
      { field: 'folio_ref', nullable: true, type: 'integer' },
      { field: 'td_ref', nullable: true, type: 'integer', min: 0, max: 99 },
      { field: 'date_centralize', nullable: true, type: 'date' },
      { field: 'net', nullable: true, type: 'numeric' },
      { field: 'exempt', nullable: true, type: 'numeric' },
      { field: 'vat_rec', nullable: true, type: 'numeric' },
      { field: 'vat_no_rec', nullable: true, type: 'numeric' },
      { field: 'plus_oth_tax', nullable: true, type: 'numeric' },
      { field: 'minus_oth_tax', nullable: true, type: 'numeric' },
      { field: 'total', required: true, type: 'numeric' }
    ];
    const errors = {};
    rules.forEach(function (rule) {
      const field = rule.field;
      const value = source[field];
      const empty = value === null || value === undefined || value === '';
      if (empty && rule.nullable) return;
      const messages = [];
      if (rule.required && empty) messages.push('El campo ' + field + ' es obligatorio.');
      if (empty) {
        if (messages.length) errors[field] = messages;
        return;
      }
      if (rule.type === 'integer' && !isIntegerValue(value)) messages.push('El campo ' + field + ' debe ser un número entero.');
      if (rule.type === 'numeric' && !isNumericValue(value)) messages.push('El campo ' + field + ' debe ser numérico.');
      if (rule.type === 'date' && !parseDate(value)) messages.push('El campo ' + field + ' debe ser una fecha válida.');
      if (rule.min !== undefined && isNumericValue(value) && num(value) < rule.min) {
        messages.push('El campo ' + field + ' debe ser mayor o igual a ' + rule.min + '.');
      }
      if (rule.max !== undefined) {
        const tooLong = rule.type === 'string' ? String(value).length > rule.max : (isNumericValue(value) && num(value) > rule.max);
        if (tooLong) messages.push('El campo ' + field + ' no puede superar ' + rule.max + '.');
      }
      if (messages.length) errors[field] = messages;
    });
    return errors;
  }

  function isDocumentBalanced(data) {
    const source = data && typeof data === 'object' ? data : {};
    const sum = num(source.net) + num(source.exempt) + num(source.vat_rec) + num(source.vat_no_rec) + num(source.plus_oth_tax) - num(source.minus_oth_tax);
    return round2(sum) === round2(source.total);
  }

  function createDocument(data) {
    const errors = validateDocument(data);
    if (Object.keys(errors).length > 0) throw new Error(validationMessage(errors));
    if (data.date_centralize !== null && data.date_centralize !== undefined && data.date_centralize !== '') {
      const parsed = parseDate(data.date_centralize);
      const centralizeYear = parsed ? Number(parsed.slice(0, 4)) : Number(String(data.date_centralize).slice(0, 4));
      if (centralizeYear !== workingYear()) {
        throw new Error('El documento no se puede ingresar: la fecha de centralización corresponde al año ' + centralizeYear + ', pero el año de trabajo activo es ' + workingYear() + '.');
      }
    }
    if (!isDocumentBalanced(data)) {
      throw new Error('El documento no está cuadrado: los componentes no suman el total indicado.');
    }
    return transaction(function () {
      let entity = state.entities.find(function (item) { return String(item.rut) === String(data.rut); });
      if (!entity) {
        entity = { id: nextId('entities'), rut: String(data.rut), name: String(data.entity_name) };
        state.entities.push(entity);
      }
      let documentType = rawDocumentType(data.doctype);
      const doctype = documentType ? Number(documentType.doctype) : Number(data.doctype);
      if (!documentType) {
        documentType = { id: nextId('documentTypes'), doctype: doctype, name: String(data.document_type_name) };
        state.documentTypes.push(documentType);
      }
      const duplicate = state.documents.find(function (item) {
        return Number(item.entity_id) === Number(entity.id) && Number(item.document_type_id) === doctype && Number(item.folio) === Number(data.folio);
      });
      if (duplicate) {
        throw new Error('El documento con este RUT, Tipo de Documento y Folio ya se encuentra registrado.');
      }
      const ownerRecord = activeOwnerRaw();
      if (!ownerRecord) throw new Error('No hay un Owner activo seleccionado.');
      const created = {
        id: nextId('documents'),
        month_register: Number(data.month_register),
        year_register: Number(data.year_register),
        type_vc: String(data.type_vc),
        entity_id: Number(entity.id),
        document_type_id: doctype,
        folio: Number(data.folio),
        date: String(data.date),
        rut_ref: nullable(data.rut_ref),
        folio_ref: nullable(data.folio_ref),
        td_ref: nullable(data.td_ref),
        date_centralize: nullable(data.date_centralize),
        net: num(data.net),
        exempt: num(data.exempt),
        vat_rec: num(data.vat_rec),
        vat_no_rec: num(data.vat_no_rec),
        plus_oth_tax: num(data.plus_oth_tax),
        minus_oth_tax: num(data.minus_oth_tax),
        total: num(data.total),
        owner_id: Number(ownerRecord.id)
      };
      state.documents.push(created);
      return hydrateDocument(created, true);
    });
  }

  function parseCsv(text, delimiter) {
    const source = String(text === null || text === undefined ? '' : text).replace(/^\uFEFF/, '');
    const separator = delimiter === undefined || delimiter === null || delimiter === '' ? ',' : String(delimiter).charAt(0);
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    for (let i = 0; i < source.length; i++) {
      const character = source[i];
      if (quoted) {
        if (character === '"') {
          if (source[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            quoted = false;
          }
        } else {
          field += character;
        }
      } else if (character === '"' && field === '') {
        quoted = true;
      } else if (character === separator) {
        row.push(field);
        field = '';
      } else if (character === '\n' || character === '\r') {
        if (character === '\r' && source[i + 1] === '\n') i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += character;
      }
    }
    if (quoted) throw new Error('CSV inválido: comilla sin cerrar.');
    if (field !== '' || row.length > 0) {
      row.push(field);
      rows.push(row);
    }
    return rows;
  }

  function importCsv(text) {
    return transaction(function () {
      const rows = parseCsv(text, ',');
      let headers = null;
      let processed = 0;
      const errors = [];
      for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        const line = index + 1;
        if (headers === null) {
          headers = row.map(function (header) { return String(header).trim(); });
          continue;
        }
        if (row.every(function (value) { return String(value).trim() === ''; })) continue;
        if (headers.length !== row.length) {
          errors.push('Línea ' + line + ': Las columnas no coinciden con los encabezados.');
          continue;
        }
        const data = {};
        headers.forEach(function (header, position) { data[header] = row[position]; });
        ['date', 'date_centralize'].forEach(function (field) {
          if (data[field] !== undefined && data[field] !== null && String(data[field]).trim() !== '') {
            const parsed = parseDate(String(data[field]).trim());
            data[field] = parsed || data[field];
          }
        });
        if (data.td_ref !== undefined && data.td_ref !== null && String(data.td_ref).trim() !== '') {
          data.td_ref = String(data.td_ref).trim().slice(0, 2);
        }
        ['rut_ref', 'folio_ref', 'net', 'exempt', 'vat_rec', 'vat_no_rec', 'plus_oth_tax', 'minus_oth_tax'].forEach(function (field) {
          if (data[field] !== undefined && String(data[field]).trim() === '') data[field] = null;
        });
        const validation = validateDocument(data);
        const messages = [];
        Object.keys(validation).forEach(function (field) {
          validation[field].forEach(function (message) { messages.push(message); });
        });
        if (messages.length > 0) {
          errors.push('Línea ' + line + ': ' + messages.join(', '));
          continue;
        }
        try {
          createDocument(data);
          processed++;
        } catch (error) {
          errors.push('Línea ' + line + ': ' + error.message);
        }
      }
      if (errors.length > 0) throw new Error('Errores en el CSV: ' + errors.join(' | '));
      if (processed === 0) throw new Error('El archivo CSV no contiene filas de datos para procesar.');
      return processed;
    });
  }

  function accountMapping(document, customNetAccount) {
    if (!customNetAccount || String(customNetAccount).trim() === '') {
      throw new Error('No se ha especificado la cuenta contable para el Neto.');
    }
    const sale = isSaleDocument(document);
    return {
      net: { account_code: String(customNetAccount), type: sale ? 'credit' : 'debit' },
      exempt: { account_code: '4010120', type: sale ? 'credit' : 'debit' },
      vat_rec: { account_code: '1010802', type: sale ? 'credit' : 'debit' },
      vat_no_rec: { account_code: '4011021', type: sale ? 'credit' : 'debit' },
      plus_oth_tax: { account_code: '1010804', type: sale ? 'credit' : 'debit' },
      minus_oth_tax: { account_code: '1010804', type: sale ? 'debit' : 'credit' },
      total: { account_code: sale ? '1010401' : '2010201', type: sale ? 'debit' : 'credit' }
    };
  }

  function registerDocumentJournal(documentId, customNetAccount, glosa) {
    const source = rawDocument(documentId);
    if (!source) throw new Error('Doc ID ' + documentId + ': No encontrado.');
    if (state.journals.some(function (item) { return Number(item.vc_document_id) === Number(source.id); })) {
      throw new Error('El documento con ID ' + documentId + ' ya ha sido contabilizado previamente.');
    }
    const ownerId = Number(source.owner_id);
    if (!ownerId) throw new Error('El documento no tiene un Owner asociado, no se puede generar el asiento contable.');
    const centralizeDate = source.date_centralize || source.date;
    const parsedDate = parseDate(centralizeDate);
    const year = parsedDate ? Number(parsedDate.slice(0, 4)) : Number(String(centralizeDate).slice(0, 4));
    const mapping = accountMapping(source, customNetAccount);
    const components = ['net', 'exempt', 'vat_rec', 'vat_no_rec', 'plus_oth_tax', 'minus_oth_tax', 'total'];
    return transaction(function () {
      const built = [];
      let totalDebit = 0;
      let totalCredit = 0;
      components.forEach(function (component) {
        const amount = num(source[component]);
        if (amount === 0 || !mapping[component]) return;
        const debit = mapping[component].type === 'debit' ? Math.abs(amount) : 0;
        const credit = mapping[component].type === 'credit' ? Math.abs(amount) : 0;
        totalDebit += debit;
        totalCredit += credit;
        built.push({
          account_code: mapping[component].account_code,
          component_name: component,
          debit: debit,
          credit: credit
        });
      });
      if (round2(totalDebit) !== round2(totalCredit)) {
        throw new Error('El asiento contable no está cuadrado. Total Debe: ' + totalDebit + ', Total Haber: ' + totalCredit);
      }
      const journalRecord = insertJournal({
        vc_document_id: source.id,
        owner_id: ownerId,
        year: year,
        entry_number: nextEntryNumber(ownerId, year),
        date: centralizeDate,
        description: glosa ? String(glosa) : ('Contabilización documento folio ' + source.folio),
        total_debit: round2(totalDebit),
        total_credit: round2(totalCredit)
      });
      insertEntries(journalRecord.id, built);
      return Number(journalRecord.id);
    });
  }

  function batchProcess(ids, customNetAccount, glosa) {
    const success = [];
    const errors = [];
    (Array.isArray(ids) ? ids : []).forEach(function (id) {
      try {
        registerDocumentJournal(id, customNetAccount, glosa);
        success.push(Number(id));
      } catch (error) {
        errors.push('Doc ID ' + id + ': ' + error.message);
      }
    });
    return { success_count: success.length, errors: errors };
  }

  function registerManualJournal(year, month, date, description, entries) {
    const ownerRecord = activeOwnerRaw();
    if (!ownerRecord) throw new Error('No hay un Owner activo seleccionado. No se puede generar el asiento.');
    const normalized = normalizeEntries(entries);
    return transaction(function () {
      const journalRecord = insertJournal({
        owner_id: ownerRecord.id,
        year: Number(year),
        entry_number: nextEntryNumber(ownerRecord.id, Number(year)),
        date: String(date || ''),
        description: String(description || ''),
        total_debit: normalized[1],
        total_credit: normalized[2]
      });
      insertEntries(journalRecord.id, normalized[0]);
      return Number(journalRecord.id);
    });
  }

  function updateManualJournal(id, year, month, date, description, entries) {
    const source = rawJournal(id);
    if (!source) throw new Error('Asiento no encontrado.');
    if (source.vc_document_id) throw new Error('Este asiento está asociado a un documento V/C y no puede actualizarse como manual.');
    const normalized = normalizeEntries(entries);
    return transaction(function () {
      source.year = Number(year);
      source.date = String(date || '');
      source.description = String(description || '');
      source.total_debit = normalized[1];
      source.total_credit = normalized[2];
      source.is_balanced = true;
      state.journalEntries = state.journalEntries.filter(function (item) { return Number(item.journal_id) !== Number(source.id); });
      insertEntries(source.id, normalized[0]);
      return hydrateJournal(source, true);
    });
  }

  function updateJournal(id, date, description, entries) {
    const source = rawJournal(id);
    if (!source || !source.vc_document_id) throw new Error('Acción no permitida para este tipo de asiento.');
    const sourceDocument = rawDocument(source.vc_document_id);
    if (!sourceDocument) throw new Error('Documento no encontrado.');
    const sale = isSaleDocument(sourceDocument);
    const originalTotal = num(sourceDocument.total);
    const normalized = normalizeEntries(entries);
    (Array.isArray(entries) ? entries : []).forEach(function (entry) {
      if (!entry || entry.component_name !== 'total') return;
      const entered = sale ? num(entry.debit) : num(entry.credit);
      if (round2(entered) !== round2(originalTotal)) {
        throw new Error('La línea del devengo (Proveedores/Clientes) no puede modificar su monto total (' + originalTotal + ').');
      }
    });
    return transaction(function () {
      source.date = String(date || '');
      source.description = String(description || '');
      source.total_debit = normalized[1];
      source.total_credit = normalized[2];
      source.is_balanced = true;
      state.journalEntries = state.journalEntries.filter(function (item) { return Number(item.journal_id) !== Number(source.id); });
      insertEntries(source.id, normalized[0]);
      return hydrateJournal(source, true);
    });
  }

  function processPayment(documentId, amount, date, bankAccountCode) {
    const ownerRecord = activeOwnerRaw();
    if (!ownerRecord) throw new Error('No hay un Owner activo.');
    const source = rawDocument(documentId);
    if (!source) throw new Error('Documento no encontrado.');
    const sale = typeOf(source) === 'V';
    const clientAccount = sale ? '1010401' : '2010201';
    const paidColumn = sale ? 'credit' : 'debit';
    const parsedDate = parseDate(date);
    const year = parsedDate ? Number(parsedDate.slice(0, 4)) : Number(String(date).slice(0, 4));
    return transaction(function () {
      let paid = 0;
      state.journals.forEach(function (journalRecord) {
        if (Number(journalRecord.owner_id) !== Number(ownerRecord.id)) return;
        if (Number(journalRecord.ref_doc_payed) !== Number(source.id)) return;
        state.journalEntries.forEach(function (entry) {
          if (Number(entry.journal_id) !== Number(journalRecord.id)) return;
          if (String(entry.account_code) !== clientAccount) return;
          paid += num(entry[paidColumn]);
        });
      });
      const balance = round2(num(source.total) - paid);
      if (round2(amount) > balance) {
        throw new Error('El monto ingresado (' + amount + ') excede el saldo pendiente del documento (' + balance + ').');
      }
      const built = sale
        ? [
            { account_code: String(bankAccountCode), debit: num(amount), credit: 0 },
            { account_code: clientAccount, debit: 0, credit: num(amount) }
          ]
        : [
            { account_code: clientAccount, debit: num(amount), credit: 0 },
            { account_code: String(bankAccountCode), debit: 0, credit: num(amount) }
          ];
      const journalRecord = insertJournal({
        ref_doc_payed: source.id,
        owner_id: ownerRecord.id,
        year: year,
        entry_number: nextEntryNumber(ownerRecord.id, year),
        date: String(date || ''),
        description: 'Pago/Cobro documento folio ' + source.folio,
        total_debit: round2(amount),
        total_credit: round2(amount)
      });
      insertEntries(journalRecord.id, built);
      return Number(journalRecord.id);
    });
  }

  function deleteJournal(id, withDocument) {
    const source = rawJournal(id);
    if (!source) throw new Error('Asiento no encontrado.');
    return transaction(function () {
      if (withDocument && source.vc_document_id) {
        const documentId = Number(source.vc_document_id);
        const relatedIds = state.journals
          .filter(function (item) { return Number(item.vc_document_id) === documentId || Number(item.ref_doc_payed) === documentId; })
          .map(function (item) { return Number(item.id); });
        state.journalEntries = state.journalEntries.filter(function (item) { return !relatedIds.includes(Number(item.journal_id)); });
        state.journals = state.journals.filter(function (item) { return !relatedIds.includes(Number(item.id)); });
        state.documents = state.documents.filter(function (item) { return Number(item.id) !== documentId; });
        return true;
      }
      state.journalEntries = state.journalEntries.filter(function (item) { return Number(item.journal_id) !== Number(source.id); });
      state.journals = state.journals.filter(function (item) { return Number(item.id) !== Number(source.id); });
      return true;
    });
  }

  function accountPlan(type) {
    if (type === 'standard_pyme') {
      return (window.SEED_ACCOUNTS || []).map(function (item) {
        return { code: String(item.code), name: String(item.name || ''), category: String(item.category || '') };
      });
    }
    const item = template(type);
    if (!item) throw new Error('Plan de cuentas no encontrado.');
    return templateItems(item.id).map(function (child) {
      return { code: String(child.code), name: String(child.name || ''), category: String(child.category || '') };
    });
  }

  function journalTemplates() {
    return clone(window.SEED_JOURNAL_TEMPLATES || {});
  }

  function journalTemplateEntries(key, amount) {
    const record = (window.SEED_JOURNAL_TEMPLATES || {})[key];
    if (!record) throw new Error('Plantilla de asiento no encontrada.');
    return (record.entries || []).map(function (entry) {
      return {
        account_code: String(entry.account_code || ''),
        debit: entry.debit_type === 'amount' ? num(amount) : num(entry.debit_type),
        credit: entry.credit_type === 'amount' ? num(amount) : num(entry.credit_type)
      };
    });
  }

  load();

  window.Store = {
    get state() { return state; },
    load: load,
    save: save,
    reset: reset,
    replaceState: replaceState,
    exportJson: exportJson,
    importJson: importJson,
    transaction: transaction,
    nextId: nextId,
    clone: clone,
    workingYear: workingYear,
    setWorkingYear: setWorkingYear,
    owners: owners,
    owner: owner,
    activeOwner: activeOwner,
    setActiveOwner: setActiveOwner,
    accounts: accounts,
    activeOwnerAccounts: activeOwnerAccounts,
    account: account,
    accountByCode: accountByCode,
    templates: templates,
    template: template,
    templateItems: templateItems,
    documentTypes: documentTypes,
    entityByRut: entityByRut,
    documentTypeByDoctype: documentTypeByDoctype,
    documents: documents,
    document: document,
    hydrateDocument: hydrateDocumentRaw,
    hydrateJournal: hydrateJournalRaw,
    entries: entries,
    journals: journals,
    journal: journal,
    pendingDocuments: pendingDocuments,
    queryDocuments: queryDocuments,
    systemJournals: systemJournals,
    ledger: ledger,
    taxBalance: taxBalance,
    pendingBalanceDocuments: pendingBalanceDocuments,
    validateDocument: validateDocument,
    isDocumentBalanced: isDocumentBalanced,
    createDocument: createDocument,
    importCsv: importCsv,
    batchProcess: batchProcess,
    registerDocumentJournal: registerDocumentJournal,
    registerManualJournal: registerManualJournal,
    updateManualJournal: updateManualJournal,
    updateJournal: updateJournal,
    processPayment: processPayment,
    deleteJournal: deleteJournal,
    accountPlan: accountPlan,
    parseCsv: parseCsv,
    journalTemplates: journalTemplates,
    journalTemplateEntries: journalTemplateEntries
  };
})();
