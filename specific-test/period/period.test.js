(function () {
  'use strict';

  const T = window.PlasticinaTest;
  const ctx = { params: {}, query: {} };

  function form(values, action) {
    const elements = Object.keys(values).map(function (field) {
      return { name: field, type: 'text', value: String(values[field]), checked: true };
    });
    return { elements: elements, dataset: { action: action }, getAttribute: function () { return null; } };
  }

  T.test('Cambiar ejercicio contable: la card de Año de Trabajo expone el formulario', function () {
    T.resetStore();
    const html = window.Views.welcome(ctx);
    T.assertIncludes(html, 'Año de Trabajo');
    T.assertIncludes(html, 'Cambiar ejercicio contable');
    T.assertIncludes(html, 'id="editYearBtn"');
    T.assertIncludes(html, '<form data-action="period.update"');
    T.assertIncludes(html, 'name="owner_id"');
    T.assertIncludes(html, 'name="working_year"');
    T.assertIncludes(html, 'id="workingYearSelect"');
    T.assertIncludes(html, 'disabled');
    T.assertIncludes(html, 'id="saveYearBtn"');
    T.assertIncludes(html, 'Guardar');
    T.assertIncludes(html, 'value="' + Store.workingYear() + '" selected');
  });

  T.test('Cambiar ejercicio contable: period.update guarda el año en SQLite', function () {
    T.resetStore();
    const target = Store.workingYear() + 1;
    window.Actions['period.update'](form({ owner_id: 1, working_year: target }, 'period.update'));
    T.assertEqual(Store.workingYear(), target);
    T.assertEqual(window.Plasticina.db.repositories.settings.get('working_year'), String(target));
    T.assertEqual(window.location.hash, UI.route('welcome'));
    T.resetStore();
  });

  T.test('Cambiar ejercicio contable: rechaza años menores a 2000', function () {
    T.resetStore();
    const previous = Store.workingYear();
    const previousApp = window.App;
    let flash = '';
    let oldValues = {};
    window.App = { render: function () {}, navigate: function () {} };
    try {
      window.Actions['period.update'](form({ owner_id: 1, working_year: 1999 }, 'period.update'));
      flash = UI.takeFlash();
      oldValues = UI.old();
    } finally {
      window.App = previousApp;
    }
    T.assertEqual(Store.workingYear(), previous);
    T.assertIncludes(flash, 'El año de trabajo debe ser mayor o igual a 2000.');
    T.assertEqual(String(oldValues.working_year), '1999');
    T.resetStore();
  });
})();
