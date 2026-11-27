(function () {
  'use strict';

  const app = window.Plasticina.app;

  function resourcesFor(viewName) {
    const view = window.Views && window.Views[viewName];
    return view && Array.isArray(view.resources) ? view.resources.slice() : [];
  }

  function loading(viewName) {
    return '<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10" role="status" aria-live="polite">' +
      '<div class="mb-6"><h1 class="text-xl font-extrabold text-slate-800">Cargando datos…</h1>' +
      '<p class="text-xs text-slate-500 mt-1">Preparando la información de ' + UI.h(viewName || 'esta vista') + '.</p></div>' +
      '<div class="bg-white border border-slate-200 rounded-xl p-6">' +
      '<div class="h-4 bg-slate-100 rounded w-1/3 mb-5"></div>' +
      '<div class="h-24 bg-slate-100 rounded mb-3"></div>' +
      '<div class="h-24 bg-slate-100 rounded"></div></div></div>';
  }

  app.viewData = { resourcesFor: resourcesFor, loading: loading };
})();
