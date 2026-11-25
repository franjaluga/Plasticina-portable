(function () {
  'use strict';

  const helpers = window.Plasticina.actions.helpers;
  const { afterSuccess, integer, run } = helpers;

  window.Actions = window.Actions || {};

  window.Actions['period.update'] = function (form) {
    run(form, async function (values) {
      const year = integer(values.working_year);
      const range = Store.workingYearRange();
      if (year < 2000) throw new Error('El año de trabajo debe ser mayor o igual a 2000.');
      if (year < range.min || year > range.max) {
        throw new Error('El año de trabajo debe estar entre ' + range.min + ' y ' + range.max + '.');
      }
      await Store.setWorkingYear(year);
      afterSuccess('Año de trabajo actualizado.', 'welcome');
    });
  };

})();
