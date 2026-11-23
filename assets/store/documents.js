(function () {
  'use strict';

  const s = window.Plasticina.store.internals;
  const {
    activeOwnerRaw,
    clone,
    entityRut,
    isIntegerValue,
    isNumericValue,
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
    const opts = options || {};
    const ownerId = opts.owner_id !== undefined ? Number(opts.owner_id) : null;
    const year = opts.year_register !== undefined ? Number(opts.year_register) : (opts.year !== undefined ? Number(opts.year) : null);
    const month = opts.month_register !== undefined ? Number(opts.month_register) : (opts.month !== undefined ? Number(opts.month) : null);
    const typeVc = opts.type_vc !== undefined ? opts.type_vc : opts.typeVc;
    let rows = s.state.documents.filter(function (item) {
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
      if (opts.pending && s.state.journals.some(function (journal) { return Number(journal.vc_document_id) === Number(item.id); })) return false;
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

  function document(id) {
    return hydrateDocument(rawDocument(id), true);
  }

  function entries(journalId) {
    return s.state.journalEntries
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
    let rows = s.state.journals.filter(function (item) {
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
    const rows = s.state.documents.filter(function (item) {
      if (Number(item.owner_id) !== Number(ownerRecord.id)) return false;
      if (Number(item.year_register) !== workingYear()) return false;
      if (s.state.journals.some(function (journalRecord) { return Number(journalRecord.vc_document_id) === Number(item.id); })) return false;
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
    return s.state.documents
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
    const rows = s.state.journals.filter(function (item) {
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
    const rows = s.state.journals.filter(function (item) {
      if (Number(item.owner_id) !== Number(ownerRecord.id)) return false;
      const parsed = parseDate(item.date);
      if (!parsed || Number(parsed.slice(0, 4)) !== Number(year)) return false;
      if (Number(parsed.slice(5, 7)) !== Number(month)) return false;
      return s.state.journalEntries.some(function (entry) {
        return Number(entry.journal_id) === Number(item.id) && String(entry.account_code) === target;
      });
    });
    rows.sort(function (a, b) {
      return String(a.date).localeCompare(String(b.date), 'en') || num(a.entry_number) - num(b.entry_number);
    });
    return rows.map(function (item) { return hydrateJournal(item, true); });
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
      let entity = s.state.entities.find(function (item) { return String(item.rut) === String(data.rut); });
      if (!entity) {
        entity = { id: nextId('entities'), rut: String(data.rut), name: String(data.entity_name) };
        s.state.entities.push(entity);
      }
      let documentType = rawDocumentType(data.doctype);
      const doctype = documentType ? Number(documentType.doctype) : Number(data.doctype);
      if (!documentType) {
        documentType = { id: nextId('documentTypes'), doctype: doctype, name: String(data.document_type_name) };
        s.state.documentTypes.push(documentType);
      }
      const duplicate = s.state.documents.find(function (item) {
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
      s.state.documents.push(created);
      return hydrateDocument(created, true);
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
