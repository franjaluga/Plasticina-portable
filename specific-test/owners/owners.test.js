(function () {
  'use strict';

  const T = window.PlasticinaTest;
  const ctx = { params: {}, query: {} };
  const rut = '91234567-8';
  const name = 'Empresa Test Owners';
  const plan = 'standard_pyme';
  const startMonth = new Date().getMonth() + 1;
  const startYear = new Date().getFullYear();

  function form(values, action) {
    const elements = Object.keys(values).map(function (field) {
      return { name: field, type: 'text', value: String(values[field]), checked: true };
    });
    return { elements: elements, dataset: { action: action }, getAttribute: function () { return null; } };
  }

  T.test('Owners: el botón Volver vuelve al inicio', function () {
    T.resetStore();
    const html = window.Views.ownersIndex(ctx);
    const home = UI.route('welcome');
    T.assertEqual(home, '#/');
    T.assertIncludes(html, 'href="' + home + '"');
    T.assertIncludes(html, '&larr; Volver');
    T.assertDeepEqual(window.Plasticina.app.router.matchRoute(UI.parseHash(home).path),
      { view: 'welcome', params: {} });
  });

  T.test('Owners: el botón Guardar crea owner con RUT, nombre y plan de cuentas', function () {
    T.resetStore();
    const html = window.Views.ownersIndex(ctx);
    const createForm = html.split('<form data-action="owners.store">')[1].split('</form>')[0];
    T.assertIncludes(createForm, 'name="rut"');
    T.assertIncludes(createForm, 'name="name"');
    T.assertIncludes(createForm, 'name="account_plan_type"');
    T.assertIncludes(createForm, 'name="start_month"');
    T.assertIncludes(createForm, 'name="start_year"');
    T.assertIncludes(createForm, 'type="submit"');
    T.assertIncludes(createForm, 'Guardar');

    const before = Store.owners().length;
    window.Actions['owners.store'](form({
      rut: rut, name: name, account_plan_type: plan, start_month: startMonth, start_year: startYear
    }, 'owners.store'));

    T.assertEqual(Store.owners().length, before + 1);
    const owner = Store.owners().find(function (item) { return item.rut === rut; });
    T.assert(owner, 'No se guardó el owner con el RUT ' + rut);
    T.assertEqual(owner.name, name);
    T.assertEqual(owner.account_plan_type, plan);
    T.assertEqual(owner.start_month, startMonth);
    T.assertEqual(owner.start_year, startYear);
    T.assertEqual(Store.accounts(owner.id).length, Store.accountPlan(plan).length);
    T.assertEqual(window.location.hash, UI.route('owners.index'));
    window.location.hash = '#/';
    T.resetStore();
  });

  T.test('Owners: la empresa base usa el mes y año actuales y fechas inválidas se rechazan', function () {
    T.resetStore();
    const base = Store.activeOwner();
    T.assertEqual(base.start_month, startMonth);
    T.assertEqual(base.start_year, startYear);
    T.assertThrows(function () {
      Store.createOwner({
        rut: rut, name: name, account_plan_type: plan, start_month: 13, start_year: startYear
      });
    }, /mes de inicio/);
    T.assertThrows(function () {
      Store.createOwner({
        rut: rut, name: name, account_plan_type: plan, start_month: startMonth, start_year: 1999
      });
    }, /año de inicio/);
    T.resetStore();
  });
})();
