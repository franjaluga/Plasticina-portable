(function () {
  'use strict';

  const helpers = window.Plasticina.actions.helpers;
  const { afterSuccess, integer, number, run } = helpers;

  window.Actions = window.Actions || {};

  window.Actions['payments.store'] = function (form) {
    run(form, async function (values) {
      await Store.processPayment(integer(values.document_id), number(values.amount), values.date, values.bank_account_code);
      afterSuccess('Pago/Cobro procesado y registrado contablemente con éxito.', 'accounting.payments.index');
    });
  };

})();
