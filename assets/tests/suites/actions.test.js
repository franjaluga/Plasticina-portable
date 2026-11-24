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
    'documents.batch', 'manualJournal.store', 'manualJournal.update', 'journals.update',
    'journals.delete-only', 'journals.delete-with-document', 'payments.store', 'templates.store',
    'templates.update', 'templates.destroy', 'system.export', 'system.import',
    'system.sqlite-export', 'system.sqlite-import'
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
  });

  T.test('period.update cambia el año de trabajo', function () {
    T.resetStore();
    const target = new Date().getFullYear() + 1;
    window.Actions['period.update'](form({ working_year: target }, 'period.update'));
    T.assertEqual(Store.workingYear(), target);
    T.resetStore();
  });

  T.test('accounts.store agrega una cuenta al owner activo', function () {
    T.resetStore();
    const before = Store.accounts().length;
    window.Actions['accounts.store'](form({
      owner_id: 1, code: '9999999', name: 'Cuenta de prueba', category: 'activo'
    }, 'accounts.store'));
    T.assertEqual(Store.accounts().length, before + 1);
    T.assertEqual(Store.accountByCode(1, '9999999').name, 'Cuenta de prueba');
    T.resetStore();
  });

  T.test('manualJournal.store guarda el asiento y abre la confirmación propia', function () {
    T.resetStore();
    sessionStorage.removeItem('plasticina_flash');
    const year = Store.workingYear();
    const before = Store.journals({ year: year }).length;
    window.location.hash = UI.route('accounting.manual_journals.create');
    window.Actions['manualJournal.store'](form({
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
    T.assertEqual(window.location.hash, UI.route('accounting.manual_journals.created'));
    T.assert(window.location.hash.indexOf('accounting/reports') === -1,
      'La confirmación no debe llevar a reportes contables');
    window.location.hash = '#/';
    T.resetStore();
  });

  T.test('Una acción inexistente no se ejecuta silenciosamente', function () {
    T.assertEqual(typeof window.Actions['no.existe'], 'undefined');
  });
})();
