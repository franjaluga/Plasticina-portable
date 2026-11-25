(function () {
  'use strict';

  const helpers = window.Plasticina.actions.helpers;
  const { afterSuccess, integer, run } = helpers;

  window.Actions = window.Actions || {};

  window.Actions['period.update'] = function (form) {
    run(form, async function (values) {
      const year = integer(values.working_year);
      if (year < 2000) throw new Error('El año de trabajo debe ser mayor o igual a 2000.');
      await Store.setWorkingYear(year);
      afterSuccess('Año de trabajo actualizado.', 'welcome');
    });
  };

})();
