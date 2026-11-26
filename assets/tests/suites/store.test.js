(function () {
  'use strict';

  const T = window.PlasticinaTest;
  const year = new Date().getFullYear();

  function resetWithStart(month, startYear) {
    T.resetStore();
    const owner = Store.createOwner({
      rut: '88888888-8',
      name: 'Empresa Histórica',
      account_plan_type: 'standard_pyme',
      start_month: month,
      start_year: startYear
    });
    Store.setActiveOwner(owner.id);
    return owner;
  }

  function sampleDocument(folio, total) {
    return {
      month_register: 3,
      year_register: year,
      type_vc: 'V',
      rut: '11111111-1',
      entity_name: 'Cliente Prueba',
      doctype: 33,
      document_type_name: 'Factura Electrónica',
      folio: folio,
      date: year + '-03-10',
      net: total / 1.19,
      vat_rec: total - total / 1.19,
      total: total
    };
  }

  T.test('Store siembra owner, plan de cuentas y año activo', function () {
    T.resetStore();
    T.assertEqual(Store.owners().length, 1);
    T.assertEqual(Store.owners()[0].rut, '55555555-5');
    T.assertEqual(Store.activeOwner().name, 'Test');
    T.assertEqual(Store.accounts().length, 161);
    T.assertEqual(Store.workingYear(), year);
    T.assertEqual(Store.activeOwner().start_month, new Date().getMonth() + 1);
    T.assertEqual(Store.activeOwner().start_year, year);
  });

  T.test('Store puede reiniciarse repetidamente sin duplicar el RUT semilla', function () {
    T.resetStore();
    T.resetStore();
    T.assertEqual(Store.owners().length, 1);
    T.assertEqual(Store.owners()[0].id, 1);
    T.assertEqual(Store.owners()[0].rut, '55555555-5');
    T.assertEqual(Store.activeOwner().name, 'Test');
    T.assertEqual(Store.accounts().length, 161);
  });

  T.test('Store valida documentos incompletos y descuadrados', function () {
    T.resetStore();
    T.assertThrows(function () { Store.createDocument({ total: 100 }); }, /obligatorio/);
    const broken = sampleDocument(1, 1190);
    broken.total = 1000;
    T.assertThrows(function () { Store.createDocument(broken); }, /cuadrado/);
  });

  T.test('Store crea documentos y evita duplicados', function () {
    T.resetStore();
    const created = Store.createDocument(sampleDocument(10, 1190));
    T.assertEqual(created.folio, 10);
    T.assertEqual(Store.documents().length, 1);
    T.assertThrows(function () { Store.createDocument(sampleDocument(10, 1190)); }, /ya se encuentra registrado/);
  });

  T.test('Store genera asientos cuadrados desde documentos', function () {
    T.resetStore();
    const document = Store.createDocument(sampleDocument(20, 1190));
    const journalId = Store.registerDocumentJournal(document.id, '4010101', 'Venta de prueba');
    const journal = Store.journal(journalId);
    T.assert(journal, 'El asiento debió crearse');
    T.assertEqual(journal.is_balanced, true);
    T.assertEqual(journal.entries.length, 3);
    T.assertEqual(Store.pendingDocuments().length, 0);
    T.assertThrows(function () { Store.registerDocumentJournal(document.id, '4010101'); }, /contabilizado previamente/);
  });

  T.test('Store calcula balance tributario y saldo por pagar', function () {
    resetWithStart(1, year);
    const document = Store.createDocument(sampleDocument(30, 1190));
    Store.registerDocumentJournal(document.id, '4010101');
    const balance = Store.taxBalance(year);
    T.assert(balance.some(function (row) { return row.code === '1010401'; }), 'Debe existir la cuenta de clientes');
    const pending = Store.pendingBalanceDocuments(year);
    T.assertEqual(pending.length, 1);
    T.assertEqual(pending[0].calculated_balance, 1190);
    Store.processPayment(document.id, 500, year + '-03-20', '1010101');
    T.assertEqual(Store.pendingBalanceDocuments(year)[0].calculated_balance, 690);
  });

  T.test('Store administra owners, cuentas y plantillas en SQLite', function () {
    T.resetStore();
    const owner = Store.createOwner({
      rut: '99999999-9', name: 'Otra Empresa', account_plan_type: 'standard_pyme',
      start_month: 1, start_year: year
    });
    T.assertEqual(Store.owners().length, 2);
    T.assertEqual(Store.accounts(owner.id).length, 161);
    Store.updateOwner(owner.id, { rut: '99999999-9', name: 'Otra Empresa SA' });
    T.assertEqual(Store.owner(owner.id).name, 'Otra Empresa SA');
    const account = Store.createAccount({ owner_id: owner.id, code: '9999999', name: 'Prueba', category: 'activo' });
    Store.updateAccount(account.id, { code: '9999999', name: 'Prueba 2', category: 'activo' });
    T.assertEqual(Store.account(account.id).name, 'Prueba 2');
    Store.deleteAccount(account.id);
    T.assertEqual(Store.account(account.id), null);
    Store.setActiveOwner(owner.id);
    T.assertEqual(Store.activeOwner().id, owner.id);
    const template = Store.createTemplate({ name: 'Plan Prueba', description: 'demo' });
    T.assertEqual(Store.templateItems(template.id).length, 161);
    Store.updateTemplate(template.id, { name: 'Plan Prueba 2', description: 'demo 2' }, []);
    T.assertEqual(Store.template(template.id).name, 'Plan Prueba 2');
    T.assertEqual(Store.templateItems(template.id).length, 0);
    Store.deleteTemplate(template.id);
    T.assertEqual(Store.template(template.id), null);
    Store.deleteOwner(owner.id);
    T.assertEqual(Store.owners().length, 1);
  });

  T.test('Store administra asientos manuales y reportes en SQLite', function () {
    resetWithStart(1, year);
    const entries = [
      { account_code: '1010101', debit: 100, credit: 0, component_name: 'manual' },
      { account_code: '4010101', debit: 0, credit: 100, component_name: 'manual' }
    ];
    const id = Store.registerManualJournal(year, 3, year + '-03-05', 'Asiento manual', entries);
    T.assertEqual(Store.journal(id).entries.length, 2);
    Store.updateManualJournal(id, year, 3, year + '-03-06', 'Asiento editado', entries);
    T.assertEqual(Store.journal(id).description, 'Asiento editado');
    T.assertEqual(Store.ledger('1010101', 3, year).length, 1);
    const doc = Store.createDocument(sampleDocument(50, 1190));
    Store.registerDocumentJournal(doc.id, '4010101');
    T.assertEqual(Store.queryDocuments('V', 3, year).length, 1);
    T.assertEqual(Store.systemJournals(year, {}).length, 2);
    Store.deleteJournal(id, false);
    T.assertEqual(Store.journal(id), null);
  });

  T.test('Store expone el correlativo propuesto por owner y año sin reservarlo', function () {
    resetWithStart(1, year);
    T.assertEqual(Store.nextEntryNumber(1, year), 1);
    const id = Store.registerManualJournal(year, 3, year + '-03-05', 'Asiento manual', [
      { account_code: '1010101', debit: 100, credit: 0, component_name: 'manual' },
      { account_code: '4010101', debit: 0, credit: 100, component_name: 'manual' }
    ]);
    T.assertEqual(Store.journal(id).entry_number, 1);
    T.assertEqual(Store.nextEntryNumber(1, year), 2);
    T.assertEqual(Store.nextEntryNumber(1, year + 1), 1);
  });

  T.test('Escrituras concurrentes recalculan el correlativo bajo lock', async function () {
    resetWithStart(1, year);
    const adapters = window.Plasticina.db.internals.adapters;
    const original = adapters.memory;
    let tail = Promise.resolve();
    adapters.memory = {
      name: 'memory-lock-test',
      available: function () { return true; },
      read: original.read,
      write: original.write,
      withLock: function (callback) {
        const current = tail.then(function () {
          return new Promise(function (resolve) { setTimeout(resolve, 5); });
        }).then(callback);
        tail = current.then(function () {}, function () {});
        return current;
      }
    };
    try {
      await window.Plasticina.db.internals.initialize();
      await Store.load();
      const build = function (amount) {
        return [
          { account_code: '1010101', debit: amount, credit: 0, component_name: 'manual' },
          { account_code: '4010101', debit: 0, credit: amount, component_name: 'manual' }
        ];
      };
      await Promise.all([
        Store.registerManualJournal(year, 3, year + '-03-05', 'Concurrente A', build(10)),
        Store.registerManualJournal(year, 3, year + '-03-06', 'Concurrente B', build(20))
      ]);
      const numbers = Store.journals({ year: year }).map(function (journal) { return Number(journal.entry_number); }).sort(function (a, b) { return a - b; });
      T.assertDeepEqual(numbers, [1, 2]);
    } finally {
      adapters.memory = original;
      await window.Plasticina.db.internals.initialize();
      await Store.load();
    }
  });

  T.test('Store rechaza asientos y pagos con montos negativos', function () {
    resetWithStart(1, year);
    const negative = [
      { account_code: '1010101', debit: -100, credit: 0, component_name: 'manual' },
      { account_code: '4010101', debit: 0, credit: 100, component_name: 'manual' }
    ];
    const valid = [
      { account_code: '1010101', debit: 100, credit: 0, component_name: 'manual' },
      { account_code: '4010101', debit: 0, credit: 100, component_name: 'manual' }
    ];
    T.assertThrows(function () {
      Store.registerManualJournal(year, 3, year + '-03-05', 'Asiento negativo', negative);
    }, /negativos/);
    const id = Store.registerManualJournal(year, 3, year + '-03-05', 'Asiento manual', valid);
    T.assertThrows(function () {
      Store.updateManualJournal(id, year, 3, year + '-03-06', 'Asiento negativo', negative);
    }, /negativos/);
    const doc = Store.createDocument(sampleDocument(60, 1190));
    T.assertThrows(function () {
      Store.processPayment(doc.id, -50, year + '-03-20', '1010101');
    }, /negativos/);
    T.assertEqual(Store.journal(id).entries.every(function (entry) { return entry.debit >= 0 && entry.credit >= 0; }), true);
  });

  T.test('Store rechaza filas que registren Debe y Haber a la vez', function () {
    resetWithStart(1, year);
    const invalid = [
      { account_code: '1010101', debit: 100, credit: 100, component_name: 'manual' },
      { account_code: '4010101', debit: 0, credit: 100, component_name: 'manual' }
    ];
    const valid = [
      { account_code: '1010101', debit: 100, credit: 0, component_name: 'manual' },
      { account_code: '4010101', debit: 0, credit: 100, component_name: 'manual' }
    ];
    T.assertThrows(function () {
      Store.registerManualJournal(year, 3, year + '-03-05', 'Fila inválida', invalid);
    }, /solo Debe o solo Haber/);
    const id = Store.registerManualJournal(year, 3, year + '-03-05', 'Asiento manual', valid);
    T.assertThrows(function () {
      Store.updateManualJournal(id, year, 3, year + '-03-06', 'Fila inválida', invalid);
    }, /solo Debe o solo Haber/);
    const doc = Store.createDocument(sampleDocument(61, 1190));
    const journalId = Store.registerDocumentJournal(doc.id, '4010101');
    const paymentId = Store.processPayment(doc.id, 50, year + '-03-20', '1010101');
    [journalId, paymentId].forEach(function (journal) {
      T.assertEqual(Store.journal(journal).entries.every(function (entry) {
        return Number(entry.debit > 0) + Number(entry.credit > 0) === 1;
      }), true);
    });
  });

  T.test('Store omite filas vacías y exige cuenta en las líneas con monto', function () {
    resetWithStart(1, year);
    const withBlank = [
      { account_code: '', debit: 0, credit: 0, component_name: 'manual' },
      { account_code: '1010101', debit: 50, credit: 0, component_name: 'manual' },
      { account_code: '4010101', debit: 0, credit: 50, component_name: 'manual' }
    ];
    const id = Store.registerManualJournal(year, 3, year + '-03-05', 'Asiento sin fila vacía', withBlank);
    T.assertEqual(Store.journal(id).entries.length, 2);

    const missingAccount = [
      { account_code: '', debit: 50, credit: 0, component_name: 'manual' },
      { account_code: '4010101', debit: 0, credit: 50, component_name: 'manual' }
    ];
    T.assertThrows(function () {
      Store.registerManualJournal(year, 3, year + '-03-06', 'Asiento sin cuenta', missingAccount);
    }, /cuenta contable/);
  });

  T.test('Store.taxBalance filtra desde inicio de año hasta el mes indicado', function () {
    resetWithStart(1, year);
    const filters = { date_from: year + '-01-01', date_to: year + '-09-30' };
    const entries = [
      { account_code: '1010101', debit: 10, credit: 0, component_name: 'manual' },
      { account_code: '4010101', debit: 0, credit: 10, component_name: 'manual' }
    ];

    function debitFor(rows) {
      const row = rows.find(function (item) { return item.code === '1010101'; });
      return row ? row.sum_debit : 0;
    }

    const fullBefore = debitFor(Store.taxBalance(year));
    const filteredBefore = debitFor(Store.taxBalance(year, filters));
    Store.registerManualJournal(year, 1, year + '-01-15', 'Enero', entries);
    Store.registerManualJournal(year, 9, year + '-09-30', 'Septiembre', entries);
    Store.registerManualJournal(year, 10, year + '-10-01', 'Octubre', entries);

    T.assertEqual(debitFor(Store.taxBalance(year)) - fullBefore, 30);
    T.assertEqual(debitFor(Store.taxBalance(year, filters)) - filteredBefore, 20);
    T.resetStore();
  });

  T.test('Store.earliestAccountingDate devuelve la primera fecha contable del owner activo', function () {
    resetWithStart(1, year);
    T.assertEqual(Store.earliestAccountingDate(), null);
    const entries = [
      { account_code: '1010101', debit: 10, credit: 0, component_name: 'manual' },
      { account_code: '4010101', debit: 0, credit: 10, component_name: 'manual' }
    ];
    Store.registerManualJournal(year, 2, year + '-03-15', 'Marzo', entries);
    Store.registerManualJournal(year, 1, year + '-02-01', 'Febrero', entries);
    T.assertEqual(Store.earliestAccountingDate(), year + '-02-01');
    T.resetStore();
  });

  T.test('Store.balancePeriodStatus permite el mes de inicio y bloquea meses anteriores', function () {
    resetWithStart(3, year);
    const entries = [
      { account_code: '1010101', debit: 10, credit: 0, component_name: 'manual' },
      { account_code: '4010101', debit: 0, credit: 10, component_name: 'manual' }
    ];
    Store.registerManualJournal(year, 3, year + '-03-05', 'Marzo', entries);
    const first = Store.balancePeriodStatus(year, 3);
    T.assertEqual(first.allowed, true);
    T.assertEqual(first.reason, 'valid');
    T.assertEqual(first.earliest, year + '-03-05');
    const before = Store.balancePeriodStatus(year, 2);
    T.assertEqual(before.allowed, false);
    T.assertEqual(before.reason, 'before-start');
    const later = Store.balancePeriodStatus(year, 4);
    T.assertEqual(later.allowed, true);
    T.resetStore();
  });

  T.test('Store.balancePeriodStatus normaliza fechas contables no ISO', function () {
    resetWithStart(3, year);
    const entries = [
      { account_code: '1010101', debit: 10, credit: 0, component_name: 'manual' },
      { account_code: '4010101', debit: 0, credit: 10, component_name: 'manual' }
    ];
    Store.registerManualJournal(year, 3, '05-03-' + year, 'Marzo', entries);
    T.assertEqual(Store.earliestAccountingDate(), year + '-03-05');
    const status = Store.balancePeriodStatus(year, 3);
    T.assertEqual(status.allowed, true);
    T.assertEqual(status.earliest, year + '-03-05');
    T.resetStore();
  });

  T.test('Store.balancePeriodStatus bloquea cuando no hay contabilidad', function () {
    resetWithStart(1, year);
    const status = Store.balancePeriodStatus(year, 1);
    T.assertEqual(status.allowed, false);
    T.assertEqual(status.reason, 'no-data');
  });

  T.test('Store.reportPeriodStatus usa el inicio de actividades de cada owner', function () {
    const owner = resetWithStart(6, year);
    T.assertEqual(owner.start_month, 6);
    const before = Store.reportPeriodStatus(year, 5);
    T.assertEqual(before.allowed, false);
    T.assertEqual(before.reason, 'before-start');
    T.assertEqual(before.startMonth, 6);
    T.assertEqual(before.startYear, year);
    const first = Store.reportPeriodStatus(year, 6);
    T.assertEqual(first.allowed, true);
    T.assertEqual(first.reason, 'valid');
    const previousYear = Store.reportPeriodStatus(year - 1, 12);
    T.assertEqual(previousYear.reason, 'before-start');
    T.resetStore();
  });

  T.test('Los reportes no muestran resultados anteriores al inicio de actividades', function () {
    resetWithStart(6, year);
    const entries = [
      { account_code: '1010101', debit: 100, credit: 0, component_name: 'manual' },
      { account_code: '4010101', debit: 0, credit: 100, component_name: 'manual' }
    ];
    Store.registerManualJournal(year, 3, year + '-03-05', 'Marzo', entries);
    const document = Store.createDocument(sampleDocument(70, 1190));
    Store.registerDocumentJournal(document.id, '4010101');
    T.assertEqual(Store.ledger('1010101', 3, year).length, 0);
    T.assertEqual(Store.queryDocuments('V', 3, year).length, 0);
    T.assertEqual(Store.systemJournals(year, { date_from: year + '-01-01' }).length, 0);
    T.assertEqual(Store.taxBalance(year, { date_to: year + '-03-31' }).length, 0);
    T.assertEqual(Store.journals({ year: year, date_from: year + '-01-01' }).length, 0);
    Store.registerManualJournal(year, 6, year + '-06-05', 'Junio', entries);
    T.assertEqual(Store.ledger('1010101', 6, year).length, 1);
    T.resetStore();
  });

  T.test('Store importa documentos por CSV a SQLite', function () {
    T.resetStore();
    const source = sampleDocument(60, 1190);
    const header = 'month_register,year_register,type_vc,rut,entity_name,folio,doctype,document_type_name,date,rut_ref,folio_ref,td_ref,net,exempt,vat_rec,vat_no_rec,plus_oth_tax,minus_oth_tax,total,date_centralize';
    const values = [source.month_register, source.year_register, source.type_vc, source.rut, source.entity_name,
      source.folio, source.doctype, source.document_type_name, source.date, '', '', '', source.net, '',
      source.vat_rec, '', '', '', source.total, ''].join(',');
    T.assertEqual(Store.importCsv(header + '\n' + values), 1);
    T.assertEqual(Store.documents().length, 1);
    T.assertEqual(Store.documents()[0].folio, 60);
  });

  T.test('Store analiza CSV con comillas y delimitadores', function () {
    T.resetStore();
    const rows = Store.parseCsv('a;"b;c";d\n1;2;3', ';');
    T.assertDeepEqual(rows[0], ['a', 'b;c', 'd']);
    T.assertDeepEqual(rows[1], ['1', '2', '3']);
  });

  T.test('Store exporta e importa un respaldo SQLite', function () {
    T.resetStore();
    const created = Store.createDocument(sampleDocument(40, 1190));
    const bytes = Store.exportSqlite();
    T.assert(bytes instanceof Uint8Array, 'El respaldo debe ser un Uint8Array');
    T.assertEqual(String.fromCharCode.apply(null, bytes.subarray(0, 15)), 'SQLite format 3');
    T.resetStore();
    T.assertEqual(Store.documents().length, 0);
    Store.importSqlite(bytes);
    T.assertEqual(Store.documents().length, 1);
    T.assertEqual(Store.document(created.id).folio, 40);
  });

  T.test('Store exporta e importa un respaldo JSON', function () {
    T.resetStore();
    Store.setWorkingYear(year + 1);
    const backup = Store.exportJson();
    Store.setWorkingYear(year);
    Store.importJson(backup);
    T.assertEqual(Store.workingYear(), year + 1);
    T.assertThrows(function () { Store.importJson('{'); });
  });

  function purchaseRow(overrides) {
    const cells = [
      '1', '33', 'Del Giro', '55555555-5', 'Proveedor de Ejemplo', '4720170',
      '29/10/' + year, '03/11/' + year + ' 09:41:06', '', '0', '4706', '894', '', '',
      '5600', '', '', '', '0', '', '', '', '', '0', '', '', ''
    ];
    Object.keys(overrides || {}).forEach(function (index) { cells[Number(index)] = overrides[index]; });
    return cells.join(',');
  }

  T.test('Store usa el libro indicado para el CSV de compras y lo guarda en SQLite', function () {
    T.resetStore();
    resetWithStart(1, year - 1);
    const payload = Store.parsePurchases(Store.PURCHASE_HEADERS.join(',') + '\n' + purchaseRow({}));
    payload.month_register = 2;
    payload.year_register = year - 1;
    payload.type_vc = 'C';
    T.assertEqual(payload.headers.length, 27);
    T.assertEqual(payload.rows.length, 1);
    T.assertEqual(payload.rows[0].derived.month_register, 11);
    T.assertEqual(payload.rows[0].derived.year_register, year);
    const validation = Store.validatePurchases(payload);
    T.assertEqual(validation.ok, true, JSON.stringify(validation.rowIssues[0].cells));
    const data = Store.mapPurchaseRow(payload, payload.rows[0]);
    T.assertEqual(data.month_register, 2);
    T.assertEqual(data.year_register, year - 1);
    T.assertEqual(data.type_vc, 'C');
    T.assertEqual(data.rut, '55555555-5');
    T.assertEqual(data.date, year + '-10-29');
    T.assertEqual(data.date_centralize, year + '-11-03');
    T.assertEqual(data.document_type_name, 'Factura Electrónica');

    const invalid = Object.assign({}, payload, { month_register: 13 });
    const invalidValidation = Store.validatePurchases(invalid);
    T.assertEqual(invalidValidation.ok, false);
    T.assert(invalidValidation.periodErrors.length > 0);
    T.assertThrows(function () { Store.importPurchases(invalid); });

    T.assertEqual(Store.importPurchases(payload), 1);
    T.assertEqual(Store.documents().length, 1);
    T.assertEqual(Store.documents()[0].folio, 4720170);
    T.assertEqual(Store.documents()[0].month_register, 2);
    T.assertEqual(Store.documents()[0].year_register, year - 1);
    T.assertEqual(Store.queryDocuments('C', 2, year - 1).length, 1);
  });

  T.test('Store marca datos faltantes y descuadres del CSV de compras', function () {
    T.resetStore();
    const header = Store.PURCHASE_HEADERS.join(',');
    const missingRut = Store.parsePurchases(header + '\n' + purchaseRow({ 3: '' }));
    const missingValidation = Store.validatePurchases(missingRut);
    T.assertEqual(missingValidation.ok, false);
    T.assert(missingValidation.rowIssues[0].cells.c3 && missingValidation.rowIssues[0].cells.c3.length > 0,
      'La celda del RUT debe quedar marcada');
    T.assertThrows(function () { Store.importPurchases(missingRut); });

    const unbalanced = Store.parsePurchases(header + '\n' + purchaseRow({ 14: '5601' }));
    const unbalancedValidation = Store.validatePurchases(unbalanced);
    T.assertEqual(unbalancedValidation.ok, false);
    T.assert(String(unbalancedValidation.rowIssues[0].cells.c14).indexOf('no cuadra') !== -1,
      'El total debe marcar el descuadre');
  });

  T.test('Store rechaza columnas obligatorias ausentes en el CSV de compras', function () {
    T.resetStore();
    const error = T.assertThrows(function () { Store.parsePurchases('Nro,Monto Total\n1,5600'); });
    T.assertIncludes(error.message, 'Faltan columnas obligatorias');
  });
})();
