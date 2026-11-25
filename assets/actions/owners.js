(function () {
  'use strict';

  const helpers = window.Plasticina.actions.helpers;
  const { afterSuccess, integer, run } = helpers;

  window.Actions = window.Actions || {};

  window.Actions['owners.store'] = function (form) {
    run(form, async function (values) {
      await Store.createOwner(values);
      afterSuccess('Empresa y su plan de cuentas inicial creados exitosamente.', 'owners.index');
    });
  };

  window.Actions['owners.update'] = function (form) {
    run(form, async function (values) {
      await Store.updateOwner(integer(values.owner_id), values);
      afterSuccess('Empresa actualizada exitosamente.', 'owners.index');
    });
  };

  window.Actions['owners.activate'] = function (form) {
    run(form, async function (values) {
      await Store.setActiveOwner(integer(values.owner_id));
      afterSuccess('Empresa activada correctamente.', 'owners.index');
    });
  };

  window.Actions['owners.destroy'] = function (form) {
    run(form, async function (values) {
      await Store.deleteOwner(integer(values.owner_id));
      afterSuccess('Empresa eliminada correctamente.', 'owners.index');
    });
  };

})();
