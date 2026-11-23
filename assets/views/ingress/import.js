(function () {
  'use strict';

  window.Views = window.Views || {};

  const { renderUpload } = window.Plasticina.views.helpers;

  window.Views.ingressImport = function (ctx) {
    return `${renderUpload(ctx)}`;
  };

  window.Views.documentUpload = function (ctx) {
    return `${renderUpload(ctx)}`;
  };
})();
