(function () {
  'use strict';

  const T = window.PlasticinaTest;
  const helpers = window.Plasticina.actions.helpers;

  function form(values, action) {
    const elements = Object.keys(values).map(function (name) {
      return { name: name, type: 'text', value: String(values[name]), checked: true };
    });
    return { elements: elements, dataset: { action: action }, getAttribute: function () { return null; } };
  }

  const EXPECTED_ACTIONS = [
    'period.update', 'owners.store', 'owners.update', 'owners.activate', 'owners.destroy',
    'accounts.store', 'accounts.update', 'accounts.destroy', 'documents.store', 'documents.csv',
    'imports.purchases_start', 'imports.purchases_upload', 'imports.purchases_confirm', 'imports.purchases_cancel',
    'documents.batch', 'manualJournal.store', 'manualJournal.update', 'journals.update',
    'journals.delete-only', 'journals.delete-with-document', 'payments.store', 'templates.store',
    'templates.update', 'templates.destroy', 'system.export', 'system.import',
    'system.sqlite-export', 'system.sqlite-import', 'system.reset'
  ];

  T.test('Todas las acciones esperadas están registradas', function () {
    EXPECTED_ACTIONS.forEach(function (name) {
      T.assertEqual(typeof window.Actions[name], 'function', 'Falta la acción ' + name);
    });
  });

  T.test('readForm y grouped interpretan controles repetidos', function () {
    const sample = {
      elements: [
        { name: 'rut', type: 'text', value: '1-1' },
        { name: 'flags[]', type: 'checkbox', value: 'a', checked: true },
        { name: 'flags[]', type: 'checkbox', value: 'b', checked: false },
        { name: 'option', type: 'radio', value: 'x', checked: false },
        { name: 'option', type: 'radio', value: 'y', checked: true },
        { name: 'entries[1][account_code]', type: 'text', value: '101' },
        { name: 'entries[1][debit]', type: 'text', value: '50' }
      ]
    };
    T.assertDeepEqual(helpers.readForm(sample), {
      rut: '1-1', 'flags[]': ['a'], option: 'y',
      'entries[1][account_code]': '101', 'entries[1][debit]': '50'
    });
    T.assertDeepEqual(helpers.grouped(sample, 'entries'), [{ _key: '1', account_code: '101', debit: '50' }]);

    const inserted = {
      elements: [
        { name: 'entries[row_10][account_code]', type: 'text', value: '101' },
        { name: 'entries[row_2][account_code]', type: 'text', value: '401' }
      ]
    };
    T.assertDeepEqual(helpers.grouped(inserted, 'entries').map(function (entry) { return entry._key; }),
      ['row_10', 'row_2']);
  });

  T.test('period.update cambia el año de trabajo', async function () {
    T.resetStore();
    const target = new Date().getFullYear() + 1;
    await window.Actions['period.update'](form({ working_year: target }, 'period.update'));
    T.assertEqual(Store.workingYear(), target);
    T.resetStore();
  });

  T.test('accounts.store agrega una cuenta al owner activo', async function () {
    T.resetStore();
    const before = Store.accounts().length;
    await window.Actions['accounts.store'](form({
      owner_id: 1, code: '9999999', name: 'Cuenta de prueba', category: 'activo'
    }, 'accounts.store'));
    T.assertEqual(Store.accounts().length, before + 1);
    T.assertEqual(Store.accountByCode(1, '9999999').name, 'Cuenta de prueba');
    T.resetStore();
  });

  T.test('manualJournal.store guarda el asiento y abre la confirmación propia', async function () {
    T.resetStore();
    sessionStorage.removeItem('plasticina_flash');
    const year = Store.workingYear();
    const before = Store.journals({ year: year }).length;
    window.location.hash = UI.route('accounting.manual_journals.create');
    await window.Actions['manualJournal.store'](form({
      year: year,
      month: 3,
      date: year + '-03-05',
      glosa: 'Asiento de prueba',
      'entries[0][account_code]': '1010101',
      'entries[0][debit]': 100,
      'entries[0][credit]': 0,
      'entries[1][account_code]': '4010101',
      'entries[1][debit]': 0,
      'entries[1][credit]': 100
    }, 'manualJournal.store'));
    T.assertEqual(Store.journals({ year: year }).length, before + 1);
    T.assertIncludes(UI.takeFlash(), 'Asiento contable manual creado exitosamente.');
    T.assert(window.location.hash.indexOf(UI.route('accounting.manual_journals.created') + '?journal_id=') === 0,
      'La confirmación debe incluir el id del asiento creado');
    T.assert(window.location.hash.indexOf('accounting/reports') === -1,
      'La confirmación no debe llevar a reportes contables');
    window.location.hash = '#/';
    T.resetStore();
  });

  T.test('Una acción inexistente no se ejecuta silenciosamente', function () {
    T.assertEqual(typeof window.Actions['no.existe'], 'undefined');
  });

  T.test('system.reset deja la base como en el primer uso', async function () {
    T.resetStore();
    const currentYear = new Date().getFullYear();
    const owner = Store.createOwner({
      rut: '77777777-7', name: 'Empresa a borrar', account_plan_type: 'standard_pyme',
      start_month: 1, start_year: currentYear
    });
    Store.setActiveOwner(owner.id);
    Store.createDocument({
      month_register: 3, year_register: currentYear, type_vc: 'V', rut: '11111111-1',
      entity_name: 'Cliente Prueba', doctype: 33, document_type_name: 'Factura Electrónica',
      folio: 999, date: currentYear + '-03-10', net: 1000, vat_rec: 190, total: 1190
    });
    Store.createTemplate({ name: 'Plantilla a borrar', description: 'demo' });
    T.assertEqual(Store.owners().length, 2);
    T.assertEqual(Store.documents().length, 1);

    sessionStorage.removeItem('plasticina_flash');
    window.location.hash = UI.route('system.config');
    const db = window.Plasticina.db;
    const originalTransaction = db.transaction;
    let transactionDepth = 0;
    let maxTransactionDepth = 0;
    db.transaction = function (callback) {
      transactionDepth += 1;
      maxTransactionDepth = Math.max(maxTransactionDepth, transactionDepth);
      return originalTransaction(function () {
        try {
          return callback();
        } finally {
          transactionDepth -= 1;
        }
      });
    };
    try {
      await window.Actions['system.reset']();
    } finally {
      db.transaction = originalTransaction;
    }
    T.assertEqual(maxTransactionDepth, 1, 'system.reset no debe anidar transacciones SQLite');

    T.assertEqual(Store.owners().length, 1);
    T.assertEqual(Store.owners()[0].id, 1);
    T.assertEqual(Store.owners()[0].rut, '55555555-5');
    T.assertEqual(Store.activeOwner().name, 'Test');
    T.assertEqual(Store.accounts().length, 161);
    T.assertEqual(Store.documents().length, 0);
    T.assertEqual(Store.journals().length, 0);
    T.assertEqual(Store.templates().length, 0);
    T.assertEqual(Store.workingYear(), currentYear);
    T.assertEqual(Store.state.settings.activeOwnerId, 1);
    T.assertIncludes(UI.takeFlash(), 'Base de datos reiniciada correctamente.');
    T.assertEqual(window.location.hash, UI.route('welcome'));
    window.location.hash = '#/';
    T.resetStore();
  });

  T.test('imports.purchases_upload exige un archivo CSV', function () {
    const elements = [
      { name: 'csv_file', type: 'file', files: [] },
      { name: 'month_register', type: 'hidden', value: String(Store.ownerStartPeriod().month) },
      { name: 'year_register', type: 'hidden', value: String(Store.workingYear()) }
    ];
    const app = window.App;
    sessionStorage.removeItem('plasticina_flash');
    window.App = { render: function () {} };
    try {
      window.Actions['imports.purchases_upload']({ elements: elements, dataset: {} });
      T.assertIncludes(UI.takeFlash(), 'Debe seleccionar un archivo CSV válido.');
    } finally {
      window.App = app;
    }
  });

  T.test('imports.purchases_start lleva el libro elegido al formulario de carga', function () {
    T.resetStore();
    const period = { month_register: Store.ownerStartPeriod().month, year_register: Store.workingYear() };
    window.location.hash = UI.route('ingress.import');
    window.Actions['imports.purchases_start'](form(Object.assign({}, period), 'imports.purchases_start'));
    T.assertEqual(window.location.hash, UI.route('ingress.import.purchases', period));
    window.location.hash = '#/';
  });

  T.test('imports.purchases_cancel conserva el libro al volver a la carga', function () {
    T.resetStore();
    const period = { month_register: Store.ownerStartPeriod().month, year_register: Store.workingYear() };
    window.location.hash = UI.route('ingress.import.purchases.preview');
    window.Actions['imports.purchases_cancel']({
      dataset: { monthRegister: String(period.month_register), yearRegister: String(period.year_register) }
    });
    T.assertEqual(window.location.hash, UI.route('ingress.import.purchases', period));
    window.location.hash = '#/';
  });

  T.test('imports.purchases_confirm guarda la grilla revisada como documentos de compra', function () {
    T.resetStore();
    sessionStorage.removeItem('plasticina_flash');
    const headers = Store.PURCHASE_HEADERS;
    const cells = {};
    headers.forEach(function (header, index) { cells['c' + index] = ''; });
    cells.c1 = '33';
    cells.c3 = '55555555-5';
    cells.c4 = 'Proveedor de Ejemplo';
    cells.c5 = '4720170';
    cells.c6 = '29/10/' + new Date().getFullYear();
    cells.c7 = '03/11/' + new Date().getFullYear() + ' 09:41:06';
    cells.c9 = '0';
    cells.c10 = '4706';
    cells.c11 = '894';
    cells.c14 = '5600';
    const start = Store.ownerStartPeriod();
    const periodMonth = start.month < 12 ? start.month + 1 : start.month;
    const periodYear = start.year;
    const elements = [
      { name: 'file_name', type: 'hidden', value: 'compra.csv' },
      { name: 'month_register', type: 'hidden', value: String(periodMonth) },
      { name: 'year_register', type: 'hidden', value: String(periodYear) },
      { name: 'type_vc', type: 'hidden', value: 'C' }
    ].concat(headers.map(function (header) {
      return { name: 'headers[]', type: 'hidden', value: header };
    })).concat(Object.keys(cells).map(function (key) {
      return { name: 'rows[0][' + key + ']', type: 'text', value: cells[key] };
    })).concat([
      { name: 'rows[0][document_type_name]', type: 'text', value: 'Factura Electrónica' }
    ]);
    window.Actions['imports.purchases_confirm']({ elements: elements, dataset: {} });
    T.assertEqual(Store.documents().length, 1);
    T.assertEqual(Store.documents()[0].folio, 4720170);
    T.assertEqual(Store.documents()[0].type_vc, 'C');
    T.assertEqual(Store.documents()[0].month_register, periodMonth);
    T.assertEqual(Store.documents()[0].year_register, periodYear);
    T.assertIncludes(UI.takeFlash(), 'Se ingresaron 1 documentos');
    T.assertEqual(window.location.hash, UI.route('vc_documents.pending'));
    window.location.hash = '#/';
    T.resetStore();
  });
})();
