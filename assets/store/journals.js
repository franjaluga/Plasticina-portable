(function () {
  'use strict';

  const s = window.Plasticina.store.internals;
  const db = window.Plasticina.db;
  const {
    activeOwnerRaw,
    hydrateJournal,
    isSaleDocument,
    nextEntryNumber,
    nextId,
    num,
    parseDate,
    rawDocument,
    rawJournal,
    round2,
    transaction,
    typeOf,
  } = s;

  function assertNonNegativeAmount(value) {
    if (num(value) < 0) {
      throw new Error('No se permiten montos negativos en Debe ni en Haber.');
    }
  }

  function normalizeEntries(entries) {
    const formatted = [];
    let debitTotal = 0;
    let creditTotal = 0;
    (Array.isArray(entries) ? entries : []).forEach(function (entry) {
      const debit = num(entry && entry.debit);
      const credit = num(entry && entry.credit);
      assertNonNegativeAmount(debit);
      assertNonNegativeAmount(credit);
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
    assertNonNegativeAmount(data.total_debit);
    assertNonNegativeAmount(data.total_credit);
    return db.repositories.journals.create({
      vc_document_id: data.vc_document_id,
      ref_doc_payed: data.ref_doc_payed,
      owner_id: Number(data.owner_id),
      year: Number(data.year),
      entry_number: Number(data.entry_number),
      date: String(data.date || ''),
      description: String(data.description || ''),
      total_debit: num(data.total_debit),
      total_credit: num(data.total_credit),
      is_balanced: true
    });
  }

  function insertEntries(journalId, entries) {
    (Array.isArray(entries) ? entries : []).forEach(function (entry) {
      assertNonNegativeAmount(entry && entry.debit);
      assertNonNegativeAmount(entry && entry.credit);
    });
    return db.repositories.journalEntries.insertMany(journalId, entries);
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
    if (db.repositories.journals.hasJournal(source.id)) {
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
      const updated = db.repositories.journals.update(source.id, {
        year: Number(year),
        date: String(date || ''),
        description: String(description || ''),
        total_debit: normalized[1],
        total_credit: normalized[2],
        is_balanced: true
      });
      db.repositories.journalEntries.removeByJournal(source.id);
      insertEntries(source.id, normalized[0]);
      return hydrateJournal(updated, true);
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
      const updated = db.repositories.journals.update(source.id, {
        year: Number(source.year),
        date: String(date || ''),
        description: String(description || ''),
        total_debit: normalized[1],
        total_credit: normalized[2],
        is_balanced: true
      });
      db.repositories.journalEntries.removeByJournal(source.id);
      insertEntries(source.id, normalized[0]);
      return hydrateJournal(updated, true);
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
      const paid = db.repositories.journals.paidAmount(ownerRecord.id, source.id, clientAccount, paidColumn);
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
        const relatedIds = s.state.journals
          .filter(function (item) {
            return Number(item.vc_document_id) === documentId || Number(item.ref_doc_payed) === documentId;
          })
          .map(function (item) { return Number(item.id); });
        db.repositories.journalEntries.removeMany(relatedIds);
        db.repositories.journals.removeMany(relatedIds);
        db.repositories.vcDocuments.remove(documentId);
        return true;
      }
      db.repositories.journalEntries.removeByJournal(source.id);
      db.repositories.journals.remove(source.id);
      return true;
    });
  }

  Object.assign(s, {
    normalizeEntries,
    insertJournal,
    insertEntries,
    accountMapping,
    registerDocumentJournal,
    batchProcess,
    registerManualJournal,
    updateManualJournal,
    updateJournal,
    processPayment,
    deleteJournal,
  });
})();
