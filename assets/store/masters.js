(function () {
  'use strict';

  const s = window.Plasticina.store.internals;
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

  function nextEntryNumber(ownerId, year) {
    let last = 0;
    s.state.journals.forEach(function (journal) {
      if (Number(journal.owner_id) !== Number(ownerId)) return;
      if (Number(journal.year) !== Number(year)) return;
      const value = num(journal.entry_number);
      if (value > last) last = value;
    });
    return last + 1;
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
    if (!item) throw new Error('Owner no encontrado.');
    return transaction(function () {
      s.state.owners.forEach(function (candidate) { candidate.is_active = Number(candidate.id) === Number(item.id); });
      s.state.settings.activeOwnerId = Number(item.id);
      return clone(item);
    });
  }

  function accounts(ownerId) {
    return clone(s.state.accounts
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
    nextEntryNumber,
    owners,
    owner,
    activeOwner,
    setActiveOwner,
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
