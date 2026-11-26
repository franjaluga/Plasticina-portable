(function () {
  'use strict';

  const router = window.Plasticina.app.router;

  function showError(error) {
    const container = document.getElementById('app');
    if (!container) return;
    const detail = String(error && error.message ? error.message : error)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    container.innerHTML = '<div class="w-full p-8 text-sm text-red-700">No se pudo iniciar la aplicación: ' +
      detail + '</div>';
  }

  async function bootstrap() {
    try {
      await Store.load();
      if (!router) throw new Error('El router no está disponible.');
      if (!window.location.hash) {
        window.history.replaceState(null, '', '#/');
      }
      window.App = { render: router.render, navigate: router.navigate };
      router.render();
    } catch (error) {
      showError(error);
    }
  }

  if (window.Plasticina.db && window.Plasticina.db.ready) {
    window.Plasticina.db.ready.then(bootstrap, showError);
  } else {
    showError(new Error('La base de datos SQLite no está disponible.'));
  }
})();
