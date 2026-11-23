(function () {
  'use strict';

  const helpers = window.Plasticina.actions.helpers;
  const { afterSuccess, integer, run } = helpers;

  window.Actions = window.Actions || {};

  window.Actions['accounts.store'] = function (form) {
    run(form, function (values) {
      const ownerId = integer(values.owner_id);
      if (!ownerId) throw new Error('Seleccione una empresa.');
      if (!values.code || !values.name) throw new Error('Complete código y nombre de la cuenta.');
      if (Store.accounts(ownerId).some(function (account) { return account.code === values.code; })) throw new Error('Ya existe esa cuenta para esta empresa.');
      Store.state.accounts.push({
        id: Store.nextId('accounts'),
        owner_id: ownerId,
        code: values.code,
        name: values.name,
        category: values.category || 'activo'
      });
      Store.save();
      afterSuccess('Cuenta contable creada exitosamente para esta empresa.');
    });
  };

  window.Actions['accounts.update'] = function (form) {
    run(form, function (values) {
      const account = Store.account(integer(values.account_id));
      if (!account) throw new Error('Cuenta no encontrada.');
      if (Store.accounts(account.owner_id).some(function (item) { return item.code === values.code && item.id !== account.id; })) throw new Error('Ya existe esa cuenta para esta empresa.');
      const used = Store.state.journalEntries.some(function (entry) {
        if (entry.account_code !== account.code) return false;
        const journal = Store.state.journals.find(function (item) { return item.id === entry.journal_id; });
        return journal && journal.owner_id === account.owner_id;
      });
      if (used && account.code !== values.code) throw new Error('El código de la cuenta tiene movimientos y no puede modificarse.');
      account.code = values.code;
      account.name = values.name;
      account.category = values.category || 'activo';
      Store.save();
      afterSuccess('Cuenta contable actualizada correctamente.');
    });
  };

  window.Actions['accounts.destroy'] = function (form) {
    run(form, function (values) {
      const account = Store.account(integer(values.account_id));
      if (!account) throw new Error('Cuenta no encontrada.');
      const used = Store.state.journalEntries.some(function (entry) {
        if (entry.account_code !== account.code) return false;
        const journal = Store.state.journals.find(function (item) { return item.id === entry.journal_id; });
        return journal && journal.owner_id === account.owner_id;
      });
      if (used) throw new Error('No se puede eliminar la cuenta "' + account.code + ' - ' + account.name + '" porque tiene movimientos registrados.');
      Store.state.accounts = Store.state.accounts.filter(function (item) { return item.id !== account.id; });
      Store.save();
      afterSuccess('Cuenta contable eliminada exitosamente.');
    });
  };

})();
