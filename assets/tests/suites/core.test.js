(function () {
  'use strict';

  const T = window.PlasticinaTest;

  T.test('UI.h escapa HTML y valores nulos', function () {
    T.assertEqual(UI.h(null), '');
    T.assertEqual(UI.h('<b class="x">&\'</b>'), '&lt;b class=&quot;x&quot;&gt;&amp;&#039;&lt;/b&gt;');
  });

  T.test('UI.json serializa y neutraliza etiquetas', function () {
    T.assertEqual(UI.json(undefined), 'null');
    T.assertEqual(UI.json({ a: '<script>' }), '{"a":"\\u003cscript>"}');
  });

  T.test('UI.route sustituye parámetros y agrega query', function () {
    T.assertEqual(UI.route('owners.show', { owner: 7 }), '#/owners/7');
    T.assertEqual(UI.route('owners.accounts.index', { owner: { id: 3 }, tab: 'movimientos', empty: '' }),
      '#/owners/3/accounts?tab=movimientos');
  });

  T.test('UI.parseHash separa ruta y consulta', function () {
    T.assertDeepEqual(UI.parseHash('#/accounting/ledger?month=3&year=2026'), {
      path: '/accounting/ledger',
      query: { month: '3', year: '2026' }
    });
  });

  T.test('UI.number y UI.money formatean sin lanzar', function () {
    T.assertEqual(typeof UI.number(1234.5, 1), 'string');
    T.assertEqual(UI.money(0).charAt(0), '$');
    T.assertEqual(UI.monthName(1), 'enero');
  });

  T.test('UI.flash y UI.takeFlash entregan HTML once', function () {
    sessionStorage.removeItem('plasticina_flash');
    UI.flash('error', '<atención>');
    const html = UI.takeFlash();
    T.assertIncludes(html, 'bg-red-50');
    T.assertIncludes(html, '&lt;atención&gt;');
    T.assertEqual(UI.takeFlash(), '');
  });

  T.test('UI.remember y UI.old conservan valores', function () {
    UI.remember({ total: 100 });
    T.assertEqual(UI.old('total', 0), 100);
    T.assertEqual(UI.old('missing', 'fallback'), 'fallback');
  });
})();
