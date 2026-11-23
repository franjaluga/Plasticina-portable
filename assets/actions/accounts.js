(function () {
  'use strict';

  const helpers = window.Plasticina.actions.helpers;
  const { afterSuccess, integer, run } = helpers;

  window.Actions = window.Actions || {};

  window.Actions['accounts.store'] = function (form) {
    run(form, function (values) {
      Store.createAccount(values);
      afterSuccess('Cuenta contable creada exitosamente para esta empresa.');
    });
  };

  window.Actions['accounts.update'] = function (form) {
    run(form, function (values) {
      Store.updateAccount(integer(values.account_id), values);
      afterSuccess('Cuenta contable actualizada correctamente.');
    });
  };

  window.Actions['accounts.destroy'] = function (form) {
    run(form, function (values) {
      Store.deleteAccount(integer(values.account_id));
      afterSuccess('Cuenta contable eliminada exitosamente.');
    });
  };

})();
