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

  T.test('Store analiza CSV con comillas y delimitadores', function () {
    T.resetStore();
    const rows = Store.parseCsv('a;"b;c";d\n1;2;3', ';');
    T.assertDeepEqual(rows[0], ['a', 'b;c', 'd']);
    T.assertDeepEqual(rows[1], ['1', '2', '3']);
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
