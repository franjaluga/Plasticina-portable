(function () {
  'use strict';

  const T = window.PlasticinaTest;
  const year = new Date().getFullYear();

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
    T.resetStore();
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
    const owner = Store.createOwner({ rut: '99999999-9', name: 'Otra Empresa', account_plan_type: 'standard_pyme' });
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
    T.resetStore();
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

  T.test('Store.taxBalance filtra desde inicio de año hasta el mes indicado', function () {
    T.resetStore();
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
    Store.setWorkingYear(year - 1);
    const backup = Store.exportJson();
    Store.setWorkingYear(year);
    Store.importJson(backup);
    T.assertEqual(Store.workingYear(), year - 1);
    T.assertThrows(function () { Store.importJson('{'); });
  });
})();
