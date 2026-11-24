(function () {
  'use strict';

  const helpers = window.Plasticina.actions.helpers;
  const { afterSuccess, grouped, integer, number, run } = helpers;

  window.Actions = window.Actions || {};

  window.Actions['manualJournal.store'] = function (form) {
    run(form, function (values) {
      const entries = grouped(form, 'entries').map(function (entry) {
        return {
          account_code: entry.account_code,
          debit: number(entry.debit),
          credit: number(entry.credit)
        };
      });
      Store.registerManualJournal(integer(values.year), integer(values.month), values.date, values.glosa, entries);
      afterSuccess('Asiento contable manual creado exitosamente.', 'accounting.manual_journals.created');
    });
  };

  window.Actions['manualJournal.update'] = function (form) {
    run(form, function (values) {
      const entries = grouped(form, 'entries').map(function (entry) {
        return {
          account_code: entry.account_code,
          component_name: entry.component_name || 'manual',
          debit: number(entry.debit),
          credit: number(entry.credit)
        };
      });
      Store.updateManualJournal(integer(values.id), integer(values.year), integer(values.month), values.date, values.description, entries);
      afterSuccess('Asiento manual actualizado exitosamente.', 'accounting.system_journals');
    });
  };

  window.Actions['journals.update'] = function (form) {
    run(form, function (values) {
      const entries = grouped(form, 'entries').map(function (entry) {
        return {
          account_code: entry.account_code,
          component_name: entry.component_name || 'custom',
          debit: number(entry.debit),
          credit: number(entry.credit)
        };
      });
      Store.updateJournal(integer(values.id), values.date, values.description, entries);
      afterSuccess('Asiento contable actualizado exitosamente.', 'accounting.system_journals');
    });
  };

  window.Actions['journals.delete-only'] = function (form) {
    run(form, function (values) {
      Store.deleteJournal(integer(values.journal || values.id), false);
      afterSuccess('Asiento contable eliminado. El documento asociado quedó pendiente de contabilizar.', 'accounting.system_journals');
    });
  };

  window.Actions['journals.delete-with-document'] = function (form) {
    run(form, function (values) {
      Store.deleteJournal(integer(values.journal || values.id), true);
      afterSuccess('El documento y su asiento contable han sido eliminados definitivamente.', 'accounting.system_journals');
    });
  };

})();
