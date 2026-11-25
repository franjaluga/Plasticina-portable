(function () {
  'use strict';

  const helpers = window.Plasticina.actions.helpers;
  const { afterSuccess, grouped, integer, run } = helpers;

  window.Actions = window.Actions || {};

  window.Actions['templates.store'] = function (form) {
    run(form, async function (values) {
      await Store.createTemplate(values);
      afterSuccess('Plan de cuentas creado y clonado exitosamente desde la base.', 'masters.account_templates.index');
    });
  };

  window.Actions['templates.update'] = function (form) {
    run(form, async function (values) {
      await Store.updateTemplate(integer(values.account_template_id), values, grouped(form, 'items'));
      afterSuccess('Plan de cuentas actualizado correctamente.', 'masters.account_templates.index');
    });
  };

  window.Actions['templates.destroy'] = function (form) {
    run(form, async function (values) {
      await Store.deleteTemplate(integer(values.account_template_id));
      afterSuccess('Plan maestro eliminado exitosamente.', 'masters.account_templates.index');
    });
  };

})();
