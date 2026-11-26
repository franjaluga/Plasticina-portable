(function () {
  'use strict';

  const s = window.Plasticina.store.internals;
  const db = window.Plasticina.db;
  const {
    AMOUNT_FIELDS,
    activeOwnerRaw,
    clone,
    closingDateFromPeriod,
    closingDateIso,
    entityRut,
    isIntegerValue,
    isNumericValue,
    isPeriodBeforeStart,
    like,
    nextId,
    nullable,
    num,
    parseDate,
    rawAccountByCode,
    rawDocument,
    rawDocumentType,
    rawJournal,
    rawOwner,
    reportStartIso,
    round2,
    transaction,
    typeOf,
    validationMessage,
    workingYear,
  } = s;

  function hydrateDocument(raw, withJournal) {
    if (!raw) return null;
    const document = clone(raw);
    const entity = s.state.entities.find(function (item) { return Number(item.id) === Number(raw.entity_id); });
    document.entity = entity ? clone(entity) : null;
    const documentType = rawDocumentType(raw.document_type_id);
    document.documentType = documentType ? clone(documentType) : null;
    AMOUNT_FIELDS.forEach(function (field) { document[field] = num(document[field]); });
    if (withJournal !== false) {
      let journal = null;
      s.state.journals.forEach(function (item) {
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
    const entries = s.state.journalEntries
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
    const sourceDocument = raw.vc_document_id ? rawDocument(raw.vc_document_id) : null;
    journal.closing_date = sourceDocument
      ? (closingDateFromPeriod(sourceDocument.year_register, sourceDocument.month_register) ||
        closingDateIso(sourceDocument.date_centralize) || closingDateIso(sourceDocument.date) || journal.date)
      : journal.date;
    journal.is_balanced = Boolean(journal.is_balanced);
    journal.total_debit = num(journal.total_debit);
    journal.total_credit = num(journal.total_credit);
    journal.entry_number = num(journal.entry_number);
    return journal;
  }

  function hydrateDocumentRaw(raw, withJournal) {
    return hydrateDocument(raw, withJournal);
  }

  function hydrateJournalRaw(raw, withDocument) {
    return hydrateJournal(raw, withDocument);
  }

  function documents(options) {
    const opts = Object.assign({}, options || {});
    const filters = {
      owner_id: opts.owner_id,
      year_register: opts.year_register !== undefined ? opts.year_register : opts.year,
      month_register: opts.month_register !== undefined ? opts.month_register : opts.month,
      type_vc: opts.type_vc !== undefined ? opts.type_vc : opts.typeVc,
      entity_id: opts.entity_id,
      document_type_id: opts.document_type_id,
      folio: opts.folio,
      rut: opts.rut,
      date: opts.date,
      date_from: opts.date_from,
      date_to: opts.date_to,
      pending: opts.pending,
      order: opts.order
    };
    return db.repositories.vcDocuments.list(filters)
      .map(function (item) { return hydrateDocument(item, opts.withJournal !== false); });
  }

  function document(id) {
    return hydrateDocument(db.repositories.vcDocuments.find(id), true);
  }

  function entries(journalId) {
    return db.repositories.journalEntries.byJournal(journalId).map(function (entry) {
      const hydrated = clone(entry);
      hydrated.account = clone(rawAccountByCode(entry.account_code));
      return hydrated;
    });
  }

  function journals(options) {
    const opts = Object.assign({}, options || {});
    const startDate = reportStartIso(opts.owner_id);
    const requestedFrom = String(opts.date_from || '');
    if (requestedFrom && requestedFrom < startDate) {
      opts.date_from = startDate;
    } else if (!requestedFrom && (opts.year === undefined || Number(opts.year) <= Number(startDate.slice(0, 4)))) {
      opts.date_from = startDate;
    }
    return db.repositories.journals.list(opts)
      .map(function (item) { return hydrateJournal(item, opts.withDocument !== false); });
  }

  function journal(id) {
    return hydrateJournal(rawJournal(id), true);
  }

  function pendingDocuments(filters) {
    const ownerRecord = activeOwnerRaw();
    if (!ownerRecord) return [];
    return db.repositories.vcDocuments.pending(ownerRecord.id, workingYear(), filters || {})
      .map(function (item) { return hydrateDocument(item, true); });
  }

  function queryDocuments(typeVc, month, year) {
    const ownerRecord = activeOwnerRaw();
    if (!ownerRecord) return [];
    if (isPeriodBeforeStart(year, month, ownerRecord.id)) return [];
    const target = String(typeVc === null || typeVc === undefined ? '' : typeVc).trim().toUpperCase();
    return db.repositories.vcDocuments.query(target, month, year, ownerRecord.id)
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
    const ownerRecord = activeOwnerRaw();
    if (!ownerRecord) return [];
    const source = Object.assign({}, filters || {});
    const startDate = reportStartIso(ownerRecord.id);
    const requestedFrom = String(source.date_from || '');
    source.date_from = requestedFrom && requestedFrom > startDate ? requestedFrom : startDate;
    return db.repositories.journals.system(ownerRecord.id, year, source)
      .map(function (item) { return hydrateJournal(item, true); });
  }

  function ledger(accountCode, month, year) {
    const ownerRecord = activeOwnerRaw();
    if (!ownerRecord) return [];
    if (isPeriodBeforeStart(year, month, ownerRecord.id)) return [];
    const target = String(accountCode === null || accountCode === undefined ? '' : accountCode).trim();
    return db.repositories.journals.ledger(ownerRecord.id, year, month, target)
      .map(function (item) { return hydrateJournal(item, true); });
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
      let entity = db.repositories.entities.byRut(String(data.rut));
      if (!entity) {
        entity = db.repositories.entities.create({ rut: String(data.rut), name: String(data.entity_name) });
      }
      let documentType = db.repositories.documentTypes.byDoctype(data.doctype);
      const doctype = documentType ? Number(documentType.doctype) : Number(data.doctype);
      if (!documentType) {
        documentType = db.repositories.documentTypes.create({
          doctype: doctype, name: String(data.document_type_name)
        });
      }
      if (db.repositories.vcDocuments.duplicate(entity.id, doctype, Number(data.folio))) {
        throw new Error('El documento con este RUT, Tipo de Documento y Folio ya se encuentra registrado.');
      }
      const ownerRecord = activeOwnerRaw();
      if (!ownerRecord) throw new Error('No hay una empresa activa seleccionada.');
      const created = db.repositories.vcDocuments.create({
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
      });
      const hydrated = hydrateDocument(created, true);
      hydrated.entity = clone(entity);
      hydrated.documentType = clone(documentType);
      return hydrated;
    });
  }

  Object.assign(s, {
    hydrateDocument,
    hydrateJournal,
    hydrateDocumentRaw,
    hydrateJournalRaw,
    documents,
    document,
    entries,
    journals,
    journal,
    pendingDocuments,
    queryDocuments,
    effectiveJournalDate,
    systemJournals,
    ledger,
    validateDocument,
    isDocumentBalanced,
    createDocument,
  });
})();
