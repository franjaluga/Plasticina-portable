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

  bootstrap();
})();
