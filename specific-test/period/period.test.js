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
    T.assertIncludes(html, 'aria-selected="true" data-value="' + Store.workingYear() + '"');
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

  T.test('Cambiar ejercicio contable: el selector parte del año de inicio y termina en el año actual + 1', function () {
    T.resetStore();
    const range = Store.workingYearRange();
    T.assertDeepEqual(range, { min: Store.activeOwner().start_year, max: Store.maxWorkingYear() });

    const html = window.Views.welcome(ctx);
    const select = html.split('id="workingYearSelect"')[1].split('</ul>')[0];
    T.assertIncludes(select, 'data-value="' + range.min + '"');
    T.assertIncludes(select, 'data-value="' + range.max + '"');
    T.assert(select.indexOf('data-value="' + (range.max + 1) + '"') === -1,
      'El selector no debe superar el año actual + 1');
    if (range.min > 2020) {
      T.assert(select.indexOf('data-value="2020"') === -1, 'El selector no debe usar el mínimo fijo 2020');
    }
    T.assertIncludes(html, 'Empresa Activa');
    T.resetStore();
  });

  T.test('Cambiar ejercicio contable: rechaza años fuera del rango de la empresa', async function () {
    T.resetStore();
    const range = Store.workingYearRange();
    const previous = Store.workingYear();
    const previousApp = window.App;
    let flash = '';
    window.App = { render: function () {}, navigate: function () {} };
    try {
      await window.Actions['period.update'](form({ owner_id: 1, working_year: range.max + 1 }, 'period.update'));
      flash = UI.takeFlash();
      T.assertEqual(Store.workingYear(), previous);
      T.assertIncludes(flash, 'El año de trabajo debe estar entre ' + range.min + ' y ' + range.max + '.');

      if (range.min > 2000) {
        await window.Actions['period.update'](form({ owner_id: 1, working_year: range.min - 1 }, 'period.update'));
        flash = UI.takeFlash();
        T.assertEqual(Store.workingYear(), previous);
        T.assertIncludes(flash, 'El año de trabajo debe estar entre ' + range.min + ' y ' + range.max + '.');
      }
    } finally {
      window.App = previousApp;
      T.resetStore();
    }
  });

  T.test('Cambiar ejercicio contable: al activar otra empresa se recalcula y guarda el año', function () {
    T.resetStore();
    const initial = Store.workingYear();
    const futureYear = Store.maxWorkingYear();
    const owner = Store.createOwner({
      rut: '91234567-9',
      name: 'Empresa Ejercicio Futuro',
      account_plan_type: 'standard_pyme',
      start_month: 1,
      start_year: futureYear
    });
    T.assert(initial !== futureYear, 'La prueba necesita un año de trabajo distinto al nuevo inicio');
    T.assertDeepEqual(Store.workingYearRange(), { min: futureYear, max: futureYear });

    Store.setActiveOwner(owner.id);
    T.assertEqual(Store.workingYear(), futureYear);
    T.assertEqual(window.Plasticina.db.repositories.settings.get('working_year'), String(futureYear));

    const select = window.Views.welcome(ctx).split('id="workingYearSelect"')[1].split('</ul>')[0];
    T.assertIncludes(select, 'aria-selected="true" data-value="' + futureYear + '"');
    T.assert(select.indexOf('data-value="' + (futureYear - 1) + '"') === -1,
      'El año anterior al inicio de la empresa no debe estar disponible');
    T.resetStore();
  });
})();
