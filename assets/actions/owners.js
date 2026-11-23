(function () {
  'use strict';

  const helpers = window.Plasticina.actions.helpers;
  const { afterSuccess, integer, run } = helpers;

  window.Actions = window.Actions || {};

  window.Actions['owners.store'] = function (form) {
    run(form, function (values) {
      Store.createOwner(values);
      afterSuccess('Owner y su plan de cuentas inicial creado exitosamente.', 'owners.index');
    });
  };

  window.Actions['owners.update'] = function (form) {
    run(form, function (values) {
      Store.updateOwner(integer(values.owner_id), values);
      afterSuccess('Owner actualizado exitosamente.', 'owners.index');
    });
  };

  window.Actions['owners.activate'] = function (form) {
    run(form, function (values) {
      Store.setActiveOwner(integer(values.owner_id));
      afterSuccess('Owner activado correctamente.', 'owners.index');
    });
  };

  window.Actions['owners.destroy'] = function (form) {
    run(form, function (values) {
      Store.deleteOwner(integer(values.owner_id));
      afterSuccess('Empresa eliminada correctamente.', 'owners.index');
    });
  };

})();
