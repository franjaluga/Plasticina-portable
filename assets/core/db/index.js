(function () {
  'use strict';

  const db = window.Plasticina.db;

  db.ready = db.internals.initialize();
  db.isReady = function () { return Boolean(db.internals.SQL); };
})();
