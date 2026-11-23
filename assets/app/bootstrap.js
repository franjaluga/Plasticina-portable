(function () {
  'use strict';

  const router = window.Plasticina.app.router;

  function bootstrap() {
    Store.load();
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#/');
    }
    window.App = { render: router.render, navigate: router.navigate };
    router.render();
  }

  window.Plasticina.db.ready.then(bootstrap, function (error) {
    const container = document.getElementById('app');
    if (container) {
      container.innerHTML = '<div class="w-full p-8 text-sm text-red-700">No se pudo abrir la base de datos SQLite: ' +
        String(error && error.message ? error.message : error) + '</div>';
    }
  });
})();
