(function () {
  'use strict';

  const helpers = window.Plasticina.actions.helpers;
  const { afterSuccess, integer, run } = helpers;

  window.Actions = window.Actions || {};

  window.Actions['owners.store'] = function (form) {
    run(form, function (values) {
      if (!values.rut || !values.name || !values.account_plan_type) throw new Error('Complete todos los campos obligatorios.');
      if (Store.owners().some(function (owner) { return owner.rut === values.rut; })) throw new Error('Ya existe una empresa con ese RUT.');
      const plan = Store.accountPlan(values.account_plan_type);
      const ownerId = Store.nextId('owners');
      Store.state.owners.push({
        id: ownerId,
        rut: values.rut,
        name: values.name,
        account_plan_type: values.account_plan_type,
        is_active: false
      });
      plan.forEach(function (account) {
        Store.state.accounts.push({
          id: Store.nextId('accounts'),
          owner_id: ownerId,
          code: account.code,
          name: account.name,
          category: account.category
        });
      });
      Store.save();
      afterSuccess('Owner y su plan de cuentas inicial creado exitosamente.', 'owners.index');
    });
  };

  window.Actions['owners.update'] = function (form) {
    run(form, function (values) {
      const owner = Store.owner(integer(values.owner_id));
      if (!owner) throw new Error('Empresa no encontrada.');
      if (Store.owners().some(function (item) { return item.rut === values.rut && item.id !== owner.id; })) throw new Error('Ya existe una empresa con ese RUT.');
      owner.rut = values.rut;
      owner.name = values.name;
      Store.save();
      afterSuccess('Owner actualizado exitosamente.', 'owners.index');
    });
  };

  window.Actions['owners.activate'] = function (form) {
    run(form, function (values) {
      const id = integer(values.owner_id);
      Store.state.owners.forEach(function (owner) { owner.is_active = owner.id === id; });
      Store.state.settings.activeOwnerId = id;
      Store.save();
      afterSuccess('Owner activado correctamente.', 'owners.index');
    });
  };

  window.Actions['owners.destroy'] = function (form) {
    run(form, function (values) {
      const id = integer(values.owner_id);
      if (!Store.owner(id)) throw new Error('Empresa no encontrada.');
      if (Store.state.journals.some(function (journal) { return journal.owner_id === id; })) throw new Error('No se puede eliminar la empresa porque tiene asientos contables registrados.');
      Store.state.accounts = Store.state.accounts.filter(function (account) { return account.owner_id !== id; });
      Store.state.owners = Store.state.owners.filter(function (owner) { return owner.id !== id; });
      if (Store.state.settings.activeOwnerId === id) {
        const next = Store.owners()[0];
        Store.state.settings.activeOwnerId = next ? next.id : null;
        if (next) next.is_active = true;
      }
      Store.save();
      afterSuccess('Empresa eliminada correctamente.', 'owners.index');
    });
  };

})();
