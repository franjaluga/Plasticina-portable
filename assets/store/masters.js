(function () {
  'use strict';

  const s = window.Plasticina.store.internals;
  const db = window.Plasticina.db;
  const {
    clone,
    num,
    transaction,
  } = s;

  function typeOf(document) {
    return String(document && document.type_vc !== undefined ? document.type_vc : '').trim().toUpperCase();
  }

  function isSaleDocument(document) {
    const type = typeOf(document);
    return type === 'V' || type === 'VENTA';
  }

  function rawOwner(id) {
    return s.state.owners.find(function (item) { return Number(item.id) === Number(id); }) || null;
  }

  function rawAccount(id) {
    return s.state.accounts.find(function (item) { return Number(item.id) === Number(id); }) || null;
  }

  function rawAccountByCode(code, ownerId) {
    return s.state.accounts.find(function (item) {
      if (String(item.code) !== String(code)) return false;
      return ownerId === undefined || ownerId === null || Number(item.owner_id) === Number(ownerId);
    }) || null;
  }

  function rawDocument(id) {
    return s.state.documents.find(function (item) { return Number(item.id) === Number(id); }) || null;
  }

  function rawJournal(id) {
    return s.state.journals.find(function (item) { return Number(item.id) === Number(id); }) || null;
  }

  function rawDocumentType(doctype) {
    return s.state.documentTypes.find(function (item) { return Number(item.doctype) === Number(doctype); }) || null;
  }

  function activeOwnerRaw() {
    const selected = rawOwner(s.state.settings.activeOwnerId);
    if (selected && selected.is_active) return selected;
    return s.state.owners.find(function (item) { return item.is_active === true || Number(item.is_active) === 1; }) || null;
  }

  function ownerStartPeriod(ownerId) {
    const ownerRecord = ownerId === undefined || ownerId === null ? activeOwnerRaw() : rawOwner(ownerId);
    const month = Number(ownerRecord && ownerRecord.start_month);
    const year = Number(ownerRecord && ownerRecord.start_year);
    return {
      month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : s.currentMonth(),
      year: Number.isInteger(year) && year >= 2000 ? year : s.currentYear()
    };
  }

  function maxWorkingYear() {
    return Number(s.todayIso().slice(0, 4)) + 1;
  }

  function workingYearRange(ownerId) {
    const start = ownerStartPeriod(ownerId);
    const max = maxWorkingYear();
    return { min: Math.min(start.year, max), max: max };
  }

  function clampWorkingYear(year, ownerId) {
    const range = workingYearRange(ownerId);
    const numeric = Number(year);
    const value = Number.isFinite(numeric) ? Math.trunc(numeric) : range.min;
    return Math.min(Math.max(value, range.min), range.max);
  }

  function syncWorkingYear(ownerId) {
    const current = Number(s.state.settings.workingYear);
    const target = clampWorkingYear(current, ownerId);
    if (target === current) return current;
    const result = db.transaction(function () { db.repositories.settings.set('working_year', target); });
    if (result && typeof result.then === 'function') {
      return result.then(function () { s.state.settings.workingYear = target; return target; });
    }
    s.state.settings.workingYear = target;
    return target;
  }

  function reportStartIso(ownerId) {
    const start = ownerStartPeriod(ownerId);
    return s.makeIso(start.year, start.month, 1);
  }

  function reportPeriodStatus(year, month, ownerId) {
    const start = ownerStartPeriod(ownerId);
    const numericYear = Number(year);
    const numericMonth = Number(month);
    const result = {
      year: numericYear,
      month: numericMonth,
      startYear: start.year,
      startMonth: start.month
    };
    if (!Number.isInteger(numericYear) || numericYear < 2000 ||
      !Number.isInteger(numericMonth) || numericMonth < 1 || numericMonth > 12) {
      return Object.assign(result, { allowed: false, reason: 'invalid' });
    }
    if ((numericYear * 12) + numericMonth < (start.year * 12) + start.month) {
      return Object.assign(result, { allowed: false, reason: 'before-start' });
    }
    return Object.assign(result, { allowed: true, reason: 'valid' });
  }

  function isPeriodBeforeStart(year, month, ownerId) {
    const status = reportPeriodStatus(year, month, ownerId);
    return !status.allowed;
  }

  function nextEntryNumber(ownerId, year) {
    return db.repositories.journals.nextEntryNumber(ownerId, year);
  }

  function owners() {
    return clone(s.state.owners.slice().sort(function (a, b) { return Number(a.id) - Number(b.id); }));
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
    if (!item) throw new Error('Empresa no encontrada.');
    const result = transaction(function () {
      db.repositories.owners.setActive(item.id);
      db.repositories.settings.set('active_owner_id', item.id);
      return clone(item);
    });
    function finish() {
      const synced = syncWorkingYear(item.id);
      if (synced && typeof synced.then === 'function') {
        return synced.then(function () { return clone(item); });
      }
      return clone(item);
    }
    if (result && typeof result.then === 'function') return result.then(finish);
    return finish();
  }

  function accounts(ownerId) {
    const ownerRecord = ownerId === undefined || ownerId === null ? activeOwnerRaw() : null;
    const target = ownerRecord ? ownerRecord.id : ownerId;
    return clone(s.state.accounts
      .filter(function (item) { return Number(item.owner_id) === Number(target); })
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
    return clone(s.state.templates
      .slice()
      .sort(function (a, b) { return Number(a.id) - Number(b.id); })
      .map(function (item) {
        const copy = clone(item);
        copy.items_count = s.state.templateItems.filter(function (child) {
          return Number(child.account_template_id) === Number(item.id);
        }).length;
        return copy;
      }));
  }

  function template(id) {
    const item = s.state.templates.find(function (candidate) {
      return Number(candidate.id) === Number(id) || String(candidate.slug) === String(id);
    });
    return item ? clone(item) : null;
  }

  function templateItems(templateId) {
    return clone(s.state.templateItems
      .filter(function (item) { return Number(item.account_template_id) === Number(templateId); })
      .sort(function (a, b) { return Number(a.id) - Number(b.id); }));
  }

  function documentTypes() {
    return clone(s.state.documentTypes.slice().sort(function (a, b) { return Number(a.doctype) - Number(b.doctype); }));
  }

  function entityByRut(rut) {
    const item = s.state.entities.find(function (candidate) { return String(candidate.rut) === String(rut); });
    return item ? clone(item) : null;
  }

  function entityRut(document) {
    const entity = s.state.entities.find(function (item) { return Number(item.id) === Number(document.entity_id); });
    return entity ? entity.rut : '';
  }

  function documentTypeByDoctype(doctype) {
    const item = rawDocumentType(doctype);
    return item ? clone(item) : null;
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

  function createOwner(data) {
    if (!data.rut || !data.name || !data.account_plan_type) throw new Error('Complete todos los campos obligatorios.');
    const startMonth = Number(data.start_month);
    const startYear = Number(data.start_year);
    if (!Number.isInteger(startMonth) || startMonth < 1 || startMonth > 12) {
      throw new Error('El mes de inicio de actividades no es válido.');
    }
    if (!Number.isInteger(startYear) || startYear < 2000) {
      throw new Error('El año de inicio de actividades no es válido.');
    }
    if (startYear > maxWorkingYear()) {
      throw new Error('El año de inicio de actividades no puede ser mayor al año actual + 1.');
    }
    if (owners().some(function (owner) { return owner.rut === data.rut; })) throw new Error('Ya existe una empresa con ese RUT.');
    const plan = accountPlan(data.account_plan_type);
    return transaction(function () {
      const owner = db.repositories.owners.create({
        rut: data.rut,
        name: data.name,
        account_plan_type: data.account_plan_type,
        start_month: startMonth,
        start_year: startYear,
        is_active: false
      });
      plan.forEach(function (account) {
        db.repositories.accounts.create({
          owner_id: owner.id,
          code: account.code,
          name: account.name,
          category: account.category
        });
      });
      return clone(owner);
    });
  }

  function updateOwner(id, data) {
    const owner = rawOwner(id);
    if (!owner) throw new Error('Empresa no encontrada.');
    if (owners().some(function (item) { return item.rut === data.rut && Number(item.id) !== Number(owner.id); })) {
      throw new Error('Ya existe una empresa con ese RUT.');
    }
    return transaction(function () {
      return clone(db.repositories.owners.update(owner.id, {
        rut: data.rut,
        name: data.name,
        account_plan_type: owner.account_plan_type
      }));
    });
  }

  function deleteOwner(id) {
    const owner = rawOwner(id);
    if (!owner) throw new Error('Empresa no encontrada.');
    if (db.repositories.owners.hasJournals(owner.id)) {
      throw new Error('No se puede eliminar la empresa porque tiene asientos contables registrados.');
    }
    let activeChanged = false;
    const result = transaction(function () {
      db.repositories.accounts.removeByOwner(owner.id);
      db.repositories.owners.remove(owner.id);
      if (Number(s.state.settings.activeOwnerId) === Number(owner.id)) {
        activeChanged = true;
        const next = db.repositories.owners.list()[0];
        if (next) {
          db.repositories.owners.setActive(next.id);
          db.repositories.settings.set('active_owner_id', next.id);
        } else {
          db.repositories.settings.set('active_owner_id', 0);
        }
      }
      return true;
    });
    function finish() {
      if (!activeChanged) return true;
      const next = db.repositories.owners.active();
      const synced = syncWorkingYear(next ? next.id : undefined);
      if (synced && typeof synced.then === 'function') {
        return synced.then(function () { return true; });
      }
      return true;
    }
    if (result && typeof result.then === 'function') return result.then(finish);
    return finish();
  }

  function createAccount(data) {
    const ownerId = Number(data.owner_id);
    if (!ownerId) throw new Error('Seleccione una empresa.');
    if (!data.code || !data.name) throw new Error('Complete código y nombre de la cuenta.');
    if (db.repositories.accounts.byCode(ownerId, data.code)) throw new Error('Ya existe esa cuenta para esta empresa.');
    return transaction(function () {
      return clone(db.repositories.accounts.create({
        owner_id: ownerId,
        code: data.code,
        name: data.name,
        category: data.category || 'activo'
      }));
    });
  }

  function updateAccount(id, data) {
    const account = rawAccount(id);
    if (!account) throw new Error('Cuenta no encontrada.');
    if (db.repositories.accounts.byCode(account.owner_id, data.code) &&
        Number(db.repositories.accounts.byCode(account.owner_id, data.code).id) !== Number(account.id)) {
      throw new Error('Ya existe esa cuenta para esta empresa.');
    }
    if (String(account.code) !== String(data.code) && db.repositories.accounts.hasMovements(account)) {
      throw new Error('El código de la cuenta tiene movimientos y no puede modificarse.');
    }
    return transaction(function () {
      return clone(db.repositories.accounts.update(account.id, {
        code: data.code,
        name: data.name,
        category: data.category || 'activo'
      }));
    });
  }

  function deleteAccount(id) {
    const account = rawAccount(id);
    if (!account) throw new Error('Cuenta no encontrada.');
    if (db.repositories.accounts.hasMovements(account)) {
      throw new Error('No se puede eliminar la cuenta "' + account.code + ' - ' + account.name + '" porque tiene movimientos registrados.');
    }
    return transaction(function () { return db.repositories.accounts.remove(account.id); });
  }

  function createTemplate(data) {
    if (!data.name) throw new Error('El nombre del plan es obligatorio.');
    if (templates().some(function (template) { return template.name === data.name; })) throw new Error('Ya existe un plan con ese nombre.');
    const slug = String(data.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (templates().some(function (template) { return template.slug === slug; })) throw new Error('Ya existe un plan con ese identificador.');
    const plan = accountPlan('standard_pyme');
    return transaction(function () {
      const template = db.repositories.templates.create({ slug: slug, name: data.name, description: data.description || '' });
      plan.forEach(function (account) {
        db.repositories.templates.insertItem(template.id, account);
      });
      return clone(template);
    });
  }

  function updateTemplate(id, data, items) {
    const template = db.repositories.templates.find(id);
    if (!template) throw new Error('Plan no encontrado.');
    if (templates().some(function (item) { return item.name === data.name && Number(item.id) !== Number(template.id); })) {
      throw new Error('Ya existe un plan con ese nombre.');
    }
    return transaction(function () {
      db.repositories.templates.update(template.id, { name: data.name, description: data.description || '' });
      const keep = [];
      (Array.isArray(items) ? items : []).forEach(function (item) {
        if (String(item._key).indexOf('new_') === 0) {
          const createdItem = db.repositories.templates.insertItem(template.id, item);
          if (createdItem) keep.push(Number(createdItem.id));
          return;
        }
        const current = db.repositories.templates.item(template.id, item._key);
        if (!current) return;
        db.repositories.templates.updateItem(template.id, {
          id: current.id, code: item.code || '', name: item.name || '', category: item.category || 'activo'
        });
        keep.push(Number(current.id));
      });
      const all = db.repositories.templates.items(template.id);
      all.forEach(function (item) {
        if (keep.indexOf(Number(item.id)) === -1) db.repositories.templates.removeItem(template.id, item.id);
      });
      return clone(db.repositories.templates.find(template.id));
    });
  }

  function deleteTemplate(id) {
    return transaction(function () { return db.repositories.templates.remove(id); });
  }

  Object.assign(s, {
    typeOf,
    isSaleDocument,
    rawOwner,
    rawAccount,
    rawAccountByCode,
    rawDocument,
    rawJournal,
    rawDocumentType,
    activeOwnerRaw,
    ownerStartPeriod,
    maxWorkingYear,
    workingYearRange,
    clampWorkingYear,
    syncWorkingYear,
    reportStartIso,
    reportPeriodStatus,
    isPeriodBeforeStart,
    nextEntryNumber,
    owners,
    owner,
    activeOwner,
    setActiveOwner,
    createOwner,
    updateOwner,
    deleteOwner,
    createAccount,
    updateAccount,
    deleteAccount,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    accounts,
    activeOwnerAccounts,
    account,
    accountByCode,
    templates,
    template,
    templateItems,
    documentTypes,
    entityByRut,
    entityRut,
    documentTypeByDoctype,
    accountPlan,
    journalTemplates,
    journalTemplateEntries,
  });
})();
